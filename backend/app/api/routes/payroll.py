"""
Payroll API Routes — Antbox ERP
================================
RBAC Architecture:
  intern/client  → GET /api/payroll/me        (own records only)
  staff          → GET /api/payroll/me        (own salary only)
  admin          → GET /api/payroll           (full ledger)
  admin          → POST /api/payroll/generate
  admin          → GET /api/payroll/stats/summary
  admin          → PATCH /api/payroll/{id}/status

STRICT SEPARATION:
  - /me endpoint is self-only, role-aware terminology
  - base GET / is HR/Admin only — returns 403 for others
  - /generate is admin-only (not staff)
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from uuid import UUID

from app.core.database import get_db
from app.core.deps import get_current_user, require_staff_or_admin
from app.models.user import User, RoleEnum
from app.schemas.payroll import PayrollGenerateRequest, PayrollStatusUpdate
from app.services import payroll_service

router = APIRouter()


# ─── SELF-VIEW: Intern / Staff — own payroll only ─────────────────────────────
@router.get("/me")
def get_my_payroll(
    month: Optional[int] = Query(None, ge=1, le=12),
    year: Optional[int] = Query(None, ge=2020, le=2100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns ONLY the current user's own payroll records.
    Works for interns (stipend) and staff (salary).
    HR/Admin can also call this to see their own executive payroll.
    """
    return payroll_service.get_my_payroll(
        db=db,
        user=current_user,
        month=month,
        year=year,
    )


# ─── HR ENGINE: Admin-only full ledger ────────────────────────────────────────
@router.get("")
def list_payroll(
    month: Optional[int] = Query(None, ge=1, le=12),
    year: Optional[int] = Query(None, ge=2020, le=2100),
    role: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    employee_id: Optional[UUID] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    HR/Admin full payroll ledger.
    Returns 403 for non-admin/non-staff roles.
    Interns and staff must use /me for their own data.
    """
    if current_user.role not in (RoleEnum.admin, RoleEnum.staff):
        raise HTTPException(
            status_code=403,
            detail="Full payroll ledger is restricted to HR and Admin. Use /api/payroll/me for your own payroll."
        )
    return payroll_service.get_payroll_list(
        db=db,
        requesting_user=current_user,
        month=month,
        year=year,
        role_filter=role,
        status_filter=status,
        employee_id_filter=employee_id,
        skip=skip,
        limit=limit,
    )


# ─── PAYROLL STATS: HR/Admin only ─────────────────────────────────────────────
@router.get("/stats/summary")
def get_payroll_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Aggregated payroll KPIs — ADMIN/HR ONLY."""
    if current_user.role not in (RoleEnum.admin, RoleEnum.staff):
        raise HTTPException(
            status_code=403,
            detail="Payroll summary is restricted to HR/Admin."
        )
    return payroll_service.get_payroll_stats(db)


# ─── GENERATE: Admin-only ─────────────────────────────────────────────────────
@router.post("/generate", status_code=201)
def generate_payroll(
    payload: PayrollGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate a payroll record. Admin only."""
    if current_user.role not in (RoleEnum.admin, RoleEnum.staff):
        raise HTTPException(status_code=403, detail="Only HR/Admin can generate payroll.")
    try:
        record = payroll_service.generate_payroll(payload, current_user.id, db)
        return record
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ─── BULK GENERATE: Admin-only ────────────────────────────────────────────────
@router.post("/generate/bulk", status_code=201)
def generate_bulk_payroll(
    month: int = Query(..., ge=1, le=12),
    year: int = Query(..., ge=2020, le=2100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate payroll for ALL active employees for a given month. Admin only."""
    if current_user.role not in (RoleEnum.admin, RoleEnum.staff):
        raise HTTPException(status_code=403, detail="Only HR/Admin can run bulk payroll.")
    try:
        result = payroll_service.generate_bulk_payroll(month, year, current_user.id, db)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ─── SINGLE RECORD ────────────────────────────────────────────────────────────
@router.get("/{payroll_id}")
def get_payroll(
    payroll_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Single payroll record. RBAC: non-admin can only see their own."""
    try:
        return payroll_service.get_payroll_by_id(payroll_id, current_user, db)
    except LookupError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))


# ─── STATUS UPDATE: Admin/HR only ────────────────────────────────────────────
@router.patch("/{payroll_id}/status")
def update_status(
    payroll_id: UUID,
    payload: PayrollStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update payroll status: pending → processed → paid. Admin/HR only."""
    if current_user.role not in (RoleEnum.admin, RoleEnum.staff):
        raise HTTPException(status_code=403, detail="Only HR/Admin can update payroll status.")
    try:
        return payroll_service.update_payroll_status(payroll_id, payload.status.value, db)
    except LookupError as e:
        raise HTTPException(status_code=404, detail=str(e))
