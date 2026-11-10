# AURELIA RESTAURANT OS - SYSTEM ARCHITECTURE

## 1. System Overview
**Aurelia Restaurant OS** is a multi-tenant hospitality operating system engineered for fine-dining restaurants, cafes, food courts, and fast-food chains. It bridges the customer ordering experience directly to kitchen operations, floor service staff, and executive analytics via persistent transactional databases and real-time WebSocket communication.

```
+-----------------------------------------------------------------------------------+
|                                  CLIENT LAYER                                     |
|  +--------------------+   +-------------------+   +----------------------------+  |
|  |  Customer Phone    |   |  Kitchen Display  |   |  Owner & Waiter Consoles   |  |
|  |  (QR Table Order)  |   |  (Tablet/Monitor) |   |  (Laptop/Mobile Dashboard) |  |
|  +--------------------+   +-------------------+   +----------------------------+  |
+-----------------------------------------------------------------------------------+
                                         |
                       HTTP REST APIs & WebSockets (/ws)
                                         |
+-----------------------------------------------------------------------------------+
|                                 APPLICATION LAYER                                 |
|                              FastAPI Python 3.11+                                 |
|                                                                                   |
|  [Security & Auth]        [Tenant Guard]           [Authoritative Pricing Engine] |
|  JWT & Bcrypt            Server-Side Scoping       Recalculates Subtotal, Taxes,   |
|  Role-Based Access       Strict Tenant DB Filters  Addons & Service Charges       |
|                                                                                   |
|  [WebSocket Room Manager] [Table Session Controller] [Audit Trail Engine]         |
|  Tenant broadcast &       Cryptographic Tokens &     Every privileged action      |
|  Customer order streams   Physical Table PINs        recorded immutably           |
+-----------------------------------------------------------------------------------+
                                         |
                               SQLAlchemy 2.0 ORM
                                         |
+-----------------------------------------------------------------------------------+
|                                  DATA LAYER                                       |
|  PostgreSQL 15+ (Production) / SQLite 3.40+ (Zero-Setup Dev & Unit Testing)        |
|                                                                                   |
|  Tables: restaurants, restaurant_settings, users, menu_categories, menu_items,   |
|          menu_item_variants, menu_addons, restaurant_tables, orders, order_items, |
|          order_item_addons, order_status_history, audit_logs                      |
+-----------------------------------------------------------------------------------+
```

---

## 2. Multi-Tenant Architecture & Data Isolation

### Strict Tenant Boundary Enforcement
1. **Server-Side Scope Resolution:**
   Every incoming privileged request verifies the authenticated user's JWT token. The user's `restaurant_id` is derived strictly from the server-validated session, never trusted from client parameters.
2. **Database Queries:**
   Every query for tables, categories, menu items, orders, staff, and analytics enforces `WHERE restaurant_id = :authenticated_restaurant_id`.
3. **Automated Isolation Verification:**
   Automated integration test suites (`test_tenant_data_isolation`) verify that User A belonging to Restaurant Alpha cannot read, mutate, or listen to records from Restaurant Beta.

---

## 3. Authoritative Pricing & Order Creation
- Client-submitted totals, prices, discounts, and taxes are **completely ignored**.
- Line items submit only `menu_item_id`, `quantity`, `variant_name`, and `addons`.
- The server retrieves unit prices directly from the persistent database, adds validated variant modifiers and add-on costs, applies configured restaurant tax rates and service charges, and executes order creation inside an atomic database transaction.
- Line items store frozen snapshots of item names and unit prices so that historical revenue records remain permanent even if dishes are later edited or archived.

---

## 4. Real-Time Communication & WebSockets
- Kitchen and waiter displays subscribe to `/ws/restaurant/{restaurant_id}`.
- Individual customer devices subscribe to `/ws/order/{order_id}`.
- WebSockets deliver immediate status updates (`NEW_ORDER`, `ORDER_STATUS_UPDATED`, `ORDER_PAYMENT_UPDATED`).
- Clients maintain automatic exponential reconnection logic with HTTP polling fallback to ensure operational continuity under network disruptions.
