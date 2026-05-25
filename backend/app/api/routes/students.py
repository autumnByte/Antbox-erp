"""
Students Routes — includes GET /api/students for Identity Control table.
RBAC:  GET /students requires admin or staff.
       Demo ID generation for bootcamp students.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import Optional
from uuid import UUID
import uuid
import random
import string

from app.core.database import get_db
from app.core.deps import get_current_user, require_staff_or_admin
from app.models.enrollment import Enrollment
from app.models.submission import Submission, SubmissionStatusEnum
from app.models.user import User, RoleEnum, IDTypeEnum
from app.models.deployments import Deployment, DeploymentStatusEnum
from pydantic import BaseModel
from uuid import UUID as PyUUID

router = APIRouter()


class ConvertToInternRequest(BaseModel):
    client_id: Optional[PyUUID] = None
    notes: Optional[str] = None


def _generate_demo_id(name: str = "") -> str:
    """
    Generate a formatted Demo ID: ANT-DEMO-{4 uppercase letters}-{4 digits}
    Example: ANT-DEMO-KRPX-4821
    """
    suffix_alpha = "".join(random.choices(string.ascii_uppercase, k=4))
    suffix_num = "".join(random.choices(string.digits, k=4))
    return f"ANT-DEMO-{suffix_alpha}-{suffix_num}"


def _user_to_dict(user: User) -> dict:
    return {
        "id": str(user.id),
        "email": user.email,
        "name": user.name or user.email.split("@")[0],
        "role": user.role.value,
        "id_type": user.id_type.value,
        "demo_id": user.demo_id if hasattr(user, "demo_id") else None,
        "track": user.track or "SDE",
        "college": user.college,
        "base_salary": float(user.base_salary) if user.base_salary else 0,
        "readiness_score": user.readiness_score or 0,
        "is_active": user.is_active,
        "created_at": user.created_at.isoformat() if user.created_at else None,
    }


@router.get("")
def list_students(
    role: Optional[str] = Query(None, description="Filter by role"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    _=Depends(require_staff_or_admin),
):
    """
    List all users — used by Identity Control, HR dashboard.
    Optionally filter by role.
    """
    q = db.query(User).filter(User.is_active == True)
    if role:
        try:
            q = q.filter(User.role == RoleEnum(role))
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid role: {role}")
    users = q.order_by(desc(User.created_at)).offset(skip).limit(limit).all()
    return [_user_to_dict(u) for u in users]


@router.get("/{student_id}/score")
def get_student_score(student_id: UUID, db: Session = Depends(get_db), _=Depends(get_current_user)):
    enrollment = db.query(Enrollment).filter(
        Enrollment.user_id == student_id
    ).order_by(desc(Enrollment.enrolled_at)).first()
    if not enrollment:
        raise HTTPException(status_code=404, detail="No enrollment found")
    return {
        "user_id": str(student_id),
        "enrollment_id": str(enrollment.id),
        "readiness_score": enrollment.readiness_score,
        "track": enrollment.track,
        "status": enrollment.status,
    }


@router.get("/cohorts/{cohort_id}/leaderboard")
def cohort_leaderboard(cohort_id: UUID, db: Session = Depends(get_db), _=Depends(get_current_user)):
    enrollments = db.query(Enrollment).filter(
        Enrollment.cohort_id == cohort_id
    ).order_by(desc(Enrollment.readiness_score)).all()
    result = []
    for i, e in enumerate(enrollments):
        user = db.query(User).filter(User.id == e.user_id).first()
        result.append({
            "rank": i + 1,
            "user_id": str(e.user_id),
            "email": user.email if user else "—",
            "name": user.name or (user.email.split("@")[0] if user else "—"),
            "readiness_score": e.readiness_score,
            "track": e.track,
            "status": e.status,
        })
    return result


@router.post("/{student_id}/generate-demo-id")
def generate_demo_id(
    student_id: UUID,
    db: Session = Depends(get_db),
    _=Depends(require_staff_or_admin),
):
    """
    Generate (or regenerate) a Demo ID for a bootcamp student.
    Idempotent — safe to call multiple times; updates the existing ID.
    """
    user = db.query(User).filter(User.id == student_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.role != RoleEnum.student:
        raise HTTPException(status_code=400, detail="Demo ID generation is only for bootcamp students")

    demo_id = _generate_demo_id(user.name or "")

    # Store on user if column exists, else return only
    if hasattr(user, "demo_id"):
        user.demo_id = demo_id
        db.commit()

    return {
        "message": "Demo ID generated",
        "user_id": str(student_id),
        "demo_id": demo_id,
        "name": user.name,
        "email": user.email,
    }


@router.post("/{student_id}/convert")
def convert_to_intern(
    student_id: UUID,
    payload: ConvertToInternRequest,
    db: Session = Depends(get_db),
    _=Depends(require_staff_or_admin),
):
    user = db.query(User).filter(User.id == student_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.role != RoleEnum.student:
        raise HTTPException(status_code=400, detail="User is not a student")

    user.role = RoleEnum.intern
    user.id_type = IDTypeEnum.real

    enrollment = db.query(Enrollment).filter(
        Enrollment.user_id == student_id
    ).order_by(desc(Enrollment.enrolled_at)).first()
    if enrollment:
        enrollment.status = "converted"

    db.commit()
    return {
        "message": "Student converted to intern",
        "user_id": str(student_id),
        "new_role": "intern",
    }


@router.patch("/{user_id}/salary")
def update_salary(
    user_id: UUID,
    body: dict,
    db: Session = Depends(get_db),
    _=Depends(require_staff_or_admin),
):
    """Update base salary for any user (staff/admin/intern). Admin/Staff only."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    salary = body.get("base_salary")
    if salary is None:
        raise HTTPException(status_code=400, detail="base_salary required")
    user.base_salary = float(salary)
    db.commit()
    return {"message": "Salary updated", "base_salary": float(user.base_salary)}
