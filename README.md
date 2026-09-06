# AI 党建材料智能起草与合规检查工作台 —— 分步实施手册

> 目标：做出一个**可运行、可演示、可讲清楚技术选型**的面试项目。范围：React 前端 + FastAPI 后端 + Chroma 向量库 + DeepSeek API。
> 原则：先跑通"能用的最小闭环"（一种材料类型端到端），再横向扩展到五种材料类型，最后补检查引擎细节。**不要一开始就想着五种材料全做齐再联调**，否则前期长时间看不到效果，容易卡住。

---

## 阶段 0：环境准备（30 分钟）

1. 安装工具：Node.js ≥18、Python ≥3.10、Git。
2. 申请 DeepSeek API Key（https://platform.deepseek.com），记下 `DEEPSEEK_API_KEY`。
3. 目录结构（在当前 `AI+党建/` 下创建）：

```
AI+党建/
├── backend/            # FastAPI 服务
├── frontend/            # React + Vite + Ant Design
├── data/                # 知识库原始文档、SQLite 数据库文件
└── 实施手册.md
```

4. 用 `.env`（backend 目录）保存密钥，**加入 .gitignore，不要提交到仓库**：
```
DEEPSEEK_API_KEY=sk-xxxx
DEEPSEEK_BASE_URL=https://api.deepseek.com
```

---

## 阶段 1：后端骨架 + 打通一条"最小闭环"（先做"年度工作总结"一种类型）

### 1.1 初始化 FastAPI 项目

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install fastapi uvicorn[standard] sqlalchemy pydantic-settings openai langchain langchain-community chromadb python-multipart
```

`openai` 库可以直接用来调 DeepSeek（DeepSeek 兼容 OpenAI 协议，改 `base_url` 即可），不用单独 SDK。

### 1.2 目录结构

```
backend/
├── app/
│   ├── main.py                # FastAPI 入口
│   ├── config.py               # 读取 .env
│   ├── db.py                   # SQLAlchemy engine/session
│   ├── models.py                # ORM 模型（materials 表）
│   ├── schemas.py                # Pydantic 请求/响应模型
│   ├── prompts/
│   │   ├── base.py              # 通用党建话语体系 system prompt 片段
│   │   └── templates.py         # 五类材料的模板（先写"总结"一种）
│   ├── rag/
│   │   ├── build_index.py       # 离线脚本：把 data/ 下文档灌入 Chroma
│   │   └── retriever.py         # 检索封装
│   ├── rules/
│   │   └── engine.py            # 规则引擎（正则/关键词检查）
│   ├── services/
│   │   ├── generator.py         # 生成逻辑：组装 prompt → 调 LLM
│   │   └── checker.py           # 检查逻辑：规则引擎 + LLM 二次检查
│   └── routers/
│       ├── materials.py         # /api/materials/*
│       └── knowledge.py         # /api/knowledge/query
└── requirements.txt
```

先只搭 `main.py`、`config.py`、`schemas.py`、`prompts/templates.py`（总结类）、`services/generator.py`、`routers/materials.py` 这几个文件，把"提交表单 → 拿到初稿"跑通，其余（RAG、规则引擎、其他材料类型）后面阶段再加。

### 1.3 config.py

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    deepseek_api_key: str
    deepseek_base_url: str = "https://api.deepseek.com"
    class Config:
        env_file = ".env"

settings = Settings()
```

### 1.4 schemas.py（第一版，只覆盖"总结"类型）

```python
from pydantic import BaseModel
from typing import List, Optional

class WorkItem(BaseModel):
    name: str
    method: str
    result: Optional[str] = None   # 量化成果，允许为空，交给规则引擎提示补充

class SummaryInput(BaseModel):
    material_type: str = "annual_summary"
    time_range: str
    work_items: List[WorkItem]
    problems: List[str]
    next_plans: List[str]
    highlights: Optional[str] = None

class GenerateResponse(BaseModel):
    material_id: int
    content: str
```

### 1.5 prompts/templates.py

把 PRD 里那段 Prompt 片段直接结构化成 Python 字符串模板，用 `.format()` 或 f-string 注入结构化输入：

