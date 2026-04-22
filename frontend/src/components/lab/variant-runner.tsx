import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VariantRunnerProps {
  onRunBad: () => void;
  onRunFixed: () => void;
  onRunBoth: () => void;
  isBadLoading: boolean;
  isFixedLoading: boolean;
}

export default function VariantRunner({
  onRunBad,
  onRunFixed,
  onRunBoth,
  isBadLoading,
  isFixedLoading,
}: VariantRunnerProps) {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        className="border-rose-500/50 text-rose-600 hover:bg-rose-500/10 hover:text-rose-600"
        onClick={onRunBad}
        disabled={isBadLoading}
      >
        {isBadLoading ? (
          <>
            <Loader2 className="animate-spin" />
            실행 중...
          </>
        ) : (
          'Run BAD'
        )}
      </Button>

      <Button
        variant="outline"
        className="border-emerald-500/50 text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-600"
        onClick={onRunFixed}
        disabled={isFixedLoading}
      >
        {isFixedLoading ? (
          <>
            <Loader2 className="animate-spin" />
            실행 중...
          </>
        ) : (
          'Run FIXED'
        )}
      </Button>

      <Button
        variant="default"
        onClick={onRunBoth}
        disabled={isBadLoading || isFixedLoading}
      >
        Run Both
      </Button>
    </div>
  );
}
