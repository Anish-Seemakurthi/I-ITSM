import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, Integer, DateTime, JSON, Enum as SAEnum
from sqlalchemy.orm import relationship
from database import Base
import enum


class UserRole(str, enum.Enum):
    EMPLOYEE = "EMPLOYEE"
    TECHNICIAN = "TECHNICIAN"
    ADMIN = "ADMIN"


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(SAEnum(UserRole), nullable=False, default=UserRole.EMPLOYEE)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Technician-specific fields (single-table inheritance)
    skills = Column(JSON, nullable=True)  # List of skill strings
    availability = Column(Boolean, nullable=True, default=True)
    max_workload = Column(Integer, nullable=True, default=5)
    current_workload = Column(Integer, nullable=True, default=0)

    # Relationships
    reported_incidents = relationship(
        "Incident",
        back_populates="reporter",
        foreign_keys="Incident.reporter_id",
    )
    assigned_incidents = relationship(
        "Incident",
        back_populates="technician",
        foreign_keys="Incident.technician_id",
    )
    audit_logs = relationship("AuditLog", back_populates="user")
    notifications = relationship("Notification", back_populates="user")

    def __repr__(self):
        return f"<User {self.email} ({self.role})>"


class Technician(User):
    """Proxy class for technician-role users — no separate table."""

    __abstract__ = True
