"""Profile router — GET/PATCH /me, POST /avatar, POST /change-password."""

import json
import logging
import os
import shutil
import uuid
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from models.scan_model import Scan
from models.user_model import User
from schemas.profile_schema import (
    AvatarResponse,
    ChangePasswordRequest,
    ProfileResponse,
    ProfileUpdateRequest,
)
from utils.dependencies import get_current_user
from utils.security import hash_password, verify_password

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/profile", tags=["Profile"])

# ─── Local avatar storage ──────────────────────────────────────────────────────

AVATARS_DIR = Path(__file__).parent.parent / "static" / "avatars"
AVATARS_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_AVATAR_BYTES = 2 * 1024 * 1024  # 2 MB

PLAN_MAP = {"admin": "Enterprise", "user": "Pro"}

# URL base — served by FastAPI StaticFiles (registered in main.py)
AVATAR_URL_BASE = "http://localhost:8000/static/avatars"


# ─── Helpers ───────────────────────────────────────────────────────────────────

async def _build_profile(user: User) -> ProfileResponse:
    """Aggregate scan stats and build a ProfileResponse for the given user."""
    all_scans = []
    last_scan_at: Optional[str] = None
    total_scans = 0

    try:
        all_scans = (
            await Scan.find()
            .sort(-Scan.created_at)
            .to_list()
        )
        total_scans = len(all_scans)
        if all_scans:
            ts = all_scans[0].created_at
            last_scan_at = ts.isoformat().replace("+00:00", "Z") if ts.tzinfo else ts.isoformat() + "Z"
    except Exception as exc:
        logger.warning("Could not aggregate scans for profile: %s", exc)

    member_ts = user.created_at
    member_since = (
        member_ts.isoformat().replace("+00:00", "Z")
        if member_ts.tzinfo
        else member_ts.isoformat() + "Z"
    )

    display_name = user.full_name or user.username

    return ProfileResponse(
        id=str(user.id),
        full_name=display_name,
        email=user.email,
        avatar_url=user.avatar_url,
        role=user.role.replace("_", " ").title(),
        plan=PLAN_MAP.get(user.role, "Free"),
        member_since=member_since,
        total_scans_run=total_scans,
        last_scan_at=last_scan_at,
    )


# ─── GET /api/profile/me ──────────────────────────────────────────────────────

@router.get("/me", response_model=ProfileResponse)
async def get_profile(current_user: User = Depends(get_current_user)) -> ProfileResponse:
    """Return the current user's full profile including scan stats."""
    return await _build_profile(current_user)


# ─── PATCH /api/profile/me ────────────────────────────────────────────────────

@router.patch("/me", response_model=ProfileResponse)
async def update_profile(
    body: ProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
) -> ProfileResponse:
    """Update full_name and/or email. Returns updated profile."""
    # Email uniqueness check (exclude self)
    if body.email != current_user.email:
        existing = await User.find_one(User.email == body.email)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email is already taken by another account.",
            )

    current_user.full_name = body.full_name
    current_user.email = body.email
    await current_user.save()
    logger.info("Profile updated for user %s", current_user.id)
    return await _build_profile(current_user)


# ─── POST /api/profile/avatar ─────────────────────────────────────────────────

@router.post("/avatar", response_model=AvatarResponse)
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
) -> AvatarResponse:
    """Accept a JPEG/PNG/WEBP upload and store it locally."""
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Only JPEG, PNG, and WEBP images are allowed.",
        )

    contents = await file.read()
    if len(contents) > MAX_AVATAR_BYTES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="File must be under 2MB.",
        )

    # Derive extension from content-type
    ext_map = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp"}
    ext = ext_map[file.content_type]
    filename = f"{uuid.uuid4().hex}.{ext}"
    dest = AVATARS_DIR / filename

    with open(dest, "wb") as f:
        f.write(contents)

    # Delete previous avatar file if it was a local upload
    if current_user.avatar_url and "/static/avatars/" in current_user.avatar_url:
        old_filename = current_user.avatar_url.split("/static/avatars/")[-1]
        old_path = AVATARS_DIR / old_filename
        if old_path.exists():
            old_path.unlink(missing_ok=True)

    avatar_url = f"{AVATAR_URL_BASE}/{filename}"
    current_user.avatar_url = avatar_url
    await current_user.save()
    logger.info("Avatar uploaded for user %s → %s", current_user.id, avatar_url)
    return AvatarResponse(avatar_url=avatar_url)


# ─── POST /api/profile/change-password ────────────────────────────────────────

@router.post("/change-password")
async def change_password(
    body: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
) -> dict:
    """Verify current password and set a new hashed one."""
    if not verify_password(body.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        )
    # confirm_password and strength validation handled by Pydantic model_validator
    current_user.hashed_password = hash_password(body.new_password)
    await current_user.save()
    logger.info("Password changed for user %s", current_user.id)
    return {"message": "Password updated successfully"}


# ─── DELETE /api/profile/me ───────────────────────────────────────────────────

@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
async def delete_account(current_user: User = Depends(get_current_user)):
    """Delete the authenticated user's account and associated data."""
    # Delete previous avatar file if local
    if current_user.avatar_url and "/static/avatars/" in current_user.avatar_url:
        old_filename = current_user.avatar_url.split("/static/avatars/")[-1]
        old_path = AVATARS_DIR / old_filename
        if old_path.exists():
            old_path.unlink(missing_ok=True)
            
    # Note: In a real app, you might also want to delete the user's scans from MongoDB
    # e.g., await Scan.find(Scan.user_id == current_user.id).delete()
    
    await current_user.delete()
    logger.info("Account deleted for user %s", current_user.id)
    return None
