from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel
from app.core.database import get_db
from app.core.deps import get_current_user, require_staff_or_admin
from app.models.task import Task
from app.models.submission import Submission, SubmissionStatusEnum
from app.models.enrollment import Enrollment
from app.services.readiness import recalculate_readiness

router = APIRouter()

class TaskCreate(BaseModel):
    cohort_id: UUID
    title: str
    description: Optional[str] = None
    track: Optional[str] = None
    task_type: str = "assignment"
    max_score: float = 100.0
    due_date: Optional[datetime] = None
    week_number: Optional[int] = None

class SubmitRequest(BaseModel):
    enrollment_id: UUID
    submission_url: Optional[str] = None
    notes: Optional[str] = None

class GradeRequest(BaseModel):
    score: float
    feedback: Optional[str] = None

@router.post("/", status_code=201)
def create_task(payload: TaskCreate, db: Session = Depends(get_db), _=Depends(require_staff_or_admin)):
    task = Task(**payload.dict())
    db.add(task)
    db.commit()
    db.refresh(task)
    return {"id": str(task.id), "title": task.title}

@router.get("/")
def list_tasks(cohort_id: Optional[UUID] = None, db: Session = Depends(get_db), _=Depends(get_current_user)):
    q = db.query(Task).filter(Task.is_active == True)
    if cohort_id:
        q = q.filter(Task.cohort_id == cohort_id)
    tasks = q.order_by(Task.created_at.asc()).all()
    return [{"id": str(t.id), "title": t.title, "track": t.track, "task_type": t.task_type,
             "max_score": t.max_score, "week_number": t.week_number,
             "due_date": t.due_date.isoformat() if t.due_date else None} for t in tasks]

@router.post("/{task_id}/submit", status_code=201)
def submit_task(task_id: UUID, payload: SubmitRequest, db: Session = Depends(get_db), _=Depends(get_current_user)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    existing = db.query(Submission).filter(
        Submission.task_id == task_id,
        Submission.enrollment_id == payload.enrollment_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Already submitted")
    sub = Submission(
        task_id=task_id,
        enrollment_id=payload.enrollment_id,
        submission_url=payload.submission_url,
        notes=payload.notes
    )
    db.add(sub)
    db.commit()
    db.refresh(sub)
    return {"id": str(sub.id), "status": sub.status}

@router.patch("/submissions/{submission_id}/grade")
def grade_submission(submission_id: UUID, payload: GradeRequest, db: Session = Depends(get_db), current_user=Depends(require_staff_or_admin)):
    sub = db.query(Submission).filter(Submission.id == submission_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")
    sub.score = payload.score
    sub.grader_feedback = payload.feedback
    sub.status = SubmissionStatusEnum.graded
    sub.graded_at = datetime.utcnow()
    sub.graded_by = current_user.id
    db.commit()
    # Recalculate readiness
    recalculate_readiness(db, sub.enrollment_id)
    db.refresh(sub)
    return {"id": str(sub.id), "score": sub.score, "status": sub.status}