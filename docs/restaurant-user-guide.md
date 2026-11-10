# AURELIA RESTAURANT OS - RESTAURANT USER GUIDE

## 1. Onboarding & Initial Setup
1. Log into your Aurelia OS dashboard at `http://localhost:5173/login`.
2. Navigate to **Settings** (`/dashboard/settings`) to configure:
   - Restaurant Name, Address, and Culinary Story.
   - Logo & Cover Banner imagery.
   - GST / VAT tax rate (%) and optional service charges (%).

---

## 2. Table Setup & QR Printing
1. Go to **Tables & QR** (`/dashboard/tables`).
2. Click **Add Dining Table** and specify the table name (e.g. `Table 1`, `Terrace 4`) and guest seating capacity.
3. Click **View QR Code** on any table.
4. You can:
   - **Download PNG** for graphic design tent cards.
   - Click **Print Table Card** to print an elegant, hospitality-formatted table tent directly on your printer.
5. If customers leave or table service concludes, you can close or reopen the table ordering session at any time.

---

## 3. Managing Menu & Live Out-of-Stock Toggles
1. Go to **Menu Catalog** (`/dashboard/menu`).
2. Create food categories (e.g. *Royal Small Plates*, *Clay Oven Tandoor*, *Artisanal Breads*).
3. Create dishes specifying price, vegetarian flag, and allergens.
4. **Instant Stock Availability:** If a dish runs out during a dinner rush, toggle **"In Stock"** to **"Out of Stock"**. It will immediately disappear from customer ordering screens.

---

## 4. Kitchen Operations (KDS)
1. Mount a tablet, touchscreen, or laptop in the kitchen and open `/kitchen`.
2. Incoming tickets will produce an audible brass bell chime and display the table number, order number, line items, variants, and customer special notes.
3. Advance ticket state:
   - **Accept Order** -> **Start Cooking** -> **Mark Ready to Serve**.
4. When marked *Ready to Serve*, floor waiters are notified instantly.

---

## 5. Floor Service & Waiter Console
1. Waiters on mobile devices access `/service`.
2. The top alert queue highlights hot food waiting on the pass.
3. Once delivered, tap **"Confirm Delivered to Table"**.
4. The table occupancy grid allows waiters to mark tables as **OCCUPIED**, **CLEANING**, or **READY**.

---

## 6. Settle Payments & Order History
1. In **Orders** (`/dashboard/orders`), view placed tickets.
2. When guests ask for the bill, click **Record Payment** (Cash, UPI, or Card).
3. Export full records at any time via **Export Orders CSV**.
