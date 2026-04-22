import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import { ThemeProvider } from '@/app/theme-provider'
import RouterRoot from '@/app/routes'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <RouterRoot />
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
)
