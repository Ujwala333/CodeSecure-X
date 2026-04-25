from datetime import datetime, timezone
from typing import Literal
from beanie import Document, PydanticObjectId
from pydantic import Field

class AdminLog(Document):
    admin_id: PydanticObjectId
    action: Literal["suspend_user", "unsuspend_user"]
    target_user_id: PydanticObjectId
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "admin_logs"
