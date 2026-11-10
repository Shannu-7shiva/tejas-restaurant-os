from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.all_models import Restaurant, RestaurantSettings, User, UserRole
from app.schemas.all_schemas import RestaurantResponse, RestaurantUpdate, RestaurantSettingsUpdate
from app.api.deps import require_roles, get_tenant_restaurant_id, log_audit

router = APIRouter(prefix="/settings", tags=["Restaurant Settings"])

@router.get("", response_model=RestaurantResponse)
def get_restaurant_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.RESTAURANT_OWNER, UserRole.RESTAURANT_MANAGER])),
    restaurant_id: str = Depends(get_tenant_restaurant_id)
):
    restaurant = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    if not restaurant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Restaurant not found")
    return restaurant

@router.put("/profile", response_model=RestaurantResponse)
def update_restaurant_profile(
    profile_in: RestaurantUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.RESTAURANT_OWNER])),
    restaurant_id: str = Depends(get_tenant_restaurant_id)
):
    restaurant = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    if not restaurant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Restaurant not found")

    if profile_in.name is not None:
        restaurant.name = profile_in.name
    if profile_in.description is not None:
        restaurant.description = profile_in.description
    if profile_in.logo_url is not None:
        restaurant.logo_url = profile_in.logo_url
    if profile_in.cover_image_url is not None:
        restaurant.cover_image_url = profile_in.cover_image_url
    if profile_in.address is not None:
        restaurant.address = profile_in.address
    if profile_in.phone is not None:
        restaurant.phone = profile_in.phone
    if profile_in.email is not None:
        restaurant.email = profile_in.email
    if profile_in.currency is not None:
        restaurant.currency = profile_in.currency

    db.commit()
    db.refresh(restaurant)
    log_audit(db, restaurant_id, current_user.id, "PROFILE_UPDATED", "Restaurant", restaurant.id)
    return restaurant

@router.put("/operational", response_model=RestaurantResponse)
def update_operational_settings(
    ops_in: RestaurantSettingsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.RESTAURANT_OWNER])),
    restaurant_id: str = Depends(get_tenant_restaurant_id)
):
    restaurant = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    if not restaurant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Restaurant not found")

    settings = restaurant.settings
    if not settings:
        settings = RestaurantSettings(restaurant_id=restaurant.id)
        db.add(settings)
        db.flush()

    if ops_in.tax_rate_percent is not None:
        settings.tax_rate_percent = ops_in.tax_rate_percent
    if ops_in.service_charge_percent is not None:
        settings.service_charge_percent = ops_in.service_charge_percent
    if ops_in.currency_symbol is not None:
        settings.currency_symbol = ops_in.currency_symbol
    if ops_in.opening_hours_json is not None:
        settings.opening_hours_json = ops_in.opening_hours_json
    if ops_in.table_pin_required is not None:
        settings.table_pin_required = ops_in.table_pin_required
    if ops_in.notification_sound_enabled is not None:
        settings.notification_sound_enabled = ops_in.notification_sound_enabled

    db.commit()
    db.refresh(restaurant)
    log_audit(db, restaurant_id, current_user.id, "OPERATIONAL_SETTINGS_UPDATED", "RestaurantSettings", settings.id)
    return restaurant
