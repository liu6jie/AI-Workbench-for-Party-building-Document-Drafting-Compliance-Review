"""Prompt templates for the 5 party-building material types.

Each builder takes the raw form_values dict posted by the frontend
(field names match `frontend/src/components/MaterialFormConfig.ts`)
and returns a full prompt string to send to DeepSeek.
"""

from typing import Any

BASE_STYLE = """你是一名长期从事党建工作文稿写作的机关笔杆子，熟悉党建材料的公文话语体系。
写作要求：
1. 使用规范的党建公文用语，语气庄重、结构清晰，采用 Markdown 标题分段。
2. 严格使用官方术语，例如"两个维护""四个意识""四个自信""两个确立"，禁止使用"二个维护"等错误表述。
3. 只能依据下方提供的素材进行组织加工，不允许编造具体数据、时间、人名或事件。
   如某处内容素材中未提供必要信息，请在该处原文插入标记【建议补充数据】，不要凭空编造。
4. 避免空洞套话，如"进一步加强""不断提高""狠抓落实""持续发力"等，应结合素材给出具体做法；
   若素材本身较为简略，可保留概括性表述，但不得连续堆砌套话。
5. 直接输出正文 Markdown 内容，不要输出任何解释性文字或代码块围栏。"""


def _join(items: list[str] | None, empty_hint: str = "【建议补充数据】") -> str:
    if not items:
        return empty_hint
    return "\n".join(f"- {item}" for item in items if item)


def build_annual_summary_prompt(form: dict[str, Any]) -> str:
    time_range = form.get("time_range") or ["【建议补充数据】", "【建议补充数据】"]
    work_items = form.get("work_items") or []
    work_items_text = "\n".join(
        f"- 工作事项：{w.get('name', '【建议补充数据】')}；具体做法：{w.get('method', '【建议补充数据】')}；"
        f"取得成效：{w.get('result', '【建议补充数据】')}"
        for w in work_items
    ) or "【建议补充数据】"
    problems = _join(form.get("problems"))
    next_plans = _join(form.get("next_plans"))
    highlights = form.get("highlights") or "【建议补充数据】"

    return f"""{BASE_STYLE}

请撰写一份《党建工作年度总结》，素材如下：

【总结时间范围】{time_range[0]} 至 {time_range[1]}

【主要工作事项】
{work_items_text}

【存在的问题和不足】
{problems}

【下一步工作计划】
{next_plans}

【工作亮点/特色做法】
{highlights}

请按照"一、主要工作开展情况　二、存在的问题和不足　三、下一步工作计划"的结构组织全文，
每个工作事项需包含具体做法与成效，问题部分需具体、不回避，计划部分需具备可操作性。"""


def build_duty_report_prompt(form: dict[str, Any]) -> str:
    duty_scope = form.get("duty_scope") or "【建议补充数据】"
    performance = form.get("performance") or "【建议补充数据】"
    integrity = form.get("integrity") or "【建议补充数据】"
    shortcomings = form.get("shortcomings") or "【建议补充数据】"
    direction = _join(form.get("direction"))

    return f"""{BASE_STYLE}

请撰写一份《党建工作责任制述职报告》，素材如下：

【履行"一岗双责"职责范围】{duty_scope}

【履职情况】{performance}

【廉洁自律情况】{integrity}

【存在的不足】{shortcomings}

【今后努力方向】
{direction}

请按照"一、履行主体责任情况　二、廉洁自律情况　三、存在问题及努力方向"的结构组织全文，
体现第一人称述职口吻，履职情况需结合素材具体展开，不得空泛。"""


def build_meeting_minutes_prompt(form: dict[str, Any]) -> str:
    output_mode = form.get("output_mode") or "full"
    attendees = _join(form.get("attendees"))
    topics = _join(form.get("topics"))
    resolutions = _join(form.get("resolutions"))
    discussion = form.get("discussion") or "【建议补充数据】"
    mode_hint = (
        "请输出完整版会议纪要，包含详细讨论过程。"
        if output_mode == "full"
        else "请输出摘要版会议纪要，仅保留会议要点与决议，不展开讨论细节。"
    )

    return f"""{BASE_STYLE}

请撰写一份《党支部会议纪要》，素材如下：

【会议时间】{form.get('meeting_time', '【建议补充数据】')}
【会议地点】{form.get('location', '【建议补充数据】')}
【主持人】{form.get('host', '【建议补充数据】')}

【参会人员】
{attendees}

【会议议题】
{topics}

【讨论情况】{discussion}

【会议决议】
{resolutions}

{mode_hint}
请按照"会议基本情况、议题讨论、会议决议"的结构组织全文，格式规范、要素齐全。"""


def build_notice_prompt(form: dict[str, Any]) -> str:
    return f"""{BASE_STYLE}

请撰写一份《党建工作通知》，素材如下：

【发文缘由】{form.get('reason', '【建议补充数据】')}
【活动时间地点】{form.get('time_location', '【建议补充数据】')}
【参加对象】{form.get('participants', '【建议补充数据】')}
【具体要求】{form.get('requirements', '【建议补充数据】')}
【联系方式】{form.get('contact', '【建议补充数据】')}

请按照公文通知的标准格式组织全文，包含标题、发文缘由、事项安排、具体要求、联系方式等要素，
落款处使用【建议补充数据】占位发文单位与日期。"""


def build_rectification_plan_prompt(form: dict[str, Any]) -> str:
    measures = form.get("measures") or []
    measures_text = "\n".join(
        f"- 问题：{m.get('problem', '【建议补充数据】')}；整改措施：{m.get('measure', '【建议补充数据】')}；"
        f"责任部门：{m.get('department', '【建议补充数据】')}；整改时限：{m.get('deadline', '【建议补充数据】')}"
        for m in measures
    ) or "【建议补充数据】"

    return f"""{BASE_STYLE}

请撰写一份《问题整改方案》，素材如下：

【问题来源】{form.get('problem_source', '【建议补充数据】')}

【整改措施清单】
{measures_text}

请按照"一、问题概述　二、整改措施　三、责任分工与时限　四、长效机制"的结构组织全文，
整改措施需与责任部门、时限一一对应，体现整改闭环。"""


PROMPT_BUILDERS = {
    "annual_summary": build_annual_summary_prompt,
    "duty_report": build_duty_report_prompt,
    "meeting_minutes": build_meeting_minutes_prompt,
    "notice": build_notice_prompt,
    "rectification_plan": build_rectification_plan_prompt,
}
