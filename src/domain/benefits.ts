/**
 * P5-L6 · Beneficios de campaña por cliente: emisión (con envío simulado), canje en el pedido y reversión.
 * Reglas: elegibilidad y consentimiento, vencimiento, mínimo de compra, tope por pedido, tope por cliente,
 * cupo total, presupuesto y no acumulación (un beneficio por pedido y nunca junto a una invitación).
 */
import { audit, byId, fail, nextNum, ok, type Ctx, type Outcome } from './core'
import { BIZ_PREFIX } from './business'
import { audienceOf, discountFor } from './growth'
import { addDays, atLocal, dateKeyOf } from './time'
import type { AppState, BusinessId, Campaign, CustomerBenefit, Order, OrderLine } from './types'

const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'
const DAY = 24 * 60 * 60 * 1000

/** Código legible y determinista (p. ej. RC-B7KQ), distinto de los códigos de invitación. */
function benefitCode(s: AppState, biz: BusinessId): string {
  for (;;) {
    let n = nextNum(s, 'BENCODE', biz) * 2246822519
    let out = 'B'
    for (let i = 0; i < 3; i++) {
      n = (n ^ (n >>> 15)) >>> 0
      out += ALPHABET[n % ALPHABET.length]
      n = Math.floor(n / ALPHABET.length) + 104729 * (i + 1)
    }
    const code = `${BIZ_PREFIX[biz]}-${out}`
    if (!s.benefits.some((b) => b.code === code) && !s.gifts.some((g) => g.code === code)) return code
  }
}

/** Vence al final del día: `validDays` desde hoy, sin pasar el último día de la campaña. */
function expiryFor(s: AppState, c: Campaign): number {
  const today = dateKeyOf(s.clock.nowMs)
  const byDays = addDays(today, Math.max(1, c.rules.validDays) - 1)
  const last = byDays < c.endKey ? byDays : c.endKey
  return atLocal(last, 24 * 60) - 1
}

/** Un beneficio disponible para el cliente, con su código y su vencimiento (lo comparten el envío y el reclamo por QR). */
export function makeBenefit(s: AppState, ctx: Ctx, c: Campaign, customerId: string): CustomerBenefit {
  return {
    id: `BEN-${c.id}-${nextNum(s, `BEN@${c.id}`)}`,
    businessId: c.businessId,
    createdAt: ctx.now,
    version: 1,
    campaignId: c.id,
    customerId,
    code: benefitCode(s, c.businessId),
    status: 'disponible',
    expiresAt: expiryFor(s, c),
    orderId: null,
    discountCents: 0,
    redeemedAt: null,
    reason: null,
  }
}

/**
 * Emite beneficios a la audiencia elegible (o a los clientes indicados, para campañas por evento) y registra el envío
 * simulado. Quien no dio consentimiento promocional queda como "omitido" con el motivo: no se le envía nada.
 */
export function issueBenefits(s: AppState, ctx: Ctx, c: Campaign, onlyCustomerIds?: string[]): number {
  const aud = audienceOf(s, onlyCustomerIds ? { ...c, scope: 'individual', audience: { customerIds: onlyCustomerIds, segment: null } } : c)
  for (const x of aud.excluded) {
    if (s.campaignSends.some((z) => z.campaignId === c.id && z.customerId === x.customer.id && z.status === 'omitido' && z.reason === x.reason)) continue
    s.campaignSends.push({ id: `SND-${c.id}-${nextNum(s, `SND@${c.id}`)}`, businessId: c.businessId, createdAt: ctx.now, version: 1, campaignId: c.id, customerId: x.customer.id, channel: 'whatsapp-simulado', status: 'omitido', reason: x.reason })
  }
  let n = 0
  for (const cu of aud.included) {
    const b = makeBenefit(s, ctx, c, cu.id)
    s.benefits.push(b)
    s.campaignSends.push({ id: `SND-${c.id}-${nextNum(s, `SND@${c.id}`)}`, businessId: c.businessId, createdAt: ctx.now, version: 1, campaignId: c.id, customerId: cu.id, channel: cu.channels.whatsapp ? 'whatsapp-simulado' : 'en-la-app', status: 'simulado', reason: null })
    n++
  }
  c.lastIssuedKey = dateKeyOf(ctx.now)
  c.version++
  audit(s, ctx, c.businessId, 'campaign.issued', 'Campaign', c.id, `${c.name}: ${n} beneficio(s) emitido(s) y enviado(s) en simulación; ${aud.excluded.length} omitido(s). No se envió ningún mensaje real.`)
  return n
}

export function findBenefit(s: AppState, businessId: BusinessId, code: string) {
  const k = code.trim().toUpperCase()
  return s.benefits.find((b) => b.businessId === businessId && b.code === k)
}

