import { lazy, Suspense, useMemo, type ComponentType } from 'react'

type MdxModule = { default: ComponentType<Record<string, unknown>> }
type MdxLoader = () => Promise<MdxModule>

const mdxModules = import.meta.glob('/src/content/scenarios/*.mdx') as Record<string, MdxLoader>

function resolveMdx(scenarioId: string): ComponentType | null {
  const path = `/src/content/scenarios/${scenarioId}.mdx`
  const loader = mdxModules[path]
  if (!loader) return null
  return lazy(loader) as unknown as ComponentType
}

interface ExplanationSectionProps {
  scenarioId: string
}

export function ExplanationSection({ scenarioId }: ExplanationSectionProps) {
  const MDXComponent = useMemo(() => resolveMdx(scenarioId), [scenarioId])

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
