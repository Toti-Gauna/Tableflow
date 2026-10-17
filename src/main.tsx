import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Fraunces con todos sus ejes (opsz, wght, SOFT, WONK) en redonda e itálica; Manrope para la interfaz.
// Ambas OFL, servidas desde el propio build (sin CDN).
import '@fontsource-variable/fraunces/full.css'
import '@fontsource-variable/fraunces/full-italic.css'
import '@fontsource-variable/manrope'
import './styles.css'
import { App } from './App'
import { initStore } from './store'
import { initSfx } from './ui/sfx'

initStore()
initSfx()
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
