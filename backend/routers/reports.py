"""
Reports & Analytics Router — Operational intelligence, workload metrics, and SLA compliance statistics.
"""
from datetime import datetime, timedelta
from typing import Annotated, Dict, Any, List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models.user import User, UserRole
from models.incident import Incident, IncidentStatus, IncidentPriority, IncidentCategory
from models.service import ITService
from utils.auth import require_role

router = APIRouter(prefix="/reports", tags=["Reports & Analytics"])


@router.get("/overview")
def get_overview_report(
    db: Session = Depends(get_db),
    current_user: Annotated[User, Depends(require_role(UserRole.ADMIN, UserRole.TECHNICIAN))] = None,
):
    """
    KPI metrics: Total, Open, Critical, Resolved, and SLA Violations.
    """
    total = db.query(Incident).count()
    open_count = db.query(Incident).filter(
        Incident.status.in_([
            IncidentStatus.NEW,
            IncidentStatus.CLASSIFIED,
            IncidentStatus.ASSIGNED,
            IncidentStatus.ACKNOWLEDGED,
            IncidentStatus.IN_PROGRESS,
        ])
    ).count()

    critical_count = db.query(Incident).filter(
        Incident.priority == IncidentPriority.P1,
        Incident.status != IncidentStatus.CLOSED,
    ).count()

    resolved_count = db.query(Incident).filter(
        Incident.status.in_([IncidentStatus.RESOLVED, IncidentStatus.VERIFIED, IncidentStatus.CLOSED])
    ).count()

    sla_violations = db.query(Incident).filter(Incident.sla_violated == True).count()

    return {
        "total_incidents": total,
        "open_incidents": open_count,
        "critical_incidents": critical_count,
        "resolved_incidents": resolved_count,
        "sla_violations": sla_violations,
    }


@router.get("/technician_workload")
def get_technician_workload_report(
    db: Session = Depends(get_db),
    current_user: Annotated[User, Depends(require_role(UserRole.ADMIN, UserRole.TECHNICIAN))] = None,
):
    """Active incidents per technician."""
    active_statuses = [
        IncidentStatus.ASSIGNED,
        IncidentStatus.ACKNOWLEDGED,
        IncidentStatus.IN_PROGRESS,
    ]
    techs = db.query(User).filter(User.role == UserRole.TECHNICIAN).all()
    results = []
    for t in techs:
        active_count = db.query(Incident).filter(
            Incident.technician_id == t.id,
            Incident.status.in_(active_statuses),
        ).count()
        results.append({
            "technician_id": t.id,
            "technician_name": t.name,
            "email": t.email,
            "active_incidents": active_count,
            "max_workload": t.max_workload or 5,
            "utilization_percent": round((active_count / (t.max_workload or 5)) * 100, 1),
        })
    results.sort(key=lambda x: x["active_incidents"], reverse=True)
    return results


@router.get("/service_analysis")
def get_service_analysis_report(
    db: Session = Depends(get_db),
    current_user: Annotated[User, Depends(require_role(UserRole.ADMIN, UserRole.TECHNICIAN))] = None,
):
    """Incident distribution by IT service."""
    services = db.query(ITService).all()
    results = []
    for s in services:
        inc_count = db.query(Incident).filter(Incident.service_id == s.id).count()
        results.append({
            "service_id": s.id,
            "service_name": s.name,
            "is_critical": s.is_critical,
            "incident_count": inc_count,
        })
    results.sort(key=lambda x: x["incident_count"], reverse=True)
    return results


@router.get("/priority_distribution")
def get_priority_distribution(
    db: Session = Depends(get_db),
    current_user: Annotated[User, Depends(require_role(UserRole.ADMIN, UserRole.TECHNICIAN))] = None,
):
    """Counts grouped by priority tier (P1, P2, P3, P4)."""
    counts = {}
    for p in IncidentPriority:
        c = db.query(Incident).filter(Incident.priority == p).count()
        counts[p.value] = c
    return counts


@router.get("/category_distribution")
def get_category_distribution(
    db: Session = Depends(get_db),
    current_user: Annotated[User, Depends(require_role(UserRole.ADMIN, UserRole.TECHNICIAN))] = None,
):
    """Counts grouped by classification category."""
    counts = {}
    for cat in IncidentCategory:
        c = db.query(Incident).filter(Incident.category == cat).count()
        counts[cat.value] = c
    return counts


@router.get("/sla_compliance")
def get_sla_compliance(
    db: Session = Depends(get_db),
    current_user: Annotated[User, Depends(require_role(UserRole.ADMIN, UserRole.TECHNICIAN))] = None,
):
    """Calculates organizational SLA compliance percentage."""
    resolved_total = db.query(Incident).filter(
        Incident.status.in_([IncidentStatus.RESOLVED, IncidentStatus.VERIFIED, IncidentStatus.CLOSED])
    ).count()

    resolved_violated = db.query(Incident).filter(
        Incident.status.in_([IncidentStatus.RESOLVED, IncidentStatus.VERIFIED, IncidentStatus.CLOSED]),
        Incident.sla_violated == True,
    ).count()

    compliant = resolved_total - resolved_violated
    compliance_rate = round((compliant / resolved_total) * 100, 2) if resolved_total > 0 else 100.0

    return {
        "resolved_total": resolved_total,
        "resolved_compliant": compliant,
        "resolved_breached": resolved_violated,
        "compliance_rate_percent": compliance_rate,
    }


@router.get("/trends")
def get_incident_trends(
    days: int = Query(7, ge=1, le=90),
    db: Session = Depends(get_db),
    current_user: Annotated[User, Depends(require_role(UserRole.ADMIN, UserRole.TECHNICIAN))] = None,
):
    """Daily incident volume trend over past N days."""
    now = datetime.utcnow()
    trends = []
    for i in range(days - 1, -1, -1):
        day_start = (now - timedelta(days=i)).replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)
        cnt = db.query(Incident).filter(
            Incident.created_at >= day_start,
            Incident.created_at < day_end,
        ).count()
        trends.append({
            "date": day_start.strftime("%Y-%m-%d"),
            "count": cnt,
        })
    return trends

