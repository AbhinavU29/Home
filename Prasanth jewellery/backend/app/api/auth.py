from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import jwt, JWTError
from app.core.database import get_db
from app.core.config import settings
from app.core.security import verify_password, get_password_hash, create_access_token
from app.models.models import User, AuditLog
from app.schemas.schemas import UserCreate, UserResponse, UserLogin, Token, UserUpdate, PasswordReset
from typing import List
import re
import json
from datetime import datetime, timedelta

def validate_password_strength(password: str):
    if len(password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters long.")
    if not re.search(r"[A-Z]", password):
        raise HTTPException(status_code=400, detail="Password must contain at least one uppercase letter.")
    if not re.search(r"[a-z]", password):
        raise HTTPException(status_code=400, detail="Password must contain at least one lowercase letter.")
    if not re.search(r"\d", password):
        raise HTTPException(status_code=400, detail="Password must contain at least one number.")
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        raise HTTPException(status_code=400, detail="Password must contain at least one special character.")

router = APIRouter(prefix="/auth", tags=["authentication"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login-form")

# Dependency to fetch the current authenticated user
def get_current_user(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise credentials_exception
    return user

# Helper to verify role access
class RoleChecker:
    def __init__(self, allowed_roles: list):
        self.allowed_roles = allowed_roles

    def __call__(self, current_user: User = Depends(get_current_user)):
        if current_user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Action forbidden for role '{current_user.role}'. Allowed: {self.allowed_roles}"
            )
        return current_user

@router.post("/login", response_model=Token)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == login_data.username).first()
    
    if not user:
        # Log failed login attempt for non-existent user using first user as fallback
        first_user = db.query(User).order_by(User.user_id.asc()).first()
        sys_user_id = first_user.user_id if first_user else 1
        
        audit_log = AuditLog(
            action="LOGIN_FAILED",
            table_name="users",
            record_id=0,
            old_values=None,
            new_values=json.dumps({"attempted_username": login_data.username, "reason": "User not found"}),
            user_id=sys_user_id
        )
        db.add(audit_log)
        db.commit()
        raise HTTPException(status_code=400, detail="Incorrect username or password")
        
    # Check lock status
    if user.locked_until and user.locked_until > datetime.utcnow():
        time_left = user.locked_until - datetime.utcnow()
        minutes_left = int(time_left.total_seconds() / 60) + 1
        raise HTTPException(
            status_code=400, 
            detail=f"Account is locked due to too many failed attempts. Try again after {minutes_left} minutes."
        )
        
    # Check if disabled
    if hasattr(user, "is_active") and user.is_active == 0:
        raise HTTPException(status_code=400, detail="Account is disabled. Contact Admin.")
        
    if not verify_password(login_data.password, user.password):
        # Increment failed login attempts
        attempts = (user.failed_login_attempts or 0) + 1
        user.failed_login_attempts = attempts
        
        reason = "Incorrect password"
        if attempts >= 5:
            user.locked_until = datetime.utcnow() + timedelta(minutes=15)
            user.failed_login_attempts = 0
            reason = "Account locked (5 failed attempts)"
            
            # Log account lock
            audit_lock = AuditLog(
                action="ACCOUNT_LOCKED",
                table_name="users",
                record_id=user.user_id,
                old_values=None,
                new_values=json.dumps({"username": user.username, "reason": "5 failed login attempts"}),
                user_id=user.user_id
            )
            db.add(audit_lock)
            
        audit_log = AuditLog(
            action="LOGIN_FAILED",
            table_name="users",
            record_id=user.user_id,
            old_values=None,
            new_values=json.dumps({"username": user.username, "reason": reason}),
            user_id=user.user_id
        )
        db.add(audit_log)
        db.commit()
        raise HTTPException(status_code=400, detail="Incorrect username or password")
        
    # Successful login
    user.failed_login_attempts = 0
    user.locked_until = None
    
    audit_log = AuditLog(
        action="LOGIN_SUCCESS",
        table_name="users",
        record_id=user.user_id,
        old_values=None,
        new_values=json.dumps({"username": user.username}),
        user_id=user.user_id
    )
    db.add(audit_log)
    db.commit()
    
    access_token = create_access_token(subject=user.username)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
        "username": user.username
      }

# OAuth2 request form login helper
from fastapi.security import OAuth2PasswordRequestForm
@router.post("/login-form", response_model=Token)
def login_form(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form_data.username).first()
    
    if not user:
        first_user = db.query(User).order_by(User.user_id.asc()).first()
        sys_user_id = first_user.user_id if first_user else 1
        
        audit_log = AuditLog(
            action="LOGIN_FAILED",
            table_name="users",
            record_id=0,
            old_values=None,
            new_values=json.dumps({"attempted_username": form_data.username, "reason": "User not found"}),
            user_id=sys_user_id
        )
        db.add(audit_log)
        db.commit()
        raise HTTPException(status_code=400, detail="Incorrect username or password")
        
    if user.locked_until and user.locked_until > datetime.utcnow():
        time_left = user.locked_until - datetime.utcnow()
        minutes_left = int(time_left.total_seconds() / 60) + 1
        raise HTTPException(
            status_code=400, 
            detail=f"Account is locked due to too many failed attempts. Try again after {minutes_left} minutes."
        )
        
    if hasattr(user, "is_active") and user.is_active == 0:
        raise HTTPException(status_code=400, detail="Account is disabled. Contact Admin.")
        
    if not verify_password(form_data.password, user.password):
        attempts = (user.failed_login_attempts or 0) + 1
        user.failed_login_attempts = attempts
        
        reason = "Incorrect password"
        if attempts >= 5:
            user.locked_until = datetime.utcnow() + timedelta(minutes=15)
            user.failed_login_attempts = 0
            reason = "Account locked (5 failed attempts)"
            
            audit_lock = AuditLog(
                action="ACCOUNT_LOCKED",
                table_name="users",
                record_id=user.user_id,
                old_values=None,
                new_values=json.dumps({"username": user.username, "reason": "5 failed login attempts"}),
                user_id=user.user_id
            )
            db.add(audit_lock)
            
        audit_log = AuditLog(
            action="LOGIN_FAILED",
            table_name="users",
            record_id=user.user_id,
            old_values=None,
            new_values=json.dumps({"username": user.username, "reason": reason}),
            user_id=user.user_id
        )
        db.add(audit_log)
        db.commit()
        raise HTTPException(status_code=400, detail="Incorrect username or password")
        
    user.failed_login_attempts = 0
    user.locked_until = None
    
    audit_log = AuditLog(
        action="LOGIN_SUCCESS",
        table_name="users",
        record_id=user.user_id,
        old_values=None,
        new_values=json.dumps({"username": user.username}),
        user_id=user.user_id
    )
    db.add(audit_log)
    db.commit()
    
    access_token = create_access_token(subject=user.username)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
        "username": user.username
    }

