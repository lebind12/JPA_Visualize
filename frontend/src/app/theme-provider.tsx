import { useLayoutEffect, useState } from 'react'
import { ThemeContext } from '@/app/theme-context'
import type { ThemeContextValue } from '@/app/theme-context'

type Theme = 'dark' | 'light'

function getInitialTheme(): Theme {
  const stored = localStorage.getItem('jpa-lab-theme')
  if (stored === 'dark' || stored === 'light') return stored
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark'
  return 'dark'
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme)

  useLayoutEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    localStorage.setItem('jpa-lab-theme', theme)
  }, [theme])

  const setTheme = (next: Theme) => {
    setThemeState(next)
  }

  const toggle = () => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }

  const value: ThemeContextValue = { theme, toggle, setTheme }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}
