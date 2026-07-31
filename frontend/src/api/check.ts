import { apiClient } from './client';
import { mockCheckContent } from './mockContent';
import type { ComplianceReportData, MaterialTypeKey } from '../types/material';

export async function checkMaterial(
  materialType: MaterialTypeKey,
  content: string,
): Promise<ComplianceReportData> {
  try {
    const { data } = await apiClient.post('/api/materials/check', {
      material_type: materialType,
      content,
    });
    return data;
  } catch (err) {
    console.warn('[check] 后端不可用，使用本地规则引擎模拟检查', err);
    return mockCheckContent(materialType, content);
  }
}
