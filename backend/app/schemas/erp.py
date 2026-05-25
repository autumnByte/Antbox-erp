"""
Schemas for Leave Requests and Notifications — used by FastAPI routes.
"""
from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional
from uuid import UUID
from enum import Enum


# ──────────────────────────────────────────────
# LEAVE SCHEMAS
# ──────────────────────────────────────────────

class LeaveStatusEnum(str, Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"


class LeaveCreate(BaseModel):
    from_date: date
    to_date: date
    reason: str


class LeaveStatusUpdate(BaseModel):
    status: LeaveStatusEnum


class LeaveResponse(BaseModel):
    id: UUID
    user_id: UUID
    user_email: Optional[str] = None
    user_name: Optional[str] = None
    from_date: date
    to_date: date
    reason: str
    status: LeaveStatusEnum
    created_at: Optional[datetime] = None
    reviewed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ──────────────────────────────────────────────
# NOTIFICATION SCHEMAS
# ──────────────────────────────────────────────

class NotifTypeEnum(str, Enum):
    info = "info"
    success = "success"
    warning = "warning"
    action_required = "action_required"


class NotificationCreate(BaseModel):
    user_id: UUID
    title: str
    body: Optional[str] = None
    notification_type: NotifTypeEnum = NotifTypeEnum.info


class NotificationResponse(BaseModel):
    id: UUID
    user_id: UUID
    title: str
    body: Optional[str] = None
    type: str                    # frontend expects "type" not "notification_type"
    is_read: bool
    ts: Optional[int] = None    # unix ms timestamp for frontend compatibility
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
