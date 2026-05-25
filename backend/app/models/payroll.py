import uuid
from sqlalchemy import Column, String, Float, Integer, DateTime, ForeignKey, Enum, Numeric
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from app.core.database import Base


class PayrollStatusEnum(str, enum.Enum):
    pending = "pending"
    processed = "processed"
    paid = "paid"


class Payroll(Base):
    __tablename__ = "payrolls"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    employee_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    role_snapshot = Column(String(50), nullable=False)  # snapshot of role at generation time
    payroll_month = Column(Integer, nullable=False)      # 1-12
    payroll_year = Column(Integer, nullable=False)

    base_salary = Column(Numeric(12, 2), nullable=False, default=0)
    bonus = Column(Numeric(12, 2), nullable=False, default=0)
    deductions = Column(Numeric(12, 2), nullable=False, default=0)
    net_salary = Column(Numeric(12, 2), nullable=False, default=0)  # auto-calculated

    status = Column(Enum(PayrollStatusEnum), default=PayrollStatusEnum.pending)
    generated_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    paid_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    employee = relationship("User", foreign_keys=[employee_id])
    generator = relationship("User", foreign_keys=[generated_by])