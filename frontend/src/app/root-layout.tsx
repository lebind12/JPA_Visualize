import { Outlet } from 'react-router-dom'
import { TopNav } from '@/components/nav/top-nav'

export default function RootLayout() {
  return (
    <div className="min-h-svh flex flex-col">
      <TopNav />
      <main className="mx-auto max-w-6xl px-4 py-6 w-full">
        <Outlet />
      </main>
    </div>
  )
}
