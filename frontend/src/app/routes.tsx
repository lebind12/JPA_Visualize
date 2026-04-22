import { Link, Route, Routes } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import RootLayout from '@/app/root-layout'
import CategoryPage from '@/components/lab/category-page'
import ScenarioDetail from '@/components/lab/scenario-detail'
import { useScenarios } from '@/hooks/useScenarios'

function LandingHelloDemo() {
  const { data, isLoading, error } = useScenarios()
  if (isLoading || error) return null
  const hello = data.find((s) => s.id === 'hello')
  if (!hello) return null
  return (
    <section className="mx-auto w-full max-w-5xl px-4 flex flex-col gap-4">
      <header>
        <h2 className="text-2xl font-semibold tracking-tight">프레임워크 데모</h2>
        <p className="text-sm text-muted-foreground mt-1">
          이 섹션은 실제 시나리오가 아니라, Bad/Fixed 측정·SQL 로그 시각화 파이프라인을 검증하는 hello 더미입니다.
        </p>
      </header>
      <ScenarioDetail scenario={hello} />
    </section>
  )
}

function LandingPlaceholder() {
  return (
    <div className="flex flex-col gap-12 py-12">
      <section className="flex flex-col items-center justify-center gap-6 text-center">
        <h1 className="text-4xl font-semibold tracking-tight">JPA Lab</h1>
        <p className="text-muted-foreground max-w-md">
          Spring Data JPA 쿼리 실험실 — N+1, 잠금, 트랜잭션, 영속성, 동시성 시나리오를 직접 비교합니다.
        </p>
        <Button asChild>
          <Link to="/lab/n-plus-one">Lab 시작</Link>
        </Button>
      </section>
      <LandingHelloDemo />
    </div>
  )
}

function ConcurrencyPlaceholder() {
  return (
    <div className="py-16 text-center text-muted-foreground">
      카테고리: concurrency (준비 중)
    </div>
  )
}

function NotFoundPlaceholder() {
  return (
    <div className="py-16 text-center text-muted-foreground">
      404 — 페이지를 찾을 수 없습니다.
    </div>
  )
}

export default function RouterRoot() {
  return (
    <Routes>
      <Route element={<RootLayout />}>
        <Route index element={<LandingPlaceholder />} />
        <Route path="lab/concurrency" element={<ConcurrencyPlaceholder />} />
        <Route path="lab/:category" element={<CategoryPage />} />
        <Route path="*" element={<NotFoundPlaceholder />} />
      </Route>
    </Routes>
  )
}
