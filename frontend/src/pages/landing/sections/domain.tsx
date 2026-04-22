import { DomainDiagram } from '@/components/domain/domain-diagram'

export function DomainSection() {
  return (
    <section className="min-h-[calc(100svh-3rem)] snap-start snap-always flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-6xl flex flex-col gap-5">
        <header className="flex flex-col items-start gap-2">
          <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">01 / Domain</span>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">E-commerce 도메인</h2>
          <p className="text-sm md:text-base text-muted-foreground max-w-2xl">
            6개 엔티티 · 7개 연관관계. 모든 연관은 <span className="font-mono">LAZY</span>로 잡혀 있어 N+1·페치 전략 실험에 적합한 구조입니다.
            노드를 드래그해 레이아웃을 움직여 볼 수 있습니다.
          </p>
        </header>
        <DomainDiagram height="540px" />
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground font-mono">
          <span className="inline-flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full bg-muted-foreground/60" />
            엔티티
          </span>
          <span>●PK</span>
          <span>◆FK</span>
          <span>○일반 필드</span>
          <span className="inline-flex items-center gap-1">
            <span className="inline-block w-6 h-0.5 bg-slate-500" />
            관계 (fetch 전략 라벨 참조)
          </span>
        </div>
      </div>
    </section>
  )
}
