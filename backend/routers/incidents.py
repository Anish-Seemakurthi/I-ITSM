"""
Incident Management Router — Full lifecycle, search & filter, state transitions, and AI features.
"""
from datetime import datetime
from typing import Annotated, Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from database import get_db
from models.user import User, UserRole
from models.incident import (
    Incident,
    IncidentStatus,
    IncidentPriority,
    IncidentCategory,
    IncidentImpact,
    IncidentUrgency,
    BusinessCriticality,
)
from schemas.incident import (
    IncidentCreate,
    IncidentRead,
    IncidentListRead,
    IncidentClassify,
    IncidentAssign,
    IncidentResolve,
    IncidentFeedback,
    IncidentUpdate,
)
from schemas.audit import AuditLogRead
from utils.auth import get_current_user, require_role
from patterns.factory import IncidentFactory
from patterns.state import IncidentStateMachine, InvalidStateTransitionError
from services.priority_service import PriorityService
from services.assignment_service import AssignmentService
from services.notification_service import NotificationService
from services.sla_service import SLAService
from services.audit_service import AuditService
from services.intelligent_service import IntelligentService

router = APIRouter(prefix="/incidents", tags=["Incidents"])

priority_service = PriorityService()
assignment_service = AssignmentService()
notification_service = NotificationService()


