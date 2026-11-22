from __future__ import annotations
from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class AuditLogRead(BaseModel):
    id: str
    incident_id: Optional[str]
    user_id: Optional[str]
    action: str
    previous_state: Optional[str]
    new_state: Optional[str]
    description: Optional[str]
    timestamp: datetime

    model_config = {"from_attributes": True}
