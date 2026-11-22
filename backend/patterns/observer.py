"""
Observer Pattern — Event publisher and notification observers.
"""
from __future__ import annotations
from abc import ABC, abstractmethod
from typing import List, Callable, Dict, Any
import logging

logger = logging.getLogger(__name__)


class NotificationObserver(ABC):
    """Abstract observer base."""

    @abstractmethod
    def update(self, event: str, data: Dict[str, Any]) -> None:
        raise NotImplementedError


class IncidentEventPublisher:
    """Publisher that notifies registered observers on incident events."""

    def __init__(self):
        self._observers: List[NotificationObserver] = []

    def subscribe(self, observer: NotificationObserver) -> None:
        if observer not in self._observers:
            self._observers.append(observer)

    def unsubscribe(self, observer: NotificationObserver) -> None:
        self._observers.remove(observer)

    def notify(self, event: str, data: Dict[str, Any]) -> None:
        for observer in self._observers:
            try:
                observer.update(event, data)
            except Exception as exc:
                logger.error("Observer %s failed on event %s: %s", observer, event, exc)


class EmailNotificationObserver(NotificationObserver):
    """Simulates email notifications by logging."""

    def update(self, event: str, data: Dict[str, Any]) -> None:
        recipient = data.get("user_email", "unknown")
        incident = data.get("incident_number", "N/A")
        message = data.get("message", "")
        logger.info("[EMAIL] To: %s | Event: %s | Incident: %s | %s", recipient, event, incident, message)


class InAppNotificationObserver(NotificationObserver):
    """Stores notifications in the database via a callback."""

    def __init__(self, store_callback: Callable[[Dict[str, Any]], None]):
        self._store = store_callback

    def update(self, event: str, data: Dict[str, Any]) -> None:
        self._store(
            {
                "user_id": data.get("user_id"),
                "message": data.get("message", f"Event: {event}"),
                "incident_id": data.get("incident_id"),
                "type": event,
            }
        )


class SMSNotificationObserver(NotificationObserver):
    """Simulates SMS notifications by logging."""

    def update(self, event: str, data: Dict[str, Any]) -> None:
        phone = data.get("phone", "N/A")
        incident = data.get("incident_number", "N/A")
        message = data.get("message", "")
        logger.info("[SMS] To: %s | Event: %s | Incident: %s | %s", phone, event, incident, message)
