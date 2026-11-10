import json
from typing import Generator, Optional, List
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.all_models import User, UserRole, AuditLog

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)

def get_current_user(
    db: Session = Depends(get_db),
    token: Optional[str] = Depends(oauth2_scheme)
) -> User:
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided",
            headers={"WWW-Authenticate": "Bearer"},
        )
    payload = decode_access_token(token)
    if not payload or not payload.get("sub"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User account associated with this token no longer exists",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated. Contact restaurant administrator.",
        )
    return user

def require_roles(allowed_roles: List[UserRole]):
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role == UserRole.PLATFORM_ADMIN:
            return current_user
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation not permitted. Required role: {[r.value for r in allowed_roles]}, user role: {current_user.role.value}"
            )
        return current_user
    return role_checker

def get_tenant_restaurant_id(current_user: User = Depends(get_current_user)) -> str:
    """Enforce server-side tenant isolation: Resolve permitted restaurant ID from authenticated user."""
    if current_user.role == UserRole.PLATFORM_ADMIN:
        # Platform admins may act within any restaurant if provided via header or params,
        # but if user is restaurant staff/owner, they are strictly locked to current_user.restaurant_id
        if current_user.restaurant_id:
            return current_user.restaurant_id
        return "" # Needs restaurant context
    if not current_user.restaurant_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Authenticated user is not assigned to any restaurant tenant."
        )
    return current_user.restaurant_id

def log_audit(
    db: Session,
    restaurant_id: Optional[str],
    user_id: Optional[str],
    action: str,
    entity_type: str,
    entity_id: Optional[str],
    details: Optional[dict] = None
):
    audit = AuditLog(
        restaurant_id=restaurant_id,
        user_id=user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        details_json=json.dumps(details or {})
    )
    db.add(audit)
    db.commit()
