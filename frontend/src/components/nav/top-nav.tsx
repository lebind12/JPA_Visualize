import { Link, NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/nav/theme-toggle'

const navItems = [
  { label: 'Home', to: '/', end: true },
  { label: 'N+1', to: '/lab/n-plus-one' },
  { label: 'Lock', to: '/lab/lock' },
  { label: 'Transaction', to: '/lab/transaction' },
  { label: 'Persistence', to: '/lab/persistence' },
  { label: 'Concurrency', to: '/lab/concurrency' },
] as const

export function TopNav() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-6xl px-4 flex h-12 items-center gap-4">
        {/* 좌: 로고 */}
        <Link to="/" className="font-semibold text-foreground shrink-0">
          JPA Lab
        </Link>

        {/* 중: 탭 */}
        <nav className="flex items-center gap-1 flex-1 overflow-x-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={'end' in item ? item.end : false}
              className={({ isActive }) =>
                cn(
                  'px-2.5 py-1 rounded text-sm transition-colors whitespace-nowrap',
                  isActive
                    ? 'text-foreground font-medium'
                    : 'text-muted-foreground hover:text-foreground',
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* 우: 테마 토글 + GitHub */}
        <div className="flex items-center gap-1 shrink-0">
          <ThemeToggle />
          <Button variant="ghost" size="icon-sm" asChild>
            <a href="#" aria-label="GitHub">
              GH
            </a>
          </Button>
        </div>
      </div>
    </header>
  )
}
