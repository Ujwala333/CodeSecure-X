"""MongoDB User document — with hashed password and role support."""

from datetime import datetime, timezone
from typing import Literal

from beanie import Document, Indexed
from pydantic import EmailStr, Field


class User(Document):
    username: Indexed(str, unique=True)  # type: ignore[valid-type]
    email: Indexed(EmailStr, unique=True)  # type: ignore[valid-type]
    hashed_password: str
    role: Literal["user", "admin"] = "user"
    is_active: bool = True
    full_name: str | None = None          # Optional display name; falls back to username
    avatar_url: str | None = None         # URL to uploaded avatar image; null = none set
    reset_token: str | None = None
    reset_token_expires: datetime | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "users"
