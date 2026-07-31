import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Col, Row, Segmented, Space, Typography, message } from 'antd';
import MDEditor from '@uiw/react-md-editor';
import { useDraft } from '../../context/DraftContext';
import { generateMaterial, saveToHistory } from '../../api/material';
import { checkMaterial } from '../../api/check';
import ComplianceReport from '../../components/ComplianceReport';
import { exportMarkdownAsWord } from '../../utils/exportWord';
import type { ComplianceIssue, ComplianceReportData } from '../../types/material';

export default function ResultCheck() {
  const navigate = useNavigate();
  const {
    template,
    formValues,
    versions,
    activeVersionIndex,
    setActiveVersionIndex,
    addVersion,
    updateActiveContent,
    materialId,
  } = useDraft();

  const [report, setReport] = useState<ComplianceReportData | null>(null);
  const [checking, setChecking] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const editorWrapRef = useRef<HTMLDivElement>(null);

  const content = versions[activeVersionIndex]?.content ?? '';

  useEffect(() => {
    if (!template) {
      navigate('/draft/select');
      return;
    }
    if (versions.length === 0) {
      navigate('/draft/form');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template]);

  useEffect(() => {
    if (!template || !content) return;
    runCheck(content);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeVersionIndex, template]);

  if (!template) return null;

  async function runCheck(text: string) {
    setChecking(true);
    try {
      const result = await checkMaterial(template!.key, text);
      setReport(result);
    } finally {
      setChecking(false);
    }
  }

  const handleRegenerate = async () => {
    setRegenerating(true);
    const hide = message.loading('正在重新生成…', 0);
    try {
      const result = await generateMaterial(template.key, formValues);
      addVersion(result.content);
    } finally {
      hide();
      setRegenerating(false);
    }
  };

  const handleSaveHistory = () => {
    const id = materialId ?? `local-${Date.now()}`;
    const risk: ComplianceIssue['severity'] =
      (report?.fatalCount ?? 0) > 0 ? 'fatal' : (report?.warningCount ?? 0) > 0 ? 'warning' : 'good';
    saveToHistory(id, template.key, content, formValues, risk);
    message.success('已保存至历史文稿记录');
  };

  const handleExportWord = () => {
    exportMarkdownAsWord(content, template.title);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    message.success('已复制全文');
  };

  const handleLocate = (issue: ComplianceIssue) => {
    if (!issue.anchorText || !editorWrapRef.current) return;
    const textarea = editorWrapRef.current.querySelector('textarea');
    if (!textarea) return;
    const idx = content.indexOf(issue.anchorText);
    if (idx === -1) {
      message.warning('未能在当前文稿中定位到该问题文本');
      return;
    }
    const before = content.slice(0, idx);
    const totalLines = content.split('\n').length;
    const lineNumber = before.split('\n').length;
    textarea.focus();
    textarea.setSelectionRange(idx, idx + issue.anchorText.length);
    const ratio = Math.max(0, (lineNumber - 3) / totalLines);
    textarea.scrollTop = ratio * textarea.scrollHeight;
  };

  return (
    <div>
      <Typography.Title level={5}>Step3 · 文稿预览与合规检查</Typography.Title>
      <Row gutter={16}>
        <Col span={14}>
          <Card
            title="文稿编辑器"
            extra={
              <Space>
                {versions.length > 1 && (
                  <Segmented
                    size="small"
                    value={activeVersionIndex}
                    onChange={(v) => setActiveVersionIndex(Number(v))}
                    options={versions.map((_, i) => ({ label: `版本${i + 1}`, value: i }))}
                  />
                )}
                <Button size="small" onClick={handleCopy}>
                  复制全文
                </Button>
                <Button size="small" onClick={handleExportWord}>
                  导出 Word
                </Button>
                <Button size="small" loading={regenerating} onClick={handleRegenerate}>
                  重新生成
                </Button>
              </Space>
            }
          >
            <div data-color-mode="light" ref={editorWrapRef}>
              <MDEditor
                value={content}
                height={560}
                onChange={(v) => {
                  updateActiveContent(v ?? '');
                }}
              />
            </div>
          </Card>
        </Col>
        <Col span={10}>
          <div>
            {checking && !report ? (
              <Card loading title="材料合规检测汇总" />
            ) : (
              <ComplianceReport report={report} onLocate={handleLocate} />
            )}
            <Button
              size="small"
              style={{ marginTop: 8 }}
              loading={checking}
              onClick={() => runCheck(content)}
            >
              基于当前编辑内容重新检查
            </Button>
          </div>
        </Col>
      </Row>

      <Space style={{ marginTop: 16 }}>
        <Button onClick={() => navigate('/draft/form')}>上一步</Button>
        <Button loading={regenerating} onClick={handleRegenerate}>
          重新生成
        </Button>
        <Button type="primary" onClick={handleSaveHistory}>
          保存至历史文稿
        </Button>
        <Button onClick={handleExportWord}>导出 Word 文档</Button>
      </Space>
    </div>
  );
}
