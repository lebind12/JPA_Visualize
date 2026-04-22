import { lazy, Suspense, type ComponentType } from 'react'

type MdxModule = { default: ComponentType<Record<string, unknown>> }
type MdxLoader = () => Promise<MdxModule>

const mdxModules = import.meta.glob('/src/content/scenarios/*.mdx') as Record<string, MdxLoader>

// 모듈 레벨에서 모든 MDX를 lazy로 미리 등록 — 렌더 중 lazy() 호출 금지 규칙 준수
const lazyMdxMap: Record<string, ComponentType> = Object.fromEntries(
  Object.entries(mdxModules).map(([path, loader]) => {
    // path 예: /src/content/scenarios/nplus1.order-list.mdx
    const match = path.match(/\/([^/]+)\.mdx$/)
    const id = match ? match[1] : path
    return [id, lazy(loader as MdxLoader) as unknown as ComponentType]
  }),
)

interface ExplanationSectionProps {
  scenarioId: string
}

export function ExplanationSection({ scenarioId }: ExplanationSectionProps) {
  const MDXComponent: ComponentType | undefined = lazyMdxMap[scenarioId]

  if (!MDXComponent) {
    return null
  }

  return (
    <section
      aria-label="시나리오 해설"
      className="mt-4 rounded-xl border bg-card px-6 py-6 shadow-sm"
    >
      <header className="mb-4 flex items-center gap-2">
        <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Explanation</span>
        <span className="text-xs text-muted-foreground">왜 이런 결과가 나오는가</span>
      </header>
      <Suspense
        fallback={
          <div className="h-40 rounded-lg border border-dashed bg-muted/30 animate-pulse" aria-hidden />
        }
      >
        <article className="prose prose-sm md:prose-base dark:prose-invert max-w-none prose-headings:scroll-mt-16 prose-pre:rounded-md prose-pre:bg-muted">
          <MDXComponent />
        </article>
      </Suspense>
    </section>
  )
}
