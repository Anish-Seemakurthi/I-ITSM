import uuid
from sqlalchemy import Column, String, Integer, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import relationship
from database import Base
from models.incident import IncidentPriority


class SLAPolicy(Base):
    __tablename__ = "sla_policies"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    service_id = Column(String, ForeignKey("it_services.id"), nullable=True)
    priority = Column(SAEnum(IncidentPriority), nullable=False)
    response_time_minutes = Column(Integer, nullable=False)
    resolution_time_minutes = Column(Integer, nullable=False)

    # Relationships
    service = relationship("ITService", back_populates="sla_policies")

    def __repr__(self):
        return f"<SLAPolicy {self.priority} resp={self.response_time_minutes}m>"
