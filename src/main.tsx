import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AppRouter } from './app/AppRouter'
import { AppProviders } from './app/providers'
import './styles/index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProviders>
      <AppRouter />
    </AppProviders>
  </StrictMode>,
)
