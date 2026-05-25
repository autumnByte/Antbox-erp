"""
Leave Routes — Full CRUD for leave requests with auto-notifications.

POST   /api/leaves           — Apply for leave (intern/student)
GET    /api/leaves           — List leaves (HR/staff see all, others see own)
GET    /api/leaves/{id}      — Get single leave
PATCH  /api/leaves/{id}      — Approve or reject (HR/staff only)
DELETE /api/leaves/{id}      — Cancel own pending leave
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from datetime import date, datetime, timezone
from typing import Optional
from uuid import UUID

from app.core.database import get_db
from app.core.deps import get_current_user, require_staff_or_admin
from app.models.user import User
from app.models.leave import LeaveRequest, LeaveStatusEnum
from app.models.notifications import Notification, NotificationTypeEnum
from app.schemas.erp import LeaveCreate, LeaveStatusUpdate

router = APIRouter()


def _leave_to_dict(leave: LeaveRequest, db: Session) -> dict:
    user = db.query(User).filter(User.id == leave.user_id).first()
    return {
        "id": str(leave.id),
        "user_id": str(leave.user_id),
        "user_email": user.email if user else None,
        "user_name": user.name or (user.email.split("@")[0] if user else "—"),
        "from_date": leave.from_date.isoformat(),
        "to_date": leave.to_date.isoformat(),
        "reason": leave.reason,
        "status": leave.status.value,
        "created_at": leave.created_at.isoformat() if leave.created_at else None,
        "reviewed_at": leave.reviewed_at.isoformat() if leave.reviewed_at else None,
    }


def _push_notification(db: Session, user_id, title: str, body: str, ntype=NotificationTypeEnum.info):
    """Create a notification record in the DB."""
    notif = Notification(
        user_id=user_id,
        title=title,
        body=body,
        notification_type=ntype,
    )
    db.add(notif)
    # Don't commit here — caller will commit


@router.post("", status_code=201)
def apply_leave(
    payload: LeaveCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Submit a leave request. Any authenticated user can apply for themselves."""
    if payload.from_date > payload.to_date:
        raise HTTPException(status_code=400, detail="from_date must be before or equal to to_date")

    leave = LeaveRequest(
        user_id=current_user.id,
        from_date=payload.from_date,
        to_date=payload.to_date,
        reason=payload.reason,
        status=LeaveStatusEnum.pending,
    )
    db.add(leave)

    # Notify HR/admin users automatically
    hr_users = db.query(User).filter(User.role.in_(["admin", "staff"]), User.is_active == True).all()
    name = current_user.name or current_user.email.split("@")[0]
    for hr in hr_users:
        _push_notification(
            db, hr.id,
            title=f"Leave Request — {name}",
            body=f"{name} applied for leave from {payload.from_date} to {payload.to_date}. Reason: {payload.reason}",
            ntype=NotificationTypeEnum.action_required,
        )

    db.commit()
    db.refresh(leave)
    return _leave_to_dict(leave, db)


@router.get("")
def list_leaves(
    status: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    List leave requests.
    - admin: all requests, optionally filtered by status
    - staff/intern/student: only their own
    """
    q = db.query(LeaveRequest)

    if current_user.role.value != "admin":
        q = q.filter(LeaveRequest.user_id == current_user.id)

    if status:
        try:
            q = q.filter(LeaveRequest.status == LeaveStatusEnum(status))
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid status: {status}")

    q = q.order_by(desc(LeaveRequest.created_at))
    leaves = q.offset(skip).limit(limit).all()
    return [_leave_to_dict(l, db) for l in leaves]


@router.get("/{leave_id}")
def get_leave(
    leave_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    leave = db.query(LeaveRequest).filter(LeaveRequest.id == leave_id).first()
    if not leave:
        raise HTTPException(status_code=404, detail="Leave request not found")
    if current_user.role.value != "admin" and leave.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    return _leave_to_dict(leave, db)


@router.patch("/{leave_id}")
def review_leave(
    leave_id: UUID,
    payload: LeaveStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff_or_admin),
):
    """Approve or reject a leave. HR/Staff only."""
    leave = db.query(LeaveRequest).filter(LeaveRequest.id == leave_id).first()
    if not leave:
        raise HTTPException(status_code=404, detail="Leave request not found")
    if leave.status != LeaveStatusEnum.pending:
        raise HTTPException(status_code=400, detail=f"Leave is already {leave.status.value}")

    leave.status = LeaveStatusEnum(payload.status.value)
    leave.reviewed_by = current_user.id
    leave.reviewed_at = datetime.now(timezone.utc)

    # Notify the applicant
    verb = "approved" if payload.status.value == "approved" else "rejected"
    reviewer_name = current_user.name or current_user.email.split("@")[0]
    _push_notification(
        db, leave.user_id,
        title=f"Leave {verb.capitalize()}",
        body=f"Your leave from {leave.from_date} to {leave.to_date} has been {verb} by {reviewer_name}.",
        ntype=NotificationTypeEnum.success if verb == "approved" else NotificationTypeEnum.warning,
    )

    db.commit()
    db.refresh(leave)
    return _leave_to_dict(leave, db)


@router.delete("/{leave_id}", status_code=204)
def cancel_leave(
    leave_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Cancel own pending leave."""
    leave = db.query(LeaveRequest).filter(LeaveRequest.id == leave_id).first()
    if not leave:
        raise HTTPException(status_code=404, detail="Leave request not found")
    if leave.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Cannot cancel someone else's leave")
    if leave.status != LeaveStatusEnum.pending:
        raise HTTPException(status_code=400, detail="Only pending leaves can be cancelled")
    db.delete(leave)
    db.commit()