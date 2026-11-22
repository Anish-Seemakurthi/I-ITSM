"""
Notification Service — Implements Observer Pattern for multi-channel notifications.
"""
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from models.notification import Notification
from patterns.observer import (
    IncidentEventPublisher,
    EmailNotificationObserver,
    SMSNotificationObserver,
    InAppNotificationObserver,
)


class NotificationService:
    def __init__(self, db_session_factory=None):
        self.publisher = IncidentEventPublisher()
        # Register email & SMS observers (simulation loggers)
        self.publisher.subscribe(EmailNotificationObserver())
        self.publisher.subscribe(SMSNotificationObserver())

    def notify_event(
        self,
        db: Session,
        event: str,
        user_id: str,
        message: str,
        incident_id: Optional[str] = None,
        incident_number: Optional[str] = None,
        user_email: Optional[str] = None,
        phone: Optional[str] = None,
    ) -> None:
        """
        Dispatches notification to all observers and persists in-app notification in DB.
        """
        # Store in-app notification in DB
        if user_id:
            in_app_notif = Notification(
                user_id=user_id,
                message=message,
                incident_id=incident_id,
                type=event,
                is_read=False,
            )
            db.add(in_app_notif)
            try:
                db.commit()
            except Exception:
                db.rollback()

        # Trigger external observers (Email & SMS simulation)
        event_data = {
            "user_id": user_id,
            "user_email": user_email or "user@itsm.com",
            "phone": phone or "+1-555-0199",
            "incident_id": incident_id,
            "incident_number": incident_number,
            "message": message,
        }
        self.publisher.notify(event, event_data)