/** Motivo por el que un beneficio no se puede usar ahora (o null si se puede elegir para un pedido). */
export function benefitProblem(s: AppState, b: CustomerBenefit, customerId: string | null): string | null {
  const c = byId(s.campaigns, b.campaignId)
  if (!c) return 'La campaña de ese beneficio ya no existe.'
  if (!customerId || b.customerId !== customerId) return 'Ese beneficio es de otra persona: solo lo puede usar su titular.'
  if (b.status === 'canjeado') return `Ese beneficio ya se usó en ${b.orderId}.`
  if (b.status === 'anulado') return `Ese beneficio fue anulado${b.reason ? `: ${b.reason}` : ''}.`
  if (b.status === 'vencido' || b.expiresAt < s.clock.nowMs) return 'Ese beneficio venció.'
  if (c.status === 'cancelada') return 'La campaña se canceló.'
  return null
}

/**
 * Aplica el beneficio a las líneas del pedido (sin mutar el estado). El descuento se reparte en proporción entre las líneas
 * elegibles; el resto del redondeo va a la última. Falla si se rompe alguna regla.
 */
export function applyBenefit(s: AppState, b: CustomerBenefit, customerId: string | null, lines: OrderLine[]): Outcome<{ lines: OrderLine[]; discountCents: number }> {
  const problem = benefitProblem(s, b, customerId)
  if (problem) return fail('beneficio-invalido', problem)
  const c = byId(s.campaigns, b.campaignId)!
  if (lines.some((l) => l.giftId)) return fail('beneficio-no-acumulable', 'Un beneficio no se acumula con una invitación en el mismo pedido. Usá uno de los dos.')
  const eligible = lines.filter((l) => !c.benefit.itemIds.length || c.benefit.itemIds.includes(l.itemId))
  if (!eligible.length) return fail('beneficio-sin-items', 'El beneficio no aplica a ningún plato de este pedido.')
  const base = eligible.reduce((a, l) => a + l.lineCents, 0)
  if (base < c.rules.minOrderCents) return fail('beneficio-minimo', `El beneficio pide una compra mínima de $ ${(c.rules.minOrderCents / 100).toLocaleString('es-AR')} en los platos que aplica.`)
  const used = s.benefits.filter((x) => x.campaignId === c.id && x.status === 'canjeado')
  if (used.length >= c.rules.totalCap) return fail('beneficio-cupo', 'Se completó el cupo de canjes de esta campaña.')
  const discount = discountFor(c, base)
  const spent = used.reduce((a, x) => a + x.discountCents, 0)
  if (spent + discount > c.rules.budgetCents) return fail('beneficio-presupuesto', 'El presupuesto de la campaña no alcanza para este canje.')
  let left = discount
  const out = lines.map((l) => ({ ...l }))
  const elig = out.filter((l) => eligible.some((e) => e.id === l.id))
  elig.forEach((l, i) => {
    const part = i === elig.length - 1 ? left : Math.floor((discount * l.lineCents) / base)
    l.discountCents = part
    left -= part
  })
  return ok({ lines: out, discountCents: discount })
}

export function redeemBenefit(s: AppState, ctx: Ctx, o: Order, b: CustomerBenefit, discountCents: number) {
  b.status = 'canjeado'
  b.orderId = o.id
  b.discountCents = discountCents
  b.redeemedAt = ctx.now
  b.version++
  audit(s, ctx, o.businessId, 'benefit.redeemed', 'CustomerBenefit', b.id, `Beneficio ${b.code} canjeado en ${o.id}: descuento ${discountCents / 100} (simulado)`)
}

/** Reversión: si el pedido se rechaza o cancela, el beneficio vuelve a estar disponible (o queda vencido si ya pasó la fecha). */
export function restoreBenefit(s: AppState, ctx: Ctx, o: Order) {
  if (!o.benefitId) return
  const b = byId(s.benefits, o.benefitId)
  if (!b || b.status !== 'canjeado' || b.orderId !== o.id) return
  b.status = b.expiresAt < ctx.now ? 'vencido' : 'disponible'
  b.orderId = null
  b.discountCents = 0
  b.redeemedAt = null
  b.version++
  audit(s, ctx, o.businessId, 'benefit.restored', 'CustomerBenefit', b.id, `Beneficio ${b.code} revertido (${o.id} ${o.status}): ${b.status}`)
}

/** Vence los beneficios disponibles cuya fecha pasó. */
export function expireBenefits(s: AppState, ctx: Ctx) {
  for (const b of s.benefits) {
    if (b.status === 'disponible' && b.expiresAt < ctx.now) {
      b.status = 'vencido'
      b.version++
    }
  }
}
export const benefitDaysLeft = (s: AppState, b: CustomerBenefit) => Math.max(0, Math.ceil((b.expiresAt - s.clock.nowMs) / DAY))
