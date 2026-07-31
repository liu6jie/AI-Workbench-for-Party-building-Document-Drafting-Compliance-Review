import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  DatePicker,
  Form,
  Input,
  Select,
  Space,
  Typography,
  message,
} from 'antd';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import dayjs, { type Dayjs } from 'dayjs';
import { useDraft } from '../../context/DraftContext';
import { generateMaterial } from '../../api/material';
import type { FieldConfig } from '../../types/material';

const { RangePicker } = DatePicker;

function toInitialValues(fields: FieldConfig[], values: Record<string, unknown>) {
  const initial: Record<string, unknown> = { ...values };
  for (const field of fields) {
    const v = values[field.name];
    if (field.type === 'date' && typeof v === 'string' && v) {
      initial[field.name] = dayjs(v);
    }
    if (field.type === 'dateRange' && Array.isArray(v) && v.length === 2) {
      initial[field.name] = [dayjs(v[0] as string), dayjs(v[1] as string)];
    }
  }
  return initial;
}

function normalizeSubmitValues(fields: FieldConfig[], values: Record<string, unknown>) {
  const result: Record<string, unknown> = { ...values };
  for (const field of fields) {
    const v = result[field.name];
    if (field.type === 'date' && v) {
      result[field.name] = (v as Dayjs).format('YYYY-MM-DD');
    }
    if (field.type === 'dateRange' && Array.isArray(v)) {
      result[field.name] = (v as Dayjs[]).map((d) => d.format('YYYY-MM-DD'));
    }
  }
  return result;
}

function renderField(field: FieldConfig) {
  switch (field.type) {
    case 'textarea':
      return <Input.TextArea rows={4} placeholder={field.placeholder ?? `请输入${field.label}`} />;
    case 'date':
      return <DatePicker style={{ width: '100%' }} />;
    case 'dateRange':
      return <RangePicker style={{ width: '100%' }} />;
    case 'select':
      return <Select options={field.options} placeholder={`请选择${field.label}`} />;
    case 'text':
    default:
      return <Input placeholder={field.placeholder ?? `请输入${field.label}`} />;
  }
}

function StringListField({ field }: { field: FieldConfig }) {
  return (
    <Form.List name={field.name}>
      {(fields, { add, remove }) => (
        <div>
          {fields.map(({ key, name, ...rest }) => (
            <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
              <Form.Item {...rest} name={name} style={{ minWidth: 420, marginBottom: 0 }}>
                <Input placeholder={`${field.label}条目`} />
              </Form.Item>
              <MinusCircleOutlined onClick={() => remove(name)} />
            </Space>
          ))}
          <Button type="dashed" onClick={() => add()} icon={<PlusOutlined />}>
            新增{field.label}
          </Button>
        </div>
      )}
    </Form.List>
  );
}

function ItemListField({ field }: { field: FieldConfig }) {
  const subFields = field.itemFields ?? [];
  return (
    <Form.List name={field.name}>
      {(fields, { add, remove }) => (
        <div>
          {fields.map(({ key, name, ...rest }) => (
            <Space
              key={key}
              style={{
                display: 'flex',
                marginBottom: 12,
                padding: 12,
                border: '1px solid #f0f0f0',
                borderRadius: 6,
              }}
              align="start"
              wrap
            >
              {subFields.map((sub) => (
                <Form.Item
                  key={sub.name}
                  {...rest}
                  label={sub.label}
                  name={[name, sub.name]}
                  rules={sub.required ? [{ required: true, message: `请输入${sub.label}` }] : undefined}
                  style={{ marginBottom: 0, minWidth: 200 }}
                >
                  <Input placeholder={sub.label} />
                </Form.Item>
              ))}
              <MinusCircleOutlined onClick={() => remove(name)} style={{ marginTop: 32 }} />
            </Space>
          ))}
          <Button type="dashed" onClick={() => add()} icon={<PlusOutlined />}>
            新增{field.label}
          </Button>
        </div>
      )}
    </Form.List>
  );
}

export default function DynamicForm() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const { template, formValues, setFormValues, addVersion, setMaterialId } = useDraft();

  useEffect(() => {
    if (!template) {
      navigate('/draft/select');
    }
  }, [template, navigate]);

  const initialValues = useMemo(
    () => (template ? toInitialValues(template.fields, formValues) : {}),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [template?.key],
  );

  if (!template) return null;

  const handleFinish = async (values: Record<string, unknown>) => {
    const normalized = normalizeSubmitValues(template.fields, values);
    setFormValues(normalized);
    const hide = message.loading('正在检索知识库并调用大模型生成初稿…', 0);
    try {
      const result = await generateMaterial(template.key, normalized);
      addVersion(result.content);
      setMaterialId(result.materialId);
      navigate('/draft/result');
    } catch (err) {
      message.error('生成失败，请重试');
    } finally {
      hide();
    }
  };

  return (
    <div>
      <Typography.Title level={5}>Step2 · 填写「{template.title}」结构化信息</Typography.Title>
      <Form
        form={form}
        layout="vertical"
        initialValues={initialValues}
        onFinish={handleFinish}
        style={{ maxWidth: 900 }}
      >
        {template.fields.map((field) => {
          if (field.type === 'stringList') {
            return (
              <Form.Item key={field.name} label={field.label} required={field.required}>
                <StringListField field={field} />
              </Form.Item>
            );
          }
          if (field.type === 'itemList') {
            return (
              <Form.Item key={field.name} label={field.label} required={field.required}>
                <ItemListField field={field} />
              </Form.Item>
            );
          }
          return (
            <Form.Item
              key={field.name}
              name={field.name}
              label={field.label}
              rules={field.required ? [{ required: true, message: `请输入${field.label}` }] : undefined}
            >
              {renderField(field)}
            </Form.Item>
          );
        })}

        <Form.Item name="target_word_count" label="目标字数" initialValue="1200">
          <Select
            options={[
              { label: '约 600 字', value: '600' },
              { label: '约 1000 字', value: '1000' },
              { label: '约 1500 字', value: '1500' },
              { label: '约 2000 字', value: '2000' },
              { label: '约 3000 字', value: '3000' },
              { label: '不限字数', value: 'unlimited' },
            ]}
          />
        </Form.Item>

        <Space style={{ marginTop: 16 }}>
          <Button onClick={() => navigate('/draft/select')}>上一步</Button>
          <Button type="primary" htmlType="submit">
            AI 生成初稿
          </Button>
        </Space>
      </Form>
    </div>
  );
}
