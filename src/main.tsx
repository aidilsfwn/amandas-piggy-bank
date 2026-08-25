import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    const registrations = await navigator.serviceWorker.getRegistrations()
    await Promise.all(registrations.map((registration) => registration.unregister()))
    const cacheKeys = await caches.keys()
    await Promise.all(cacheKeys.filter((key) => key.startsWith('amanda-piggy-bank-')).map((key) => caches.delete(key)))
  })
}
