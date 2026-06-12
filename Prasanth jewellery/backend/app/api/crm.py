from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List, Optional
import random
from app.core.database import get_db
from app.api.auth import get_current_user, RoleChecker
from app.models.models import Customer, ExchangeItem, Scheme, SchemePayment, User, AuditLog
from app.schemas.schemas import CustomerCreate, CustomerResponse, ExchangeItemCreate, ExchangeItemResponse, SchemeCreate, SchemeResponse, SchemePaymentCreate, SchemePaymentResponse
from app.services.notification import send_sms_scheme_payment

router = APIRouter(prefix="/crm", tags=["crm-and-savings"])

# --- CUSTOMER CRUD ---

@router.get("/customers", response_model=List[CustomerResponse])
def get_customers(db: Session = Depends(get_db)):
    return db.query(Customer).all()

@router.post("/customers", response_model=CustomerResponse)
def create_customer(
    cust_in: CustomerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["Admin", "Manager", "Billing Staff"]))
):
    # Check duplicate phone
    exists = db.query(Customer).filter(Customer.phone == cust_in.phone).first()
    if exists:
        raise HTTPException(status_code=400, detail="Customer with this phone number already exists")
        
    db_cust = Customer(
        name=cust_in.name,
        phone=cust_in.phone,
        email=cust_in.email,
        pan_number=cust_in.pan_number,
        aadhaar_number=cust_in.aadhaar_number,
        anniversary=cust_in.anniversary,
        birthday=cust_in.birthday,
        ring_size=cust_in.ring_size,
        bangle_size=cust_in.bangle_size,
        notes=cust_in.notes,
        created_at=datetime.utcnow()
    )
    db.add(db_cust)
    db.commit()
    db.refresh(db_cust)
    return db_cust

@router.put("/customers/{id}", response_model=CustomerResponse)
def update_customer(
    id: int,
    cust_in: CustomerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["Admin", "Manager", "Billing Staff"]))
):
    db_cust = db.query(Customer).filter(Customer.id == id).first()
    if not db_cust:
        raise HTTPException(status_code=404, detail="Customer not found")
        
    db_cust.name = cust_in.name
    db_cust.phone = cust_in.phone
    db_cust.email = cust_in.email
    db_cust.pan_number = cust_in.pan_number
    db_cust.aadhaar_number = cust_in.aadhaar_number
    db_cust.anniversary = cust_in.anniversary
    db_cust.birthday = cust_in.birthday
    db_cust.ring_size = cust_in.ring_size
    db_cust.bangle_size = cust_in.bangle_size
    db_cust.notes = cust_in.notes
    
    db.commit()
    db.refresh(db_cust)
    return db_cust


# --- OLD GOLD EXCHANGE ---

