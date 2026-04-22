export interface ConcurrentRunRequest {
  variant: 'BAD' | 'FIXED';
  threads: number;
  productId: number;
  quantity: number;
  maxRetries?: number;
  resetStockTo?: number;
  productIdB?: number;
}

export interface RunRecord {
  threadIdx: number;
  startOffsetMs: number;
  elapsedMs: number;
  ok: boolean;
  retries: number;
  errorType: string | null;
}

export interface ErrorBucket {
  type: string;
  count: number;
}

export interface ConcurrentRunResponse {
  scenarioId: string;
  variant: 'BAD' | 'FIXED';
  threads: number;
  quantity: number;
  totalMs: number;
  succeeded: number;
  failed: number;
  stockBefore: number;
  stockAfter: number;
  expectedStockAfter: number;
  runs: RunRecord[];
  errors: ErrorBucket[];
  notes?: string[];
}
