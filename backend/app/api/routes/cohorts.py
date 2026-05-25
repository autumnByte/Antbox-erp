from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel
from datetime import datetime
from app.core.database import get_db
from app.core.deps import get_current_user, require_staff_or_admin
from app.models.cohorts import Cohort, CohortStatusEnum
from app.models.enrollment import Enrollment, EnrollmentStatusEnum
from app.models.user import User

router = APIRouter()

class CohortCreate(BaseModel):
    name: str
    track: str
    status: str = "upcoming"
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    max_students: int = 30
    description: Optional[str] = None

class EnrollRequest(BaseModel):
    user_id: UUID
    track: Optional[str] = None

@router.post("/", status_code=201)
def create_cohort(payload: CohortCreate, db: Session = Depends(get_db), _=Depends(require_staff_or_admin)):
    cohort = Cohort(**payload.dict())
    db.add(cohort)
    db.commit()
    db.refresh(cohort)
    return {"id": str(cohort.id), "name": cohort.name, "track": cohort.track, "status": cohort.status}

@router.get("/")
def list_cohorts(db: Session = Depends(get_db), _=Depends(get_current_user)):
    cohorts = db.query(Cohort).order_by(Cohort.created_at.desc()).all()
    result = []
    for c in cohorts:
        count = db.query(func.count(Enrollment.id)).filter(
            Enrollment.cohort_id == c.id,
            Enrollment.status.in_([EnrollmentStatusEnum.active, EnrollmentStatusEnum.completed])
        ).scalar()
        result.append({
            "id": str(c.id), "name": c.name, "track": c.track,
            "status": c.status, "student_count": count,
            "max_students": c.max_students,
            "start_date": c.start_date.isoformat() if c.start_date else None,
            "end_date": c.end_date.isoformat() if c.end_date else None,
        })
    return result

@router.post("/{cohort_id}/enroll", status_code=201)
def enroll_student(cohort_id: UUID, payload: EnrollRequest, db: Session = Depends(get_db), _=Depends(require_staff_or_admin)):
    cohort = db.query(Cohort).filter(Cohort.id == cohort_id).first()
    if not cohort:
        raise HTTPException(status_code=404, detail="Cohort not found")
    existing = db.query(Enrollment).filter(Enrollment.user_id == payload.user_id, Enrollment.cohort_id == cohort_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="User already enrolled")
    enrollment = Enrollment(
        user_id=payload.user_id,
        cohort_id=cohort_id,
        track=payload.track or cohort.track
    )
    db.add(enrollment)
    db.commit()
    db.refresh(enrollment)
    return {"id": str(enrollment.id), "status": enrollment.status}

@router.get("/{cohort_id}/students")
def get_cohort_students(cohort_id: UUID, db: Session = Depends(get_db), _=Depends(get_current_user)):
    enrollments = db.query(Enrollment).filter(Enrollment.cohort_id == cohort_id).all()
    result = []
    for e in enrollments:
        user = db.query(User).filter(User.id == e.user_id).first()
        result.append({
            "enrollment_id": str(e.id),
            "user_id": str(e.user_id),
            "email": user.email if user else "—",
            "track": e.track,
            "status": e.status,
            "readiness_score": e.readiness_score,
            "enrolled_at": e.enrolled_at.isoformat() if e.enrolled_at else None,
        })
    return result