@router.post("/", response_model=IncidentRead, status_code=status.HTTP_201_CREATED)
def create_incident(
    data: IncidentCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
    """
    Report a new incident. Automatically:
    1. Generates sequential incident number (e.g. INC-0042)
    2. Calculates priority and score using Priority Strategy
    3. Detects potential duplicate incidents
    4. Calculates SLA deadlines based on priority & service
    5. Records initial Audit Log entry
    6. Sends notifications
    """
    count = db.query(Incident).count() + 1

    # Auto-categorize if user didn't select category
    category_val = data.category
    if not category_val:
        suggestion = IntelligentService.auto_categorize(f"{data.title} {data.description}")
        category_val = IncidentCategory(suggestion["suggested_category"])

    # 1. Calculate Priority using Strategy Pattern
    p_result = priority_service.calculate_priority(
        impact=data.impact,
        urgency=data.urgency,
        business_criticality=data.business_criticality,
        affected_users_count=data.affected_users_count,
    )
    priority_enum = IncidentPriority(p_result["priority"])
    priority_score = p_result["priority_score"]

    # 2. Check for duplicate incidents
    duplicates = IntelligentService.detect_duplicates(
        db=db,
        title=data.title,
        description=data.description,
        category=category_val.value if category_val else None,
        service_id=data.service_id,
        threshold=0.40,
    )
    is_duplicate = len(duplicates) > 0
    duplicate_of_id = duplicates[0]["incident_id"] if is_duplicate else None

    # 3. Create incident instance using Factory Pattern
    incident = IncidentFactory.create(
        title=data.title,
        description=data.description,
        reporter_id=current_user.id,
        sequence=count,
        impact=data.impact,
        urgency=data.urgency,
        business_criticality=data.business_criticality,
        affected_users_count=data.affected_users_count,
        service_id=data.service_id,
        category=category_val,
    )
    incident.priority = priority_enum
    incident.priority_score = priority_score
    incident.is_duplicate = is_duplicate
    incident.duplicate_of_id = duplicate_of_id

    # 4. Calculate SLA Deadlines
    resp_dl, res_dl = SLAService.calculate_deadlines(
        db=db,
        priority=priority_enum,
        service_id=data.service_id,
        base_time=datetime.utcnow(),
    )
    incident.sla_response_deadline = resp_dl
    incident.sla_resolution_deadline = res_dl

    db.add(incident)
    db.commit()
    db.refresh(incident)

    # 5. Audit Log
    AuditService.record_action(
        db=db,
        incident_id=incident.id,
        user_id=current_user.id,
        action="INCIDENT_CREATED",
        description=f"Incident {incident.incident_number} created with priority {priority_enum.value} (Score: {priority_score})",
        previous_state=None,
        new_state=IncidentStatus.NEW.value,
    )

    # 6. Notifications
    notification_service.notify_event(
        db=db,
        event="INCIDENT_CREATED",
        user_id=current_user.id,
        incident_id=incident.id,
        incident_number=incident.incident_number,
        user_email=current_user.email,
        message=f"Your incident {incident.incident_number} '{incident.title}' was successfully created with priority {priority_enum.value}.",
    )

    return incident


@router.get("/", response_model=List[IncidentListRead])
def list_incidents(
    db: Session = Depends(get_db),
    current_user: Annotated[User, Depends(get_current_user)] = None,
    status: Optional[str] = Query(None, description="Filter by status"),
    priority: Optional[str] = Query(None, description="Filter by priority (P1, P2, P3, P4)"),
    category: Optional[str] = Query(None, description="Filter by category"),
    service_id: Optional[str] = Query(None, description="Filter by IT Service ID"),
    technician_id: Optional[str] = Query(None, description="Filter by assigned technician"),
    sla_violated: Optional[bool] = Query(None, description="Filter by SLA violation status"),
    search: Optional[str] = Query(None, description="Search in title, description, or incident number"),
    date_from: Optional[datetime] = Query(None, description="Created after"),
    date_to: Optional[datetime] = Query(None, description="Created before"),
    my_only: bool = Query(False, description="Filter to incidents reported by or assigned to me"),
):
    """
    Search and filter incidents across 7+ dimensions:
    Status, Priority, Category, Service, Technician, SLA violation, Date Range, and Keyword Search.
    """
    query = db.query(Incident)

    if current_user and current_user.role == UserRole.EMPLOYEE:
        # Employees normally see their own submitted incidents
        query = query.filter(Incident.reporter_id == current_user.id)
    elif my_only and current_user:
        if current_user.role == UserRole.TECHNICIAN:
            query = query.filter(Incident.technician_id == current_user.id)
        elif current_user.role == UserRole.EMPLOYEE:
            query = query.filter(Incident.reporter_id == current_user.id)

    if status:
        query = query.filter(Incident.status == status)
    if priority:
        query = query.filter(Incident.priority == priority)
    if category:
        query = query.filter(Incident.category == category)
    if service_id:
        query = query.filter(Incident.service_id == service_id)
    if technician_id:
        query = query.filter(Incident.technician_id == technician_id)
    if sla_violated is not None:
        query = query.filter(Incident.sla_violated == sla_violated)
    if date_from:
        query = query.filter(Incident.created_at >= date_from)
    if date_to:
        query = query.filter(Incident.created_at <= date_to)
    if search:
        term = f"%{search}%"
        query = query.filter(
            or_(
                Incident.incident_number.ilike(term),
                Incident.title.ilike(term),
                Incident.description.ilike(term),
            )
        )

    return query.order_by(Incident.created_at.desc()).all()


@router.get("/{incident_id}", response_model=IncidentRead)
def get_incident(
    incident_id: str,
    db: Session = Depends(get_db),
    current_user: Annotated[User, Depends(get_current_user)] = None,
):
    """Fetch full incident details."""
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Incident not found.")
    return incident


@router.put("/{incident_id}/classify", response_model=IncidentRead)
def classify_incident(
    incident_id: str,
    data: IncidentClassify,
    current_user: Annotated[User, Depends(require_role(UserRole.ADMIN, UserRole.TECHNICIAN))],
    db: Session = Depends(get_db),
):
    """Classify incident (NEW -> CLASSIFIED)."""
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found.")

    try:
        IncidentStateMachine.validate_transition(incident.status, IncidentStatus.CLASSIFIED)
    except InvalidStateTransitionError as e:
        raise HTTPException(status_code=400, detail=str(e))

    prev_state = incident.status.value
    incident.status = IncidentStatus.CLASSIFIED
    incident.category = data.category
    if data.investigation_notes:
        incident.investigation_notes = (incident.investigation_notes or "") + f"\n[Classification]: {data.investigation_notes}"

    db.commit()
    db.refresh(incident)

    AuditService.record_action(
        db=db,
        incident_id=incident.id,
        user_id=current_user.id,
        action="INCIDENT_CLASSIFIED",
        description=f"Categorized as {data.category.value}",
        previous_state=prev_state,
        new_state=IncidentStatus.CLASSIFIED.value,
    )
    return incident


@router.put("/{incident_id}/assign", response_model=IncidentRead)
def assign_incident(
    incident_id: str,
    data: IncidentAssign,
    current_user: Annotated[User, Depends(require_role(UserRole.ADMIN))],
    db: Session = Depends(get_db),
):
    """Assign technician to incident using specified or automatic Strategy."""
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found.")

    # Target state: ASSIGNED
    if incident.status == IncidentStatus.NEW:
        incident.status = IncidentStatus.CLASSIFIED

    try:
        IncidentStateMachine.validate_transition(incident.status, IncidentStatus.ASSIGNED)
    except InvalidStateTransitionError as e:
        raise HTTPException(status_code=400, detail=str(e))

    prev_state = incident.status.value

    # If technician_id is "auto", use Strategy Pattern to select
    if data.technician_id == "auto":
        assigned_tech = assignment_service.assign_technician(
            db=db,
            incident=incident,
            strategy_name=data.strategy or "skill",
        )
        if not assigned_tech:
            raise HTTPException(
                status_code=400,
                detail="No available technicians with capacity found for assignment strategy."
            )
    else:
        tech = db.query(User).filter(User.id == data.technician_id, User.role == UserRole.TECHNICIAN).first()
        if not tech:
            raise HTTPException(status_code=404, detail="Technician not found.")
        tech.current_workload = (tech.current_workload or 0) + 1
        incident.technician_id = tech.id
        assigned_tech = tech

    incident.status = IncidentStatus.ASSIGNED
    db.commit()
    db.refresh(incident)

    AuditService.record_action(
        db=db,
        incident_id=incident.id,
        user_id=current_user.id,
        action="TECHNICIAN_ASSIGNED",
        description=f"Assigned to {assigned_tech.name} (strategy: {data.strategy or 'manual'})",
        previous_state=prev_state,
        new_state=IncidentStatus.ASSIGNED.value,
    )

    # Notify technician
    notification_service.notify_event(
        db=db,
        event="INCIDENT_ASSIGNED",
        user_id=assigned_tech.id,
        incident_id=incident.id,
        incident_number=incident.incident_number,
        user_email=assigned_tech.email,
        message=f"You have been assigned to incident {incident.incident_number}: {incident.title}",
    )
    return incident


@router.put("/{incident_id}/acknowledge", response_model=IncidentRead)
def acknowledge_incident(
    incident_id: str,
    current_user: Annotated[User, Depends(require_role(UserRole.TECHNICIAN, UserRole.ADMIN))],
    db: Session = Depends(get_db),
):
    """Technician acknowledges assignment (ASSIGNED -> ACKNOWLEDGED)."""
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found.")

    try:
        IncidentStateMachine.validate_transition(incident.status, IncidentStatus.ACKNOWLEDGED)
    except InvalidStateTransitionError as e:
        raise HTTPException(status_code=400, detail=str(e))

    prev_state = incident.status.value
    incident.status = IncidentStatus.ACKNOWLEDGED
    db.commit()
    db.refresh(incident)

    AuditService.record_action(
        db=db,
        incident_id=incident.id,
        user_id=current_user.id,
        action="INCIDENT_ACKNOWLEDGED",
        description=f"Technician {current_user.name} acknowledged incident.",
        previous_state=prev_state,
        new_state=IncidentStatus.ACKNOWLEDGED.value,
    )
    return incident


@router.put("/{incident_id}/start_investigation", response_model=IncidentRead)
def start_investigation(
    incident_id: str,
    current_user: Annotated[User, Depends(require_role(UserRole.TECHNICIAN, UserRole.ADMIN))],
    db: Session = Depends(get_db),
):
    """Technician begins investigation (ACKNOWLEDGED -> IN_PROGRESS)."""
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found.")

    try:
        IncidentStateMachine.validate_transition(incident.status, IncidentStatus.IN_PROGRESS)
    except InvalidStateTransitionError as e:
        raise HTTPException(status_code=400, detail=str(e))

    prev_state = incident.status.value
    incident.status = IncidentStatus.IN_PROGRESS
    db.commit()
    db.refresh(incident)

    AuditService.record_action(
        db=db,
        incident_id=incident.id,
        user_id=current_user.id,
        action="INVESTIGATION_STARTED",
        description="Investigation officially commenced.",
        previous_state=prev_state,
        new_state=IncidentStatus.IN_PROGRESS.value,
    )
    return incident


@router.put("/{incident_id}/resolve", response_model=IncidentRead)
def resolve_incident(
    incident_id: str,
    data: IncidentResolve,
    current_user: Annotated[User, Depends(require_role(UserRole.TECHNICIAN, UserRole.ADMIN))],
    db: Session = Depends(get_db),
):
    """Technician marks incident resolved (IN_PROGRESS -> RESOLVED). Releases technician workload."""
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found.")

    try:
        IncidentStateMachine.validate_transition(incident.status, IncidentStatus.RESOLVED)
    except InvalidStateTransitionError as e:
        raise HTTPException(status_code=400, detail=str(e))

    prev_state = incident.status.value
    incident.status = IncidentStatus.RESOLVED
    incident.resolution_notes = data.resolution_notes
    incident.resolved_at = datetime.utcnow()

    # Decrement technician workload
    if incident.technician_id:
        assignment_service.release_technician(db, incident.technician_id)

    db.commit()
    db.refresh(incident)

    AuditService.record_action(
        db=db,
        incident_id=incident.id,
        user_id=current_user.id,
        action="INCIDENT_RESOLVED",
        description=f"Resolution provided: {data.resolution_notes[:100]}...",
        previous_state=prev_state,
        new_state=IncidentStatus.RESOLVED.value,
    )

    # Notify reporter
    notification_service.notify_event(
        db=db,
        event="INCIDENT_RESOLVED",
        user_id=incident.reporter_id,
        incident_id=incident.id,
        incident_number=incident.incident_number,
        message=f"Your incident {incident.incident_number} has been resolved: {data.resolution_notes[:120]}",
    )
    return incident


@router.put("/{incident_id}/verify", response_model=IncidentRead)
def verify_incident(
    incident_id: str,
    current_user: Annotated[User, Depends(require_role(UserRole.ADMIN))],
    db: Session = Depends(get_db),
):
    """Admin verifies resolution (RESOLVED -> VERIFIED)."""
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found.")

    try:
        IncidentStateMachine.validate_transition(incident.status, IncidentStatus.VERIFIED)
    except InvalidStateTransitionError as e:
        raise HTTPException(status_code=400, detail=str(e))

    prev_state = incident.status.value
    incident.status = IncidentStatus.VERIFIED
    db.commit()
    db.refresh(incident)

    AuditService.record_action(
        db=db,
        incident_id=incident.id,
        user_id=current_user.id,
        action="INCIDENT_VERIFIED",
        description="Resolution verified by Administrator.",
        previous_state=prev_state,
        new_state=IncidentStatus.VERIFIED.value,
    )
    return incident


@router.put("/{incident_id}/close", response_model=IncidentRead)
def close_incident(
    incident_id: str,
    current_user: Annotated[User, Depends(require_role(UserRole.ADMIN))],
    db: Session = Depends(get_db),
):
    """Admin closes incident (VERIFIED -> CLOSED)."""
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found.")

    try:
        IncidentStateMachine.validate_transition(incident.status, IncidentStatus.CLOSED)
    except InvalidStateTransitionError as e:
        raise HTTPException(status_code=400, detail=str(e))

    prev_state = incident.status.value
    incident.status = IncidentStatus.CLOSED
    incident.closed_at = datetime.utcnow()
    db.commit()
    db.refresh(incident)

    AuditService.record_action(
        db=db,
        incident_id=incident.id,
        user_id=current_user.id,
        action="INCIDENT_CLOSED",
        description="Incident closed permanently.",
        previous_state=prev_state,
        new_state=IncidentStatus.CLOSED.value,
    )
    return incident


@router.put("/{incident_id}/feedback", response_model=IncidentRead)
def provide_feedback(
    incident_id: str,
    data: IncidentFeedback,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
    """Reporter submits post-resolution satisfaction rating (1-5) and comments."""
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found.")
    if incident.reporter_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only the reporter can provide feedback.")

    incident.feedback_rating = data.feedback_rating
    incident.feedback_comment = data.feedback_comment
    db.commit()
    db.refresh(incident)

    AuditService.record_action(
        db=db,
        incident_id=incident.id,
        user_id=current_user.id,
        action="FEEDBACK_PROVIDED",
        description=f"Satisfaction rating: {data.feedback_rating}/5. Comment: {data.feedback_comment or 'N/A'}",
    )
    return incident


@router.get("/{incident_id}/audit", response_model=List[AuditLogRead])
def get_incident_audit_trail(
    incident_id: str,
    db: Session = Depends(get_db),
    current_user: Annotated[User, Depends(get_current_user)] = None,
):
    """Retrieve full immutable audit history for an incident."""
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found.")
    return incident.audit_logs


@router.get("/{incident_id}/similar")
def get_similar_resolutions(
    incident_id: str,
    db: Session = Depends(get_db),
    current_user: Annotated[User, Depends(get_current_user)] = None,
):
    """Intelligent Feature: retrieve suggested resolutions from previous similar incidents."""
    return IntelligentService.get_suggested_resolutions(db=db, incident_id=incident_id)


@router.get("/{incident_id}/recommend_technicians")
def recommend_technicians(
    incident_id: str,
    current_user: Annotated[User, Depends(require_role(UserRole.ADMIN))],
    db: Session = Depends(get_db),
):
    """Intelligent Feature: ranks technicians by skill overlap, workload, and availability."""
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found.")
    return IntelligentService.recommend_technicians(db, incident)


@router.post("/suggest_category")
def suggest_category(
    payload: dict,
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Intelligent Feature: Auto-categorize based on title and description."""
    text = f"{payload.get('title', '')} {payload.get('description', '')}"
    return IntelligentService.auto_categorize(text)


@router.post("/check_duplicate")
def check_duplicate(
    payload: dict,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
    """Intelligent Feature: Check if an incident is a potential duplicate before submitting."""
    return IntelligentService.detect_duplicates(
        db=db,
        title=payload.get("title", ""),
        description=payload.get("description", ""),
        category=payload.get("category"),
        service_id=payload.get("service_id"),
    )
