import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AppRouter } from './app/AppRouter'
import { AppProviders } from './app/providers'
import './styles/index.css'

/** Dev: kill leftover Workbox SWs that pin old bundles and break HMR / AuthProvider. */
async function clearDevServiceWorkers() {
  if (!import.meta.env.DEV || !('serviceWorker' in navigator)) return
  const regs = await navigator.serviceWorker.getRegistrations()
  await Promise.all(regs.map((r) => r.unregister()))
  if ('caches' in window) {
    const keys = await caches.keys()
    await Promise.all(keys.map((k) => caches.delete(k)))
  }
}

void clearDevServiceWorkers().finally(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <AppProviders>
        <AppRouter />
      </AppProviders>
    </StrictMode>,
  )
})
