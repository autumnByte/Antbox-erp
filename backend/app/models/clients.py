import uuid
from sqlalchemy import Column, String, Float, DateTime, Text, Enum, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from app.core.database import Base

class ClientStageEnum(str, enum.Enum):
    prospect = "prospect"
    outreach = "outreach"
    negotiation = "negotiation"
    active = "active"
    ppo_stage = "ppo_stage"
    churned = "churned"

class Client(Base):
    __tablename__ = "clients"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_name = Column(String(255), nullable=False)
    industry = Column(String(100), nullable=True)
    contact_name = Column(String(255), nullable=True)
    contact_email = Column(String(255), nullable=True)
    stage = Column(Enum(ClientStageEnum), default=ClientStageEnum.prospect)
    pipeline_value = Column(Float, default=0.0)
    intern_slots = Column(Integer, default=1)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    deployments = relationship("Deployment", back_populates="client")