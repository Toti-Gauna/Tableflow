import { describe, expect, it } from 'vitest'
import { giftStatus } from '../src/domain/gifts'
import { sessionBalance, sessionTotal } from '../src/domain/sessions'
import { cartTotal } from '../src/domain/cmd-commerce'
import { validateState } from '../src/domain/validate'
import { T, MON } from './helpers'

const MC = { businessId: 'mesa-clara', locationId: 'L-MC-salon' }
const CART = 'CART-L-MC-salon'
const FRITAS = { 'MG-guarnicion': ['gu-papas-fritas'] }
const HORNO = { 'MG-guarnicion': ['gu-papas-horno'] }

function regalo(t: T, op = 'op-g1', extra: Record<string, unknown> = {}) {
  const o = t.ok({ type: 'gift/create', businessId: 'mesa-clara', itemId: 'MC-12', fromAlias: 'Lu', toAlias: 'Mamá', message: 'Feliz día, ma. Esta vez invito yo.', theme: 'madre', delivery: 'whatsapp-simulado', operationId: op, ...extra }, 'cliente-invitado') as any
  return { id: o.data.giftId as string, code: o.data.code as string }
}
function enviar(t: T) {
  t.ok({ type: 'cart/setFulfillment', cartId: CART, fulfillment: { kind: 'mesa', tableId: 'T-MC-02' }, alias: 'M2' })
  const op = (t.ok({ type: 'cart/begin', cartId: CART }) as any).data.operationId
  return (t.ok({ type: 'order/submit', cartId: CART, operationId: op }) as any).data.orderId as string
}

