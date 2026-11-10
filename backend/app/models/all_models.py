import uuid
from datetime import datetime, timezone
from enum import Enum
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text, Enum as SQLEnum, Index
)
from sqlalchemy.orm import relationship
from app.core.database import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

# ─── Enums ────────────────────────────────────────────────────────────────────

class UserRole(str, Enum):
    PLATFORM_ADMIN = "PLATFORM_ADMIN"
    RESTAURANT_OWNER = "RESTAURANT_OWNER"
    RESTAURANT_MANAGER = "RESTAURANT_MANAGER"
    KITCHEN_MANAGER = "KITCHEN_MANAGER"
    KITCHEN_STAFF = "KITCHEN_STAFF"
    SERVICE_STAFF = "SERVICE_STAFF"
    WAITER = "WAITER"
    CASHIER = "CASHIER"
    CUSTOMER = "CUSTOMER"

class RestaurantStatus(str, Enum):
    PENDING = "PENDING"
    TRIAL = "TRIAL"
    ACTIVE = "ACTIVE"
    SUSPENDED = "SUSPENDED"
    INACTIVE = "INACTIVE"

class PlanTier(str, Enum):
    STARTER = "STARTER"
    PROFESSIONAL = "PROFESSIONAL"
    PREMIUM = "PREMIUM"
    ENTERPRISE = "ENTERPRISE"

class SubscriptionStatus(str, Enum):
    TRIAL = "TRIAL"
    ACTIVE = "ACTIVE"
    EXPIRED = "EXPIRED"
    CANCELLED = "CANCELLED"

class TableStatus(str, Enum):
    AVAILABLE = "AVAILABLE"
    OCCUPIED = "OCCUPIED"
    CLEANING = "CLEANING"
    RESERVED = "RESERVED"

class OrderStatus(str, Enum):
    NEW = "NEW"
    ACCEPTED = "ACCEPTED"
    PREPARING = "PREPARING"
    READY = "READY"
    SERVED = "SERVED"
    CANCELLED = "CANCELLED"

class PaymentStatus(str, Enum):
    UNPAID = "UNPAID"
    PENDING = "PENDING"
    PAID = "PAID"
    REFUNDED = "REFUNDED"

class PaymentMethod(str, Enum):
    CASH = "CASH"
    UPI = "UPI"
    CARD = "CARD"
    ONLINE = "ONLINE"
    PAY_AT_COUNTER = "PAY_AT_COUNTER"

# ─── Subscription Plans ────────────────────────────────────────────────────────

class SubscriptionPlan(Base):
    __tablename__ = "subscription_plans"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(100), nullable=False)
    tier = Column(SQLEnum(PlanTier), nullable=False)
    price_monthly = Column(Float, nullable=False, default=0.0)
    price_annual = Column(Float, nullable=False, default=0.0)
    max_branches = Column(Integer, default=1)   # -1 = unlimited
    max_staff = Column(Integer, default=5)
    max_tables = Column(Integer, default=20)
    max_menu_items = Column(Integer, default=50)
    features_json = Column(Text, default='[]')
    trial_days = Column(Integer, default=14)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    subscriptions = relationship("Subscription", back_populates="plan")

# ─── Restaurant ────────────────────────────────────────────────────────────────

