from typing import Any

from openai import OpenAI
from sqlalchemy.orm import Session

from app.config import settings
from app.prompts.templates import PROMPT_BUILDERS
from app.services.settings_service import get_setting

_client = OpenAI(api_key=settings.deepseek_api_key, base_url=settings.deepseek_base_url)

TITLE_MAP = {
    "annual_summary": "党建工作年度总结",
    "duty_report": "党建工作责任制述职报告",
    "meeting_minutes": "党支部会议纪要",
    "notice": "党建工作通知",
    "rectification_plan": "问题整改方案",
}


def title_for(material_type: str, form_values: dict[str, Any]) -> str:
    return str(form_values.get("title") or TITLE_MAP.get(material_type, "党建材料"))


def generate_content(material_type: str, form_values: dict[str, Any], session: Session) -> str:
    builder = PROMPT_BUILDERS.get(material_type)
    if builder is None:
        raise ValueError(f"未知的材料类型: {material_type}")

    prompt = builder(form_values)

    word_count = form_values.get("target_word_count")
    if word_count and word_count != "unlimited":
        prompt += (
            f"\n\n【篇幅要求】全文（不含标题）字数请控制在约 {word_count} 字左右，"
            "允许 ±15% 的浮动，不要为了凑字数堆砌空话，也不要明显少于要求。"
        )

    unit_context_prompt = get_setting(session, "unit_context_prompt").strip()
    if unit_context_prompt:
        prompt += f"\n\n【单位特色要求】{unit_context_prompt}"

    temperature = float(get_setting(session, "temperature") or "0.4")
    max_tokens = int(get_setting(session, "max_tokens") or "4000")
    model_name = get_setting(session, "model_name") or "deepseek-chat"

    response = _client.chat.completions.create(
        model=model_name,
        messages=[
            {"role": "system", "content": "你是一名严谨、专业的党建文稿写作助手。"},
            {"role": "user", "content": prompt},
        ],
        temperature=temperature,
        max_tokens=max_tokens,
    )
    content = response.choices[0].message.content or ""
    return content.strip()
