from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User, RoleEnum
from app.models.enrollment import Enrollment, EnrollmentStatusEnum
from app.models.deployments import Deployment, DeploymentStatusEnum
from app.models.submission import Submission, SubmissionStatusEnum
from app.models.cohorts import Cohort

router = APIRouter()

@router.get("/overview")
def get_overview(db: Session = Depends(get_db), _=Depends(get_current_user)):
    students = db.query(func.count(User.id)).filter(User.role == RoleEnum.student).scalar()
    interns = db.query(func.count(User.id)).filter(User.role == RoleEnum.intern).scalar()
    active_deployments = db.query(func.count(Deployment.id)).filter(
        Deployment.status == DeploymentStatusEnum.active
    ).scalar()
    ppo_confirmed = db.query(func.count(Deployment.id)).filter(
        Deployment.status == DeploymentStatusEnum.ppo_confirmed
    ).scalar()
    avg_readiness = db.query(func.avg(Enrollment.readiness_score)).filter(
        Enrollment.status == EnrollmentStatusEnum.active
    ).scalar()
    total_submissions = db.query(func.count(Submission.id)).scalar()
    graded = db.query(func.count(Submission.id)).filter(
        Submission.status == SubmissionStatusEnum.graded
    ).scalar()
    return {
        "students": students or 0,
        "interns": interns or 0,
        "active_deployments": active_deployments or 0,
        "ppo_confirmed": ppo_confirmed or 0,
        "avg_readiness_score": round(float(avg_readiness or 0), 1),
        "total_submissions": total_submissions or 0,
        "graded_submissions": graded or 0,
        "conversion_rate": round((interns / students * 100) if students else 0, 1),
    }

@router.get("/cohort-performance")
def cohort_performance(db: Session = Depends(get_db), _=Depends(get_current_user)):
    cohorts = db.query(Cohort).all()
    result = []
    for c in cohorts:
        avg = db.query(func.avg(Enrollment.readiness_score)).filter(
            Enrollment.cohort_id == c.id
        ).scalar()
        count = db.query(func.count(Enrollment.id)).filter(Enrollment.cohort_id == c.id).scalar()
        result.append({
            "cohort_name": c.name,
            "track": c.track,
            "student_count": count or 0,
            "avg_readiness": round(float(avg or 0), 1)
        })
    return result