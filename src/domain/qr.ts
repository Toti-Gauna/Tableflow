/**
 * P5-L7 · Códigos y QR: qué lleva un código, cómo se lee y qué dice el store de él.
 *
 * Un QR es solo un identificador que apunta a una ruta de la app (`#/<negocio>/q/<tipo>/<referencia>`). Nunca lleva
 * nombres, contactos, precios ni secretos: el estado, el vencimiento y los importes se leen siempre del store. Un código
 * tampoco acredita un pago ni es seguridad productiva: sirve para encontrar un registro y, si corresponde, canjearlo una vez.
 */
import { BIZ_PREFIX } from './business'
import { audienceOf } from './growth'
import { findBenefit } from './benefits'
import { giftByCode, giftStatus } from './gifts'
import { fmtARS } from './money'
import { dateKeyOf, fmtDateShort, hhmm } from './time'
import type { AppState, BusinessId, Order, Reservation } from './types'

export type CodeKind = 'negocio' | 'sede' | 'mesa' | 'campana' | 'referido' | 'pedido' | 'reserva' | 'beneficio' | 'regalo'
export const CODE_KINDS: CodeKind[] = ['negocio', 'sede', 'mesa', 'campana', 'referido', 'pedido', 'reserva', 'beneficio', 'regalo']
export const KIND_LABEL: Record<CodeKind, string> = {
  negocio: 'Negocio',
  sede: 'Sede',
  mesa: 'Mesa',
  campana: 'Campaña',
  referido: 'Referido',
  pedido: 'Pedido',
  reserva: 'Reserva',
  beneficio: 'Beneficio',
  regalo: 'Invitación',
}

export type CodeStatus =
  | 'valido'
  | 'desconocido'
  | 'vencido'
  | 'cancelado'
  | 'usado'
  | 'duplicado'
  | 'negocio-incorrecto'
  | 'sede-incorrecta'
  | 'cupo-agotado'
  | 'no-elegible'
  | 'revertido'

export const STATUS_LABEL: Record<CodeStatus, string> = {
  valido: 'Válido',
  desconocido: 'Desconocido',
  vencido: 'Vencido',
  cancelado: 'Cancelado',
  usado: 'Ya usado',
  duplicado: 'Duplicado',
  'negocio-incorrecto': 'Es de otro negocio',
  'sede-incorrecta': 'Es de otra sede',
  'cupo-agotado': 'Cupo agotado',
  'no-elegible': 'No elegible',
  revertido: 'Canje revertido',
}

/** Los estados en los que el código sirve (el resto se rechaza con su motivo). */
export const STATUS_USABLE: CodeStatus[] = ['valido', 'revertido']

const REF_RE = /^[A-Za-z0-9._-]{1,48}$/

export interface ParsedCode {
  businessId: BusinessId | null
  kind: CodeKind | null
  ref: string
  locationId: string | null
}

/** Ruta de la app que abre el QR (sin dominio). Solo ids y códigos públicos: nada de personas ni de importes. */
export function qrPath(businessId: BusinessId, kind: CodeKind, ref: string, locationId?: string | null): string {
  return `/${businessId}/q/${kind}/${encodeURIComponent(ref)}${locationId ? `?s=${encodeURIComponent(locationId)}` : ''}`
}

/** Código de recomendación de un cliente: estable, corto y sin su nombre. */
export function referralCode(s: AppState, businessId: BusinessId, customerId: string): string | null {
  const ids = s.customers.filter((c) => c.businessId === businessId && !c.mergedInto).map((c) => c.id).sort()
  const taken = new Map<string, string>()
  for (const id of ids) {
    let code = ''
    for (let salt = 0; ; salt++) {
      code = `${BIZ_PREFIX[businessId]}-F${hash4(`${businessId}|${id}|${salt}`)}`
      if (!taken.has(code)) break
    }
    taken.set(code, id)
    if (id === customerId) return code
  }
  return null
}
export function referrerOf(s: AppState, businessId: BusinessId, code: string): string | null {
  const k = code.trim().toUpperCase()
  for (const c of s.customers) {
    if (c.businessId === businessId && !c.mergedInto && referralCode(s, businessId, c.id) === k) return c.id
  }
  return null
}
const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'
function hash4(seed: string): string {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619) >>> 0
  let out = ''
  for (let i = 0; i < 3; i++) {
    out += ALPHABET[h % ALPHABET.length]
    h = Math.imul(h ^ (h >>> 15), 2246822519) >>> 0
  }
  return out
}

