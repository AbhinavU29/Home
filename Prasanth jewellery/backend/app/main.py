from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, date
from app.core.config import settings
from app.core.database import engine, Base, SessionLocal
from app.core.security import get_password_hash
from app.models.models import User, Customer, Bill, BillItem, Product
from app.api import auth, customers, bills, reports, products, import_data, metal_rates

# Initialize database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="APIs for Prasanth Jewellery Billing Web App",
    version="2.0.0"
)

# CORS headers
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers mounting
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(customers.router, prefix=settings.API_V1_STR)
app.include_router(bills.router, prefix=settings.API_V1_STR)
app.include_router(reports.router, prefix=settings.API_V1_STR)
app.include_router(products.router, prefix=settings.API_V1_STR)
app.include_router(import_data.router, prefix=settings.API_V1_STR)
app.include_router(metal_rates.router, prefix=settings.API_V1_STR)

@app.on_event("startup")
def seed_database():
    """
    Seeds initial system data on fresh database.
    Runs raw SQLite ALTER TABLE commands to dynamically patch schemas without migrations.
    """
    db = SessionLocal()
    try:
        # Check and alter schema for SQLite
        try:
            db.execute("ALTER TABLE bill_items ADD COLUMN ornament_type VARCHAR(50)")
            db.commit()
        except Exception:
            db.rollback()
            
        try:
            db.execute("ALTER TABLE users ADD COLUMN is_active INTEGER DEFAULT 1")
            db.commit()
        except Exception:
            db.rollback()

        try:
            db.execute("ALTER TABLE users ADD COLUMN failed_login_attempts INTEGER DEFAULT 0")
            db.commit()
        except Exception:
            db.rollback()

        try:
            db.execute("ALTER TABLE users ADD COLUMN locked_until DATETIME")
            db.commit()
        except Exception:
            db.rollback()
            
        try:
            db.execute("ALTER TABLE users ADD COLUMN full_name VARCHAR(100)")
            db.commit()
        except Exception:
            db.rollback()

        try:
            db.execute("ALTER TABLE users ADD COLUMN mobile_number VARCHAR(20)")
            db.commit()
        except Exception:
            db.rollback()
            
        # 1. Seed Users (Admin & Operator cashier)
        seeded_users = [
            ("admin", "admin123", "Admin", "System Administrator", "9876543210"),
            ("operator", "operator123", "Operator", "Operator Cashier", "9876543211")
        ]
        user_map = {}
        for username, password, role, full_name, mobile_number in seeded_users:
            user = db.query(User).filter(User.username == username).first()
            if not user:
                user = User(
                    username=username,
                    password=get_password_hash(password),
                    role=role,
                    full_name=full_name,
                    mobile_number=mobile_number
                )
                db.add(user)
                db.flush()
            else:
                if not user.full_name:
                    user.full_name = full_name
                if not user.mobile_number:
                    user.mobile_number = mobile_number
            user_map[username] = user.user_id
            
        db.commit()

        # Seed Products
        seeded_products = [
            ("Gold Ring 22K", "Ring", 5.5, 250.0, 3.0),
            ("Gold Chain 22K", "Chain", 10.0, 180.0, 3.0),
            ("Gold Bangle 22K", "Bangle", 8.0, 220.0, 3.0),
            ("Silver Anklet", "Anklet", 25.0, 45.0, 3.0)
        ]
        for name, ornament, weight, making, gst in seeded_products:
            prod = db.query(Product).filter(Product.product_name == name, Product.ornament_type == ornament).first()
            if not prod:
                prod = Product(
                    product_name=name,
                    ornament_type=ornament,
                    default_gold_weight=weight,
                    default_making_charge=making,
                    gst_percent=gst,
                    status="Active"
                )
                db.add(prod)
        db.commit()

        # 2. Seed Customers
        seeded_cust = [
            ("Abhinav Sharma", "9876543210", "123 Bazaar Road, Coimbatore"),
            ("Aditi Iyer", "9566224411", "45 Temple St, Pollachi")
        ]
        for name, phone, address in seeded_cust:
            cust = db.query(Customer).filter(Customer.phone_number == phone).first()
            if not cust:
                cust = Customer(
                    customer_name=name,
                    phone_number=phone,
                    address=address
                )
                db.add(cust)
        db.commit()

        # 3. Seed initial bill
        bill = db.query(Bill).first()
        if not bill:
            b1 = Bill(
                purchase_id="PJ202606010001",
                customer_name="Abhinav Sharma",
                phone_number="9876543210",
                company_name="Prasanth Jewellery",
                date=datetime(2026, 6, 1, 10, 0, 0),
                subtotal=46350.0,
                discount=500.0,
                total_amount=45850.0,
                created_by=user_map["admin"]
            )
            db.add(b1)
            db.flush()
            
            item1 = BillItem(
                bill_id=b1.bill_id,
                ornament_type="Ring",
                product_name="Gold Ring 22K",
                quantity=1,
                weight_gold_g=6.0,
                rate_per_gram=6600.0,
                MRP=5000.0,
                making_charge=180.0,
                discount=0.0,
                GST=3.0,
                item_total=46350.0
            )
            db.add(item1)
            db.commit()
            
        # Repair any missing, empty, or undefined purchase_id records in existing SQLite db
        bills_to_fix = db.query(Bill).all()
        for idx, b in enumerate(bills_to_fix):
            if not b.purchase_id or b.purchase_id == "undefined" or not b.purchase_id.startswith("PJ"):
                b_date = b.date or datetime.now()
                date_str = b_date.strftime("%Y%m%d")
                b.purchase_id = f"PJ{date_str}{str(idx + 1).zfill(4)}"
        db.commit()
            
    finally:
        db.close()

@app.get("/")
def read_root():
    return {"message": "Welcome to Prasanth Jewellery Billing API version 2.0 (Active & Seeded)"}
