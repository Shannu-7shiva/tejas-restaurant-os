from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.all_models import Order, OrderStatus, OrderStatusHistory, User, UserRole, RestaurantTable, TableStatus
from app.schemas.all_schemas import OrderResponse, OrderStatusUpdate
from app.api.deps import get_current_user, require_roles, get_tenant_restaurant_id, log_audit
from app.api.v1.public import format_order_response
from app.websocket.connection_manager import manager

router = APIRouter(prefix="/kitchen", tags=["Kitchen Display System"])

ALLOWED_TRANSITIONS = {
    OrderStatus.NEW: [OrderStatus.ACCEPTED, OrderStatus.CANCELLED],
    OrderStatus.ACCEPTED: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
    OrderStatus.PREPARING: [OrderStatus.READY, OrderStatus.CANCELLED],
    OrderStatus.READY: [OrderStatus.SERVED, OrderStatus.CANCELLED],
    OrderStatus.SERVED: [],
    OrderStatus.CANCELLED: []
}

@router.get("/orders")
def get_kitchen_active_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.RESTAURANT_OWNER, UserRole.RESTAURANT_MANAGER, UserRole.KITCHEN_STAFF, UserRole.SERVICE_STAFF])),
    restaurant_id: str = Depends(get_tenant_restaurant_id)
):
    """Retrieve active kitchen orders strictly scoped to user's restaurant tenant."""
    orders = db.query(Order).filter(
        Order.restaurant_id == restaurant_id,
        Order.status.in_([OrderStatus.NEW, OrderStatus.ACCEPTED, OrderStatus.PREPARING, OrderStatus.READY])
    ).order_by(Order.created_at.asc()).all()

    result = []
    for order in orders:
        table_num = order.table.table_number if order.table else "Takeaway"
        result.append(format_order_response(order, table_num))
    return result

@router.post("/orders/{order_id}/status")
async def update_kitchen_order_status(
    order_id: str,
    status_update: OrderStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.RESTAURANT_OWNER, UserRole.RESTAURANT_MANAGER, UserRole.KITCHEN_STAFF, UserRole.SERVICE_STAFF])),
    restaurant_id: str = Depends(get_tenant_restaurant_id)
):
    """Update kitchen order status with transition validation, history recording, and real-time push."""
    order = db.query(Order).filter(
        Order.id == order_id,
        Order.restaurant_id == restaurant_id
    ).first()

    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found in your restaurant")

    current_st = order.status
    target_st = status_update.status

    # Validate transition
    if target_st not in ALLOWED_TRANSITIONS.get(current_st, []):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status transition from '{current_st.value}' to '{target_st.value}'"
        )

    # If cancelling, service staff or kitchen must have authorization or owner/manager
    if target_st == OrderStatus.CANCELLED and current_user.role not in [UserRole.RESTAURANT_OWNER, UserRole.RESTAURANT_MANAGER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Order cancellation requires Restaurant Owner or Manager authorization."
        )

    # Perform transition
    order.status = target_st

    # If served and table has no other active orders, we can update or keep table status
    if target_st == OrderStatus.SERVED and order.table:
        # Check if there are other un-served orders on this table
        active_remaining = db.query(Order).filter(
            Order.table_id == order.table_id,
            Order.id != order.id,
            Order.status.in_([OrderStatus.NEW, OrderStatus.ACCEPTED, OrderStatus.PREPARING, OrderStatus.READY])
        ).count()
        if active_remaining == 0:
            order.table.status = TableStatus.OCCUPIED # Dining/Served

    # Record status history
    history = OrderStatusHistory(
        order_id=order.id,
        previous_status=current_st.value,
        new_status=target_st.value,
        changed_by_user_id=current_user.id,
        notes=status_update.notes or f"Status changed to {target_st.value} by {current_user.full_name} ({current_user.role.value})"
    )
    db.add(history)

    log_audit(
        db=db,
        restaurant_id=restaurant_id,
        user_id=current_user.id,
        action="ORDER_STATUS_CHANGED",
        entity_type="Order",
        entity_id=order.id,
        details={"from": current_st.value, "to": target_st.value, "notes": status_update.notes}
    )

    db.commit()
    db.refresh(order)

    table_num = order.table.table_number if order.table else "Takeaway"
    resp = format_order_response(order, table_num)

    # Broadcast to restaurant staff WebSockets
    await manager.broadcast_restaurant(restaurant_id, {
        "event": "ORDER_STATUS_UPDATED",
        "order": resp
    })

    # Broadcast to specific customer order tracker
    await manager.notify_order(order.id, {
        "event": "ORDER_STATUS_UPDATED",
        "order": resp
    })

    return resp
