import { apiClient } from './client';
import type { KnowledgeDoc, KnowledgeLayerKey, KnowledgeSearchResult } from '../types/knowledge';

const STORAGE_KEY = 'party_knowledge_docs_v1';

const SEED_DOCS: KnowledgeDoc[] = [
  { id: 'seed-1', layer: 'terms', name: '党建规范话语库-易错术语对照表.txt', uploadedAt: '2026-01-10', sizeKb: 12 },
  { id: 'seed-2', layer: 'regulations', name: '中国共产党支部工作条例（试行）节选.txt', uploadedAt: '2026-01-10', sizeKb: 34 },
  { id: 'seed-3', layer: 'directives', name: '2026年度党建工作要点.txt', uploadedAt: '2026-02-15', sizeKb: 18 },
  { id: 'seed-4', layer: 'cases', name: '党建+科研融合优秀案例汇编.txt', uploadedAt: '2026-03-01', sizeKb: 45 },
];

function readDocs(): KnowledgeDoc[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as KnowledgeDoc[]) : SEED_DOCS;
  } catch {
    return SEED_DOCS;
  }
}

function writeDocs(docs: KnowledgeDoc[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
}

export async function fetchKnowledgeDocs(layer?: KnowledgeLayerKey): Promise<KnowledgeDoc[]> {
  try {
    const { data } = await apiClient.get('/api/knowledge/docs', { params: { layer } });
    return data;
  } catch {
    const docs = readDocs();
    return layer ? docs.filter((d) => d.layer === layer) : docs;
  }
}

export async function addKnowledgeDoc(layer: KnowledgeLayerKey, name: string, sizeKb = 0): Promise<KnowledgeDoc> {
  const doc: KnowledgeDoc = {
    id: `doc-${Date.now()}-${Math.round(Math.random() * 1000)}`,
    layer,
    name,
    uploadedAt: new Date().toISOString().slice(0, 10),
    sizeKb,
  };
  try {
    const { data } = await apiClient.post('/api/knowledge/docs', doc);
    return data;
  } catch {
    const docs = readDocs();
    docs.push(doc);
    writeDocs(docs);
    return doc;
  }
}

export async function deleteKnowledgeDoc(id: string): Promise<void> {
  try {
    await apiClient.delete(`/api/knowledge/docs/${id}`);
  } catch {
    writeDocs(readDocs().filter((d) => d.id !== id));
  }
}

export async function rebuildIndex(): Promise<{ chunks: number }> {
  try {
    const { data } = await apiClient.post('/api/knowledge/rebuild');
    return data;
  } catch {
    await new Promise((resolve) => setTimeout(resolve, 800));
    return { chunks: readDocs().length * 6 };
  }
}

export async function queryKnowledge(query: string, layer?: KnowledgeLayerKey): Promise<KnowledgeSearchResult[]> {
  try {
    const { data } = await apiClient.get('/api/knowledge/query', { params: { query, layer } });
    return data;
  } catch {
    const docs = readDocs().filter((d) => !layer || d.layer === layer);
    return docs
      .filter((d) => !query || d.name.includes(query))
      .slice(0, 5)
      .map((d, i) => ({
        docName: d.name,
        snippet: `（模拟检索结果）与"${query || '（空）'}"相关的素材片段，来源：${d.name}……`,
        score: 0.9 - i * 0.1,
      }));
  }
}
