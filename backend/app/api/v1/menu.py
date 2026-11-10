import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.all_models import MenuCategory, MenuItem, MenuItemVariant, MenuAddon, User, UserRole
from app.schemas.all_schemas import (
    MenuCategoryCreate, MenuCategoryUpdate, MenuCategoryResponse,
    MenuItemCreate, MenuItemUpdate, MenuItemResponse
)
from app.api.deps import require_roles, get_tenant_restaurant_id, log_audit

router = APIRouter(prefix="/menu", tags=["Menu Management"])

# Categories
@router.get("/categories")
def get_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.RESTAURANT_OWNER, UserRole.RESTAURANT_MANAGER, UserRole.KITCHEN_STAFF, UserRole.SERVICE_STAFF])),
    restaurant_id: str = Depends(get_tenant_restaurant_id)
):
    categories = db.query(MenuCategory).filter(
        MenuCategory.restaurant_id == restaurant_id
    ).order_by(MenuCategory.display_order.asc()).all()

    res = []
    for cat in categories:
        items = db.query(MenuItem).filter(
            MenuItem.category_id == cat.id,
            MenuItem.is_archived == False
        ).order_by(MenuItem.display_order.asc()).all()

        cat_dict = {
            "id": cat.id,
            "restaurant_id": cat.restaurant_id,
            "name": cat.name,
            "description": cat.description,
            "display_order": cat.display_order,
            "is_active": cat.is_active,
            "items": [format_menu_item(i) for i in items]
        }
        res.append(cat_dict)
    return res

@router.post("/categories")
def create_category(
    cat_in: MenuCategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.RESTAURANT_OWNER, UserRole.RESTAURANT_MANAGER])),
    restaurant_id: str = Depends(get_tenant_restaurant_id)
):
    category = MenuCategory(
        restaurant_id=restaurant_id,
        name=cat_in.name,
        description=cat_in.description,
        display_order=cat_in.display_order,
        is_active=True
    )
    db.add(category)
    db.commit()
    db.refresh(category)
    log_audit(db, restaurant_id, current_user.id, "CATEGORY_CREATED", "MenuCategory", category.id, {"name": category.name})
    return {
        "id": category.id,
        "restaurant_id": category.restaurant_id,
        "name": category.name,
        "description": category.description,
        "display_order": category.display_order,
        "is_active": category.is_active,
        "items": []
    }

@router.put("/categories/{category_id}")
def update_category(
    category_id: str,
    cat_in: MenuCategoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.RESTAURANT_OWNER, UserRole.RESTAURANT_MANAGER])),
    restaurant_id: str = Depends(get_tenant_restaurant_id)
):
    category = db.query(MenuCategory).filter(
        MenuCategory.id == category_id,
        MenuCategory.restaurant_id == restaurant_id
    ).first()
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")

    if cat_in.name is not None:
        category.name = cat_in.name
    if cat_in.description is not None:
        category.description = cat_in.description
    if cat_in.display_order is not None:
        category.display_order = cat_in.display_order
    if cat_in.is_active is not None:
        category.is_active = cat_in.is_active

    db.commit()
    db.refresh(category)
    log_audit(db, restaurant_id, current_user.id, "CATEGORY_UPDATED", "MenuCategory", category.id)
    return category

@router.delete("/categories/{category_id}")
def delete_category(
    category_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.RESTAURANT_OWNER])),
    restaurant_id: str = Depends(get_tenant_restaurant_id)
):
    category = db.query(MenuCategory).filter(
        MenuCategory.id == category_id,
        MenuCategory.restaurant_id == restaurant_id
    ).first()
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")

    # Soft archive or delete items
    db.delete(category)
    db.commit()
    log_audit(db, restaurant_id, current_user.id, "CATEGORY_DELETED", "MenuCategory", category_id)
    return {"message": "Category deleted successfully"}

# Menu Items
@router.get("/items")
def get_menu_items(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.RESTAURANT_OWNER, UserRole.RESTAURANT_MANAGER, UserRole.KITCHEN_STAFF, UserRole.SERVICE_STAFF])),
    restaurant_id: str = Depends(get_tenant_restaurant_id)
):
    items = db.query(MenuItem).filter(
        MenuItem.restaurant_id == restaurant_id,
        MenuItem.is_archived == False
    ).order_by(MenuItem.display_order.asc()).all()
    return [format_menu_item(i) for i in items]

