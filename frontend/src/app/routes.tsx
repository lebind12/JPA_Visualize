import { Route, Routes } from 'react-router-dom'
import RootLayout from '@/app/root-layout'
import LandingLayout from '@/app/landing-layout'
import LandingPage from '@/pages/landing'
import CategoryPage from '@/components/lab/category-page'
import LockCategoryPage from '@/components/lab/lock-category-page'

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
      <Route element={<LandingLayout />}>
        <Route index element={<LandingPage />} />
      </Route>
      <Route element={<RootLayout />}>
        <Route path="lab/concurrency" element={<ConcurrencyPlaceholder />} />
        <Route path="lab/lock" element={<LockCategoryPage />} />
        <Route path="lab/:category" element={<CategoryPage />} />
        <Route path="*" element={<NotFoundPlaceholder />} />
      </Route>
    </Routes>
  )
}
