import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { ScenarioRunResponse } from '@/types/scenario';

interface CompareBarChartProps {
  bad: ScenarioRunResponse | null;
  fixed: ScenarioRunResponse | null;
}

const COLORS: Record<string, string> = {
  BAD: '#f43f5e',
  FIXED: '#10b981',
};

export default function CompareBarChart({ bad, fixed }: CompareBarChartProps) {
  const rows: { label: string; elapsedMs: number; queryCount: number }[] = [];
  if (bad) rows.push({ label: 'BAD', elapsedMs: bad.elapsedMs, queryCount: bad.queryCount });
  if (fixed) rows.push({ label: 'FIXED', elapsedMs: fixed.elapsedMs, queryCount: fixed.queryCount });

  if (rows.length === 0) {
    return (
      <div className="flex items-center justify-center h-50 text-sm text-muted-foreground">
        실행 버튼을 눌러 비교를 시작하세요
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium">실행시간 비교 (ms)</span>
        {bad && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600">
            BAD: {bad.queryCount} queries
          </span>
        )}
        {fixed && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600">
            FIXED: {fixed.queryCount} queries
          </span>
        )}
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <BarChart layout="vertical" data={rows} margin={{ top: 4, right: 24, left: 8, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <YAxis dataKey="label" type="category" width={48} tick={{ fontSize: 12 }} />
          <XAxis type="number" tick={{ fontSize: 12 }} />
          <Tooltip formatter={(value) => [`${value} ms`, '실행시간']} />
          <Bar dataKey="elapsedMs" radius={[0, 4, 4, 0]}>
            {rows.map((row) => (
              <Cell key={row.label} fill={COLORS[row.label]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
