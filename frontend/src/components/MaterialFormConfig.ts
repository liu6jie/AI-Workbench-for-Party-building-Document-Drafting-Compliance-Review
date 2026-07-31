import type { MaterialTemplateConfig } from '../types/material';

/**
 * 五类党建材料的表单配置。新增材料类型只需要在此数组追加一项配置，
 * DynamicForm / TemplateSelect 会自动渲染对应表单与卡片，无需新增页面。
 */
export const MATERIAL_TEMPLATES: MaterialTemplateConfig[] = [
  {
    key: 'annual_summary',
    title: '年度 / 半年党建工作总结',
    scenario: '适用于年终、半年度党建工作总结汇报，面向上级党委或本单位党员大会',
    structurePreview: ['一、主要工作及成效', '二、存在的问题', '三、下一步工作计划'],
    fields: [
      { name: 'time_range', label: '时间范围', type: 'dateRange', required: true },
      {
        name: 'work_items',
        label: '主要工作条目',
        type: 'itemList',
        required: true,
        itemFields: [
          { name: 'name', label: '工作名称', required: true },
          { name: 'method', label: '具体做法', required: true },
          { name: 'result', label: '量化成果' },
        ],
      },
      { name: 'problems', label: '存在问题', type: 'stringList' },
      { name: 'next_plans', label: '下一步工作计划', type: 'stringList', required: true },
      { name: 'highlights', label: '特色亮点（党建+科研融合）', type: 'textarea' },
    ],
  },
  {
    key: 'duty_report',
    title: '党建责任制述职报告',
    scenario: '适用于党组织书记年度抓党建工作述职评议',
    structurePreview: ['一、履行抓党建第一责任人职责情况', '二、廉洁自律情况', '三、存在不足', '四、努力方向'],
    fields: [
      { name: 'duty_scope', label: '岗位职责', type: 'textarea', required: true },
      { name: 'performance', label: '履职情况', type: 'textarea', required: true },
      { name: 'integrity', label: '廉洁自律情况', type: 'textarea', required: true },
      { name: 'shortcomings', label: '存在不足', type: 'stringList', required: true },
      { name: 'direction', label: '努力方向', type: 'stringList', required: true },
    ],
  },
  {
    key: 'meeting_minutes',
    title: '会议纪要',
    scenario: '适用于党支部会议、党委会、专题会议记录整理',
    structurePreview: ['标题', '时间 / 地点 / 主持人 / 参会人员', '议题与讨论内容', '决议事项', '落款'],
    fields: [
      { name: 'meeting_time', label: '会议时间', type: 'date', required: true },
      { name: 'location', label: '会议地点', type: 'text', required: true },
      { name: 'host', label: '主持人', type: 'text', required: true },
      { name: 'attendees', label: '参会人员', type: 'stringList', required: true },
      { name: 'topics', label: '议题', type: 'stringList', required: true },
      { name: 'discussion', label: '讨论内容', type: 'textarea', required: true },
      { name: 'resolutions', label: '决议事项', type: 'stringList', required: true },
      {
        name: 'output_mode',
        label: '输出版本',
        type: 'select',
        options: [
          { label: '完整版（详细记录）', value: 'full' },
          { label: '摘要版（300字简报）', value: 'summary' },
        ],
      },
    ],
  },
  {
    key: 'notice',
    title: '党建通知 / 实施方案',
    scenario: '适用于党内活动通知、专项工作实施方案发布',
    structurePreview: ['文号', '通知事由（目的依据）', '事项内容', '具体要求', '联系方式落款'],
    fields: [
      { name: 'reason', label: '通知事由', type: 'textarea', required: true },
      { name: 'time_location', label: '时间地点', type: 'text', required: true },
      { name: 'participants', label: '参加人员', type: 'text', required: true },
      { name: 'requirements', label: '具体要求', type: 'textarea', required: true },
      { name: 'contact', label: '联系人及方式', type: 'text', required: true },
    ],
  },
  {
    key: 'rectification_plan',
    title: '问题整改方案 & 自查报告',
    scenario: '适用于巡视巡察、民主生活会问题整改落实',
    structurePreview: ['问题来源', '问题描述 / 整改措施 / 责任部门 / 完成时限对照表', '整改要求'],
    fields: [
      { name: 'problem_source', label: '问题来源', type: 'text', required: true },
      {
        name: 'measures',
        label: '问题-措施-时限对照',
        type: 'itemList',
        required: true,
        itemFields: [
          { name: 'problem', label: '问题描述', required: true },
          { name: 'measure', label: '整改措施', required: true },
          { name: 'department', label: '责任部门', required: true },
          { name: 'deadline', label: '完成时限', required: true },
        ],
      },
    ],
  },
];

export function getTemplateByKey(key: string): MaterialTemplateConfig | undefined {
  return MATERIAL_TEMPLATES.find((t) => t.key === key);
}
