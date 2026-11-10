import json
import random
import re
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.all_models import (
    Restaurant, RestaurantSettings, MenuCategory, MenuItem, RestaurantTable,
    Order, OrderItem, OrderItemAddon, OrderStatusHistory, OrderStatus, PaymentStatus, TableStatus
)
from app.schemas.all_schemas import (
    OrderCreateRequest, OrderResponse, QRValidationResponse, TableResponse, RestaurantResponse,
    CustomerPaymentRequest, AIAssistantRequest, WaiterCallRequest
)
from app.services.pricing_service import calculate_authoritative_order_totals
from app.websocket.connection_manager import manager

router = APIRouter(prefix="/public", tags=["Public Customer"])

def generate_order_number() -> str:
    """Generate human-readable order number like TEJ-4819."""
    num = random.randint(1000, 9999)
    return f"TEJ-{num}"

def find_restaurant_by_slug_or_fallback(slug: str, db: Session) -> Optional[Restaurant]:
    """Find restaurant by slug, or fallback to 'tejas' or first active restaurant."""
    if slug and slug not in ["default", "primary"]:
        res = db.query(Restaurant).filter(Restaurant.slug == slug, Restaurant.is_active == True).first()
        if res:
            return res
    # Fallback to tejas
    res = db.query(Restaurant).filter(Restaurant.slug == "tejas", Restaurant.is_active == True).first()
    if res:
        return res
    # Fallback to royal-saffron or first active
    return db.query(Restaurant).filter(Restaurant.is_active == True).first()

@router.get("/restaurant/{slug}")
def get_public_restaurant(slug: str, db: Session = Depends(get_db)):
    restaurant = find_restaurant_by_slug_or_fallback(slug, db)
    if not restaurant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Restaurant not found or inactive")

    # Categories with available, non-archived items
    categories = db.query(MenuCategory).filter(
        MenuCategory.restaurant_id == restaurant.id,
        MenuCategory.is_active == True
    ).order_by(MenuCategory.display_order.asc()).all()

    cats_data = []
    for cat in categories:
        items = db.query(MenuItem).filter(
            MenuItem.category_id == cat.id,
            MenuItem.is_archived == False
        ).order_by(MenuItem.display_order.asc()).all()

        items_data = []
        for item in items:
            allergens = []
            try:
                if item.allergens_json:
                    allergens = json.loads(item.allergens_json)
            except Exception:
                allergens = []

            items_data.append({
                "id": item.id,
                "restaurant_id": item.restaurant_id,
                "category_id": item.category_id,
                "name": item.name,
                "description": item.description,
                "price": item.price,
                "image_url": item.image_url,
                "is_veg": item.is_veg,
                "allergens": allergens,
                "is_available": item.is_available,
                "is_archived": item.is_archived,
                "display_order": item.display_order,
                "variants": [{"id": v.id, "name": v.name, "price_modifier": v.price_modifier} for v in item.variants],
                "addons": [{"id": a.id, "name": a.name, "price": a.price, "is_available": a.is_available} for a in item.addons if a.is_available]
            })

        cats_data.append({
            "id": cat.id,
            "name": cat.name,
            "description": cat.description,
            "display_order": cat.display_order,
            "items": items_data
        })

    settings = restaurant.settings
    settings_data = {
        "tax_rate_percent": settings.tax_rate_percent if settings else 5.0,
        "service_charge_percent": settings.service_charge_percent if settings else 0.0,
        "currency_symbol": settings.currency_symbol if settings else "₹",
        "opening_hours_json": settings.opening_hours_json if settings else "{}",
        "table_pin_required": settings.table_pin_required if settings else False,
        "notification_sound_enabled": settings.notification_sound_enabled if settings else True,
    }

    return {
        "id": restaurant.id,
        "name": restaurant.name,
        "slug": restaurant.slug,
        "description": restaurant.description,
        "logo_url": restaurant.logo_url,
        "cover_image_url": restaurant.cover_image_url,
        "address": restaurant.address,
        "phone": restaurant.phone,
        "email": restaurant.email,
        "currency": restaurant.currency,
        "settings": settings_data,
        "categories": cats_data
    }

