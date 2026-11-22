"""
SLA Policy & Monitoring Router — Policies, SLA violation tracking, and warning alerts.
"""
from typing import Annotated, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models.user import User, UserRole
from models.sla import SLAPolicy
from models.incident import Incident
from schemas.sla import SLAPolicyCreate, SLAPolicyRead, SLAPolicyUpdate
from schemas.incident import IncidentListRead
from utils.auth import require_role
from services.sla_service import SLAService

router = APIRouter(prefix="/sla", tags=["SLA Policies & Monitoring"])


@router.get("/policies", response_model=List[SLAPolicyRead])
def list_sla_policies(
    db: Session = Depends(get_db),
    current_user: Annotated[User, Depends(require_role(UserRole.ADMIN, UserRole.TECHNICIAN))] = None,
):
    """View SLA configuration policies across priorities and services."""
    return db.query(SLAPolicy).all()


@router.post("/policies", response_model=SLAPolicyRead, status_code=status.HTTP_201_CREATED)
def create_sla_policy(
    data: SLAPolicyCreate,
    current_user: Annotated[User, Depends(require_role(UserRole.ADMIN))],
    db: Session = Depends(get_db),
):
    """Admin configures custom SLA response and resolution targets."""
    policy = SLAPolicy(
        service_id=data.service_id,
        priority=data.priority,
        response_time_minutes=data.response_time_minutes,
        resolution_time_minutes=data.resolution_time_minutes,
    )
    db.add(policy)
    db.commit()
    db.refresh(policy)
    return policy


@router.put("/policies/{policy_id}", response_model=SLAPolicyRead)
def update_sla_policy(
    policy_id: str,
    data: SLAPolicyUpdate,
    current_user: Annotated[User, Depends(require_role(UserRole.ADMIN))],
    db: Session = Depends(get_db),
):
    """Admin updates response or resolution target times."""
    policy = db.query(SLAPolicy).filter(SLAPolicy.id == policy_id).first()
    if not policy:
        raise HTTPException(status_code=404, detail="SLA Policy not found.")

    if data.response_time_minutes is not None:
        policy.response_time_minutes = data.response_time_minutes
    if data.resolution_time_minutes is not None:
        policy.resolution_time_minutes = data.resolution_time_minutes

    db.commit()
    db.refresh(policy)
    return policy


@router.get("/violations", response_model=List[IncidentListRead])
def get_sla_violations(
    db: Session = Depends(get_db),
    current_user: Annotated[User, Depends(require_role(UserRole.ADMIN, UserRole.TECHNICIAN))] = None,
):
    """Retrieve all incidents that have exceeded their SLA resolution deadline."""
    SLAService.check_sla_violations(db)
    violations = db.query(Incident).filter(Incident.sla_violated == True).order_by(Incident.created_at.desc()).all()
    return violations


@router.get("/at_risk", response_model=List[IncidentListRead])
def get_at_risk_incidents(
    db: Session = Depends(get_db),
    current_user: Annotated[User, Depends(require_role(UserRole.ADMIN, UserRole.TECHNICIAN))] = None,
):
    """Retrieve incidents where elapsed time exceeds 80% of allowed SLA time (Early Warning System)."""
    return SLAService.get_at_risk_incidents(db, threshold_percent=0.8)


@router.post("/check")
def trigger_sla_check(
    db: Session = Depends(get_db),
    current_user: Annotated[User, Depends(require_role(UserRole.ADMIN))] = None,
):
    """Forces an immediate sweep of SLA deadlines to mark newly breached incidents."""
    violated = SLAService.check_sla_violations(db)
    return {"message": "SLA scan complete", "new_violations_count": len(violated)}

