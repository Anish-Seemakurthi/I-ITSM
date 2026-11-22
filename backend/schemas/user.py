from __future__ import annotations
from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, List
from datetime import datetime
from models.user import UserRole


class UserCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    email: EmailStr
    password: str = Field(..., min_length=6)
    role: UserRole = UserRole.EMPLOYEE


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead


class UserRead(BaseModel):
    id: str
    name: str
    email: str
    role: UserRole
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class TechnicianCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    email: EmailStr
    password: str = Field(..., min_length=6)
    skills: List[str] = Field(default_factory=list)
    max_workload: int = Field(default=5, ge=1, le=20)


class TechnicianRead(BaseModel):
    id: str
    name: str
    email: str
    role: UserRole
    is_active: bool
    created_at: datetime
    skills: Optional[List[str]] = None
    availability: Optional[bool] = True
    max_workload: Optional[int] = 5
    current_workload: Optional[int] = 0

    model_config = {"from_attributes": True}


class TechnicianUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    skills: Optional[List[str]] = None
    availability: Optional[bool] = None
    max_workload: Optional[int] = Field(None, ge=1, le=20)
    is_active: Optional[bool] = None


class UserAdminUpdate(BaseModel):
    is_active: Optional[bool] = None
    role: Optional[UserRole] = None
