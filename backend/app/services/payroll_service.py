"""
Payroll Service — Antbox ERP
==============================
RBAC Architecture:
  get_my_payroll()    → self-only, any role (intern/staff/admin)
  get_payroll_list()  → HR/Admin full ledger only
  get_payroll_stats() → HR/Admin aggregations only
  generate_payroll()  → Admin/HR only
  generate_bulk()     → Admin/HR only

Salary ranges (realistic demo):
  intern:  ₹15K–₹30K base stipend
  staff:   ₹40K–₹90K salary
  admin:   ₹1L+ executive
"""
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from typing import Optional, List
from uuid import UUID
from decimal import Decimal
from datetime import datetime, timezone
import calendar

from app.models.payroll import Payroll, PayrollStatusEnum
from app.models.user import User, RoleEnum
from app.schemas.payroll import PayrollGenerateRequest

MONTH_NAMES = [
    "", "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
]

# Default base salaries by role (for bulk generation)
ROLE_BASE_SALARY = {
    "intern": 22000,
    "staff": 60000,
    "admin": 120000,
    "client": 30000,
    "student": 0,
}

ROLE_BONUS_DEFAULT = {
    "intern": 2000,
    "staff": 6000,
    "admin": 15000,
    "client": 3000,
    "student": 0,
}

ROLE_DEDUCTION_DEFAULT = {
    "intern": 1500,
    "staff": 4500,
    "admin": 10000,
    "client": 2000,
    "student": 0,
}


def _build_payroll_response(payroll: Payroll, db: Session) -> dict:
    """Build a normalized payroll response dict from ORM object."""
    employee = db.query(User).filter(User.id == payroll.employee_id).first()
    generator = (
        db.query(User).filter(User.id == payroll.generated_by).first()
        if payroll.generated_by else None
    )
    emp_role = employee.role.value if employee else (payroll.role_snapshot or "unknown")

    return {
        "id": str(payroll.id),
        "employee_id": str(payroll.employee_id),
        "employee_name": getattr(employee, "name", None) or (employee.email.split("@")[0].title() if employee else "—"),
        "employee_email": employee.email if employee else None,
        "employee_role": emp_role,
        "role_snapshot": payroll.role_snapshot,
        "payroll_month": payroll.payroll_month,
        "payroll_year": payroll.payroll_year,
        "month_label": f"{MONTH_NAMES[payroll.payroll_month]} {payroll.payroll_year}",
        "base_salary": float(payroll.base_salary),
        "bonus": float(payroll.bonus),
        "deductions": float(payroll.deductions),
        "net_salary": float(payroll.net_salary),
        "status": payroll.status.value,
        "generated_by": str(payroll.generated_by) if payroll.generated_by else None,
        "generator_email": generator.email if generator else None,
        "paid_at": payroll.paid_at.isoformat() if payroll.paid_at else None,
        "created_at": payroll.created_at.isoformat() if payroll.created_at else None,
    }


# ─── SELF-VIEW ────────────────────────────────────────────────────────────────
def get_my_payroll(
    db: Session,
    user: User,
    month: Optional[int] = None,
    year: Optional[int] = None,
) -> dict:
    """
    Returns the calling user's OWN payroll records only.
    Role-aware response structure:
      - intern → stipend terminology
      - staff/admin → salary terminology
    """
    query = db.query(Payroll).filter(Payroll.employee_id == user.id)

    if month:
        query = query.filter(Payroll.payroll_month == month)
    if year:
        query = query.filter(Payroll.payroll_year == year)

    records = query.order_by(
        Payroll.payroll_year.desc(),
        Payroll.payroll_month.desc()
    ).all()

    items = [_build_payroll_response(p, db) for p in records]

    # Compute personal summary stats
    total_net = sum(r["net_salary"] for r in items)
    total_deductions = sum(r["deductions"] for r in items)
    total_bonus = sum(r["bonus"] for r in items)
    latest = items[0] if items else None

    # Role-aware terminology
    role = user.role.value
    if role == "intern":
        label = "stipend"
        pay_label = "Base Stipend"
    elif role in ("staff", "admin"):
        label = "salary"
        pay_label = "Base Salary"
    else:
        label = "pay"
        pay_label = "Base Pay"

    return {
        "role": role,
        "pay_label": pay_label,
        "terminology": label,
        "employee_name": getattr(user, "name", None) or user.email.split("@")[0].title(),
        "employee_email": user.email,
        "summary": {
            "current_month_net": float(latest["net_salary"]) if latest else 0,
            "current_month_base": float(latest["base_salary"]) if latest else 0,
            "current_month_bonus": float(latest["bonus"]) if latest else 0,
            "current_month_deductions": float(latest["deductions"]) if latest else 0,
            "current_month_status": latest["status"] if latest else "—",
            "current_month_label": latest["month_label"] if latest else "—",
            "total_net_received": total_net,
            "total_deductions": total_deductions,
            "total_bonus": total_bonus,
            "record_count": len(items),
        },
        "records": items,
    }


