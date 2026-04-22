import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export function HeroSection() {
  return (
    <section className="min-h-[calc(100svh-3rem)] snap-start snap-always flex items-center justify-center px-6 bg-gradient-to-b from-background via-background to-muted/30">
      <div className="max-w-3xl text-center flex flex-col items-center gap-6">
        <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          JPA Portfolio · E-commerce
        </span>
        <h1 className="text-4xl md:text-6xl font-semibold tracking-tight">
          JPA의 함정을 직접 돌려보고,
          <br />
          <span className="bg-gradient-to-r from-emerald-500 to-sky-500 bg-clip-text text-transparent">
            눈으로 확인하세요.
          </span>
        </h1>
        <p className="text-base md:text-lg text-muted-foreground max-w-2xl">
          N+1, 락, 트랜잭션, 영속성 컨텍스트 — 면접 단골 주제를
          <span className="mx-1 font-semibold text-rose-500">Bad</span>와
          <span className="mx-1 font-semibold text-emerald-500">Fixed</span>로 나란히 재현해
          쿼리 수·실행시간·실제 SQL을 비교합니다.
        </p>
        <div className="flex items-center gap-3 mt-2">
          <Button asChild size="lg">
            <Link to="/lab/n-plus-one">Lab 시작하기</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <a href="https://github.com/lebind12/JPA_Visualize" target="_blank" rel="noreferrer">
              GitHub
            </a>
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-8 animate-pulse">
          아래로 스크롤해서 도메인 구조를 확인하세요 ↓
        </p>
      </div>
    </section>
  )
}
