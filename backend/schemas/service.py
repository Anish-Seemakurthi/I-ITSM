from __future__ import annotations
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class ITServiceCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    description: Optional[str] = None
    category: Optional[str] = None
    is_critical: bool = False
    owner: Optional[str] = None


class ITServiceRead(BaseModel):
    id: str
    name: str
    description: Optional[str]
    category: Optional[str]
    is_critical: bool
    owner: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class ITServiceUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    description: Optional[str] = None
    category: Optional[str] = None
    is_critical: Optional[bool] = None
    owner: Optional[str] = None
