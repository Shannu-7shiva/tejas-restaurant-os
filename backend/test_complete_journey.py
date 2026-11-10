import urllib.request
import urllib.parse
import json
import time

BASE_URL = "http://127.0.0.1:8000"

def req(path, method="GET", data=None, headers=None):
    if headers is None:
        headers = {}
    url = f"{BASE_URL}{path}"
    body = None
    if data is not None:
        body = json.dumps(data).encode("utf-8")
        headers["Content-Type"] = "application/json"
    
    request = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(request) as response:
            res_body = response.read().decode("utf-8")
            return json.loads(res_body) if res_body else {}, response.status
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        print(f"HTTP ERROR {e.code} on {method} {path}: {err_body}")
        raise

print("==========================================================")
print("  TEJAS RESTAURANT OS - FULL END-TO-END VERIFICATION")
print("==========================================================")

# 1. Check API Health
health, _ = req("/api/health")
print(f"[1] HEALTH CHECK: {health['service']} v{health['version']} - Status: {health['status']}")

# 2. Register New Restaurant
t_now = int(time.time())
email = f"owner_tejas_{t_now}@tejasdining.com"
password = "Password123!"
reg_payload = {
    "restaurant_name": "Tejas Grand Palace",
    "owner_name": "Vikram Tejas",
    "email": email,
    "phone": "9876543210",
    "password": password,
    "category": "Fine Dining",
    "country": "India",
    "state": "Telangana",
    "city": "Hyderabad",
    "area": "Jubilee Hills",
    "address": "Plot 101, Road 36, Jubilee Hills",
    "postal_code": "500033"
}
reg_data, _ = req("/api/v1/register/restaurant", method="POST", data=reg_payload)
print(f"[2] RESTAURANT REGISTERED:")
print(f"    Slug          : {reg_data['slug']}")
print(f"    Restaurant ID : {reg_data['restaurant_id']}")
slug = reg_data["slug"]

# 3. Login as New Restaurant Owner
login_payload = {"email": email, "password": password}
login_data, _ = req("/api/v1/auth/login", method="POST", data=login_payload)
owner_token = login_data["access_token"]
auth_headers = {"Authorization": f"Bearer {owner_token}"}
print(f"[3] OWNER LOGGED IN:")
print(f"    Name       : {login_data['user']['full_name']}")
print(f"    Role       : {login_data['user']['role']}")
print(f"    Restaurant : {login_data['user']['restaurant']['name']}")

# 4. Create a Table
table_payload = {"table_number": "Table 12", "capacity": 4}
table_data, _ = req("/api/v1/tables", method="POST", data=table_payload, headers=auth_headers)
table_id = table_data["id"]
qr_token = table_data["qr_token"]
print(f"[4] TABLE CREATED:")
print(f"    Table Number : {table_data['table_number']}")
print(f"    QR Token     : {qr_token}")

# 5. Create Menu Category & Item
cat_payload = {"name": "Signature Specialties", "description": "Chef curated delicacies", "display_order": 1}
cat_data, _ = req("/api/v1/menu/categories", method="POST", data=cat_payload, headers=auth_headers)
cat_id = cat_data["id"]

item_payload = {
    "category_id": cat_id,
    "name": "Tejas Royal Biryani",
    "description": "Slow cooked fragrant dum biryani with royal spices",
    "price": 450.0,
    "is_veg": False,
    "is_available": True
}
item_data, _ = req("/api/v1/menu/items", method="POST", data=item_payload, headers=auth_headers)
item_id = item_data["id"]
print(f"[5] MENU ITEM CREATED:")
print(f"    Item  : {item_data['name']}")
print(f"    Price : Rs. {item_data['price']}")

# 6. Customer Validates Table QR Token
val_data, _ = req(f"/api/v1/public/validate-table/{slug}/{qr_token}")
assert val_data["valid"] is True, f"QR token not valid: {val_data}"
print(f"[6] CUSTOMER SCANNED QR:")
print(f"    Verified Table      : {val_data['table']['table_number']}")
print(f"    Verified Restaurant : {val_data['restaurant']['name']}")

# 7. Customer Places Order
order_payload = {
    "restaurant_slug": slug,
    "qr_token": qr_token,
    "customer_name": "Shiva Kumar",
    "customer_phone": "9988776655",
    "special_notes": "Please make it medium spicy, thank you!",
    "payment_method": "PAY_AT_COUNTER",
    "items": [
        {
            "menu_item_id": item_id,
            "quantity": 2,
            "selected_variant_id": None,
            "selected_addon_ids": [],
            "special_notes": "Extra crispy onions on top"
        }
    ]
}
order_data, _ = req("/api/v1/public/order", method="POST", data=order_payload)
order_id = order_data["id"]
order_number = order_data["order_number"]
print(f"[7] CUSTOMER PLACED ORDER:")
print(f"    Order Number : {order_number}")
print(f"    Total Amount : Rs. {order_data['total_amount']}")
print(f"    Status       : {order_data['status']}")

# 8. Kitchen Views Active Orders
kitchen_orders, _ = req("/api/v1/kitchen/orders", headers=auth_headers)
matching = [o for o in kitchen_orders if o["id"] == order_id]
assert len(matching) > 0, "New order not visible in kitchen!"
print(f"[8] KITCHEN DISPLAY SYSTEM:")
print(f"    Found Order {order_number} in Kitchen with status: {matching[0]['status']}")

# 9. Kitchen Accepts the Order (NEW -> ACCEPTED)
status_res, _ = req(f"/api/v1/kitchen/orders/{order_id}/status", method="POST", data={"status": "ACCEPTED"}, headers=auth_headers)
print(f"[9] KITCHEN ACCEPTED ORDER:")
print(f"    New Status: {status_res['status']}")

# 10. Kitchen Starts Preparing (ACCEPTED -> PREPARING)
prep_res, _ = req(f"/api/v1/kitchen/orders/{order_id}/status", method="POST", data={"status": "PREPARING"}, headers=auth_headers)
print(f"[10] KITCHEN PREPARING ORDER:")
print(f"     New Status: {prep_res['status']}")

# 11. Check Premium / Subscription Plans
plans, _ = req("/api/v1/subscription/plans")
print(f"[11] PREMIUM PLANS AVAILABLE ({len(plans)} plans):")
for p in plans:
    print(f"     * {p['name']} ({p['tier']}): Rs. {p['price_monthly']}/mo | Max Tables: {p['max_tables']} | Max Staff: {p['max_staff']}")

# 12. Check Restaurant Owner's Subscription Info
my_sub, _ = req("/api/v1/subscription/my", headers=auth_headers)
print(f"[12] CURRENT RESTAURANT SUBSCRIPTION:")
print(f"     Status : {my_sub.get('status')}")
print(f"     Plan   : {my_sub.get('plan_name')}")
print(f"     Trial  : {my_sub.get('days_remaining')} days remaining")

# 13. Super Admin Verification
admin_login, _ = req("/api/v1/auth/login", method="POST", data={"email": "admin@tejastechnologies.in", "password": "TejasAdmin2026!"})
admin_token = admin_login["access_token"]
admin_dash, _ = req("/api/v1/super-admin/dashboard", headers={"Authorization": f"Bearer {admin_token}"})
print(f"[13] SUPER ADMIN PLATFORM STATS:")
print(f"     Total Restaurants : {admin_dash['stats']['total_restaurants']}")
print(f"     Total Users       : {admin_dash['stats']['total_users']}")
print(f"     Total Orders      : {admin_dash['stats']['total_orders']}")

print("\n>>> ALL TESTS COMPLETED AND PASSED WITH 100% SUCCESS! <<<")
