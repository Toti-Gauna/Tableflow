/**
 * P5-L6 · Asistente del comercio, determinista. No hay IA: reglas fijas que consultan los datos de la demo y hacen los
 * cálculos de `growth.ts`. Si falta un dato, lo pide; si un costo no está cargado, lo dice (ND); explica los supuestos.
 * Puede preparar el borrador de una campaña, pero guardarlo y aprobarlo lo decide una persona.
 */
import { normalize } from './core'
import { breakEven, contribution, customerStats, itemContribution, missingCosts, projectCampaign, campaignResults, SEGMENT_LABEL } from './growth'
import { activeCustomers } from './customers'
import { itemMatch } from './assistant-client'
import { addDays, dateKeyOf } from './time'
import type { AppState, BusinessId, Campaign, MenuItem, SegmentId } from './types'

export type CampaignDraft = Omit<Campaign, 'id' | 'businessId' | 'createdAt' | 'version' | 'status' | 'createdBy' | 'approvedBy' | 'activatedAt' | 'lastIssuedKey' | 'reason' | 'operationId'>
export type AssistAction = { kind: 'crear-borrador'; label: string; draft: CampaignDraft } | { kind: 'ir'; label: string; to: string } | { kind: 'sugerencia'; label: string }
export interface AssistReply {
  text: string
  facts?: [string, string][]
  assumptions?: string[]
  /** Costos o datos del negocio que no están cargados (ND). */
  missing?: string[]
  /** Datos que el asistente necesita que le digas para seguir. */
  ask?: string[]
  actions?: AssistAction[]
}
interface CampaignSlots { segment?: SegmentId; benefit?: { type: 'porcentaje' | 'monto'; value: number }; itemId?: string; fixedCostCents?: number; budgetCents?: number }
interface BreakEvenSlots { priceCents?: number; costCents?: number; variableCents?: number; discountCents?: number; discountPct?: number; fixedCents?: number }
export interface BizAssistState { pending: null | { intent: 'campana'; slots: CampaignSlots; asked: keyof CampaignSlots | null } | { intent: 'equilibrio'; slots: BreakEvenSlots; asked: keyof BreakEvenSlots | null } }
export const BIZ_ASSIST_START: BizAssistState = { pending: null }

const ARS = (c: number) => `$ ${(c / 100).toLocaleString('es-AR', { maximumFractionDigits: 2 })}`
const PCT = (p: number | null) => (p === null ? 'ND' : `${(Math.round(p * 1000) / 10).toLocaleString('es-AR')} %`)
const SUGGEST: AssistAction[] = [
  { kind: 'sugerencia', label: '¿Cuánto vendimos hoy?' },
  { kind: 'sugerencia', label: '¿Qué platos dejan más contribución?' },
  { kind: 'sugerencia', label: '¿Qué costos faltan cargar?' },
  { kind: 'sugerencia', label: 'Armá una campaña para clientes a reactivar' },
  { kind: 'sugerencia', label: 'Calculá el equilibrio de una promo' },
]

// ------------------------------------------------------------------ lectura de números del texto (sin normalizar: "3.000" ≠ "3 000")
function moneyIn(raw: string, after?: RegExp): number | null {
  const src = after ? raw.slice(raw.search(after) >= 0 ? raw.search(after) : raw.length) : raw
  const m = src.match(/\$?\s*(\d{1,3}(?:\.\d{3})+|\d+)(?:,(\d{1,2}))?\s*(mil|k)?\b(?!\s*%)/i)
  if (!m) return null
  let v = Number(m[1].replace(/\./g, '')) + (m[2] ? Number(`0.${m[2]}`) : 0)
  if (m[3]) v *= 1000
  return Math.round(v * 100)
}
const pctIn = (raw: string): number | null => {
  const m = raw.match(/(\d{1,2})\s*(%|por ?ciento)/i)
  return m ? Number(m[1]) : null
}
function segmentIn(n: string): SegmentId | undefined {
  if (/inactiv|reactiv|hace mucho|volver|no vienen/.test(n)) return 'inactivos'
  if (/frecuent|habitual|fiel/.test(n)) return 'frecuentes'
  if (/nuev|primera vez/.test(n)) return 'nuevos'
  if (/sin usar|no usaron/.test(n)) return 'con-beneficio-sin-usar'
  if (/todos|masiva|todo el mundo/.test(n)) return 'todos'
  return undefined
}
function itemIn(s: AppState, biz: BusinessId, n: string): MenuItem | undefined {
  return itemMatch(s.menuItems.filter((m) => m.businessId === biz), n)
}

