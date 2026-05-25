"""
Payroll Pydantic schemas — request/response models only.
The SQLAlchemy model lives in app/models/payroll.py.
"""
from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from enum import Enum


class PayrollStatusEnum(str, Enum):
    pending = "pending"
    processed = "processed"
    paid = "paid"


class PayrollGenerateRequest(BaseModel):
    employee_id: UUID
    payroll_month: int   # 1–12
    payroll_year: int
    base_salary: float
    bonus: float = 0.0
    deductions: float = 0.0


class PayrollStatusUpdate(BaseModel):
    status: PayrollStatusEnum


class PayrollResponse(BaseModel):
    id: UUID
    employee_id: UUID
    employee_email: Optional[str] = None
    employee_role: Optional[str] = None
    role_snapshot: str
    payroll_month: int
    payroll_year: int
    base_salary: float
    bonus: float
    deductions: float
    net_salary: float
    status: PayrollStatusEnum
    generated_by: Optional[UUID] = None
    paid_at: Optional[str] = None
    created_at: Optional[str] = None

    class Config:
        from_attributes = True


class PayrollSummaryStats(BaseModel):
    total_disbursed: float = 0
    current_month_net: float = 0
    total_deductions: float = 0
    headcount: int = 0


class MonthlyPayrollSummary(BaseModel):
    month: int
    year: int
    total_net: float
    record_count: int