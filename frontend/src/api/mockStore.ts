import type { HistoryRecord } from '../types/material';

/**
 * 后端不可用时的本地兜底存储（localStorage）。
 * 保证前端在没有 FastAPI 服务的情况下也能完整走通"生成 -> 检查 -> 历史记录"演示闭环。
 * 真实后端接口一旦可用，api/material.ts 会优先走网络请求，这里只作为 catch 分支。
 */
const STORAGE_KEY = 'party_materials_history_v1';

function readAll(): HistoryRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as HistoryRecord[]) : [];
  } catch {
    return [];
  }
}

function writeAll(records: HistoryRecord[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

let idSeed = readAll().length;

export function nextId(): string {
  idSeed += 1;
  return `local-${idSeed}-${idSeed * 7919}`;
}

export function listHistory(): HistoryRecord[] {
  return readAll().sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function getHistoryById(id: string): HistoryRecord | undefined {
  return readAll().find((r) => r.id === id);
}

export function upsertHistory(record: HistoryRecord) {
  const all = readAll();
  const idx = all.findIndex((r) => r.id === record.id);
  if (idx >= 0) {
    all[idx] = record;
  } else {
    all.push(record);
  }
  writeAll(all);
}

export function deleteHistory(id: string) {
  writeAll(readAll().filter((r) => r.id !== id));
}
