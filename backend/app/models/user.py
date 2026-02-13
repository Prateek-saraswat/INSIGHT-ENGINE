from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum
import re


class UserStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"


class User(BaseModel):
    id: Optional[str] = None
    email: str
    username: str
    hashed_password: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    status: UserStatus = UserStatus.ACTIVE


class UserCreate(BaseModel):
    email: str = Field(..., min_length=5)
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=8)
    confirm_password: str


class UserLogin(BaseModel):
    email: str = Field(..., min_length=5)
    password: str = Field(..., min_length=1)


class UserResponse(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    email: str
    username: str
    created_at: datetime

    class Config:
        populate_by_name = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class TokenData(BaseModel):
    user_id: Optional[str] = None