# ─── HR FULL LEDGER ───────────────────────────────────────────────────────────
def get_payroll_list(
    db: Session,
    requesting_user: User,
    month: Optional[int] = None,
    year: Optional[int] = None,
    role_filter: Optional[str] = None,
    status_filter: Optional[str] = None,
    employee_id_filter: Optional[UUID] = None,
    skip: int = 0,
    limit: int = 100,
) -> List[dict]:
    """HR/Admin full payroll ledger with filters."""
    query = db.query(Payroll)

    if employee_id_filter:
        query = query.filter(Payroll.employee_id == employee_id_filter)
    if month:
        query = query.filter(Payroll.payroll_month == month)
    if year:
        query = query.filter(Payroll.payroll_year == year)
    if role_filter:
        query = query.filter(Payroll.role_snapshot == role_filter)
    if status_filter:
        query = query.filter(Payroll.status == status_filter)

    payrolls = query.order_by(
        Payroll.payroll_year.desc(),
        Payroll.payroll_month.desc(),
        Payroll.created_at.desc()
    ).offset(skip).limit(limit).all()

    return [_build_payroll_response(p, db) for p in payrolls]


# ─── SINGLE RECORD ────────────────────────────────────────────────────────────
def get_payroll_by_id(payroll_id: UUID, requesting_user: User, db: Session) -> dict:
    payroll = db.query(Payroll).filter(Payroll.id == payroll_id).first()
    if not payroll:
        raise LookupError("Payroll record not found")

    if requesting_user.role not in (RoleEnum.admin, RoleEnum.staff):
        if payroll.employee_id != requesting_user.id:
            raise PermissionError("Access denied — you can only view your own payroll")

    return _build_payroll_response(payroll, db)


# ─── STATUS UPDATE ────────────────────────────────────────────────────────────
def update_payroll_status(payroll_id: UUID, new_status: str, db: Session) -> dict:
    payroll = db.query(Payroll).filter(Payroll.id == payroll_id).first()
    if not payroll:
        raise LookupError("Payroll record not found")

    payroll.status = PayrollStatusEnum(new_status)
    if new_status == "paid" and not payroll.paid_at:
        payroll.paid_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(payroll)
    return _build_payroll_response(payroll, db)


# ─── GENERATE SINGLE ──────────────────────────────────────────────────────────
def generate_payroll(payload: PayrollGenerateRequest, generated_by_id: UUID, db: Session) -> dict:
    employee = db.query(User).filter(User.id == payload.employee_id).first()
    if not employee:
        raise ValueError("Employee not found")

    existing = db.query(Payroll).filter(
        Payroll.employee_id == payload.employee_id,
        Payroll.payroll_month == payload.payroll_month,
        Payroll.payroll_year == payload.payroll_year,
    ).first()
    if existing:
        raise ValueError(
            f"Payroll already generated for {MONTH_NAMES[payload.payroll_month]} {payload.payroll_year}"
        )

    net = max(0.0, float(payload.base_salary) + float(payload.bonus) - float(payload.deductions))

    payroll = Payroll(
        employee_id=payload.employee_id,
        role_snapshot=employee.role.value,
        payroll_month=payload.payroll_month,
        payroll_year=payload.payroll_year,
        base_salary=payload.base_salary,
        bonus=payload.bonus,
        deductions=payload.deductions,
        net_salary=round(net, 2),
        status=PayrollStatusEnum.pending,
        generated_by=generated_by_id,
    )

    db.add(payroll)
    db.commit()
    db.refresh(payroll)
    return _build_payroll_response(payroll, db)


