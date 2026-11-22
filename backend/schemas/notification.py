from __future__ import annotations
from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class NotificationRead(BaseModel):
    id: str
    user_id: str
    message: str
    incident_id: Optional[str]
    type: str
    is_read: bool
    created_at: datetime

    model_config = {"from_attributes": True}
