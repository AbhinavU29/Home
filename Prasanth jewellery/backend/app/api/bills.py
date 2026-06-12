from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timezone, timedelta
from typing import List, Optional
import random
import json
from app.core.database import get_db
from app.api.auth import get_current_user, RoleChecker
from app.models.models import Bill, BillItem, Customer, User, AuditLog
from app.schemas.schemas import BillCreate, BillResponse
from app.services.pdf_generator import generate_bill_pdf

IST = timezone(timedelta(hours=5, minutes=30))

router = APIRouter(prefix="/bills", tags=["bills"])

def parse_date_start(date_str: str):
    if not date_str:
        return None
    try:
        return datetime.strptime(date_str, "%Y-%m-%d")
    except ValueError:
        try:
            return datetime.strptime(date_str, "%Y-%m-%d %H:%M:%S")
        except ValueError:
            try:
                return datetime.strptime(date_str.replace("T", " "), "%Y-%m-%d %H:%M")
            except ValueError:
                return None

def parse_date_end(date_str: str):
    if not date_str:
        return None
    try:
        d = datetime.strptime(date_str, "%Y-%m-%d")
        return d.replace(hour=23, minute=59, second=59)
    except ValueError:
        try:
            return datetime.strptime(date_str, "%Y-%m-%d %H:%M:%S")
        except ValueError:
            try:
                return datetime.strptime(date_str.replace("T", " "), "%Y-%m-%d %H:%M")
            except ValueError:
                return None

def bill_to_dict(bill: Bill):
    return {
        "purchase_id": bill.purchase_id,
        "customer_name": bill.customer_name,
        "phone_number": bill.phone_number,
        "company_name": bill.company_name,
        "date": bill.date.strftime("%Y-%m-%d %H:%M:%S") if isinstance(bill.date, datetime) else str(bill.date),
        "subtotal": bill.subtotal,
        "discount": bill.discount,
        "total_amount": bill.total_amount,
        "items": [
            {
                "product_name": item.product_name,
                "ornament_type": item.ornament_type,
                "quantity": item.quantity,
                "weight_gold_g": item.weight_gold_g,
                "rate_per_gram": item.rate_per_gram,
                "MRP": item.MRP,
                "making_charge": item.making_charge,
                "discount": item.discount,
                "GST": item.GST,
                "item_total": item.item_total
            } for item in bill.items
        ]
    }

@router.get("", response_model=List[BillResponse])
def get_bills(
    customer_name: Optional[str] = None,
    phone_number: Optional[str] = None,
    purchase_id: Optional[str] = None,
    product_name: Optional[str] = None,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Bill)
    
    if customer_name:
        query = query.filter(func.lower(Bill.customer_name).like(f"%{customer_name.lower()}%"))
    if phone_number:
        query = query.filter(Bill.phone_number.like(f"%{phone_number}%"))
    if purchase_id:
        query = query.filter(func.lower(Bill.purchase_id).like(f"%{purchase_id.lower()}%"))
    if product_name:
        query = query.join(Bill.items).filter(func.lower(BillItem.product_name).like(f"%{product_name.lower()}%")).distinct()
    if from_date:
        fd = parse_date_start(from_date)
        if fd:
            query = query.filter(Bill.date >= fd)
    if to_date:
        td = parse_date_end(to_date)
        if td:
            query = query.filter(Bill.date <= td)
            
    return query.order_by(Bill.date.desc(), Bill.bill_id.desc()).offset(skip).limit(limit).all()

