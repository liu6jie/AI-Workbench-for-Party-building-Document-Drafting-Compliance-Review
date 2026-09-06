from typing import Any, Optional

from pydantic import BaseModel, ConfigDict, Field


class GenerateRequest(BaseModel):
    material_type: str

    model_config = ConfigDict(extra="allow")


class GenerateResponse(BaseModel):
    material_id: str
    content: str


class CheckRequest(BaseModel):
    material_type: str
    content: str


class ComplianceIssueOut(BaseModel):
    id: str
    severity: str
    type: str
    location: Optional[str] = None
    description: str
    suggestion: Optional[str] = None
    anchor_text: Optional[str] = Field(default=None, alias="anchorText")

    model_config = ConfigDict(populate_by_name=True)


class ComplianceReportOut(BaseModel):
    fatal_count: int = Field(alias="fatalCount")
    warning_count: int = Field(alias="warningCount")
    good_count: int = Field(alias="goodCount")
    conclusion: str
    issues: list[ComplianceIssueOut]

    model_config = ConfigDict(populate_by_name=True)


class SaveHistoryRequest(BaseModel):
    material_id: Optional[str] = None
    material_type: str
    title: str
    content: str
    form_values: dict[str, Any] = Field(default_factory=dict)
    risk_level: str = "good"


class HistoryRecordOut(BaseModel):
    id: str
    title: str
    material_type: str = Field(alias="materialType")
    created_at: str = Field(alias="createdAt")
    risk_level: str = Field(alias="riskLevel")
    content: str
    form_values: dict[str, Any] = Field(alias="formValues")

    model_config = ConfigDict(populate_by_name=True)


class BannedTermIn(BaseModel):
    term: str
    suggestion: str
    category: str = "政治术语"


class BannedTermOut(BannedTermIn):
    id: str

    model_config = ConfigDict(from_attributes=True)


class RequiredSectionIn(BaseModel):
    material_type: str
    section_name: str
    sort_order: int = 0


class RequiredSectionOut(RequiredSectionIn):
    id: str

    model_config = ConfigDict(from_attributes=True)


class VaguePhraseIn(BaseModel):
    phrase: str


class VaguePhraseOut(VaguePhraseIn):
    id: str

    model_config = ConfigDict(from_attributes=True)


class SystemSettingsOut(BaseModel):
    model_name: str
    temperature: str
    max_tokens: str
    semantic_check_enabled: str
    unit_context_prompt: str


class SystemSettingsIn(BaseModel):
    model_name: Optional[str] = None
    temperature: Optional[str] = None
    max_tokens: Optional[str] = None
    semantic_check_enabled: Optional[str] = None
    unit_context_prompt: Optional[str] = None
