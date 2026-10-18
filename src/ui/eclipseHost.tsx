import { useSyncExternalStore } from 'react'
import { useLocation } from 'react-router-dom'
import { getSnapshot } from '../store'
import { EclipseClose } from './Eclipse'

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
  useLocation()
  return <EclipseClose open={isOpen} onClose={() => { open = false; emit() }} />
}
