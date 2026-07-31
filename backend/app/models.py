from datetime import datetime

from sqlalchemy import JSON, Column, DateTime, String, Text

from app.db import Base


class Material(Base):
    __tablename__ = "materials"

    id = Column(String, primary_key=True)
    title = Column(String, nullable=False)
    material_type = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    form_values = Column(JSON, nullable=False, default=dict)
    risk_level = Column(String, nullable=False, default="good")
    created_at = Column(DateTime, default=datetime.utcnow)
