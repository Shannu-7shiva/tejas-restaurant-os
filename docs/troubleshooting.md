# AURELIA RESTAURANT OS - OPERATIONAL TROUBLESHOOTING

## 1. WebSocket Reconnection / Disconnected Status
- **Symptom:** The header displays "Polling" instead of "Real-Time Sync".
- **Diagnosis:**
  - Verify that reverse proxies (Nginx / Cloudflare) have `Upgrade` and `Connection` headers properly passed.
  - Verify the backend process is running on port 8000.
- **Resolution:** Aurelia OS automatically polls the backend every 6-8 seconds even if WebSockets are temporarily blocked by corporate Wi-Fi or firewalls, ensuring zero lost orders.

---

## 2. Audio Chime Not Playing in Kitchen
- **Symptom:** New orders appear on screen, but no bell sound is heard.
- **Diagnosis:** Modern web browsers block automatic audio playback until the user has interacted with the page at least once.
- **Resolution:** Click anywhere on the Kitchen Display screen or toggle the "Chime Active" button on the top right.

---

## 3. Table QR Scanned by Guest Shows "Session Inactive"
- **Symptom:** Guest scans table QR and sees "This table's ordering session is currently closed."
- **Diagnosis:** Floor staff marked the table closed or cleaning after previous guests departed.
- **Resolution:** The waiter or manager can open **Tables & QR** in the dashboard and click **Open** on the table, immediately enabling guests to order.