// ------------------------------------------------------------------ respuestas
function ventas(s: AppState, biz: BusinessId, n: string): AssistReply {
  const today = dateKeyOf(s.clock.nowMs)
  const from = /mes/.test(n) ? `${today.slice(0, 8)}01` : /semana|7 dias/.test(n) ? addDays(today, -6) : today
  const label = from === today ? 'hoy' : /mes/.test(n) ? 'en el mes' : 'en los últimos 7 días'
  const orders = s.orders.filter((o) => o.businessId === biz && dateKeyOf(o.createdAt) >= from && dateKeyOf(o.createdAt) <= today)
  const delivered = orders.filter((o) => ['servido', 'retirado', 'cerrado'].includes(o.status))
  const paid = s.payments.filter((p) => p.businessId === biz && p.status === 'registrado' && dateKeyOf(p.createdAt) >= from)
  const discounts = delivered.reduce((a, o) => a + o.lines.reduce((x, l) => x + (l.discountCents ?? 0) + (l.coveredCents ?? 0), 0), 0)
  return {
    text: `Esto es lo registrado ${label} (reloj simulado).`,
    facts: [
      ['Pedidos', String(orders.length)],
      ['Entregados o cerrados', String(delivered.length)],
      ['Ventas de pedidos entregados (bruto)', ARS(delivered.reduce((a, o) => a + o.totalCents, 0))],
      ['Descuentos e invitaciones', ARS(discounts)],
      ['Cobrado en caja (DEMO)', ARS(paid.reduce((a, p) => a + p.amountCents, 0))],
    ],
    assumptions: ['Solo cuenta lo que pasó en esta demo; no hay datos de días anteriores al seed.'],
  }
}
function rinde(s: AppState, biz: BusinessId): AssistReply {
  const items = s.menuItems.filter((m) => m.businessId === biz && !m.soldOut)
  const rows = items.map((m) => ({ m, c: itemContribution(s, m) })).filter((x) => x.c).sort((a, b) => b.c!.contributionCents - a.c!.contributionCents)
  const nd = items.length - rows.length
  return {
    text: rows.length ? 'Contribución por unidad a precio de carta, sin extras (de mayor a menor):' : 'No hay ítems con costos cargados para calcular.',
    facts: rows.slice(0, 5).map(({ m, c }) => [m.name, `${ARS(c!.contributionCents)} · ${PCT(c!.pct)}`]),
    assumptions: ['Contribución = precio − costo del producto − otros variables. El porcentaje no es utilidad neta: no descuenta alquiler, sueldos ni otros fijos.', ...(nd ? [`${nd} ítem(s) sin costo cargado quedan afuera (ND).`] : [])],
    actions: nd ? [{ kind: 'ir', label: 'Cargar costos', to: '/admin/costos' }] : undefined,
  }
}
function faltantes(s: AppState, biz: BusinessId): AssistReply {
  const m = missingCosts(s, biz)
  if (!m.items.length && !m.options.length) return { text: 'Están cargados todos los costos de la carta y de los extras.' }
  return {
    text: 'Estos costos no están cargados (ND). Mientras falten, las campañas que los usan quedan en borrador:',
    missing: [...m.items.map((i) => `${i.name}: ${i.costCents === null ? 'costo del producto' : ''}${i.costCents === null && i.variableCents === null ? ' y ' : ''}${i.variableCents === null ? 'costos variables' : ''}`), ...m.options.map((o) => `Extra ${o.option.name}`)],
    actions: [{ kind: 'ir', label: 'Ir a Costos', to: '/admin/costos' }],
  }
}
function clientes(s: AppState, biz: BusinessId): AssistReply {
  const stats = activeCustomers(s, biz).map((c) => customerStats(s, c))
  const seg = (id: SegmentId) => stats.filter((x) => x.segments.includes(id))
  const withPromo = (l: typeof stats) => l.filter((x) => x.customer.consent.promo).length
  return {
    text: 'Clientes de la demo por segmento (entre paréntesis, cuántos aceptaron recibir promociones):',
    facts: (['frecuentes', 'inactivos', 'nuevos', 'con-beneficio-sin-usar'] as SegmentId[]).map((id) => [SEGMENT_LABEL[id], `${seg(id).length} (${withPromo(seg(id))})`]),
    assumptions: ['La recencia y la frecuencia suman un historial sintético previo a la demo, marcado en cada ficha.'],
    actions: [{ kind: 'ir', label: 'Ver clientes', to: '/admin/clientes' }],
  }
}
function stock(s: AppState, biz: BusinessId): AssistReply {
  const low = s.ingredients.filter((i) => i.businessId === biz && i.alertState !== 'ok')
  return low.length
    ? { text: 'Insumos con alerta:', facts: low.map((i) => [i.name, i.alertState === 'agotado' ? 'agotado' : `bajo (${i.onHand} ${i.unit})`]), actions: [{ kind: 'ir', label: 'Ir a Stock', to: '/admin/stock' }] }
    : { text: 'No hay insumos con alerta de stock.' }
}
function campanas(s: AppState, biz: BusinessId): AssistReply {
  const list = s.campaigns.filter((c) => c.businessId === biz)
  if (!list.length) return { text: 'Este negocio no tiene campañas todavía.', actions: [{ kind: 'sugerencia', label: 'Armá una campaña para clientes a reactivar' }] }
  return {
    text: 'Campañas de este negocio:',
    facts: list.map((c) => { const r = campaignResults(s, c.id); return [c.name, `${c.status} · ${r.issued} emitidos · ${r.redeemed} canjeados`] }),
    assumptions: ['Los canjes son ventas atribuidas a la campaña: no prueban que sin ella no se hubieran hecho.'],
    actions: [{ kind: 'ir', label: 'Ir a Campañas', to: '/admin/campanas' }],
  }
}