describe('Invitar a comer (regalos)', () => {
  it('crear: código legible, mensaje simulado al destinatario, idempotente y sin datos de contacto', () => {
    const t = T.seed()
    const g = regalo(t)
    expect(g.code).toMatch(/^MC-[2-9A-HJKMNP-Z]{4}$/)
    const gift = t.get('gifts', g.id)
    expect(gift).toMatchObject({ status: 'enviado', itemName: 'Milanesa de ternera', coveredCents: 1_850_000, theme: 'madre', toAlias: 'Mamá' })
    expect(gift.expiresAt - gift.createdAt).toBe(30 * 24 * 60 * 60 * 1000)
    // hilo simulado hacia quien recibe: sin cliente creado y con enlace a la tarjeta
    const conv = t.get('conversations', gift.conversationId)
    expect(conv).toMatchObject({ channel: 'whatsapp', customerId: null })
    const msg = t.s.messages.find((m) => m.conversationId === conv.id)!
    expect(msg.text).toMatch(/SIMULADO/)
    expect(msg.link).toEqual({ label: 'Abrir la invitación', to: `/mesa-clara/regalo/${g.code}` })
    // reintento con la misma operación: no duplica
    const again = t.run({ type: 'gift/create', businessId: 'mesa-clara', itemId: 'MC-12', fromAlias: 'Lu', toAlias: 'Mamá', message: 'x', operationId: 'op-g1' })
    expect(again.ok && again.duplicate).toBe(true)
    expect(t.s.gifts).toHaveLength(1)
    expect(validateState(t.s)).toEqual([])
  })

  it('validación: mensaje y nombres obligatorios, límite de 280, sin teléfonos ni correos', () => {
    const t = T.seed()
    const base = { type: 'gift/create', businessId: 'mesa-clara', itemId: 'MC-12', fromAlias: 'Lu', toAlias: 'Mamá', message: 'Hola', operationId: 'op-v' }
    const errs = (o: any) => o.data.errors
    expect(errs(t.fail({ ...base, message: '  ' }, 'validacion'))).toHaveProperty('message')
    expect(errs(t.fail({ ...base, message: 'x'.repeat(281) }, 'validacion')).message).toMatch(/280/)
    expect(errs(t.fail({ ...base, toAlias: '' }, 'validacion'))).toHaveProperty('toAlias')
    expect(errs(t.fail({ ...base, toAlias: '11 5555 1234' }, 'validacion')).toAlias).toMatch(/teléfono/)
    expect(errs(t.fail({ ...base, message: 'escribime a ana@mail.com' }, 'validacion')).message).toMatch(/correo/)
    expect(errs(t.fail({ ...base, itemId: 'RC-01' }, 'validacion'))).toHaveProperty('item')
  })

  it('abrir → canjear en el pedido: cubre el plato base; los extras se pagan; el envío lo marca canjeado', () => {
    const t = T.seed()
    const g = regalo(t)
    t.ok({ type: 'gift/open', code: g.code.toLowerCase() }, 'cliente-invitado')
    expect(t.get('gifts', g.id).status).toBe('abierto')
    const again = t.run({ type: 'gift/open', code: g.code })
    expect(again.ok && again.duplicate).toBe(true)
    t.at(MON, 12, 30)
    t.fail({ type: 'cart/add', ...MC, itemId: 'MC-12', qty: 2, selections: FRITAS, giftCode: g.code }, 'regalo-una-unidad')
    t.fail({ type: 'cart/add', ...MC, itemId: 'MC-24', qty: 1, selections: {}, giftCode: g.code }, 'regalo-otro-plato')
    t.ok({ type: 'cart/add', ...MC, itemId: 'MC-12', qty: 1, selections: HORNO, giftCode: g.code }, 'cliente-invitado')
    const cart = t.get('carts', CART)
    expect(cartTotal(t.s, cart)).toBe(150_000) // solo el extra de papas al horno
    t.fail({ type: 'cart/add', ...MC, itemId: 'MC-12', qty: 1, selections: FRITAS, giftCode: g.code }, 'regalo-en-pedido')
    t.fail({ type: 'cart/setQty', cartId: CART, lineId: cart.lines[0].id, qty: 2 }, 'regalo-una-unidad')
    // otra milanesa sin regalo no se mezcla con la línea regalada
    t.ok({ type: 'cart/add', ...MC, itemId: 'MC-12', qty: 1, selections: HORNO })
    expect(t.get('carts', CART).lines).toHaveLength(2)
    const oid = enviar(t)
    const o = t.get('orders', oid)
    expect(o.totalCents).toBe(2 * 2_000_000)
    expect(o.lines.find((l: any) => l.giftId)).toMatchObject({ giftId: g.id, coveredCents: 1_850_000 })
    expect(sessionTotal(t.s, o.sessionId)).toBe(2_000_000 + 150_000)
    expect(t.get('gifts', g.id)).toMatchObject({ status: 'canjeado', orderId: oid })
    expect(validateState(t.s)).toEqual([])
    // ya canjeada: no se puede volver a usar
    t.fail({ type: 'cart/add', ...MC, itemId: 'MC-12', qty: 1, selections: FRITAS, giftCode: g.code }, 'regalo-canjeado')
  })

  it('si el pedido se rechaza o se cancela antes de preparar, la invitación vuelve a estar disponible', () => {
    const t = T.seed()
    const g = regalo(t)
    t.at(MON, 12, 30)
    t.ok({ type: 'cart/add', ...MC, itemId: 'MC-12', qty: 1, selections: FRITAS, giftCode: g.code })
    let oid = enviar(t)
    t.ok({ type: 'order/reject', orderId: oid, reason: 'Sin milanesas por hoy' })
    expect(t.get('gifts', g.id)).toMatchObject({ status: 'enviado', orderId: null })
    t.ok({ type: 'cart/add', ...MC, itemId: 'MC-12', qty: 1, selections: FRITAS, giftCode: g.code })
    oid = enviar(t)
    t.ok({ type: 'order/cancel', orderId: oid, reason: 'Me equivoqué de mesa' })
    expect(t.get('gifts', g.id).status).toBe('enviado')
    expect(validateState(t.s)).toEqual([])
  })

  it('cuenta: la línea regalada cubierta no queda pendiente y el pago por ítems cobra solo lo debido', () => {
    const t = T.seed()
    const g = regalo(t)
    t.at(MON, 12, 30)
    t.ok({ type: 'cash/open', ...MC, openingFloatCents: 0 })
    t.ok({ type: 'cart/add', ...MC, itemId: 'MC-12', qty: 1, selections: FRITAS, giftCode: g.code })
    t.ok({ type: 'cart/add', ...MC, itemId: 'MC-24', qty: 1, selections: {} })
    const oid = enviar(t)
    for (const c of ['accept', 'prepare', 'ready', 'deliver']) t.ok({ type: `order/${c}`, orderId: oid })
    const o = t.get('orders', oid)
    const dessert = o.lines.find((l: any) => !l.giftId)
    expect(sessionBalance(t.s, o.sessionId)).toBe(dessert.lineCents)
    t.ok({ type: 'pay/register', sessionId: o.sessionId, operationId: 'pay-g', amountCents: dessert.lineCents, method: 'efectivo', lineIds: [dessert.id] }, 'caja')
    expect(sessionBalance(t.s, o.sessionId)).toBe(0)
    t.ok({ type: 'session/close', sessionId: o.sessionId }, 'caja')
    expect(validateState(t.s)).toEqual([])
  })

  it('cancelar con motivo quita la línea del pedido sin enviar; vencida a los 30 días simulados', () => {
    const t = T.seed()
    const g = regalo(t)
    t.at(MON, 12, 30)
    t.ok({ type: 'cart/add', ...MC, itemId: 'MC-12', qty: 1, selections: FRITAS, giftCode: g.code })
    t.fail({ type: 'gift/cancel', giftId: g.id, reason: ' ' }, 'motivo-requerido')
    t.ok({ type: 'gift/cancel', giftId: g.id, reason: 'Se equivocó de plato' })
    expect(t.get('carts', CART).lines).toHaveLength(0)
    t.fail({ type: 'cart/add', ...MC, itemId: 'MC-12', qty: 1, selections: FRITAS, giftCode: g.code }, 'regalo-cancelado')

    const g2 = regalo(t, 'op-g2')
    for (let i = 0; i < 5; i++) t.ok({ type: 'clock/advance', minutes: 7 * 24 * 60 })
    expect(giftStatus(t.get('gifts', g2.id), t.s.clock.nowMs)).toBe('vencido')
    t.fail({ type: 'cart/add', ...MC, itemId: 'MC-12', qty: 1, selections: FRITAS, giftCode: g2.code }, 'regalo-vencido')
    t.fail({ type: 'gift/cancel', giftId: g2.id, reason: 'tarde' }, 'estado-invalido')
    expect(validateState(t.s)).toEqual([])
  })
})
