from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.all_models import User, Branch, UserRole

router = APIRouter(prefix="/branches", tags=["Branches"])

@router.get("/")
def list_branches(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not current_user.restaurant_id:
        return []
    branches = db.query(Branch).filter(
        Branch.restaurant_id == current_user.restaurant_id, Branch.is_active == True
    ).all()
    return [{"id": b.id, "name": b.name, "address": b.address, "city": b.city,
             "phone": b.phone, "is_primary": b.is_primary} for b in branches]

class BranchCreate(BaseModel):
    name: str
    address: Optional[str] = None
    city: Optional[str] = None
    phone: Optional[str] = None

@router.post("/")
def create_branch(data: BranchCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.RESTAURANT_OWNER, UserRole.PLATFORM_ADMIN]:
        raise HTTPException(status_code=403, detail="Only owners can create branches.")
    branch = Branch(restaurant_id=current_user.restaurant_id, **data.dict())
    db.add(branch)
    db.commit()
    return {"message": "Branch created", "branch_id": branch.id}
