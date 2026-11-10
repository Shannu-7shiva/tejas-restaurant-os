# AURELIA RESTAURANT OS - DATABASE DESIGN SPECIFICATION

## Relational Entity Model

```
+----------------------------------------------------------------------------------------+
|                                      RESTAURANT                                        |
|  PK id (UUID) | name | slug (UNIQUE) | description | logo_url | address | currency     |
+----------------------------------------------------------------------------------------+
       |                                      |                                  |
       | 1:1                                  | 1:N                              | 1:N
       v                                      v                                  v
+-----------------------+              +--------------------+            +---------------+
|  RESTAURANT_SETTINGS  |              |    MENU_CATEGORY   |            |  REST_TABLE   |
|  PK id | tax_rate     |              |  PK id | name      |            |  PK id | num  |
|  service_charge_rate  |              |  display_order     |            |  capacity     |
|  table_pin_required   |              +--------------------+            |  qr_token     |
+-----------------------+                         |                      |  session_act  |
                                                  | 1:N                  +---------------+
                                                  v                              |
                                       +--------------------+                    |
                                       |     MENU_ITEM      |                    |
                                       |  PK id | name      |                    |
                                       |  price | is_veg    |                    |
                                       |  is_available      |                    |
                                       |  is_archived       |                    |
                                       +--------------------+                    |
                                         |                |                      |
                                    1:N  |           1:N  |                      |
                                         v                v                      |
                         +-------------------+   +------------------+            |
                         | MENU_ITEM_VARIANT |   |    MENU_ADDON    |            |
                         | PK id | name      |   | PK id | name     |            |
                         | price_modifier    |   | price            |            |
                         +-------------------+   +------------------+            |
                                                                                 |
                                                                            1:N  |
                                                                                 v
                                                                        +----------------+
                                                                        |     ORDER      |
                                                                        | PK id          |
                                                                        | order_number   |
                                                                        | status         |
                                                                        | subtotal       |
                                                                        | tax_amount     |
                                                                        | total_amount   |
                                                                        | payment_status |
                                                                        +----------------+
                                                                           |           |
                                                                      1:N  |      1:N  |
                                                                           v           v
                                                    +--------------------------+  +--------------------+
                                                    |        ORDER_ITEM        |  | ORDER_STATUS_HIST  |
                                                    | PK id | item_name (SNAP) |  | PK id | prev_stat  |
                                                    | unit_price (SNAP)        |  | new_stat | notes   |
                                                    | quantity | subtotal      |  | timestamp (UTC)    |
                                                    +--------------------------+  +--------------------+
                                                                 |
                                                            1:N  |
                                                                 v
                                                    +--------------------------+
                                                    |     ORDER_ITEM_ADDON     |
                                                    | PK id | addon_name (SNAP)|
                                                    | unit_price (SNAP)        |
                                                    +--------------------------+
```

---

## Key Constraints & Safe Archiving Rules

1. **Immutable Order Line Snapshots (`item_name`, `unit_price`):**
   When an item is added to an order, its name and unit price are recorded verbatim in `order_items`. If the restaurant later increases the menu item price from ₹500 to ₹580 or archives the dish, historical financial reporting remains unaltered.
2. **Safe Soft-Archiving (`is_archived = True`):**
   Deleting a menu item never issues a raw SQL `DELETE` that breaks historical foreign keys. Instead, items are flagged `is_archived = True`, immediately dropping off customer menus while maintaining historical integrity.
3. **Monetary Precision:**
   All monetary amounts are validated and stored using exact 2-decimal rounded floating values (or integer minor units in PostgreSQL), preventing floating-point rounding errors.
4. **Time Zones:**
   All internal timestamps are recorded in UTC (`datetime.now(timezone.utc)`) and formatted locally in the client browser.
