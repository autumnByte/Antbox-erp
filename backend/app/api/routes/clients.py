from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
from typing import Optional
from pydantic import BaseModel
from app.core.database import get_db
from app.core.deps import get_current_user, require_staff_or_admin
from app.models.clients import Client, ClientStageEnum
from app.models.deployments import Deployment

router = APIRouter()

class ClientCreate(BaseModel):
    company_name: str
    industry: Optional[str] = None
    contact_name: Optional[str] = None
    contact_email: Optional[str] = None
    stage: str = "prospect"
    pipeline_value: float = 0.0
    intern_slots: int = 1
    notes: Optional[str] = None

@router.post("/", status_code=201)
def create_client(payload: ClientCreate, db: Session = Depends(get_db), _=Depends(require_staff_or_admin)):
    client = Client(**payload.dict())
    db.add(client)
    db.commit()
    db.refresh(client)
    return {"id": str(client.id), "company_name": client.company_name}

@router.get("/")
def list_clients(db: Session = Depends(get_db), _=Depends(get_current_user)):
    clients = db.query(Client).order_by(Client.created_at.desc()).all()
    result = []
    for c in clients:
        active_deps = db.query(Deployment).filter(Deployment.client_id == c.id).count()
        result.append({
            "id": str(c.id), "company_name": c.company_name, "industry": c.industry,
            "stage": c.stage, "pipeline_value": c.pipeline_value,
            "intern_slots": c.intern_slots, "active_deployments": active_deps
        })
    return result