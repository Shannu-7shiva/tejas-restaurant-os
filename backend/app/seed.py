import json
from datetime import datetime, timezone, timedelta
from app.core.database import SessionLocal, engine, Base
from app.core.security import get_password_hash, generate_secure_qr_token, generate_table_pin
from app.models.all_models import (
    User, UserRole, Restaurant, RestaurantSettings, MenuCategory, MenuItem,
    MenuItemVariant, MenuAddon, RestaurantTable, Order, OrderItem, OrderItemAddon,
    OrderStatusHistory, OrderStatus, PaymentStatus, TableStatus,
    # Multi-tenant SaaS models
    SubscriptionPlan, Subscription, PlanTier, SubscriptionStatus, RestaurantStatus,
)

def run_seed():
    print("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Check if already seeded
    existing_owner = db.query(User).filter(User.email == "owner@royalsaffron.com").first()
    if existing_owner:
        print("Database already seeded. Skipping.")
        db.close()
        return

    # ── Tejas Super Admin ────────────────────────────────────────────────────
    print("Seeding TEJAS TECHNOLOGIES Super Admin...")
    existing_tejas_admin = db.query(User).filter(User.email == "admin@tejastechnologies.in").first()
    if not existing_tejas_admin:
        tejas_admin = User(
            email="admin@tejastechnologies.in",
            hashed_password=get_password_hash("TejasAdmin2026!"),
            full_name="Tejas Super Admin",
            phone="+91 98765 00001",
            role=UserRole.PLATFORM_ADMIN,
            is_active=True,
            is_email_verified=True,
        )
        db.add(tejas_admin)
        db.flush()

    # ── Default Subscription Plans ───────────────────────────────────────────
    if not db.query(SubscriptionPlan).first():
        print("Seeding default subscription plans...")
        plans_data = [
            {
                "name": "Starter",
                "tier": PlanTier.STARTER,
                "price_monthly": 999.0,
                "price_annual": 9990.0,
                "max_branches": 1,
                "max_staff": 5,
                "max_tables": 20,
                "max_menu_items": 50,
                "trial_days": 14,
                "features_json": '["menu","orders","kitchen","basic_analytics"]',
            },
            {
                "name": "Professional",
                "tier": PlanTier.PROFESSIONAL,
                "price_monthly": 2499.0,
                "price_annual": 24990.0,
                "max_branches": 3,
                "max_staff": 20,
                "max_tables": 60,
                "max_menu_items": 200,
                "trial_days": 14,
                "features_json": '["menu","orders","kitchen","analytics","inventory","billing","customers"]',
            },
            {
                "name": "Premium",
                "tier": PlanTier.PREMIUM,
                "price_monthly": 4999.0,
                "price_annual": 49990.0,
                "max_branches": 10,
                "max_staff": 100,
                "max_tables": 200,
                "max_menu_items": 500,
                "trial_days": 14,
                "features_json": '["menu","orders","kitchen","analytics","inventory","billing","customers","ai_assistant","whatsapp","custom_domain"]',
            },
            {
                "name": "Enterprise",
                "tier": PlanTier.ENTERPRISE,
                "price_monthly": 9999.0,
                "price_annual": 99990.0,
                "max_branches": -1,
                "max_staff": -1,
                "max_tables": -1,
                "max_menu_items": -1,
                "trial_days": 30,
                "features_json": '["all"]',
            },
        ]
        for pd in plans_data:
            plan = SubscriptionPlan(**pd)
            db.add(plan)
        db.flush()

    print("Seeding Aurelia Platform Admin...")
    admin_user = User(
        email="admin@aureliaos.com",
        hashed_password=get_password_hash("AdminMaster2026!"),
        full_name="Aurelia System Admin",
        phone="+91 98765 00000",
        role=UserRole.PLATFORM_ADMIN,
        is_active=True
    )
    db.add(admin_user)
    db.flush()

    print("Seeding Restaurant 1: The Royal Saffron...")
    royal_saffron = Restaurant(
        name="The Royal Saffron",
        slug="royal-saffron",
        description="Contemporary Indian fine dining showcasing royal Awadhi, Mughlai, and modern coastal culinary mastery.",
        logo_url="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=400&q=80",
        cover_image_url="https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1600&q=80",
        address="Level 3, Aurelia Pavilion, Indiranagar, Bengaluru, KA 560038",
        phone="+91 80 4912 8800",
        email="concierge@royalsaffron.com",
        currency="INR",
        is_active=True
    )
    db.add(royal_saffron)
    db.flush()

    saffron_settings = RestaurantSettings(
        restaurant_id=royal_saffron.id,
        tax_rate_percent=5.0, # 5% GST
        service_charge_percent=5.0, # 5% Service charge
        currency_symbol="₹",
        table_pin_required=False,
        notification_sound_enabled=True
    )
    db.add(saffron_settings)

    # Staff for Royal Saffron
    saffron_owner = User(
        email="owner@royalsaffron.com",
        hashed_password=get_password_hash("shiva123"),
        full_name="Vikramaditya Rathore",
        phone="+91 98800 11223",
        role=UserRole.RESTAURANT_OWNER,
        restaurant_id=royal_saffron.id,
        is_active=True
    )
    db.add(saffron_owner)

    saffron_manager = User(
        email="manager@royalsaffron.com",
        hashed_password=get_password_hash("AureliaPass123!"),
        full_name="Ananya Sharma",
        phone="+91 98800 22334",
        role=UserRole.RESTAURANT_MANAGER,
        restaurant_id=royal_saffron.id,
        is_active=True
    )
    db.add(saffron_manager)

    saffron_chef = User(
        email="chef@royalsaffron.com",
        hashed_password=get_password_hash("AureliaPass123!"),
        full_name="Chef Harpal Singh",
        phone="+91 98800 33445",
        role=UserRole.KITCHEN_STAFF,
        restaurant_id=royal_saffron.id,
        is_active=True
    )
    db.add(saffron_chef)

    saffron_waiter = User(
        email="service@royalsaffron.com",
        hashed_password=get_password_hash("AureliaPass123!"),
        full_name="Karan Verma",
        phone="+91 98800 44556",
        role=UserRole.SERVICE_STAFF,
        restaurant_id=royal_saffron.id,
        is_active=True
    )
    db.add(saffron_waiter)

    # Tables for Royal Saffron
    tables = [
        {"num": "Table 1", "cap": 2, "pin": "1041"},
        {"num": "Table 2", "cap": 4, "pin": "2082"},
        {"num": "Table 3", "cap": 4, "pin": "3015"},
        {"num": "Table 4", "cap": 6, "pin": "4102"},
        {"num": "Table 5", "cap": 6, "pin": "5209"},
        {"num": "Private Dining Suite", "cap": 12, "pin": "8899"},
    ]
    created_tables = []
    for t_info in tables:
        t = RestaurantTable(
            restaurant_id=royal_saffron.id,
            table_number=t_info["num"],
            capacity=t_info["cap"],
            status=TableStatus.AVAILABLE,
            qr_token=generate_secure_qr_token(),
            is_session_active=True,
            session_pin=t_info["pin"]
        )
        db.add(t)
        created_tables.append(t)
    db.flush()

    # Menu Categories & Items
    cat1 = MenuCategory(restaurant_id=royal_saffron.id, name="Royal Small Plates", description="Delicate appetizers inspired by princely banquets", display_order=1)
    cat2 = MenuCategory(restaurant_id=royal_saffron.id, name="Tandoor & Sigri", description="Slow charcoal-smoked meats, cheeses, and coastal treasures", display_order=2)
    cat3 = MenuCategory(restaurant_id=royal_saffron.id, name="Heritage Curries", description="Rich, slow-simmered gravies prepared with heirloom spice blends", display_order=3)
    cat4 = MenuCategory(restaurant_id=royal_saffron.id, name="Dum Biryani & Artisanal Breads", description="Slow-cooked saffron basmati and oven-baked breads", display_order=4)
    cat5 = MenuCategory(restaurant_id=royal_saffron.id, name="Desserts & Elixirs", description="Traditional confections reimagined with gold leaf and botanicals", display_order=5)
    db.add_all([cat1, cat2, cat3, cat4, cat5])
    db.flush()

    # Items
    items_def = [
        # Cat 1
        {
            "cat": cat1, "name": "Galouti Kebab on Sheermal",
            "desc": "Melt-in-mouth smoked lamb patties infused with 32 rare Awadhi spices, served on warm saffron-scented mini sheermal.",
            "price": 580.0, "veg": False, "img": "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=800&q=80",
            "allergens": ["Gluten", "Dairy"],
            "variants": [{"name": "Single Portion (4 pcs)", "mod": 0}, {"name": "Grand Platter (8 pcs)", "mod": 480}],
            "addons": [{"name": "Extra Mint-Pomegranate Dip", "price": 60}, {"name": "Extra Sheermal Bread", "price": 120}]
        },
        {
            "cat": cat1, "name": "Truffle & Edamame Samosa Chaat",
            "desc": "Handcrafted crisp parcels with black summer truffle essence and young edamame, topped with Greek yogurt, saunth, and crisp pearls.",
            "price": 420.0, "veg": True, "img": "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80",
            "allergens": ["Gluten", "Dairy"],
            "variants": [],
            "addons": [{"name": "Extra Truffle Glaze", "price": 120}]
        },
        # Cat 2
        {
            "cat": cat2, "name": "Bhatti Da Murgh Tikka",
            "desc": "Char-grilled boneless chicken thigh steeped overnight in roasted yellow mustard, degi mirch, and aged spiced vinegar.",
            "price": 540.0, "veg": False, "img": "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=800&q=80",
            "allergens": ["Dairy", "Mustard"],
            "variants": [{"name": "Regular", "mod": 0}, {"name": "Large Sharing", "mod": 320}],
            "addons": [{"name": "Garlic Laccha Paratha", "price": 95}, {"name": "Sirka Onions & Chutney", "price": 40}]
        },
        {
            "cat": cat2, "name": "Saffron Paneer Tikka Angaar",
            "desc": "Thick artisanal cottage cheese blocks marinated with Kashmiri saffron, hung curd, and bell pepper embers.",
            "price": 480.0, "veg": True, "img": "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=800&q=80",
            "allergens": ["Dairy"],
            "variants": [],
            "addons": [{"name": "Double Cheese Crust", "price": 80}]
        },
        # Cat 3
        {
            "cat": cat3, "name": "Old Delhi Butter Chicken 1947",
            "desc": "Slow-smoked tandoori chicken simmered in velvet strained tomato makhani, white organic butter, and aromatic dried fenugreek.",
            "price": 620.0, "veg": False, "img": "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?auto=format&fit=crop&w=800&q=80",
            "allergens": ["Dairy", "Nuts"],
            "variants": [{"name": "Classic Boneless", "mod": 0}, {"name": "Royal Shredded", "mod": 50}],
            "addons": [{"name": "Extra Makhani Gravy Bowl", "price": 150}, {"name": "Butter Garlic Naan", "price": 110}]
        },
        {
            "cat": cat3, "name": "Dal Aurelia (36-Hour Slow Simmer)",
            "desc": "Black urad lentils slow-cooked over smouldering charcoal for 36 hours with churned country butter and plum tomato reduction.",
            "price": 460.0, "veg": True, "img": "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80",
            "allergens": ["Dairy"],
            "variants": [],
            "addons": [{"name": "Churned White Butter Dollop", "price": 50}, {"name": "Laccha Paratha", "price": 85}]
        },
        # Cat 4
        {
            "cat": cat4, "name": "Awadhi Gosht Dum Biryani",
            "desc": "Aged seela basmati rice and prime lamb shank sealed in traditional earthen handi with rose water, saffron, and ittar essence.",
            "price": 690.0, "veg": False, "img": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80",
            "allergens": ["Dairy", "Nuts"],
            "variants": [{"name": "Regular Handi", "mod": 0}, {"name": "Feast Handi (Serves 3)", "mod": 650}],
            "addons": [{"name": "Burani Garlic Raita", "price": 80}, {"name": "Mirchi Ka Salan", "price": 90}]
        },
        # Cat 5
        {
            "cat": cat5, "name": "Saffron Kesar Phirni Brulee",
            "desc": "Slow-set broken basmati pudding infused with saffron from Pampore, caramelized brown sugar glass, and 24K edible gold dust.",
            "price": 340.0, "veg": True, "img": "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80",
            "allergens": ["Dairy", "Nuts"],
            "variants": [],
            "addons": []
        }
    ]

    seeded_menu_items = []
    for item_def in items_def:
        mi = MenuItem(
            restaurant_id=royal_saffron.id,
            category_id=item_def["cat"].id,
            name=item_def["name"],
            description=item_def["desc"],
            price=item_def["price"],
            image_url=item_def["img"],
            is_veg=item_def["veg"],
            allergens_json=json.dumps(item_def["allergens"]),
            is_available=True,
            is_archived=False,
            display_order=1
        )
        db.add(mi)
        db.flush()
        seeded_menu_items.append(mi)

        for v in item_def["variants"]:
            v_obj = MenuItemVariant(item_id=mi.id, name=v["name"], price_modifier=v["mod"])
            db.add(v_obj)

        for a in item_def["addons"]:
            a_obj = MenuAddon(item_id=mi.id, name=a["name"], price=a["price"], is_available=True)
            db.add(a_obj)

    db.flush()

    print("Seeding sample real orders for The Royal Saffron...")
    # Order 1: Delivered / Served
    order1 = Order(
        order_number="AUR-1042",
        restaurant_id=royal_saffron.id,
        table_id=created_tables[0].id,
        customer_name="Rohan Mehra",
        customer_phone="+91 99001 22334",
        status=OrderStatus.SERVED,
        subtotal=1160.0,
        tax_amount=58.0,
        service_charge=58.0,
        total_amount=1276.0,
        payment_status=PaymentStatus.PAID,
        payment_method="UPI",
        special_notes="Less spicy please. Celebrating anniversary.",
        created_at=datetime.now(timezone.utc) - timedelta(hours=2)
    )
    db.add(order1)
    db.flush()

    db.add(OrderItem(
        order_id=order1.id,
        menu_item_id=seeded_menu_items[0].id,
        item_name=seeded_menu_items[0].name,
        unit_price=580.0,
        quantity=1,
        subtotal=580.0
    ))
    db.add(OrderItem(
        order_id=order1.id,
        menu_item_id=seeded_menu_items[1].id,
        item_name=seeded_menu_items[1].name,
        unit_price=580.0,
        quantity=1,
        subtotal=580.0
    ))
    db.add(OrderStatusHistory(
        order_id=order1.id,
        previous_status=None,
        new_status=OrderStatus.NEW.value,
        timestamp=datetime.now(timezone.utc) - timedelta(hours=2)
    ))
    db.add(OrderStatusHistory(
        order_id=order1.id,
        previous_status=OrderStatus.NEW.value,
        new_status=OrderStatus.SERVED.value,
        notes="Served gracefully",
        timestamp=datetime.now(timezone.utc) - timedelta(hours=1, minutes=20)
    ))

    # Order 2: Active in Kitchen (PREPARING)
    order2 = Order(
        order_number="AUR-1088",
        restaurant_id=royal_saffron.id,
        table_id=created_tables[1].id,
        customer_name="Pooja Sen",
        customer_phone="+91 98450 77112",
        status=OrderStatus.PREPARING,
        subtotal=1310.0,
        tax_amount=65.5,
        service_charge=65.5,
        total_amount=1441.0,
        payment_status=PaymentStatus.UNPAID,
        payment_method="PAY_AT_COUNTER",
        special_notes="Extra mint dip requested.",
        created_at=datetime.now(timezone.utc) - timedelta(minutes=15)
    )
    db.add(order2)
    db.flush()

    db.add(OrderItem(
        order_id=order2.id,
        menu_item_id=seeded_menu_items[2].id,
        item_name=seeded_menu_items[2].name,
        unit_price=620.0,
        quantity=1,
        subtotal=620.0,
        notes="Well-done charcoal char"
    ))
    db.add(OrderItem(
        order_id=order2.id,
        menu_item_id=seeded_menu_items[4].id,
        item_name=seeded_menu_items[4].name,
        unit_price=690.0,
        quantity=1,
        subtotal=690.0
    ))
    db.add(OrderStatusHistory(
        order_id=order2.id,
        previous_status=None,
        new_status=OrderStatus.NEW.value,
        timestamp=datetime.now(timezone.utc) - timedelta(minutes=15)
    ))
    db.add(OrderStatusHistory(
        order_id=order2.id,
        previous_status=OrderStatus.NEW.value,
        new_status=OrderStatus.ACCEPTED.value,
        timestamp=datetime.now(timezone.utc) - timedelta(minutes=12)
    ))
    db.add(OrderStatusHistory(
        order_id=order2.id,
        previous_status=OrderStatus.ACCEPTED.value,
        new_status=OrderStatus.PREPARING.value,
        timestamp=datetime.now(timezone.utc) - timedelta(minutes=10)
    ))

    # Order 3: Fresh incoming order (NEW)
    order3 = Order(
        order_number="AUR-1120",
        restaurant_id=royal_saffron.id,
        table_id=created_tables[2].id,
        customer_name="Aditya Singhania",
        customer_phone="+91 97110 55667",
        status=OrderStatus.NEW,
        subtotal=800.0,
        tax_amount=40.0,
        service_charge=40.0,
        total_amount=880.0,
        payment_status=PaymentStatus.UNPAID,
        payment_method="PAY_AT_COUNTER",
        special_notes="Allergen check: Nut allergy",
        created_at=datetime.now(timezone.utc) - timedelta(minutes=3)
    )
    db.add(order3)
    db.flush()

    db.add(OrderItem(
        order_id=order3.id,
        menu_item_id=seeded_menu_items[1].id,
        item_name=seeded_menu_items[1].name,
        unit_price=420.0,
        quantity=1,
        subtotal=420.0
    ))
    db.add(OrderItem(
        order_id=order3.id,
        menu_item_id=seeded_menu_items[3].id,
        item_name=seeded_menu_items[3].name,
        unit_price=460.0,
        quantity=1,
        subtotal=460.0
    ))
    db.add(OrderStatusHistory(
        order_id=order3.id,
        previous_status=None,
        new_status=OrderStatus.NEW.value,
        timestamp=datetime.now(timezone.utc) - timedelta(minutes=3)
    ))

    print("Seeding Restaurant 2: Aurelia Artisan Bistro (for multi-tenant isolation testing)...")
    bistro = Restaurant(
        name="Aurelia Artisan Bistro",
        slug="aurelia-bistro",
        description="Specialty coffee roastery and artisanal European brunch bakery.",
        logo_url="https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=400&q=80",
        cover_image_url="https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1600&q=80",
        address="12 Kensington Road, Mumbai, MH 400001",
        phone="+91 22 2844 9911",
        email="hello@aureliabistro.com",
        currency="INR",
        is_active=True
    )
    db.add(bistro)
    db.flush()

    bistro_settings = RestaurantSettings(
        restaurant_id=bistro.id,
        tax_rate_percent=5.0,
        service_charge_percent=0.0,
        currency_symbol="₹"
    )
    db.add(bistro_settings)

    bistro_owner = User(
        email="owner@aureliabistro.com",
        hashed_password=get_password_hash("shiva123"),
        full_name="Elena Gilbert",
        phone="+91 99200 44332",
        role=UserRole.RESTAURANT_OWNER,
        restaurant_id=bistro.id,
        is_active=True
    )
    db.add(bistro_owner)

    # Tables for Bistro
    bistro_table = RestaurantTable(
        restaurant_id=bistro.id,
        table_number="B-1",
        capacity=2,
        status=TableStatus.AVAILABLE,
        qr_token=generate_secure_qr_token(),
        is_session_active=True,
        session_pin="9921"
    )
    db.add(bistro_table)

    # Bistro category & item
    bistro_cat = MenuCategory(restaurant_id=bistro.id, name="Artisan Coffee", display_order=1)
    db.add(bistro_cat)
    db.flush()

    bistro_item = MenuItem(
        restaurant_id=bistro.id,
        category_id=bistro_cat.id,
        name="Cortado with Oat Milk",
        description="Double shot Ethiopian single-origin espresso cut with silky steamed oat milk.",
        price=260.0,
        image_url="https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&w=800&q=80",
        is_veg=True,
        allergens_json="[]",
        is_available=True,
        is_archived=False,
        display_order=1
    )
    db.add(bistro_item)

    db.commit()
    print("Database seeding completed successfully!")
    print(f"Sample table QR token for Royal Saffron Table 1: {created_tables[0].qr_token}")
    db.close()

if __name__ == "__main__":
    run_seed()
