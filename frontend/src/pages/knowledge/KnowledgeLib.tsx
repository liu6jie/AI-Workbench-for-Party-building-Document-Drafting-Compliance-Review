import { useEffect, useState } from 'react';
import {
  Button,
  Input,
  List,
  Popconfirm,
  Space,
  Table,
  Tabs,
  Tag,
  Typography,
  Upload,
  message,
} from 'antd';
import { InboxOutlined, ReloadOutlined } from '@ant-design/icons';
import {
  addKnowledgeDoc,
  deleteKnowledgeDoc,
  fetchKnowledgeDocs,
  queryKnowledge,
  rebuildIndex,
} from '../../api/knowledge';
import type { KnowledgeDoc, KnowledgeLayerKey, KnowledgeSearchResult } from '../../types/knowledge';

const LAYERS: { key: KnowledgeLayerKey; title: string; description: string }[] = [
  { key: 'terms', title: '第一层：党建规范话语库', description: '规范表述、固定搭配、易错术语对照表' },
  { key: 'regulations', title: '第二层：党内法规制度库', description: '党章、准则、条例、党支部工作条例' },
  { key: 'directives', title: '第三层：上级党委文件库', description: '年度工作要点、专项通知、最新讲话精神' },
  { key: 'cases', title: '第四层：本单位特色素材库', description: '历年优秀材料、党建+科研融合案例、党员科研先锋事迹' },
];

function LayerPanel({ layer }: { layer: KnowledgeLayerKey }) {
  const [docs, setDocs] = useState<KnowledgeDoc[]>([]);
  const [loading, setLoading] = useState(false);
  const [rebuilding, setRebuilding] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<KnowledgeSearchResult[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      setDocs(await fetchKnowledgeDocs(layer));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layer]);

  const handleRebuild = async () => {
    setRebuilding(true);
    try {
      const { chunks } = await rebuildIndex();
      message.success(`向量索引重建完成，共 ${chunks} 个文本块`);
    } finally {
      setRebuilding(false);
    }
  };

  const handleAddText = async () => {
    if (!textInput.trim()) return;
    await addKnowledgeDoc(layer, `文本录入-${textInput.slice(0, 12)}.txt`);
    setTextInput('');
    load();
  };

  const handleSearch = async () => {
    setResults(await queryKnowledge(query, layer));
  };

  return (
    <div>
      <Typography.Paragraph type="secondary">{LAYERS.find((l) => l.key === layer)?.description}</Typography.Paragraph>
      <Space style={{ marginBottom: 16 }} wrap>
        <Upload
          showUploadList={false}
          beforeUpload={async (file) => {
            await addKnowledgeDoc(layer, file.name, Math.round(file.size / 1024));
            message.success(`已上传 ${file.name}`);
            load();
            return false;
          }}
        >
          <Button icon={<InboxOutlined />}>上传 PDF/Word</Button>
        </Upload>
        <Input.Search
          placeholder="文本录入（直接粘贴素材内容）"
          style={{ width: 320 }}
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          onSearch={handleAddText}
          enterButton="录入"
        />
        <Button icon={<ReloadOutlined />} loading={rebuilding} onClick={handleRebuild}>
          重建向量索引
        </Button>
      </Space>

      <Table
        rowKey="id"
        loading={loading}
        dataSource={docs}
        size="small"
        style={{ marginBottom: 24 }}
        columns={[
          { title: '文件名', dataIndex: 'name' },
          { title: '上传时间', dataIndex: 'uploadedAt' },
          { title: '大小(KB)', dataIndex: 'sizeKb' },
          {
            title: '操作',
            render: (_, doc: KnowledgeDoc) => (
              <Popconfirm
                title="确认删除该素材？"
                onConfirm={async () => {
                  await deleteKnowledgeDoc(doc.id);
                  load();
                }}
              >
                <a style={{ color: '#F53F3F' }}>删除</a>
              </Popconfirm>
            ),
          },
        ]}
      />

      <Typography.Text strong>素材检索预览</Typography.Text>
      <Space style={{ display: 'flex', margin: '8px 0' }}>
        <Input.Search
          placeholder="输入关键词检索本层素材"
          style={{ width: 320 }}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onSearch={handleSearch}
          enterButton
        />
      </Space>
      <List
        bordered
        dataSource={results}
        locale={{ emptyText: '暂无检索结果，试试输入关键词' }}
        renderItem={(item) => (
          <List.Item>
            <Space direction="vertical" size={0}>
              <span>
                <Tag color="blue">{item.docName}</Tag>
                <Typography.Text type="secondary">相关度 {(item.score * 100).toFixed(0)}%</Typography.Text>
              </span>
              <Typography.Text>{item.snippet}</Typography.Text>
            </Space>
          </List.Item>
        )}
      />
    </div>
  );
}

export default function KnowledgeLib() {
  return (
    <div>
      <Typography.Title level={5}>知识库管理（四层 RAG 素材库）</Typography.Title>
      <Tabs
        items={LAYERS.map((l) => ({
          key: l.key,
          label: l.title,
          children: <LayerPanel layer={l.key} />,
        }))}
      />
    </div>
  );
}
