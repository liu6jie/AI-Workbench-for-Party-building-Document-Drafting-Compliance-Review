import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Divider, Space, Tag, Typography } from 'antd';
import {
  ArrowRightOutlined,
  AuditOutlined,
  BellOutlined,
  CloudOutlined,
  CheckCircleFilled,
  FileTextOutlined,
  FlagOutlined,
  SafetyCertificateOutlined,
  StarFilled,
  StarOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { MATERIAL_TEMPLATES, getTemplateByKey } from '../../components/MaterialFormConfig';
import { useDraft } from '../../context/DraftContext';
import { getFavorites, getRecent, pushRecent, toggleFavorite } from '../../utils/templatePrefs';
import type { MaterialTypeKey } from '../../types/material';

const TEMPLATE_ICONS: Record<MaterialTypeKey, ReactNode> = {
  annual_summary: <FileTextOutlined />,
  duty_report: <TeamOutlined />,
  meeting_minutes: <AuditOutlined />,
  notice: <BellOutlined />,
  rectification_plan: <SafetyCertificateOutlined />,
};

const TEMPLATE_LABELS: Record<MaterialTypeKey, string> = {
  annual_summary: '工作总结类',
  duty_report: '述职报告类',
  meeting_minutes: '会议记录类',
  notice: '通知方案类',
  rectification_plan: '整改落实类',
};

export default function TemplateSelect() {
  const navigate = useNavigate();
  const { setTemplate, reset } = useDraft();
  const [favorites, setFavorites] = useState<string[]>(getFavorites());
  const recent = getRecent();

  const handleStart = (key: string) => {
    const template = getTemplateByKey(key);
    if (!template) return;
    reset();
    setTemplate(template);
    pushRecent(key);
    navigate('/draft/form');
  };

  const handleToggleFavorite = (key: string) => {
    setFavorites(toggleFavorite(key));
  };

  return (
    <div className="template-page">
      <div className="template-page-header">
        <div>
          <div className="section-kicker"><FlagOutlined /> 常用党务材料</div>
          <Typography.Title level={3} className="template-page-title">选择材料模板</Typography.Title>
          <Typography.Paragraph className="template-page-description">
            选择对应的材料类型，填写结构化信息后即可由 AI 协助起草，并自动完成合规检查。
          </Typography.Paragraph>
        </div>
        <div className="template-summary">
          <div className="template-summary-number">05</div>
          <div>
            <div className="template-summary-label">标准化模板</div>
            <div className="template-summary-note">覆盖高频党务场景</div>
          </div>
        </div>
      </div>

      {recent.length > 0 && (
        <div className="recent-template-bar">
          <div className="recent-template-label">最近使用</div>
          <Space size={8} wrap>
            {recent.map((key) => {
              const template = getTemplateByKey(key);
              if (!template) return null;
              return (
                <Tag key={key} className="recent-template-tag" onClick={() => handleStart(key)}>
                  {template.title}
                  <ArrowRightOutlined />
                </Tag>
              );
            })}
          </Space>
        </div>
      )}

      <div className="template-grid">
        {MATERIAL_TEMPLATES.map((template, index) => (
          <Card key={template.key} className={`template-card template-card-${index + 1}`} bordered>
            <div className="template-card-deco deco-star"><StarFilled /></div>
            <div className="template-card-deco deco-cloud"><CloudOutlined /></div>
            <div className="template-card-head">
              <div className="template-icon-wrap">{TEMPLATE_ICONS[template.key]}</div>
              <Tag className="template-type-tag">{TEMPLATE_LABELS[template.key]}</Tag>
              <Button
                type="text"
                className="template-favorite-btn"
                aria-label={favorites.includes(template.key) ? '取消收藏' : '收藏模板'}
                icon={favorites.includes(template.key) ? <StarFilled /> : <StarOutlined />}
                onClick={() => handleToggleFavorite(template.key)}
              />
            </div>

            <Typography.Title level={4} className="template-card-title">{template.title}</Typography.Title>
            <Typography.Paragraph className="template-card-description">{template.scenario}</Typography.Paragraph>

            <Divider />

            <div className="template-structure-label">标准结构预览</div>
            <ul className="template-structure-list">
              {template.structurePreview.map((structure) => (
                <li key={structure}>
                  <CheckCircleFilled />
                  <span>{structure}</span>
                </li>
              ))}
            </ul>

            <div className="template-card-footer">
              <span className="template-card-footnote">AI 辅助起草</span>
              <Button type="primary" className="template-start-button" onClick={() => handleStart(template.key)}>
                开始起草 <ArrowRightOutlined />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
