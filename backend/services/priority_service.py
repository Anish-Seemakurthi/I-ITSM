"""
Priority Service — Calculates priority and score using Strategy Pattern.
"""
from typing import Dict, Any
from patterns.strategy import BasicPriorityStrategy, WeightedPriorityStrategy, PriorityStrategy


class PriorityService:
    def __init__(self, strategy: PriorityStrategy = None):
        self._strategy = strategy or BasicPriorityStrategy()

    def set_strategy(self, strategy: PriorityStrategy) -> None:
        self._strategy = strategy

    def calculate_priority(
        self,
        impact: str,
        urgency: str,
        business_criticality: str,
        affected_users_count: int = 1,
    ) -> Dict[str, Any]:
        """
        Calculates priority (P1, P2, P3, P4) and numerical priority_score.
        """
        impact_val = impact.value if hasattr(impact, "value") else str(impact)
        urgency_val = urgency.value if hasattr(urgency, "value") else str(urgency)
        crit_val = business_criticality.value if hasattr(business_criticality, "value") else str(business_criticality)

        return self._strategy.calculate(
            impact=impact_val,
            urgency=urgency_val,
            business_criticality=crit_val,
            affected_users_count=affected_users_count,
        )

