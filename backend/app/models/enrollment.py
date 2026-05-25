import uuid
from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, Enum, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from app.core.database import Base

class EnrollmentStatusEnum(str, enum.Enum):
    active = "active"
    completed = "completed"
    dropped = "dropped"
    converted = "converted"  # became intern

class Enrollment(Base):
    __tablename__ = "enrollments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    cohort_id = Column(UUID(as_uuid=True), ForeignKey("cohorts.id"), nullable=False)
    status = Column(Enum(EnrollmentStatusEnum), default=EnrollmentStatusEnum.active)
    readiness_score = Column(Float, default=0.0)
    track = Column(String(100), nullable=True)
    enrolled_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", foreign_keys=[user_id])
    cohort = relationship("Cohort", back_populates="enrollments")
    submissions = relationship("Submission", back_populates="enrollment")