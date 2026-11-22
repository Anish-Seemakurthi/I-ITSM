"""
Admin Operations Router — User management, system audit log viewing, and notification center.
"""
from typing import Annotated, List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from database import get_db
from models.user import User, UserRole
from models.audit import AuditLog
from models.notification import Notification
from schemas.user import UserRead, UserAdminUpdate
from schemas.audit import AuditLogRead
from schemas.notification import NotificationRead
from utils.auth import get_current_user, require_role

router = APIRouter(prefix="/admin", tags=["Admin Operations"])


@router.get("/users", response_model=List[UserRead])
def list_users(
    role: Optional[str] = Query(None, description="Filter by UserRole"),
    db: Session = Depends(get_db),
    current_user: Annotated[User, Depends(require_role(UserRole.ADMIN))] = None,
):
    """Admin retrieves all organizational users."""
    query = db.query(User)
    if role:
        query = query.filter(User.role == role)
    return query.order_by(User.name.asc()).all()


@router.put("/users/{user_id}/status", response_model=UserRead)
def update_user_status(
    user_id: str,
    data: UserAdminUpdate,
    current_user: Annotated[User, Depends(require_role(UserRole.ADMIN))],
    db: Session = Depends(get_db),
):
    """Admin activates/deactivates user accounts or modifies roles."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    if user.id == current_user.id and data.is_active is False:
        raise HTTPException(status_code=400, detail="Administrators cannot deactivate their own account.")

    if data.is_active is not None:
        user.is_active = data.is_active
    if data.role is not None:
        user.role = data.role

    db.commit()
    db.refresh(user)
    return user


@router.get("/audit_logs", response_model=List[AuditLogRead])
def get_all_audit_logs(
    incident_id: Optional[str] = Query(None),
    user_id: Optional[str] = Query(None),
    action: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: Annotated[User, Depends(require_role(UserRole.ADMIN))] = None,
):
    """Comprehensive system-wide audit trail for compliance and forensic inspection."""
    query = db.query(AuditLog)
    if incident_id:
        query = query.filter(AuditLog.incident_id == incident_id)
    if user_id:
        query = query.filter(AuditLog.user_id == user_id)
    if action:
        query = query.filter(AuditLog.action == action)
    return query.order_by(AuditLog.timestamp.desc()).limit(limit).all()


@router.get("/notifications", response_model=List[NotificationRead])
def get_user_notifications(
    db: Session = Depends(get_db),
    current_user: Annotated[User, Depends(get_current_user)] = None,
):
    """Retrieve notifications for the current authenticated user."""
    return db.query(Notification).filter(
        Notification.user_id == current_user.id
    ).order_by(Notification.created_at.desc()).limit(30).all()


@router.put("/notifications/{notification_id}/read")
def mark_notification_read(
    notification_id: str,
    db: Session = Depends(get_db),
    current_user: Annotated[User, Depends(get_current_user)] = None,
):
    """Mark a notification as read."""
    notif = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id,
    ).first()
    if notif:
        notif.is_read = True
        db.commit()
    return {"status": "ok"}

