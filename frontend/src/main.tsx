import './assets/main.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

const bootstrap = async (): Promise<void> => {
  // Solo redirigir si se carga desde el protocolo local file:// (empaquetado en Electron)
  if (window.location.protocol === 'file:') {
    let savedUrl = localStorage.getItem('API_BASE_URL')
    if (savedUrl && savedUrl.includes('sistema-pedidos-api.onrender.com')) {
      localStorage.removeItem('API_BASE_URL')
      savedUrl = null
    }
    if (savedUrl) {
      // Extrae "http://100.95.26.124:3000" quitando "/api"
      const serverBase = savedUrl.replace('/api', '')
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 1500) // Timeout rápido de 1.5s
        
        const res = await fetch(`${serverBase}/health`, { signal: controller.signal })
        clearTimeout(timeoutId)
        
        if (res.ok) {
          console.log(`[Bootstrap] Servidor Master online. Redirigiendo a: ${serverBase}/`)
          window.location.href = `${serverBase}/`
          return
        }
      } catch (e) {
        console.warn('[Bootstrap] Servidor desconectado o inaccesible. Cargando copia local.', e)
      }
    }
  }

  // Inicializar copia local si el Master está desconectado o si la URL no es válida
  const rootElement = document.getElementById('root')
  if (rootElement) {
    createRoot(rootElement).render(
      <StrictMode>
        <App />
      </StrictMode>
    )
  }
}

bootstrap()
