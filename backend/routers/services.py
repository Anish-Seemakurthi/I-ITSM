"""
IT Services Router — Management of organizational IT services & assets.
"""
from typing import Annotated, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models.user import User, UserRole
from models.service import ITService
from schemas.service import ITServiceCreate, ITServiceRead, ITServiceUpdate
from utils.auth import get_current_user, require_role

router = APIRouter(prefix="/services", tags=["IT Services"])


@router.get("/", response_model=List[ITServiceRead])
def list_services(
    db: Session = Depends(get_db),
    current_user: Annotated[User, Depends(get_current_user)] = None,
):
    """Retrieve catalog of organizational IT services."""
    return db.query(ITService).order_by(ITService.name.asc()).all()


@router.post("/", response_model=ITServiceRead, status_code=status.HTTP_201_CREATED)
def create_service(
    data: ITServiceCreate,
    current_user: Annotated[User, Depends(require_role(UserRole.ADMIN))],
    db: Session = Depends(get_db),
):
    """Admin registers a new IT service in the enterprise catalog."""
    existing = db.query(ITService).filter(ITService.name == data.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Service with this name already exists.")

    service = ITService(
        name=data.name,
        description=data.description,
        category=data.category,
        is_critical=data.is_critical,
        owner=data.owner,
    )
    db.add(service)
    db.commit()
    db.refresh(service)
    return service


@router.put("/{service_id}", response_model=ITServiceRead)
def update_service(
    service_id: str,
    data: ITServiceUpdate,
    current_user: Annotated[User, Depends(require_role(UserRole.ADMIN))],
    db: Session = Depends(get_db),
):
    """Admin updates an IT service."""
    service = db.query(ITService).filter(ITService.id == service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found.")

    if data.name is not None:
        service.name = data.name
    if data.description is not None:
        service.description = data.description
    if data.category is not None:
        service.category = data.category
    if data.is_critical is not None:
        service.is_critical = data.is_critical
    if data.owner is not None:
        service.owner = data.owner

    db.commit()
    db.refresh(service)
    return service


@router.delete("/{service_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_service(
    service_id: str,
    current_user: Annotated[User, Depends(require_role(UserRole.ADMIN))],
    db: Session = Depends(get_db),
):
    """Admin removes an IT service from the catalog."""
    service = db.query(ITService).filter(ITService.id == service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found.")

    db.delete(service)
    db.commit()
    return None

