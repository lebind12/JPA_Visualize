import { Outlet } from 'react-router-dom'
import { TopNav } from '@/components/nav/top-nav'

/**
 * 랜딩 경로(`/`) 전용 레이아웃.
 * TopNav는 sticky로 두고 `<main>`을 스크롤 컨테이너로 잡아 CSS scroll-snap만 사용.
 * (Lenis는 custom wrapper에서 wheel 이벤트를 가로채 scroll-snap과 충돌하므로 제외.)
 * 랩 페이지는 그대로 `RootLayout`을 쓴다.
 */
export default function LandingLayout() {
  return (
    <div className="h-svh flex flex-col overflow-hidden">
      <TopNav />
      <main className="flex-1 overflow-y-auto snap-y snap-mandatory scroll-smooth">
        <Outlet />
      </main>
    </div>
  )
}
