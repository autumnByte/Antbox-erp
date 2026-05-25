import uuid
from sqlalchemy import Column, String, Integer, DateTime, Text, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from app.core.database import Base

class CohortStatusEnum(str, enum.Enum):
    upcoming = "upcoming"
    active = "active"
    completed = "completed"

class Cohort(Base):
    __tablename__ = "cohorts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    track = Column(String(100), nullable=False)  # SDE, GTM, Product
    status = Column(Enum(CohortStatusEnum), default=CohortStatusEnum.upcoming)
    start_date = Column(DateTime(timezone=True), nullable=True)
    end_date = Column(DateTime(timezone=True), nullable=True)
    max_students = Column(Integer, default=30)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    enrollments = relationship("Enrollment", back_populates="cohort")
    tasks = relationship("Task", back_populates="cohort")