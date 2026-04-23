import { Link } from 'react-router-dom'
import { useScenarios } from '@/hooks/useScenarios'

interface CategoryCard {
  to: string
  label: string
  title: string
  summary: string
  difficulty: string
  apiCategory: 'n-plus-one' | 'lock' | 'transaction' | 'persistence'
}

const CATEGORIES: CategoryCard[] = [
  {
    to: '/lab/n-plus-one',
    label: 'N+1',
    title: 'N+1 / 페치 전략',
    summary: 'LAZY 반복 접근으로 터지는 쿼리 폭발. fetch join · @EntityGraph · @BatchSize로 수렴.',
    difficulty: 'MEDIUM ~ HARD',
    apiCategory: 'n-plus-one',
  },
  {
    to: '/lab/lock',
    label: 'Lock',
    title: '락 / 동시성',
    summary: '잃어버린 갱신·데드락을 실제 동시 호출로 재현. @Version · PESSIMISTIC_WRITE · 자원 순서.',
    difficulty: 'HARD',
    apiCategory: 'lock',
  },
  {
    to: '/lab/transaction',
    label: 'TX',
    title: '@Transactional 함정',
    summary: 'self-invocation · readOnly · 전파 — 프록시 동작을 이해하지 못하면 벌어지는 일.',
    difficulty: 'MEDIUM',
    apiCategory: 'transaction',
  },
  {
    to: '/lab/persistence',
    label: 'Persist',
    title: '영속성 컨텍스트 / OSIV',
    summary: 'LazyInitializationException · dirty checking · OSIV 토글의 숨은 N+1.',
    difficulty: 'MEDIUM',
    apiCategory: 'persistence',
  },
]

export function DemoSection() {
  const { data: scenarios } = useScenarios()
  const visibleScenarios = scenarios?.filter(s => CATEGORIES.some(c => c.apiCategory === s.category))

  return (
    <section className="min-h-[calc(100svh-3rem)] snap-start snap-always flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-6xl flex flex-col gap-6">
        <header className="flex flex-col items-start gap-2">
          <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">02 / Demo</span>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">
            {CATEGORIES.length}개 카테고리 · {visibleScenarios?.length ?? '—'} 시나리오
          </h2>
          <p className="text-sm md:text-base text-muted-foreground max-w-2xl">
            각 시나리오는 Bad · Fixed 두 버튼으로 실행합니다. 쿼리 수 · 실행시간 · 실제 SQL을 나란히 비교하고,
            그 아래 "왜 이런 결과가 나오는가" 해설을 붙입니다.
          </p>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.to}
              to={cat.to}
              className="group rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-2">
                  <span className="font-mono text-xs text-muted-foreground">{cat.label}</span>
                  <h3 className="text-xl font-semibold tracking-tight group-hover:text-emerald-600 transition-colors">
                    {cat.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">{cat.summary}</p>
                </div>
                <span
                  aria-hidden
                  className="text-muted-foreground/60 group-hover:text-foreground group-hover:translate-x-1 transition-all"
                >
                  →
                </span>
              </div>
              <div className="flex items-center gap-2 mt-4 text-xs">
                <span className="rounded-full border px-2 py-0.5 font-mono text-muted-foreground">
                  {scenarios ? `${scenarios.filter(s => s.category === cat.apiCategory).length} 시나리오` : '—'}
                </span>
                <span className="rounded-full border px-2 py-0.5 font-mono text-muted-foreground">{cat.difficulty}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
