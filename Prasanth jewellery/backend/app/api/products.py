from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.api.auth import get_current_user, RoleChecker
from app.models.models import Product, User, AuditLog
from app.schemas.schemas import ProductCreate, ProductResponse, ProductUpdate
import json

router = APIRouter(prefix="/products", tags=["product-master"])

@router.get("", response_model=List[ProductResponse])
def list_products(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List all products in the database. Accessible by both Admin and Operator.
    """
    return db.query(Product).order_by(Product.product_id.desc()).all()

@router.post("", response_model=ProductResponse)
def create_product(
    product_in: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["Admin"]))
):
    """
    Create a new product. Admin only.
    """
    # Check for duplicates by name + ornament type
    exists = db.query(Product).filter(
        Product.product_name == product_in.product_name,
        Product.ornament_type == product_in.ornament_type
    ).first()
    if exists:
        raise HTTPException(
            status_code=400,
            detail=f"Product with name '{product_in.product_name}' and type '{product_in.ornament_type}' already exists."
        )

    db_product = Product(
        product_name=product_in.product_name,
        ornament_type=product_in.ornament_type,
        default_gold_weight=product_in.default_gold_weight or 0.0,
        default_making_charge=product_in.default_making_charge or 0.0,
        gst_percent=product_in.gst_percent if product_in.gst_percent is not None else 3.0,
        status=product_in.status or "Active"
    )
    db.add(db_product)
    db.commit()
    db.refresh(db_product)

    # Audit log
    audit_log = AuditLog(
        action="CREATE_PRODUCT",
        table_name="products",
        record_id=db_product.product_id,
        old_values=None,
        new_values=json.dumps({
            "product_name": db_product.product_name,
            "ornament_type": db_product.ornament_type
        }),
        user_id=current_user.user_id
    )
    db.add(audit_log)
    db.commit()

    return db_product

@router.put("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    product_update: ProductUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["Admin"]))
):
    """
    Update a product's details. Admin only.
    """
    product = db.query(Product).filter(Product.product_id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    old_state = {
        "product_name": product.product_name,
        "ornament_type": product.ornament_type,
        "default_gold_weight": product.default_gold_weight,
        "default_making_charge": product.default_making_charge,
        "gst_percent": product.gst_percent,
        "status": product.status
    }

    # Duplicate check if name or ornament type is changing
    new_name = product_update.product_name if product_update.product_name else product.product_name
    new_type = product_update.ornament_type if product_update.ornament_type else product.ornament_type
    if new_name != product.product_name or new_type != product.ornament_type:
        exists = db.query(Product).filter(
            Product.product_name == new_name,
            Product.ornament_type == new_type,
            Product.product_id != product_id
        ).first()
        if exists:
            raise HTTPException(
                status_code=400,
                detail=f"Another product with name '{new_name}' and type '{new_type}' already exists."
            )

    if product_update.product_name is not None:
        product.product_name = product_update.product_name
    if product_update.ornament_type is not None:
        product.ornament_type = product_update.ornament_type
    if product_update.default_gold_weight is not None:
        product.default_gold_weight = product_update.default_gold_weight
    if product_update.default_making_charge is not None:
        product.default_making_charge = product_update.default_making_charge
    if product_update.gst_percent is not None:
        product.gst_percent = product_update.gst_percent
    if product_update.status is not None:
        product.status = product_update.status

    db.commit()
    db.refresh(product)

    new_state = {
        "product_name": product.product_name,
        "ornament_type": product.ornament_type,
        "default_gold_weight": product.default_gold_weight,
        "default_making_charge": product.default_making_charge,
        "gst_percent": product.gst_percent,
        "status": product.status
    }

    audit_log = AuditLog(
        action="UPDATE_PRODUCT",
        table_name="products",
        record_id=product_id,
        old_values=json.dumps(old_state),
        new_values=json.dumps(new_state),
        user_id=current_user.user_id
    )
    db.add(audit_log)
    db.commit()

    return product

@router.delete("/{product_id}")
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["Admin"]))
):
    """
    Delete a product. Admin only.
    """
    product = db.query(Product).filter(Product.product_id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    old_state = {
        "product_name": product.product_name,
        "ornament_type": product.ornament_type
    }

    db.delete(product)

    audit_log = AuditLog(
        action="DELETE_PRODUCT",
        table_name="products",
        record_id=product_id,
        old_values=json.dumps(old_state),
        new_values=None,
        user_id=current_user.user_id
    )
    db.add(audit_log)
    db.commit()

    return {"message": "Product deleted successfully"}
