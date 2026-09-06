import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  Typography,
  message,
} from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import {
  deleteBannedTerm,
  deleteRequiredSection,
  deleteVaguePhrase,
  fetchBannedTerms,
  fetchRequiredSections,
  fetchVaguePhrases,
  saveBannedTerm,
  saveRequiredSection,
  saveVaguePhrase,
  type BannedTermRule,
  type RequiredSectionRule,
  type VaguePhraseRule,
} from '../../api/rules';

const MATERIAL_OPTIONS = [
  { label: '年度 / 半年党建工作总结', value: 'annual_summary' },
  { label: '党建责任制述职报告', value: 'duty_report' },
  { label: '会议纪要', value: 'meeting_minutes' },
  { label: '党建通知 / 实施方案', value: 'notice' },
  { label: '问题整改方案', value: 'rectification_plan' },
];

const materialLabel = (value: string) => MATERIAL_OPTIONS.find((item) => item.value === value)?.label ?? value;

type RuleFormValues = Partial<BannedTermRule & RequiredSectionRule & VaguePhraseRule>;

export default function RuleConfig() {
  const [activeTab, setActiveTab] = useState('terms');
  const [terms, setTerms] = useState<BannedTermRule[]>([]);
  const [sections, setSections] = useState<RequiredSectionRule[]>([]);
  const [phrases, setPhrases] = useState<VaguePhraseRule[]>([]);
  const [materialType, setMaterialType] = useState('annual_summary');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<RuleFormValues | null>(null);
  const [form] = Form.useForm<RuleFormValues>();

  const load = async () => {
    setLoading(true);
    try {
      const [nextTerms, nextSections, nextPhrases] = await Promise.all([
        fetchBannedTerms(),
        fetchRequiredSections(materialType),
        fetchVaguePhrases(),
      ]);
      setTerms(nextTerms);
      setSections(nextSections);
      setPhrases(nextPhrases);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [materialType]);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    if (activeTab === 'sections') form.setFieldsValue({ material_type: materialType, sort_order: sections.length });
    setModalOpen(true);
  };

  const openEdit = (row: RuleFormValues) => {
    setEditing(row);
    form.setFieldsValue(row);
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    if (activeTab === 'terms') {
      await saveBannedTerm(
        { term: values.term!, suggestion: values.suggestion!, category: values.category || '政治术语' },
        editing?.id,
      );
    } else if (activeTab === 'sections') {
      await saveRequiredSection(
        {
          material_type: values.material_type!,
          section_name: values.section_name!,
          sort_order: values.sort_order ?? 0,
        },
        editing?.id,
      );
    } else {
      await saveVaguePhrase({ phrase: values.phrase! }, editing?.id);
    }
    message.success(editing ? '规则已更新' : '规则已新增');
    setModalOpen(false);
    load();
  };

  const handleDelete = async (kind: string, id: string) => {
    if (kind === 'terms') await deleteBannedTerm(id);
    if (kind === 'sections') await deleteRequiredSection(id);
    if (kind === 'phrases') await deleteVaguePhrase(id);
    message.success('规则已删除');
    load();
  };

  const modalTitle = `${editing ? '编辑' : '新增'}${activeTab === 'terms' ? '政治术语规则' : activeTab === 'sections' ? '必备章节规则' : '空泛表述规则'}`;

  const termColumns = useMemo(
    () => [
      { title: '错误表述', dataIndex: 'term', render: (value: string) => <Tag color="red">{value}</Tag> },
      { title: '修改建议', dataIndex: 'suggestion' },
      { title: '规则分类', dataIndex: 'category' },
      {
        title: '操作',
        width: 140,
        render: (_: unknown, row: BannedTermRule) => (
          <Space>
            <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(row)}>编辑</Button>
            <Popconfirm title="确认删除这条规则？" onConfirm={() => handleDelete('terms', row.id)}>
              <Button type="link" danger size="small" icon={<DeleteOutlined />}>删除</Button>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [activeTab],
  );

  const sectionColumns = [
    { title: '材料类型', dataIndex: 'material_type', render: (value: string) => materialLabel(value) },
    { title: '必备章节', dataIndex: 'section_name' },
    { title: '顺序', dataIndex: 'sort_order', width: 80 },
    {
      title: '操作',
      width: 140,
      render: (_: unknown, row: RequiredSectionRule) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(row)}>编辑</Button>
          <Popconfirm title="确认删除这条规则？" onConfirm={() => handleDelete('sections', row.id)}>
            <Button type="link" danger size="small" icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const phraseColumns = [
    { title: '待优化表述', dataIndex: 'phrase', render: (value: string) => <Tag color="orange">{value}</Tag> },
    { title: '检查说明', render: () => '命中后提示补充具体举措、责任人或时间节点' },
    {
      title: '操作',
      width: 140,
      render: (_: unknown, row: VaguePhraseRule) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(row)}>编辑</Button>
          <Popconfirm title="确认删除这条规则？" onConfirm={() => handleDelete('phrases', row.id)}>
            <Button type="link" danger size="small" icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Space align="start" style={{ width: '100%', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <Typography.Title level={5} style={{ marginTop: 0, marginBottom: 8 }}>合规规则配置</Typography.Title>
          <Typography.Text type="secondary">维护规则引擎使用的检查项，保存后会应用到后续文稿合规检查。</Typography.Text>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={load}>刷新</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新增规则</Button>
        </Space>
      </Space>
      <Card bordered={false} bodyStyle={{ padding: 0 }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            { key: 'terms', label: `政治术语（${terms.length}）`, children: <Table rowKey="id" loading={loading} dataSource={terms} columns={termColumns} pagination={false} /> },
            {
              key: 'sections',
              label: `必备章节（${sections.length}）`,
              children: (
                <div>
                  <Space style={{ marginBottom: 16 }}>
                    <Typography.Text>查看材料类型：</Typography.Text>
                    <Select value={materialType} options={MATERIAL_OPTIONS} style={{ width: 240 }} onChange={setMaterialType} />
                  </Space>
                  <Table rowKey="id" loading={loading} dataSource={sections} columns={sectionColumns} pagination={false} />
                </div>
              ),
            },
            { key: 'phrases', label: `空泛表述（${phrases.length}）`, children: <Table rowKey="id" loading={loading} dataSource={phrases} columns={phraseColumns} pagination={false} /> },
          ]}
        />
      </Card>

      <Modal title={modalTitle} open={modalOpen} onOk={handleSubmit} onCancel={() => setModalOpen(false)} destroyOnHidden>
        <Form form={form} layout="vertical" preserve={false}>
          {activeTab === 'terms' && (
            <>
              <Form.Item name="term" label="错误表述" rules={[{ required: true, message: '请输入需要检查的表述' }]}><Input placeholder="例如：二个维护" /></Form.Item>
              <Form.Item name="suggestion" label="修改建议" rules={[{ required: true, message: '请输入修改建议' }]}><Input placeholder="例如：应为「两个维护」" /></Form.Item>
              <Form.Item name="category" label="规则分类" initialValue="政治术语"><Input /></Form.Item>
            </>
          )}
          {activeTab === 'sections' && (
            <>
              <Form.Item name="material_type" label="材料类型" rules={[{ required: true, message: '请选择材料类型' }]}><Select options={MATERIAL_OPTIONS} /></Form.Item>
              <Form.Item name="section_name" label="必备章节" rules={[{ required: true, message: '请输入章节名称' }]}><Input placeholder="例如：存在的问题" /></Form.Item>
              <Form.Item name="sort_order" label="展示顺序" rules={[{ required: true, message: '请输入顺序' }]}><InputNumber min={0} precision={0} style={{ width: '100%' }} /></Form.Item>
            </>
          )}
          {activeTab === 'phrases' && <Form.Item name="phrase" label="待优化表述" rules={[{ required: true, message: '请输入需要提示的表述' }]}><Input placeholder="例如：进一步加强" /></Form.Item>}
        </Form>
      </Modal>
    </div>
  );
}
