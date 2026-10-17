import type { BusinessId } from '../domain/types'

// Comodidad por pestaña: la mesa que se leyó con el QR queda elegida hasta que el pedido la use. Si el navegador no deja
// guardar (modo privado, datos bloqueados), simplemente se elige a mano en Mi pedido.
const key = (b: BusinessId) => `tableflow.qr-mesa.${b}`
export function rememberMesa(b: BusinessId, tableId: string) {
  try {
    sessionStorage.setItem(key(b), tableId)
  } catch {
    /* sin almacenamiento: se elige en Mi pedido */
  }
}
export function recallMesa(b: BusinessId): string | null {
  try {
    return sessionStorage.getItem(key(b))
  } catch {
    return null
  }
}
export function forgetMesa(b: BusinessId) {
  try {
    sessionStorage.removeItem(key(b))
  } catch {
    /* nada que olvidar */
  }
}
