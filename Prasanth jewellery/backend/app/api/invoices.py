from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List, Optional
import random
from app.core.database import get_db
from app.api.auth import get_current_user, RoleChecker
from app.models.models import Invoice, InvoiceItem, Payment, Inventory, Customer, User, AuditLog
from app.schemas.schemas import InvoiceCreate, InvoiceResponse
from app.services.pdf_service import generate_invoice_pdf
from app.services.notification import send_whatsapp_invoice

router = APIRouter(prefix="/invoices", tags=["invoices"])

@router.get("", response_model=List[InvoiceResponse])
def get_invoices(db: Session = Depends(get_db)):
    return db.query(Invoice).order_by(Invoice.created_at.desc()).all()

@router.post("", response_model=InvoiceResponse)
def create_invoice(
    invoice_in: InvoiceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["Admin", "Manager", "Billing Staff"]))
):
    # Verify Customer
    customer = db.query(Customer).filter(Customer.id == invoice_in.customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
        
    # Calculate initial subtotal and check values
    subtotal = 0.0
    making_charges_total = 0.0
    wastage_charges_total = 0.0
    
    total_gross = 0.0
    total_stone = 0.0
    total_bead = 0.0
    total_net = 0.0
    
    invoice_items = []
    
    # Process items and calculate totals
    for item_in in invoice_in.items:
        # Check physical inventory stock item
        inventory_item = db.query(Inventory).filter(Inventory.item_code == item_in.item_code).first()
        if not inventory_item:
            raise HTTPException(
                status_code=400,
                detail=f"Stock item {item_in.item_code} not found in inventory"
            )
        if inventory_item.status == "Sold":
            raise HTTPException(
                status_code=400,
                detail=f"Stock item {item_in.item_code} has already been sold"
            )
            
        # Compile item weights
        total_gross += inventory_item.gross_weight
        total_stone += inventory_item.stone_weight
        total_bead += inventory_item.bead_weight
        total_net += inventory_item.net_weight
        
        # Calculations:
        # Net Weight = Gross Weight - Stone Weight - Bead Weight (precalculated on creation)
        # Metal Value = Net Weight * rate_applied
        metal_value = inventory_item.net_weight * item_in.rate_applied
        
        # Making Charges
        # if percentage-based: percentage of metal value
        # if fixed: rate * gross weight (or net weight, usually gross/net weight in grams)
        making_charges = 0.0
        if item_in.making_charge_type == "percentage":
            making_charges = metal_value * (item_in.making_charges_applied / 100.0)
        else:
            # fixed charge per gram based on net weight
            making_charges = inventory_item.net_weight * item_in.making_charges_applied
            
        # Wastage charges
        # Metal value * wastage_percent
        wastage_charges = metal_value * (item_in.wastage_charges_applied / 100.0)
        
        # Item price = Metal Value + Making Charges + Wastage Charges
        item_price = metal_value + making_charges + wastage_charges
        
        subtotal += item_price
        making_charges_total += making_charges
        wastage_charges_total += wastage_charges
        
        # Instantiate model for invoice_item
        db_item = InvoiceItem(
            inventory_id=inventory_item.id,
            item_code=inventory_item.item_code,
            category=item_in.category,
            subcategory=item_in.subcategory,
            purity=item_in.purity,
            gross_weight=inventory_item.gross_weight,
            stone_weight=inventory_item.stone_weight,
            bead_weight=inventory_item.bead_weight,
            net_weight=inventory_item.net_weight,
            rate_applied=item_in.rate_applied,
            metal_value=metal_value,
            making_charges_applied=item_in.making_charges_applied,
            making_charge_type=item_in.making_charge_type,
            wastage_charges_applied=item_in.wastage_charges_applied,
            final_item_price=item_price
        )
        invoice_items.append((db_item, inventory_item))

    # Apply GST (3% compliance in India for gold/jewelry)
    gst_amount = subtotal * 0.03
    
    # Final price calculation
    final_amount = subtotal + gst_amount - invoice_in.discount
    if final_amount < 0:
        final_amount = 0.0
        
    # PAN Card compliance check for > 2 Lakhs INR
    if final_amount > 200000.0 and not invoice_in.pan_submitted:
        # Verify customer profile has a valid PAN
        if not customer.pan_number or len(customer.pan_number) < 5:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="PAN Card details are mandatory for purchases exceeding ₹2 Lakhs (compliance limit)."
            )
            
    # Generate Invoice Number: INV + YYYYMMDD + random 4-digit code
    now = datetime.now()
    inv_num = f"INV-{now.strftime('%Y%m%d')}-{random.randint(1000, 9999)}"
    
    # Save Invoice
    db_invoice = Invoice(
        invoice_number=inv_num,
        customer_id=invoice_in.customer_id,
        date=datetime.utcnow(),
        total_gross_weight=total_gross,
        total_stone_weight=total_stone,
        total_bead_weight=total_bead,
        total_net_weight=total_net,
        subtotal=subtotal,
        making_charges_total=making_charges_total,
        wastage_charges_total=wastage_charges_total,
        gst_amount=gst_amount,
        discount=invoice_in.discount,
        final_amount=final_amount,
        pan_submitted=invoice_in.pan_submitted or (final_amount > 200000.0),
        e_way_bill_number=invoice_in.e_way_bill_number,
        created_by_id=current_user.id
    )
    
    db.add(db_invoice)
    db.commit()
    db.refresh(db_invoice)
    
    # Save invoice items and update physical stock to "Sold"
    for db_item, inventory_item in invoice_items:
        db_item.invoice_id = db_invoice.id
        db.add(db_item)
        
        # Mark inventory stock as sold
        inventory_item.status = "Sold"
        db.add(inventory_item)
        
    # Process payments (multi-payment / split support)
    total_paid = 0.0
    for p_in in invoice_in.payments:
        db_payment = Payment(
            invoice_id=db_invoice.id,
            payment_method=p_in.payment_method,
            amount_paid=p_in.amount_paid,
            details=p_in.details,
            created_at=datetime.utcnow()
        )
        db.add(db_payment)
        total_paid += p_in.amount_paid
        
    db.commit()
    db.refresh(db_invoice)
    
    # Log Audit action
    log = AuditLog(
        user_id=current_user.id,
        action="CREATE_INVOICE",
        details=f"Created Invoice {db_invoice.invoice_number} (Amount: ₹{db_invoice.final_amount:,.2f})"
    )
    db.add(log)
    db.commit()
    
    # Send mock WhatsApp invoice
    try:
        send_whatsapp_invoice(
            phone_number=customer.phone,
            invoice_number=db_invoice.invoice_number,
            amount=db_invoice.final_amount,
            customer_name=customer.name
        )
    except Exception:
        pass # don't fail transaction if notification fails
        
    return db_invoice

