"""Deterministic regex/keyword compliance rule engine.

This is the fast, deterministic first pass of the compliance check —
mirrors `frontend/src/api/mockContent.ts#mockCheckContent` so that the
demo behaves consistently whether or not the backend is reachable.
The LLM-based semantic second pass lives in `app/services/checker.py`.
"""

VAGUE_PHRASES = ["进一步加强", "不断提高", "狠抓落实", "持续发力"]

REQUIRED_SECTIONS: dict[str, list[str]] = {
    "annual_summary": ["主要工作", "存在的问题", "下一步工作计划"],
    "duty_report": ["履职", "廉洁自律", "存在不足", "努力方向"],
    "meeting_minutes": ["议题", "决议事项"],
    "notice": ["具体要求"],
    "rectification_plan": ["整改措施"],
}

BANNED_TERMS = [
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


def run_rule_engine(material_type: str, content: str) -> list[dict]:
    issues: list[dict] = []

    for term, suggestion, issue_type in BANNED_TERMS:
        if term in content:
            issues.append(
                _issue(
                    severity="fatal",
                    type=issue_type,
                    description=f'文中出现"{term}"，属于政治表述错误',
                    suggestion=suggestion,
                    anchor_text=term,
                )
            )

    for section in REQUIRED_SECTIONS.get(material_type, []):
        if section not in content:
            issues.append(
                _issue(
                    severity="fatal",
                    type="格式完整性",
                    description=f'缺少必需部分："{section}"',
                    suggestion=f'请补充"{section}"相关内容',
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

    for phrase in VAGUE_PHRASES:
        if phrase in content:
            issues.append(
                _issue(
                    severity="warning",
                    type="表述空泛",
                    description=f'出现"{phrase}"等空泛表述，缺乏具体举措',
                    suggestion="建议替换为具体的做法、责任人和时间节点",
                    anchor_text=phrase,
                )
            )

    return issues
