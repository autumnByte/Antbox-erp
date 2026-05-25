from sqlalchemy.orm import Session
from sqlalchemy import func
from uuid import UUID
from app.models.enrollment import Enrollment
from app.models.submission import Submission, SubmissionStatusEnum
from app.models.task import Task

def recalculate_readiness(db: Session, enrollment_id: UUID) -> float:
    """Recalculate readiness score for an enrollment based on graded submissions."""
    enrollment = db.query(Enrollment).filter(Enrollment.id == enrollment_id).first()
    if not enrollment:
        return 0.0

    # Get all graded submissions for this enrollment
    graded = db.query(Submission).filter(
        Submission.enrollment_id == enrollment_id,
        Submission.status == SubmissionStatusEnum.graded,
        Submission.score != None
    ).all()

    if not graded:
        return 0.0

    # Get corresponding tasks for max scores
    total_earned = sum(s.score for s in graded)
    total_possible = 0
    for s in graded:
        task = db.query(Task).filter(Task.id == s.task_id).first()
        if task:
            total_possible += task.max_score
        else:
            total_possible += 100.0

    if total_possible == 0:
        return 0.0

    score = round((total_earned / total_possible) * 100, 1)
    enrollment.readiness_score = score
    db.commit()
    return score