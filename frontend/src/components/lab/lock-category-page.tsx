import { useSearchParams } from 'react-router-dom';
import { useScenarios } from '@/hooks/useScenarios';
import ScenarioSidebar from '@/components/lab/scenario-sidebar';
import ScenarioDetail from '@/components/lab/scenario-detail';
import OptimisticStockDetail from '@/components/lab/optimistic-stock-detail';
import PessimisticStockDetail from '@/components/lab/pessimistic-stock-detail';
import DeadlockDetail from '@/components/lab/deadlock-detail';

const OPTIMISTIC_STOCK_ID = 'lock.optimistic-stock';
const PESSIMISTIC_STOCK_ID = 'lock.pessimistic-stock';
const DEADLOCK_ID = 'lock.deadlock';

export default function LockCategoryPage() {
  const { data: allScenarios, isLoading, error } = useScenarios();
  const [searchParams] = useSearchParams();
  const selectedId = searchParams.get('s');

  const scenarios = allScenarios.filter((s) => s.category === 'lock');

  if (isLoading) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        시나리오 목록을 불러오는 중...
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-16 text-center text-destructive">
        시나리오 목록을 불러오지 못했습니다: {error.message}
      </div>
    );
  }

  const selectedScenario = selectedId
    ? scenarios.find((s) => s.id === selectedId)
    : null;

  let rightContent: React.ReactNode;
  if (!selectedId) {
    rightContent = (
      <p className="text-muted-foreground">좌측에서 시나리오를 선택하세요.</p>
    );
  } else if (selectedScenario) {
    if (selectedScenario.id === OPTIMISTIC_STOCK_ID) {
      rightContent = (
        <OptimisticStockDetail scenario={selectedScenario} key={selectedScenario.id} />
      );
    } else if (selectedScenario.id === PESSIMISTIC_STOCK_ID) {
      rightContent = (
        <PessimisticStockDetail scenario={selectedScenario} key={selectedScenario.id} />
      );
    } else if (selectedScenario.id === DEADLOCK_ID) {
      rightContent = (
        <DeadlockDetail scenario={selectedScenario} key={selectedScenario.id} />
      );
    } else {
      rightContent = <ScenarioDetail scenario={selectedScenario} key={selectedScenario.id} />;
    }
  } else {
    rightContent = (
      <p className="text-muted-foreground">선택된 시나리오를 찾을 수 없습니다.</p>
    );
  }

  return (
    <div className="flex gap-6">
      <ScenarioSidebar scenarios={scenarios} />
      <section className="flex-1 py-2">{rightContent}</section>
    </div>
  );
}