// ------------------------------------------------------------------ equilibrio con datos del usuario
const BE_ASK: Record<keyof BreakEvenSlots, string> = {
  priceCents: '¿A qué precio se vende? (por ejemplo, 100)',
  costCents: '¿Cuánto cuesta el producto? (insumos)',
  variableCents: '¿Cuánto suman los otros costos variables por pedido? (envase, comisión; 0 si no hay)',
  discountCents: '¿De cuánto es el descuento? (un monto o un porcentaje; 0 si no hay)',
  discountPct: '',
  fixedCents: '¿Cuál es el costo fijo de la campaña? (diseño, impresión, horas; 0 si no hay)',
}
function readBE(raw: string, n: string, sl: BreakEvenSlots, asked: keyof BreakEvenSlots | null): BreakEvenSlots {
  const out = { ...sl }
  const grab = (re: RegExp) => moneyIn(raw, re)
  if (out.priceCents === undefined && /precio|cobr|vend/.test(n)) out.priceCents = grab(/precio|cobr|vend/i) ?? undefined
  if (out.costCents === undefined && /costo (del producto|de|es|:)?\s*\$?\d|cuesta/.test(n)) out.costCents = grab(/costo|cuesta/i) ?? undefined
  if (out.variableCents === undefined && /variable/.test(n)) out.variableCents = grab(/variable/i) ?? undefined
  if (out.discountCents === undefined && out.discountPct === undefined && /descuento/.test(n)) {
    const p = pctIn(raw.slice(raw.search(/descuento/i)))
    if (p !== null) out.discountPct = p
    else out.discountCents = grab(/descuento/i) ?? undefined
  }
  if (out.fixedCents === undefined && /fijo/.test(n)) out.fixedCents = grab(/fijo/i) ?? undefined
  if (asked && out[asked] === undefined) {
    if (asked === 'discountCents') {
      const p = pctIn(raw)
      if (p !== null) out.discountPct = p
      else out.discountCents = moneyIn(raw) ?? (/(no|sin|cero)\b/.test(n) ? 0 : undefined)
    } else out[asked] = moneyIn(raw) ?? (/(no|sin|cero|ninguno)\b/.test(n) ? 0 : undefined)
  }
  return out
}
function equilibrio(st: BreakEvenSlots): { reply: AssistReply; next: keyof BreakEvenSlots | null } {
  const order: (keyof BreakEvenSlots)[] = ['priceCents', 'costCents', 'variableCents', 'discountCents', 'fixedCents']
  const miss = order.find((k) => (k === 'discountCents' ? st.discountCents === undefined && st.discountPct === undefined : st[k] === undefined))
  if (miss) return { reply: { text: BE_ASK[miss], ask: order.filter((k) => (k === 'discountCents' ? st.discountCents === undefined && st.discountPct === undefined : st[k] === undefined)).map((k) => BE_ASK[k].replace(/^¿|\?.*$/g, '')) }, next: miss }
  const price = st.priceCents!
  const discount = st.discountPct !== undefined ? Math.round((price * st.discountPct) / 100) : st.discountCents!
  const base = contribution({ priceCents: price, productCents: st.costCents!, variableCents: st.variableCents! })
  const withD = contribution({ priceCents: price, discountCents: discount, productCents: st.costCents!, variableCents: st.variableCents! })
  const be = breakEven(st.fixedCents!, withD.contributionCents)
  return {
    next: null,
    reply: {
      text: be === null
        ? 'Con estos números cada pedido no deja contribución positiva: no hay equilibrio por volumen bajo estos supuestos.'
        : `Hacen falta ${be} pedido(s) para cubrir el costo fijo de la campaña, bajo estos supuestos.`,
      facts: [
        ['Ingreso neto por pedido', `${ARS(withD.netCents)} (precio ${ARS(price)} − descuento ${ARS(discount)})`],
        ['Contribución sin descuento', `${ARS(base.contributionCents)} · ${PCT(base.pct)}`],
        ['Contribución con descuento', `${ARS(withD.contributionCents)} · ${PCT(withD.pct)}`],
        ['Costo fijo de la campaña', ARS(st.fixedCents!)],
        ['Equilibrio', be === null ? 'sin equilibrio por volumen' : `${be} pedido(s) = ceil(${ARS(st.fixedCents!)} / ${ARS(withD.contributionCents)})`],
      ],
      assumptions: ['Contribución = ingreso neto − costo del producto − otros variables; el costo fijo no se reparte en la unitaria.', 'Es una proyección con los números que diste, no un resultado observado.'],
    },
  }
}

