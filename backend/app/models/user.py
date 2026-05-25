"""
User model — extended with name, track, college, salary for full ERP support.
Roles standardised: student | intern | staff | admin | client
"""
import uuid
import enum
from sqlalchemy import Column, String, Boolean, Enum, DateTime, ForeignKey, Numeric, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.core.database import Base


class RoleEnum(str, enum.Enum):
    student = "student"
    intern = "intern"
    staff = "staff"
    admin = "admin"
    client = "client"


class IDTypeEnum(str, enum.Enum):
    demo = "demo"
    real = "real"


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(Enum(RoleEnum), nullable=False)
    id_type = Column(Enum(IDTypeEnum), nullable=False, default=IDTypeEnum.demo)

    # Extended profile fields
    name = Column(String(255), nullable=True)
    track = Column(String(100), nullable=True)       # SDE / GTM / PROD / etc.
    college = Column(String(255), nullable=True)
    base_salary = Column(Numeric(12, 2), nullable=True, default=0)
    readiness_score = Column(Integer, nullable=True, default=0)
    demo_id = Column(String(32), nullable=True, unique=True)

    is_active = Column(Boolean, default=True)
    totp_secret = Column(String, nullable=True)
    last_login_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
