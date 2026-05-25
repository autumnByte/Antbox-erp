from pydantic import BaseModel, EmailStr
from enum import Enum
from typing import Optional


class RoleEnum(str, Enum):
    student = "student"
    intern = "intern"
    staff = "staff"
    admin = "admin"
    client = "client"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: RoleEnum
    user_id: str
    name: Optional[str] = None
    redirect: str


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    role: RoleEnum
    name: Optional[str] = None
    track: Optional[str] = None
    college: Optional[str] = None


class UserUpdateProfile(BaseModel):
    name: Optional[str] = None
    track: Optional[str] = None
    college: Optional[str] = None
    base_salary: Optional[float] = None
