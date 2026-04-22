export type Variant = 'BAD' | 'FIXED';

export interface ScenarioMeta {
  id: string;
  category: string;
  title: string;
  path: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  summary: string;
}

export interface ScenarioRunResponse {
  scenarioId: string;
  variant: Variant;
  elapsedMs: number;
  queryCount: number;
  sqlLog: string[];
  result: unknown;
  notes: string[];
}
