import type { ComplianceIssue, ComplianceReportData, MaterialTypeKey } from '../types/material';

/**
 * 本地兜底的"生成"与"检查"逻辑，仅在后端（FastAPI + DeepSeek）不可达时触发，
 * 保证前端可以独立演示完整的三步闭环。真正的生成/检查逻辑见 backend 实施手册。
 */

const VAGUE_PHRASES = ['进一步加强', '不断提高', '狠抓落实', '持续发力'];

function fmtDateRange(v: unknown): string {
  if (Array.isArray(v) && v.length === 2) {
    return `${v[0]}至${v[1]}`;
  }
  return String(v ?? '（未填写）');
}

function bulletList(items: unknown, empty = '（未填写）'): string {
  if (!Array.isArray(items) || items.length === 0) return `- ${empty}`;
  return items.map((it) => `- ${it}`).join('\n');
}

export function mockGenerateContent(materialType: MaterialTypeKey, form: Record<string, any>): string {
  switch (materialType) {
    case 'annual_summary': {
      const workItems = Array.isArray(form.work_items) ? form.work_items : [];
      const workText = workItems.length
        ? workItems
            .map((w: any, i: number) => {
              const result = w?.result ? `，量化成果：${w.result}` : '，【建议补充数据】';
              return `${i + 1}. ${w?.name ?? '（未命名工作）'}：${w?.method ?? ''}${result}`;
            })
            .join('\n')
        : '（未填写主要工作）';
      return `# 党建工作总结

坚持以习近平新时代中国特色社会主义思想为指导，深刻领悟"两个确立"的决定性意义，紧紧围绕${fmtDateRange(form.time_range)}期间中心任务，扎实推进党建与科研深度融合。

## 一、主要工作及成效

${workText}

## 二、存在的问题

${bulletList(form.problems)}

## 三、下一步工作计划

${bulletList(form.next_plans)}

${form.highlights ? `## 特色亮点\n\n${form.highlights}` : ''}
`;
    }
    case 'duty_report':
      return `# 党建责任制述职报告

## 一、履行抓党建第一责任人职责情况

岗位职责：${form.duty_scope ?? ''}

履职情况：${form.performance ?? ''}

## 二、廉洁自律情况

${form.integrity ?? ''}

## 三、存在不足

${bulletList(form.shortcomings)}

## 四、努力方向

${bulletList(form.direction)}
`;
    case 'meeting_minutes':
      return `# 会议纪要

**时间**：${form.meeting_time ?? ''}　**地点**：${form.location ?? ''}　**主持人**：${form.host ?? ''}

**参会人员**：${Array.isArray(form.attendees) ? form.attendees.join('、') : ''}

## 议题

${bulletList(form.topics)}

## 讨论内容

${form.discussion ?? ''}

## 决议事项

${bulletList(form.resolutions)}

（落款：党委办公室）
`;
    case 'notice':
      return `# 关于${form.reason ?? '相关事项'}的通知

XX党发〔2026〕X号

各党支部：

根据工作安排，现就有关事项通知如下：

**时间地点**：${form.time_location ?? ''}

**参加人员**：${form.participants ?? ''}

**具体要求**：

${form.requirements ?? ''}

**联系人**：${form.contact ?? ''}

特此通知。
`;
    case 'rectification_plan': {
      const measures = Array.isArray(form.measures) ? form.measures : [];
      const rows = measures.length
        ? measures
            .map((m: any) => `| ${m?.problem ?? ''} | ${m?.measure ?? ''} | ${m?.department ?? ''} | ${m?.deadline ?? ''} |`)
            .join('\n')
        : '| （未填写） | | | |';
      return `# 问题整改方案

**问题来源**：${form.problem_source ?? ''}

| 问题描述 | 整改措施 | 责任部门 | 完成时限 |
| --- | --- | --- | --- |
${rows}
`;
    }
    default:
      return '（未知材料类型）';
  }
}

let issueSeed = 0;
function issue(partial: Omit<ComplianceIssue, 'id'>): ComplianceIssue {
  issueSeed += 1;
  return { id: `issue-${issueSeed}`, ...partial };
}

export function mockCheckContent(materialType: MaterialTypeKey, content: string): ComplianceReportData {
  const issues: ComplianceIssue[] = [];

  if (content.includes('二个维护')) {
    issues.push(
      issue({
        severity: 'fatal',
        type: '政治术语',
        description: '文中出现"二个维护"，属于政治表述错误',
        suggestion: '应为"两个维护"',
        anchorText: '二个维护',
      }),
    );
  }

  const requiredSections: Record<MaterialTypeKey, string[]> = {
    annual_summary: ['主要工作及成效', '存在的问题', '下一步工作计划'],
    duty_report: ['履职', '廉洁自律', '存在不足', '努力方向'],
    meeting_minutes: ['议题', '决议事项'],
    notice: ['具体要求'],
    rectification_plan: ['整改措施'],
  };
  for (const section of requiredSections[materialType] ?? []) {
    if (!content.includes(section)) {
      issues.push(
        issue({
          severity: 'fatal',
          type: '格式完整性',
          description: `缺少必需部分："${section}"`,
          suggestion: `请补充"${section}"相关内容`,
        }),
      );
    }
  }

  if (content.includes('【建议补充数据】')) {
    issues.push(
      issue({
        severity: 'warning',
        type: '数据支撑',
        description: '存在工作条目缺少量化成果',
        suggestion: '建议补充具体数据（如覆盖人数、完成率、项目数量等）支撑工作成效',
        anchorText: '【建议补充数据】',
      }),
    );
  }

  for (const phrase of VAGUE_PHRASES) {
    if (content.includes(phrase)) {
      issues.push(
        issue({
          severity: 'warning',
          type: '表述空泛',
          description: `出现"${phrase}"等空泛表述，缺乏具体举措`,
          suggestion: '建议替换为具体的做法、责任人和时间节点',
          anchorText: phrase,
        }),
      );
    }
  }

  if (issues.filter((i) => i.severity === 'fatal').length === 0) {
    issues.push(
      issue({
        severity: 'good',
        type: '结构完整性',
        description: '材料结构完整，包含所有必需部分',
      }),
    );
  }
  issues.push(
    issue({
      severity: 'good',
      type: '话语体系',
      description: '整体表述符合党建规范话语体系',
    }),
  );

  const fatalCount = issues.filter((i) => i.severity === 'fatal').length;
  const warningCount = issues.filter((i) => i.severity === 'warning').length;
  const goodCount = issues.filter((i) => i.severity === 'good').length;

  const conclusion =
    fatalCount > 0
      ? '存在致命错误，请修改后再报送'
      : warningCount > 0
        ? '基本合规，建议按提示优化后报送'
        : '材料合规，可直接报送';

  return { fatalCount, warningCount, goodCount, conclusion, issues };
}
