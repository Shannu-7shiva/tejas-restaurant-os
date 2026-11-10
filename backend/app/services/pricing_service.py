from typing import List, Dict, Any, Tuple
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.all_models import MenuItem, MenuItemVariant, MenuAddon, RestaurantSettings
from app.schemas.all_schemas import OrderItemInput

def calculate_authoritative_order_totals(
    db: Session,
    restaurant_id: str,
    items_input: List[OrderItemInput]
) -> Tuple[float, float, float, float, List[Dict[str, Any]]]:
    """
    Authoritative server-side price calculation.
    Never trusts client-submitted prices or totals.
    Validates item existence, belonging to restaurant, and availability.
    Returns (subtotal, tax_amount, service_charge, total_amount, evaluated_line_items).
    """
    subtotal = 0.0
    evaluated_items = []

    # Get restaurant settings for tax and service charge
    settings = db.query(RestaurantSettings).filter(RestaurantSettings.restaurant_id == restaurant_id).first()
    tax_rate = settings.tax_rate_percent if settings else 5.0
    service_charge_rate = settings.service_charge_percent if settings else 0.0

    for item_in in items_input:
        menu_item = db.query(MenuItem).filter(
            MenuItem.id == item_in.menu_item_id,
            MenuItem.restaurant_id == restaurant_id,
            MenuItem.is_archived == False
        ).first()

        if not menu_item:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Menu item with ID {item_in.menu_item_id} does not exist in this restaurant."
            )

        if not menu_item.is_available:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"'{menu_item.name}' is currently marked out of stock by the kitchen."
            )

        # Base price from database
        unit_price = float(menu_item.price)

        # Check variant if specified
        variant_name = None
        if item_in.variant_name:
            variant = db.query(MenuItemVariant).filter(
                MenuItemVariant.item_id == menu_item.id,
                MenuItemVariant.name == item_in.variant_name
            ).first()
            if not variant:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Variant '{item_in.variant_name}' is not valid for item '{menu_item.name}'."
                )
            unit_price += float(variant.price_modifier)
            variant_name = variant.name

        # Validate and add authoritative addons
        evaluated_addons = []
        addons_total_per_item = 0.0
        for addon_in in item_in.addons:
            addon = db.query(MenuAddon).filter(
                MenuAddon.id == addon_in.addon_id,
                MenuAddon.item_id == menu_item.id
            ).first()
            if not addon:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Add-on '{addon_in.name}' is not recognized for '{menu_item.name}'."
                )
            if not addon.is_available:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Add-on '{addon.name}' is currently unavailable."
                )
            addons_total_per_item += float(addon.price)
            evaluated_addons.append({
                "addon_id": addon.id,
                "name": addon.name,
                "unit_price": round(float(addon.price), 2)
            })

        effective_unit_price = round(unit_price + addons_total_per_item, 2)
        line_subtotal = round(effective_unit_price * item_in.quantity, 2)
        subtotal += line_subtotal

        evaluated_items.append({
            "menu_item_id": menu_item.id,
            "item_name": menu_item.name,
            "unit_price": effective_unit_price,
            "quantity": item_in.quantity,
            "subtotal": line_subtotal,
            "variant_name": variant_name,
            "notes": item_in.notes[:250] if item_in.notes else None,
            "addons": evaluated_addons
        })

    subtotal = round(subtotal, 2)
    tax_amount = round((subtotal * tax_rate) / 100.0, 2)
    service_charge = round((subtotal * service_charge_rate) / 100.0, 2)
    total_amount = round(subtotal + tax_amount + service_charge, 2)

    return subtotal, tax_amount, service_charge, total_amount, evaluated_items
