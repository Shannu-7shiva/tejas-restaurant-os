from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.all_models import User, Subscription, SubscriptionPlan, UserRole

router = APIRouter(prefix="/subscription", tags=["Subscription"])

@router.get("/plans")
def get_public_plans(db: Session = Depends(get_db)):
    plans = db.query(SubscriptionPlan).filter(SubscriptionPlan.is_active == True).all()
    return [
        {"id": p.id, "name": p.name, "tier": p.tier.value,
         "price_monthly": p.price_monthly, "price_annual": p.price_annual,
         "max_branches": p.max_branches, "max_staff": p.max_staff,
         "max_tables": p.max_tables, "max_menu_items": p.max_menu_items,
         "trial_days": p.trial_days, "features_json": p.features_json}
        for p in plans
    ]

@router.get("/my")
def get_my_subscription(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not current_user.restaurant_id:
        raise HTTPException(status_code=404, detail="No restaurant for this user.")
    sub = db.query(Subscription).filter(
        Subscription.restaurant_id == current_user.restaurant_id
    ).order_by(Subscription.created_at.desc()).first()
    if not sub:
        return {"status": "none"}
    plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.id == sub.plan_id).first()
    now = datetime.now(timezone.utc)
    exp = sub.expires_at.replace(tzinfo=timezone.utc) if sub.expires_at else None
    days_left = (exp - now).days if exp and exp > now else 0
    return {
        "id": sub.id, "status": sub.status.value,
        "plan_name": plan.name if plan else "Unknown",
        "plan_tier": plan.tier.value if plan else "STARTER",
        "price_monthly": plan.price_monthly if plan else 0,
        "started_at": sub.started_at.isoformat() if sub.started_at else None,
        "expires_at": sub.expires_at.isoformat() if sub.expires_at else None,
        "is_expired": bool(exp and exp < now),
        "days_remaining": days_left
    }
