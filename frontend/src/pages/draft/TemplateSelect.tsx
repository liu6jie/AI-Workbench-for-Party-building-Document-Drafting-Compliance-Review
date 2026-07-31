import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Col, Row, Space, Tag, Typography } from 'antd';
import { StarFilled, StarOutlined } from '@ant-design/icons';
import { MATERIAL_TEMPLATES, getTemplateByKey } from '../../components/MaterialFormConfig';
import { useDraft } from '../../context/DraftContext';
import { getFavorites, getRecent, pushRecent, toggleFavorite } from '../../utils/templatePrefs';

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
    <div>
      <Typography.Title level={5}>Step1 · 选择材料类型模板</Typography.Title>

      {recent.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <Typography.Text type="secondary">最近使用：</Typography.Text>
          <Space style={{ marginLeft: 8 }}>
            {recent.map((key) => {
              const t = getTemplateByKey(key);
              if (!t) return null;
              return (
                <Tag key={key} color="blue" style={{ cursor: 'pointer' }} onClick={() => handleStart(key)}>
                  {t.title}
                </Tag>
              );
            })}
          </Space>
        </div>
      )}

      <Row gutter={[16, 16]}>
        {MATERIAL_TEMPLATES.map((template) => (
          <Col xs={24} sm={12} lg={8} key={template.key}>
            <Card
              title={template.title}
              extra={
                <Button
                  type="text"
                  icon={
                    favorites.includes(template.key) ? (
                      <StarFilled style={{ color: '#FFAA00' }} />
                    ) : (
                      <StarOutlined />
                    )
                  }
                  onClick={() => handleToggleFavorite(template.key)}
                />
              }
              actions={[
                <Button type="primary" key="start" onClick={() => handleStart(template.key)}>
                  开始起草
                </Button>,
              ]}
              style={{ height: '100%' }}
            >
              <Typography.Paragraph type="secondary" style={{ minHeight: 44 }}>
                {template.scenario}
              </Typography.Paragraph>
              <Typography.Text strong>标准结构预览</Typography.Text>
              <ul style={{ marginTop: 8, paddingLeft: 20 }}>
                {template.structurePreview.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
}
