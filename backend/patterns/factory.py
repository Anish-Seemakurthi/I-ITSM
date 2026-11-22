"""
Factory Pattern — UserFactory and IncidentFactory.
"""
from __future__ import annotations
from typing import Optional
from models.user import User, UserRole
from models.incident import Incident, IncidentImpact, IncidentUrgency, BusinessCriticality, IncidentStatus
from utils.auth import hash_password
import uuid


class UserFactory:
    """Factory for creating User instances by role."""

    @staticmethod
    def create_employee(name: str, email: str, password: str) -> User:
        return User(
            id=str(uuid.uuid4()),
            name=name,
            email=email,
            password_hash=hash_password(password),
            role=UserRole.EMPLOYEE,
            is_active=True,
        )

    @staticmethod
    def create_technician(
        name: str,
        email: str,
        password: str,
        skills: Optional[list] = None,
        max_workload: int = 5,
    ) -> User:
        return User(
            id=str(uuid.uuid4()),
            name=name,
            email=email,
            password_hash=hash_password(password),
            role=UserRole.TECHNICIAN,
            is_active=True,
            skills=skills or [],
            availability=True,
            max_workload=max_workload,
            current_workload=0,
        )

    @staticmethod
    def create_admin(name: str, email: str, password: str) -> User:
        return User(
            id=str(uuid.uuid4()),
            name=name,
            email=email,
            password_hash=hash_password(password),
            role=UserRole.ADMIN,
            is_active=True,
        )

    @classmethod
    def create(cls, role: UserRole, **kwargs) -> User:
        if role == UserRole.EMPLOYEE:
            return cls.create_employee(**kwargs)
        elif role == UserRole.TECHNICIAN:
            return cls.create_technician(**kwargs)
        elif role == UserRole.ADMIN:
            return cls.create_admin(**kwargs)
        raise ValueError(f"Unknown role: {role}")


class IncidentFactory:
    """Factory for creating Incident instances with proper defaults."""

    @staticmethod
    def _generate_incident_number(sequence: int) -> str:
        return f"INC-{sequence:04d}"

    @staticmethod
    def create(
        title: str,
        description: str,
        reporter_id: str,
        sequence: int,
        impact: str = IncidentImpact.MEDIUM,
        urgency: str = IncidentUrgency.MEDIUM,
        business_criticality: str = BusinessCriticality.MEDIUM,
        affected_users_count: int = 1,
        service_id: Optional[str] = None,
        category: Optional[str] = None,
    ) -> Incident:
        return Incident(
            id=str(uuid.uuid4()),
            incident_number=IncidentFactory._generate_incident_number(sequence),
            title=title,
            description=description,
            reporter_id=reporter_id,
            impact=impact,
            urgency=urgency,
            business_criticality=business_criticality,
            affected_users_count=affected_users_count,
            service_id=service_id,
            category=category,
            status=IncidentStatus.NEW,
            is_duplicate=False,
            sla_violated=False,
        )
