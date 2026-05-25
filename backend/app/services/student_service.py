"""
Student ID Service — ANT-{TRACK}-{YEAR}-{SEQ} generation logic.
Injected into the enrollment flow without modifying existing models.
This module is enrollment-safe and duplicate-proof.

Format: ANT-{TRACK}-{YEAR}-{SEQ}
Examples:
  ANT-SDE-2026-001
  ANT-GTM-2026-014
  ANT-PROD-2026-032
"""
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime

from app.models.enrollment import Enrollment


# Canonical track code map — normalizes raw track strings to short codes
TRACK_CODE_MAP = {
    "sde": "SDE",
    "software": "SDE",
    "engineering": "SDE",
    "gtm": "GTM",
    "go-to-market": "GTM",
    "growth": "GTM",
    "sales": "GTM",
    "product": "PROD",
    "pm": "PROD",
    "product management": "PROD",
    "design": "DSN",
    "data": "DATA",
    "analytics": "DATA",
    "finance": "FIN",
    "ops": "OPS",
    "operations": "OPS",
}

DEFAULT_TRACK_CODE = "GEN"


def normalize_track_code(track: str) -> str:
    """Normalize a raw track string to a compact ID-safe code."""
    if not track:
        return DEFAULT_TRACK_CODE
    normalized = track.strip().upper()
    # Direct match first
    if normalized in TRACK_CODE_MAP.values():
        return normalized
    # Fuzzy match
    key = track.strip().lower()
    for k, v in TRACK_CODE_MAP.items():
        if k in key:
            return v
    # Fallback: use first 4 chars, uppercase, stripped of non-alpha
    code = "".join(c for c in normalized if c.isalpha())[:4]
    return code if code else DEFAULT_TRACK_CODE


def get_next_sequence(track_code: str, year: int, db: Session) -> int:
    """
    Get the next available sequence number for a given track+year.
    Scans existing student_codes to find the maximum and increments.
    Thread-safety: relies on DB unique constraint on student_code.
    """
    prefix = f"ANT-{track_code}-{year}-"

    # Pull all existing student_codes for this track+year prefix
    existing = db.query(Enrollment.student_code).filter(
        Enrollment.student_code.like(f"{prefix}%")
    ).all()

    if not existing:
        return 1

    max_seq = 0
    for (code,) in existing:
        if code and code.startswith(prefix):
            try:
                seq = int(code[len(prefix):])
                if seq > max_seq:
                    max_seq = seq
            except ValueError:
                pass

    return max_seq + 1


def generate_student_code(track: str, year: int, db: Session) -> str:
    """
    Generate a unique, padded student ID.
    Format: ANT-{TRACK_CODE}-{YEAR}-{SEQ:03d}
    Retries on collision up to 10 times.
    """
    track_code = normalize_track_code(track)

    for attempt in range(10):
        seq = get_next_sequence(track_code, year, db)
        # For retries, bump the sequence
        if attempt > 0:
            seq += attempt

        candidate = f"ANT-{track_code}-{year}-{seq:03d}"

        # Check uniqueness directly
        collision = db.query(Enrollment).filter(
            Enrollment.student_code == candidate
        ).first()

        if not collision:
            return candidate

    raise RuntimeError(
        f"Could not generate a unique student code for track={track}, year={year} after 10 attempts"
    )


def assign_student_code_if_missing(enrollment: Enrollment, db: Session) -> str:
    """
    Assign a student_code to an enrollment if it doesn't already have one.
    Safe to call multiple times — idempotent.
    """
    if enrollment.student_code:
        return enrollment.student_code

    track = enrollment.track or "GEN"
    year = datetime.now().year

    # If the enrollment has an enrolled_at date, use that year
    if enrollment.enrolled_at:
        year = enrollment.enrolled_at.year

    code = generate_student_code(track, year, db)
    enrollment.student_code = code
    db.commit()
    db.refresh(enrollment)
    return code