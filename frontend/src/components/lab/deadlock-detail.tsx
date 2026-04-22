import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useConcurrentRun } from '@/hooks/useConcurrentRun';
import { useRunScenario } from '@/hooks/useRunScenario';
import type { ScenarioMeta } from '@/types/scenario';
import type { ConcurrentRunResponse } from '@/types/concurrent';
import MetricsCard from '@/components/lab/metrics-card';
import SqlLogView from '@/components/lab/sql-log-view';
import { ExplanationSection } from '@/components/lab/explanation-section';

const SCENARIO_ID = 'lock.deadlock';
const BAD_PRODUCT_ID_A = 5;
const BAD_PRODUCT_ID_B = 6;
const FIXED_PRODUCT_ID_A = 7;
const FIXED_PRODUCT_ID_B = 8;
const DEFAULT_THREADS = 5;
const DEFAULT_QUANTITY = 1;
const DEFAULT_RESET_STOCK = 100;

interface DeadlockDetailProps {
  scenario: ScenarioMeta;
}

function parseNoteValue(notes: string[] | undefined, key: string): number | null {
  if (!notes) return null;
  const line = notes.find((n) => n.startsWith(key + '='));
  if (!line) return null;
  const val = parseInt(line.split('=')[1], 10);
  return isNaN(val) ? null : val;
}

