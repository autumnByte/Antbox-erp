"""
seeds_payroll.py — Realistic demo payroll seed for Antbox ERP
=============================================================
Run AFTER seeds.py (users must exist).

Salary ranges:
  intern:  ₹15K–₹30K stipend
  staff:   ₹40K–₹90K salary
  admin:   ₹1L+ executive

    python seeds_payroll.py
"""
import os, sys

DATABASE_URL = os.getenv("DATABASE_URL", "")
if not DATABASE_URL:
    env_path = os.path.join(os.path.dirname(__file__), ".env")
    if os.path.exists(env_path):
        for line in open(env_path):
            line = line.strip()
            if line.startswith("DATABASE_URL="):
                DATABASE_URL = line.split("=", 1)[1].strip()

if not DATABASE_URL:
    print("ERROR: DATABASE_URL not found"); sys.exit(1)

sys.path.insert(0, os.path.dirname(__file__))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.database import Base
from app.models.user import User
from app.models.payroll import Payroll, PayrollStatusEnum

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
Base.metadata.create_all(bind=engine)
db = SessionLocal()

def get_user(email):
    return db.query(User).filter(User.email == email).first()

admin    = get_user("admin@antbox.io")
aryan    = get_user("aryan@intern.io")
priya    = get_user("priya@intern.io")
rohan    = get_user("rohan@intern.io")
sales    = get_user("sales@antbox.io")
ops      = get_user("ops@antbox.io")
deployed = get_user("deployed@client.io")

if not admin:
    print("ERROR: Admin user not found. Run seeds.py first.")
    db.close()
    sys.exit(1)

gen_id = admin.id

# ─── Update user base_salary fields for realism ──────────────────────────────
salary_map = {
    "aryan@intern.io":     22000,
    "priya@intern.io":     20000,
    "rohan@intern.io":     22000,
    "sales@antbox.io":     55000,
    "ops@antbox.io":       65000,
    "deployed@client.io":  30000,
    "admin@antbox.io":     125000,
}
for email, sal in salary_map.items():
    u = get_user(email)
    if u:
        u.base_salary = sal
db.commit()

def make(employee, role_snap, month, year, base, bonus, deduct, status, paid_at=None):
    if not employee:
        return None
    net = max(0, base + bonus - deduct)
    return dict(
        employee_id=employee.id,
        role_snapshot=role_snap,
        payroll_month=month,
        payroll_year=year,
        base_salary=base,
        bonus=bonus,
        deductions=deduct,
        net_salary=net,
        status=status,
        generated_by=gen_id,
    )

P = PayrollStatusEnum
RECORDS = [
    # ── Aryan Mehta | SDE Intern (₹22K base) ─────────────────────────────────
    make(aryan, "intern",  1, 2025, 22000, 1000, 1500, P.paid),
    make(aryan, "intern",  2, 2025, 22000, 1500, 1500, P.paid),
    make(aryan, "intern",  3, 2025, 22000, 2000, 1500, P.paid),
    make(aryan, "intern",  4, 2025, 22000, 1500, 1500, P.paid),
    make(aryan, "intern",  5, 2025, 22000, 3000, 1500, P.processed),

    # ── Priya Sharma | GTM Intern (₹20K base) ────────────────────────────────
    make(priya, "intern",  2, 2025, 20000,  500, 1200, P.paid),
    make(priya, "intern",  3, 2025, 20000, 1000, 1200, P.paid),
    make(priya, "intern",  4, 2025, 20000, 1500, 1200, P.paid),
    make(priya, "intern",  5, 2025, 20000, 2000, 1200, P.pending),

    # ── Rohan Das | SDE Intern (₹22K base) ───────────────────────────────────
    make(rohan, "intern",  3, 2025, 22000,    0, 2200, P.paid),   # deduction for absence
    make(rohan, "intern",  4, 2025, 22000,    0, 1500, P.paid),
    make(rohan, "intern",  5, 2025, 22000, 1000, 1500, P.processed),

    # ── Ananya Rao | Sales Lead (₹55K base) ──────────────────────────────────
    make(sales, "staff",   2, 2025, 55000, 8000, 4000, P.paid),
    make(sales, "staff",   3, 2025, 55000, 5000, 4000, P.paid),
    make(sales, "staff",   4, 2025, 55000, 5000, 4000, P.paid),
    make(sales, "staff",   5, 2025, 55000, 8000, 4000, P.processed),

    # ── Rohit Kulkarni | Ops Manager (₹65K base) ─────────────────────────────
    make(ops,   "staff",   2, 2025, 65000, 5000, 5200, P.paid),
    make(ops,   "staff",   3, 2025, 65000, 6000, 5200, P.paid),
    make(ops,   "staff",   4, 2025, 65000, 6000, 5200, P.paid),
    make(ops,   "staff",   5, 2025, 65000, 7000, 5200, P.processed),

    # ── Deployed Intern | Client (₹30K) ──────────────────────────────────────
    make(deployed, "client", 3, 2025, 30000, 2000, 2000, P.paid),
    make(deployed, "client", 4, 2025, 30000, 2500, 2000, P.paid),
    make(deployed, "client", 5, 2025, 30000, 3000, 2000, P.pending),

    # ── Admin | Executive (₹1.25L base) ──────────────────────────────────────
    make(admin, "admin",   3, 2025, 125000, 20000, 12000, P.paid),
    make(admin, "admin",   4, 2025, 125000, 15000, 12000, P.paid),
    make(admin, "admin",   5, 2025, 125000, 25000, 12000, P.processed),
]

created = skipped = 0
for rec in RECORDS:
    if rec is None:
        continue
    exists = db.query(Payroll).filter(
        Payroll.employee_id   == rec["employee_id"],
        Payroll.payroll_month == rec["payroll_month"],
        Payroll.payroll_year  == rec["payroll_year"],
    ).first()
    if exists:
        skipped += 1
        continue
    db.add(Payroll(**rec))
    print(f"  ✓  {rec['role_snapshot']:8s}  {rec['payroll_month']:02d}/{rec['payroll_year']}"
          f"  base=₹{rec['base_salary']:,}  bonus=₹{rec['bonus']:,}  net=₹{rec['net_salary']:,}"
          f"  [{rec['status'].value}]")
    created += 1

db.commit()
db.close()
print(f"\nDone. {created} created, {skipped} skipped.")
