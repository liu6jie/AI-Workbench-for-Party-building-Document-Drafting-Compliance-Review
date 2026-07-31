import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { MaterialTemplateConfig } from '../types/material';

export interface DraftVersion {
  content: string;
  createdAt: string;
}

interface DraftContextValue {
  template: MaterialTemplateConfig | null;
  setTemplate: (t: MaterialTemplateConfig | null) => void;
  formValues: Record<string, unknown>;
  setFormValues: (v: Record<string, unknown>) => void;
  versions: DraftVersion[];
  activeVersionIndex: number;
  setActiveVersionIndex: (i: number) => void;
  addVersion: (content: string) => void;
  updateActiveContent: (content: string) => void;
  materialId: string | null;
  setMaterialId: (id: string | null) => void;
  loadExisting: (params: {
    template: MaterialTemplateConfig;
    formValues: Record<string, unknown>;
    content: string;
    materialId: string;
  }) => void;
  reset: () => void;
}

const DraftContext = createContext<DraftContextValue | null>(null);

export function DraftProvider({ children }: { children: ReactNode }) {
  const [template, setTemplate] = useState<MaterialTemplateConfig | null>(null);
  const [formValues, setFormValues] = useState<Record<string, unknown>>({});
  const [versions, setVersions] = useState<DraftVersion[]>([]);
  const [activeVersionIndex, setActiveVersionIndex] = useState(0);
  const [materialId, setMaterialId] = useState<string | null>(null);

  const value = useMemo<DraftContextValue>(
    () => ({
      template,
      setTemplate,
      formValues,
      setFormValues,
      versions,
      activeVersionIndex,
      setActiveVersionIndex,
      addVersion: (content: string) => {
        setVersions((prev) => {
          const next = [...prev, { content, createdAt: new Date().toISOString() }];
          setActiveVersionIndex(next.length - 1);
          return next;
        });
      },
      updateActiveContent: (content: string) => {
        setVersions((prev) => {
          if (prev.length === 0) return [{ content, createdAt: new Date().toISOString() }];
          const next = [...prev];
          next[activeVersionIndex] = { ...next[activeVersionIndex], content };
          return next;
        });
      },
      materialId,
      setMaterialId,
      loadExisting: ({ template, formValues, content, materialId }) => {
        setTemplate(template);
        setFormValues(formValues);
        setVersions([{ content, createdAt: new Date().toISOString() }]);
        setActiveVersionIndex(0);
        setMaterialId(materialId);
      },
      reset: () => {
        setTemplate(null);
        setFormValues({});
        setVersions([]);
        setActiveVersionIndex(0);
        setMaterialId(null);
      },
    }),
    [template, formValues, versions, activeVersionIndex, materialId],
  );

  return <DraftContext.Provider value={value}>{children}</DraftContext.Provider>;
}

export function useDraft() {
  const ctx = useContext(DraftContext);
  if (!ctx) throw new Error('useDraft 必须在 DraftProvider 内使用');
  return ctx;
}