@router.get("/validate-table/{restaurant_slug}/{qr_token}")
def validate_table_token(restaurant_slug: str, qr_token: str, db: Session = Depends(get_db)):
    restaurant = find_restaurant_by_slug_or_fallback(restaurant_slug, db)
    if not restaurant:
        return QRValidationResponse(valid=False, message="Restaurant does not exist or is inactive.")

    table = db.query(RestaurantTable).filter(
        RestaurantTable.restaurant_id == restaurant.id,
        RestaurantTable.qr_token == qr_token
    ).first()

    if not table:
        return QRValidationResponse(valid=False, message="Invalid or expired QR code token.")

    if not table.is_session_active:
        return QRValidationResponse(
            valid=False,
            message="This table's ordering session is currently closed. Please ask your server to open the table."
        )

    res_settings = restaurant.settings
    pin_required = res_settings.table_pin_required if res_settings else False

    table_data = TableResponse(
        id=table.id,
        restaurant_id=table.restaurant_id,
        table_number=table.table_number,
        capacity=table.capacity,
        status=table.status,
        qr_token=table.qr_token,
        is_session_active=table.is_session_active,
        session_pin=None,
        updated_at=table.updated_at
    )

    restaurant_data = RestaurantResponse(
        id=restaurant.id,
        name=restaurant.name,
        slug=restaurant.slug,
        description=restaurant.description,
        logo_url=restaurant.logo_url,
        cover_image_url=restaurant.cover_image_url,
        address=restaurant.address,
        phone=restaurant.phone,
        email=restaurant.email,
        currency=restaurant.currency,
        is_active=restaurant.is_active,
        created_at=restaurant.created_at,
        settings={
            "tax_rate_percent": res_settings.tax_rate_percent if res_settings else 5.0,
            "service_charge_percent": res_settings.service_charge_percent if res_settings else 0.0,
            "currency_symbol": res_settings.currency_symbol if res_settings else "₹",
            "opening_hours_json": res_settings.opening_hours_json if res_settings else "{}",
            "table_pin_required": pin_required,
            "notification_sound_enabled": res_settings.notification_sound_enabled if res_settings else True,
        }
    )

    return QRValidationResponse(
        valid=True,
        message="Table verified successfully.",
        restaurant=restaurant_data,
        table=table_data,
        pin_required=pin_required
    )

@router.post("/order")
async def place_customer_order(order_data: OrderCreateRequest, db: Session = Depends(get_db)):
    restaurant = db.query(Restaurant).filter(Restaurant.slug == order_data.restaurant_slug, Restaurant.is_active == True).first()
    if not restaurant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Restaurant not found")

    # Validate table and token
    table = db.query(RestaurantTable).filter(
        RestaurantTable.restaurant_id == restaurant.id,
        RestaurantTable.qr_token == order_data.qr_token
    ).first()

    if not table:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid table QR token")

    if not table.is_session_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Table session is not active. Please request staff to activate the table session."
        )

    # Optional table PIN check if required
    settings = restaurant.settings
    if settings and settings.table_pin_required:
        if not order_data.session_pin or (table.session_pin and order_data.session_pin != table.session_pin):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Incorrect table PIN provided. Please check the PIN provided by your server."
            )

    # Check idempotency if provided
    if order_data.idempotency_key:
        existing_order = db.query(Order).filter(Order.idempotency_key == order_data.idempotency_key).first()
        if existing_order:
            return format_order_response(existing_order, table.table_number)

    # Authoritative server-side price calculation
    subtotal, tax_amount, service_charge, total_amount, evaluated_items = calculate_authoritative_order_totals(
        db=db,
        restaurant_id=restaurant.id,
        items_input=order_data.items
    )

    order_number = generate_order_number()

    # Create Order record in database transaction
    order = Order(
        order_number=order_number,
        restaurant_id=restaurant.id,
        table_id=table.id,
        customer_name=order_data.customer_name or "Guest",
        customer_phone=order_data.customer_phone,
        status=OrderStatus.NEW,
        subtotal=subtotal,
        tax_amount=tax_amount,
        service_charge=service_charge,
        total_amount=total_amount,
        payment_status=PaymentStatus.UNPAID,
        payment_method="PAY_AT_COUNTER",
        special_notes=order_data.special_notes,
        idempotency_key=order_data.idempotency_key
    )
    db.add(order)
    db.flush()

    # Create Line items & Addons
    for item_data in evaluated_items:
        order_item = OrderItem(
            order_id=order.id,
            menu_item_id=item_data["menu_item_id"],
            item_name=item_data["item_name"],
            unit_price=item_data["unit_price"],
            quantity=item_data["quantity"],
            subtotal=item_data["subtotal"],
            variant_name=item_data["variant_name"],
            notes=item_data["notes"]
        )
        db.add(order_item)
        db.flush()

        for addon in item_data["addons"]:
            item_addon = OrderItemAddon(
                order_item_id=order_item.id,
                addon_name=addon["name"],
                unit_price=addon["unit_price"]
            )
            db.add(item_addon)

    # Initial order history
    history = OrderStatusHistory(
        order_id=order.id,
        previous_status=None,
        new_status=OrderStatus.NEW.value,
        notes="Order placed by customer via table QR code"
    )
    db.add(history)

    # Update table status to OCCUPIED if it was AVAILABLE
    if table.status == TableStatus.AVAILABLE:
        table.status = TableStatus.OCCUPIED

    db.commit()
    db.refresh(order)

    # Prepare response
    resp = format_order_response(order, table.table_number)

    # Broadcast to Kitchen and Manager WebSocket channels
    await manager.broadcast_restaurant(restaurant.id, {
        "event": "NEW_ORDER",
        "order": resp
    })

    return resp

