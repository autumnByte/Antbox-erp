import uuid
from sqlalchemy import Column, String, Float, DateTime, Text, ForeignKey, Enum, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from app.core.database import Base

class DeploymentStatusEnum(str, enum.Enum):
    pool = "pool"
    selected = "selected"
    active = "active"
    ppo_review = "ppo_review"
    ppo_confirmed = "ppo_confirmed"
    completed = "completed"

class Deployment(Base):
    __tablename__ = "deployments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    intern_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    client_id = Column(UUID(as_uuid=True), ForeignKey("clients.id"), nullable=False)
    status = Column(Enum(DeploymentStatusEnum), default=DeploymentStatusEnum.pool)
    ppo_progress = Column(Float, default=0.0)  # 0-100
    client_rating = Column(Float, nullable=True)
    tasks_completed = Column(Integer, default=0)
    tasks_total = Column(Integer, default=40)
    hours_logged = Column(Float, default=0.0)
    start_date = Column(DateTime(timezone=True), nullable=True)
    end_date = Column(DateTime(timezone=True), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    intern = relationship("User", foreign_keys=[intern_user_id])
    client = relationship("Client", back_populates="deployments")