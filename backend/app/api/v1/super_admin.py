from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import Optional
from pydantic import BaseModel
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.all_models import (
    User, Restaurant, Order, Subscription, SubscriptionPlan,
    RestaurantStatus, UserRole, PlanTier
)

router = APIRouter(prefix="/super-admin", tags=["Super Admin"])

def require_admin(current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.PLATFORM_ADMIN:
        raise HTTPException(status_code=403, detail="Super Admin access required.")
    return current_user

@router.get("/dashboard")
def get_dashboard(db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    total = db.query(func.count(Restaurant.id)).scalar() or 0
    active = db.query(func.count(Restaurant.id)).filter(Restaurant.status == RestaurantStatus.ACTIVE).scalar() or 0
    trial = db.query(func.count(Restaurant.id)).filter(Restaurant.status == RestaurantStatus.TRIAL).scalar() or 0
    pending = db.query(func.count(Restaurant.id)).filter(Restaurant.status == RestaurantStatus.PENDING).scalar() or 0
    suspended = db.query(func.count(Restaurant.id)).filter(Restaurant.status == RestaurantStatus.SUSPENDED).scalar() or 0
    users = db.query(func.count(User.id)).scalar() or 0
    orders = db.query(func.count(Order.id)).scalar() or 0
    recent = db.query(Restaurant).order_by(desc(Restaurant.created_at)).limit(10).all()
    return {
        "stats": {
            "total_restaurants": total, "active": active, "trial": trial,
            "pending": pending, "suspended": suspended,
            "total_users": users, "total_orders": orders
        },
        "recent_restaurants": [
            {"id": r.id, "name": r.name, "slug": r.slug,
             "status": r.status.value if r.status else "TRIAL",
             "category": r.category, "city": r.city,
             "created_at": r.created_at.isoformat() if r.created_at else None}
            for r in recent
        ]
    }

@router.get("/restaurants")
def list_restaurants(
    page: int = 1, per_page: int = 20,
    status_filter: Optional[str] = None, search: Optional[str] = None,
    db: Session = Depends(get_db), admin: User = Depends(require_admin)
):
    q = db.query(Restaurant)
    if status_filter:
        q = q.filter(Restaurant.status == status_filter)
    if search:
        q = q.filter(Restaurant.name.ilike(f"%{search}%"))
    total = q.count()
    restaurants = q.order_by(desc(Restaurant.created_at)).offset((page-1)*per_page).limit(per_page).all()
    return {
        "total": total, "page": page, "per_page": per_page,
        "restaurants": [
            {"id": r.id, "name": r.name, "slug": r.slug, "email": r.email, "phone": r.phone,
             "status": r.status.value if r.status else "TRIAL",
             "category": r.category, "city": r.city, "state": r.state,
             "created_at": r.created_at.isoformat() if r.created_at else None,
             "is_active": r.is_active}
            for r in restaurants
        ]
    }

class StatusUpdate(BaseModel):
    status: str

@router.patch("/restaurants/{restaurant_id}/status")
def update_status(restaurant_id: str, body: StatusUpdate, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    r = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    valid = [s.value for s in RestaurantStatus]
    if body.status not in valid:
        raise HTTPException(status_code=400, detail=f"Invalid status. Options: {valid}")
    r.status = body.status
    r.is_active = (body.status == "ACTIVE")
    db.commit()
    return {"message": f"Status updated to {body.status}"}

@router.get("/plans")
def list_plans(db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    plans = db.query(SubscriptionPlan).all()
    return [{"id": p.id, "name": p.name, "tier": p.tier.value,
             "price_monthly": p.price_monthly, "price_annual": p.price_annual,
             "max_branches": p.max_branches, "max_staff": p.max_staff,
             "trial_days": p.trial_days, "is_active": p.is_active} for p in plans]

class CreatePlan(BaseModel):
    name: str
    tier: str
    price_monthly: float
    price_annual: float
    max_branches: int = 1
    max_staff: int = 5
    max_tables: int = 20
    max_menu_items: int = 50
    trial_days: int = 14
    features_json: str = "[]"

@router.post("/plans")
def create_plan(data: CreatePlan, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    plan = SubscriptionPlan(**data.dict())
    db.add(plan)
    db.commit()
    return {"message": "Plan created", "plan_id": plan.id}