@router.get("/order/{order_id}")
def get_customer_order(order_id: str, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    table_number = order.table.table_number if order.table else "Takeaway"
    return format_order_response(order, table_number)

def format_order_response(order: Order, table_number: str) -> Dict[str, Any]:
    items_data = []
    for item in order.items:
        addons_data = [{"addon_name": a.addon_name, "unit_price": a.unit_price} for a in item.addons]
        items_data.append({
            "id": item.id,
            "menu_item_id": item.menu_item_id,
            "item_name": item.item_name,
            "unit_price": item.unit_price,
            "quantity": item.quantity,
            "subtotal": item.subtotal,
            "variant_name": item.variant_name,
            "notes": item.notes,
            "addons": addons_data
        })

    history_data = [
        {
            "previous_status": h.previous_status,
            "new_status": h.new_status,
            "notes": h.notes,
            "timestamp": h.timestamp.isoformat()
        }
        for h in order.status_history
    ]

    return {
        "id": order.id,
        "order_number": order.order_number,
        "restaurant_id": order.restaurant_id,
        "table_id": order.table_id,
        "table_number": table_number,
        "customer_name": order.customer_name,
        "customer_phone": order.customer_phone,
        "status": order.status.value,
        "subtotal": order.subtotal,
        "tax_amount": order.tax_amount,
        "service_charge": order.service_charge,
        "total_amount": order.total_amount,
        "payment_status": order.payment_status.value,
        "payment_method": order.payment_method,
        "special_notes": order.special_notes,
        "created_at": order.created_at.isoformat(),
        "updated_at": order.updated_at.isoformat(),
        "items": items_data,
        "status_history": history_data
    }

@router.get("/tables/{slug}")
def get_public_tables(slug: str, db: Session = Depends(get_db)):
    """List active dine-in tables for customer selection if accessed directly."""
    restaurant = find_restaurant_by_slug_or_fallback(slug, db)
    if not restaurant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Restaurant not found")

    tables = db.query(RestaurantTable).filter(
        RestaurantTable.restaurant_id == restaurant.id,
        RestaurantTable.is_session_active == True
    ).order_by(RestaurantTable.table_number.asc()).all()

    return [
        {
            "id": t.id,
            "table_number": t.table_number,
            "capacity": t.capacity,
            "qr_token": t.qr_token,
            "status": t.status.value,
            "pin_required": restaurant.settings.table_pin_required if restaurant.settings else False
        }
        for t in tables
    ]

@router.post("/order/{order_id}/pay")
async def pay_customer_order(order_id: str, payment_data: CustomerPaymentRequest, db: Session = Depends(get_db)):
    """Allow customer to complete payment directly from their phone."""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    # If tip is provided, can be noted
    method = payment_data.payment_method.upper()
    is_immediate_paid = method in ["UPI", "CARD", "NETBANKING", "ONLINE"]

    order.payment_method = method
    if is_immediate_paid:
        order.payment_status = PaymentStatus.PAID
    else:
        order.payment_status = PaymentStatus.PENDING # Cash / pay at counter

    note = f"Paid via {method}"
    if payment_data.transaction_id:
        note += f" (Ref: {payment_data.transaction_id})"
    if payment_data.tip_amount and payment_data.tip_amount > 0:
        note += f" [Includes ₹{payment_data.tip_amount:.2f} Server Tip]"

    history = OrderStatusHistory(
        order_id=order.id,
        previous_status=order.status.value,
        new_status=order.status.value,
        notes=note
    )
    db.add(history)
    db.commit()
    db.refresh(order)

    table_number = order.table.table_number if order.table else "Table"
    resp = format_order_response(order, table_number)

    # Broadcast to staff and kitchen
    await manager.broadcast_restaurant(order.restaurant_id, {
        "event": "ORDER_PAYMENT_UPDATED",
        "order": resp
    })

    # Broadcast to customer live tracker
    await manager.broadcast_order(order.id, {
        "event": "ORDER_STATUS_UPDATED",
        "order": resp
    })

    return resp

@router.post("/restaurant/{slug}/call-waiter")
async def call_waiter_service(slug: str, req: WaiterCallRequest, db: Session = Depends(get_db)):
    """Customer one-tap alert to call floor waiter or request items."""
    restaurant = find_restaurant_by_slug_or_fallback(slug, db)
    if not restaurant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Restaurant not found")

    alert_payload = {
        "event": "WAITER_CALL",
        "table_number": req.table_number,
        "request_type": req.request_type,
        "notes": req.notes,
        "timestamp": random.randint(1000, 9999) # Unique ping ID
    }

    # Broadcast to service staff WebSocket channel
    await manager.broadcast_restaurant(restaurant.id, alert_payload)

    return {
        "success": True,
        "message": f"Server notified for {req.table_number}. We are attending to you shortly!"
    }

@router.post("/restaurant/{slug}/ai-assistant")
async def ai_concierge_assistant(slug: str, req: AIAssistantRequest, db: Session = Depends(get_db)):
    """
    Intelligent Tejas AI Help Desk & Concierge bot.
    Answers dietary queries, menu recommendations, ingredient questions,
    order status, and can dispatch waiter alerts.
    """
    restaurant = find_restaurant_by_slug_or_fallback(slug, db)
    if not restaurant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Restaurant not found")

    # Fetch active menu items
    menu_items = db.query(MenuItem).filter(
        MenuItem.restaurant_id == restaurant.id,
        MenuItem.is_archived == False,
        MenuItem.is_available == True
    ).all()

    query = req.prompt.strip().lower()
    table_num = req.table_number or "your table"

    # 1. Check for Waiter / Service Assistance
    waiter_triggers = ["waiter", "server", "water", "bill", "clean", "napkin", "spoon", "fork", "tissue", "assistance", "help me", "call staff"]
    if any(trigger in query for trigger in waiter_triggers):
        request_type = "WATER" if "water" in query else "BILL" if "bill" in query else "ASSISTANCE"
        await manager.broadcast_restaurant(restaurant.id, {
            "event": "WAITER_CALL",
            "table_number": table_num,
            "request_type": request_type,
            "notes": f"Requested via AI Assistant: {req.prompt}",
            "timestamp": random.randint(1000, 9999)
        })
        return {
            "reply": f"🛎️ I have immediately dispatched a request to our service team for {table_num}! A server is on their way to assist you with {request_type.lower()}.",
            "action_taken": "WAITER_CALLED",
            "quick_chips": ["Browse Starters", "View Chef Specials", "Check My Order"]
        }

    # 2. Check for Specific Order Status
    if req.order_id and any(w in query for w in ["order", "status", "track", "ready", "time", "food coming"]):
        order = db.query(Order).filter(Order.id == req.order_id).first()
        if order:
            status_desc = {
                "NEW": "just received by the kitchen and queued up",
                "ACCEPTED": "confirmed by the head chef",
                "PREPARING": "actively cooking on our charcoal sigri and tandoor",
                "READY": "plated and being dispatched to your table right now",
                "SERVED": "served! Enjoy every bite"
            }.get(order.status.value, order.status.value)
            return {
                "reply": f"Your order #{order.order_number} is currently {status_desc}! Total items: {len(order.items)}. Payment status: {order.payment_status.value}.",
                "order_status": order.status.value,
                "quick_chips": ["Call Waiter for Water", "Pay Online", "Order More Dishes"]
            }

    # 3. Vegetarian Recommendations
    if any(w in query for w in ["veg", "vegetarian", "pure veg", "jain", "paneer"]):
        veg_items = [item for item in menu_items if item.is_veg]
        sample = veg_items[:4]
        items_summary = "\n".join([f"• **{i.name}** (₹{i.price:.0f}): {i.description}" for i in sample])
        return {
            "reply": f"Here are our most celebrated Vegetarian masterpieces at Tejas:\n\n{items_summary}\n\nAll cooked in pure desi ghee with authentic royal recipes!",
            "suggested_items": [{"id": i.id, "name": i.name, "price": i.price, "image": i.image_url} for i in sample],
            "quick_chips": ["Non-Veg Options", "Best Biryani", "Call Waiter"]
        }

    # 4. Non-Vegetarian / Kebab / Meat Recommendations
    if any(w in query for w in ["non veg", "chicken", "meat", "mutton", "lamb", "kebab", "tikka"]):
        non_veg_items = [item for item in menu_items if not item.is_veg]
        sample = non_veg_items[:4]
        items_summary = "\n".join([f"• **{i.name}** (₹{i.price:.0f}): {i.description}" for i in sample])
        return {
            "reply": f"You'll adore our award-winning non-veg signatures at Tejas:\n\n{items_summary}\n\nSlow charcoal-smoked and marinated with heirloom spices!",
            "suggested_items": [{"id": i.id, "name": i.name, "price": i.price, "image": i.image_url} for i in sample],
            "quick_chips": ["Pure Veg Specials", "Breads & Rice", "Dessert Options"]
        }

    # 5. Biryani & Rice Recommendations
    if any(w in query for w in ["biryani", "rice", "dum", "pulao"]):
        biryani_items = [i for i in menu_items if "biryani" in i.name.lower() or "rice" in i.name.lower()]
        if not biryani_items:
            biryani_items = menu_items[:2]
        items_summary = "\n".join([f"• **{i.name}** (₹{i.price:.0f}): {i.description}" for i in biryani_items])
        return {
            "reply": f"Our Dum Biryanis are slow-cooked in sealed clay handis with aged basmati rice and Kashmiri saffron:\n\n{items_summary}",
            "suggested_items": [{"id": i.id, "name": i.name, "price": i.price, "image": i.image_url} for i in biryani_items],
            "quick_chips": ["Recommend Starters", "Desserts", "Pay My Bill"]
        }

    # 6. Desserts / Sweet
    if any(w in query for w in ["sweet", "dessert", "phirni", "halwa", "ice cream", "kulfi"]):
        sweet_items = [i for i in menu_items if "dessert" in i.description.lower() or "phirni" in i.name.lower() or i.category.name.lower().find("dessert") >= 0]
        if not sweet_items:
            sweet_items = menu_items[-2:]
        items_summary = "\n".join([f"• **{i.name}** (₹{i.price:.0f}): {i.description}" for i in sweet_items])
        return {
            "reply": f"End your culinary voyage on a golden note with Tejas artisan desserts:\n\n{items_summary}",
            "suggested_items": [{"id": i.id, "name": i.name, "price": i.price, "image": i.image_url} for i in sweet_items],
            "quick_chips": ["Chef's Specials", "Request Bill", "Call Waiter"]
        }

    # 7. Allergies / Spiciness / Health
    if any(w in query for w in ["allergy", "allergic", "gluten", "nut", "dairy", "spicy", "mild"]):
        return {
            "reply": "At Tejas, our master chefs accommodate all dietary requirements. Every dish on the menu shows verified allergen tags (Gluten, Dairy, Nuts, Mustard). For spice level adjustments, you can add special notes during checkout (e.g. 'Mild spice' or 'Extra spicy'). You can also request our server for custom preparation!",
            "quick_chips": ["Pure Veg Specials", "Call Waiter", "Chef Specials"]
        }

    # 8. Payment Instructions
    if any(w in query for w in ["pay", "payment", "upi", "card", "bill", "cost"]):
        return {
            "reply": "You can pay effortlessly right from your smartphone! Click the 'Pay Online' button in your cart or order tracker to pay with Google Pay, PhonePe, Paytm, BHIM UPI, or Credit/Debit Card. If you prefer cash or paying at counter, simply select 'Pay at Counter'.",
            "quick_chips": ["Check My Order", "Call Waiter", "Explore Menu"]
        }

    # Default friendly gourmet AI response
    highlights = [i for i in menu_items if "Galouti" in i.name or "Butter Chicken" in i.name or "Truffle" in i.name or "Dal" in i.name]
    if not highlights:
        highlights = menu_items[:3]

    recs_text = ", ".join([h.name for h in highlights])
    return {
        "reply": f"Welcome to **Tejas**! I am your AI Dining Concierge. I can guide you through our menu, recommend signature pairings, check allergens, track your order, or summon your table server.\n\nOur top chef highlights right now: **{recs_text}**.\n\nHow may I delight your palate today?",
        "suggested_items": [{"id": i.id, "name": i.name, "price": i.price, "image": i.image_url} for i in highlights],
        "quick_chips": ["Best Veg Dishes", "Signature Kebabs", "Biryani Specials", "Call Server to Table"]
    }
