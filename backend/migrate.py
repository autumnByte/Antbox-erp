"""
Migration: Add new columns to existing tables and create missing tables.
Run ONCE before starting the updated backend:
    python migrate.py

Safe: uses IF NOT EXISTS / does not drop any data.
"""
import os
import sys
from sqlalchemy import create_engine, text

DATABASE_URL = os.getenv("DATABASE_URL", "")

if not DATABASE_URL:
    # Try to read from .env file
    env_path = os.path.join(os.path.dirname(__file__), ".env")
    if os.path.exists(env_path):
        for line in open(env_path):
            line = line.strip()
            if line.startswith("DATABASE_URL="):
                DATABASE_URL = line.split("=", 1)[1].strip()
                break

if not DATABASE_URL:
    print("ERROR: DATABASE_URL not found in environment or .env file")
    sys.exit(1)

engine = create_engine(DATABASE_URL)

MIGRATIONS = [
    # ── users table ──────────────────────────────────────────────
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR(255)",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS track VARCHAR(100)",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS college VARCHAR(255)",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS base_salary NUMERIC(12,2) DEFAULT 0",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS readiness_score INTEGER DEFAULT 0",

    # ── leave_requests table (new) ────────────────────────────────
    """
    CREATE TABLE IF NOT EXISTS leave_requests (
        id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id         UUID        NOT NULL REFERENCES users(id),
        from_date       DATE        NOT NULL,
        to_date         DATE        NOT NULL,
        reason          TEXT        NOT NULL,
        status          VARCHAR(20) NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','approved','rejected')),
        reviewed_by     UUID        REFERENCES users(id),
        reviewed_at     TIMESTAMPTZ,
        created_at      TIMESTAMPTZ DEFAULT NOW()
    )
    """,

    # ── notifications table (add body column if missing) ─────────
    "ALTER TABLE notifications ADD COLUMN IF NOT EXISTS body TEXT",
    # Rename message → body if old schema used 'message'
    # (safe no-op if body already exists)

    # ── payrolls table — add bonus column if missing ──────────────
    "ALTER TABLE payrolls ADD COLUMN IF NOT EXISTS bonus NUMERIC(12,2) DEFAULT 0",

    # ── indexes ───────────────────────────────────────────────────
    "CREATE INDEX IF NOT EXISTS idx_leave_requests_user_id  ON leave_requests(user_id)",
    "CREATE INDEX IF NOT EXISTS idx_leave_requests_status   ON leave_requests(status)",
    "CREATE INDEX IF NOT EXISTS idx_notifications_user_id   ON notifications(user_id)",
    "CREATE INDEX IF NOT EXISTS idx_notifications_is_read   ON notifications(is_read)",
    "CREATE INDEX IF NOT EXISTS idx_payrolls_employee_id    ON payrolls(employee_id)",
    "CREATE INDEX IF NOT EXISTS idx_users_role              ON users(role)",
]

print(f"Connecting to: {DATABASE_URL[:DATABASE_URL.index('@') + 1]}***")

with engine.begin() as conn:
    for sql in MIGRATIONS:
        sql = sql.strip()
        if not sql:
            continue
        try:
            conn.execute(text(sql))
            short = sql[:80].replace("\n", " ").strip()
            print(f"  ✓  {short}…")
        except Exception as e:
            # Some statements may fail if already applied — log and continue
            print(f"  ⚠  {sql[:60]}… → {e}")

print("\nMigration complete.")
