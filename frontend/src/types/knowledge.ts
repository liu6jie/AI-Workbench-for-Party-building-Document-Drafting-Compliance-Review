export type KnowledgeLayerKey = 'terms' | 'regulations' | 'directives' | 'cases';

export interface KnowledgeLayer {
  key: KnowledgeLayerKey;
  title: string;
  description: string;
}

export interface KnowledgeDoc {
  id: string;
  layer: KnowledgeLayerKey;
  name: string;
  uploadedAt: string;
  sizeKb: number;
}

export interface KnowledgeSearchResult {
  docName: string;
  snippet: string;
  score: number;
}
