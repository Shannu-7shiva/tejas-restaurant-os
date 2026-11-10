from typing import List, Optional, Any, Dict
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from app.models.all_models import UserRole, TableStatus, OrderStatus, PaymentStatus

# Auth & User Schemas
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]

class TokenPayload(BaseModel):
    sub: Optional[str] = None
    exp: Optional[int] = None
    role: Optional[str] = None
    restaurant_id: Optional[str] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    phone: Optional[str] = None
    restaurant_name: Optional[str] = None # When signing up as restaurant owner

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    phone: Optional[str] = None
    role: UserRole
    restaurant_id: Optional[str] = None

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    phone: Optional[str] = None
    role: UserRole
    is_active: bool
    restaurant_id: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Restaurant Schemas
class RestaurantSettingsSchema(BaseModel):
    tax_rate_percent: float = 5.0
    service_charge_percent: float = 0.0
    currency_symbol: str = "₹"
    opening_hours_json: str
    table_pin_required: bool = False
    notification_sound_enabled: bool = True

    class Config:
        from_attributes = True

class RestaurantSettingsUpdate(BaseModel):
    tax_rate_percent: Optional[float] = None
    service_charge_percent: Optional[float] = None
    currency_symbol: Optional[str] = None
    opening_hours_json: Optional[str] = None
    table_pin_required: Optional[bool] = None
    notification_sound_enabled: Optional[bool] = None

class RestaurantCreate(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    currency: str = "INR"

class RestaurantUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    logo_url: Optional[str] = None
    cover_image_url: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    currency: Optional[str] = None

class RestaurantResponse(BaseModel):
    id: str
    name: str
    slug: str
    description: Optional[str] = None
    logo_url: Optional[str] = None
    cover_image_url: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    currency: str
    is_active: bool
    created_at: datetime
    settings: Optional[RestaurantSettingsSchema] = None

    class Config:
        from_attributes = True

# Menu Schemas
class MenuAddonSchema(BaseModel):
    id: Optional[str] = None
    name: str
    price: float
    is_available: bool = True

    class Config:
        from_attributes = True

class MenuItemVariantSchema(BaseModel):
    id: Optional[str] = None
    name: str
    price_modifier: float = 0.0

    class Config:
        from_attributes = True

class MenuItemCreate(BaseModel):
    category_id: str
    name: str
    description: Optional[str] = None
    price: float
    image_url: Optional[str] = None
    is_veg: bool = True
    allergens: List[str] = []
    is_available: bool = True
    display_order: int = 0
    variants: List[MenuItemVariantSchema] = []
    addons: List[MenuAddonSchema] = []

class MenuItemUpdate(BaseModel):
    category_id: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    image_url: Optional[str] = None
    is_veg: Optional[bool] = None
    allergens: Optional[List[str]] = None
    is_available: Optional[bool] = None
    is_archived: Optional[bool] = None
    display_order: Optional[int] = None
    variants: Optional[List[MenuItemVariantSchema]] = None
    addons: Optional[List[MenuAddonSchema]] = None

class MenuItemResponse(BaseModel):
    id: str
    restaurant_id: str
    category_id: str
    name: str
    description: Optional[str] = None
    price: float
    image_url: Optional[str] = None
    is_veg: bool
    allergens: List[str] = []
    is_available: bool
    is_archived: bool
    display_order: int
    variants: List[MenuItemVariantSchema] = []
    addons: List[MenuAddonSchema] = []

    class Config:
        from_attributes = True

class MenuCategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None
    display_order: int = 0

class MenuCategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    display_order: Optional[int] = None
    is_active: Optional[bool] = None

class MenuCategoryResponse(BaseModel):
    id: str
    restaurant_id: str
    name: str
    description: Optional[str] = None
    display_order: int
    is_active: bool
    items: List[MenuItemResponse] = []

    class Config:
        from_attributes = True

# Table Schemas
class TableCreate(BaseModel):
    table_number: str
    capacity: int = 4

class TableUpdate(BaseModel):
    table_number: Optional[str] = None
    capacity: Optional[int] = None
    status: Optional[TableStatus] = None
    is_session_active: Optional[bool] = None
    session_pin: Optional[str] = None

class TableResponse(BaseModel):
    id: str
    restaurant_id: str
    table_number: str
    capacity: int
    status: TableStatus
    qr_token: str
    is_session_active: bool
    session_pin: Optional[str] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class QRValidationResponse(BaseModel):
    valid: bool
    message: str
    restaurant: Optional[RestaurantResponse] = None
    table: Optional[TableResponse] = None
    pin_required: bool = False

# Order Schemas
class OrderItemAddonInput(BaseModel):
    addon_id: str
    name: str
    unit_price: float

class OrderItemInput(BaseModel):
    menu_item_id: str
    quantity: int = Field(gt=0, le=50)
    variant_name: Optional[str] = None
    notes: Optional[str] = Field(default=None, max_length=250)
    addons: List[OrderItemAddonInput] = []

class OrderCreateRequest(BaseModel):
    restaurant_slug: str
    qr_token: str
    session_pin: Optional[str] = None
    customer_name: Optional[str] = "Guest"
    customer_phone: Optional[str] = None
    special_notes: Optional[str] = Field(default=None, max_length=500)
    items: List[OrderItemInput] = Field(min_length=1)
    idempotency_key: Optional[str] = None

class OrderItemResponse(BaseModel):
    id: str
    menu_item_id: Optional[str] = None
    item_name: str
    unit_price: float
    quantity: int
    subtotal: float
    variant_name: Optional[str] = None
    notes: Optional[str] = None
    addons: List[Dict[str, Any]] = []

    class Config:
        from_attributes = True

class OrderStatusHistoryResponse(BaseModel):
    previous_status: Optional[str] = None
    new_status: str
    notes: Optional[str] = None
    timestamp: datetime

    class Config:
        from_attributes = True

class OrderResponse(BaseModel):
    id: str
    order_number: str
    restaurant_id: str
    table_id: Optional[str] = None
    table_number: Optional[str] = None
    customer_name: str
    customer_phone: Optional[str] = None
    status: OrderStatus
    subtotal: float
    tax_amount: float
    service_charge: float
    total_amount: float
    payment_status: PaymentStatus
    payment_method: str
    special_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    items: List[OrderItemResponse] = []
    status_history: List[OrderStatusHistoryResponse] = []

    class Config:
        from_attributes = True

class OrderStatusUpdate(BaseModel):
    status: OrderStatus
    notes: Optional[str] = None

# Analytics Schemas
class AnalyticsSummaryResponse(BaseModel):
    orders_today_count: int
    active_preparing_count: int
    completed_today_count: int
    total_revenue_today: float
    placed_orders_value_today: float
    avg_order_value: float
    popular_items: List[Dict[str, Any]]
    recent_orders: List[OrderResponse]
    hourly_trends: List[Dict[str, Any]]

# Customer Self-Service & AI Concierge Schemas
class CustomerPaymentRequest(BaseModel):
    payment_method: str = "UPI"
    transaction_id: Optional[str] = None
    tip_amount: Optional[float] = 0.0
    notes: Optional[str] = None

class AIAssistantRequest(BaseModel):
    prompt: str
    table_number: Optional[str] = None
    order_id: Optional[str] = None

class WaiterCallRequest(BaseModel):
    table_number: str
    request_type: str = "ASSISTANCE"
    notes: Optional[str] = None
