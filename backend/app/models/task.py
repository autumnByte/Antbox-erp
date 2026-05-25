import uuid
from sqlalchemy import Column, String, Integer, Float, DateTime, Text, ForeignKey, Enum, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from app.core.database import Base

class TaskTypeEnum(str, enum.Enum):
    assignment = "assignment"
    quiz = "quiz"
    project = "project"
    peer_review = "peer_review"

class Task(Base):
    __tablename__ = "tasks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    cohort_id = Column(UUID(as_uuid=True), ForeignKey("cohorts.id"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    task_type = Column(Enum(TaskTypeEnum), default=TaskTypeEnum.assignment)
    track = Column(String(100), nullable=True)  # SDE or GTM
    max_score = Column(Float, default=100.0)
    due_date = Column(DateTime(timezone=True), nullable=True)
    week_number = Column(Integer, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    cohort = relationship("Cohort", back_populates="tasks")
    submissions = relationship("Submission", back_populates="task")