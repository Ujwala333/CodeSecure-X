from typing import Literal
from pydantic import BaseModel, field_validator

Language = Literal["python", "javascript", "java", "php"]
SeverityLevel = Literal["Low", "Medium", "High", "Critical"]


class ScanRequest(BaseModel):
    code: str
    language: Language

    @field_validator("code")
    @classmethod
    def code_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("code must not be empty")
        if len(v) > 50_000:
            raise ValueError("code exceeds 50,000 character limit")
        return v


class VulnerabilityItem(BaseModel):
    type: str
    severity: SeverityLevel
    explanation: str
    fix: str
    fixed_code: str | None = None   # Complete, copy-pasteable corrected code snippet


class SeverityCounts(BaseModel):
    high: int
    medium: int
    low: int


class ScanResponse(BaseModel):
    scan_id: str          # MongoDB ObjectId as string
    vulnerabilities: list[VulnerabilityItem]
    security_health_score: int | None = None
    score_label: str | None = None
    severity_counts: SeverityCounts | None = None
    critical_paths: int | None = None


class ScanHistoryItem(BaseModel):
    scan_id: str          # MongoDB ObjectId as string
    language: str
    vulnerability_count: int
    created_at: str
