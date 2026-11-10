import re
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from app.core.database import get_db
from app.core.security import get_password_hash
from app.models.all_models import (
    User, UserRole, Restaurant, RestaurantSettings, Branch,
    Subscription, SubscriptionPlan, PlanTier, SubscriptionStatus, RestaurantStatus
)

router = APIRouter(prefix="/register", tags=["Registration"])

def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[\s_-]+', '-', text)
    return text[:80]

class RestaurantRegisterRequest(BaseModel):
    restaurant_name: str
    owner_name: str
    email: EmailStr
    phone: str
    password: str
    category: str = "Restaurant"
    country: str = "India"
    state: str = ""
    city: str = ""
    area: str = ""
    address: str = ""
    postal_code: str = ""
    gstin: str = ""
    num_branches: int = 1

@router.post("/restaurant", status_code=status.HTTP_201_CREATED)
def register_restaurant(data: RestaurantRegisterRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == data.email.lower()).first():
        raise HTTPException(status_code=400, detail="An account with this email already exists.")

    base_slug = slugify(data.restaurant_name)
    slug = base_slug
    counter = 1
    while db.query(Restaurant).filter(Restaurant.slug == slug).first():
        slug = f"{base_slug}-{counter}"
        counter += 1

    starter_plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.tier == PlanTier.STARTER).first()
    if not starter_plan:
        starter_plan = SubscriptionPlan(
            name="Starter", tier=PlanTier.STARTER,
            price_monthly=999.0, price_annual=9990.0,
            max_branches=1, max_staff=5, max_tables=20, max_menu_items=50,
            trial_days=14, features_json='["menu","orders","kitchen","basic_analytics"]'
        )
        db.add(starter_plan)
        db.flush()

    restaurant = Restaurant(
        name=data.restaurant_name, slug=slug,
        address=data.address, phone=data.phone, email=data.email.lower(),
        category=data.category, country=data.country, state=data.state,
        city=data.city, area=data.area, postal_code=data.postal_code,
        gstin=data.gstin if data.gstin else None,
        status=RestaurantStatus.TRIAL, is_active=True
    )
    db.add(restaurant)
    db.flush()

    owner = User(
        email=data.email.lower(),
        hashed_password=get_password_hash(data.password),
        full_name=data.owner_name, phone=data.phone,
        role=UserRole.RESTAURANT_OWNER,
        restaurant_id=restaurant.id,
        is_active=True, is_email_verified=True
    )
    db.add(owner)
    db.flush()

    restaurant.owner_id = owner.id
    db.add(RestaurantSettings(restaurant_id=restaurant.id))
    db.add(Branch(
        restaurant_id=restaurant.id, name=f"{data.restaurant_name} - Main",
        address=data.address, city=data.city, phone=data.phone, is_primary=True
    ))
    db.add(Subscription(
        restaurant_id=restaurant.id, plan_id=starter_plan.id,
        status=SubscriptionStatus.TRIAL,
        started_at=datetime.now(timezone.utc),
        expires_at=datetime.now(timezone.utc) + timedelta(days=starter_plan.trial_days),
        amount_paid=0.0
    ))
    db.commit()
    return {
        "message": "Restaurant registered successfully!",
        "restaurant_id": restaurant.id,
        "slug": slug,
        "trial_days": starter_plan.trial_days,
        "login_email": data.email.lower()
    }

@router.get("/check-slug/{slug}")
def check_slug(slug: str, db: Session = Depends(get_db)):
    existing = db.query(Restaurant).filter(Restaurant.slug == slug.lower()).first()
    return {"available": existing is None, "slug": slug.lower()}