/**
 * Lee lo que devolvió un lector (o lo que se escribió a mano): una URL completa, la ruta `#/negocio/q/tipo/ref`
 * o un código suelto (id de pedido, de reserva, código de beneficio…). Todo parámetro que no sea `s` (sede) se descarta:
 * un QR no puede traer precios ni descuentos y que lo intente no cambia nada.
 */
export function parseScan(text: string, businessIds: BusinessId[]): ParsedCode {
  const raw = String(text ?? '').trim()
  const hashAt = raw.indexOf('#/')
  const path = hashAt >= 0 ? raw.slice(hashAt + 1) : raw.startsWith('/') ? raw : ''
  if (path) {
    const [route, query = ''] = path.split('?')
    const m = route.match(/^\/([a-z-]+)\/q\/([a-z]+)\/([^/]+)\/?$/)
    if (m && (businessIds as string[]).includes(m[1]) && (CODE_KINDS as string[]).includes(m[2])) {
      let ref = ''
      try {
        ref = decodeURIComponent(m[3])
      } catch {
        ref = ''
      }
      const loc = new URLSearchParams(query).get('s')
      return { businessId: m[1] as BusinessId, kind: m[2] as CodeKind, ref, locationId: loc && REF_RE.test(loc) ? loc : null }
    }
    return { businessId: null, kind: null, ref: '', locationId: null }
  }
  return { businessId: null, kind: null, ref: raw.toUpperCase().replace(/\s+/g, ''), locationId: null }
}

/** Un código suelto: se busca en los registros del negocio que lo escanea. */
function guessKind(s: AppState, biz: BusinessId, ref: string): CodeKind | null {
  if (s.orders.some((o) => o.businessId === biz && o.id.toUpperCase() === ref)) return 'pedido'
  if (s.reservations.some((r) => r.businessId === biz && r.id.toUpperCase() === ref)) return 'reserva'
  if (findBenefit(s, biz, ref)) return 'beneficio'
  const g = giftByCode(s, ref)
  if (g && g.businessId === biz) return 'regalo'
  if (referrerOf(s, biz, ref)) return 'referido'
  if (s.campaigns.some((c) => c.businessId === biz && c.id.toUpperCase() === ref)) return 'campana'
  if (s.tables.some((t) => t.businessId === biz && t.id.toUpperCase() === ref)) return 'mesa'
  if (s.locations.some((l) => l.businessId === biz && l.id.toUpperCase() === ref)) return 'sede'
  if (ref.toLowerCase() === biz) return 'negocio'
  return null
}

export interface CodeCheck {
  status: CodeStatus
  usable: boolean
  kind: CodeKind | null
  ref: string
  title: string
  detail: string
  facts: { label: string; value: string }[]
  /** Lo que se puede hacer ahora con el código; null si solo se consulta. */
  action: null | { type: 'entregar' | 'llegada' | 'reclamar'; label: string }
}

/** Quién mira el código: el comercio (negocio y sede activos) o un cliente (que solo ve lo suyo). */
export interface ScanContext {
  businessId: BusinessId
  locationId: string
  side: 'comercio' | 'cliente'
  customerId?: string | null
}

const note = (status: CodeStatus, kind: CodeKind | null, ref: string, detail: string, extra: Partial<CodeCheck> = {}): CodeCheck => ({
  status,
  usable: STATUS_USABLE.includes(status),
  kind,
  ref,
  title: kind ? `${KIND_LABEL[kind]} ${ref}` : ref || 'Código vacío',
  detail,
  facts: [],
  action: null,
  ...extra,
})

const ORDER_WAIT: Partial<Record<Order['status'], string>> = {
  enviado: 'todavía no fue aceptado',
  aceptado: 'está aceptado y falta prepararlo',
  en_preparacion: 'se está preparando',
}

/**
 * Qué dice el store de este código. Es una lectura pura: no cambia nada. Los datos de una persona solo se muestran
 * al comercio o a su dueña; para cualquier otro cliente un código ajeno es "desconocido".
 */
