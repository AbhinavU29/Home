from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
import json
from app.core.database import get_db
from app.api.auth import get_current_user, RoleChecker
from app.models.models import Customer, User, AuditLog
from app.schemas.schemas import CustomerCreate, CustomerResponse

router = APIRouter(prefix="/customers", tags=["customers"])

def customer_to_dict(customer: Customer):
    return {
        "customer_name": customer.customer_name,
        "phone_number": customer.phone_number,
        "address": customer.address
    }

@router.get("", response_model=List[CustomerResponse])
def get_customers(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Customer).all()

@router.get("/{id}", response_model=CustomerResponse)
def get_customer(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    customer = db.query(Customer).filter(Customer.customer_id == id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer

@router.post("", response_model=CustomerResponse)
def create_customer(
    cust_in: CustomerCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    # Check duplicate phone
    exists = db.query(Customer).filter(Customer.phone_number == cust_in.phone_number).first()
    if exists:
        raise HTTPException(status_code=400, detail="Customer phone number already exists")
        
    db_cust = Customer(
        customer_name=cust_in.customer_name,
        phone_number=cust_in.phone_number,
        address=cust_in.address
    )
    db.add(db_cust)
    db.commit()
    db.refresh(db_cust)
    return db_cust

@router.put("/{id}", response_model=CustomerResponse)
def update_customer(
    id: int, 
    cust_in: CustomerCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(RoleChecker(["Admin"]))
):
    customer = db.query(Customer).filter(Customer.customer_id == id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
        
    old_state = json.dumps(customer_to_dict(customer))
        
    customer.customer_name = cust_in.customer_name
    customer.phone_number = cust_in.phone_number
    customer.address = cust_in.address
    
    db.commit()
    db.refresh(customer)
    
    new_state = json.dumps(customer_to_dict(customer))
    audit_log = AuditLog(
        action="UPDATE_CUSTOMER",
        table_name="customers",
        record_id=id,
        old_values=old_state,
        new_values=new_state,
        user_id=current_user.user_id
      )
    db.add(audit_log)
    db.commit()
    db.refresh(customer)
    
    return customer

@router.delete("/{id}")
def delete_customer(
    id: int, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(RoleChecker(["Admin"]))
):
    customer = db.query(Customer).filter(Customer.customer_id == id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
        
    old_state = json.dumps(customer_to_dict(customer))
    db.delete(customer)
    
    # Create audit log entry
    audit_log = AuditLog(
        action="DELETE_CUSTOMER",
        table_name="customers",
        record_id=id,
        old_values=old_state,
        new_values=None,
        user_id=current_user.user_id
    )
    db.add(audit_log)
    db.commit()
    
    return {"message": "Customer deleted successfully"}
