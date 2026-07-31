import { apiClient } from './client';
import { mockGenerateContent } from './mockContent';
import { deleteHistory, getHistoryById, listHistory, nextId, upsertHistory } from './mockStore';
import type { HistoryRecord, MaterialTypeKey } from '../types/material';

export interface GenerateResult {
  materialId: string;
  content: string;
}

export async function generateMaterial(
  materialType: MaterialTypeKey,
  formValues: Record<string, unknown>,
): Promise<GenerateResult> {
  try {
    const { data } = await apiClient.post('/api/materials/generate', {
      material_type: materialType,
      ...formValues,
    });
    return { materialId: String(data.material_id), content: data.content };
  } catch (err) {
    console.warn('[material] 后端不可用，使用本地模拟生成', err);
    const content = mockGenerateContent(materialType, formValues);
    return { materialId: nextId(), content };
  }
}

function titleFor(materialType: MaterialTypeKey, formValues: Record<string, unknown>): string {
  const map: Record<MaterialTypeKey, string> = {
    annual_summary: '党建工作总结',
    duty_report: '党建责任制述职报告',
    meeting_minutes: '会议纪要',
    notice: '党建通知',
    rectification_plan: '问题整改方案',
  };
  return (formValues.title as string) || map[materialType];
}

export function saveToHistory(
  id: string,
  materialType: MaterialTypeKey,
  content: string,
  formValues: Record<string, unknown>,
  riskLevel: HistoryRecord['riskLevel'] = 'good',
): HistoryRecord {
  const record: HistoryRecord = {
    id,
    title: titleFor(materialType, formValues),
    materialType,
    createdAt: new Date().toISOString(),
    riskLevel,
    content,
    formValues,
  };
  upsertHistory(record);
  return record;
}

export async function fetchHistory(): Promise<HistoryRecord[]> {
  try {
    const { data } = await apiClient.get('/api/materials/history');
    return data;
  } catch (err) {
    return listHistory();
  }
}

export async function fetchMaterialById(id: string): Promise<HistoryRecord | undefined> {
  try {
    const { data } = await apiClient.get(`/api/materials/${id}`);
    return data;
  } catch (err) {
    return getHistoryById(id);
  }
}

export async function removeMaterial(id: string): Promise<void> {
  try {
    await apiClient.delete(`/api/materials/${id}`);
  } catch (err) {
    deleteHistory(id);
  }
}