export function checkCode(s: AppState, ctx: ScanContext, text: string): CodeCheck {
  const ids = s.businesses.map((b) => b.id)
  const p = parseScan(text, ids)
  if (!p.ref && !p.kind) return note('desconocido', null, '', 'No se pudo leer el código. Probá de nuevo o escribilo a mano.')
  if (p.businessId && p.businessId !== ctx.businessId) {
    return note('negocio-incorrecto', p.kind, p.ref, 'Este código pertenece a otro negocio. No se muestra nada de él.')
  }
  const kind = p.kind ?? guessKind(s, ctx.businessId, p.ref)
  if (!kind || !REF_RE.test(p.ref)) return note('desconocido', kind, p.ref, 'No encontramos ese código en este negocio.')
  const biz = ctx.businessId
  const now = s.clock.nowMs
  const today = dateKeyOf(now)
  const commerce = ctx.side === 'comercio'
  const mine = (customerId: string | null) => commerce || (!!ctx.customerId && customerId === ctx.customerId)
  const wrongSede = (locationId: string) => (p.locationId && p.locationId !== locationId) || locationId !== ctx.locationId
  const unknown = () => note('desconocido', kind, p.ref, 'No encontramos ese código en este negocio.')
  const sedeName = (id: string) => s.locations.find((l) => l.id === id)?.name ?? id

  if (kind === 'negocio') {
    if (p.ref.toLowerCase() !== biz) return unknown()
    const b = s.businesses.find((x) => x.id === biz)!
    return note('valido', kind, p.ref, `Entrada de ${b.name}: abre la carta del negocio.`, { title: b.name, facts: [{ label: 'Negocio', value: b.name }] })
  }
  if (kind === 'sede') {
    const l = s.locations.find((x) => x.businessId === biz && x.id === p.ref)
    if (!l) return unknown()
    if (commerce && l.id !== ctx.locationId) return note('sede-incorrecta', kind, p.ref, `Es de la sede ${l.name}, y estás en ${sedeName(ctx.locationId)}.`, { title: `Sede ${l.name}` })
    return note('valido', kind, p.ref, `Sede ${l.name}: abre la carta de esa sede.`, { title: `Sede ${l.name}`, facts: [{ label: 'Sede', value: l.name }] })
  }
  if (kind === 'mesa') {
    const t = s.tables.find((x) => x.businessId === biz && x.id === p.ref)
    if (!t) return unknown()
    if (commerce && wrongSede(t.locationId)) return note('sede-incorrecta', kind, p.ref, `La mesa ${t.label} es de la sede ${sedeName(t.locationId)}, y estás en ${sedeName(ctx.locationId)}.`, { title: `Mesa ${t.label}` })
    const open = s.tableSessions.find((x) => x.status === 'activa' && x.tableIds.includes(t.id))
    return note('valido', kind, p.ref, `Mesa ${t.label} (${t.sector}, ${t.seats} lugares). Quien la escanea pide desde esa mesa.`, {
      title: `Mesa ${t.label}`,
      facts: [{ label: 'Sede', value: sedeName(t.locationId) }, { label: 'Lugares', value: String(t.seats) }, ...(commerce ? [{ label: 'Ahora', value: open ? 'con mesa abierta' : 'libre' }] : [])],
    })
  }
  if (kind === 'campana') {
    const c = s.campaigns.find((x) => x.businessId === biz && x.id === p.ref)
    if (!c || (!commerce && ['borrador', 'aprobada'].includes(c.status))) return unknown()
    const issued = s.benefits.filter((b) => b.campaignId === c.id && b.status !== 'anulado').length
    const facts = [{ label: 'Campaña', value: c.name }, { label: 'Cupo', value: `${issued} de ${c.rules.totalCap}` }, { label: 'Vigencia', value: `${fmtDateShort(c.startKey)} al ${fmtDateShort(c.endKey)}` }]
    const base = { title: c.name, facts }
    if (c.status === 'cancelada') return note('cancelado', kind, p.ref, 'La campaña se canceló.', base)
    if (c.status === 'finalizada' || today > c.endKey) return note('vencido', kind, p.ref, 'La campaña terminó.', base)
    if (c.status !== 'activa') return note('no-elegible', kind, p.ref, `La campaña está ${c.status}: todavía no se puede reclamar.`, base)
    if (c.trigger === 'evento') return note('no-elegible', kind, p.ref, 'Esta campaña sale sola cuando ocurre un hecho (primer pedido o recomendación): no se reclama con un QR.', base)
    if (today < c.startKey) return note('no-elegible', kind, p.ref, `Empieza el ${fmtDateShort(c.startKey)}.`, base)
    if (issued >= c.rules.totalCap) return note('cupo-agotado', kind, p.ref, 'Se agotó el cupo de la campaña.', base)
    if (commerce) return note('valido', kind, p.ref, 'Campaña activa: el cliente que la escanea puede reclamar su beneficio si le corresponde.', base)
    if (!ctx.customerId) return note('no-elegible', kind, p.ref, 'Para reclamar tu beneficio tenés que estar identificado como cliente.', base)
    const aud = audienceOf(s, c)
    if (aud.included.some((x) => x.id === ctx.customerId)) return note('valido', kind, p.ref, 'Podés reclamar tu beneficio.', { ...base, action: { type: 'reclamar', label: 'Reclamar mi beneficio' } })
    const ex = aud.excluded.find((x) => x.customer.id === ctx.customerId)
    if (ex && /ya tiene|tope/.test(ex.reason)) return note('duplicado', kind, p.ref, 'Ya reclamaste el beneficio de esta campaña.', base)
    if (ex) return note('no-elegible', kind, p.ref, `No te corresponde: ${ex.reason}.`, base)
    return note('no-elegible', kind, p.ref, 'Esta campaña no es para tu perfil.', base)
  }
  if (kind === 'referido') {
    const who = referrerOf(s, biz, p.ref)
    if (!who) return unknown()
    const referrer = s.customers.find((c) => c.id === who)!
    const facts = commerce ? [{ label: 'Recomienda', value: referrer.alias }] : []
    if (!commerce && ctx.customerId === who) return note('no-elegible', kind, p.ref, 'Es tu propio código: compartilo con alguien que todavía no sea cliente.', { title: 'Tu código de recomendación' })
    if (!commerce && ctx.customerId && (s.referrals.some((r) => r.referredId === ctx.customerId) || s.orders.some((o) => o.customerId === ctx.customerId && !['rechazado', 'cancelado'].includes(o.status)))) {
      return note('no-elegible', kind, p.ref, 'La recomendación es para quien todavía no es cliente.', { title: 'Código de recomendación' })
    }
    return note('valido', kind, p.ref, 'Código de recomendación: quien lo usa queda registrado como recomendado y, con su primer pedido entregado, se cumple.', { title: 'Código de recomendación', facts })
  }
  if (kind === 'pedido') {
    const o = s.orders.find((x) => x.businessId === biz && x.id.toUpperCase() === p.ref.toUpperCase())
    if (!o || !mine(o.customerId)) return unknown()
    if (commerce && wrongSede(o.locationId)) return note('sede-incorrecta', kind, p.ref, `El pedido es de la sede ${sedeName(o.locationId)}, y estás en ${sedeName(ctx.locationId)}.`, { title: `Pedido ${o.id}` })
    const facts = [
      { label: 'Tipo', value: o.kind === 'mesa' ? 'En la mesa' : `Retiro ${o.pickup ? hhmm(o.pickup.startMin) : ''}`.trim() },
      { label: 'Estado', value: o.status.replace('_', ' ') },
      { label: 'Total', value: fmtARS(o.totalCents) },
      ...(o.kind === 'retiro' ? [{ label: 'N.º de retiro', value: o.pickupCode }] : []),
      ...(commerce ? [{ label: 'A nombre de', value: o.alias }] : []),
    ]
    const base = { title: `Pedido ${o.id}`, facts }
    const pay = 'Este código no acredita el pago: el estado de pago se mira en Caja.'
    if (o.status === 'cancelado' || o.status === 'rechazado') return note('cancelado', kind, p.ref, `El pedido está ${o.status}.`, base)
    if (o.status === 'retirado' || o.status === 'servido' || o.status === 'cerrado') return note('usado', kind, p.ref, `Ya se entregó (${o.status}). ${pay}`, base)
    if (o.status === 'listo') {
      return note('valido', kind, p.ref, commerce ? `Listo para entregar. ${pay}` : 'Tu pedido está listo.', commerce ? { ...base, action: { type: 'entregar', label: o.kind === 'mesa' ? 'Registrar servido' : 'Registrar retiro' } } : base)
    }
    return note('no-elegible', kind, p.ref, `Todavía no se puede entregar: ${ORDER_WAIT[o.status] ?? o.status}.`, base)
  }
  if (kind === 'reserva') {
    const r = s.reservations.find((x) => x.businessId === biz && x.id.toUpperCase() === p.ref.toUpperCase())
    if (!r || !mine(r.customerId)) return unknown()
    if (commerce && wrongSede(r.locationId)) return note('sede-incorrecta', kind, p.ref, `La reserva es de la sede ${sedeName(r.locationId)}, y estás en ${sedeName(ctx.locationId)}.`, { title: `Reserva ${r.id}` })
    return reservationCheck(r, p.ref, today, commerce)
  }
  if (kind === 'beneficio') {
    const b = findBenefit(s, biz, p.ref)
    if (!b || !mine(b.customerId)) return unknown()
    const camp = s.campaigns.find((c) => c.id === b.campaignId)
    const facts = [{ label: 'Campaña', value: camp?.name ?? b.campaignId }, { label: 'Vence', value: fmtDateShort(dateKeyOf(b.expiresAt)) }, ...(commerce ? [{ label: 'Cliente', value: s.customers.find((c) => c.id === b.customerId)?.alias ?? '—' }] : [])]
    const base = { title: `Beneficio ${b.code}`, facts }
    if (b.status === 'anulado') return note('cancelado', kind, p.ref, `El beneficio se anuló${b.reason ? `: ${b.reason}` : ''}.`, base)
    if (b.status === 'canjeado') return note('usado', kind, p.ref, `Ya se canjeó en el pedido ${b.orderId ?? ''}.`.replace(' .', '.'), base)
    if (b.status === 'vencido' || b.expiresAt < now) return note('vencido', kind, p.ref, 'El beneficio venció.', base)
    const reverted = s.audit.some((a) => a.type === 'benefit.restored' && a.entityId === b.id)
    if (reverted) return note('revertido', kind, p.ref, 'El canje anterior se revirtió (el pedido no se concretó): el beneficio vuelve a estar disponible. Se canjea al enviar el pedido.', base)
    return note('valido', kind, p.ref, 'Disponible. Se canjea al enviar el pedido; este control no lo consume.', base)
  }
  // regalo
  const g = giftByCode(s, p.ref)
  if (!g || g.businessId !== biz) return unknown()
  const st = giftStatus(g, now)
  const base = { title: `Invitación ${g.code}`, facts: [{ label: 'Plato', value: g.itemName }, ...(commerce ? [{ label: 'De', value: g.fromAlias }, { label: 'Para', value: g.toAlias }] : [])] }
  if (st === 'cancelado') return note('cancelado', kind, p.ref, 'La invitación se canceló.', base)
  if (st === 'vencido') return note('vencido', kind, p.ref, 'La invitación venció.', base)
  if (st === 'canjeado') return note('usado', kind, p.ref, 'La invitación ya se canjeó.', base)
  return note('valido', kind, p.ref, 'Invitación vigente. Se canjea al armar el pedido.', base)
}