function ConcurrentResult({ data }: { data: ConcurrentRunResponse }) {
  const isBad = data.variant === 'BAD';
  const borderClass = isBad ? 'border-rose-500/50' : 'border-emerald-500/50';
  const badgeClass = isBad
    ? 'bg-rose-500/10 text-rose-600'
    : 'bg-emerald-500/10 text-emerald-600';
  const labelText = isBad ? 'BAD' : 'FIXED';

  const stockBeforeB = parseNoteValue(data.notes, 'stockBeforeB');
  const stockAfterB = parseNoteValue(data.notes, 'stockAfterB');
  const hasNotesB = stockBeforeB !== null && stockAfterB !== null;

  return (
    <div className={cn('rounded-xl border p-4 flex flex-col gap-3', borderClass)}>
      <div className="flex items-center gap-2">
        <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', badgeClass)}>
          {labelText}
        </span>
        <span className="text-xs text-muted-foreground">{data.threads} threads</span>
      </div>

      <div className="grid grid-cols-3 gap-3 text-sm">
        <div>
          <p className="text-muted-foreground text-xs">성공</p>
          <p className="text-lg font-bold text-emerald-600">{data.succeeded}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">실패</p>
          <p className="text-lg font-bold text-rose-600">{data.failed}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">총 소요</p>
          <p className="text-lg font-bold">{data.totalMs} ms</p>
        </div>
      </div>

      {/* 재고 A */}
      <div className="rounded-lg p-3 text-sm bg-slate-500/10">
        <p className="text-xs text-muted-foreground mb-1">재고 A</p>
        <p>
          <span className="font-mono">{data.stockBefore}</span>
          <span className="text-muted-foreground mx-2">→</span>
          <span className="font-mono font-bold">{data.stockAfter}</span>
        </p>
      </div>

      {/* 재고 B (notes) */}
      {hasNotesB && (
        <div className="rounded-lg p-3 text-sm bg-slate-500/10">
          <p className="text-xs text-muted-foreground mb-1">재고 B (notes)</p>
          <p>
            <span className="font-mono">{stockBeforeB}</span>
            <span className="text-muted-foreground mx-2">→</span>
            <span className="font-mono font-bold">{stockAfterB}</span>
          </p>
        </div>
      )}

      {data.errors.length > 0 && (
        <div className="text-xs text-muted-foreground">
          <p className="font-semibold mb-1">에러 분포</p>
          {data.errors.map((e) => (
            <p key={e.type} className={e.type === 'DeadlockLoser' ? 'text-rose-500 font-semibold' : ''}>
              {e.type}: <span className="font-mono">{e.count}</span>회
            </p>
          ))}
        </div>
      )}

      {data.failed > 0 ? (
        <p className="text-xs text-rose-500 font-semibold">
          데드락으로 일부 트랜잭션 실패
        </p>
      ) : (
        <p className="text-xs text-emerald-500 font-semibold">
          전원 성공 · 정합성 유지
        </p>
      )}

      <div>
        <p className="text-xs text-muted-foreground mb-1">스레드별 결과</p>
        <div className="flex flex-wrap gap-1">
          {data.runs.map((r) => (
            <span
              key={r.threadIdx}
              title={`thread ${r.threadIdx} | ${r.elapsedMs}ms | retries ${r.retries}${r.errorType ? ' | ' + r.errorType : ''}`}
              className={cn(
                'inline-block w-5 h-5 rounded text-[10px] flex items-center justify-center font-mono',
                r.ok ? 'bg-emerald-500/20 text-emerald-700' : 'bg-rose-500/20 text-rose-700',
              )}
            >
              {r.threadIdx + 1}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function DeadlockDetail({ scenario }: DeadlockDetailProps) {
  const bad = useRunScenario();
  const fixed = useRunScenario();
  const concurrentBad = useConcurrentRun();
  const concurrentFixed = useConcurrentRun();

  const [threads, setThreads] = useState(DEFAULT_THREADS);
  const [quantity, setQuantity] = useState(DEFAULT_QUANTITY);
  const [resetStock, setResetStock] = useState(DEFAULT_RESET_STOCK);

  const handleRunBad = () =>
    bad.run(scenario.id, 'BAD', {
      productId: BAD_PRODUCT_ID_A,
      productIdB: BAD_PRODUCT_ID_B,
      quantity,
      resetStockTo: resetStock,
    });

  const handleRunFixed = () =>
    fixed.run(scenario.id, 'FIXED', {
      productId: FIXED_PRODUCT_ID_A,
      productIdB: FIXED_PRODUCT_ID_B,
      quantity,
      resetStockTo: resetStock,
    });

  const handleConcurrentBad = () =>
    concurrentBad.run(SCENARIO_ID, {
      variant: 'BAD',
      threads,
      productId: BAD_PRODUCT_ID_A,
      productIdB: BAD_PRODUCT_ID_B,
      quantity,
      resetStockTo: resetStock,
    });

  const handleConcurrentFixed = () =>
    concurrentFixed.run(SCENARIO_ID, {
      variant: 'FIXED',
      threads,
      productId: FIXED_PRODUCT_ID_A,
      productIdB: FIXED_PRODUCT_ID_B,
      quantity,
      resetStockTo: resetStock,
    });

  const handleConcurrentBoth = () => {
    handleConcurrentBad();
    handleConcurrentFixed();
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-xl font-semibold">{scenario.title}</h2>
        <p className="text-sm text-muted-foreground mt-1">{scenario.summary}</p>
      </div>

      {/* 단발 실행 */}
      <section className="flex flex-col gap-4">
        <header className="flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">단발 실행</span>
          <h3 className="text-lg font-semibold">Bad / Fixed 단건 비교</h3>
          <p className="text-xs text-muted-foreground">
            단발 실행은 경쟁 상태가 없어 데드락이 발생하지 않습니다. Concurrency Lab에서 N개 동시 요청으로 재현하세요.
          </p>
        </header>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="border-rose-500/50 text-rose-600 hover:bg-rose-500/10 hover:text-rose-600"
            onClick={handleRunBad}
            disabled={bad.isLoading}
          >
            {bad.isLoading ? <><Loader2 className="animate-spin" /> 실행 중...</> : 'Run BAD'}
          </Button>
          <Button
            variant="outline"
            className="border-emerald-500/50 text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-600"
            onClick={handleRunFixed}
            disabled={fixed.isLoading}
          >
            {fixed.isLoading ? <><Loader2 className="animate-spin" /> 실행 중...</> : 'Run FIXED'}
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <MetricsCard title="BAD" tone="bad" data={bad.data} isLoading={bad.isLoading} error={bad.error} onRetry={handleRunBad} />
          <MetricsCard title="FIXED" tone="fixed" data={fixed.data} isLoading={fixed.isLoading} error={fixed.error} onRetry={handleRunFixed} />
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <SqlLogView title="BAD" tone="bad" data={bad.data} />
          <SqlLogView title="FIXED" tone="fixed" data={fixed.data} />
        </div>
      </section>

      {/* Concurrency Lab */}
      <section className="flex flex-col gap-4">
        <header className="flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Concurrency Lab</span>
          <h3 className="text-lg font-semibold">N개 스레드 동시 차감</h3>
          <p className="text-xs text-muted-foreground">
            BAD는 상품 #{BAD_PRODUCT_ID_A}/#{BAD_PRODUCT_ID_B} 역순 경쟁, FIXED는 상품 #{FIXED_PRODUCT_ID_A}/#{FIXED_PRODUCT_ID_B} 오름차순 회피.
          </p>
        </header>

        {/* 파라미터 */}
        <div className="flex flex-wrap gap-4 text-sm">
          {[
            { label: '스레드 수', value: threads, setter: setThreads, min: 1, max: 50 },
            { label: '차감 수량', value: quantity, setter: setQuantity, min: 1, max: 100 },
            { label: '초기 재고', value: resetStock, setter: setResetStock, min: 1, max: 9999 },
          ].map(({ label, value, setter, min, max }) => (
            <label key={label} className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">{label}</span>
              <input
                type="number"
                min={min}
                max={max}
                value={value}
                onChange={(e) => setter(Number(e.target.value))}
                className="w-24 rounded-md border px-2 py-1 text-sm bg-background"
              />
            </label>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="border-rose-500/50 text-rose-600 hover:bg-rose-500/10 hover:text-rose-600"
            onClick={handleConcurrentBad}
            disabled={concurrentBad.isLoading}
          >
            {concurrentBad.isLoading ? <><Loader2 className="animate-spin" /> 실행 중...</> : 'Run BAD (동시)'}
          </Button>
          <Button
            variant="outline"
            className="border-emerald-500/50 text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-600"
            onClick={handleConcurrentFixed}
            disabled={concurrentFixed.isLoading}
          >
            {concurrentFixed.isLoading ? <><Loader2 className="animate-spin" /> 실행 중...</> : 'Run FIXED (동시)'}
          </Button>
          <Button
            variant="default"
            onClick={handleConcurrentBoth}
            disabled={concurrentBad.isLoading || concurrentFixed.isLoading}
          >
            Run Both
          </Button>
        </div>

        {(concurrentBad.error || concurrentFixed.error) && (
          <div className="text-sm text-destructive">
            {concurrentBad.error?.message ?? concurrentFixed.error?.message}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-4">
          {concurrentBad.data && <ConcurrentResult data={concurrentBad.data} />}
          {!concurrentBad.data && !concurrentBad.isLoading && (
            <div className="rounded-xl border border-rose-500/50 p-4 text-sm text-muted-foreground">
              BAD 동시 실행 결과가 여기에 표시됩니다.
            </div>
          )}
          {concurrentBad.isLoading && (
            <div className="rounded-xl border border-rose-500/50 p-4 flex items-center gap-2 text-muted-foreground">
              <Loader2 className="animate-spin size-4" /> BAD 실행 중...
            </div>
          )}

          {concurrentFixed.data && <ConcurrentResult data={concurrentFixed.data} />}
          {!concurrentFixed.data && !concurrentFixed.isLoading && (
            <div className="rounded-xl border border-emerald-500/50 p-4 text-sm text-muted-foreground">
              FIXED 동시 실행 결과가 여기에 표시됩니다.
            </div>
          )}
          {concurrentFixed.isLoading && (
            <div className="rounded-xl border border-emerald-500/50 p-4 flex items-center gap-2 text-muted-foreground">
              <Loader2 className="animate-spin size-4" /> FIXED 실행 중...
            </div>
          )}
        </div>
      </section>

      <ExplanationSection scenarioId={scenario.id} />
    </div>
  );
}
