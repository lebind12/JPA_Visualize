import { useRunScenario } from '@/hooks/useRunScenario';
import type { ScenarioMeta } from '@/types/scenario';
import VariantRunner from '@/components/lab/variant-runner';
import MetricsCard from '@/components/lab/metrics-card';
import CompareBarChart from '@/components/lab/compare-bar-chart';
import SqlLogView from '@/components/lab/sql-log-view';

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
    </div>
  );
}
