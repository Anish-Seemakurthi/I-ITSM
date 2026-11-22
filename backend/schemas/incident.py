from __future__ import annotations
from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import datetime
from models.incident import (
    IncidentCategory,
    IncidentImpact,
    IncidentUrgency,
    IncidentPriority,
    IncidentStatus,
    BusinessCriticality,
)


class IncidentCreate(BaseModel):
    title: str = Field(..., min_length=5, max_length=500)
    description: str = Field(..., min_length=10)
    impact: IncidentImpact = IncidentImpact.MEDIUM
    urgency: IncidentUrgency = IncidentUrgency.MEDIUM
    affected_users_count: int = Field(default=1, ge=1)
    business_criticality: BusinessCriticality = BusinessCriticality.MEDIUM
    service_id: Optional[str] = None
    category: Optional[IncidentCategory] = None


class IncidentClassify(BaseModel):
    category: IncidentCategory
    investigation_notes: Optional[str] = None


class IncidentAssign(BaseModel):
    technician_id: str
    strategy: Optional[str] = "skill"  # skill | load | round_robin | priority


class IncidentResolve(BaseModel):
    resolution_notes: str = Field(..., min_length=10)


class IncidentFeedback(BaseModel):
    feedback_rating: int = Field(..., ge=1, le=5)
    feedback_comment: Optional[str] = None


class IncidentUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=5, max_length=500)
    description: Optional[str] = None
    impact: Optional[IncidentImpact] = None
    urgency: Optional[IncidentUrgency] = None
    category: Optional[IncidentCategory] = None
    business_criticality: Optional[BusinessCriticality] = None
    affected_users_count: Optional[int] = Field(None, ge=1)
    service_id: Optional[str] = None
    investigation_notes: Optional[str] = None


class IncidentListRead(BaseModel):
    id: str
    incident_number: str
    title: str
    category: Optional[IncidentCategory]
    impact: IncidentImpact
    urgency: IncidentUrgency
    priority: Optional[IncidentPriority]
    status: IncidentStatus
    reporter_id: str
    technician_id: Optional[str]
    service_id: Optional[str]
    created_at: datetime
    updated_at: datetime
    sla_violated: bool
    affected_users_count: int
    business_criticality: BusinessCriticality
    priority_score: Optional[float]
    is_duplicate: bool

    model_config = {"from_attributes": True}


class IncidentRead(BaseModel):
    id: str
    incident_number: str
    title: str
    description: str
    category: Optional[IncidentCategory]
    impact: IncidentImpact
    urgency: IncidentUrgency
    priority: Optional[IncidentPriority]
    status: IncidentStatus
    reporter_id: str
    technician_id: Optional[str]
    service_id: Optional[str]
    created_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime]
    closed_at: Optional[datetime]
    resolution_notes: Optional[str]
    investigation_notes: Optional[str]
    sla_response_deadline: Optional[datetime]
    sla_resolution_deadline: Optional[datetime]
    sla_violated: bool
    affected_users_count: int
    business_criticality: BusinessCriticality
    priority_score: Optional[float]
    feedback_rating: Optional[int]
    feedback_comment: Optional[str]
    is_duplicate: bool
    duplicate_of_id: Optional[str]

    model_config = {"from_attributes": True}
