export type MaterialTypeKey =
  | 'annual_summary'
  | 'duty_report'
  | 'meeting_minutes'
  | 'notice'
  | 'rectification_plan';

export type FieldType =
  | 'text'
  | 'textarea'
  | 'date'
  | 'dateRange'
  | 'select'
  | 'stringList'
  | 'itemList';

export interface SubFieldConfig {
  name: string;
  label: string;
  required?: boolean;
}

export interface FieldConfig {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  options?: { label: string; value: string }[]; // for select
  itemFields?: SubFieldConfig[]; // for itemList
}

export interface MaterialTemplateConfig {
  key: MaterialTypeKey;
  title: string;
  scenario: string;
  structurePreview: string[];
  fields: FieldConfig[];
}

export type Severity = 'fatal' | 'warning' | 'good';

export interface ComplianceIssue {
  id: string;
  severity: Severity;
  type: string;
  location?: string;
  description: string;
  suggestion?: string;
  anchorText?: string;
}

export interface ComplianceReportData {
  fatalCount: number;
  warningCount: number;
  goodCount: number;
  conclusion: string;
  issues: ComplianceIssue[];
}

export interface HistoryRecord {
  id: string;
  title: string;
  materialType: MaterialTypeKey;
  createdAt: string;
  riskLevel: Severity;
  content: string;
  formValues: Record<string, unknown>;
}
