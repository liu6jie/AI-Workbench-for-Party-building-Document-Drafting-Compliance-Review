import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db import get_session
from app.models import BannedTerm, RequiredSection, VaguePhrase
from app.schemas import (
    BannedTermIn,
    BannedTermOut,
    RequiredSectionIn,
    RequiredSectionOut,
    VaguePhraseIn,
    VaguePhraseOut,
)

router = APIRouter(prefix="/api/rules", tags=["rules"])


@router.get("/banned-terms", response_model=list[BannedTermOut])
def list_banned_terms(session: Session = Depends(get_session)):
    return session.query(BannedTerm).all()


@router.post("/banned-terms", response_model=BannedTermOut)
def create_banned_term(payload: BannedTermIn, session: Session = Depends(get_session)):
    row = BannedTerm(id=uuid.uuid4().hex, **payload.model_dump())
    session.add(row)
    session.commit()
    return row


@router.put("/banned-terms/{term_id}", response_model=BannedTermOut)
def update_banned_term(term_id: str, payload: BannedTermIn, session: Session = Depends(get_session)):
    row = session.get(BannedTerm, term_id)
    if row is None:
        raise HTTPException(status_code=404, detail="规则不存在")
    for field, value in payload.model_dump().items():
        setattr(row, field, value)
    session.commit()
    return row


@router.delete("/banned-terms/{term_id}", status_code=204)
def delete_banned_term(term_id: str, session: Session = Depends(get_session)):
    row = session.get(BannedTerm, term_id)
    if row is None:
        raise HTTPException(status_code=404, detail="规则不存在")
    session.delete(row)
    session.commit()


@router.get("/required-sections", response_model=list[RequiredSectionOut])
def list_required_sections(material_type: str | None = None, session: Session = Depends(get_session)):
    query = session.query(RequiredSection)
    if material_type:
        query = query.filter(RequiredSection.material_type == material_type)
    return query.order_by(RequiredSection.material_type, RequiredSection.sort_order).all()


@router.post("/required-sections", response_model=RequiredSectionOut)
def create_required_section(payload: RequiredSectionIn, session: Session = Depends(get_session)):
    row = RequiredSection(id=uuid.uuid4().hex, **payload.model_dump())
    session.add(row)
    session.commit()
    return row


@router.put("/required-sections/{section_id}", response_model=RequiredSectionOut)
def update_required_section(section_id: str, payload: RequiredSectionIn, session: Session = Depends(get_session)):
    row = session.get(RequiredSection, section_id)
    if row is None:
        raise HTTPException(status_code=404, detail="规则不存在")
    for field, value in payload.model_dump().items():
        setattr(row, field, value)
    session.commit()
    return row


@router.delete("/required-sections/{section_id}", status_code=204)
def delete_required_section(section_id: str, session: Session = Depends(get_session)):
    row = session.get(RequiredSection, section_id)
    if row is None:
        raise HTTPException(status_code=404, detail="规则不存在")
    session.delete(row)
    session.commit()


@router.get("/vague-phrases", response_model=list[VaguePhraseOut])
def list_vague_phrases(session: Session = Depends(get_session)):
    return session.query(VaguePhrase).all()


@router.post("/vague-phrases", response_model=VaguePhraseOut)
def create_vague_phrase(payload: VaguePhraseIn, session: Session = Depends(get_session)):
    row = VaguePhrase(id=uuid.uuid4().hex, **payload.model_dump())
    session.add(row)
    session.commit()
    return row


@router.put("/vague-phrases/{phrase_id}", response_model=VaguePhraseOut)
def update_vague_phrase(phrase_id: str, payload: VaguePhraseIn, session: Session = Depends(get_session)):
    row = session.get(VaguePhrase, phrase_id)
    if row is None:
        raise HTTPException(status_code=404, detail="规则不存在")
    for field, value in payload.model_dump().items():
        setattr(row, field, value)
    session.commit()
    return row


@router.delete("/vague-phrases/{phrase_id}", status_code=204)
def delete_vague_phrase(phrase_id: str, session: Session = Depends(get_session)):
    row = session.get(VaguePhrase, phrase_id)
    if row is None:
        raise HTTPException(status_code=404, detail="规则不存在")
    session.delete(row)
    session.commit()
