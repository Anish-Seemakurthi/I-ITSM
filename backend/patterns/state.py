"""
State Pattern — IncidentStateMachine with valid lifecycle transitions.
"""
from __future__ import annotations
from typing import Dict, Set
from models.incident import IncidentStatus


class InvalidStateTransitionError(Exception):
    """Raised when an invalid state transition is attempted."""

    def __init__(self, current: str, target: str):
        self.current = current
        self.target = target
        super().__init__(
            f"Invalid transition: cannot move incident from '{current}' to '{target}'"
        )


# Valid forward transitions
VALID_TRANSITIONS: Dict[str, Set[str]] = {
    IncidentStatus.NEW: {IncidentStatus.CLASSIFIED, IncidentStatus.CANCELLED},
    IncidentStatus.CLASSIFIED: {IncidentStatus.ASSIGNED, IncidentStatus.CANCELLED},
    IncidentStatus.ASSIGNED: {IncidentStatus.ACKNOWLEDGED, IncidentStatus.CANCELLED},
    IncidentStatus.ACKNOWLEDGED: {IncidentStatus.IN_PROGRESS, IncidentStatus.CANCELLED},
    IncidentStatus.IN_PROGRESS: {IncidentStatus.RESOLVED, IncidentStatus.CANCELLED},
    IncidentStatus.RESOLVED: {IncidentStatus.VERIFIED, IncidentStatus.CANCELLED, IncidentStatus.IN_PROGRESS},
    IncidentStatus.VERIFIED: {IncidentStatus.CLOSED, IncidentStatus.CANCELLED},
    IncidentStatus.CLOSED: set(),
    IncidentStatus.CANCELLED: set(),
}


class IncidentStateMachine:
    """Manages incident lifecycle state transitions."""

    def __init__(self, current_status: str):
        self.current_status = current_status

    def can_transition_to(self, target_status: str) -> bool:
        return target_status in VALID_TRANSITIONS.get(self.current_status, set())

    def transition(self, target_status: str) -> str:
        """Perform the transition and return the new status."""
        if not self.can_transition_to(target_status):
            raise InvalidStateTransitionError(self.current_status, target_status)
        self.current_status = target_status
        return self.current_status

    def get_allowed_transitions(self) -> Set[str]:
        return VALID_TRANSITIONS.get(self.current_status, set())

    @classmethod
    def validate_transition(cls, current: str, target: str) -> None:
        """Validate transition without changing state; raises if invalid."""
        machine = cls(current)
        if not machine.can_transition_to(target):
            raise InvalidStateTransitionError(current, target)