@router.post("/exchange", response_model=ExchangeItemResponse)
def create_exchange_voucher(
    ex_in: ExchangeItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["Admin", "Manager", "Billing Staff"]))
):
    # Verify Customer
    customer = db.query(Customer).filter(Customer.id == ex_in.customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
        
    # Generate unique voucher code: PJ-EXG-XXXXXX
    voucher = f"PJ-EXG-{random.randint(100000, 999999)}"
    
    db_ex = ExchangeItem(
        customer_id=ex_in.customer_id,
        item_description=ex_in.item_description,
        gross_weight=ex_in.gross_weight,
        purity_check_result=ex_in.purity_check_result,
        net_weight=ex_in.net_weight,
        rate_applied=ex_in.rate_applied,
        valuation_amount=ex_in.valuation_amount,
        id_verification_type=ex_in.id_verification_type,
        id_verification_number=ex_in.id_verification_number,
        voucher_code=voucher,
        status="Unredeemed",
        created_at=datetime.utcnow()
    )
    db.add(db_ex)
    
    log = AuditLog(
        user_id=current_user.id,
        action="CREATE_EXCHANGE_VOUCHER",
        details=f"Issued Old Gold Exchange Voucher {voucher} (Valued: ₹{db_ex.valuation_amount:,.2f})"
    )
    db.add(log)
    db.commit()
    db.refresh(db_ex)
    return db_ex

@router.get("/exchange", response_model=List[ExchangeItemResponse])
def get_exchanges(db: Session = Depends(get_db)):
    return db.query(ExchangeItem).all()


# --- CHIT / SAVINGS SCHEMES ---

@router.post("/schemes", response_model=SchemeResponse)
def create_chit_scheme(
    scheme_in: SchemeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["Admin", "Manager", "Billing Staff"]))
):
    customer = db.query(Customer).filter(Customer.id == scheme_in.customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
        
    # Standard 11 month duration
    duration = scheme_in.duration_months or 11
    start = datetime.utcnow()
    maturity = start + timedelta(days=30 * duration)
    
    db_scheme = Scheme(
        customer_id=scheme_in.customer_id,
        scheme_name=scheme_in.scheme_name,
        monthly_amount=scheme_in.monthly_amount,
        start_date=start,
        duration_months=duration,
        maturity_date=maturity,
        status="Active",
        created_at=start
    )
    db.add(db_scheme)
    
    log = AuditLog(
        user_id=current_user.id,
        action="CREATE_SAVINGS_SCHEME",
        details=f"Registered scheme '{db_scheme.scheme_name}' for Customer {customer.name}"
    )
    db.add(log)
    db.commit()
    db.refresh(db_scheme)
    return db_scheme

@router.get("/schemes", response_model=List[SchemeResponse])
def get_schemes(db: Session = Depends(get_db)):
    return db.query(Scheme).all()

@router.get("/schemes/{id}", response_model=SchemeResponse)
def get_scheme(id: int, db: Session = Depends(get_db)):
    scheme = db.query(Scheme).filter(Scheme.id == id).first()
    if not scheme:
        raise HTTPException(status_code=404, detail="Savings scheme not found")
    return scheme

@router.post("/schemes/{id}/payments", response_model=SchemePaymentResponse)
def pay_scheme_installment(
    id: int,
    payment_in: SchemePaymentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["Admin", "Manager", "Billing Staff"]))
):
    scheme = db.query(Scheme).filter(Scheme.id == id).first()
    if not scheme:
        raise HTTPException(status_code=404, detail="Savings scheme not found")
        
    if scheme.status != "Active":
        raise HTTPException(status_code=400, detail="Payments cannot be made to an inactive/matured scheme")
        
    # Generate receipt receipt number
    receipt = f"REC-SCH-{random.randint(100000, 999999)}"
    
    db_payment = SchemePayment(
        scheme_id=id,
        amount_paid=payment_in.amount_paid,
        payment_date=datetime.utcnow(),
        payment_method=payment_in.payment_method,
        receipt_number=receipt,
        created_at=datetime.utcnow()
    )
    db.add(db_payment)
    
    # Calculate sum of payments
    existing_payments_sum = sum([p.amount_paid for p in scheme.payments]) + payment_in.amount_paid
    target_maturity_sum = scheme.monthly_amount * scheme.duration_months
    
    # Check if scheme is fully paid (matured)
    if len(scheme.payments) + 1 >= scheme.duration_months or existing_payments_sum >= target_maturity_sum:
        scheme.status = "Matured"
        
    db.commit()
    db.refresh(db_payment)
    
    # Audit log
    customer = scheme.customer
    log = AuditLog(
        user_id=current_user.id,
        action="SCHEME_PAYMENT",
        details=f"Received payment of ₹{db_payment.amount_paid:,.2f} for Scheme ID {scheme.id}. Receipt: {receipt}"
    )
    db.add(log)
    db.commit()
    
    # Send SMS notification
    try:
        send_sms_scheme_payment(
            phone_number=customer.phone,
            customer_name=customer.name,
            amount=db_payment.amount_paid,
            receipt_number=receipt,
            balance=existing_payments_sum
        )
    except Exception:
        pass
        
    return db_payment
