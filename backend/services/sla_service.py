"""
SLA Management Service — SLA calculations, deadline tracking, violation detection, and warning alerts.
"""
from datetime import datetime, timedelta
from typing import Optional, Tuple, List
from sqlalchemy.orm import Session
from models.incident import Incident, IncidentStatus, IncidentPriority
from models.sla import SLAPolicy

# Default SLA targets in minutes (from problem statement):
# P1: 5m response, 30m resolution
# P2: 15m response, 2 hours (120m) resolution
# P3: 1 hour (60m) response, 8 hours (480m) resolution
# P4: 4 hours (240m) response, 24 hours (1440m) resolution
DEFAULT_SLA_TARGETS = {
    IncidentPriority.P1: (5, 30),
    IncidentPriority.P2: (15, 120),
    IncidentPriority.P3: (60, 480),
    IncidentPriority.P4: (240, 1440),
}


class SLAService:
    @staticmethod
    def calculate_deadlines(
        db: Session,
        priority: IncidentPriority,
        service_id: Optional[str] = None,
        base_time: Optional[datetime] = None,
    ) -> Tuple[datetime, datetime]:
        base_time = base_time or datetime.utcnow()
        response_mins, resolution_mins = DEFAULT_SLA_TARGETS.get(priority, (60, 480))

        if service_id:
            custom_policy = db.query(SLAPolicy).filter(
                SLAPolicy.service_id == service_id,
                SLAPolicy.priority == priority,
            ).first()
            if custom_policy:
                response_mins = custom_policy.response_time_minutes
                resolution_mins = custom_policy.resolution_time_minutes

        response_deadline = base_time + timedelta(minutes=response_mins)
        resolution_deadline = base_time + timedelta(minutes=resolution_mins)
        return response_deadline, resolution_deadline

    @staticmethod
    def check_sla_violations(db: Session) -> List[Incident]:
        """
        Scans all unresolved incidents and detects SLA violations.
        """
        now = datetime.utcnow()
        open_statuses = [
            IncidentStatus.NEW,
            IncidentStatus.CLASSIFIED,
            IncidentStatus.ASSIGNED,
            IncidentStatus.ACKNOWLEDGED,
            IncidentStatus.IN_PROGRESS,
        ]

        query = db.query(Incident).filter(
            Incident.status.in_(open_statuses),
            Incident.sla_resolution_deadline < now,
            Incident.sla_violated == False,
        )
        violated_incidents = query.all()
        for inc in violated_incidents:
            inc.sla_violated = True
        if violated_incidents:
            db.commit()
        return violated_incidents

    @staticmethod
    def get_at_risk_incidents(db: Session, threshold_percent: float = 0.8) -> List[Incident]:
        """
        Finds open incidents where elapsed time exceeds threshold (default 80%) of allowed SLA time.
        """
        now = datetime.utcnow()
        open_statuses = [
            IncidentStatus.NEW,
            IncidentStatus.CLASSIFIED,
            IncidentStatus.ASSIGNED,
            IncidentStatus.ACKNOWLEDGED,
            IncidentStatus.IN_PROGRESS,
        ]

        candidates = db.query(Incident).filter(
            Incident.status.in_(open_statuses),
            Incident.sla_violated == False,
            Incident.sla_resolution_deadline.isnot(None),
        ).all()

        at_risk = []
        for inc in candidates:
            total_duration = (inc.sla_resolution_deadline - inc.created_at).total_seconds()
            if total_duration <= 0:
                continue
            elapsed = (now - inc.created_at).total_seconds()
            ratio = elapsed / total_duration
            if ratio >= threshold_percent and ratio < 1.0:
                at_risk.append(inc)
        return at_risk

