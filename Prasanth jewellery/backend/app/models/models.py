from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Date
from sqlalchemy.orm import relationship
from app.core.database import Base

class User(Base):
    __tablename__ = "users"
    
    user_id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    password = Column(String(255), nullable=False)
    role = Column(String(50), default="Operator") # Admin or Operator
    is_active = Column(Integer, default=1, nullable=False) # 1 = Active, 0 = Disabled
    failed_login_attempts = Column(Integer, default=0, nullable=False)
    locked_until = Column(DateTime, nullable=True)
    created_date = Column(DateTime, default=datetime.utcnow)
    full_name = Column(String(100), nullable=True)
    mobile_number = Column(String(20), nullable=True)

    bills = relationship("Bill", back_populates="creator")

class Customer(Base):
    __tablename__ = "customers"
    
    customer_id = Column(Integer, primary_key=True, index=True)
    customer_name = Column(String(100), nullable=False, index=True)
    phone_number = Column(String(20), nullable=False, index=True)
    address = Column(Text, nullable=True)

class Product(Base):
    __tablename__ = "products"
    
    product_id = Column(Integer, primary_key=True, index=True)
    product_name = Column(String(150), nullable=False, index=True)
    ornament_type = Column(String(100), nullable=False)
    default_gold_weight = Column(Float, default=0.0)
    default_making_charge = Column(Float, default=0.0)
    gst_percent = Column(Float, default=3.0)
    status = Column(String(50), default="Active") # Active / Disabled

class Bill(Base):
    __tablename__ = "bills"
    
    bill_id = Column(Integer, primary_key=True, index=True)
    purchase_id = Column(String(50), unique=True, index=True, nullable=False)
    customer_name = Column(String(100), nullable=False, index=True)
    phone_number = Column(String(20), nullable=False, index=True)
    company_name = Column(String(100), default="Prasanth Jewellery")
    date = Column(DateTime, default=datetime.utcnow)
    subtotal = Column(Float, nullable=False)
    discount = Column(Float, default=0.0)
    total_amount = Column(Float, nullable=False)
    created_by = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    
    creator = relationship("User", back_populates="bills")
    items = relationship("BillItem", back_populates="bill", cascade="all, delete-orphan")

    @property
    def creator_username(self):
        return self.creator.username if self.creator else None

    @property
    def creator_name(self):
        return self.creator.full_name if self.creator else None

class BillItem(Base):
    __tablename__ = "bill_items"
    
    item_id = Column(Integer, primary_key=True, index=True)
    bill_id = Column(Integer, ForeignKey("bills.bill_id"), nullable=False)
    ornament_type = Column(String(50), nullable=True)
    product_name = Column(String(150), nullable=False)
    quantity = Column(Integer, default=1)
    weight_gold_g = Column(Float, default=0.0)
    rate_per_gram = Column(Float, default=0.0)
    MRP = Column(Float, default=0.0)
    making_charge = Column(Float, default=0.0)
    discount = Column(Float, default=0.0) # Store line-item discount
    GST = Column(Float, default=3.0) # Store GST percent
    item_total = Column(Float, nullable=False)

    bill = relationship("Bill", back_populates="items")

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    log_id = Column(Integer, primary_key=True, index=True)
    action = Column(String(50), nullable=False)
    table_name = Column(String(50), nullable=False)
    record_id = Column(Integer, nullable=False)
    old_values = Column(Text, nullable=True)
    new_values = Column(Text, nullable=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User")

class MetalRate(Base):
    __tablename__ = "metal_rates"
    
    rate_id = Column(Integer, primary_key=True, index=True)
    gold_24k = Column(Float, nullable=False, default=7200.0)
    gold_22k = Column(Float, nullable=False, default=6600.0)
    gold_18k = Column(Float, nullable=False, default=5400.0)
    silver = Column(Float, nullable=False, default=90.0)
    platinum = Column(Float, nullable=False, default=3200.0)
    updated_at = Column(DateTime, default=datetime.utcnow)
    updated_by_id = Column(Integer, ForeignKey("users.user_id"), nullable=True)
