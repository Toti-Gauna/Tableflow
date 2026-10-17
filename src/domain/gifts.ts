import { audit, base, byId, dup, fail, nextId, nextNum, ok, type Ctx, type Outcome } from './core'
import { addMessage } from './messaging'
import { seasonForDate } from './season'
import { dateKeyOf, MINUTE } from './time'
import type { AppState, BusinessId, Conversation, GiftInvite, GiftStatus, Order, SeasonId } from './types'
import type { Handler } from './cmd-commerce'

// Invitar a comer: alguien regala un plato con un mensaje; quien lo recibe abre la tarjeta y lo canjea
// en su pedido. Todo simulado: no hay cobro al regalar, ni envío real del mensaje, ni datos de contacto.

export const GIFT_DAYS = 30
export const GIFT_MESSAGE_MAX = 280
export const ALIAS_MAX = 30
const SEASONS: SeasonId[] = ['primavera', 'verano', 'otono', 'invierno', 'madre', 'padre', 'amigo', 'fiestas', 'enamorados']
const PREFIX: Record<BusinessId, string> = { 'mesa-clara': 'MC', 'ritual-cafe': 'RC' }
// sin 0/O ni 1/I/L: el código se dicta y se tipea sin confusiones
const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'

/** Estado visible: una invitación sin canjear pasa a "vencida" cuando el reloj simulado supera su vencimiento. */
export function giftStatus(g: GiftInvite, now: number): GiftStatus {
  if ((g.status === 'enviado' || g.status === 'abierto') && now > g.expiresAt) return 'vencido'
  return g.status
}
export const giftUsable = (g: GiftInvite, now: number) => {
  const st = giftStatus(g, now)
  return st === 'enviado' || st === 'abierto'
}
export const normCode = (code: string) => code.trim().toUpperCase().replace(/\s+/g, '')
export function giftByCode(s: AppState, code: string): GiftInvite | undefined {
  const c = normCode(code)
  return s.gifts.find((g) => g.code === c)
}
/** Carrito donde la invitación ya está agregada (una invitación se usa en un solo pedido). */
export function giftCart(s: AppState, giftId: string) {
  return s.carts.find((c) => c.lines.some((l) => l.giftId === giftId))
}

/** Código determinista y legible (p. ej. MC-7KQ4) a partir de un contador persistente. */
function codeFor(s: AppState, biz: BusinessId): string {
  for (;;) {
    let n = nextNum(s, 'GIFTCODE') * 2654435761
    let out = ''
    for (let i = 0; i < 4; i++) {
      n = (n ^ (n >>> 13)) >>> 0
      out += ALPHABET[n % ALPHABET.length]
      n = Math.floor(n / ALPHABET.length) + 7919 * (i + 1)
    }
    const code = `${PREFIX[biz]}-${out}`
    if (!s.gifts.some((g) => g.code === code)) return code
  }
}

