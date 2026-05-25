import uuid
from sqlalchemy import Column, String, Boolean, DateTime, Text, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import enum
from app.core.database import Base

class NotificationTypeEnum(str, enum.Enum):
    info = "info"
    success = "success"
    warning = "warning"
    action_required = "action_required"

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    body = Column(Text, nullable=True)
    notification_type = Column(Enum(NotificationTypeEnum), default=NotificationTypeEnum.info)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())