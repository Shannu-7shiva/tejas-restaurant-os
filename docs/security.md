# AURELIA RESTAURANT OS - SECURITY SPECIFICATION

## 1. Authentication & Session Management
- **Password Hashing:** Passwords are never stored in plaintext. Passwords use `bcrypt` with automatically generated per-user salts (`bcrypt.gensalt()`).
- **Token Signing:** Server issues HS256 signed JSON Web Tokens (JWT) containing user ID, role, and tenant restaurant ID.
- **Role-Based Access Control (RBAC):** Privileged operations enforce strict server-side checks. `KITCHEN_STAFF` cannot access revenue reports; `SERVICE_STAFF` cannot invite new administrators; `CUSTOMER` cannot advance kitchen statuses.

---

## 2. Cryptographic Table QR Tokens
- Sequential table IDs (e.g. `?table=1`) are **never** used as security tokens.
- Each dining table is provisioned with a 24-byte cryptographically secure unguessable random token generated using Python's `secrets.token_urlsafe(24)`.
- **Instant Revocation & Token Regeneration:** If a table's QR token is copied or compromised, management can click "Regenerate QR" in the dashboard. This immediately invalidates the old token.
- **Physical Presence Verification (PIN Protection):** For establishments requiring proof of physical presence at the table, management can enable `table_pin_required`. Customers must enter a 4-digit code provided on the table receipt or by their server before submitting orders.

---

## 3. Server-Side Authoritative Pricing
- The client browser is considered completely untrusted.
- Totals, tax percentages, item unit prices, and service charges sent by the frontend are discarded.
- All totals are recalculated from database records inside a database transaction before committing.

---

## 4. Audit Logging
Sensitive operations (`ORDER_CANCELLED`, `TABLE_QR_REGENERATED`, `STAFF_INVITED`, `PROFILE_UPDATED`, `PAYMENT_STATUS_UPDATED`) are written to the `audit_logs` table with user ID, restaurant tenant ID, entity ID, action name, and JSON details.
