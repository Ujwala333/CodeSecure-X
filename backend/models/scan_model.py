import hashlib
from datetime import datetime, timezone
from typing import Optional, List
from beanie import Document, Indexed, PydanticObjectId
from pydantic import Field


class Scan(Document):
    """MongoDB document — stores scan metadata + vulnerability results."""

    code_hash: Indexed(str)          # type: ignore[valid-type]
    language: str
    vulnerabilities_json: str = "[]"  # stored as JSON string (matches existing service logic)
    user_id: Optional[PydanticObjectId] = None
    security_health_score: Optional[int] = None
    score_label: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "scans"               # MongoDB collection name

    @staticmethod
    def hash_code(code: str) -> str:
        return hashlib.sha256(code.encode()).hexdigest()
