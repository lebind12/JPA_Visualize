import { Sun, Moon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/app/use-theme'

export function ThemeToggle() {
  const { theme, toggle } = useTheme()

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={toggle}
      aria-label="테마 전환"
    >
      {theme === 'dark' ? <Sun /> : <Moon />}
    </Button>
  )
}
