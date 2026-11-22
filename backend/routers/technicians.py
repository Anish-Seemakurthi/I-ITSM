"""
Technician Management Router — Technician profiles, skills, availability, and workload monitoring.
"""
from typing import Annotated, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from database import get_db
from models.user import User, UserRole
from models.incident import Incident, IncidentStatus
from schemas.user import TechnicianCreate, TechnicianRead, TechnicianUpdate
from schemas.incident import IncidentListRead
from utils.auth import require_role
from patterns.factory import UserFactory

router = APIRouter(prefix="/technicians", tags=["Technicians"])


@router.get("/", response_model=List[TechnicianRead])
def list_technicians(
    db: Session = Depends(get_db),
    current_user: Annotated[User, Depends(require_role(UserRole.ADMIN, UserRole.TECHNICIAN))] = None,
):
    """List all registered technicians with their workload and skill specializations."""
    return db.query(User).filter(User.role == UserRole.TECHNICIAN).all()


@router.post("/", response_model=TechnicianRead, status_code=status.HTTP_201_CREATED)
def create_technician(
    data: TechnicianCreate,
    current_user: Annotated[User, Depends(require_role(UserRole.ADMIN))],
    db: Session = Depends(get_db),
):
    """Admin creates a new technician profile."""
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="A user with this email already exists.")

    new_tech = UserFactory.create_technician(
        name=data.name,
        email=data.email,
        password=data.password,
        skills=data.skills,
        max_workload=data.max_workload,
    )
    db.add(new_tech)
    db.commit()
    db.refresh(new_tech)
    return new_tech


@router.put("/{technician_id}", response_model=TechnicianRead)
def update_technician(
    technician_id: str,
    data: TechnicianUpdate,
    current_user: Annotated[User, Depends(require_role(UserRole.ADMIN))],
    db: Session = Depends(get_db),
):
    """Admin updates technician skills, availability, or capacity."""
    tech = db.query(User).filter(User.id == technician_id, User.role == UserRole.TECHNICIAN).first()
    if not tech:
        raise HTTPException(status_code=404, detail="Technician not found.")

    if data.name is not None:
        tech.name = data.name
    if data.skills is not None:
        tech.skills = data.skills
    if data.availability is not None:
        tech.availability = data.availability
    if data.max_workload is not None:
        tech.max_workload = data.max_workload
    if data.is_active is not None:
        tech.is_active = data.is_active

    db.commit()
    db.refresh(tech)
    return tech


@router.get("/{technician_id}/workload", response_model=List[IncidentListRead])
def get_technician_workload(
    technician_id: str,
    db: Session = Depends(get_db),
    current_user: Annotated[User, Depends(require_role(UserRole.ADMIN, UserRole.TECHNICIAN))] = None,
):
    """List active incidents assigned to a technician."""
    active_statuses = [
        IncidentStatus.ASSIGNED,
        IncidentStatus.ACKNOWLEDGED,
        IncidentStatus.IN_PROGRESS,
    ]
    incidents = db.query(Incident).filter(
        Incident.technician_id == technician_id,
        Incident.status.in_(active_statuses),
    ).all()
    return incidents


@router.get("/available/filter", response_model=List[TechnicianRead])
def get_available_technicians(
    category: Optional[str] = Query(None, description="Incident category to match skills against"),
    db: Session = Depends(get_db),
    current_user: Annotated[User, Depends(require_role(UserRole.ADMIN))] = None,
):
    """Find available technicians with capacity < max_workload."""
    query = db.query(User).filter(
        User.role == UserRole.TECHNICIAN,
        User.is_active == True,
        User.availability == True,
        User.current_workload < User.max_workload,
    )
    techs = query.all()
    if category:
        cat_lower = category.lower()
        techs = [
            t for t in techs
            if any(cat_lower in s.lower() or s.lower() in cat_lower for s in (t.skills or []))
        ]
    return techs

