"""
Strategy Pattern — Assignment & Priority Calculation Strategies.
"""
from __future__ import annotations
from abc import ABC, abstractmethod
from typing import List, Optional
import random


# ---------------------------------------------------------------------------
# Assignment Strategies
# ---------------------------------------------------------------------------

class AssignmentStrategy(ABC):
    """Abstract base strategy for technician assignment."""

    @abstractmethod
    def assign(self, technicians: List[dict], incident: dict) -> Optional[dict]:
        """Return the best technician dict or None."""
        raise NotImplementedError


class SkillBasedAssignment(AssignmentStrategy):
    """Match technician skills to the incident category."""

    def assign(self, technicians: List[dict], incident: dict) -> Optional[dict]:
        category = (incident.get("category") or "").lower()
        scored = []
        for tech in technicians:
            skills = [s.lower() for s in (tech.get("skills") or [])]
            score = sum(1 for s in skills if s in category or category in s)
            scored.append((score, tech))
        scored.sort(key=lambda x: (-x[0], x[1].get("current_workload", 0)))
        return scored[0][1] if scored else None


class LoadBasedAssignment(AssignmentStrategy):
    """Assign to the technician with the least current workload."""

    def assign(self, technicians: List[dict], incident: dict) -> Optional[dict]:
        if not technicians:
            return None
        return min(technicians, key=lambda t: t.get("current_workload", 0))


class RoundRobinAssignment(AssignmentStrategy):
    """Rotate through available technicians using a simple counter."""

    _counter: int = 0

    def assign(self, technicians: List[dict], incident: dict) -> Optional[dict]:
        if not technicians:
            return None
        tech = technicians[RoundRobinAssignment._counter % len(technicians)]
        RoundRobinAssignment._counter += 1
        return tech


class PriorityBasedAssignment(AssignmentStrategy):
    """For P1 incidents, assign the most experienced (lowest workload + most skills) technician."""

    def assign(self, technicians: List[dict], incident: dict) -> Optional[dict]:
        if not technicians:
            return None
        # Most skilled + least loaded
        return max(
            technicians,
            key=lambda t: (len(t.get("skills") or []), -(t.get("current_workload") or 0)),
        )


# ---------------------------------------------------------------------------
# Priority Calculation Strategies
# ---------------------------------------------------------------------------

class PriorityStrategy(ABC):
    """Abstract base for priority calculation."""

    IMPACT_WEIGHTS = {"HIGH": 3, "MEDIUM": 2, "LOW": 1}
    URGENCY_WEIGHTS = {"CRITICAL": 4, "HIGH": 3, "MEDIUM": 2, "LOW": 1}
    CRITICALITY_WEIGHTS = {"HIGH": 3, "MEDIUM": 2, "LOW": 1}

    @abstractmethod
    def calculate(self, impact: str, urgency: str, business_criticality: str, **kwargs) -> dict:
        """Return dict with priority (P1-P4) and priority_score."""
        raise NotImplementedError

    @staticmethod
    def score_to_priority(score: float) -> str:
        if score >= 24:
            return "P1"
        elif score >= 12:
            return "P2"
        elif score >= 6:
            return "P3"
        return "P4"


class BasicPriorityStrategy(PriorityStrategy):
    """Priority Score = Impact × Urgency × Business Criticality."""

    def calculate(self, impact: str, urgency: str, business_criticality: str, **kwargs) -> dict:
        score = (
            self.IMPACT_WEIGHTS.get(impact, 2)
            * self.URGENCY_WEIGHTS.get(urgency, 2)
            * self.CRITICALITY_WEIGHTS.get(business_criticality, 2)
        )
        return {"priority": self.score_to_priority(score), "priority_score": float(score)}


class WeightedPriorityStrategy(PriorityStrategy):
    """Weighted scoring that also considers affected_users_count."""

    def calculate(self, impact: str, urgency: str, business_criticality: str, **kwargs) -> dict:
        base_score = (
            self.IMPACT_WEIGHTS.get(impact, 2)
            * self.URGENCY_WEIGHTS.get(urgency, 2)
            * self.CRITICALITY_WEIGHTS.get(business_criticality, 2)
        )
        affected_users = kwargs.get("affected_users_count", 1)
        # Bonus: +2 per 10 affected users, capped at +10
        user_bonus = min(10, (affected_users // 10) * 2)
        score = base_score + user_bonus
        return {"priority": self.score_to_priority(score), "priority_score": float(score)}
