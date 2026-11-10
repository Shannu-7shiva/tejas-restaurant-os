# 🍽️ AURELIA RESTAURANT OS
### Next-Generation Multi-Tenant Real-Time Restaurant Operating System

[![Backend Tests](https://img.shields.io/badge/pytest-8%20passed-emerald)](file:///backend/app/tests/test_api.py)
[![Frontend Build](https://img.shields.io/badge/vite-build%20passing-teal)](file:///frontend/dist)
[![Python](https://img.shields.io/badge/Python-3.11+-blue)](https://www.python.org/)
[![React](https://img.shields.io/badge/React-18%20%7C%20TypeScript-blue)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v3.4-06B6D4)](https://tailwindcss.com/)

Aurelia Restaurant OS is a full-featured, production-ready SaaS operating system designed for fine-dining restaurants, cafes, food courts, and hospitality chains. It connects the customer table QR ordering journey directly to kitchen display systems (KDS), floor waiter terminals, and executive revenue dashboards with real-time WebSockets and persistent databases.

---

## 🌟 Key Features

### 1. Customer Table QR Ordering Experience (`/order/:slug/:token`)
- **Frictionless Guest Ordering:** Diners scan a table QR code and instantly browse the rich menu without mandatory account creation.
- **Cryptographic Security:** Tables use unguessable 24-byte tokens (`secrets.token_urlsafe(24)`) with optional 4-digit physical presence verification PINs.
- **Dietary & Allergen Filtering:** Instant switches for Pure Veg (🌱) and Non-Veg (🍗), plus prominent allergen tags (Dairy, Nuts, Gluten).
- **Customization Modal:** Choose portions/variants, select add-ons (with prices in ₹), and provide chef instructions.
- **Authoritative Server Pricing:** Prices, taxes, and service charges submitted by the browser are completely disregarded; the server authoritatively recalculates totals in database transactions.
- **Live Real-Time Order Tracking (`/order/status/:orderId`):** Watch the ticket advance in real-time: `Received` → `Accepted` → `Cooking` → `Plated & Ready` → `Served at Table`.

### 2. Live Kitchen Display System (KDS) (`/kitchen`)
- **Tablet & Display Optimized:** High-contrast dark mode interface for hot kitchen environments.
- **Instant WebSockets Delivery:** New orders chime with an audible brass harmonic bell (synthesized via browser Web Audio API, zero external MP3 dependencies).
- **Elapsed Timers:** Tickets track waiting minutes with color-coded urgency.
- **Strict Valid Status Transitions:** `NEW` → `ACCEPTED` → `PREPARING` → `READY` → `SERVED`.

### 3. Service Staff & Waiter Console (`/service`)
- **Mobile-First Layout:** Touch-optimized for floor waiters.
- **"Ready to Serve" Alert Queue:** Highlights hot food waiting on the kitchen pass for immediate pickup.
- **Table Occupancy Turnover:** Toggle table states between `AVAILABLE`, `OCCUPIED`, and `CLEANING`.

### 4. Executive Owner Dashboard (`/dashboard`)
- **Real-Time Revenue Analytics:** Distinguishes settled revenue (PAID) from placed order gross. Displays average order value, popular item rankings, and hourly order trends.
- **Menu Management (`/dashboard/menu`):** Create/edit categories, configure variants and add-ons, toggle live stock out-of-stock switches, and safely archive items without breaking historical orders.
- **Table & QR Management (`/dashboard/tables`):** Generate tables, preview QR codes, download high-res PNGs, and print table tent cards directly to your printer.
- **Order Management (`/dashboard/orders`):** Filter by status or payment, view timestamped audit histories, authorize cancellations, and export records to CSV.
- **Staff Team (`/dashboard/staff`):** Role-based access control for Restaurant Managers, Kitchen Chefs, and Service Waiters.

---

## 🏗️ Technology Stack

| Domain | Technology |
|---|---|
| **Backend** | Python 3.11+, FastAPI, Pydantic v2, Uvicorn, WebSockets |
| **Database** | SQLAlchemy 2.0 ORM, PostgreSQL (Production) / SQLite (Dev & Tests) |
| **Security** | Bcrypt password hashing, PyJWT, Python `secrets` CSPRNG, Role-Based Access Control |
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Lucide React, TanStack Query |
| **Aesthetics** | Warm Ivory surfaces (`#FAF7F2`), Deep Charcoal (`#0B0F17`), Emerald & Teal accents (`#0D9488`), Gold highlights (`#D97706`), Google Fonts (Cinzel, Playfair Display, Plus Jakarta Sans) |
| **DevOps** | Docker, Docker Compose, Nginx Reverse Proxy, Automated Pytest Suite |

---

## 📂 Project Structure

```
restarant project/
├── backend/
│   ├── app/
│   │   ├── api/v1/         # Routers: auth, public, kitchen, menu, tables, orders, analytics, staff, settings
│   │   ├── core/           # Security (bcrypt, JWT), Config, Database engine
│   │   ├── models/         # SQLAlchemy models (User, Restaurant, Table, Menu, Order, AuditLog)
│   │   ├── schemas/        # Pydantic v2 validation models
│   │   ├── services/       # Authoritative pricing & validation logic
│   │   ├── websocket/      # ConnectionManager room dispatcher
│   │   ├── tests/          # Pytest automated test suite (8 tests)
│   │   ├── main.py         # FastAPI application entry point
│   │   └── seed.py         # Realistic demo seed script (Royal Saffron & Aurelia Bistro)
│   ├── requirements.txt    # Python dependencies
│   └── Dockerfile          # Backend container specification
├── frontend/
│   ├── src/
│   │   ├── components/     # UI Badges, Modals, Navigation
│   │   ├── contexts/       # AuthContext, CartContext
│   │   ├── layouts/        # Dashboard responsive layout with charcoal sidebar
│   │   ├── pages/          # CustomerOrderPage, OrderStatusTrackerPage, KDS, Waiter, Dashboard
│   │   ├── services/       # Typed API client
│   │   ├── types/          # Full TypeScript definitions
│   │   ├── utils/          # Web Audio chime, formatting
│   │   ├── App.tsx         # Route definitions and role guards
│   │   └── main.tsx        # React root
│   ├── package.json
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   └── Dockerfile
├── deployment/
│   ├── docker-compose.yml  # Multi-container orchestration (DB, Backend, Frontend)
│   └── nginx.conf          # Reverse proxy and WebSocket forwarding
├── docs/                   # Full documentation suite
│   ├── architecture.md
│   ├── api-guide.md
│   ├── database-design.md
│   ├── security.md
│   ├── restaurant-user-guide.md
│   ├── deployment-guide.md
│   ├── backup-and-recovery.md
│   └── troubleshooting.md
├── .env.example            # Environment template
└── README.md
```

---

## 🚀 Local Development & Quick Start

### 1. Backend Setup
In a terminal, navigate to the `backend` folder:
```powershell
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
python -m app.seed
uvicorn app.main:app --reload --port 8000
```
- API will start at: `http://localhost:8000`
- Interactive OpenAPI Docs: `http://localhost:8000/docs`

### 2. Frontend Setup
In a second terminal, navigate to the `frontend` folder:
```powershell
cd frontend
npm install
npm run dev
```
- Web Application will start at: `http://localhost:5173`

---

## 🔑 Demo Accounts & Quick Evaluation

The login page at `http://localhost:5173/login` features convenient **1-Click Demo Profile buttons**:

| Role | Email | Password | Scope & Experience |
|---|---|---|---|
| 👑 **Restaurant Owner** | `owner@royalsaffron.com` | `shiva123` | Full control of *The Royal Saffron*, analytics, menu, staff, and tables |
| 👨‍🍳 **Executive Chef** | `chef@royalsaffron.com` | `AureliaPass123!` | Instant launch into the **Kitchen Display System** (`/kitchen`) |
| 🛎️ **Floor Waiter** | `service@royalsaffron.com` | `AureliaPass123!` | Instant launch into **Waiter Console** (`/service`) |
| 🥐 **Bistro Owner** | `owner@aureliabistro.com` | `shiva123` | *Tenant B* isolation verification (cannot see Royal Saffron data) |
| ⚙️ **Platform Admin** | `admin@aureliaos.com` | `AdminMaster2026!` | Global SaaS platform oversight |

### 📱 Customer Table QR Direct Links:
- **The Royal Saffron (Table 1):**
  `http://localhost:5173/order/royal-saffron/2eLHtPAlFUQRIHF2RN0YkzjKd97m5cAb`

---

## 🧪 Automated Testing

### Backend Test Suite (Pytest)
```powershell
cd backend
.\venv\Scripts\pytest
```
**Results:** `8 passed in ~9s`
- `test_login_success`
- `test_login_invalid_password`
- `test_tenant_data_isolation` (verifies Tenant A cannot access Tenant B)
- `test_qr_token_validation` (verifies valid tokens, invalid tokens, and closed table sessions)
- `test_server_side_price_calculation_and_order_creation` (validates authoritative totals, taxes, and service charges)
- `test_unavailable_item_order_rejected` (rejects dishes marked out of stock by kitchen)
- `test_kitchen_order_status_transitions` (enforces strict valid state machines)
- `test_unauthorized_staff_management_rejection` (validates RBAC permissions)

### Frontend Production Build
```powershell
cd frontend
npm run build
```
**Results:** `✓ 1624 modules transformed. Zero TypeScript or Vite bundle errors.`
