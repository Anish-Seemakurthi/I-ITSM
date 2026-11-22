from __future__ import annotations
from pydantic import BaseModel, Field
from typing import Optional
from models.incident import IncidentPriority


class SLAPolicyCreate(BaseModel):
    service_id: Optional[str] = None
    priority: IncidentPriority
    response_time_minutes: int = Field(..., ge=1)
    resolution_time_minutes: int = Field(..., ge=1)


class SLAPolicyRead(BaseModel):
    id: str
    service_id: Optional[str]
    priority: IncidentPriority
    response_time_minutes: int
    resolution_time_minutes: int

    model_config = {"from_attributes": True}


class SLAPolicyUpdate(BaseModel):
    response_time_minutes: Optional[int] = Field(None, ge=1)
    resolution_time_minutes: Optional[int] = Field(None, ge=1)