# ─── BULK GENERATE ────────────────────────────────────────────────────────────
def generate_bulk_payroll(month: int, year: int, generated_by_id: UUID, db: Session) -> dict:
    """Generate payroll for all active employees who don't have a record yet."""
    active_users = db.query(User).filter(
        User.is_active == True,
        User.role.in_([RoleEnum.intern, RoleEnum.staff, RoleEnum.admin])
    ).all()

    created = []
    skipped = []

    for user in active_users:
        existing = db.query(Payroll).filter(
            Payroll.employee_id == user.id,
            Payroll.payroll_month == month,
            Payroll.payroll_year == year,
        ).first()
        if existing:
            skipped.append(str(user.id))
            continue

        role = user.role.value
        base = float(user.base_salary or 0) or ROLE_BASE_SALARY.get(role, 0)
        if base == 0:
            continue  # skip users with no salary configured

        bonus = ROLE_BONUS_DEFAULT.get(role, 0)
        deductions = ROLE_DEDUCTION_DEFAULT.get(role, 0)
        net = max(0.0, base + bonus - deductions)

        payroll = Payroll(
            employee_id=user.id,
            role_snapshot=role,
            payroll_month=month,
            payroll_year=year,
            base_salary=base,
            bonus=bonus,
            deductions=deductions,
            net_salary=round(net, 2),
            status=PayrollStatusEnum.pending,
            generated_by=generated_by_id,
        )
        db.add(payroll)
        created.append(user.email)

    db.commit()

    return {
        "month": month,
        "year": year,
        "month_label": f"{MONTH_NAMES[month]} {year}",
        "created_count": len(created),
        "skipped_count": len(skipped),
        "created_for": created,
        "message": f"Payroll generated for {len(created)} employees. {len(skipped)} already existed.",
    }


# ─── STATS ────────────────────────────────────────────────────────────────────
def get_payroll_stats(db: Session) -> dict:
    """Aggregate payroll statistics for HR/Admin dashboard KPIs."""
    now = datetime.now()
    current_month = now.month
    current_year = now.year

    totals = db.query(
        func.count(Payroll.id).label("total_records"),
        func.sum(Payroll.net_salary).label("total_net"),
        func.sum(Payroll.bonus).label("total_bonus"),
        func.sum(Payroll.deductions).label("total_deductions"),
        func.sum(Payroll.base_salary).label("total_base"),
    ).first()

    status_rows = db.query(
        Payroll.status,
        func.count(Payroll.id).label("count"),
        func.sum(Payroll.net_salary).label("total"),
    ).group_by(Payroll.status).all()

    by_status = {
        row.status.value: {"count": row.count, "total": float(row.total or 0)}
        for row in status_rows
    }

    role_rows = db.query(
        Payroll.role_snapshot,
        func.count(Payroll.id).label("count"),
        func.avg(Payroll.net_salary).label("avg_salary"),
        func.sum(Payroll.net_salary).label("total"),
    ).group_by(Payroll.role_snapshot).all()

    by_role = {
        row.role_snapshot: {
            "count": row.count,
            "avg_salary": round(float(row.avg_salary or 0), 2),
            "total": float(row.total or 0),
        }
        for row in role_rows
    }

    month_q = db.query(
        func.sum(Payroll.net_salary).label("total"),
        func.count(Payroll.id).label("count"),
    ).filter(
        Payroll.payroll_month == current_month,
        Payroll.payroll_year == current_year,
    ).first()

    pending_q = db.query(func.count(Payroll.id)).filter(
        Payroll.status == PayrollStatusEnum.pending
    ).scalar()

    monthly_trend = []
    for i in range(5, -1, -1):
        m = current_month - i
        y = current_year
        if m <= 0:
            m += 12
            y -= 1
        row = db.query(
            func.sum(Payroll.net_salary).label("total"),
            func.count(Payroll.id).label("count"),
            func.avg(Payroll.net_salary).label("avg"),
        ).filter(
            Payroll.payroll_month == m,
            Payroll.payroll_year == y,
        ).first()

        monthly_trend.append({
            "month": m,
            "year": y,
            "month_label": f"{MONTH_NAMES[m][:3]} {str(y)[2:]}",
            "total_net": float(row.total or 0),
            "headcount": row.count or 0,
            "avg_salary": round(float(row.avg or 0), 2),
        })

    return {
        "total_records": totals.total_records or 0,
        "total_net_salary": float(totals.total_net or 0),
        "total_bonus": float(totals.total_bonus or 0),
        "total_deductions": float(totals.total_deductions or 0),
        "total_base_salary": float(totals.total_base or 0),
        "current_month_net": float(month_q.total or 0),
        "current_month_count": month_q.count or 0,
        "pending_count": pending_q or 0,
        "by_status": by_status,
        "by_role": by_role,
        "monthly_trend": monthly_trend,
    }
