/**
 * P5-L6 · Fidelización y campañas: fórmulas, costos, métricas de clientes, audiencia, proyección, resultados y calendario.
 * Todo puro y determinista. Un dato que falta es `null` (ND): nunca se completa con un promedio o un número inventado.
 *
 * Contribución = ingreso neto de descuentos y devoluciones − costo del producto − otros costos variables.
 * Porcentaje = contribución / ingreso neto (no es utilidad neta: no descuenta costos fijos del local).
 * Equilibrio = ceil(costo fijo de la campaña / contribución positiva por pedido); el costo fijo no se reparte en la unitaria.
 */
import { activeCustomers } from './customers'
import { DEAD_ORDER } from './sessions'
import { addDays, dateKeyOf } from './time'
import { seasonForDate, specialWindows } from './season'
import type { AppState, BusinessId, Campaign, CustomerDemo, MenuItem, Order, SegmentId } from './types'

// ------------------------------------------------------------------ fórmulas
export interface Contribution {
  netCents: number
  productCents: number
  variableCents: number
  contributionCents: number
  /** contribución / ingreso neto; null si el ingreso neto es 0 o negativo. */
  pct: number | null
}
export function contribution(i: { priceCents: number; discountCents?: number; refundCents?: number; productCents: number; variableCents: number }): Contribution {
  const net = i.priceCents - (i.discountCents ?? 0) - (i.refundCents ?? 0)
  const c = net - i.productCents - i.variableCents
  return { netCents: net, productCents: i.productCents, variableCents: i.variableCents, contributionCents: c, pct: net > 0 ? c / net : null }
}
/** Pedidos para cubrir el costo fijo de la campaña; null si la contribución por pedido no es positiva (no hay equilibrio por volumen). */
export function breakEven(fixedCostCents: number, contributionPerOrderCents: number): number | null {
  if (contributionPerOrderCents <= 0) return null
  return Math.ceil(fixedCostCents / contributionPerOrderCents)
}

// ------------------------------------------------------------------ costos
export interface UnitCost { productCents: number | null; variableCents: number | null; missing: string[] }
/** Costo de una unidad de un ítem con sus extras y variantes. Un componente sin costo cargado deja el total en ND. */
export function unitCost(s: AppState, item: MenuItem, optionIds: string[] = []): UnitCost {
  const missing: string[] = []
  let product: number | null = item.costCents
  if (product === null) missing.push(`costo de ${item.name}`)
  for (const oid of optionIds) {
    const o = s.modifierGroups.flatMap((g) => g.options).find((x) => x.id === oid)
    if (!o || o.costCents === undefined) continue // sin costo propio (incluido en el plato)
    if (o.costCents === null) {
      missing.push(`costo del extra ${o.name}`)
      product = null
    } else if (product !== null) product += o.costCents
  }
  if (item.variableCents === null) missing.push(`costos variables de ${item.name}`)
  return { productCents: missing.some((m) => m.startsWith('costo ')) ? null : product, variableCents: item.variableCents, missing }
}
/** Contribución unitaria del ítem a precio de carta (sin extras); null si falta algún costo. */
export function itemContribution(s: AppState, item: MenuItem): Contribution | null {
  const u = unitCost(s, item)
  if (u.productCents === null || u.variableCents === null) return null
  return contribution({ priceCents: item.priceCents, productCents: u.productCents, variableCents: u.variableCents })
}
export function missingCosts(s: AppState, businessId: BusinessId) {
  const items = s.menuItems.filter((m) => m.businessId === businessId && (m.costCents === null || m.variableCents === null))
  const options = s.modifierGroups.filter((g) => g.businessId === businessId).flatMap((g) => g.options.filter((o) => o.costCents === null).map((o) => ({ groupId: g.id, option: o })))
  return { items, options }
}

// ------------------------------------------------------------------ clientes: historial y segmentos
const DAY = 24 * 60 * 60 * 1000
const LIVE = (o: Order) => !DEAD_ORDER.includes(o.status)
export const STAMP_GOAL = 8
const STAMP_KINDS = new Set(['heladeria', 'rapida'])

