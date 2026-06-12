from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from app.core.database import get_db
from app.api.auth import get_current_user, RoleChecker
from app.models.models import MetalRate, User, AuditLog
from app.schemas.schemas import MetalRateCreate, MetalRateResponse

router = APIRouter(prefix="/metal-rates", tags=["metal-rates"])

@router.get("", response_model=MetalRateResponse)
def get_latest_metal_rate(db: Session = Depends(get_db)):
    rate = db.query(MetalRate).order_by(MetalRate.updated_at.desc()).first()
    if not rate:
        # Seed a default initial rate if none exists
        rate = MetalRate(
            gold_24k=7200.0,
            gold_22k=6600.0,
            gold_18k=5400.0,
            silver=90.0,
            platinum=3200.0,
            updated_at=datetime.utcnow()
        )
        db.add(rate)
        db.commit()
        db.refresh(rate)
    return rate

@router.post("", response_model=MetalRateResponse)
def update_metal_rate(
    rate_in: MetalRateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["Admin"]))
):
    new_rate = MetalRate(
        gold_24k=rate_in.gold_24k,
        gold_22k=rate_in.gold_22k,
        gold_18k=rate_in.gold_18k,
        silver=rate_in.silver,
        platinum=rate_in.platinum,
        updated_at=datetime.utcnow(),
        updated_by_id=current_user.user_id
    )
    db.add(new_rate)
    db.commit()
    db.refresh(new_rate)
    
    # Audit log
    log = AuditLog(
        user_id=current_user.user_id,
        action="UPDATE_METAL_RATES",
        table_name="metal_rates",
        record_id=new_rate.rate_id,
        old_values=None,
        new_values=f"Rates updated: 24K Gold=₹{new_rate.gold_24k}, 22K Gold=₹{new_rate.gold_22k}, Silver=₹{new_rate.silver}"
    )
    db.add(log)
    db.commit()
    
    return new_rate
