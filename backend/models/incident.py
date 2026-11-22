import uuid
import enum
from datetime import datetime
from sqlalchemy import (
    Column,
    String,
    Boolean,
    Integer,
    Float,
    DateTime,
    Text,
    ForeignKey,
    Enum as SAEnum,
)
from sqlalchemy.orm import relationship
from database import Base


class IncidentCategory(str, enum.Enum):
    HARDWARE = "HARDWARE"
    SOFTWARE = "SOFTWARE"
    NETWORK = "NETWORK"
    DATABASE = "DATABASE"
    CLOUD = "CLOUD"
    SECURITY = "SECURITY"
    AUTHENTICATION = "AUTHENTICATION"
    APPLICATION = "APPLICATION"
    STORAGE = "STORAGE"


class IncidentImpact(str, enum.Enum):
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


class IncidentUrgency(str, enum.Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


class IncidentPriority(str, enum.Enum):
    P1 = "P1"
    P2 = "P2"
    P3 = "P3"
    P4 = "P4"


class IncidentStatus(str, enum.Enum):
    NEW = "NEW"
    CLASSIFIED = "CLASSIFIED"
    ASSIGNED = "ASSIGNED"
    ACKNOWLEDGED = "ACKNOWLEDGED"
    IN_PROGRESS = "IN_PROGRESS"
    RESOLVED = "RESOLVED"
    VERIFIED = "VERIFIED"
    CLOSED = "CLOSED"
    CANCELLED = "CANCELLED"


class BusinessCriticality(str, enum.Enum):
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    incident_number = Column(String(20), unique=True, nullable=False, index=True)
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=False)

    category = Column(SAEnum(IncidentCategory), nullable=True)
    impact = Column(SAEnum(IncidentImpact), nullable=False, default=IncidentImpact.MEDIUM)
    urgency = Column(SAEnum(IncidentUrgency), nullable=False, default=IncidentUrgency.MEDIUM)
    priority = Column(SAEnum(IncidentPriority), nullable=True)
    status = Column(SAEnum(IncidentStatus), nullable=False, default=IncidentStatus.NEW)

    reporter_id = Column(String, ForeignKey("users.id"), nullable=False)
    technician_id = Column(String, ForeignKey("users.id"), nullable=True)
    service_id = Column(String, ForeignKey("it_services.id"), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)
    closed_at = Column(DateTime, nullable=True)

    resolution_notes = Column(Text, nullable=True)
    investigation_notes = Column(Text, nullable=True)

    sla_response_deadline = Column(DateTime, nullable=True)
    sla_resolution_deadline = Column(DateTime, nullable=True)
    sla_violated = Column(Boolean, default=False)

    affected_users_count = Column(Integer, default=1)
    business_criticality = Column(
        SAEnum(BusinessCriticality), nullable=False, default=BusinessCriticality.MEDIUM
    )
    priority_score = Column(Float, nullable=True)

    feedback_rating = Column(Integer, nullable=True)
    feedback_comment = Column(Text, nullable=True)

    is_duplicate = Column(Boolean, default=False)
    duplicate_of_id = Column(String, ForeignKey("incidents.id"), nullable=True)

    # Relationships
    reporter = relationship("User", back_populates="reported_incidents", foreign_keys=[reporter_id])
    technician = relationship(
        "User", back_populates="assigned_incidents", foreign_keys=[technician_id]
    )
    service = relationship("ITService", back_populates="incidents")
    audit_logs = relationship("AuditLog", back_populates="incident")
    notifications = relationship("Notification", back_populates="incident")
    duplicate_of = relationship("Incident", remote_side="Incident.id", foreign_keys=[duplicate_of_id])

    def __repr__(self):
        return f"<Incident {self.incident_number} [{self.status}]>"