// ------------------------------------------------------------------ campaña guiada
const CP_ASK: Record<keyof CampaignSlots, string> = {
  segment: '¿A quiénes va? Frecuentes, a reactivar, nuevos o todos los que aceptaron promociones.',
  benefit: '¿Qué beneficio? Un porcentaje (por ejemplo, 10 %) o un monto (por ejemplo, $ 2.000).',
  itemId: '¿Con qué plato de la carta proyecto? Lo uso como pedido de referencia para costo y contribución.',
  fixedCostCents: '¿Cuál es el costo fijo de la campaña? (diseño, impresión, horas; 0 si no hay)',
  budgetCents: '¿Qué presupuesto máximo de descuentos le ponemos?',
}
function readCampaign(s: AppState, biz: BusinessId, raw: string, n: string, sl: CampaignSlots, asked: keyof CampaignSlots | null): CampaignSlots {
  const out = { ...sl }
  out.segment ??= segmentIn(n)
  if (!out.benefit) {
    const p = pctIn(raw)
    if (p !== null) out.benefit = { type: 'porcentaje', value: p }
    else if (/descuento de|beneficio de|bonific/.test(n) || asked === 'benefit') { const m = moneyIn(raw, asked === 'benefit' ? undefined : /descuento de|beneficio de|bonific/i); if (m) out.benefit = { type: 'monto', value: m } }
  }
  out.itemId ??= itemIn(s, biz, n)?.id
  if (out.fixedCostCents === undefined && (/fijo/.test(n) || asked === 'fixedCostCents')) out.fixedCostCents = moneyIn(raw, asked === 'fixedCostCents' ? undefined : /fijo/i) ?? (/(no|sin|cero|ninguno)\b/.test(n) && asked === 'fixedCostCents' ? 0 : undefined)
  if (out.budgetCents === undefined && (/presupuesto/.test(n) || asked === 'budgetCents')) out.budgetCents = moneyIn(raw, asked === 'budgetCents' ? undefined : /presupuesto/i) ?? undefined
  return out
}
function campaign(s: AppState, biz: BusinessId, sl: CampaignSlots): { reply: AssistReply; next: keyof CampaignSlots | null } {
  const order: (keyof CampaignSlots)[] = ['segment', 'benefit', 'itemId', 'fixedCostCents', 'budgetCents']
  const miss = order.filter((k) => sl[k] === undefined)
  if (miss.length) return { reply: { text: CP_ASK[miss[0]], ask: miss.map((k) => CP_ASK[k].split('?')[0].replace('¿', '')) }, next: miss[0] }
  const today = dateKeyOf(s.clock.nowMs)
  const item = s.menuItems.find((m) => m.id === sl.itemId)!
  const segName = SEGMENT_LABEL[sl.segment!].split(' (')[0]
  const draft: CampaignDraft = {
    name: `${sl.benefit!.type === 'porcentaje' ? `${sl.benefit!.value} %` : ARS(sl.benefit!.value)} para ${segName.toLowerCase()}`,
    scope: sl.segment === 'todos' ? 'masiva' : 'segmento', trigger: 'manual', event: null, cadence: 'unica', seasonId: null,
    startKey: today, endKey: addDays(today, 30), audience: { customerIds: [], segment: sl.segment === 'todos' ? null : sl.segment! },
    benefit: { type: sl.benefit!.type, value: sl.benefit!.value, itemIds: [] },
    rules: { minOrderCents: 0, validDays: 14, maxDiscountCents: sl.benefit!.type === 'monto' ? sl.benefit!.value : 0, maxPerCustomer: 1, totalCap: 50, budgetCents: sl.budgetCents! },
    refItemId: item.id, fixedCostCents: sl.fixedCostCents!, assumedRedemptionPct: null,
  }
  const p = projectCampaign(s, { ...draft, id: 'CMP-borrador', businessId: biz, createdAt: s.clock.nowMs, version: 1, status: 'borrador', createdBy: 'asistente', approvedBy: null, activatedAt: null, lastIssuedKey: null, reason: null, operationId: '' })
  return {
    next: null,
    reply: {
      text: p.complete ? 'Así quedaría la campaña. La guardo como borrador: para salir necesita la aprobación del encargado.' : 'Puedo guardarla como borrador, pero faltan datos y así no se puede aprobar:',
      facts: [
        ['Audiencia (con consentimiento)', `${p.audience.included.length} cliente(s); ${p.audience.excluded.length} quedan afuera`],
        ['Descuento por pedido', p.discountPerOrderCents === null ? 'ND' : ARS(p.discountPerOrderCents)],
        ['Costo máximo', p.maxCostCents === null ? 'ND' : `${ARS(p.maxCostCents)} (presupuesto o cupo, lo menor, más el costo fijo)`],
        ['Contribución por pedido', p.withDiscount ? `${ARS(p.withDiscount.contributionCents)} · ${PCT(p.withDiscount.pct)}` : 'ND'],
        ['Equilibrio', p.complete ? (p.breakEvenOrders === null ? 'sin equilibrio por volumen' : `${p.breakEvenOrders} pedido(s)`) : 'ND'],
      ],
      missing: p.complete ? undefined : p.missing,
      assumptions: [...p.assumptions, 'Uso por defecto: vigencia de 14 días, 1 por cliente, cupo de 50 y 30 días de campaña. Se cambian en el editor antes de aprobar.'],
      actions: [{ kind: 'crear-borrador', label: 'Guardar como borrador', draft }, ...(p.complete ? [] : [{ kind: 'ir' as const, label: 'Cargar costos', to: '/admin/costos' }])],
    },
  }
}