```python
BASE_STYLE = """你是一位经验丰富的国企党建文秘，擅长撰写规范的党建工作材料。
话语体系要求：严格使用党建规范表述，如"坚持以习近平新时代中国特色社会主义思想为指导"、
"深刻领悟'两个确立'的决定性意义"等，不得使用口语化或泛泛而谈的表述。"""

ANNUAL_SUMMARY_TEMPLATE = """{base_style}

【材料类型】年度工作总结
【结构要求】必须包含且仅包含三部分："一、主要工作及成效""二、存在的问题""三、下一步工作计划"
【表述要求】每项工作必须包含具体做法和量化成果；如果用户未提供量化数据，请在该条后用【建议补充数据】标注，不要编造数字
【字数要求】2000-3000字
【特色要求】结合"党建与科研深度融合"的单位特色

【参考素材】
{rag_context}

【用户输入】
时间范围：{time_range}
主要工作：
{work_items_text}
存在问题：{problems_text}
下一步计划：{next_plans_text}
特色亮点：{highlights}

请直接输出材料正文，不要输出解释性文字。"""
```

关键设计点（面试可以讲）：
- **禁止编造数字**：用户没填数据时用 `【建议补充数据】` 标注而不是让模型瞎编，这是防止 AI 生成材料出现事实性错误的关键约束。
- **结构强约束**：把标题层级写死在 prompt 里，而不是让模型自由发挥，保证输出可解析、可后续做规则检查。

### 1.6 services/generator.py

```python
from openai import OpenAI
from app.config import settings
from app.prompts.templates import ANNUAL_SUMMARY_TEMPLATE, BASE_STYLE

client = OpenAI(api_key=settings.deepseek_api_key, base_url=settings.deepseek_base_url)

def generate_annual_summary(data, rag_context: str = "（暂无检索素材）") -> str:
    work_items_text = "\n".join(
        f"- {w.name}：{w.method}" + (f"，成效：{w.result}" if w.result else "（未提供量化数据）")
        for w in data.work_items
    )
    prompt = ANNUAL_SUMMARY_TEMPLATE.format(
        base_style=BASE_STYLE,
        rag_context=rag_context,
        time_range=data.time_range,
        work_items_text=work_items_text,
        problems_text="；".join(data.problems),
        next_plans_text="；".join(data.next_plans),
        highlights=data.highlights or "无",
    )
    resp = client.chat.completions.create(
        model="deepseek-chat",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.4,
    )
    return resp.choices[0].message.content
```

### 1.7 routers/materials.py + main.py

```python
# routers/materials.py
from fastapi import APIRouter
from app.schemas import SummaryInput, GenerateResponse
from app.services.generator import generate_annual_summary
from app.db import save_material

router = APIRouter(prefix="/api/materials", tags=["materials"])

@router.post("/generate", response_model=GenerateResponse)
def generate(data: SummaryInput):
    content = generate_annual_summary(data)
    material_id = save_material(data.material_type, content)
    return GenerateResponse(material_id=material_id, content=content)
```

```python
# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import materials

app = FastAPI(title="党建材料工作台")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
app.include_router(materials.router)
```

跑起来：
```bash
uvicorn app.main:app --reload
```
打开 `http://127.0.0.1:8000/docs`，用 Swagger UI 直接 POST 一条测试数据，**确认这一步真的能拿到 DeepSeek 生成的文本**再往下走。这是第一个里程碑。

---

## 阶段 2：SQLite 持久化 + 历史记录

1. `models.py` 定义 `Material` 表（id, type, title, content, check_report, created_at）。
2. `db.py` 用 `sqlite:///../data/app.db`，启动时 `Base.metadata.create_all()`。
3. 补 `GET /api/materials/history` 和 `GET /api/materials/{id}`。

这一步很快，主要是为了后面演示"历史记录"页面用。

---

## 阶段 3：规则引擎（先做这个，比 RAG 更快见效，也更能体现"party building 专业性"）

`rules/engine.py`：

```python
import re

RULES = [
    {"pattern": r"二个维护", "severity": "fatal", "message": "应为“两个维护”"},
    {"pattern": r"两个维护.{0,10}决定性意义", "severity": "fatal",
     "message": "“两个确立”和“两个维护”是不同概念，决定性意义对应的是“两个确立”"},
]

REQUIRED_SECTIONS = {
    "annual_summary": ["主要工作", "存在的问题", "下一步工作计划"],
    "duty_report": ["履职情况", "廉洁自律", "存在不足", "努力方向"],
    "meeting_minutes": ["时间", "地点", "主持人", "参会人员", "议题"],
}

def check_terms(content: str):
    issues = []
    for rule in RULES:
        if re.search(rule["pattern"], content):
            issues.append({"type": "政治术语", "severity": rule["severity"], "message": rule["message"]})
    return issues

def check_structure(material_type: str, content: str):
    issues = []
    for section in REQUIRED_SECTIONS.get(material_type, []):
        if section not in content:
            issues.append({"type": "格式完整性", "severity": "fatal", "message": f"缺少必需部分：{section}"})
    return issues

def run_rule_engine(material_type: str, content: str):
    return check_terms(content) + check_structure(material_type, content)
```