export interface CustomerStats {
  customer: CustomerDemo
  recencyDays: number | null
  orders90: number
  spend90Cents: number
  topItems: { id: string; name: string }[]
  benefitsAvailable: number
  /** Sellos de muestra (Copo y Brasa): pedidos entregados; el premio requiere aprobación del negocio. null = no aplica. */
  stamps: number | null
  referrals: number
  segments: SegmentId[]
  /** Hay historial sintético previo a la demo (se informa: no son pedidos reales de la semilla). */
  hasHistory: boolean
}
export function customerStats(s: AppState, c: CustomerDemo): CustomerStats {
  const now = s.clock.nowMs
  const h = s.customerHistory.find((x) => x.customerId === c.id)
  const live = s.orders.filter((o) => o.customerId === c.id && LIVE(o))
  const live90 = live.filter((o) => now - o.createdAt <= 90 * DAY)
  const lastLive = live.length ? Math.max(...live.map((o) => o.createdAt)) : null
  const liveRec = lastLive === null ? null : Math.floor((now - lastLive) / DAY)
  const recs = [h?.lastOrderDaysAgo ?? null, liveRec].filter((x): x is number => x !== null)
  const recencyDays = recs.length ? Math.min(...recs) : null
  const orders90 = (h?.orders90 ?? 0) + live90.length
  const spend90Cents = (h?.spend90Cents ?? 0) + live90.reduce((a, o) => a + o.totalCents, 0)
  const counts = new Map<string, number>()
  for (const id of h?.topItemIds ?? []) counts.set(id, (counts.get(id) ?? 0) + 2)
  for (const o of live) for (const l of o.lines) counts.set(l.itemId, (counts.get(l.itemId) ?? 0) + l.qty)
  const topItems = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 3)
    .map(([id]) => ({ id, name: s.menuItems.find((m) => m.id === id)?.name ?? id }))
  const benefitsAvailable = s.benefits.filter((b) => b.customerId === c.id && b.status === 'disponible' && b.expiresAt >= now).length
  const biz = s.businesses.find((b) => b.id === c.businessId)
  const delivered = live.filter((o) => ['retirado', 'servido', 'cerrado'].includes(o.status)).length
  const stamps = biz && STAMP_KINDS.has(biz.kind) ? Math.min(STAMP_GOAL, (h?.orders90 ?? 0) + delivered) : null
  const referrals = s.referrals.filter((r) => r.referrerId === c.id).length
  const segments: SegmentId[] = ['todos']
  if (orders90 <= 1 && (recencyDays === null || recencyDays <= 30)) segments.push('nuevos')
  if (orders90 >= 4) segments.push('frecuentes')
  if (recencyDays !== null && recencyDays > 30) segments.push('inactivos')
  if (benefitsAvailable > 0) segments.push('con-beneficio-sin-usar')
  return { customer: c, recencyDays, orders90, spend90Cents, topItems, benefitsAvailable, stamps, referrals, segments, hasHistory: !!h }
}
export const SEGMENT_LABEL: Record<SegmentId, string> = {
  todos: 'Todos', nuevos: 'Nuevos (hasta 1 pedido)', frecuentes: 'Frecuentes (4+ pedidos en 90 días)', inactivos: 'A reactivar (más de 30 días sin venir)', 'con-beneficio-sin-usar': 'Con un beneficio sin usar',
}

// ------------------------------------------------------------------ audiencia
export interface Audience { included: CustomerDemo[]; excluded: { customer: CustomerDemo; reason: string }[] }
/** Quiénes recibirían la campaña ahora. Sin consentimiento promocional no se incluye a nadie (el de servicio es aparte). */
export function audienceOf(s: AppState, c: Pick<Campaign, 'businessId' | 'scope' | 'audience' | 'rules'> & { id?: string }): Audience {
  const all = activeCustomers(s, c.businessId)
  const pool = c.scope === 'individual' ? all.filter((x) => c.audience.customerIds.includes(x.id))
    : c.scope === 'segmento' && c.audience.segment ? all.filter((x) => customerStats(s, x).segments.includes(c.audience.segment!))
    : all
  const included: CustomerDemo[] = []
  const excluded: Audience['excluded'] = []
  for (const x of pool) {
    const mine = c.id ? s.benefits.filter((b) => b.campaignId === c.id && b.customerId === x.id) : []
    if (!x.consent.promo) excluded.push({ customer: x, reason: 'sin consentimiento promocional' })
    else if (mine.some((b) => b.status === 'disponible')) excluded.push({ customer: x, reason: 'ya tiene un beneficio de esta campaña sin usar' })
    else if (mine.length >= c.rules.maxPerCustomer) excluded.push({ customer: x, reason: `llegó al tope de ${c.rules.maxPerCustomer} por cliente` })
    else included.push(x)
  }
  return { included, excluded }
}

