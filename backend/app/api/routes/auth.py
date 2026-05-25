"""
Auth Routes — login, register, /me endpoint.
Token expiry raised to 8 hours so refresh on reload doesn't log users out.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_access_token
from app.core.deps import get_current_user
from app.models.user import User, RoleEnum
from app.schemas.auth import LoginRequest, TokenResponse, UserCreate, UserUpdateProfile

router = APIRouter()

ROLE_REDIRECTS = {
    "admin":   "/dashboard/admin",
    "staff":   "/dashboard/staff",
    "intern":  "/dashboard/intern",
    "student": "/dashboard/student",
    "client":  "/dashboard/client",
}


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account disabled")

    access_token = create_access_token({
        "sub": str(user.id),
        "role": user.role.value,
        "name": user.name or user.email.split("@")[0],
    })
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        role=user.role,
        user_id=str(user.id),
        name=user.name or user.email.split("@")[0],
        redirect=ROLE_REDIRECTS[user.role.value],
    )


@router.post("/register", status_code=201)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(
        email=payload.email,
        password_hash=hash_password(payload.password),
        role=payload.role,
        name=payload.name,
        track=payload.track,
        college=payload.college,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return {
        "id": str(user.id),
        "email": user.email,
        "role": user.role,
        "name": user.name,
    }


@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    """Returns the current authenticated user's profile."""
    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "role": current_user.role.value,
        "name": current_user.name,
        "track": current_user.track,
        "college": current_user.college,
        "base_salary": float(current_user.base_salary) if current_user.base_salary else 0,
        "readiness_score": current_user.readiness_score or 0,
        "id_type": current_user.id_type.value,
        "created_at": current_user.created_at.isoformat() if current_user.created_at else None,
    }


@router.patch("/me")
def update_me(payload: UserUpdateProfile, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Update own profile fields."""
    if payload.name is not None:
        current_user.name = payload.name
    if payload.track is not None:
        current_user.track = payload.track
    if payload.college is not None:
        current_user.college = payload.college
    db.commit()
    db.refresh(current_user)
    return {"message": "Profile updated", "name": current_user.name}
