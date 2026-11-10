import csv
import io
from typing import Optional, List
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Query, Response
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.core.database import get_db
from app.models.all_models import Order, OrderStatus, PaymentStatus, User, UserRole, OrderStatusHistory
from app.schemas.all_schemas import OrderResponse, OrderStatusUpdate
from app.api.deps import require_roles, get_tenant_restaurant_id, log_audit
from app.api.v1.public import format_order_response
from app.websocket.connection_manager import manager

router = APIRouter(prefix="/orders", tags=["Order Management"])

@router.get("")
def list_orders(
    status_filter: Optional[OrderStatus] = None,
    payment_filter: Optional[PaymentStatus] = None,
    table_id: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = Query(default=50, le=200),
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.RESTAURANT_OWNER, UserRole.RESTAURANT_MANAGER, UserRole.SERVICE_STAFF, UserRole.KITCHEN_STAFF])),
    restaurant_id: str = Depends(get_tenant_restaurant_id)
):
    """List orders strictly filtered by restaurant tenant."""
    query = db.query(Order).filter(Order.restaurant_id == restaurant_id)

    if status_filter:
        query = query.filter(Order.status == status_filter)
    if payment_filter:
        query = query.filter(Order.payment_status == payment_filter)
    if table_id:
        query = query.filter(Order.table_id == table_id)
    if search:
        query = query.filter(
            (Order.order_number.ilike(f"%{search}%")) |
            (Order.customer_name.ilike(f"%{search}%"))
        )

    total = query.count()
    orders = query.order_by(desc(Order.created_at)).offset(offset).limit(limit).all()

    items = []
    for o in orders:
        t_num = o.table.table_number if o.table else "Takeaway"
        items.append(format_order_response(o, t_num))

    return {
        "total": total,
        "offset": offset,
        "limit": limit,
        "orders": items
    }

@router.get("/{order_id}")
def get_order_details(
    order_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.RESTAURANT_OWNER, UserRole.RESTAURANT_MANAGER, UserRole.SERVICE_STAFF, UserRole.KITCHEN_STAFF])),
    restaurant_id: str = Depends(get_tenant_restaurant_id)
):
    order = db.query(Order).filter(
        Order.id == order_id,
        Order.restaurant_id == restaurant_id
    ).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    t_num = order.table.table_number if order.table else "Takeaway"
    return format_order_response(order, t_num)

@router.post("/{order_id}/cancel")
async def cancel_order(
    order_id: str,
    reason: Optional[str] = "Cancelled by management",
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.RESTAURANT_OWNER, UserRole.RESTAURANT_MANAGER])),
    restaurant_id: str = Depends(get_tenant_restaurant_id)
):
    order = db.query(Order).filter(
        Order.id == order_id,
        Order.restaurant_id == restaurant_id
    ).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    if order.status in [OrderStatus.SERVED, OrderStatus.CANCELLED]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Cannot cancel order with status '{order.status.value}'")

    prev = order.status.value
    order.status = OrderStatus.CANCELLED

    history = OrderStatusHistory(
        order_id=order.id,
        previous_status=prev,
        new_status=OrderStatus.CANCELLED.value,
        changed_by_user_id=current_user.id,
        notes=f"Cancelled by {current_user.full_name}: {reason}"
    )
    db.add(history)
    db.commit()
    db.refresh(order)

    log_audit(db, restaurant_id, current_user.id, "ORDER_CANCELLED", "Order", order.id, {"reason": reason})

    t_num = order.table.table_number if order.table else "Takeaway"
    resp = format_order_response(order, t_num)

    await manager.broadcast_restaurant(restaurant_id, {"event": "ORDER_STATUS_UPDATED", "order": resp})
    await manager.notify_order(order.id, {"event": "ORDER_STATUS_UPDATED", "order": resp})

    return resp

@router.post("/{order_id}/payment")
async def update_order_payment(
    order_id: str,
    payment_status: PaymentStatus,
    payment_method: str = "CASH",
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.RESTAURANT_OWNER, UserRole.RESTAURANT_MANAGER, UserRole.SERVICE_STAFF])),
    restaurant_id: str = Depends(get_tenant_restaurant_id)
):
    order = db.query(Order).filter(
        Order.id == order_id,
        Order.restaurant_id == restaurant_id
    ).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    order.payment_status = payment_status
    order.payment_method = payment_method
    db.commit()
    db.refresh(order)

    log_audit(db, restaurant_id, current_user.id, "PAYMENT_STATUS_UPDATED", "Order", order.id, {
        "payment_status": payment_status.value,
        "payment_method": payment_method
    })

    t_num = order.table.table_number if order.table else "Takeaway"
    resp = format_order_response(order, t_num)

    await manager.broadcast_restaurant(restaurant_id, {"event": "ORDER_PAYMENT_UPDATED", "order": resp})
    return resp

@router.get("/export/csv")
def export_orders_csv(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.RESTAURANT_OWNER, UserRole.RESTAURANT_MANAGER])),
    restaurant_id: str = Depends(get_tenant_restaurant_id)
):
    orders = db.query(Order).filter(
        Order.restaurant_id == restaurant_id
    ).order_by(desc(Order.created_at)).limit(500).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Order Number", "Date/Time (UTC)", "Table", "Customer", "Status",
        "Subtotal", "Tax", "Service Charge", "Total", "Payment Status", "Payment Method"
    ])

    for o in orders:
        t_num = o.table.table_number if o.table else "Takeaway"
        writer.writerow([
            o.order_number,
            o.created_at.strftime("%Y-%m-%d %H:%M:%S"),
            t_num,
            o.customer_name,
            o.status.value,
            f"{o.subtotal:.2f}",
            f"{o.tax_amount:.2f}",
            f"{o.service_charge:.2f}",
            f"{o.total_amount:.2f}",
            o.payment_status.value,
            o.payment_method
        ])

    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=aurelia-orders-{datetime.now().strftime('%Y%m%d')}.csv"}
    )
