import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.core.database import Base, get_db
from app.core.security import get_password_hash, create_access_token
from app.models.all_models import (
    User, UserRole, Restaurant, RestaurantSettings, MenuCategory, MenuItem,
    RestaurantTable, TableStatus, Order, OrderStatus, PaymentStatus
)

import os
from sqlalchemy.pool import StaticPool

# In-memory with StaticPool or dedicated test database
TEST_DB_FILE = "./test_aurelia.db"
SQLALCHEMY_DATABASE_URL = f"sqlite:///{TEST_DB_FILE}"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_database():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()

    # Create Restaurant A
    res_a = Restaurant(
        id="res-a-id",
        name="Restaurant Alpha",
        slug="alpha",
        is_active=True
    )
    db.add(res_a)
    db.add(RestaurantSettings(restaurant_id="res-a-id", tax_rate_percent=5.0, service_charge_percent=5.0))

    # Create Restaurant B
    res_b = Restaurant(
        id="res-b-id",
        name="Restaurant Beta",
        slug="beta",
        is_active=True
    )
    db.add(res_b)
    db.add(RestaurantSettings(restaurant_id="res-b-id", tax_rate_percent=5.0, service_charge_percent=0.0))

    # Users
    owner_a = User(
        id="owner-a-id",
        email="owner@alpha.com",
        hashed_password=get_password_hash("Password123!"),
        full_name="Alpha Owner",
        role=UserRole.RESTAURANT_OWNER,
        restaurant_id="res-a-id",
        is_active=True
    )
    db.add(owner_a)

    owner_b = User(
        id="owner-b-id",
        email="owner@beta.com",
        hashed_password=get_password_hash("Password123!"),
        full_name="Beta Owner",
        role=UserRole.RESTAURANT_OWNER,
        restaurant_id="res-b-id",
        is_active=True
    )
    db.add(owner_b)

    kitchen_a = User(
        id="kitchen-a-id",
        email="kitchen@alpha.com",
        hashed_password=get_password_hash("Password123!"),
        full_name="Alpha Kitchen",
        role=UserRole.KITCHEN_STAFF,
        restaurant_id="res-a-id",
        is_active=True
    )
    db.add(kitchen_a)

    # Tables in A
    table_a = RestaurantTable(
        id="table-a-1",
        restaurant_id="res-a-id",
        table_number="T-1",
        capacity=4,
        status=TableStatus.AVAILABLE,
        qr_token="token-valid-alpha-1",
        is_session_active=True
    )
    db.add(table_a)

    # Closed session table in A
    table_closed = RestaurantTable(
        id="table-a-closed",
        restaurant_id="res-a-id",
        table_number="T-2",
        capacity=2,
        status=TableStatus.AVAILABLE,
        qr_token="token-closed-session",
        is_session_active=False
    )
    db.add(table_closed)

    # Menu items in A
    cat_a = MenuCategory(
        id="cat-a-1",
        restaurant_id="res-a-id",
        name="Mains"
    )
    db.add(cat_a)

    item_available = MenuItem(
        id="item-available-id",
        restaurant_id="res-a-id",
        category_id="cat-a-1",
        name="Truffle Pasta",
        price=500.0,
        is_available=True,
        is_archived=False
    )
    db.add(item_available)

    item_unavailable = MenuItem(
        id="item-unavailable-id",
        restaurant_id="res-a-id",
        category_id="cat-a-1",
        name="Lobster Bisque",
        price=800.0,
        is_available=False,
        is_archived=False
    )
    db.add(item_unavailable)

    db.commit()
    db.close()

    yield

    Base.metadata.drop_all(bind=engine)

def get_auth_header(user_id: str, role: str, restaurant_id: str):
    token = create_access_token(user_id, claims={"role": role, "restaurant_id": restaurant_id})
    return {"Authorization": f"Bearer {token}"}

