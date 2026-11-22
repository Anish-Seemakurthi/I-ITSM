"""
Technician Assignment Service — Uses Strategy Pattern for assignment.
"""
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from models.user import User, UserRole
from models.incident import Incident
from patterns.strategy import (
    AssignmentStrategy,
    SkillBasedAssignment,
    LoadBasedAssignment,
    RoundRobinAssignment,
    PriorityBasedAssignment,
)


class AssignmentService:
    STRATEGIES: Dict[str, AssignmentStrategy] = {
        "skill": SkillBasedAssignment(),
        "load": LoadBasedAssignment(),
        "round_robin": RoundRobinAssignment(),
        "priority": PriorityBasedAssignment(),
    }

    def __init__(self, default_strategy_name: str = "skill"):
        self._strategy_name = default_strategy_name
        self._strategy = self.STRATEGIES.get(default_strategy_name, SkillBasedAssignment())

    def set_strategy(self, strategy_name: str) -> None:
        if strategy_name in self.STRATEGIES:
            self._strategy_name = strategy_name
            self._strategy = self.STRATEGIES[strategy_name]
        else:
            raise ValueError(f"Unknown assignment strategy '{strategy_name}'. Available: {list(self.STRATEGIES.keys())}")

    def get_available_technicians(self, db: Session, category: Optional[str] = None) -> List[User]:
        query = db.query(User).filter(
            User.role == UserRole.TECHNICIAN,
            User.is_active == True,
            User.availability == True,
            User.current_workload < User.max_workload,
        )
        return query.all()

    def assign_technician(
        self,
        db: Session,
        incident: Incident,
        strategy_name: Optional[str] = None,
    ) -> Optional[User]:
        strategy = self.STRATEGIES.get(strategy_name, self._strategy) if strategy_name else self._strategy
        techs = self.get_available_technicians(db, str(incident.category.value if incident.category else ""))
        if not techs:
            return None

        # Convert to dict representation for strategy logic
        tech_dicts = [
            {
                "id": t.id,
                "name": t.name,
                "email": t.email,
                "skills": t.skills or [],
                "current_workload": t.current_workload or 0,
                "max_workload": t.max_workload or 5,
                "_user_obj": t,
            }
            for t in techs
        ]

        incident_dict = {
            "id": incident.id,
            "category": incident.category.value if incident.category else None,
            "priority": incident.priority.value if incident.priority else None,
            "title": incident.title,
            "service_id": incident.service_id,
        }

        chosen = strategy.assign(tech_dicts, incident_dict)
        if chosen and "_user_obj" in chosen:
            selected_tech: User = chosen["_user_obj"]
            selected_tech.current_workload = (selected_tech.current_workload or 0) + 1
            incident.technician_id = selected_tech.id
            db.commit()
            db.refresh(selected_tech)
            db.refresh(incident)
            return selected_tech
        return None

    def release_technician(self, db: Session, technician_id: str) -> None:
        if not technician_id:
            return
        tech = db.query(User).filter(User.id == technician_id).first()
        if tech and tech.current_workload and tech.current_workload > 0:
            tech.current_workload -= 1
            db.commit()
            db.refresh(tech)