@router.get("/{id}", response_model=InvoiceResponse)
def get_invoice(id: int, db: Session = Depends(get_db)):
    invoice = db.query(Invoice).filter(Invoice.id == id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return invoice

@router.delete("/{id}")
def delete_invoice(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["Admin", "Manager"]))
):
    invoice = db.query(Invoice).filter(Invoice.id == id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
        
    # Reset associated inventory stock status to "Available"
    for item in invoice.items:
        inv_item = db.query(Inventory).filter(Inventory.id == item.inventory_id).first()
        if inv_item:
            inv_item.status = "Available"
            db.add(inv_item)
            
    # Audit log
    log = AuditLog(
        user_id=current_user.id,
        action="DELETE_INVOICE",
        details=f"Deleted Invoice {invoice.invoice_number} and released stock items."
    )
    db.add(log)
    
    db.delete(invoice)
    db.commit()
    
    return {"message": "Invoice deleted and stock items released."}

@router.get("/{id}/pdf")
def get_invoice_pdf_file(id: int, db: Session = Depends(get_db)):
    invoice = db.query(Invoice).filter(Invoice.id == id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
        
    pdf_data = generate_invoice_pdf(invoice)
    
    headers = {
        'Content-Disposition': f'attachment; filename="{invoice.invoice_number}.pdf"'
    }
    return Response(content=pdf_data, media_type="application/pdf", headers=headers)

@router.post("/{id}/share")
def share_invoice_whatsapp(id: int, db: Session = Depends(get_db)):
    invoice = db.query(Invoice).filter(Invoice.id == id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
        
    status_ok = send_whatsapp_invoice(
        phone_number=invoice.customer.phone,
        invoice_number=invoice.invoice_number,
        amount=invoice.final_amount,
        customer_name=invoice.customer.name
    )
    
    return {"message": "Invoice shared to customer's WhatsApp", "status": status_ok}
