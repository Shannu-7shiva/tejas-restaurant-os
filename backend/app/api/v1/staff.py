from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_password_hash
from app.models.all_models import User, UserRole
from app.schemas.all_schemas import UserResponse, UserCreate, UserUpdate
from app.api.deps import require_roles, get_tenant_restaurant_id, log_audit

router = APIRouter(prefix="/staff", tags=["Staff Management"])

@router.get("", response_model=List[UserResponse])
def get_restaurant_staff(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.RESTAURANT_OWNER, UserRole.RESTAURANT_MANAGER])),
    restaurant_id: str = Depends(get_tenant_restaurant_id)
):
    return db.query(User).filter(
        User.restaurant_id == restaurant_id,
        User.role != UserRole.CUSTOMER
    ).all()

@router.post("", response_model=UserResponse)
def add_restaurant_staff(
    staff_in: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.RESTAURANT_OWNER])),
    restaurant_id: str = Depends(get_tenant_restaurant_id)
):
    # Only permit assigning staff roles (cannot grant PLATFORM_ADMIN)
    if staff_in.role in [UserRole.PLATFORM_ADMIN, UserRole.CUSTOMER]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only create RESTAURANT_MANAGER, KITCHEN_STAFF, or SERVICE_STAFF roles."
        )

    existing = db.query(User).filter(User.email == staff_in.email.lower()).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="An account with this email already exists.")

    user = User(
        email=staff_in.email.lower(),
        hashed_password=get_password_hash(staff_in.password),
        full_name=staff_in.full_name,
        phone=staff_in.phone,
        role=staff_in.role,
        restaurant_id=restaurant_id,
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    log_audit(db, restaurant_id, current_user.id, "STAFF_INVITED", "User", user.id, {"role": user.role.value, "email": user.email})
    return user

@router.put("/{user_id}", response_model=UserResponse)
def update_staff_member(
    user_id: str,
    update_in: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.RESTAURANT_OWNER])),
    restaurant_id: str = Depends(get_tenant_restaurant_id)
):
    user = db.query(User).filter(
        User.id == user_id,
        User.restaurant_id == restaurant_id
    ).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Staff member not found")

    if user.id == current_user.id and update_in.is_active is False:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You cannot deactivate your own account.")

    if update_in.full_name is not None:
        user.full_name = update_in.full_name
    if update_in.phone is not None:
        user.phone = update_in.phone
    if update_in.role is not None:
        if update_in.role == UserRole.PLATFORM_ADMIN:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot escalate role to PLATFORM_ADMIN.")
        user.role = update_in.role
    if update_in.is_active is not None:
        user.is_active = update_in.is_active

    db.commit()
    db.refresh(user)
    log_audit(db, restaurant_id, current_user.id, "STAFF_UPDATED", "User", user.id)
    return user
