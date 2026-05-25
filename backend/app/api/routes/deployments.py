from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
from typing import Optional
from pydantic import BaseModel
from datetime import datetime
from app.core.database import get_db
from app.core.deps import get_current_user, require_staff_or_admin
from app.models.deployments import Deployment, DeploymentStatusEnum
from app.models.user import User, RoleEnum
from app.models.clients import Client

router = APIRouter()

class DeploymentCreate(BaseModel):
    intern_user_id: UUID
    client_id: UUID
    start_date: Optional[datetime] = None
    tasks_total: int = 40
    notes: Optional[str] = None

class DeploymentApprove(BaseModel):
    status: str
    notes: Optional[str] = None

@router.post("/", status_code=201)
def create_deployment(payload: DeploymentCreate, db: Session = Depends(get_db), _=Depends(require_staff_or_admin)):
    intern = db.query(User).filter(User.id == payload.intern_user_id, User.role == RoleEnum.intern).first()
    if not intern:
        raise HTTPException(status_code=404, detail="Intern not found")
    client = db.query(Client).filter(Client.id == payload.client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    dep = Deployment(
        intern_user_id=payload.intern_user_id,
        client_id=payload.client_id,
        start_date=payload.start_date,
        tasks_total=payload.tasks_total,
        notes=payload.notes,
        status=DeploymentStatusEnum.pool
    )
    db.add(dep)
    db.commit()
    db.refresh(dep)
    return {"id": str(dep.id), "status": dep.status}

@router.get("/available-interns")
def available_interns(db: Session = Depends(get_db), _=Depends(require_staff_or_admin)):
    interns = db.query(User).filter(User.role == RoleEnum.intern, User.is_active == True).all()
    result = []
    for u in interns:
        active_dep = db.query(Deployment).filter(
            Deployment.intern_user_id == u.id,
            Deployment.status == DeploymentStatusEnum.active
        ).first()
        result.append({
            "user_id": str(u.id),
            "email": u.email,
            "has_active_deployment": active_dep is not None
        })
    return result

@router.get("/")
def list_deployments(db: Session = Depends(get_db), _=Depends(get_current_user)):
    deps = db.query(Deployment).order_by(Deployment.created_at.desc()).all()
    result = []
    for d in deps:
        client = db.query(Client).filter(Client.id == d.client_id).first()
        intern = db.query(User).filter(User.id == d.intern_user_id).first()
        result.append({
            "id": str(d.id),
            "intern_email": intern.email if intern else "—",
            "client_name": client.company_name if client else "—",
            "status": d.status,
            "ppo_progress": d.ppo_progress,
            "client_rating": d.client_rating,
            "tasks_completed": d.tasks_completed,
            "tasks_total": d.tasks_total,
        })
    return result

@router.patch("/{deployment_id}/approve")
def approve_deployment(deployment_id: UUID, payload: DeploymentApprove, db: Session = Depends(get_db), _=Depends(require_staff_or_admin)):
    dep = db.query(Deployment).filter(Deployment.id == deployment_id).first()
    if not dep:
        raise HTTPException(status_code=404, detail="Deployment not found")
    try:
        dep.status = DeploymentStatusEnum(payload.status)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid status: {payload.status}")
    if payload.notes:
        dep.notes = payload.notes
    db.commit()
    return {"id": str(dep.id), "status": dep.status}