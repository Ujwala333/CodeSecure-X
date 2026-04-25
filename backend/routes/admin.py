"""Admin routes — JWT-protected, admin role required."""

import json
import logging
from fastapi import APIRouter, HTTPException, status, Depends
from beanie import PydanticObjectId

import math
from models.user_model import User
from models.scan_model import Scan
from models.report_model import Report
from models.admin_log import AdminLog
from schemas.user_schema import UserResponse, SuspendRequest
from utils.dependencies import require_admin

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/users", response_model=list[UserResponse])
async def list_users(_: User = Depends(require_admin)):
    """Return all registered users (excluding admins). Admin only."""
    users = await User.find({"role": {"$ne": "admin"}}).sort(-User.created_at).to_list()
    return [
        UserResponse(
            id=str(u.id),
            username=u.username,
            email=u.email,
            role=u.role,
            is_active=u.is_active,
            created_at=u.created_at.isoformat(),
        )
        for u in users
    ]


@router.post("/suspend", status_code=status.HTTP_200_OK)
async def suspend_user(request: SuspendRequest, admin: User = Depends(require_admin)):
    """Suspend a user account. Admin only."""
    try:
        oid = PydanticObjectId(request.user_id)
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid user ID")

    user = await User.get(oid)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    if not user.is_active:
        return {"message": f"User {request.user_id} is already suspended"}

    user.is_active = False
    await user.save()

    # Create Audit Log
    log = AdminLog(
        admin_id=admin.id,
        action="suspend_user",
        target_user_id=user.id
    )
    await log.insert()

    return {"message": f"User {request.user_id} has been suspended"}


@router.post("/unsuspend", status_code=status.HTTP_200_OK)
async def unsuspend_user(request: SuspendRequest, admin: User = Depends(require_admin)):
    """Restore a suspended user account. Admin only."""
    try:
        oid = PydanticObjectId(request.user_id)
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid user ID")

    user = await User.get(oid)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    if user.is_active:
        return {"message": f"User {request.user_id} is already active"}

    user.is_active = True
    await user.save()

    # Create Audit Log
    log = AdminLog(
        admin_id=admin.id,
        action="unsuspend_user",
        target_user_id=user.id
    )
    await log.insert()

    return {"message": f"User {request.user_id} has been restored"}

@router.get("/analytics")
async def get_analytics(_: User = Depends(require_admin)):
    """Return aggregated platform analytics (excluding admins). Admin only."""
    total_scans = await Scan.count()
    total_users = await User.find({"role": {"$ne": "admin"}}).count()
    active_users = await User.find({"is_active": True, "role": {"$ne": "admin"}}).count()

    all_scans = await Scan.find_all().to_list()
    vuln_counter: dict[str, int] = {}
    for s in all_scans:
        try:
            vulns = json.loads(s.vulnerabilities_json or "[]")
            for v in vulns:
                vtype = v.get("type", "Unknown")
                vuln_counter[vtype] = vuln_counter.get(vtype, 0) + 1
        except json.JSONDecodeError:
            continue

    top_vulns = sorted(vuln_counter.items(), key=lambda x: x[1], reverse=True)[:10]

    return {
        "total_scans":        total_scans,
        "total_users":        total_users,
        "active_users":       active_users,
        "top_vulnerabilities": [{"type": t, "count": c} for t, c in top_vulns],
    }


