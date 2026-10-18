import { lazy, Suspense, useRef, useSyncExternalStore } from 'react'
import { useLocation } from 'react-router-dom'
import { getSnapshot } from '../store'

// el cierre (con el tarifario) se descarga recién la primera vez que alguien lo abre
const EclipseClose = lazy(() => import('./Eclipse').then((m) => ({ default: m.EclipseClose })))

// Quién pide abrir el cierre Eclipse: un botón ("Adaptarlo a mi negocio") o el final de la guía.
let open = false
const ls = new Set<() => void>()
const emit = () => ls.forEach((l) => l())
/** `auto`: lo pide el final de la guía; no se abre si la persona ya lo cerró ni en medio de un pedido. */
export function openEclipse(reason: 'boton' | 'auto', pathname = '') {
  if (reason === 'auto' && (getSnapshot().prefs.eclipseDismissed || isCheckout(pathname))) return false
  open = true
  emit()
  return true
}
const isCheckout = (p: string) => /\/(pedido|regalar|reservar)(\/|$)/.test(p)
export function EclipseHost() {
  const isOpen = useSyncExternalStore((l) => (ls.add(l), () => ls.delete(l)), () => open, () => open)
  const used = useRef(false)
  useLocation()
  if (isOpen) used.current = true
  if (!used.current) return null
  return (
    <Suspense fallback={null}>
      <EclipseClose open={isOpen} onClose={() => { open = false; emit() }} />
    </Suspense>
  )
}
