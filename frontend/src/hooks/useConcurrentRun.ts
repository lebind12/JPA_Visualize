import { useCallback, useRef, useState } from 'react';
import { runConcurrent } from '@/api/demo';
import type { ConcurrentRunRequest, ConcurrentRunResponse } from '@/types/concurrent';
import axios from 'axios';

interface UseConcurrentRunResult {
  data: ConcurrentRunResponse | null;
  isLoading: boolean;
  error: Error | null;
  run: (scenarioId: string, req: ConcurrentRunRequest) => void;
}

export function useConcurrentRun(): UseConcurrentRunResult {
  const [data, setData] = useState<ConcurrentRunResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  const run = useCallback((scenarioId: string, req: ConcurrentRunRequest) => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setIsLoading(true);
    setError(null);

    runConcurrent(scenarioId, req, controller.signal)
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