# Tests
def test_login_success():
    response = client.post("/api/v1/auth/login", json={
        "email": "owner@alpha.com",
        "password": "Password123!"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["role"] == "RESTAURANT_OWNER"
    assert data["user"]["restaurant_id"] == "res-a-id"

def test_login_invalid_password():
    response = client.post("/api/v1/auth/login", json={
        "email": "owner@alpha.com",
        "password": "WrongPassword!"
    })
    assert response.status_code == 401

def test_tenant_data_isolation():
    """Verify that Owner of Restaurant A CANNOT see or access Restaurant B's menu or tables."""
    headers_a = get_auth_header("owner-a-id", "RESTAURANT_OWNER", "res-a-id")
    response = client.get("/api/v1/tables", headers=headers_a)
    assert response.status_code == 200
    tables = response.json()
    # All tables returned MUST belong to Restaurant A
    for t in tables:
        assert t["restaurant_id"] == "res-a-id"
        assert t["restaurant_id"] != "res-b-id"

def test_qr_token_validation():
    # Valid token
    resp = client.get("/api/v1/public/validate-table/alpha/token-valid-alpha-1")
    assert resp.status_code == 200
    assert resp.json()["valid"] is True
    assert resp.json()["table"]["table_number"] == "T-1"

    # Revoked / non-existent token
    resp_invalid = client.get("/api/v1/public/validate-table/alpha/non-existent-fake-token")
    assert resp_invalid.status_code == 200
    assert resp_invalid.json()["valid"] is False

    # Inactive / closed session token
    resp_closed = client.get("/api/v1/public/validate-table/alpha/token-closed-session")
    assert resp_closed.status_code == 200
    assert resp_closed.json()["valid"] is False

def test_server_side_price_calculation_and_order_creation():
    payload = {
        "restaurant_slug": "alpha",
        "qr_token": "token-valid-alpha-1",
        "customer_name": "Test Customer",
        "items": [
            {
                "menu_item_id": "item-available-id",
                "quantity": 2
            }
        ]
    }
    response = client.post("/api/v1/public/order", json=payload)
    assert response.status_code == 200
    data = response.json()
    # Authoritative calculation: 500 * 2 = 1000 subtotal
    # Tax: 5% of 1000 = 50
    # Service charge: 5% of 1000 = 50
    # Total: 1100
    assert data["subtotal"] == 1000.0
    assert data["tax_amount"] == 50.0
    assert data["service_charge"] == 50.0
    assert data["total_amount"] == 1100.0
    assert data["status"] == "NEW"

def test_unavailable_item_order_rejected():
    payload = {
        "restaurant_slug": "alpha",
        "qr_token": "token-valid-alpha-1",
        "customer_name": "Test Customer",
        "items": [
            {
                "menu_item_id": "item-unavailable-id",
                "quantity": 1
            }
        ]
    }
    response = client.post("/api/v1/public/order", json=payload)
    assert response.status_code == 400
    assert "out of stock" in response.json()["detail"].lower()

def test_kitchen_order_status_transitions():
    # 1. Place order
    order_res = client.post("/api/v1/public/order", json={
        "restaurant_slug": "alpha",
        "qr_token": "token-valid-alpha-1",
        "items": [{"menu_item_id": "item-available-id", "quantity": 1}]
    }).json()
    order_id = order_res["id"]

    headers_kitchen = get_auth_header("kitchen-a-id", "KITCHEN_STAFF", "res-a-id")

    # Valid: NEW -> ACCEPTED
    res1 = client.post(f"/api/v1/kitchen/orders/{order_id}/status", json={"status": "ACCEPTED"}, headers=headers_kitchen)
    assert res1.status_code == 200
    assert res1.json()["status"] == "ACCEPTED"

    # Valid: ACCEPTED -> PREPARING
    res2 = client.post(f"/api/v1/kitchen/orders/{order_id}/status", json={"status": "PREPARING"}, headers=headers_kitchen)
    assert res2.status_code == 200
    assert res2.json()["status"] == "PREPARING"

    # Invalid jump: PREPARING -> SERVED (must be READY first)
    res_invalid = client.post(f"/api/v1/kitchen/orders/{order_id}/status", json={"status": "SERVED"}, headers=headers_kitchen)
    assert res_invalid.status_code == 400

def test_unauthorized_staff_management_rejection():
    """Kitchen staff or unauthorized roles cannot invite staff."""
    headers_kitchen = get_auth_header("kitchen-a-id", "KITCHEN_STAFF", "res-a-id")
    resp = client.post("/api/v1/staff", json={
        "email": "hack@alpha.com",
        "password": "Password123!",
        "full_name": "Hacked",
        "role": "RESTAURANT_MANAGER"
    }, headers=headers_kitchen)
    assert resp.status_code == 403

def test_customer_online_payment_flow():
    """Customer can pay their order directly from mobile phone via UPI or Card."""
    order_res = client.post("/api/v1/public/order", json={
        "restaurant_slug": "alpha",
        "qr_token": "token-valid-alpha-1",
        "items": [{"menu_item_id": "item-available-id", "quantity": 2}],
        "customer_name": "Amit Shah"
    }).json()
    order_id = order_res["id"]
    assert order_res["payment_status"] == "UNPAID"

    # Customer pays via UPI
    pay_res = client.post(f"/api/v1/public/order/{order_id}/pay", json={
        "payment_method": "UPI",
        "transaction_id": "UPI-TEJAS-9821038",
        "tip_amount": 50.0
    })
    assert pay_res.status_code == 200
    data = pay_res.json()
    assert data["payment_status"] == "PAID"
    assert data["payment_method"] == "UPI"

def test_customer_call_waiter_endpoint():
    """Customer can alert table waiter from mobile phone."""
    resp = client.post("/api/v1/public/restaurant/alpha/call-waiter", json={
        "table_number": "Table 1",
        "request_type": "WATER",
        "notes": "Extra chilled water please"
    })
    assert resp.status_code == 200
    assert resp.json()["success"] is True

def test_tejas_ai_concierge_assistant():
    """Customer can chat with AI Help Desk for food recommendations, spice queries, and waiter calling."""
    # Test veg recommendations
    resp_veg = client.post("/api/v1/public/restaurant/alpha/ai-assistant", json={
        "prompt": "Can you recommend pure vegetarian dishes?",
        "table_number": "Table 1"
    })
    assert resp_veg.status_code == 200
    assert "Vegetarian" in resp_veg.json()["reply"]

    # Test waiter call trigger
    resp_waiter = client.post("/api/v1/public/restaurant/alpha/ai-assistant", json={
        "prompt": "Can you please call our waiter to bring extra napkins?",
        "table_number": "Table 1"
    })
    assert resp_waiter.status_code == 200
    assert resp_waiter.json().get("action_taken") == "WAITER_CALLED"
