import uuid

from sqlalchemy.orm import Session

from app.models import BannedTerm, RequiredSection, SystemSetting, VaguePhrase
from app.rules.engine import DEFAULT_BANNED_TERMS, DEFAULT_REQUIRED_SECTIONS, DEFAULT_VAGUE_PHRASES

DEFAULT_SETTINGS = {
    "model_name": "deepseek-chat",
    "temperature": "0.4",
    "max_tokens": "4000",
    "semantic_check_enabled": "true",
    "unit_context_prompt": "",
}


def seed_defaults(session: Session) -> None:
    if session.query(BannedTerm).count() == 0:
        for term, suggestion, category in DEFAULT_BANNED_TERMS:
            session.add(BannedTerm(id=uuid.uuid4().hex, term=term, suggestion=suggestion, category=category))

    if session.query(RequiredSection).count() == 0:
        for material_type, sections in DEFAULT_REQUIRED_SECTIONS.items():
            for order, section_name in enumerate(sections):
                session.add(
                    RequiredSection(
                        id=uuid.uuid4().hex,
                        material_type=material_type,
                        section_name=section_name,
                        sort_order=order,
                    )
                )

    if session.query(VaguePhrase).count() == 0:
        for phrase in DEFAULT_VAGUE_PHRASES:
            session.add(VaguePhrase(id=uuid.uuid4().hex, phrase=phrase))

    for key, value in DEFAULT_SETTINGS.items():
        if session.get(SystemSetting, key) is None:
            session.add(SystemSetting(key=key, value=value))

    session.commit()
