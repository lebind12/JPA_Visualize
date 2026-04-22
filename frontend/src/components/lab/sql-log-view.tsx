import type { ScenarioRunResponse } from '@/types/scenario';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { beautifySql } from '@/lib/sql-format';

interface SqlLogViewProps {
  title: 'BAD' | 'FIXED';
  tone: 'bad' | 'fixed';
  data: ScenarioRunResponse | null;
}

export default function SqlLogView({ title, tone, data }: SqlLogViewProps) {
  const borderClass =
    tone === 'bad' ? 'border-rose-500/50' : 'border-emerald-500/50';
  const badgeClass =
    tone === 'bad'
      ? 'bg-rose-500/10 text-rose-600'
      : 'bg-emerald-500/10 text-emerald-600';

  const summary =
    data != null
      ? `${data.queryCount} queries · ${data.elapsedMs}ms`
      : '-- queries · --ms';

  return (
    <div className={`rounded-xl border ${borderClass}`}>
      <Accordion type="single" collapsible>
        <AccordionItem value="sql-log">
          <AccordionTrigger className="px-4">
            <span className="flex flex-1 items-center justify-between pr-2">
              <span className={`rounded px-2 py-0.5 text-xs font-semibold ${badgeClass}`}>
                {title}
              </span>
              <span className="text-sm text-muted-foreground tabular-nums">
                {summary}
              </span>
            </span>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            {data == null ? (
              <p className="text-sm text-muted-foreground">아직 실행되지 않음</p>
            ) : data.sqlLog.length === 0 ? (
              <p className="text-sm text-muted-foreground">SQL이 기록되지 않았습니다</p>
            ) : (
              <ol
                className="flex flex-col gap-2 list-decimal list-inside tabular-nums text-xs overflow-y-auto pr-1"
                style={{ maxHeight: '28rem' }}
              >
                {data.sqlLog.map((sql, i) => (
                  <li key={i} className="text-muted-foreground">
                    <pre
                      className="mt-1 overflow-auto whitespace-pre font-mono text-xs leading-5 text-foreground bg-muted/40 rounded-md p-2"
                      style={{ height: '4.25rem' }}
                    >
                      {beautifySql(sql)}
                    </pre>
                  </li>
                ))}
              </ol>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