@router.post("/register", response_model=UserResponse)
def register(user_in: UserCreate, db: Session = Depends(get_db), current_user: User = Depends(RoleChecker(["Admin"]))):
    # Only Admin can register new users
    existing_user = db.query(User).filter(User.username == user_in.username).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already registered")
        
    validate_password_strength(user_in.password)
    
    hashed_password = get_password_hash(user_in.password)
    new_user = User(
        username=user_in.username,
        password=hashed_password,
        role=user_in.role or "Operator",
        full_name=user_in.full_name,
        mobile_number=user_in.mobile_number,
        is_active=1
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Audit log
    audit_log = AuditLog(
        action="CREATE_USER",
        table_name="users",
        record_id=new_user.user_id,
        old_values=None,
        new_values=json.dumps({"username": new_user.username, "role": new_user.role}),
        user_id=current_user.user_id
    )
    db.add(audit_log)
    db.commit()
    
    return new_user

@router.get("/me", response_model=UserResponse)
def read_current_user_me(current_user: User = Depends(get_current_user)):
    return current_user

# --- ADMIN USER MANAGEMENT CRUD ---

@router.get("/users", response_model=List[UserResponse])
def list_users(db: Session = Depends(get_db), current_user: User = Depends(RoleChecker(["Admin"]))):
    return db.query(User).order_by(User.user_id.desc()).all()

@router.put("/users/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int, 
    user_update: UserUpdate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(RoleChecker(["Admin"]))
):
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Prevent lockout safety checks
    if user.user_id == current_user.user_id:
        if user_update.is_active == 0:
            raise HTTPException(status_code=400, detail="Admin cannot disable their own account")
        if user_update.role and user_update.role != "Admin":
            raise HTTPException(status_code=400, detail="Admin cannot demote their own account role")
            
    old_state = {
        "username": user.username,
        "role": user.role,
        "is_active": user.is_active,
        "full_name": user.full_name,
        "mobile_number": user.mobile_number
    }
    
    if user_update.username:
        exist = db.query(User).filter(User.username == user_update.username, User.user_id != user_id).first()
        if exist:
            raise HTTPException(status_code=400, detail="Username already in use")
        user.username = user_update.username
        
    if user_update.role:
        user.role = user_update.role
        
    if user_update.is_active is not None:
        user.is_active = user_update.is_active
        
    if user_update.full_name is not None:
        user.full_name = user_update.full_name
        
    if user_update.mobile_number is not None:
        user.mobile_number = user_update.mobile_number
        
    db.commit()
    db.refresh(user)
    
    new_state = {
        "username": user.username,
        "role": user.role,
        "is_active": user.is_active,
        "full_name": user.full_name,
        "mobile_number": user.mobile_number
    }
    
    audit_log = AuditLog(
        action="UPDATE_USER",
        table_name="users",
        record_id=user.user_id,
        old_values=json.dumps(old_state),
        new_values=json.dumps(new_state),
        user_id=current_user.user_id
    )
    db.add(audit_log)
    db.commit()
    
    return user

@router.delete("/users/{user_id}")
def delete_user(
    user_id: int, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(RoleChecker(["Admin"]))
):
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if user.user_id == current_user.user_id:
        raise HTTPException(status_code=400, detail="Admin cannot delete their own account")
        
    old_state = {"username": user.username, "role": user.role, "is_active": user.is_active}
    
    db.delete(user)
    
    audit_log = AuditLog(
        action="DELETE_USER",
        table_name="users",
        record_id=user_id,
        old_values=json.dumps(old_state),
        new_values=None,
        user_id=current_user.user_id
    )
    db.add(audit_log)
    db.commit()
    
    return {"message": "User account deleted successfully"}

@router.post("/users/{user_id}/reset-password")
def reset_password(
    user_id: int, 
    pwd_reset: PasswordReset, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(RoleChecker(["Admin"]))
):
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    validate_password_strength(pwd_reset.new_password)
    
    user.password = get_password_hash(pwd_reset.new_password)
    user.failed_login_attempts = 0
    user.locked_until = None
    
    audit_log = AuditLog(
        action="RESET_USER_PASSWORD",
        table_name="users",
        record_id=user.user_id,
        old_values=None,
        new_values=json.dumps({"username": user.username, "info": "Password reset by Admin"}),
        user_id=current_user.user_id
    )
    db.add(audit_log)
    db.commit()
    
    return {"message": f"Password reset successfully for user '{user.username}'"}