@router.get("/reports")
async def get_admin_reports(
    search: str = "",
    page: int = 1,
    limit: int = 20,
    admin: User = Depends(require_admin)
):
    """Fetch paginated generated PDF reports across all users. Admin only."""
    logger.info(f"Admin reports fetched by {admin.email}")
    
    # Fetch all reports, descending order
    all_reports = await Report.find().sort(-Report.created_at).to_list()
    
    # Collect IDs for manual join
    scan_ids = [r.scan_id for r in all_reports]
    scans = await Scan.find({"_id": {"$in": scan_ids}}).to_list()
    scan_map = {s.id: s for s in scans}
    
    user_ids = []
    for r in all_reports:
        uid = getattr(r, "user_id", None)
        if not uid and r.scan_id in scan_map:
            uid = getattr(scan_map[r.scan_id], "user_id", None)
        if uid:
            user_ids.append(uid)
            
    from beanie.operators import In
    if user_ids:
        users = await User.find(In(User.id, user_ids)).to_list()
    else:
        users = []
    user_map = {u.id: u for u in users}
    
    results = []
    search_lower = search.lower()
    
    for r in all_reports:
        scan = scan_map.get(r.scan_id)
        if not scan:
            continue
            
        uid = getattr(r, "user_id", None) or getattr(scan, "user_id", None)
        user = user_map.get(uid)
        
        if user and user.email != "anonymous@system.local":
            user_email = user.email
            user_name = user.full_name or user.username
        else:
            user_email = "unknown"
            user_name = "Unknown User"
            
        scan_name = getattr(scan, "filename", None) or f"{scan.language.capitalize()} Scan"
        
        if search_lower:
            if search_lower not in user_email.lower() and search_lower not in scan_name.lower():
                continue
                
        # Format ISODate matching the frontend expectation
        gen_at = r.created_at.isoformat()
        if "+00:00" in gen_at:
            gen_at = gen_at.replace("+00:00", "Z")
        elif not gen_at.endswith("Z"):
            gen_at += "Z"

        results.append({
            "report_id": str(r.id),
            "user_email": user_email,
            "user_name": user_name,
            "scan_name": scan_name,
            "scan_id": str(scan.id),
            "generated_at": gen_at,
            "pdf_url": f"/report/{r.scan_id}"
        })
        
    total = len(results)
    total_pages = max(1, math.ceil(total / limit))
    start = (page - 1) * limit
    end = start + limit

    paginated = results[start:end]
    
    return {
        "reports": paginated,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": total_pages
    }


@router.get("/scans/{scan_id}")
async def get_admin_scan(scan_id: str, admin: User = Depends(require_admin)):
    """Fetch a single scan's metadata including user context. Admin only."""
    logger.info(f"Admin viewed scan {scan_id} — by {admin.email}")
    try:
        oid = PydanticObjectId(scan_id)
    except Exception:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scan not found")
        
    scan = await Scan.get(oid)
    if scan is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scan not found")
        
    import json
    try:
        vulns = json.loads(scan.vulnerabilities_json or "[]")
    except Exception:
        vulns = []
        
    score = getattr(scan, "security_health_score", None)
    label = getattr(scan, "score_label", None)
    
    high = sum(1 for v in vulns if v.get("severity", "").upper() in ("HIGH", "CRITICAL"))
    medium = sum(1 for v in vulns if v.get("severity", "").upper() == "MEDIUM")
    low = sum(1 for v in vulns if v.get("severity", "").upper() == "LOW")
    
    if score is None:
        score = 100 - (high * 15) - (medium * 7) - (low * 2)
        score = max(0, min(100, score))
        if score <= 40: label = "Critical Risk"
        elif score <= 60: label = "High Risk"
        elif score <= 74: label = "Moderate Risk"
        elif score <= 89: label = "Good Standing"
        else: label = "Secure"

    uid = getattr(scan, "user_id", None)
    user = await User.get(uid) if uid else None
    
    gen_at = scan.created_at.isoformat()
    if "+00:00" in gen_at:
        gen_at = gen_at.replace("+00:00", "Z")
    elif not gen_at.endswith("Z"):
        gen_at += "Z"
        
    return {
        "scan_id": str(scan.id),
        "scan_name": getattr(scan, "filename", None) or f"{scan.language.capitalize()} Scan",
        "language": scan.language,
        "scanned_at": gen_at,
        "security_health_score": score,
        "score_label": label,
        "severity_counts": {
            "high": high,
            "medium": medium,
            "low": low
        },
        "user": {
            "id": str(user.id) if user and user.email != "anonymous@system.local" else "anonymous",
            "full_name": (user.full_name or user.username) if user and user.email != "anonymous@system.local" else "Unknown User",
            "email": user.email if user and user.email != "anonymous@system.local" else "unknown",
            "avatar_url": getattr(user, "avatar_url", None) if user else None
        }
    }


