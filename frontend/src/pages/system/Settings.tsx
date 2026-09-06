import { useEffect, useState } from 'react';
import { Button, Card, Col, Form, Input, InputNumber, Row, Space, Switch, Typography, message } from 'antd';
import { CheckCircleOutlined, ReloadOutlined, SaveOutlined } from '@ant-design/icons';
import { fetchSettings, updateSettings } from '../../api/settings';

type SettingsFormValues = {
  model_name: string;
  temperature: number;
  max_tokens: number;
  semantic_check_enabled: boolean;
  unit_context_prompt: string;
};

export default function Settings() {
  const [form] = Form.useForm<SettingsFormValues>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const values = await fetchSettings();
      form.setFieldsValue({
        ...values,
        temperature: Number(values.temperature),
        max_tokens: Number(values.max_tokens),
        semantic_check_enabled: values.semantic_check_enabled === 'true',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async (values: SettingsFormValues) => {
    setSaving(true);
    try {
      await updateSettings({
        model_name: values.model_name,
        temperature: String(values.temperature),
        max_tokens: String(values.max_tokens),
        semantic_check_enabled: String(values.semantic_check_enabled),
        unit_context_prompt: values.unit_context_prompt || '',
      });
      message.success('系统设置已保存，后续生成与审查将使用新配置');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <Space align="start" style={{ width: '100%', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <Typography.Title level={5} style={{ marginTop: 0, marginBottom: 8 }}>系统设置</Typography.Title>
          <Typography.Text type="secondary">配置 AI 生成参数和本单位特色信息，影响后续新建材料。</Typography.Text>
        </div>
        <Button icon={<ReloadOutlined />} onClick={load}>恢复当前配置</Button>
      </Space>

      <Form form={form} layout="vertical" onFinish={handleSave} disabled={loading}>
        <Row gutter={16}>
          <Col xs={24} lg={14}>
            <Card title="模型与审查" bordered={false} loading={loading}>
              <Form.Item name="model_name" label="生成模型" rules={[{ required: true, message: '请输入模型名称' }]}>
                <Input placeholder="例如：deepseek-chat" />
              </Form.Item>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="temperature" label="生成温度" rules={[{ required: true, message: '请输入生成温度' }]}>
                    <InputNumber min={0} max={1} step={0.1} precision={1} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="max_tokens" label="最大输出长度" rules={[{ required: true, message: '请输入最大输出长度' }]}>
                    <InputNumber min={500} max={16000} step={500} precision={0} style={{ width: '100%' }} addonAfter="tokens" />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item name="semantic_check_enabled" label="大模型语义审查" valuePropName="checked" extra="关闭后仍保留规则引擎检查，适合只需快速检查的场景。">
                <Switch checkedChildren="开启" unCheckedChildren="关闭" />
              </Form.Item>
            </Card>
          </Col>
          <Col xs={24} lg={10}>
            <Card title="单位特色信息" bordered={false}>
              <Form.Item name="unit_context_prompt" label="生成提示词补充" extra="例如：突出党建与科研融合、研究生党员培养和支部品牌建设。">
                <Input.TextArea rows={9} placeholder="填写需要融入文稿的单位特色、工作重点或表达偏好" showCount maxLength={1000} />
              </Form.Item>
            </Card>
          </Col>
        </Row>
        <Space style={{ marginTop: 16 }}>
          <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saving}>保存设置</Button>
          <Typography.Text type="secondary"><CheckCircleOutlined style={{ color: '#00B42A' }} /> 设置保存在当前工作台</Typography.Text>
        </Space>
      </Form>
    </div>
  );
}
