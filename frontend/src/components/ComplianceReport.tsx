import { Alert, Card, Col, Empty, Row, Statistic, Tag, Typography } from 'antd';
import { CheckCircleFilled, CloseCircleFilled, WarningFilled } from '@ant-design/icons';
import { SEVERITY_COLOR, SEVERITY_LABEL } from '../constants/colors';
import type { ComplianceIssue, ComplianceReportData } from '../types/material';

const ALERT_TYPE: Record<ComplianceIssue['severity'], 'error' | 'warning' | 'success'> = {
  fatal: 'error',
  warning: 'warning',
  good: 'success',
};

function IssueGroup({
  severity,
  issues,
  onLocate,
}: {
  severity: ComplianceIssue['severity'];
  issues: ComplianceIssue[];
  onLocate?: (issue: ComplianceIssue) => void;
}) {
  if (issues.length === 0) return null;
  return (
    <div style={{ marginBottom: 16 }}>
      <Typography.Text strong style={{ color: SEVERITY_COLOR[severity] }}>
        {SEVERITY_LABEL[severity]}（{issues.length}）
      </Typography.Text>
      <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {issues.map((issue) => (
          <Alert
            key={issue.id}
            type={ALERT_TYPE[severity]}
            style={{ cursor: issue.anchorText ? 'pointer' : 'default' }}
            onClick={() => issue.anchorText && onLocate?.(issue)}
            title={
              <span>
                <Tag color={SEVERITY_COLOR[severity]}>{issue.type}</Tag>
                {issue.description}
              </span>
            }
            description={
              <>
                {issue.location && <div>位置：{issue.location}</div>}
                {issue.suggestion && <div>标准修正方案：{issue.suggestion}</div>}
              </>
            }
            showIcon
          />
        ))}
      </div>
    </div>
  );
}

export default function ComplianceReport({
  report,
  onLocate,
}: {
  report: ComplianceReportData | null;
  onLocate?: (issue: ComplianceIssue) => void;
}) {
  if (!report) {
    return (
      <Card title="材料合规检测汇总" style={{ height: '100%' }}>
        <Empty description="点击左侧「生成初稿」后将自动展示合规检查报告" />
      </Card>
    );
  }

  const fatalIssues = report.issues.filter((i) => i.severity === 'fatal');
  const warningIssues = report.issues.filter((i) => i.severity === 'warning');
  const goodIssues = report.issues.filter((i) => i.severity === 'good');

  return (
    <Card title="材料合规检测汇总" style={{ height: '100%', overflow: 'auto' }}>
      <Row gutter={12} style={{ marginBottom: 20 }}>
        <Col span={8}>
          <Statistic
            title="致命错误"
            value={report.fatalCount}
            styles={{ content: { color: SEVERITY_COLOR.fatal } }}
            prefix={<CloseCircleFilled />}
          />
        </Col>
        <Col span={8}>
          <Statistic
            title="建议优化"
            value={report.warningCount}
            styles={{ content: { color: SEVERITY_COLOR.warning } }}
            prefix={<WarningFilled />}
          />
        </Col>
        <Col span={8}>
          <Statistic
            title="合规良好"
            value={report.goodCount}
            styles={{ content: { color: SEVERITY_COLOR.good } }}
            prefix={<CheckCircleFilled />}
          />
        </Col>
      </Row>
      <Alert
        title={`整体评估结论：${report.conclusion}`}
        type={report.fatalCount > 0 ? 'error' : report.warningCount > 0 ? 'warning' : 'success'}
        showIcon
        style={{ marginBottom: 20 }}
      />
      <IssueGroup severity="fatal" issues={fatalIssues} onLocate={onLocate} />
      <IssueGroup severity="warning" issues={warningIssues} onLocate={onLocate} />
      <IssueGroup severity="good" issues={goodIssues} onLocate={onLocate} />
    </Card>
  );
}
