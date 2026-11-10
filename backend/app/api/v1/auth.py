from datetime import timedelta
import re
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token, generate_secure_qr_token
from app.core.config import settings
from app.models.all_models import User, UserRole, Restaurant, RestaurantSettings
from app.schemas.all_schemas import Token, LoginRequest, RegisterRequest, UserResponse
from app.api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r'[^\w\s-]', '', text)
    return re.sub(r'[\s_-]+', '-', text)

@router.post("/login", response_model=Token)
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_data.email.lower()).first()
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated. Please contact your restaurant administrator.",
        )

    claims = {
        "role": user.role.value,
        "restaurant_id": user.restaurant_id
    }
    access_token = create_access_token(subject=user.id, claims=claims)

    restaurant_data = None
    if user.restaurant_id:
        restaurant = db.query(Restaurant).filter(Restaurant.id == user.restaurant_id).first()
        if restaurant:
            restaurant_data = {
                "id": restaurant.id,
                "name": restaurant.name,
                "slug": restaurant.slug,
                "logo_url": restaurant.logo_url
            }

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role.value,
            "restaurant_id": user.restaurant_id,
            "restaurant": restaurant_data
        }
    }

@router.post("/register", response_model=Token)
def register(reg_data: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == reg_data.email.lower()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )

    restaurant_id = None
    role = UserRole.CUSTOMER

    # If restaurant name is provided, provision a new Restaurant and make the user RESTAURANT_OWNER
    if reg_data.restaurant_name:
        role = UserRole.RESTAURANT_OWNER
        base_slug = slugify(reg_data.restaurant_name)
        slug = base_slug
        count = 1
        while db.query(Restaurant).filter(Restaurant.slug == slug).first():
            slug = f"{base_slug}-{count}"
            count += 1

        restaurant = Restaurant(
            name=reg_data.restaurant_name,
            slug=slug,
            email=reg_data.email.lower(),
            phone=reg_data.phone
        )
        db.add(restaurant)
        db.flush()
        restaurant_id = restaurant.id

        # Create default settings
        res_settings = RestaurantSettings(restaurant_id=restaurant_id)
        db.add(res_settings)

    user = User(
        email=reg_data.email.lower(),
        hashed_password=get_password_hash(reg_data.password),
        full_name=reg_data.full_name,
        phone=reg_data.phone,
        role=role,
        restaurant_id=restaurant_id,
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    claims = {
        "role": user.role.value,
        "restaurant_id": user.restaurant_id
    }
    access_token = create_access_token(subject=user.id, claims=claims)

    restaurant_data = None
    if user.restaurant_id:
        restaurant = db.query(Restaurant).filter(Restaurant.id == user.restaurant_id).first()
        if restaurant:
            restaurant_data = {
                "id": restaurant.id,
                "name": restaurant.name,
                "slug": restaurant.slug,
                "logo_url": restaurant.logo_url
            }

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role.value,
            "restaurant_id": user.restaurant_id,
            "restaurant": restaurant_data
        }
    }

@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return current_user
