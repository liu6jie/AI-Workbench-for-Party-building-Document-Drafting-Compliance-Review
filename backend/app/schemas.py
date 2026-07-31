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
