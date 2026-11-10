import io
import qrcode
from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import generate_secure_qr_token, generate_table_pin
from app.models.all_models import RestaurantTable, TableStatus, User, UserRole, Order, OrderStatus
from app.schemas.all_schemas import TableCreate, TableUpdate, TableResponse
from app.api.deps import require_roles, get_tenant_restaurant_id, log_audit

router = APIRouter(prefix="/tables", tags=["Table Management"])

@router.get("", response_model=list[TableResponse])
def get_tables(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.RESTAURANT_OWNER, UserRole.RESTAURANT_MANAGER, UserRole.SERVICE_STAFF, UserRole.KITCHEN_STAFF])),
    restaurant_id: str = Depends(get_tenant_restaurant_id)
):
    return db.query(RestaurantTable).filter(RestaurantTable.restaurant_id == restaurant_id).order_by(RestaurantTable.table_number.asc()).all()

@router.post("", response_model=TableResponse)
def create_table(
    table_in: TableCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.RESTAURANT_OWNER, UserRole.RESTAURANT_MANAGER])),
    restaurant_id: str = Depends(get_tenant_restaurant_id)
):
    existing = db.query(RestaurantTable).filter(
        RestaurantTable.restaurant_id == restaurant_id,
        RestaurantTable.table_number == table_in.table_number
    ).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Table number '{table_in.table_number}' already exists in this restaurant.")

    table = RestaurantTable(
        restaurant_id=restaurant_id,
        table_number=table_in.table_number,
        capacity=table_in.capacity,
        status=TableStatus.AVAILABLE,
        qr_token=generate_secure_qr_token(),
        is_session_active=True,
        session_pin=generate_table_pin()
    )
    db.add(table)
    db.commit()
    db.refresh(table)

    log_audit(db, restaurant_id, current_user.id, "TABLE_CREATED", "RestaurantTable", table.id, {"table_number": table.table_number})
    return table

@router.put("/{table_id}", response_model=TableResponse)
def update_table(
    table_id: str,
    table_in: TableUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.RESTAURANT_OWNER, UserRole.RESTAURANT_MANAGER, UserRole.SERVICE_STAFF])),
    restaurant_id: str = Depends(get_tenant_restaurant_id)
):
    table = db.query(RestaurantTable).filter(
        RestaurantTable.id == table_id,
        RestaurantTable.restaurant_id == restaurant_id
    ).first()
    if not table:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Table not found")

    if table_in.table_number is not None:
        table.table_number = table_in.table_number
    if table_in.capacity is not None:
        table.capacity = table_in.capacity
    if table_in.status is not None:
        table.status = table_in.status
    if table_in.is_session_active is not None:
        table.is_session_active = table_in.is_session_active
    if table_in.session_pin is not None:
        table.session_pin = table_in.session_pin

    db.commit()
    db.refresh(table)
    log_audit(db, restaurant_id, current_user.id, "TABLE_UPDATED", "RestaurantTable", table.id, {"status": table.status.value})
    return table

@router.post("/{table_id}/regenerate-qr", response_model=TableResponse)
def regenerate_table_qr(
    table_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.RESTAURANT_OWNER, UserRole.RESTAURANT_MANAGER])),
    restaurant_id: str = Depends(get_tenant_restaurant_id)
):
    """Revoke old QR token and generate a brand-new cryptographically secure token."""
    table = db.query(RestaurantTable).filter(
        RestaurantTable.id == table_id,
        RestaurantTable.restaurant_id == restaurant_id
    ).first()
    if not table:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Table not found")

    table.qr_token = generate_secure_qr_token()
    table.session_pin = generate_table_pin()
    db.commit()
    db.refresh(table)

    log_audit(db, restaurant_id, current_user.id, "TABLE_QR_REGENERATED", "RestaurantTable", table.id)
    return table

@router.get("/{table_id}/qr-image")
def get_table_qr_image(
    table_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.RESTAURANT_OWNER, UserRole.RESTAURANT_MANAGER])),
    restaurant_id: str = Depends(get_tenant_restaurant_id)
):
    table = db.query(RestaurantTable).filter(
        RestaurantTable.id == table_id,
        RestaurantTable.restaurant_id == restaurant_id
    ).first()
    if not table:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Table not found")

    restaurant = table.restaurant
    # Target URL that the QR resolves to:
    qr_url = f"http://localhost:5173/order/{restaurant.slug}/{table.qr_token}"

    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=10,
        border=4,
    )
    qr.add_data(qr_url)
    qr.make(fit=True)

    img = qr.make_image(fill_color="#0F766E", back_color="#FAF7F2")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)

    return Response(content=buf.getvalue(), media_type="image/png")

@router.delete("/{table_id}")
def delete_table(
    table_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.RESTAURANT_OWNER])),
    restaurant_id: str = Depends(get_tenant_restaurant_id)
):
    table = db.query(RestaurantTable).filter(
        RestaurantTable.id == table_id,
        RestaurantTable.restaurant_id == restaurant_id
    ).first()
    if not table:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Table not found")

    # Check for active orders
    active_orders = db.query(Order).filter(
        Order.table_id == table.id,
        Order.status.in_([OrderStatus.NEW, OrderStatus.ACCEPTED, OrderStatus.PREPARING, OrderStatus.READY])
    ).count()

    if active_orders > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete table {table.table_number} because it has {active_orders} active in-progress order(s)."
        )

    db.delete(table)
    db.commit()
    log_audit(db, restaurant_id, current_user.id, "TABLE_DELETED", "RestaurantTable", table_id)
    return {"message": "Table deleted successfully"}
