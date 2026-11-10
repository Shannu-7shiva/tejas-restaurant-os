from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from app.core.database import get_db
from app.models.all_models import Order, OrderItem, OrderStatus, PaymentStatus, User, UserRole
from app.schemas.all_schemas import AnalyticsSummaryResponse
from app.api.deps import require_roles, get_tenant_restaurant_id
from app.api.v1.public import format_order_response

router = APIRouter(prefix="/analytics", tags=["Analytics & Reports"])

@router.get("/summary", response_model=AnalyticsSummaryResponse)
def get_analytics_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.RESTAURANT_OWNER, UserRole.RESTAURANT_MANAGER])),
    restaurant_id: str = Depends(get_tenant_restaurant_id)
):
    now = datetime.now(timezone.utc)
    today_start = datetime(now.year, now.month, now.day, 0, 0, 0, tzinfo=timezone.utc)

    # Orders today
    today_orders = db.query(Order).filter(
        Order.restaurant_id == restaurant_id,
        Order.created_at >= today_start
    ).all()

    orders_today_count = len(today_orders)

    # Active preparing (NEW, ACCEPTED, PREPARING)
    active_preparing_count = db.query(Order).filter(
        Order.restaurant_id == restaurant_id,
        Order.status.in_([OrderStatus.NEW, OrderStatus.ACCEPTED, OrderStatus.PREPARING])
    ).count()

    # Completed today (SERVED)
    completed_today_count = len([o for o in today_orders if o.status == OrderStatus.SERVED])

    # Real confirmed revenue (PAID)
    total_revenue_today = sum([o.total_amount for o in today_orders if o.payment_status == PaymentStatus.PAID])

    # Placed orders value today (all non-cancelled orders)
    placed_orders_value_today = sum([o.total_amount for o in today_orders if o.status != OrderStatus.CANCELLED])

    # Average order value
    valid_orders = [o for o in today_orders if o.status != OrderStatus.CANCELLED]
    avg_order_value = round(placed_orders_value_today / len(valid_orders), 2) if valid_orders else 0.0

    # Popular items (aggregated from OrderItems)
    popular_query = db.query(
        OrderItem.item_name,
        func.sum(OrderItem.quantity).label("total_sold"),
        func.sum(OrderItem.subtotal).label("total_revenue")
    ).join(Order, OrderItem.order_id == Order.id).filter(
        Order.restaurant_id == restaurant_id,
        Order.status != OrderStatus.CANCELLED
    ).group_by(OrderItem.item_name).order_by(desc("total_sold")).limit(5).all()

    popular_items = [
        {
            "name": row[0],
            "total_sold": int(row[1] or 0),
            "total_revenue": round(float(row[2] or 0.0), 2)
        }
        for row in popular_query
    ]

    # Recent 5 orders
    recent_db_orders = db.query(Order).filter(
        Order.restaurant_id == restaurant_id
    ).order_by(desc(Order.created_at)).limit(5).all()

    recent_orders = [format_order_response(o, o.table.table_number if o.table else "Takeaway") for o in recent_db_orders]

    # Hourly distribution for today (00:00 to 23:00)
    hourly_counts = {f"{h:02d}:00": 0 for h in range(10, 24)}
    for o in today_orders:
        hour_str = f"{o.created_at.hour:02d}:00"
        if hour_str in hourly_counts:
            hourly_counts[hour_str] += 1

    hourly_trends = [{"hour": k, "orders": v} for k, v in hourly_counts.items()]

    return {
        "orders_today_count": orders_today_count,
        "active_preparing_count": active_preparing_count,
        "completed_today_count": completed_today_count,
        "total_revenue_today": round(float(total_revenue_today), 2),
        "placed_orders_value_today": round(float(placed_orders_value_today), 2),
        "avg_order_value": avg_order_value,
        "popular_items": popular_items,
        "recent_orders": recent_orders,
        "hourly_trends": hourly_trends
    }
