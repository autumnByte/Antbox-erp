"""
Migration: Add demo_id column to users table.
Run once: python migrate_demo_id.py
"""
from app.core.database import engine
from sqlalchemy import text

def run():
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS demo_id VARCHAR(32) UNIQUE;"))
            conn.commit()
            print("✓ demo_id column added to users table.")
        except Exception as e:
            print(f"Migration error (may already exist): {e}")

if __name__ == "__main__":
    run()
