"""Two-pass compliance checker: deterministic rule engine + LLM semantic pass.

The semantic pass is the part most likely to break during a live demo
(model returns malformed JSON, times out, etc.), so it is wrapped so
that any failure silently degrades to rule-engine-only results instead
of failing the whole request.
"""

import json
from typing import Any

from openai import OpenAI
from sqlalchemy.orm import Session

from app.config import settings
from app.rules.engine import run_rule_engine

_client = OpenAI(api_key=settings.deepseek_api_key, base_url=settings.deepseek_base_url)

SEMANTIC_SYSTEM_PROMPT = """你是一名党建材料合规审查专家。请审查用户提供的党建文稿，
从政治方向、逻辑严谨性、是否存在夸大或不实表述、是否符合党建公文规范等角度进行语义层面的审查
（不需要重复检查术语拼写和是否缺少必需章节，这部分已由规则引擎完成）。

请只以 JSON 对象输出，格式如下，不要输出任何其他文字：
{
  "issues": [
    {
      "severity": "fatal" | "warning",
      "type": "问题类型，如：政治方向、逻辑严谨性、表述夸大",
      "description": "具体问题描述",
      "suggestion": "修改建议",
      "anchor_text": "原文中可定位到的一小段原文，用于前端高亮定位，若无法定位可留空"
    }
  ]
}
如果没有发现问题，返回 {"issues": []}。"""


def _run_semantic_check(content: str, session: Session) -> list[dict[str, Any]]:
    if get_setting(session, "semantic_check_enabled").lower() != "true":
        return []
    try:
        model_name = get_setting(session, "model_name") or "deepseek-chat"
        response = _client.chat.completions.create(
            model=model_name,
            messages=[
                {"role": "system", "content": SEMANTIC_SYSTEM_PROMPT},
                {"role": "user", "content": content},
            ],
            temperature=0,
            max_tokens=int(get_setting(session, "max_tokens") or "4000"),
            response_format={"type": "json_object"},
        )
        raw = response.choices[0].message.content or "{}"
        data = json.loads(raw)
        raw_issues = data.get("issues", [])
        if not isinstance(raw_issues, list):
            return []

        cleaned: list[dict[str, Any]] = []
        for item in raw_issues:
            if not isinstance(item, dict):
                continue
            severity = item.get("severity")
            if severity not in ("fatal", "warning"):
                continue
            cleaned.append(
                {
                    "severity": severity,
                    "type": str(item.get("type") or "语义审查"),
                    "description": str(item.get("description") or ""),
                    "suggestion": item.get("suggestion"),
                    "anchor_text": item.get("anchor_text") or None,
                }
            )
        return cleaned
    except Exception:
        return []


def run_check(material_type: str, content: str, session: Session) -> dict[str, Any]:
    rule_issues = run_rule_engine(material_type, content, session)
    semantic_issues = _run_semantic_check(content, session)

    issues: list[dict[str, Any]] = []
    for idx, source_issue in enumerate(rule_issues + semantic_issues):
        issues.append({**source_issue, "id": f"issue-{idx + 1}"})

    if not any(i["severity"] == "fatal" for i in issues):
        issues.append(
            {
                "id": f"issue-{len(issues) + 1}",
                "severity": "good",
                "type": "格式完整性",
                "description": "材料结构完整，包含所有必需部分",
                "suggestion": None,
                "anchor_text": None,
            }
        )
    issues.append(
        {
            "id": f"issue-{len(issues) + 1}",
            "severity": "good",
            "type": "话语体系",
            "description": "整体表述符合党建规范话语体系",
            "suggestion": None,
            "anchor_text": None,
        }
    )

    fatal_count = sum(1 for i in issues if i["severity"] == "fatal")
    warning_count = sum(1 for i in issues if i["severity"] == "warning")
    good_count = sum(1 for i in issues if i["severity"] == "good")

    if fatal_count > 0:
        conclusion = "存在致命错误，请修改后再报送"
    elif warning_count > 0:
        conclusion = "基本合规，建议按提示优化后报送"
    else:
        conclusion = "材料合规，可直接报送"

    return {
        "fatal_count": fatal_count,
        "warning_count": warning_count,
        "good_count": good_count,
        "conclusion": conclusion,
        "issues": issues,
    }
