"""
Seeds — populate the database with realistic test data.
Run after migrate.py:
    python seeds.py

Idempotent: skips users that already exist.
"""
import os, sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

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
from app.core.security import hash_password
from app.models.user import User, RoleEnum, IDTypeEnum
from app.core.database import Base

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
Base.metadata.create_all(bind=engine)

SEED_USERS = [
    # Admins
    dict(email="admin@antbox.io",    password="admin123",   role=RoleEnum.admin,   name="Antbox Admin",     track=None,  id_type=IDTypeEnum.real),
    dict(email="hr@antbox.io",       password="hr123",      role=RoleEnum.admin,   name="HR Manager",       track=None,  id_type=IDTypeEnum.real),

    # Staff
    dict(email="sales@antbox.io",    password="staff123",   role=RoleEnum.staff,   name="Sales Lead",       track="GTM", id_type=IDTypeEnum.real, base_salary=55000),
    dict(email="ops@antbox.io",      password="staff123",   role=RoleEnum.staff,   name="Ops Manager",      track="OPS", id_type=IDTypeEnum.real, base_salary=60000),

    # Interns
    dict(email="aryan@intern.io",    password="intern123",  role=RoleEnum.intern,  name="Aryan Mehta",      track="SDE", id_type=IDTypeEnum.real, base_salary=22000),
    dict(email="priya@intern.io",    password="intern123",  role=RoleEnum.intern,  name="Priya Sharma",     track="GTM", id_type=IDTypeEnum.real, base_salary=20000),
    dict(email="rohan@intern.io",    password="intern123",  role=RoleEnum.intern,  name="Rohan Das",        track="SDE", id_type=IDTypeEnum.real, base_salary=22000),

    # Students
    dict(email="kavya@student.io",   password="student123", role=RoleEnum.student, name="Kavya Nair",       track="SDE", id_type=IDTypeEnum.demo),
    dict(email="ritu@student.io",    password="student123", role=RoleEnum.student, name="Ritu Verma",       track="GTM", id_type=IDTypeEnum.demo),
    dict(email="amit@student.io",    password="student123", role=RoleEnum.student, name="Amit Patel",       track="PROD",id_type=IDTypeEnum.demo),

    # Client / Deployed intern
    dict(email="deployed@client.io", password="client123",  role=RoleEnum.client,  name="Deployed Intern",  track="SDE", id_type=IDTypeEnum.real, base_salary=30000),
]

db = SessionLocal()
created = 0
skipped = 0

for u in SEED_USERS:
    existing = db.query(User).filter(User.email == u["email"]).first()
    if existing:
        print(f"  ↷  {u['email']} (already exists)")
        skipped += 1
        continue

    user = User(
        email=u["email"],
        password_hash=hash_password(u["password"]),
        role=u["role"],
        name=u.get("name"),
        track=u.get("track"),
        id_type=u.get("id_type", IDTypeEnum.demo),
        base_salary=u.get("base_salary", 0),
        is_active=True,
    )
    db.add(user)
    print(f"  ✓  Created {u['role'].value}: {u['email']}")
    created += 1

db.commit()

# ─── PAYROLL SEED DATA ────────────────────────────────────────────────────────
# Import after users are committed so foreign keys resolve
from app.models.payroll import Payroll, PayrollStatusEnum

print("\nSeeding payroll records…")

# Fetch users we need
admin_user  = db.query(User).filter(User.email == "admin@antbox.io").first()
aryan       = db.query(User).filter(User.email == "aryan@intern.io").first()
priya       = db.query(User).filter(User.email == "priya@intern.io").first()
rohan       = db.query(User).filter(User.email == "rohan@intern.io").first()
sales       = db.query(User).filter(User.email == "sales@antbox.io").first()
ops         = db.query(User).filter(User.email == "ops@antbox.io").first()
deployed    = db.query(User).filter(User.email == "deployed@client.io").first()

PAYROLL_SEED = []

if admin_user:
    gen_id = admin_user.id

    # Helper: build payroll dict
    def pr(employee, role_snap, month, year, base, bonus, deduct, status):
        if not employee:
            return None
        net = base + bonus - deduct
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

    PAYROLL_SEED = [
        # Aryan Mehta (SDE intern) — 3 months
        pr(aryan, "intern", 3, 2025, 22000, 2000, 1500, PayrollStatusEnum.paid),
        pr(aryan, "intern", 4, 2025, 22000, 1500, 1500, PayrollStatusEnum.paid),
        pr(aryan, "intern", 5, 2025, 22000, 3000, 1500, PayrollStatusEnum.processed),

        # Priya Sharma (GTM intern) — 3 months
        pr(priya, "intern", 3, 2025, 20000, 1000, 1200, PayrollStatusEnum.paid),
        pr(priya, "intern", 4, 2025, 20000, 1500, 1200, PayrollStatusEnum.paid),
        pr(priya, "intern", 5, 2025, 20000, 2000, 1200, PayrollStatusEnum.pending),

        # Rohan Das (SDE intern) — 2 months
        pr(rohan, "intern", 4, 2025, 22000, 0,    1500, PayrollStatusEnum.paid),
        pr(rohan, "intern", 5, 2025, 22000, 1000, 1500, PayrollStatusEnum.processed),

        # Sales Lead (staff) — 2 months
        pr(sales, "staff",  4, 2025, 55000, 5000, 4000, PayrollStatusEnum.paid),
        pr(sales, "staff",  5, 2025, 55000, 5000, 4000, PayrollStatusEnum.processed),

        # Ops Manager (staff) — 2 months
        pr(ops,   "staff",  4, 2025, 60000, 6000, 4500, PayrollStatusEnum.paid),
        pr(ops,   "staff",  5, 2025, 60000, 6000, 4500, PayrollStatusEnum.processed),

        # Deployed intern (client) — 2 months
        pr(deployed, "client", 4, 2025, 30000, 2500, 2000, PayrollStatusEnum.paid),
        pr(deployed, "client", 5, 2025, 30000, 3000, 2000, PayrollStatusEnum.pending),
    ]

p_created = p_skipped = 0
for pd in PAYROLL_SEED:
    if pd is None:
        continue
    exists = db.query(Payroll).filter(
        Payroll.employee_id == pd["employee_id"],
        Payroll.payroll_month == pd["payroll_month"],
        Payroll.payroll_year == pd["payroll_year"],
    ).first()
    if exists:
        print(f"  ↷  Payroll {pd['payroll_month']}/{pd['payroll_year']} for {pd['employee_id']} (already exists)")
        p_skipped += 1
        continue
    record = Payroll(**pd)
    db.add(record)
    print(f"  ✓  Payroll {pd['payroll_month']}/{pd['payroll_year']} — {pd['role_snapshot']} — ₹{pd['net_salary']:,.0f} ({pd['status'].value})")
    p_created += 1

db.commit()
db.close()
print(f"\nSeeding done. Users: {created} created, {skipped} skipped.")
print(f"Payroll:  {p_created} created, {p_skipped} skipped.")
print("\nTest credentials:")
print("  admin@antbox.io  / admin123   (HR/Admin dashboard)")
print("  aryan@intern.io  / intern123  (Intern dashboard)")
print("  kavya@student.io / student123 (Student dashboard)")
print("  sales@antbox.io  / staff123   (Staff dashboard)")
