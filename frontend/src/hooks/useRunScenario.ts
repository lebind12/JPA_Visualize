import { useCallback, useRef, useState } from 'react';
import { runScenario } from '@/api/demo';
import type { ScenarioRunResponse, Variant } from '@/types/scenario';
import axios from 'axios';

interface UseRunScenarioResult {
  data: ScenarioRunResponse | null;
  isLoading: boolean;
  error: Error | null;
  run: (id: string, variant: Variant) => void;
}

export function useRunScenario(): UseRunScenarioResult {
  const [data, setData] = useState<ScenarioRunResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  const run = useCallback((id: string, variant: Variant) => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setIsLoading(true);
    setError(null);

    runScenario(id, variant, controller.signal)
      .then((result) => {
        setData(result);
      })
      .catch((err: unknown) => {
        if (axios.isCancel(err)) return;
        setError(err instanceof Error ? err : new Error(String(err)));
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  return { data, isLoading, error, run };
}