class Restaurant(Base):
    __tablename__ = "restaurants"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(200), nullable=False)
    slug = Column(String(100), unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)
    logo_url = Column(String(500), nullable=True)
    cover_image_url = Column(String(500), nullable=True)
    address = Column(String(400), nullable=True)
    phone = Column(String(50), nullable=True)
    email = Column(String(150), nullable=True)
    currency = Column(String(10), default="INR")
    # Location
    country = Column(String(100), default="India")
    state = Column(String(100), nullable=True)
    city = Column(String(100), nullable=True)
    area = Column(String(150), nullable=True)
    postal_code = Column(String(20), nullable=True)
    # Business
    category = Column(String(100), nullable=True)  # Fine Dining, Cafe, etc.
    gstin = Column(String(50), nullable=True)
    owner_id = Column(String(36), nullable=True)   # references users.id (set after user creation)
    # Status
    status = Column(SQLEnum(RestaurantStatus), default=RestaurantStatus.TRIAL, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    settings = relationship("RestaurantSettings", back_populates="restaurant", uselist=False, cascade="all, delete-orphan")
    users = relationship("User", back_populates="restaurant")
    branches = relationship("Branch", back_populates="restaurant", cascade="all, delete-orphan")
    categories = relationship("MenuCategory", back_populates="restaurant", cascade="all, delete-orphan")
    menu_items = relationship("MenuItem", back_populates="restaurant", cascade="all, delete-orphan")
    tables = relationship("RestaurantTable", back_populates="restaurant", cascade="all, delete-orphan")
    orders = relationship("Order", back_populates="restaurant", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="restaurant", cascade="all, delete-orphan")
    subscriptions = relationship("Subscription", back_populates="restaurant", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="restaurant", cascade="all, delete-orphan")
    customers = relationship("RestaurantCustomer", back_populates="restaurant", cascade="all, delete-orphan")
    kitchen_stations = relationship("KitchenStation", back_populates="restaurant", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="restaurant", cascade="all, delete-orphan")

class RestaurantSettings(Base):
    __tablename__ = "restaurant_settings"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    restaurant_id = Column(String(36), ForeignKey("restaurants.id", ondelete="CASCADE"), unique=True, nullable=False)
    tax_rate_percent = Column(Float, default=5.0)
    service_charge_percent = Column(Float, default=0.0)
    currency_symbol = Column(String(10), default="₹")
    opening_hours_json = Column(Text, default='{"monday":"10:00-23:00","tuesday":"10:00-23:00","wednesday":"10:00-23:00","thursday":"10:00-23:00","friday":"10:00-23:30","saturday":"10:00-23:30","sunday":"10:00-23:00"}')
    table_pin_required = Column(Boolean, default=False)
    notification_sound_enabled = Column(Boolean, default=True)
    accept_online_orders = Column(Boolean, default=True)
    min_order_amount = Column(Float, default=0.0)

    restaurant = relationship("Restaurant", back_populates="settings")

# ─── Subscription ──────────────────────────────────────────────────────────────

class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    restaurant_id = Column(String(36), ForeignKey("restaurants.id", ondelete="CASCADE"), nullable=False, index=True)
    plan_id = Column(String(36), ForeignKey("subscription_plans.id"), nullable=False)
    status = Column(SQLEnum(SubscriptionStatus), default=SubscriptionStatus.TRIAL, nullable=False)
    started_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    expires_at = Column(DateTime, nullable=True)
    is_annual = Column(Boolean, default=False)
    amount_paid = Column(Float, default=0.0)
    payment_id = Column(String(200), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    restaurant = relationship("Restaurant", back_populates="subscriptions")
    plan = relationship("SubscriptionPlan", back_populates="subscriptions")

# ─── Branch ────────────────────────────────────────────────────────────────────

class Branch(Base):
    __tablename__ = "branches"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    restaurant_id = Column(String(36), ForeignKey("restaurants.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(150), nullable=False)
    address = Column(String(400), nullable=True)
    city = Column(String(100), nullable=True)
    phone = Column(String(50), nullable=True)
    is_active = Column(Boolean, default=True)
    is_primary = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    restaurant = relationship("Restaurant", back_populates="branches")

# ─── Kitchen Station ───────────────────────────────────────────────────────────

class KitchenStation(Base):
    __tablename__ = "kitchen_stations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    restaurant_id = Column(String(36), ForeignKey("restaurants.id", ondelete="CASCADE"), nullable=False, index=True)
    branch_id = Column(String(36), ForeignKey("branches.id", ondelete="SET NULL"), nullable=True)
    name = Column(String(100), nullable=False)
    station_type = Column(String(50), default="MAIN")  # MAIN, DRINKS, DESSERT, SNACKS
    is_active = Column(Boolean, default=True)

    restaurant = relationship("Restaurant", back_populates="kitchen_stations")

# ─── User ──────────────────────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(150), unique=True, index=True, nullable=False)
    hashed_password = Column(String(200), nullable=False)
    full_name = Column(String(150), nullable=False)
    phone = Column(String(50), nullable=True)
    role = Column(SQLEnum(UserRole), default=UserRole.CUSTOMER, nullable=False)
    is_active = Column(Boolean, default=True)
    is_email_verified = Column(Boolean, default=False)
    restaurant_id = Column(String(36), ForeignKey("restaurants.id", ondelete="SET NULL"), nullable=True, index=True)
    branch_id = Column(String(36), nullable=True)   # optional branch scope
    avatar_url = Column(String(500), nullable=True)
    google_id = Column(String(200), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    restaurant = relationship("Restaurant", back_populates="users")

# ─── Menu ──────────────────────────────────────────────────────────────────────

class MenuCategory(Base):
    __tablename__ = "menu_categories"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    restaurant_id = Column(String(36), ForeignKey("restaurants.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    description = Column(String(250), nullable=True)
    display_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)

    restaurant = relationship("Restaurant", back_populates="categories")
    items = relationship("MenuItem", back_populates="category", cascade="all, delete-orphan")

class MenuItem(Base):
    __tablename__ = "menu_items"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    restaurant_id = Column(String(36), ForeignKey("restaurants.id", ondelete="CASCADE"), nullable=False, index=True)
    category_id = Column(String(36), ForeignKey("menu_categories.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    price = Column(Float, nullable=False)
    image_url = Column(String(500), nullable=True)
    is_veg = Column(Boolean, default=True)
    allergens_json = Column(String(250), default="[]")
    is_available = Column(Boolean, default=True)
    is_archived = Column(Boolean, default=False)
    display_order = Column(Integer, default=0)
    kitchen_station_id = Column(String(36), nullable=True)  # route to station

    restaurant = relationship("Restaurant", back_populates="menu_items")
    category = relationship("MenuCategory", back_populates="items")
    variants = relationship("MenuItemVariant", back_populates="item", cascade="all, delete-orphan")
    addons = relationship("MenuAddon", back_populates="item", cascade="all, delete-orphan")

class MenuItemVariant(Base):
    __tablename__ = "menu_item_variants"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    item_id = Column(String(36), ForeignKey("menu_items.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    price_modifier = Column(Float, default=0.0)

    item = relationship("MenuItem", back_populates="variants")

class MenuAddon(Base):
    __tablename__ = "menu_addons"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    item_id = Column(String(36), ForeignKey("menu_items.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    price = Column(Float, nullable=False)
    is_available = Column(Boolean, default=True)

    item = relationship("MenuItem", back_populates="addons")

# ─── Tables ────────────────────────────────────────────────────────────────────

class RestaurantTable(Base):
    __tablename__ = "restaurant_tables"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    restaurant_id = Column(String(36), ForeignKey("restaurants.id", ondelete="CASCADE"), nullable=False, index=True)
    branch_id = Column(String(36), ForeignKey("branches.id", ondelete="SET NULL"), nullable=True)
    table_number = Column(String(20), nullable=False)
    capacity = Column(Integer, default=4)
    status = Column(SQLEnum(TableStatus), default=TableStatus.AVAILABLE, nullable=False)
    qr_token = Column(String(100), unique=True, index=True, nullable=False)
    is_session_active = Column(Boolean, default=True)
    session_pin = Column(String(10), nullable=True)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    restaurant = relationship("Restaurant", back_populates="tables")
    orders = relationship("Order", back_populates="table")

# ─── Orders ────────────────────────────────────────────────────────────────────

class Order(Base):
    __tablename__ = "orders"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    order_number = Column(String(50), nullable=False, index=True)
    restaurant_id = Column(String(36), ForeignKey("restaurants.id", ondelete="CASCADE"), nullable=False, index=True)
    branch_id = Column(String(36), nullable=True)
    table_id = Column(String(36), ForeignKey("restaurant_tables.id", ondelete="SET NULL"), nullable=True, index=True)
    customer_name = Column(String(100), default="Guest")
    customer_phone = Column(String(50), nullable=True)
    status = Column(SQLEnum(OrderStatus), default=OrderStatus.NEW, nullable=False, index=True)

    subtotal = Column(Float, nullable=False, default=0.0)
    tax_amount = Column(Float, nullable=False, default=0.0)
    service_charge = Column(Float, nullable=False, default=0.0)
    total_amount = Column(Float, nullable=False, default=0.0)

    payment_status = Column(SQLEnum(PaymentStatus), default=PaymentStatus.UNPAID, nullable=False)
    payment_method = Column(String(50), default="PAY_AT_COUNTER")
    special_notes = Column(Text, nullable=True)
    idempotency_key = Column(String(100), unique=True, nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    restaurant = relationship("Restaurant", back_populates="orders")
    table = relationship("RestaurantTable", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    status_history = relationship("OrderStatusHistory", back_populates="order", cascade="all, delete-orphan")
    payment = relationship("Payment", back_populates="order", uselist=False)

class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    order_id = Column(String(36), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    menu_item_id = Column(String(36), nullable=True)
    item_name = Column(String(150), nullable=False)
    unit_price = Column(Float, nullable=False)
    quantity = Column(Integer, nullable=False, default=1)
    subtotal = Column(Float, nullable=False)
    variant_name = Column(String(100), nullable=True)
    notes = Column(String(250), nullable=True)
    kitchen_station_id = Column(String(36), nullable=True)

    order = relationship("Order", back_populates="items")
    addons = relationship("OrderItemAddon", back_populates="order_item", cascade="all, delete-orphan")

class OrderItemAddon(Base):
    __tablename__ = "order_item_addons"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    order_item_id = Column(String(36), ForeignKey("order_items.id", ondelete="CASCADE"), nullable=False, index=True)
    addon_name = Column(String(100), nullable=False)
    unit_price = Column(Float, nullable=False)

    order_item = relationship("OrderItem", back_populates="addons")

class OrderStatusHistory(Base):
    __tablename__ = "order_status_history"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    order_id = Column(String(36), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    previous_status = Column(String(50), nullable=True)
    new_status = Column(String(50), nullable=False)
    changed_by_user_id = Column(String(36), nullable=True)
    notes = Column(String(250), nullable=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    order = relationship("Order", back_populates="status_history")

# ─── Payments ─────────────────────────────────────────────────────────────────

class Payment(Base):
    __tablename__ = "payments"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    restaurant_id = Column(String(36), ForeignKey("restaurants.id", ondelete="CASCADE"), nullable=False, index=True)
    order_id = Column(String(36), ForeignKey("orders.id", ondelete="SET NULL"), nullable=True, unique=True, index=True)
    amount = Column(Float, nullable=False)
    currency = Column(String(10), default="INR")
    method = Column(String(50), nullable=False, default="CASH")
    status = Column(String(50), default="COMPLETED")
    gateway_payment_id = Column(String(200), nullable=True)
    gateway_response_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    restaurant = relationship("Restaurant", back_populates="payments")
    order = relationship("Order", back_populates="payment")

# ─── Customers ────────────────────────────────────────────────────────────────

class RestaurantCustomer(Base):
    __tablename__ = "restaurant_customers"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    restaurant_id = Column(String(36), ForeignKey("restaurants.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(150), nullable=True)
    email = Column(String(150), nullable=True)
    phone = Column(String(50), nullable=True, index=True)
    loyalty_points = Column(Integer, default=0)
    total_orders = Column(Integer, default=0)
    total_spent = Column(Float, default=0.0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    restaurant = relationship("Restaurant", back_populates="customers")

# ─── Notifications ────────────────────────────────────────────────────────────

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    restaurant_id = Column(String(36), ForeignKey("restaurants.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), nullable=True)
    type = Column(String(50), nullable=False)  # NEW_ORDER, LOW_STOCK, SUBSCRIPTION_EXPIRY
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    restaurant = relationship("Restaurant", back_populates="notifications")

# ─── Audit Logs ───────────────────────────────────────────────────────────────

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    restaurant_id = Column(String(36), ForeignKey("restaurants.id", ondelete="CASCADE"), nullable=True, index=True)
    user_id = Column(String(36), nullable=True)
    action = Column(String(100), nullable=False)
    entity_type = Column(String(50), nullable=False)
    entity_id = Column(String(50), nullable=True)
    details_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    restaurant = relationship("Restaurant", back_populates="audit_logs")
