import { useRunScenario } from '@/hooks/useRunScenario';
import type { ScenarioMeta } from '@/types/scenario';
import VariantRunner from '@/components/lab/variant-runner';
import MetricsCard from '@/components/lab/metrics-card';
import CompareBarChart from '@/components/lab/compare-bar-chart';
import SqlLogView from '@/components/lab/sql-log-view';
import { ExplanationSection } from '@/components/lab/explanation-section';
import { QueryPlayback } from '@/components/lab/query-playback';

interface ScenarioDetailProps {
  scenario: ScenarioMeta;
}

export default function ScenarioDetail({ scenario }: ScenarioDetailProps) {
  const bad = useRunScenario();
  const fixed = useRunScenario();

  const handleRunBad = () => bad.run(scenario.id, 'BAD');
  const handleRunFixed = () => fixed.run(scenario.id, 'FIXED');
  const handleRunBoth = () => {
    bad.run(scenario.id, 'BAD');
    fixed.run(scenario.id, 'FIXED');
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold">{scenario.title}</h2>
        <p className="text-sm text-muted-foreground mt-1">{scenario.summary}</p>
      </div>

      <VariantRunner
        onRunBad={handleRunBad}
        onRunFixed={handleRunFixed}
        onRunBoth={handleRunBoth}
        isBadLoading={bad.isLoading}
        isFixedLoading={fixed.isLoading}
      />

      <div className="grid md:grid-cols-2 gap-4">
        <MetricsCard
          title="BAD"
          tone="bad"
          data={bad.data}
          isLoading={bad.isLoading}
          error={bad.error}
          onRetry={handleRunBad}
        />
        <MetricsCard
          title="FIXED"
          tone="fixed"
          data={fixed.data}
          isLoading={fixed.isLoading}
          error={fixed.error}
          onRetry={handleRunFixed}
        />
      </div>

      <CompareBarChart bad={bad.data} fixed={fixed.data} />

      <div className="grid md:grid-cols-2 gap-4">
        <SqlLogView title="BAD"   tone="bad"   data={bad.data} />
        <SqlLogView title="FIXED" tone="fixed" data={fixed.data} />
      </div>

      <div className="flex flex-col gap-4">
        <header className="flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Playback</span>
          <h3 className="text-lg font-semibold">쿼리 이동 시각화 (도메인 위로 재생)</h3>
          <p className="text-xs text-muted-foreground">
            실행된 SQL을 순서대로 재생하면서 해당 테이블을 펄스, 연관 엣지를 따라 패킷이 흐릅니다.
            Bad는 쿼리 수가 많아 오래 흐르고, Fixed는 1~3번만에 끝납니다.
          </p>
        </header>
        <div className="grid md:grid-cols-2 gap-4">
          <QueryPlayback sqlLog={bad.data?.sqlLog} label="BAD" tone="bad" />
          <QueryPlayback sqlLog={fixed.data?.sqlLog} label="FIXED" tone="fixed" />
        </div>
      </div>

      <ExplanationSection scenarioId={scenario.id} />
    </div>
  );
}
