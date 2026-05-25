"""
Notification Routes

GET  /api/notifications           — List own notifications (newest first)
POST /api/notifications/read-all  — Mark all as read
POST /api/notifications/read/{id} — Mark single as read
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, update
from typing import Optional

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.notifications import Notification
import time

router = APIRouter()


def _notif_to_dict(n: Notification) -> dict:
    # Map DB enum → frontend string key
    type_map = {
        "info": "info",
        "success": "success",
        "warning": "warning",
        "action_required": "warning",
    }
    ts_ms = int(n.created_at.timestamp() * 1000) if n.created_at else int(time.time() * 1000)
    return {
        "id": str(n.id),
        "user_id": str(n.user_id),
        "title": n.title,
        "message": n.body or "",
        "type": type_map.get(n.notification_type.value if n.notification_type else "info", "info"),
        "is_read": n.is_read,
        "read": n.is_read,       # frontend compat alias
        "ts": ts_ms,
        "created_at": n.created_at.isoformat() if n.created_at else None,
    }


@router.get("")
def list_notifications(
    unread_only: bool = Query(False),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return the current user's notifications, newest first."""
    q = db.query(Notification).filter(Notification.user_id == current_user.id)
    if unread_only:
        q = q.filter(Notification.is_read == False)
    notifications = q.order_by(desc(Notification.created_at)).offset(skip).limit(limit).all()
    return [_notif_to_dict(n) for n in notifications]


@router.post("/read-all", status_code=200)
def mark_all_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False,
    ).update({"is_read": True}, synchronize_session=False)
    db.commit()
    return {"message": "All notifications marked as read"}


@router.post("/read/{notif_id}", status_code=200)
def mark_one_read(
    notif_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from uuid import UUID
    try:
        uid = UUID(notif_id)
    except ValueError:
        return {"message": "Invalid ID"}
    notif = db.query(Notification).filter(
        Notification.id == uid,
        Notification.user_id == current_user.id,
    ).first()
    if notif:
        notif.is_read = True
        db.commit()
    return {"message": "Marked as read"}
