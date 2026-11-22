import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Text
from sqlalchemy.orm import relationship
from database import Base


class ITService(Base):
    __tablename__ = "it_services"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False, unique=True)
    description = Column(Text, nullable=True)
    category = Column(String(100), nullable=True)
    is_critical = Column(Boolean, default=False)
    owner = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    incidents = relationship("Incident", back_populates="service")
    sla_policies = relationship("SLAPolicy", back_populates="service")

    def __repr__(self):
        return f"<ITService {self.name}>"