// ------------------------------------------------------------------ proyección (antes de activar)
export interface Projection {
  complete: boolean
  missing: string[]
  audience: Audience
  ref: { item: MenuItem; productCents: number | null; variableCents: number | null } | null
  discountPerOrderCents: number | null
  withoutDiscount: Contribution | null
  withDiscount: Contribution | null
  /** Costo máximo de los descuentos (presupuesto o cupo × descuento, lo menor) más el costo fijo. */
  maxCostCents: number | null
  breakEvenOrders: number | null
  /** Pedidos proyectados con el supuesto de canje; null si no hay supuesto cargado. */
  expectedOrders: number | null
  assumptions: string[]
}
export function discountFor(c: Pick<Campaign, 'benefit' | 'rules'>, baseCents: number): number {
  const raw = c.benefit.type === 'porcentaje' ? Math.round((baseCents * c.benefit.value) / 100) : Math.min(c.benefit.value, baseCents)
  return Math.max(0, Math.min(raw, c.rules.maxDiscountCents > 0 ? c.rules.maxDiscountCents : raw, baseCents))
}
export function projectCampaign(s: AppState, c: Campaign): Projection {
  const missing: string[] = []
  const assumptions: string[] = []
  const audience = audienceOf(s, c)
  const item = c.refItemId ? s.menuItems.find((m) => m.id === c.refItemId && m.businessId === c.businessId) ?? null : null
  if (!item) missing.push('ítem de referencia para proyectar')
  const u = item ? unitCost(s, item) : null
  if (u) missing.push(...u.missing)
  if (c.fixedCostCents === null) missing.push('costo fijo de la campaña (diseño, impresión, horas; 0 si no hay)')
  let discount: number | null = null
  let withoutDiscount: Contribution | null = null
  let withDiscount: Contribution | null = null
  if (item) {
    discount = discountFor(c, item.priceCents)
    assumptions.push(`Pedido de referencia: 1 × ${item.name} a precio de carta (${item.priceCents / 100}), sin extras.`)
    if (c.rules.minOrderCents > item.priceCents) assumptions.push(`El mínimo de compra (${c.rules.minOrderCents / 100}) supera al ítem de referencia: en la práctica el pedido tendrá más cosas.`)
    if (c.benefit.itemIds.length && !c.benefit.itemIds.includes(item.id)) assumptions.push('El ítem de referencia no está entre los ítems del beneficio: el descuento real puede ser menor.')
    if (u && u.productCents !== null && u.variableCents !== null) {
      withoutDiscount = contribution({ priceCents: item.priceCents, productCents: u.productCents, variableCents: u.variableCents })
      withDiscount = contribution({ priceCents: item.priceCents, discountCents: discount, productCents: u.productCents, variableCents: u.variableCents })
    }
  }
  const complete = missing.length === 0
  const maxDiscounts = discount === null ? null : Math.min(c.rules.budgetCents, c.rules.totalCap * discount)
  const maxCostCents = maxDiscounts === null || c.fixedCostCents === null ? null : maxDiscounts + c.fixedCostCents
  const breakEvenOrders = complete && withDiscount ? breakEven(c.fixedCostCents!, withDiscount.contributionCents) : null
  let expectedOrders: number | null = null
  if (c.assumedRedemptionPct !== null) {
    expectedOrders = Math.min(c.rules.totalCap, Math.round((audience.included.length * c.assumedRedemptionPct) / 100))
    assumptions.push(`Supuesto de canje cargado a mano: ${c.assumedRedemptionPct} % de la audiencia (no es un dato observado).`)
  } else assumptions.push('Sin supuesto de canje: no se proyectan pedidos.')
  if (c.trigger === 'evento') assumptions.push('Campaña por evento: la audiencia se arma a medida que ocurre el evento; el número de hoy es indicativo.')
  return { complete, missing, audience, ref: item && u ? { item, productCents: u.productCents, variableCents: u.variableCents } : null, discountPerOrderCents: discount, withoutDiscount, withDiscount, maxCostCents, breakEvenOrders, expectedOrders, assumptions }
}

