import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Fraunces con todos sus ejes (opsz, wght, SOFT, WONK) en redonda e itálica; Manrope para la interfaz.
// Ambas OFL, servidas desde el propio build (sin CDN).
import '@fontsource-variable/fraunces/full.css'
import '@fontsource-variable/fraunces/full-italic.css'
import '@fontsource-variable/manrope'
// P5-L3: tipografías de las identidades de Ritual Café (confitería notable) y Mesa Clara (bodegón).
// @font-face solo descarga el archivo cuando una pantalla usa la familia.
import '@fontsource-variable/bodoni-moda/opsz.css'
import '@fontsource-variable/eb-garamond/wght.css'
import '@fontsource-variable/eb-garamond/wght-italic.css'
import '@fontsource/pinyon-script/latin-400.css'
import '@fontsource/ultra/latin-400.css'
import '@fontsource-variable/bitter/wght.css'
import '@fontsource-variable/bitter/wght-italic.css'
import '@fontsource/caveat-brush/latin-400.css'
// P5-L5: Copo (Nunito), Taberna Compás (Archivo con ancho variable e Instrument Serif) y Brasa Rápida (Fredoka).
import '@fontsource-variable/nunito/wght.css'
import '@fontsource-variable/archivo/wdth.css'
import '@fontsource/instrument-serif/latin-400-italic.css'
import '@fontsource-variable/fredoka/wght.css'
import './styles.css'
import { App } from './App'
import { getSnapshot, initStore } from './store'
import { initSfx } from './ui/sfx'
import { applyTheme, resolveTheme, systemPrefersDark } from './ui/theme'

initStore()
applyTheme(resolveTheme(getSnapshot().prefs.theme, systemPrefersDark()))
initSfx()
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
