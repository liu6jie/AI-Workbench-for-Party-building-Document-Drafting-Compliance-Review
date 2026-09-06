from sqlalchemy.orm import Session

from app.models import SystemSetting
from app.seed import DEFAULT_SETTINGS


def get_setting(session: Session, key: str) -> str:
    row = session.get(SystemSetting, key)
    if row is not None:
        return row.value
    return DEFAULT_SETTINGS.get(key, "")


def get_all_settings(session: Session) -> dict[str, str]:
    return {key: get_setting(session, key) for key in DEFAULT_SETTINGS}


def update_settings(session: Session, values: dict[str, str]) -> dict[str, str]:
    for key, value in values.items():
        row = session.get(SystemSetting, key)
        if row is None:
            session.add(SystemSetting(key=key, value=value))
        else:
            row.value = value
    session.commit()
    return get_all_settings(session)
