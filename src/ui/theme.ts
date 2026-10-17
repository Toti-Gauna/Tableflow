import { useEffect, useSyncExternalStore } from 'react'
import type { ThemePref } from '../domain/persistence'

// P5-L3 · Tema claro/oscuro: la preferencia manual se guarda; "sistema" sigue a prefers-color-scheme en vivo.
const MQ = '(prefers-color-scheme: dark)'
export type Theme = 'light' | 'dark'

const media = () => (typeof window !== 'undefined' && typeof window.matchMedia === 'function' ? window.matchMedia(MQ) : null)
export const systemPrefersDark = () => media()?.matches ?? false
export const resolveTheme = (pref: ThemePref, sysDark: boolean): Theme => (pref === 'system' ? (sysDark ? 'dark' : 'light') : pref)

/** Aplica el tema al documento antes del primer render (evita el destello claro en modo oscuro). */
export function applyTheme(theme: Theme) {
  const root = document.documentElement
  root.dataset.theme = theme
  root.style.colorScheme = theme
}

function subscribeSystem(cb: () => void) {
  const m = media()
  if (!m) return () => {}
  m.addEventListener('change', cb)
  return () => m.removeEventListener('change', cb)
}

/** Tema efectivo según la preferencia; se actualiza si cambia la del sistema. */
export function useTheme(pref: ThemePref): Theme {
  const sysDark = useSyncExternalStore(subscribeSystem, systemPrefersDark, () => false)
  const theme = resolveTheme(pref, sysDark)
  useEffect(() => applyTheme(theme), [theme])
  return theme
}

export const THEME_LABEL: Record<ThemePref, string> = { system: 'Sistema', light: 'Claro', dark: 'Oscuro' }
