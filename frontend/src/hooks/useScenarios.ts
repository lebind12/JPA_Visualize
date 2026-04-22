import { useCallback, useEffect, useReducer } from 'react';
import { fetchScenarios } from '@/api/demo';
import type { ScenarioMeta } from '@/types/scenario';
import axios from 'axios';

interface State {
  data: ScenarioMeta[];
  isLoading: boolean;
  error: Error | null;
}

type Action =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: ScenarioMeta[] }
  | { type: 'FETCH_ERROR'; payload: Error };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, isLoading: true, error: null };
    case 'FETCH_SUCCESS':
      return { data: action.payload, isLoading: false, error: null };
    case 'FETCH_ERROR':
      return { ...state, isLoading: false, error: action.payload };
    default:
      return state;
  }
}

interface UseScenariosResult {
  data: ScenarioMeta[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useScenarios(): UseScenariosResult {
  const [state, dispatch] = useReducer(reducer, {
    data: [],
    isLoading: true,
    error: null,
  });
  const [tick, setTick] = useReducer((t: number) => t + 1, 0);

  useEffect(() => {
    const controller = new AbortController();

    dispatch({ type: 'FETCH_START' });

    fetchScenarios(controller.signal)
      .then((scenarios) => {
        dispatch({ type: 'FETCH_SUCCESS', payload: scenarios });
      })
      .catch((err: unknown) => {
        if (axios.isCancel(err)) return;
        dispatch({
          type: 'FETCH_ERROR',
          payload: err instanceof Error ? err : new Error(String(err)),
        });
      });

    return () => {
      controller.abort();
    };
  }, [tick]);

  const refetch = useCallback(() => {
    setTick();
  }, []);

  return { data: state.data, isLoading: state.isLoading, error: state.error, refetch };
}
