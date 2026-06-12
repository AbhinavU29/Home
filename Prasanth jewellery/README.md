# Prasanth Jewellery Management System

A premium, elegant, and secure full-stack jewelry management showroom web application and management system for **Prasanth Jewellery**. The styling utilizes a luxury **Gold-White-Black** color theme, smooth micro-animations, and clean typography.

---

## 🚀 Key Features Implemented

1. **Dashboard Ticker**: Ambient rolling marquee highlighting live commodity metal rates.
2. **Bullion Rates Configurator**: Instant live update of rates (24K Gold, 22K Gold, 18K Gold, Silver, Platinum) directly affecting billing calculators.
3. **Advanced POS Billing**:
   - Live barcode scan lookup (auto-loads stock item parameters).
   - Dynamic weight calculation ($Net Weight = Gross Weight - Stone Weight - Bead Weight$).
   - Price calculation containing Metal value, Fixed/Percentage making charges, and Wastage multipliers.
   - 3% GST calculation and Discounts.
   - Multi-Payment split configuration (Cash, UPI, Card, Old Gold).
4. **India Tax Compliance**: Automatically triggers warning alerts and blocks transaction generation above ₹2 Lakhs (₹2,00,000 INR) if the customer lacks a valid PAN Card.
5. **Printable Stocks Tags**: Barcode and QR code tag generation printable from the inventory catalog panel.
6. **CRM & chit funds**:
   - Customer profile registry with ANNIVERSARY / BIRTHDAY / RING SIZE details.
   - Old Gold Exchange trade-in valuations and verification voucher generations.
   - Savings Chit Fund ("Swarna Nidhi") scheme deposit ledger and maturity trackers.
7. **Consolidated Audits & Reports**:
   - Daily Daybook closures.
   - Profit and Loss estimations.
   - Export Excel transaction logs.

---

## 🛠️ Tech Stack & Architecture

- **Backend**: Python FastAPI, REST API routers, SQLAlchemy ORM, SQLite (local development fallback) / PostgreSQL (production docker-compose), ReportLab (PDF invoices), python-barcode & qrcode (scanning tags).
- **Frontend**: React, Vite, Tailwind CSS, Lucide icons, Recharts analytics, Axios client, HTML5 Semantics.
- **Orchestration**: Docker & Nginx.

---

## 🔐 Credentials for Demo & Testing

Initial roles and user accounts have been seeded automatically on startup:

| Username | Security Password | Assigned Role | Capabilities |
| :--- | :--- | :--- | :--- |
| **`admin`** | `admin123` | **Admin** | Access to all dashboards, charts, rate setting, user additions, deletion of stock |
| **`manager`** | `manager123` | **Manager** | View statistics, CRM logs, Chit payments, rate setting |
| **`billing`** | `billing123` | **Billing Staff** | POS Billing calculator, Customer creation, log Chit payments |
| **`inventory`** | `inventory123` | **Inventory Staff** | Catalog & Stock additions, print barcode tags |

---

## ⚙️ Running Locally (Docker Compose)

The easiest way to run the entire stack (database, APIs, frontend) is using Docker Compose:

```bash
docker-compose up --build
```

- **Showroom Web portal**: `http://localhost:5173`
- **FastAPI backend docs**: `http://localhost:8000/docs`

---

## 💻 Alternative Running (Manual Step-by-Step)

If you prefer to run the applications directly in your host shell:

### 1. Start backend:
```bash
cd backend
python -m venv venv
# Windows powershell:
.\venv\Scripts\Activate.ps1
# Mac/Linux:
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload
```
*Note: SQLite database (`jewellery.db`) will automatically initialize and seed in the root directory.*

### 2. Start frontend:
```bash
cd frontend
npm install
npm run dev
```
Navigate to `http://localhost:5173` to test.
