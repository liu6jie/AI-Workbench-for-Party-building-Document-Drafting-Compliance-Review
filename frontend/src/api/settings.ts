import { apiClient } from './client';

export interface SystemSettings {
  model_name: string;
  temperature: string;
  max_tokens: string;
  semantic_check_enabled: string;
  unit_context_prompt: string;
}

const SETTINGS_STORAGE_KEY = 'party_system_settings_v1';

export const DEFAULT_SETTINGS: SystemSettings = {
  model_name: 'deepseek-chat',
  temperature: '0.4',
  max_tokens: '4000',
  semantic_check_enabled: 'true',
  unit_context_prompt: '',
};

function readLocalSettings(): SystemSettings {
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY) || '{}') };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function fetchSettings(): Promise<SystemSettings> {
  try {
    const { data } = await apiClient.get('/api/settings');
    return data;
  } catch {
    return readLocalSettings();
  }
}

export async function updateSettings(values: Partial<SystemSettings>): Promise<SystemSettings> {
  try {
    const { data } = await apiClient.put('/api/settings', values);
    return data;
  } catch {
    const next = { ...readLocalSettings(), ...values };
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(next));
    return next;
  }
}
