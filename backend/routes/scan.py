"""Scan routes — JWT-protected."""

import logging
from fastapi import APIRouter, HTTPException, status, Depends

from schemas.scan_schema import ScanRequest, ScanResponse, ScanHistoryItem
from services.vulnerability_service import run_scan, get_scan_history
from utils.dependencies import get_current_user
from models.user_model import User

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/scan", tags=["Scan"])


@router.post("/analyze", response_model=ScanResponse, status_code=status.HTTP_200_OK)
async def analyze_code(request: ScanRequest, current_user: User = Depends(get_current_user)):
    """Submit code for vulnerability analysis. Requires authentication."""
    try:
        return await run_scan(code=request.code, language=request.language, user_id=current_user.id)
    except RuntimeError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc))
    except Exception:
        logger.exception("Unexpected error during scan")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred. Please try again.",
        )


@router.get("/history", response_model=list[ScanHistoryItem])
async def scan_history(limit: int = 50, _: User = Depends(get_current_user)):
    """Return scan history. Requires authentication."""
    try:
        return await get_scan_history(limit=min(limit, 200))
    except Exception:
        logger.exception("Failed to fetch scan history")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch scan history.",
        )
