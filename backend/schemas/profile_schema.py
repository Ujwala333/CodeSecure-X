"""Pydantic schemas for the /api/profile endpoints."""

import re
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, model_validator


# ─── Response ─────────────────────────────────────────────────────────────────

class ProfileResponse(BaseModel):
    id: str
    full_name: Optional[str]
    email: str
    avatar_url: Optional[str]
    role: str
    plan: str
    member_since: str
    total_scans_run: int
    last_scan_at: Optional[str]


# ─── PATCH /api/profile/me ─────────────────────────────────────────────────────

class ProfileUpdateRequest(BaseModel):
    full_name: str = Field(min_length=1, max_length=100)
    email: EmailStr


# ─── POST /api/profile/avatar ─────────────────────────────────────────────────

class AvatarResponse(BaseModel):
    avatar_url: str


# ─── POST /api/profile/change-password ────────────────────────────────────────

_PW_RE_UPPER  = re.compile(r"[A-Z]")
_PW_RE_DIGIT  = re.compile(r"\d")


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8)
    confirm_password: str

    @model_validator(mode="after")
    def _validate_passwords(self) -> "ChangePasswordRequest":
        if self.new_password != self.confirm_password:
            raise ValueError("Passwords do not match")
        if not _PW_RE_UPPER.search(self.new_password):
            raise ValueError("New password must contain at least one uppercase letter")
        if not _PW_RE_DIGIT.search(self.new_password):
            raise ValueError("New password must contain at least one number")
        return self
