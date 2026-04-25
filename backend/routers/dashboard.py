"""Dashboard summary router — powers the SecureCodeAI analytics dashboard."""

import json
import logging
from collections import defaultdict
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from models.user_model import User
from utils.dependencies import get_current_user

from models.scan_model import Scan
from schemas.dashboard_schema import (
    DashboardSummary,
    FindingsBreakdown,
    RecentScanItem,
    VulnOverTimePoint,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

# ─── Score helpers ─────────────────────────────────────────────────────────────

BENCHMARK_SCORE = 72


def _compute_score(high: int, medium: int, low: int) -> int:
    raw = 100 - high * 5 - medium * 2 - low * 0.5
    return max(0, min(100, round(raw)))


def _score_label(score: int) -> str:
    if score <= 40:
        return "Critical"
    if score <= 60:
        return "At Risk"
    if score <= 74:
        return "Fair"
    if score <= 89:
        return "Good Standing"
    return "Excellent"


def _change_pct(current: int, previous: int) -> int:
    if previous == 0:
        return 100 if current > 0 else 0
    return round((current - previous) / previous * 100)


def _parse_findings(vulns: list[dict]) -> tuple[int, int, int]:
    """Return (high, medium, low) counts from a list of vulnerability dicts."""
    high = medium = low = 0
    for v in vulns:
        sev = (v.get("severity") or "").lower()
        if sev in ("high", "critical"):
            high += 1
        elif sev == "medium":
            medium += 1
        else:
            low += 1
    return high, medium, low


# ─── Endpoint ──────────────────────────────────────────────────────────────────

@router.get("/summary", response_model=DashboardSummary)
async def dashboard_summary(current_user: User = Depends(get_current_user)) -> DashboardSummary:
    """Aggregate scan data and return dashboard KPIs for the logged-in user."""
    now = datetime.now(timezone.utc)
    today = now.date()

    # Fetch scans specific to the logged-in user
    try:
        all_scans = await Scan.find(Scan.user_id == current_user.id).sort(-Scan.created_at).to_list()
    except Exception as exc:
        logger.warning("MongoDB unavailable for dashboard — returning zeroed summary. %s", exc)
        all_scans = []

    # Parse vulnerabilities for every scan once
    parsed: list[tuple[Scan, list[dict], int, int, int]] = []
    for scan in all_scans:
        try:
            vulns: list[dict] = json.loads(scan.vulnerabilities_json or "[]")
        except json.JSONDecodeError:
            vulns = []
        h, m, l = _parse_findings(vulns)
        parsed.append((scan, vulns, h, m, l))

    # ── Month boundaries ───────────────────────────────────────────────────────
    first_this_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    first_prev_month = (first_this_month - timedelta(days=1)).replace(
        day=1, hour=0, minute=0, second=0, microsecond=0
    )

    curr_scans = curr_high = prev_scans = prev_high = 0
    for scan, _, h, m, l in parsed:
        ts = scan.created_at
        if ts.tzinfo is None:
            ts = ts.replace(tzinfo=timezone.utc)
        if ts >= first_this_month:
            curr_scans += 1
            curr_high += h
        elif ts >= first_prev_month:
            prev_scans += 1
            prev_high += h

    # ── Overall totals for score ───────────────────────────────────────────────
    total_high   = sum(h for _, _, h, _, _ in parsed)
    total_medium = sum(m for _, _, _, m, _ in parsed)
    total_low    = sum(l for _, _, _, _, l in parsed)

    security_score = _compute_score(total_high, total_medium, total_low)

    # ── Last 30 days chart data ────────────────────────────────────────────────
    day_map: dict[str, dict] = {
        (today - timedelta(days=i)).isoformat(): {"high": 0, "medium": 0, "low": 0}
        for i in range(29, -1, -1)
    }

    for scan, _, h, m, l in parsed:
        ts = scan.created_at
        if ts.tzinfo is None:
            ts = ts.replace(tzinfo=timezone.utc)
        day_str = ts.date().isoformat()
        if day_str in day_map:
            day_map[day_str]["high"]   += h
            day_map[day_str]["medium"] += m
            day_map[day_str]["low"]    += l

    vulnerabilities_over_time = [
        VulnOverTimePoint(date=date, **counts)
        for date, counts in day_map.items()
    ]

    # ── Recent 5 scans ─────────────────────────────────────────────────────────
    recent_scans: list[RecentScanItem] = []
    for scan, vulns, h, m, l in parsed[:5]:
        language = scan.language or "Unknown"
        lang_display = language.capitalize()
        recent_scans.append(
            RecentScanItem(
                id=str(scan.id),
                name=f"{lang_display} Scan",
                environment="Production Environment",
                language=lang_display,
                findings=FindingsBreakdown(high=h, medium=m, low=l),
                scanned_at=scan.created_at.isoformat().replace("+00:00", "Z")
                if scan.created_at.tzinfo
                else scan.created_at.isoformat() + "Z",
            )
        )

    return DashboardSummary(
        total_scans=len(all_scans),
        high_risk_issues=total_high,
        security_score=security_score,
        security_benchmark=BENCHMARK_SCORE,
        score_label=_score_label(security_score),
        total_scans_change_pct=_change_pct(curr_scans, prev_scans),
        high_risk_change_pct=_change_pct(curr_high, prev_high),
        vulnerabilities_over_time=vulnerabilities_over_time,
        recent_scans=recent_scans,
    )
