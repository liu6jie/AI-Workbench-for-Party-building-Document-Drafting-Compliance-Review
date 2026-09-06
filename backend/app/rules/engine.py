"""Deterministic regex/keyword compliance rule engine.

This is the fast, deterministic first pass of the compliance check —
mirrors `frontend/src/api/mockContent.ts#mockCheckContent` so that the
demo behaves consistently whether or not the backend is reachable.
The LLM-based semantic second pass lives in `app/services/checker.py`.

The actual rule data (banned terms / required sections / vague phrases)
is stored in the database and maintained via `app/routers/rules.py`.
The constants below are only used to seed the database on first run
(see `app/seed.py`).
"""

from sqlalchemy.orm import Session

from app.models import BannedTerm, RequiredSection, VaguePhrase

DEFAULT_VAGUE_PHRASES = ["进一步加强", "不断提高", "狠抓落实", "持续发力"]

DEFAULT_REQUIRED_SECTIONS: dict[str, list[str]] = {
    "annual_summary": ["主要工作", "存在的问题", "下一步工作计划"],
    "duty_report": ["履职", "廉洁自律", "存在不足", "努力方向"],
    "meeting_minutes": ["议题", "决议事项"],
    "notice": ["具体要求"],
    "rectification_plan": ["整改措施"],
}

DEFAULT_BANNED_TERMS = [
    ("二个维护", "应为「两个维护」", "政治术语"),
    ("四个自信心", "应为「四个自信」", "政治术语"),
]

_seed = 0


def _next_id() -> str:
    global _seed
    _seed += 1
    return f"rule-issue-{_seed}"


def _issue(**kwargs) -> dict:
    return {"id": _next_id(), **kwargs}


def run_rule_engine(material_type: str, content: str, session: Session) -> list[dict]:
    issues: list[dict] = []

    banned_terms = session.query(BannedTerm).all()
    required_sections = (
        session.query(RequiredSection)
        .filter(RequiredSection.material_type == material_type)
        .order_by(RequiredSection.sort_order)
        .all()
    )
    vague_phrases = session.query(VaguePhrase).all()

    for banned in banned_terms:
        if banned.term in content:
            issues.append(
                _issue(
                    severity="fatal",
                    type=banned.category,
                    description=f'文中出现"{banned.term}"，属于政治表述错误',
                    suggestion=banned.suggestion,
                    anchor_text=banned.term,
                )
            )

    for section in required_sections:
        if section.section_name not in content:
            issues.append(
                _issue(
                    severity="fatal",
                    type="格式完整性",
                    description=f'缺少必需部分："{section.section_name}"',
                    suggestion=f'请补充"{section.section_name}"相关内容',
                )
            )

    if "【建议补充数据】" in content:
        issues.append(
            _issue(
                severity="warning",
                type="数据支撑",
                description="存在工作条目缺少量化成果或具体信息",
                suggestion="建议补充具体数据（如覆盖人数、完成率、项目数量等）支撑工作成效",
                anchor_text="【建议补充数据】",
            )
        )

    for vague in vague_phrases:
        if vague.phrase in content:
            issues.append(
                _issue(
                    severity="warning",
                    type="表述空泛",
                    description=f'出现"{vague.phrase}"等空泛表述，缺乏具体举措',
                    suggestion="建议替换为具体的做法、责任人和时间节点",
                    anchor_text=vague.phrase,
                )
            )

    return issues
