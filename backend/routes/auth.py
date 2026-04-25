"""Auth routes: /register, /login, /me."""

import logging
import secrets
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, HTTPException, status, Depends

from models.user_model import User
from schemas.user_schema import (
    RegisterRequest, 
    LoginRequest, 
    TokenResponse, 
    UserResponse,
    ForgotPasswordRequest,
    ResetPasswordRequest
)
from utils.security import hash_password, verify_password, create_access_token
from utils.dependencies import get_current_user
from utils.email import send_reset_email

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(body: RegisterRequest):
    """Create a new user account with bcrypt-hashed password."""
    # Check uniqueness
    if await User.find_one(User.email == body.email):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
    if await User.find_one(User.username == body.username):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Username already taken")

    user = User(
        username=body.username,
        email=body.email,
        hashed_password=hash_password(body.password),
    )
    
    if await User.count() == 0:
        user.role = "admin"
        
    await user.insert()
    logger.info("New user registered: %s", user.email)

    return UserResponse(
        id=str(user.id),
        username=user.username,
        email=user.email,
        role=user.role,
        is_active=user.is_active,
        created_at=user.created_at.isoformat(),
    )


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest):
    """Authenticate user and return a signed JWT access token."""
    user = await User.find_one(User.email == body.email)

    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account suspended. Contact support.",
        )

    token = create_access_token(data={"sub": str(user.id), "role": user.role})
    logger.info("User logged in: %s", user.email)
    return TokenResponse(access_token=token)


@router.get("/me", response_model=UserResponse)
async def me(current_user: User = Depends(get_current_user)):
    """Return the currently authenticated user's profile."""
    return UserResponse(
        id=str(current_user.id),
        username=current_user.username,
        email=current_user.email,
        role=current_user.role,
        is_active=current_user.is_active,
        created_at=current_user.created_at.isoformat(),
    )


@router.post("/forgot-password")
async def forgot_password(body: ForgotPasswordRequest):
    """Generate a reset token and send an email."""
    user = await User.find_one(User.email == body.email)
    
    # Security: Always return 200 to avoid email enumeration
    if not user:
        return {"message": "If this email is registered, a reset link has been sent."}

    token = secrets.token_hex(32)
    user.reset_token = token
    user.reset_token_expires = datetime.now(timezone.utc) + timedelta(minutes=15)
    await user.save()

    reset_link = f"http://localhost:3000/reset-password?token={token}"
    try:
        await send_reset_email(user.email, reset_link)
    except RuntimeError as exc:
        logger.warning("Skipped reset email because mail is not configured: %s", exc)
        return {"message": "If this email is registered, a reset link has been sent."}
    except Exception as e:
        logger.error(f"Failed to send reset email: {e}")
        # In production, you might not want to reveal this error
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send email. Please try again later."
        )

    return {"message": "If this email is registered, a reset link has been sent."}


@router.post("/reset-password")
async def reset_password(body: ResetPasswordRequest):
    """Verify token and update password."""
    user = await User.find_one(
        User.reset_token == body.token,
        User.reset_token_expires > datetime.now(timezone.utc)
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )

    user.hashed_password = hash_password(body.new_password)
    user.reset_token = None
    user.reset_token_expires = None
    await user.save()

    return {"message": "Password reset successfully."}
