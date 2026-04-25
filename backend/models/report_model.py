from typing import Optional
from datetime import datetime, timezone
from beanie import Document, PydanticObjectId
from pydantic import Field


class Report(Document):
    """MongoDB document — each record links a generated PDF to a scan."""

    scan_id: PydanticObjectId       # references Scan._id
    pdf_filename: str
    user_id: Optional[PydanticObjectId] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "reports"            # MongoDB collection name
