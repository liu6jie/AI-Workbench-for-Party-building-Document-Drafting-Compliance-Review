from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db import get_session
from app.schemas import SystemSettingsIn, SystemSettingsOut
from app.services.settings_service import get_all_settings, update_settings

router = APIRouter(prefix="/api/settings", tags=["settings"])


@router.get("", response_model=SystemSettingsOut)
def get_settings(session: Session = Depends(get_session)):
    return get_all_settings(session)


@router.put("", response_model=SystemSettingsOut)
def put_settings(payload: SystemSettingsIn, session: Session = Depends(get_session)):
    values = {k: v for k, v in payload.model_dump().items() if v is not None}
    return update_settings(session, values)
