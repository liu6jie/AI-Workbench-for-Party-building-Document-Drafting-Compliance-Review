import json
import urllib.request

BASE = "http://127.0.0.1:8000"


def post(path, payload, timeout=120):
    req = urllib.request.Request(
        BASE + path,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.status, json.loads(resp.read().decode("utf-8"))


payload = {
    "material_type": "annual_summary",
    "time_range": ["2025-01", "2025-12"],
    "work_items": [
        {"name": "党员发展工作", "method": "严格按流程培养积极分子", "result": "新发展党员3名"}
    ],
    "problems": ["理论学习系统性不足"],
    "next_plans": ["加强青年党员培养"],
    "highlights": "创新开展党建+科研融合活动",
    "target_word_count": "600",
}

status, gen = post("/api/materials/generate", payload)
content = gen["content"]
char_count = len(content.replace("\n", "").replace(" ", ""))
print("status:", status)
print("requested target: 600, actual non-whitespace char count:", char_count)
