import client from './client';
import type { ScenarioMeta, ScenarioRunResponse, Variant } from '@/types/scenario';
import type { ConcurrentRunRequest, ConcurrentRunResponse } from '@/types/concurrent';

export function fetchScenarios(signal?: AbortSignal): Promise<ScenarioMeta[]> {
  return client
    .get<ScenarioMeta[]>('/demo/scenarios', { signal })
    .then((res) => res.data);
}

export function runScenario(
  id: string,
  variant: Variant,
  signal?: AbortSignal,
  extras?: Record<string, string | number | boolean | undefined>,
): Promise<ScenarioRunResponse> {
  const path = id.replaceAll('.', '/');
  return client
    .get<ScenarioRunResponse>(`/demo/${path}`, {
      params: { variant, ...extras },
      signal,
    })
    .then((res) => res.data);
}

export function runConcurrent(
  scenarioId: string,
  req: ConcurrentRunRequest,
  signal?: AbortSignal,
): Promise<ConcurrentRunResponse> {
  return client
    .post<ConcurrentRunResponse>(`/demo/concurrent/${scenarioId}`, req, { signal })
    .then((res) => res.data);
}
