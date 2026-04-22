import { useSearchParams } from 'react-router-dom';
import type { ScenarioMeta } from '@/types/scenario';

interface ScenarioSidebarProps {
  scenarios: ScenarioMeta[];
}

const DIFFICULTY_LABEL: Record<ScenarioMeta['difficulty'], string> = {
  EASY: '쉬움',
  MEDIUM: '보통',
  HARD: '어려움',
};

const DIFFICULTY_CLASS: Record<ScenarioMeta['difficulty'], string> = {
  EASY: 'bg-green-100 text-green-800',
  MEDIUM: 'bg-yellow-100 text-yellow-800',
  HARD: 'bg-red-100 text-red-800',
};

export default function ScenarioSidebar({ scenarios }: ScenarioSidebarProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = searchParams.get('s');

  if (scenarios.length === 0) {
    return (
      <aside className="w-64 shrink-0 border-r pr-4 text-sm text-muted-foreground">
        이 카테고리에 등록된 시나리오가 없습니다.
      </aside>
    );
  }

  return (
    <aside className="w-64 shrink-0 border-r pr-4 flex flex-col gap-2">
      {scenarios.map((scenario) => {
        const isSelected = selectedId === scenario.id;
        return (
          <button
            key={scenario.id}
            type="button"
            onClick={() => setSearchParams({ s: scenario.id })}
            className={[
              'w-full text-left rounded-lg px-3 py-2 transition-colors',
              isSelected
                ? 'bg-accent text-accent-foreground'
                : 'hover:bg-accent/50',
            ].join(' ')}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium text-sm truncate">{scenario.title}</span>
              <span
                className={[
                  'shrink-0 rounded px-1.5 py-0.5 text-xs font-medium',
                  DIFFICULTY_CLASS[scenario.difficulty],
                ].join(' ')}
              >
                {DIFFICULTY_LABEL[scenario.difficulty]}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground truncate">{scenario.summary}</p>
          </button>
        );
      })}
    </aside>
  );
}