const giftCreate: Handler = (s, c, ctx) => {
  if (!c.operationId) return fail('sin-operacion', 'Falta el identificador de la operación.')
  const existing = s.gifts.find((g) => g.operationId === c.operationId)
  if (existing) return dup({ giftId: existing.id, code: existing.code }, `Esa invitación ya estaba creada (${existing.code}).`)
  const biz = byId(s.businesses, c.businessId)
  if (!biz) return fail('negocio-inexistente', 'Negocio inexistente.')
  const item = byId(s.menuItems, c.itemId)
  const errors: Record<string, string> = {}
  if (!item || item.businessId !== biz.id) errors.item = 'Elegí un plato de la carta de este negocio.'
  const from = String(c.fromAlias ?? '').trim()
  const to = String(c.toAlias ?? '').trim()
  const message = String(c.message ?? '').trim()
  if (!from) errors.fromAlias = 'Poné tu nombre o un alias (de muestra).'
  else if (from.length > ALIAS_MAX) errors.fromAlias = `Hasta ${ALIAS_MAX} caracteres.`
  if (!to) errors.toAlias = 'Poné el nombre de quien recibe la invitación.'
  else if (to.length > ALIAS_MAX) errors.toAlias = `Hasta ${ALIAS_MAX} caracteres.`
  if (!message) errors.message = 'Escribí un mensaje para la tarjeta.'
  else if (message.length > GIFT_MESSAGE_MAX) errors.message = `El mensaje puede tener hasta ${GIFT_MESSAGE_MAX} caracteres (tiene ${message.length}).`
  const contact = /\d{6,}|@\w+\.\w+/
  const noContact = 'No hace falta un teléfono ni un correo: la demo no envía nada real. Usá solo un nombre.'
  if (contact.test(to.replace(/[\s.-]/g, ''))) errors.toAlias = noContact
  if (contact.test(message.replace(/\s/g, ''))) errors.message = noContact
  const theme: SeasonId = SEASONS.includes(c.theme) ? c.theme : seasonForDate(dateKeyOf(ctx.now)).id
  const delivery = c.delivery === 'whatsapp-simulado' ? 'whatsapp-simulado' : 'enlace'
  if (Object.keys(errors).length) return fail('validacion', 'Revisá los datos de la invitación.', { errors })

  const g: GiftInvite = {
    id: nextId(s, 'GFT'),
    ...base(s, biz.id),
    code: codeFor(s, biz.id),
    fromAlias: from,
    toAlias: to,
    itemId: item!.id,
    itemName: item!.name,
    coveredCents: item!.priceCents,
    message,
    theme,
    delivery,
    status: 'enviado',
    expiresAt: ctx.now + GIFT_DAYS * 24 * 60 * MINUTE,
    openedAt: null,
    redeemedAt: null,
    orderId: null,
    reason: null,
    operationId: c.operationId,
    conversationId: null,
  }
  if (delivery === 'whatsapp-simulado') {
    // hilo del canal simulado hacia quien recibe: sin teléfono, sin cliente creado, sin envío real
    const conv: Conversation = {
      id: nextId(s, 'C'),
      ...base(s, biz.id),
      customerId: null,
      channel: 'whatsapp',
      title: `Regalo para ${to} (simulado)`,
      flow: null,
      failures: 0,
      reservationIds: [],
      orderIds: [],
      correlationId: ctx.correlationId,
      handoff: false,
    }
    s.conversations.push(conv)
    addMessage(s, ctx, conv, {
      from: 'asistente',
      text: `🎁 ¡Hola, ${to}! ${from} te invita a comer en ${biz.name}: ${item!.name}. Su mensaje: “${message}”. Abrí tu tarjeta y canjeala en tu pedido antes de 30 días. (Mensaje SIMULADO: no se envió nada real.)`,
      link: { label: 'Abrir la invitación', to: `/${biz.id}/regalo/${g.code}` },
      messageKey: `gift:${g.id}`,
    })
    g.conversationId = conv.id
  }
  s.gifts.push(g)
  audit(s, ctx, biz.id, 'gift.created', 'GiftInvite', g.id, `Invitación ${g.code}: ${from} invita a ${to} con ${item!.name} (sin cobro real)`, c.operationId)
  return ok({ giftId: g.id, code: g.code }, `Invitación ${g.code} lista para ${to}.`)
}

const giftOpen: Handler = (s, c, ctx) => {
  const g = giftByCode(s, c.code ?? '')
  if (!g) return fail('regalo-inexistente', 'No encontramos una invitación con ese código. Revisá que esté bien escrito.')
  const st = giftStatus(g, ctx.now)
  if (st !== 'enviado') return dup({ giftId: g.id, status: st })
  g.status = 'abierto'
  g.openedAt = ctx.now
  g.version++
  audit(s, ctx, g.businessId, 'gift.opened', 'GiftInvite', g.id, `Invitación ${g.code} abierta por ${g.toAlias}`)
  return ok({ giftId: g.id, status: 'abierto' })
}

