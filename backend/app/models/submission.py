import uuid
from sqlalchemy import Column, String, Float, DateTime, Text, ForeignKey, Enum, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from app.core.database import Base

class SubmissionStatusEnum(str, enum.Enum):
    submitted = "submitted"
    graded = "graded"
    revision_requested = "revision_requested"

class Submission(Base):
    __tablename__ = "submissions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    task_id = Column(UUID(as_uuid=True), ForeignKey("tasks.id"), nullable=False)
    enrollment_id = Column(UUID(as_uuid=True), ForeignKey("enrollments.id"), nullable=False)
    submission_url = Column(String(500), nullable=True)
    notes = Column(Text, nullable=True)
    status = Column(Enum(SubmissionStatusEnum), default=SubmissionStatusEnum.submitted)
    score = Column(Float, nullable=True)
    grader_feedback = Column(Text, nullable=True)
    submitted_at = Column(DateTime(timezone=True), server_default=func.now())
    graded_at = Column(DateTime(timezone=True), nullable=True)
    graded_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    task = relationship("Task", back_populates="submissions")
    enrollment = relationship("Enrollment", back_populates="submissions")