/** Una vuelta de conversación: texto del usuario → respuestas y estado nuevo (la conversación vive en la pantalla). */
export function bizAssistant(s: AppState, biz: BusinessId, raw: string, st: BizAssistState): { replies: AssistReply[]; state: BizAssistState } {
  const n = normalize(raw)
  if (/^(cancel|olvid|deja|basta|no importa)/.test(n)) return { replies: [{ text: 'Listo, lo dejamos. ¿En qué más te ayudo?', actions: SUGGEST }], state: BIZ_ASSIST_START }
  const p = st.pending
  if (!p && /campanas? (activas|hay|tengo|tenemos)|resultados|como (van|vamos)|canjes/.test(n)) return { replies: [campanas(s, biz)], state: st }
  if (p?.intent === 'campana' || (!p && /campan|promo|armar? una|crea(r|me)? (una )?(campan|promo)|beneficio para/.test(n))) {
    const slots = readCampaign(s, biz, raw, n, p?.intent === 'campana' ? p.slots : {}, p?.intent === 'campana' ? p.asked : null)
    const r = campaign(s, biz, slots)
    return { replies: [r.reply], state: r.next ? { pending: { intent: 'campana', slots, asked: r.next } } : BIZ_ASSIST_START }
  }
  if (p?.intent === 'equilibrio' || /equilibrio|cuantos pedidos|break ?even/.test(n)) {
    const slots = readBE(raw, n, p?.intent === 'equilibrio' ? p.slots : {}, p?.intent === 'equilibrio' ? p.asked : null)
    const r = equilibrio(slots)
    return { replies: [r.reply], state: r.next ? { pending: { intent: 'equilibrio', slots, asked: r.next } } : BIZ_ASSIST_START }
  }
  if (/vend|ventas|factur|caja hoy|cuanto (hicimos|entro)/.test(n)) return { replies: [ventas(s, biz, n)], state: st }
  if (/costos? (que )?falt|falta(n)? (cargar|costos)|sin costo|\bnd\b|cargar costo/.test(n)) return { replies: [faltantes(s, biz)], state: st }
  if (/rinde|contribucion|margen|dejan mas|mas rentable/.test(n)) return { replies: [rinde(s, biz)], state: st }
  if (/client|segment|inactiv|frecuent/.test(n)) return { replies: [clientes(s, biz)], state: st }
  if (/stock|insumo|bacha/.test(n)) return { replies: [stock(s, biz)], state: st }
  if (/^(hola|buenas|ayuda|que podes|que sabes)/.test(n) || !n) return { replies: [{ text: 'Respondo con los datos de esta demo y calculo con las fórmulas del manual. Probá con:', actions: SUGGEST }], state: st }
  return { replies: [{ text: 'No tengo cómo responder eso con los datos de la demo, y no voy a inventar un número. Puedo ayudarte con esto:', actions: SUGGEST }], state: st }
}
