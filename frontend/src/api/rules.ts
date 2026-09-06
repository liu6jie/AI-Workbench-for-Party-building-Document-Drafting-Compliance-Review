import { apiClient } from './client';

export interface BannedTermRule {
  id: string;
  term: string;
  suggestion: string;
  category: string;
}

export interface RequiredSectionRule {
  id: string;
  material_type: string;
  section_name: string;
  sort_order: number;
}

export interface VaguePhraseRule {
  id: string;
  phrase: string;
}

const RULE_STORAGE_KEY = 'party_compliance_rules_v1';

const DEFAULT_RULES = {
  bannedTerms: [
    { id: 'local-term-1', term: '二个维护', suggestion: '应为「两个维护」', category: '政治术语' },
    { id: 'local-term-2', term: '四个自信心', suggestion: '应为「四个自信」', category: '政治术语' },
  ] as BannedTermRule[],
  requiredSections: [
    ['annual_summary', ['主要工作', '存在的问题', '下一步工作计划']],
    ['duty_report', ['履职', '廉洁自律', '存在不足', '努力方向']],
    ['meeting_minutes', ['议题', '决议事项']],
    ['notice', ['具体要求']],
    ['rectification_plan', ['整改措施']],
  ].flatMap(([materialType, sections]) =>
    (sections as string[]).map((sectionName, index) => ({
      id: `local-section-${materialType}-${index}`,
      material_type: materialType as string,
      section_name: sectionName,
      sort_order: index,
    })),
  ) as RequiredSectionRule[],
  vaguePhrases: ['进一步加强', '不断提高', '狠抓落实', '持续发力'].map((phrase, index) => ({
    id: `local-phrase-${index}`,
    phrase,
  })) as VaguePhraseRule[],
};

type LocalRules = typeof DEFAULT_RULES;

function readLocalRules(): LocalRules {
  try {
    const raw = localStorage.getItem(RULE_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as LocalRules) : DEFAULT_RULES;
  } catch {
    return DEFAULT_RULES;
  }
}

function writeLocalRules(rules: LocalRules) {
  localStorage.setItem(RULE_STORAGE_KEY, JSON.stringify(rules));
}

function nextLocalId(prefix: string) {
  return `local-${prefix}-${Date.now()}-${Math.round(Math.random() * 1000)}`;
}

export async function fetchBannedTerms(): Promise<BannedTermRule[]> {
  try {
    const { data } = await apiClient.get('/api/rules/banned-terms');
    return data;
  } catch {
    return readLocalRules().bannedTerms;
  }
}

export async function saveBannedTerm(payload: Omit<BannedTermRule, 'id'>, id?: string): Promise<BannedTermRule> {
  try {
    const { data } = id
      ? await apiClient.put(`/api/rules/banned-terms/${id}`, payload)
      : await apiClient.post('/api/rules/banned-terms', payload);
    return data;
  } catch {
    const rules = readLocalRules();
    const row = { ...payload, id: id ?? nextLocalId('term') };
    rules.bannedTerms = id
      ? rules.bannedTerms.map((item) => (item.id === id ? row : item))
      : [...rules.bannedTerms, row];
    writeLocalRules(rules);
    return row;
  }
}

export async function deleteBannedTerm(id: string) {
  try {
    await apiClient.delete(`/api/rules/banned-terms/${id}`);
  } catch {
    const rules = readLocalRules();
    rules.bannedTerms = rules.bannedTerms.filter((item) => item.id !== id);
    writeLocalRules(rules);
  }
}

export async function fetchRequiredSections(materialType?: string): Promise<RequiredSectionRule[]> {
  try {
    const { data } = await apiClient.get('/api/rules/required-sections', {
      params: materialType ? { material_type: materialType } : undefined,
    });
    return data;
  } catch {
    return readLocalRules().requiredSections.filter(
      (item) => !materialType || item.material_type === materialType,
    );
  }
}

export async function saveRequiredSection(payload: Omit<RequiredSectionRule, 'id'>, id?: string): Promise<RequiredSectionRule> {
  try {
    const { data } = id
      ? await apiClient.put(`/api/rules/required-sections/${id}`, payload)
      : await apiClient.post('/api/rules/required-sections', payload);
    return data;
  } catch {
    const rules = readLocalRules();
    const row = { ...payload, id: id ?? nextLocalId('section') };
    rules.requiredSections = id
      ? rules.requiredSections.map((item) => (item.id === id ? row : item))
      : [...rules.requiredSections, row];
    writeLocalRules(rules);
    return row;
  }
}

export async function deleteRequiredSection(id: string) {
  try {
    await apiClient.delete(`/api/rules/required-sections/${id}`);
  } catch {
    const rules = readLocalRules();
    rules.requiredSections = rules.requiredSections.filter((item) => item.id !== id);
    writeLocalRules(rules);
  }
}

export async function fetchVaguePhrases(): Promise<VaguePhraseRule[]> {
  try {
    const { data } = await apiClient.get('/api/rules/vague-phrases');
    return data;
  } catch {
    return readLocalRules().vaguePhrases;
  }
}

export async function saveVaguePhrase(payload: Omit<VaguePhraseRule, 'id'>, id?: string): Promise<VaguePhraseRule> {
  try {
    const { data } = id
      ? await apiClient.put(`/api/rules/vague-phrases/${id}`, payload)
      : await apiClient.post('/api/rules/vague-phrases', payload);
    return data;
  } catch {
    const rules = readLocalRules();
    const row = { ...payload, id: id ?? nextLocalId('phrase') };
    rules.vaguePhrases = id
      ? rules.vaguePhrases.map((item) => (item.id === id ? row : item))
      : [...rules.vaguePhrases, row];
    writeLocalRules(rules);
    return row;
  }
}

export async function deleteVaguePhrase(id: string) {
  try {
    await apiClient.delete(`/api/rules/vague-phrases/${id}`);
  } catch {
    const rules = readLocalRules();
    rules.vaguePhrases = rules.vaguePhrases.filter((item) => item.id !== id);
    writeLocalRules(rules);
  }
}
