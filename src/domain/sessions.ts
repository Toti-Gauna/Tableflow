import { audit, base, fail, nextId, ok, type Ctx, type Outcome } from './core'
import type { AppState, BusinessId, Order, TableSession } from './types'

export function activeSessionAt(s: AppState, tableId: string): TableSession | undefined {
  return s.tableSessions.find((x) => x.status === 'activa' && x.tableIds.includes(tableId))
}

export function openSession(
  s: AppState,
  ctx: Ctx,
  p: {
    businessId: BusinessId
    locationId: string
    kind: 'mesa' | 'retiro'
    tableIds: string[]
    party: number
    reservationId?: string | null
    label: string
  },
): Outcome<TableSession> {
  for (const t of p.tableIds) {
    const ex = activeSessionAt(s, t)
    if (ex) {
      const tb = s.tables.find((x) => x.id === t)
      return fail('mesa-ocupada', `La mesa ${tb?.label ?? t} ya tiene una sesión activa (${ex.id}). Elegí otra mesa libre.`, { sessionId: ex.id })
    }
  }
  const ts: TableSession = {
    id: nextId(s, 'S', 3, p.businessId),
    ...base(s, p.businessId),
    locationId: p.locationId,
    kind: p.kind,
    tableIds: p.tableIds,
    party: p.party,
    reservationId: p.reservationId ?? null,
    status: 'activa',
    openedAt: ctx.now,
    closedAt: null,
    splitPlan: null,
    closeException: null,
    label: p.label,
  }
  s.tableSessions.push(ts)
  audit(s, ctx, p.businessId, 'session.opened', 'TableSession', ts.id, `Sesión ${ts.id} abierta (${p.label})`)
  return ok(ts)
}

export const DEAD_ORDER: Order['status'][] = ['rechazado', 'cancelado']
const DEAD = DEAD_ORDER
/** Importe a cobrar de una línea: lo cubierto por una invitación no se cobra (simulado). */
// lo que queda por cobrar de la línea: menos lo que cubre una invitación y el descuento de un beneficio (P5-L6)
export const lineDue = (l: Order['lines'][number]) => l.lineCents - (l.coveredCents ?? 0) - (l.discountCents ?? 0)
export const orderDue = (o: Order) => o.lines.reduce((a, l) => a + lineDue(l), 0)
export const orderCovered = (o: Order) => o.lines.reduce((a, l) => a + (l.coveredCents ?? 0), 0)
export const orderDiscount = (o: Order) => o.lines.reduce((a, l) => a + (l.discountCents ?? 0), 0)
export function billableOrders(s: AppState, sessionId: string): Order[] {
  return s.orders.filter((o) => o.sessionId === sessionId && !DEAD.includes(o.status))
}
export function sessionTotal(s: AppState, sessionId: string): number {
  return billableOrders(s, sessionId).reduce((a, o) => a + orderDue(o), 0)
}
export function sessionPaid(s: AppState, sessionId: string): number {
  return s.payments.filter((p) => p.sessionId === sessionId && p.status === 'registrado').reduce((a, p) => a + p.amountCents, 0)
}
export const sessionBalance = (s: AppState, sessionId: string) => sessionTotal(s, sessionId) - sessionPaid(s, sessionId)

/** Líneas facturables con indicación de si ya fueron asignadas a un pago. */
export function billableLines(s: AppState, sessionId: string) {
  const paid = new Set(s.payments.filter((p) => p.sessionId === sessionId && p.status === 'registrado').flatMap((p) => p.lineIds))
  // una línea cubierta por completo por una invitación no queda pendiente de cobro
  return billableOrders(s, sessionId).flatMap((o) => o.lines.map((l) => ({ order: o, line: l, paid: paid.has(l.id) || lineDue(l) === 0, due: lineDue(l) })))
}

/**
 * P5-L5 · Estado de pago de un pedido. Se deriva SOLO del saldo de su cuenta (pagos registrados en caja),
 * nunca del estado de preparación ni de una animación: un retiro aceptado con pago en el local sigue «pendiente».
 */
export type OrderPayment = { state: 'pendiente-local' | 'pagado' | 'cuenta-mesa' | 'no-aplica'; balanceCents: number }
export function orderPayment(s: AppState, o: Order): OrderPayment {
  if (DEAD.includes(o.status)) return { state: 'no-aplica', balanceCents: 0 }
  const balanceCents = sessionBalance(s, o.sessionId)
  if (o.kind === 'mesa') return { state: balanceCents > 0 ? 'cuenta-mesa' : 'pagado', balanceCents }
  return { state: balanceCents > 0 ? 'pendiente-local' : 'pagado', balanceCents }
}
