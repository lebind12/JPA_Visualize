const STACK = [
  { group: 'Backend', items: ['Spring Boot 3.5', 'Java 21', 'Spring Data JPA', 'Hibernate 6', 'Lombok', 'AOP'] },
  { group: 'Frontend', items: ['React 19', 'Vite', 'TypeScript', 'Tailwind v4', 'shadcn/ui', 'Recharts', 'react-flow'] },
  { group: 'Infra', items: ['MySQL 8.4 (Docker 23306)', 'Testcontainers-MySQL', 'Gradle · DevTools'] },
]

export function StackFooterSection() {
  return (
    <section className="min-h-[calc(100svh-3rem)] snap-start snap-always flex flex-col items-center justify-between px-6 py-12 bg-muted/20">
      <div className="w-full max-w-6xl flex-1 flex flex-col justify-center gap-8">
        <header className="flex flex-col items-start gap-2">
          <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">03 / Stack</span>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">기술 스택</h2>
          <p className="text-sm md:text-base text-muted-foreground">
            의도적으로 면접 단골 주제를 풍부히 다룰 수 있는 스택으로 구성했습니다.
          </p>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {STACK.map((g) => (
            <div key={g.group} className="flex flex-col gap-2">
              <span className="font-mono text-xs text-muted-foreground">{g.group}</span>
              <div className="flex flex-wrap gap-1.5">
                {g.items.map((item) => (
                  <span key={item} className="rounded-full border bg-card px-2.5 py-0.5 text-xs font-mono">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <footer className="w-full max-w-6xl pt-8 mt-8 border-t flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
        <span>© 2026 JPA Portfolio · Lebind</span>
        <div className="flex items-center gap-4">
          <a
            href="https://github.com/lebind12/JPA_Visualize"
            target="_blank"
            rel="noreferrer"
            className="hover:text-foreground transition-colors"
          >
            GitHub
          </a>
          <span>MIT License</span>
        </div>
      </footer>
    </section>
  )
}
