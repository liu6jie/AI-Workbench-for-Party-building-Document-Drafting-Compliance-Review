import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db import get_session
from app.models import Material
from app.schemas import (
    CheckRequest,
    ComplianceReportOut,
    GenerateRequest,
    GenerateResponse,
    HistoryRecordOut,
)
from app.services.checker import run_check
from app.services.generator import generate_content, title_for

router = APIRouter(prefix="/api/materials", tags=["materials"])


@router.post("/generate", response_model=GenerateResponse)
def generate(payload: GenerateRequest, session: Session = Depends(get_session)):
    form_values = payload.model_dump(exclude={"material_type"})
    content = generate_content(payload.material_type, form_values)

    material = Material(
        id=uuid.uuid4().hex,
        title=title_for(payload.material_type, form_values),
        material_type=payload.material_type,
        content=content,
        form_values=form_values,
        risk_level="good",
        created_at=datetime.utcnow(),
    )
    session.add(material)
    session.commit()

    return GenerateResponse(material_id=material.id, content=material.content)


@router.post("/check", response_model=ComplianceReportOut)
def check(payload: CheckRequest):
    report = run_check(payload.material_type, payload.content)
    return ComplianceReportOut(**report)


@router.get("/history", response_model=list[HistoryRecordOut])
def history(session: Session = Depends(get_session)):
    materials = session.query(Material).order_by(Material.created_at.desc()).all()
    return [
        HistoryRecordOut(
            id=m.id,
            title=m.title,
            material_type=m.material_type,
            created_at=m.created_at.isoformat(),
            risk_level=m.risk_level,
            content=m.content,
            form_values=m.form_values or {},
        )
        for m in materials
    ]


@router.get("/{material_id}", response_model=HistoryRecordOut)
def get_material(material_id: str, session: Session = Depends(get_session)):
    material = session.get(Material, material_id)
    if material is None:
        raise HTTPException(status_code=404, detail="材料不存在")
    return HistoryRecordOut(
        id=material.id,
        title=material.title,
        material_type=material.material_type,
        created_at=material.created_at.isoformat(),
        risk_level=material.risk_level,
        content=material.content,
        form_values=material.form_values or {},
    )


@router.delete("/{material_id}", status_code=204)
def delete_material(material_id: str, session: Session = Depends(get_session)):
    material = session.get(Material, material_id)
    if material is None:
        raise HTTPException(status_code=404, detail="材料不存在")
    session.delete(material)
    session.commit()
