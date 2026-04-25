"""Pydantic schemas for the dashboard summary endpoint."""

from datetime import datetime
from pydantic import BaseModel


class FindingsBreakdown(BaseModel):
    high: int
    medium: int
    low: int


class RecentScanItem(BaseModel):
    id: str
    name: str
    environment: str
    language: str
    findings: FindingsBreakdown
    scanned_at: str


class VulnOverTimePoint(BaseModel):
    date: str
    high: int
    medium: int
    low: int


class DashboardSummary(BaseModel):
    total_scans: int
    high_risk_issues: int
    security_score: int
    security_benchmark: int
    score_label: str
    total_scans_change_pct: int
    high_risk_change_pct: int
    vulnerabilities_over_time: list[VulnOverTimePoint]
    recent_scans: list[RecentScanItem]