@router.get("/{id}", response_model=BillResponse)
def get_bill(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    bill = db.query(Bill).filter(Bill.bill_id == id).first()
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")
    return bill

@router.post("", response_model=BillResponse)
def create_bill(
    bill_in: BillCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    # Check if customer exists in customer master registry, if not, add them automatically
    cust_exists = db.query(Customer).filter(Customer.phone_number == bill_in.phone_number).first()
    if not cust_exists:
        new_cust = Customer(
            customer_name=bill_in.customer_name,
            phone_number=bill_in.phone_number
        )
        db.add(new_cust)
        db.flush()
        
    subtotal = 0.0
    bill_items = []
    
    # Process items and calculate totals
    for item in bill_in.items:
        # Bullion value = weight * rate
        bullion_val = item.weight_gold_g * item.rate_per_gram
        # MRP value = quantity * MRP
        mrp_val = item.quantity * item.MRP
        
        # Base before discount & tax
        item_sub = bullion_val + mrp_val + item.making_charge
        
        # Deduct line-item discount
        item_sub_after_discount = max(0.0, item_sub - item.discount)
        
        # GST percent (e.g. 3%)
        item_gst = item_sub_after_discount * (item.GST / 100.0)
        
        item_total = item_sub_after_discount + item_gst
        subtotal += item_total
        
        db_item = BillItem(
            ornament_type=item.ornament_type,
            product_name=item.product_name,
            quantity=item.quantity,
            weight_gold_g=item.weight_gold_g,
            rate_per_gram=item.rate_per_gram,
            MRP=item.MRP,
            making_charge=item.making_charge,
            discount=item.discount,
            GST=item.GST,
            item_total=item_total
        )
        bill_items.append(db_item)
        
    # Final amount
    final_amount = max(0.0, subtotal - bill_in.discount)
    
    # Auto-generate Bill Purchase ID in the PJ + YYYYMMDD + 4 digit running number format
    now_ist = datetime.now(IST)
    now_naive = now_ist.replace(tzinfo=None)
    today_start = now_naive.replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = now_naive.replace(hour=23, minute=59, second=59, microsecond=999999)
    count_today = db.query(func.count(Bill.bill_id)).filter(Bill.date >= today_start, Bill.date <= today_end).scalar() or 0
    running_no = count_today + 1
    purchase_id_str = f"PJ{now_ist.strftime('%Y%m%d')}{str(running_no).zfill(4)}"
    
    db_bill = Bill(
        purchase_id=purchase_id_str,
        customer_name=bill_in.customer_name,
        phone_number=bill_in.phone_number,
        company_name=bill_in.company_name or "Prasanth Jewellery",
        date=bill_in.date or now_naive,
        subtotal=subtotal,
        discount=bill_in.discount,
        total_amount=final_amount,
        created_by=current_user.user_id
    )
    db.add(db_bill)
    db.commit()
    db.refresh(db_bill)
    
    # Add bill items
    for db_item in bill_items:
        db_item.bill_id = db_bill.bill_id
        db.add(db_item)
        
    db.commit()
    db.refresh(db_bill)
    return db_bill

@router.put("/{id}", response_model=BillResponse)
def update_bill(
    id: int, 
    bill_in: BillCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(RoleChecker(["Admin"]))
):
    bill = db.query(Bill).filter(Bill.bill_id == id).first()
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")
        
    # Serialize old bill state before any database changes
    old_state = json.dumps(bill_to_dict(bill))
        
    # Clear old items
    db.query(BillItem).filter(BillItem.bill_id == id).delete()
    
    subtotal = 0.0
    bill_items = []
    
    for item in bill_in.items:
        bullion_val = item.weight_gold_g * item.rate_per_gram
        mrp_val = item.quantity * item.MRP
        item_sub = bullion_val + mrp_val + item.making_charge
        item_sub_after_discount = max(0.0, item_sub - item.discount)
        item_gst = item_sub_after_discount * (item.GST / 100.0)
        item_total = item_sub_after_discount + item_gst
        subtotal += item_total
        
        db_item = BillItem(
            bill_id=id,
            product_name=item.product_name,
            ornament_type=item.ornament_type,
            quantity=item.quantity,
            weight_gold_g=item.weight_gold_g,
            rate_per_gram=item.rate_per_gram,
            MRP=item.MRP,
            making_charge=item.making_charge,
            discount=item.discount,
            GST=item.GST,
            item_total=item_total
        )
        bill_items.append(db_item)
        
    final_amount = max(0.0, subtotal - bill_in.discount)
    
    bill.customer_name = bill_in.customer_name
    bill.phone_number = bill_in.phone_number
    bill.company_name = bill_in.company_name or "Prasanth Jewellery"
    if bill_in.date:
        bill.date = bill_in.date
    bill.subtotal = subtotal
    bill.discount = bill_in.discount
    bill.total_amount = final_amount
    
    for db_item in bill_items:
        db.add(db_item)
        
    db.commit()
    db.refresh(bill)
    
    # Serialize new state and create audit log
    new_state = json.dumps(bill_to_dict(bill))
    audit_log = AuditLog(
        action="UPDATE_BILL",
        table_name="bills",
        record_id=id,
        old_values=old_state,
        new_values=new_state,
        user_id=current_user.user_id
    )
    db.add(audit_log)
    db.commit()
    db.refresh(bill)
    
    return bill

@router.delete("/{id}")
def delete_bill(
    id: int, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(RoleChecker(["Admin"]))
):
    bill = db.query(Bill).filter(Bill.bill_id == id).first()
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")
        
    old_state = json.dumps(bill_to_dict(bill))
    db.delete(bill)
    
    # Create audit log entry
    audit_log = AuditLog(
        action="DELETE_BILL",
        table_name="bills",
        record_id=id,
        old_values=old_state,
        new_values=None,
        user_id=current_user.user_id
    )
    db.add(audit_log)
    db.commit()
    
    return {"message": "Bill deleted successfully"}

@router.get("/{id}/pdf")
def download_bill_pdf(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    bill = db.query(Bill).filter(Bill.bill_id == id).first()
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")
        
    pdf_bytes = generate_bill_pdf(bill)
    
    # Extract customer's first name, cleaning non-alphanumeric characters
    import re
    first_name = bill.customer_name.split(' ')[0] if bill.customer_name else "Customer"
    first_name = re.sub(r'[^a-zA-Z0-9]', '', first_name)
    filename = f"{bill.purchase_id}_{first_name}.pdf"
    
    headers = {
        'Content-Disposition': f'attachment; filename="{filename}"'
    }
    return Response(content=pdf_bytes, media_type="application/pdf", headers=headers)
