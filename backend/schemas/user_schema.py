"""Pydantic schemas for auth + user responses."""

from pydantic import BaseModel, EmailStr, Field


# ─── Auth request schemas ──────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    username: str = Field(min_length=3, max_length=32)
    email: EmailStr
    password: str = Field(min_length=8, description="Minimum 8 characters")


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(min_length=8)


# ─── Auth response schemas ─────────────────────────────────────────────────────

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    role: str
    is_active: bool
    created_at: str


# ─── Admin-only schemas ────────────────────────────────────────────────────────

class SuspendRequest(BaseModel):
    user_id: str
