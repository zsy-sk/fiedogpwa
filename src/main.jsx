import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

if ('serviceWorker' in navigator) {
  const isSecure = location.protocol === 'https:' || location.hostname === 'localhost'
  if (import.meta.env.PROD && isSecure) {
    window.addEventListener('load', () => {
      const swUrl = `${import.meta.env.BASE_URL || '/'}sw.js`
      navigator.serviceWorker.register(swUrl)
    })
  } else {
    navigator.serviceWorker.getRegistrations().then(rs => rs.forEach(r => r.unregister()))
  }
}
