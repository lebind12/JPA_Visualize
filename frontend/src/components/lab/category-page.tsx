import { useParams, useSearchParams } from 'react-router-dom';
import { useScenarios } from '@/hooks/useScenarios';
import ScenarioSidebar from '@/components/lab/scenario-sidebar';
import ScenarioDetail from '@/components/lab/scenario-detail';

export default function CategoryPage() {
  const { category } = useParams<{ category: string }>();
  const { data: allScenarios, isLoading, error } = useScenarios();
  const [searchParams] = useSearchParams();
  const selectedId = searchParams.get('s');

  const scenarios = allScenarios.filter((s) => s.category === category);

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
    rightContent = <ScenarioDetail scenario={selectedScenario} key={selectedScenario.id} />;
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