这一层是**确定性**的，面试时强调："规则引擎保证 100% 准确的硬检查，不依赖模型能力，这是合规类产品必须有的兜底。"

---

## 阶段 4：LLM 二次检查（语义级）

`services/checker.py`：

```python
CHECK_PROMPT = """请对以下党建材料进行合规性检查，重点关注：
1. 政治表述是否规范、是否存在过时提法；
2. 结构是否完整；
3. 表述是否空泛（如大量“进一步加强”“不断提高”但无具体措施）；
4. 党建与业务（科研）融合是否体现。

材料内容：
{content}

请只输出 JSON 数组，每条包含字段：type, location, description, suggestion, severity（fatal/warning/good）。
"""

def llm_check(content: str) -> list:
    resp = client.chat.completions.create(
        model="deepseek-chat",
        messages=[{"role": "user", "content": CHECK_PROMPT.format(content=content)}],
        temperature=0,
        response_format={"type": "json_object"},  # 或用 json_array，视 DeepSeek 支持情况调整为「输出JSON对象包一层数组字段」
    )
    ...  # json.loads 解析，做异常兜底（模型偶尔不返回合法JSON，要 try/except 并给默认空列表）
```

把 `run_rule_engine` 的结果和 `llm_check` 的结果合并、按 severity 排序（fatal → warning → good），作为 `/api/materials/check` 的返回。

**务必做好 JSON 解析的异常兜底**——这是这类项目最容易在演示时"翻车"的地方。

---

## 阶段 5：RAG 知识库（先做最小可用版本，不用一开始就四层都上）

### 5.1 准备语料（`data/knowledge/` 下按层级建文件夹）

```
data/knowledge/
├── layer1_terms/         # 党建话语体系.txt（规范表述、易错术语对照）
├── layer2_regulations/   # 党章节选.txt、支部工作条例节选.txt
├── layer3_directives/    # 本年度工作要点.txt
└── layer4_cases/         # 历年优秀总结节选.txt、党建科研融合案例.txt
```
面试演示用，每个文件放几百字真实/半真实内容即可，不需要全文档灌库。

### 5.2 建索引脚本 `rag/build_index.py`

```python
from langchain_community.document_loaders import DirectoryLoader, TextLoader
from langchain_community.vectorstores import Chroma
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.embeddings import HuggingFaceEmbeddings  # 用免费本地embedding模型，避免额外API依赖

def build():
    loader = DirectoryLoader("../data/knowledge", glob="**/*.txt", loader_cls=TextLoader)
    docs = loader.load()
    splitter = RecursiveCharacterTextSplitter(chunk_size=300, chunk_overlap=30)
    chunks = splitter.split_documents(docs)
    embeddings = HuggingFaceEmbeddings(model_name="shibing624/text2vec-base-chinese")
    Chroma.from_documents(chunks, embeddings, persist_directory="../data/chroma_db")

if __name__ == "__main__":
    build()
```
> 注：也可以直接用 DeepSeek 无 embedding 接口时，退而用开源中文 embedding 模型（如上）跑本地，零成本、面试展示够用。

### 5.3 retriever.py

```python
def retrieve(query: str, k: int = 3, layer_filter: str = None) -> str:
    results = vectordb.similarity_search(query, k=k)
    return "\n---\n".join(r.page_content for r in results)
```

把 `generator.py` 里硬编码的 `rag_context="（暂无检索素材）"` 换成真实检索结果，并在返回材料里对引用部分做来源标注（可以简单做：检索到的 chunk 附带来源文件名，生成时要求模型在引用处标注"（依据：xxx）"）。

---

## 阶段 6：横向扩展到五类材料

有了"总结"这条完整链路后，复制模式：
1. 在 `schemas.py` 加 `DutyReportInput`、`MeetingMinutesInput` 等。
2. 在 `prompts/templates.py` 加对应模板（复用 `BASE_STYLE`）。
3. 在 `rules/engine.py` 的 `REQUIRED_SECTIONS` 里加对应必需字段。
4. `routers/materials.py` 用 `material_type` 做路由分发，或者拆成一个统一 `/generate` 接口 + 内部 dispatch：

