from datetime import datetime

from sqlalchemy import JSON, Column, DateTime, Integer, String, Text

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


class BannedTerm(Base):
    __tablename__ = "banned_terms"

    id = Column(String, primary_key=True)
    term = Column(String, nullable=False)
    suggestion = Column(String, nullable=False)
    category = Column(String, nullable=False, default="政治术语")


class RequiredSection(Base):
    __tablename__ = "required_sections"

    id = Column(String, primary_key=True)
    material_type = Column(String, nullable=False)
    section_name = Column(String, nullable=False)
    sort_order = Column(Integer, nullable=False, default=0)


class VaguePhrase(Base):
    __tablename__ = "vague_phrases"

    id = Column(String, primary_key=True)
    phrase = Column(String, nullable=False)


class SystemSetting(Base):
    __tablename__ = "system_settings"

    key = Column(String, primary_key=True)
    value = Column(String, nullable=False)