const giftCancel: Handler = (s, c, ctx) => {
  const g = byId(s.gifts, c.giftId)
  if (!g) return fail('regalo-inexistente', 'Invitación inexistente.')
  if (g.status === 'cancelado') return dup()
  if (!giftUsable(g, ctx.now)) return fail('estado-invalido', `La invitación está ${giftStatus(g, ctx.now)}: ya no se puede cancelar.`)
  const reason = String(c.reason ?? '').trim()
  if (!reason) return fail('motivo-requerido', 'Indicá el motivo de la cancelación.')
  g.status = 'cancelado'
  g.reason = reason
  g.version++
  // si estaba agregada a un pedido sin enviar, se quita la línea (no queda un descuento colgado)
  for (const cart of s.carts) {
    const before = cart.lines.length
    cart.lines = cart.lines.filter((l) => l.giftId !== g.id)
    if (cart.lines.length !== before) {
      cart.version++
      cart.pendingOperationId = null
      cart.updatedAt = ctx.now
    }
  }
  audit(s, ctx, g.businessId, 'gift.cancelled', 'GiftInvite', g.id, `Invitación ${g.code} cancelada: ${reason}`)
  return ok()
}

/** Validación de una línea de regalo al agregarla al pedido (la llama cart/add). */
export function checkGiftForCart(s: AppState, code: string, businessId: string, itemId: string, now: number): Outcome<GiftInvite> {
  const g = giftByCode(s, code)
  if (!g || g.businessId !== businessId) return fail('regalo-inexistente', 'Esa invitación no existe en este negocio.')
  const st = giftStatus(g, now)
  if (st === 'canjeado') return fail('regalo-canjeado', `La invitación ${g.code} ya se canjeó en el pedido ${g.orderId}.`)
  if (st === 'vencido') return fail('regalo-vencido', `La invitación ${g.code} venció. Pedile a quien te la regaló que genere otra.`)
  if (st === 'cancelado') return fail('regalo-cancelado', `La invitación ${g.code} fue cancelada${g.reason ? `: ${g.reason}` : ''}.`)
  if (g.itemId !== itemId) return fail('regalo-otro-plato', `La invitación es para ${g.itemName}.`)
  if (giftCart(s, g.id)) return fail('regalo-en-pedido', 'Esa invitación ya está en tu pedido.')
  return ok(g)
}

/** Al enviar el pedido: cada invitación canjeada queda asociada a su pedido (idempotente por pedido). */
export function redeemGifts(s: AppState, ctx: Ctx, o: Order) {
  for (const l of o.lines) {
    if (!l.giftId) continue
    const g = byId(s.gifts, l.giftId)
    if (!g) continue
    g.status = 'canjeado'
    g.orderId = o.id
    g.redeemedAt = ctx.now
    g.version++
    audit(s, ctx, o.businessId, 'gift.redeemed', 'GiftInvite', g.id, `Invitación ${g.code} canjeada en ${o.id}: cubre ${(l.coveredCents ?? 0) / 100}`)
  }
}

/** Si el pedido se rechaza o cancela (o se quita la línea), la invitación vuelve a estar disponible. */
export function restoreGifts(s: AppState, ctx: Ctx, o: Order, onlyLineIds?: string[]) {
  for (const l of o.lines) {
    if (!l.giftId || (onlyLineIds && !onlyLineIds.includes(l.id))) continue
    const g = byId(s.gifts, l.giftId)
    if (!g || g.status !== 'canjeado' || g.orderId !== o.id) continue
    g.status = g.openedAt ? 'abierto' : 'enviado'
    g.orderId = null
    g.redeemedAt = null
    g.version++
    audit(s, ctx, o.businessId, 'gift.restored', 'GiftInvite', g.id, `Invitación ${g.code} disponible de nuevo (${o.id} ${o.status})`)
  }
}

export const giftHandlers: Record<string, Handler> = {
  'gift/create': giftCreate,
  'gift/open': giftOpen,
  'gift/cancel': giftCancel,
}