// ------------------------------------------------------------------ resultados observados (después de activar)
export interface CampaignResults {
  issued: number
  sent: number
  skipped: number
  available: number
  redeemed: number
  expired: number
  voided: number
  orders: number
  grossCents: number
  discountCents: number
  netCents: number
  productCents: number | null
  variableCents: number | null
  contributionCents: number | null
  budgetUsedCents: number
}
/** Lo que pasó con los pedidos que usaron un beneficio. Son ventas atribuidas: no prueban que la campaña las haya causado. */
export function campaignResults(s: AppState, campaignId: string): CampaignResults {
  const bs = s.benefits.filter((b) => b.campaignId === campaignId)
  const sends = s.campaignSends.filter((x) => x.campaignId === campaignId)
  const ids = new Set(bs.map((b) => b.id))
  const orders = s.orders.filter((o) => o.benefitId && ids.has(o.benefitId) && LIVE(o))
  let product: number | null = 0
  let variable: number | null = 0
  let gross = 0
  let disc = 0
  let covered = 0
  for (const o of orders) {
    for (const l of o.lines) {
      gross += l.lineCents
      disc += l.discountCents ?? 0
      covered += l.coveredCents ?? 0
      const item = s.menuItems.find((m) => m.id === l.itemId)
      const u = item ? unitCost(s, item, l.selections.map((x) => x.optionId)) : null
      if (!u || u.productCents === null || product === null) product = null
      else product += u.productCents * l.qty
      if (!u || u.variableCents === null || variable === null) variable = null
      else variable += u.variableCents * l.qty
    }
  }
  const net = gross - disc - covered
  return {
    issued: bs.length,
    sent: sends.filter((x) => x.status === 'simulado').length,
    skipped: sends.filter((x) => x.status === 'omitido').length,
    available: bs.filter((b) => b.status === 'disponible').length,
    redeemed: bs.filter((b) => b.status === 'canjeado').length,
    expired: bs.filter((b) => b.status === 'vencido').length,
    voided: bs.filter((b) => b.status === 'anulado').length,
    orders: orders.length,
    grossCents: gross,
    discountCents: disc,
    netCents: net,
    productCents: product,
    variableCents: variable,
    contributionCents: product === null || variable === null ? null : net - product - variable,
    budgetUsedCents: bs.filter((b) => b.status === 'canjeado').reduce((a, b) => a + b.discountCents, 0),
  }
}

// ------------------------------------------------------------------ calendario
const monthsBetween = (a: string, b: string) => (Number(b.slice(0, 4)) - Number(a.slice(0, 4))) * 12 + Number(b.slice(5, 7)) - Number(a.slice(5, 7))
/** Días (YYYY-MM-DD) en que la campaña está en el aire dentro de [fromKey, toKey], según su cadencia. */
export function campaignDays(c: Pick<Campaign, 'cadence' | 'startKey' | 'endKey' | 'seasonId'>, fromKey: string, toKey: string): string[] {
  const out: string[] = []
  const from = fromKey > c.startKey ? fromKey : c.startKey
  const to = toKey < c.endKey ? toKey : c.endKey
  for (let d = from; d <= to; d = addDays(d, 1)) {
    let on = false
    switch (c.cadence) {
      case 'unica': on = true; break
      case 'semanal': on = Math.round((Date.parse(d) - Date.parse(c.startKey)) / DAY) % 7 === 0; break
      case 'mensual': on = d.slice(8) === c.startKey.slice(8); break
      case 'bimestral': on = d.slice(8) === c.startKey.slice(8) && monthsBetween(c.startKey, d) % 2 === 0; break
      case 'estacional': on = !!c.seasonId && seasonForDate(d).id === c.seasonId; break
      case 'festividad': on = !!c.seasonId && specialWindows(Number(d.slice(0, 4))).some((w) => w.id === c.seasonId && d >= w.from && d <= w.to); break
    }
    if (on) out.push(d)
  }
  return out
}
export const CADENCE_LABEL: Record<Campaign['cadence'], string> = { unica: 'Única', semanal: 'Semanal', mensual: 'Mensual', bimestral: 'Bimestral', estacional: 'Estacional', festividad: 'Por festividad' }
export const todayKey = (s: AppState) => dateKeyOf(s.clock.nowMs)
