# AURELIA RESTAURANT OS - REST & WEBSOCKET API GUIDE

Interactive Swagger UI documentation is served automatically at `http://localhost:8000/docs` and Redoc at `http://localhost:8000/redoc`.

---

## 1. Authentication Endpoints

### `POST /api/v1/auth/login`
Authenticates restaurant staff or owners and returns a signed JWT Bearer token.
- **Request Body:**
  ```json
  {
    "email": "owner@royalsaffron.com",
    "password": "AureliaPass123!"
  }
  ```
- **Response:**
  ```json
  {
    "access_token": "eyJhbGciOiJIUz...",
    "token_type": "bearer",
    "user": {
      "id": "usr-101",
      "email": "owner@royalsaffron.com",
      "full_name": "Vikramaditya Rathore",
      "role": "RESTAURANT_OWNER",
      "restaurant_id": "res-901"
    }
  }
  ```

---

## 2. Public Customer Endpoints (Zero Auth Required)

### `GET /api/v1/public/restaurant/{slug}`
Retrieves public brand details, opening hours, active menu categories, and available food items.

### `GET /api/v1/public/validate-table/{slug}/{qr_token}`
Validates cryptographic table QR token and confirms if the dine-in ordering session is currently active.

### `POST /api/v1/public/order`
Submits a guest order from a validated table. Authoritatively calculates subtotal, taxes, and service charges.
- **Request Body:**
  ```json
  {
    "restaurant_slug": "royal-saffron",
    "qr_token": "2eLHtPAlFUQRIHF2RN0YkzjKd97m5cAb",
    "session_pin": "1041",
    "customer_name": "Rohan Mehra",
    "customer_phone": "+91 99001 22334",
    "special_notes": "Celebrating anniversary",
    "items": [
      {
        "menu_item_id": "item-galouti-id",
        "quantity": 1,
        "variant_name": "Grand Platter (8 pcs)",
        "addons": [
          { "addon_id": "addon-dip-id", "name": "Extra Mint Dip", "unit_price": 60 }
        ]
      }
    ],
    "idempotency_key": "order-1712984029-abc"
  }
  ```

### `GET /api/v1/public/order/{order_id}`
Retrieves real-time status and line items for an active customer order.

---

## 3. Kitchen Display System (KDS)

### `GET /api/v1/kitchen/orders`
Retrieves all active tickets in `NEW`, `ACCEPTED`, `PREPARING`, or `READY` statuses.

### `POST /api/v1/kitchen/orders/{order_id}/status`
Advances ticket status along valid transitions:
`NEW` -> `ACCEPTED` -> `PREPARING` -> `READY` -> `SERVED` (or `CANCELLED`).

---

## 4. WebSockets

- **Restaurant Operations Stream:**
  `ws://localhost:8000/ws/restaurant/{restaurant_id}?token={jwt_token}`
  Broadcasts `NEW_ORDER`, `ORDER_STATUS_UPDATED`, and `ORDER_PAYMENT_UPDATED`.

- **Customer Live Order Tracker Stream:**
  `ws://localhost:8000/ws/order/{order_id}`
  Streams status transitions directly to the diner's device.
