import client from './client';
import type { ScenarioMeta, ScenarioRunResponse, Variant } from '@/types/scenario';

export function fetchScenarios(signal?: AbortSignal): Promise<ScenarioMeta[]> {
  return client
    .get<ScenarioMeta[]>('/demo/scenarios', { signal })
    .then((res) => res.data);
}

export function runScenario(
  id: string,
  variant: Variant,
  signal?: AbortSignal,
): Promise<ScenarioRunResponse> {
  const path = id.replaceAll('.', '/');
  return client
    .get<ScenarioRunResponse>(`/demo/${path}`, {
      params: { variant },
      signal,
    })
    .then((res) => res.data);
}
