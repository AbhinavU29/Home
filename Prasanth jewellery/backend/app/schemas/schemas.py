from datetime import datetime, date
from typing import List, Optional
from pydantic import BaseModel, Field

# --- TOKEN & AUTH ---
class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    username: str

class TokenData(BaseModel):
    username: Optional[str] = None


# --- USER ---
class UserCreate(BaseModel):
    username: str
    password: str
    role: Optional[str] = "Operator"
    full_name: Optional[str] = None
    mobile_number: Optional[str] = None

class UserResponse(BaseModel):
    user_id: int
    username: str
    role: str
    is_active: int
    created_date: datetime
    full_name: Optional[str] = None
    mobile_number: Optional[str] = None
    
    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[int] = None
    full_name: Optional[str] = None
    mobile_number: Optional[str] = None

class PasswordReset(BaseModel):
    new_password: str

class UserLogin(BaseModel):
    username: str
    password: str


# --- CUSTOMER ---
class CustomerCreate(BaseModel):
    customer_name: str
    phone_number: str
    address: Optional[str] = None

class CustomerResponse(CustomerCreate):
    customer_id: int
    
    class Config:
        from_attributes = True

# --- PRODUCT ---
class ProductCreate(BaseModel):
    product_name: str
    ornament_type: str
    default_gold_weight: Optional[float] = 0.0
    default_making_charge: Optional[float] = 0.0
    gst_percent: Optional[float] = 3.0
    status: Optional[str] = "Active"

class ProductResponse(ProductCreate):
    product_id: int

    class Config:
        from_attributes = True

class ProductUpdate(BaseModel):
    product_name: Optional[str] = None
    ornament_type: Optional[str] = None
    default_gold_weight: Optional[float] = None
    default_making_charge: Optional[float] = None
    gst_percent: Optional[float] = None
    status: Optional[str] = None


# --- BILL ITEM ---
class BillItemBase(BaseModel):
    ornament_type: Optional[str] = None
    product_name: str
    quantity: int = 1
    weight_gold_g: float = 0.0
    rate_per_gram: float = 0.0
    MRP: float = 0.0
    making_charge: float = 0.0
    discount: float = 0.0 # Store line-item discount
    GST: float = 3.0 # GST percent (e.g. 3.0 for 3%)

class BillItemCreate(BillItemBase):
    pass

class BillItemResponse(BillItemBase):
    item_id: int
    item_total: float
    
    class Config:
        from_attributes = True


# --- BILL ---
class BillCreate(BaseModel):
    customer_name: str
    phone_number: str
    company_name: Optional[str] = "Prasanth Jewellery"
    date: Optional[datetime] = None
    discount: Optional[float] = 0.0
    items: List[BillItemCreate]

class BillResponse(BaseModel):
    bill_id: int
    purchase_id: str
    customer_name: str
    phone_number: str
    company_name: str
    date: datetime
    subtotal: float
    discount: float
    total_amount: float
    created_by: int
    creator_username: Optional[str] = None
    creator_name: Optional[str] = None
    items: List[BillItemResponse]
    
    class Config:
        from_attributes = True


# --- REPORTS KPI ---
class DashboardKPI(BaseModel):
    total_sales: float
    bills_count: int
    customers_count: int
    recent_bills: List[BillResponse]

class MetalRateCreate(BaseModel):
    gold_24k: float
    gold_22k: float
    gold_18k: float
    silver: float
    platinum: float

class MetalRateResponse(BaseModel):
    rate_id: int
    gold_24k: float
    gold_22k: float
    gold_18k: float
    silver: float
    platinum: float
    updated_at: datetime
    updated_by_id: Optional[int] = None
    
    class Config:
        from_attributes = True