@router.post("/items")
def create_menu_item(
    item_in: MenuItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.RESTAURANT_OWNER, UserRole.RESTAURANT_MANAGER])),
    restaurant_id: str = Depends(get_tenant_restaurant_id)
):
    # Verify category belongs to this restaurant
    category = db.query(MenuCategory).filter(
        MenuCategory.id == item_in.category_id,
        MenuCategory.restaurant_id == restaurant_id
    ).first()
    if not category:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid menu category")

    item = MenuItem(
        restaurant_id=restaurant_id,
        category_id=category.id,
        name=item_in.name,
        description=item_in.description,
        price=item_in.price,
        image_url=item_in.image_url,
        is_veg=item_in.is_veg,
        allergens_json=json.dumps(item_in.allergens or []),
        is_available=item_in.is_available,
        display_order=item_in.display_order,
        is_archived=False
    )
    db.add(item)
    db.flush()

    for v in item_in.variants:
        variant = MenuItemVariant(
            item_id=item.id,
            name=v.name,
            price_modifier=v.price_modifier
        )
        db.add(variant)

    for a in item_in.addons:
        addon = MenuAddon(
            item_id=item.id,
            name=a.name,
            price=a.price,
            is_available=a.is_available
        )
        db.add(addon)

    db.commit()
    db.refresh(item)
    log_audit(db, restaurant_id, current_user.id, "MENU_ITEM_CREATED", "MenuItem", item.id, {"name": item.name})
    return format_menu_item(item)

@router.put("/items/{item_id}")
def update_menu_item(
    item_id: str,
    item_in: MenuItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.RESTAURANT_OWNER, UserRole.RESTAURANT_MANAGER])),
    restaurant_id: str = Depends(get_tenant_restaurant_id)
):
    item = db.query(MenuItem).filter(
        MenuItem.id == item_id,
        MenuItem.restaurant_id == restaurant_id,
        MenuItem.is_archived == False
    ).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Menu item not found")

    if item_in.category_id is not None:
        cat = db.query(MenuCategory).filter(MenuCategory.id == item_in.category_id, MenuCategory.restaurant_id == restaurant_id).first()
        if cat:
            item.category_id = cat.id
    if item_in.name is not None:
        item.name = item_in.name
    if item_in.description is not None:
        item.description = item_in.description
    if item_in.price is not None:
        item.price = item_in.price
    if item_in.image_url is not None:
        item.image_url = item_in.image_url
    if item_in.is_veg is not None:
        item.is_veg = item_in.is_veg
    if item_in.allergens is not None:
        item.allergens_json = json.dumps(item_in.allergens)
    if item_in.is_available is not None:
        item.is_available = item_in.is_available
    if item_in.display_order is not None:
        item.display_order = item_in.display_order

    if item_in.variants is not None:
        # Re-sync variants
        db.query(MenuItemVariant).filter(MenuItemVariant.item_id == item.id).delete()
        for v in item_in.variants:
            db.add(MenuItemVariant(item_id=item.id, name=v.name, price_modifier=v.price_modifier))

    if item_in.addons is not None:
        # Re-sync addons
        db.query(MenuAddon).filter(MenuAddon.item_id == item.id).delete()
        for a in item_in.addons:
            db.add(MenuAddon(item_id=item.id, name=a.name, price=a.price, is_available=a.is_available))

    db.commit()
    db.refresh(item)
    log_audit(db, restaurant_id, current_user.id, "MENU_ITEM_UPDATED", "MenuItem", item.id)
    return format_menu_item(item)

@router.patch("/items/{item_id}/availability")
def toggle_item_availability(
    item_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.RESTAURANT_OWNER, UserRole.RESTAURANT_MANAGER, UserRole.KITCHEN_STAFF])),
    restaurant_id: str = Depends(get_tenant_restaurant_id)
):
    item = db.query(MenuItem).filter(
        MenuItem.id == item_id,
        MenuItem.restaurant_id == restaurant_id
    ).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Menu item not found")

    item.is_available = not item.is_available
    db.commit()
    db.refresh(item)
    log_audit(db, restaurant_id, current_user.id, "ITEM_AVAILABILITY_TOGGLED", "MenuItem", item.id, {"is_available": item.is_available})
    return {"id": item.id, "name": item.name, "is_available": item.is_available}

@router.delete("/items/{item_id}")
def delete_menu_item(
    item_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.RESTAURANT_OWNER])),
    restaurant_id: str = Depends(get_tenant_restaurant_id)
):
    """Safe soft-archive: Preserves historical order lines while removing from current menu."""
    item = db.query(MenuItem).filter(
        MenuItem.id == item_id,
        MenuItem.restaurant_id == restaurant_id
    ).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Menu item not found")

    item.is_archived = True
    item.is_available = False
    db.commit()
    log_audit(db, restaurant_id, current_user.id, "MENU_ITEM_ARCHIVED", "MenuItem", item.id)
    return {"message": "Menu item archived successfully without breaking order history."}

def format_menu_item(item: MenuItem) -> dict:
    allergens = []
    try:
        if item.allergens_json:
            allergens = json.loads(item.allergens_json)
    except Exception:
        allergens = []

    return {
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
        "addons": [{"id": a.id, "name": a.name, "price": a.price, "is_available": a.is_available} for a in item.addons]
    }
