from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime

UserRole = Literal["Super Admin", "Admin", "Analyst", "Viewer"]
UserStatus = Literal["active", "suspended"]


class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    role: UserRole = "Analyst"


class UserLogin(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: UserRole
    avatar: str = ""
    status: UserStatus = "active"
    lastLogin: Optional[datetime] = None
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None


class UpdateProfile(BaseModel):
    name: Optional[str] = None
    avatar: Optional[str] = None


class ChangePassword(BaseModel):
    currentPassword: str
    newPassword: str