function reservationCheck(r: Reservation, ref: string, today: string, commerce: boolean): CodeCheck {
  const base = { title: `Reserva ${r.id}`, facts: [{ label: 'Día', value: `${fmtDateShort(r.dateKey)} ${hhmm(r.startMin)}` }, { label: 'Personas', value: String(r.party) }, { label: 'Estado', value: r.status.replace('_', ' ') }, ...(commerce ? [{ label: 'A nombre de', value: r.alias }] : [])] }
  if (r.status === 'cancelada' || r.status === 'no_show') return note('cancelado', 'reserva', ref, `La reserva figura ${r.status.replace('_', ' ')}.`, base)
  if (r.status === 'llegada' || r.status === 'sentada' || r.status === 'completada') return note('usado', 'reserva', ref, 'Ya se registró la llegada.', base)
  if (r.status !== 'confirmada') return note('no-elegible', 'reserva', ref, `La reserva todavía no está confirmada (${r.status.replace('_', ' ')}).`, base)
  if (r.dateKey < today) return note('vencido', 'reserva', ref, 'La fecha de la reserva ya pasó.', base)
  if (r.dateKey > today) return note('no-elegible', 'reserva', ref, `Es para el ${fmtDateShort(r.dateKey)}: hoy no se registra llegada.`, base)
  return note('valido', 'reserva', ref, commerce ? 'Reserva de hoy, confirmada.' : 'Tu reserva está confirmada para hoy.', commerce ? { ...base, action: { type: 'llegada', label: 'Registrar llegada' } } : base)
}
