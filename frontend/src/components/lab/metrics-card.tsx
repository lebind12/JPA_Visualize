import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ScenarioRunResponse } from '@/types/scenario';

interface MetricsCardProps {
  title: 'BAD' | 'FIXED';
  tone: 'bad' | 'fixed';
  data: ScenarioRunResponse | null;
  isLoading: boolean;
  error: Error | null;
  onRetry: () => void;
}

export default function MetricsCard({
  title,
  tone,
  data,
  isLoading,
  error,
  onRetry,
}: MetricsCardProps) {
  const isBad = tone === 'bad';

  const borderClass = isBad ? 'border-rose-500/50' : 'border-emerald-500/50';
  const badgeClass = isBad
    ? 'bg-rose-500/10 text-rose-600'
    : 'bg-emerald-500/10 text-emerald-600';

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/50 p-4 flex flex-col gap-2">
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-destructive/10 text-destructive self-start">
          {title}
        </span>
        <p className="text-sm text-destructive">{error.message}</p>
        <Button variant="destructive" size="sm" onClick={onRetry} className="self-start">
          Retry
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={cn('rounded-xl border p-4 flex flex-col gap-2', borderClass)}>
        <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full self-start', badgeClass)}>
          {title}
        </span>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="animate-spin size-4" />
          <span className="text-3xl font-bold">--</span>
          <span className="text-sm">ms</span>
        </div>
        <span className="text-lg text-muted-foreground">-- queries</span>
      </div>
    );
  }

  if (data) {
    return (
      <div className={cn('rounded-xl border p-4 flex flex-col gap-2', borderClass)}>
        <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full self-start', badgeClass)}>
          {title}
        </span>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold">{data.elapsedMs}</span>
          <span className="text-sm text-muted-foreground">ms</span>
        </div>
        <span className="text-lg text-muted-foreground">{data.queryCount} queries</span>
      </div>
    );
  }

  return (
    <div className={cn('rounded-xl border p-4 flex flex-col gap-2', borderClass)}>
      <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full self-start', badgeClass)}>
        {title}
      </span>
      <span className="text-3xl font-bold text-muted-foreground">--</span>
      <span className="text-sm text-muted-foreground">아직 실행되지 않음</span>
    </div>
  );
}
