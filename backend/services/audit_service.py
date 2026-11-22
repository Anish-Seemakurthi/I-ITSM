"""
Audit Trail Service — Records all lifecycle events and state transitions.
"""
from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session
from models.audit import AuditLog


class AuditService:
    @staticmethod
    def record_action(
        db: Session,
        incident_id: str,
        user_id: str,
        action: str,
        description: str,
        previous_state: Optional[str] = None,
        new_state: Optional[str] = None,
    ) -> AuditLog:
        log_entry = AuditLog(
            incident_id=incident_id,
            user_id=user_id,
            action=action,
            previous_state=str(previous_state) if previous_state else None,
            new_state=str(new_state) if new_state else None,
            description=description,
            timestamp=datetime.utcnow(),
        )
        db.add(log_entry)
        db.commit()
        db.refresh(log_entry)
        return log_entry

