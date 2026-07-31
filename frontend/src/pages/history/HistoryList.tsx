import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, DatePicker, Popconfirm, Select, Space, Table, Tag, Typography, message } from 'antd';
import dayjs from 'dayjs';
import { fetchHistory, removeMaterial } from '../../api/material';
import { getTemplateByKey } from '../../components/MaterialFormConfig';
import { SEVERITY_COLOR, SEVERITY_LABEL } from '../../constants/colors';
import { useDraft } from '../../context/DraftContext';
import type { HistoryRecord, MaterialTypeKey } from '../../types/material';

const { RangePicker } = DatePicker;

export default function HistoryList() {
  const navigate = useNavigate();
  const { loadExisting } = useDraft();
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [typeFilter, setTypeFilter] = useState<MaterialTypeKey | undefined>();
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      setRecords(await fetchHistory());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    return records.filter((r) => {
      if (typeFilter && r.materialType !== typeFilter) return false;
      if (dateRange) {
        const t = dayjs(r.createdAt);
        if (t.isBefore(dateRange[0], 'day') || t.isAfter(dateRange[1], 'day')) return false;
      }
      return true;
    });
  }, [records, typeFilter, dateRange]);

  const handleView = (record: HistoryRecord) => {
    const template = getTemplateByKey(record.materialType);
    if (!template) return;
    loadExisting({
      template,
      formValues: record.formValues,
      content: record.content,
      materialId: record.id,
    });
    navigate('/draft/result');
  };

  const handleDelete = async (id: string) => {
    await removeMaterial(id);
    message.success('已删除');
    load();
  };

  return (
    <div>
      <Typography.Title level={5}>历史文稿记录</Typography.Title>
      <Space style={{ marginBottom: 16 }}>
        <Select
          allowClear
          placeholder="按文稿类型筛选"
          style={{ width: 220 }}
          value={typeFilter}
          onChange={setTypeFilter}
          options={[
            { label: '年度/半年工作总结', value: 'annual_summary' },
            { label: '党建责任制述职报告', value: 'duty_report' },
            { label: '会议纪要', value: 'meeting_minutes' },
            { label: '党建通知/实施方案', value: 'notice' },
            { label: '问题整改方案', value: 'rectification_plan' },
          ]}
        />
        <RangePicker onChange={(v) => setDateRange(v as [dayjs.Dayjs, dayjs.Dayjs] | null)} />
      </Space>
      <Table
        rowKey="id"
        loading={loading}
        dataSource={filtered}
        columns={[
          { title: '标题', dataIndex: 'title' },
          {
            title: '文稿类型',
            dataIndex: 'materialType',
            render: (v: MaterialTypeKey) => getTemplateByKey(v)?.title ?? v,
          },
          {
            title: '创建时间',
            dataIndex: 'createdAt',
            render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm'),
          },
          {
            title: '合规风险等级',
            dataIndex: 'riskLevel',
            render: (v: HistoryRecord['riskLevel']) => (
              <Tag color={SEVERITY_COLOR[v]}>{SEVERITY_LABEL[v]}</Tag>
            ),
          },
          {
            title: '操作',
            render: (_, record: HistoryRecord) => (
              <Space>
                <a onClick={() => handleView(record)}>查看/编辑</a>
                <Popconfirm title="确认删除该文稿？" onConfirm={() => handleDelete(record.id)}>
                  <a style={{ color: '#F53F3F' }}>删除</a>
                </Popconfirm>
              </Space>
            ),
          },
        ]}
      />
      <Button style={{ marginTop: 16 }} onClick={() => navigate('/draft/select')}>
        新建材料
      </Button>
    </div>
  );
}