```python
GENERATORS = {
    "annual_summary": generate_annual_summary,
    "duty_report": generate_duty_report,
    "meeting_minutes": generate_meeting_minutes,
    "notice": generate_notice,
    "rectification_plan": generate_rectification_plan,
}

@router.post("/generate")
def generate(material_type: str, data: dict):
    return GENERATORS[material_type](data)
```

会议纪要和整改方案有 PRD 里提到的特殊输出形式（摘要版/完整版、措施-时限表格），在各自的 generator 函数里加一个 `mode` 参数或让 prompt 输出 Markdown 表格即可。

---

## 阶段 7：前端（React + Vite + Ant Design）

### 7.1 初始化

```bash
cd frontend
npm create vite@latest . -- --template react
npm install antd axios react-router-dom
npm run dev
```

### 7.2 页面结构（对应三步闭环）

```
frontend/src/
├── pages/
│   ├── SelectType.jsx       # 第一步：材料类型卡片选择
│   ├── DynamicForm.jsx       # 第二步：根据类型渲染表单（用 Ant Design Form + 动态字段配置）
│   ├── ResultView.jsx        # 第三步a：展示生成初稿，可编辑，"提交检查"按钮
│   └── CheckReport.jsx       # 第三步b：三色检查报告列表
├── config/
│   └── formSchemas.js        # 每种材料类型对应的表单字段配置（驱动 DynamicForm 渲染）
├── api/
│   └── materials.js          # axios 封装：generate / check / history
└── App.jsx                    # react-router 路由
```

### 7.3 关键设计：`formSchemas.js` 用配置驱动表单，而不是给每种材料写一个表单组件

```js
export const FORM_SCHEMAS = {
  annual_summary: {
    label: "年度工作总结",
    fields: [
      { name: "time_range", label: "时间范围", type: "text", required: true },
      { name: "work_items", label: "主要工作", type: "list", itemFields: ["name", "method", "result"] },
      { name: "problems", label: "存在问题", type: "stringList" },
      { name: "next_plans", label: "下一步计划", type: "stringList" },
      { name: "highlights", label: "特色亮点", type: "text", required: false },
    ],
  },
  // duty_report, meeting_minutes, notice, rectification_plan 依次照此加
};
```
`DynamicForm.jsx` 读这个配置渲染 `Form.List`（动态数组，用 Ant Design 的 `Form.List` 组件正好对应"支持多条添加"的需求），提交时打包成对应的 JSON POST 给后端。

### 7.4 CheckReport.jsx 三色展示

```jsx
const SEVERITY_COLOR = { fatal: "red", warning: "gold", good: "green" };
// 用 Ant Design 的 <Tag color={...}> 和 <List> 渲染 issues 数组即可
```

---

## 阶段 8：联调 + 演示脚本准备

1. 前后端一起跑：`uvicorn`（8000端口）+ `npm run dev`（5173端口），frontend 的 axios baseURL 指向 `http://127.0.0.1:8000`。
2. 走一遍完整闭环：选类型 → 填表单（故意漏填一个数据、故意在问题里写"进一步加强"这种虚话）→ 生成 → 检查报告应该能标出"建议补充数据"和语义空泛问题。**这个"故意留坑再被检查出来"的演示路径，是面试时最有说服力的部分，提前设计好演示数据。**
3. 准备 30 秒讲清楚架构图（PRD 里已经画好了架构图，直接背下来）+ 2 分钟讲清楚"规则引擎+LLM双引擎"和"RAG四层检索策略"这两个亮点。

---

## 阶段 9（时间充裕再做）：加分项

- 时间过滤：`retriever.py` 检索时按文件元数据里的年份过滤，只用近两年文件。
- 文号自动生成：`XX党发〔{年份}〕{序号}号`，序号可以简单用当年已生成通知数+1。
- 导出 Word/PDF：`python-docx` 生成 .docx，前端加"导出"按钮。

---

## 建议的开发顺序总结（最短路径跑通 demo）

1. 阶段 0 环境 → 阶段 1 打通总结类生成（Swagger 验证）→ **第一个里程碑**
2. 阶段 3 规则引擎（快，且是核心卖点）→ 阶段 4 LLM 检查 → **第二个里程碑：完整的生成+检查闭环，仅后端**
3. 阶段 7 前端三步页面接上阶段 1/3/4 的接口 → **第三个里程碑：可视化演示**
4. 阶段 5 RAG → 阶段 2 持久化 → 阶段 6 横向扩五种材料 → 阶段 9 加分项，按面试时间倒推做多少算多少。
