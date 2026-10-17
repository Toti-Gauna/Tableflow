import { describe, expect, it } from 'vitest'
import { MAX_LAYERS, MOTION_BOUNDS, orderMotionPlan, reservationMotionPlan, timelineFor } from '../src/domain/motion-plan'
import type { BusinessId, Order, OrderLine } from '../src/domain/types'
import { T } from './helpers'

// P5-L8 · La composición sale del contenido real del pedido; la animación solo la reproduce.
const ALL = () => true
const NONE = () => false
let n = 0
function line(itemId: string, name: string, qty = 1, selections: [groupId: string, optionId: string, optionName: string][] = []): OrderLine {
  return { id: `L-${++n}`, itemId, name, qty, unitCents: 100, lineCents: 100 * qty, station: 'cocina', note: '', selections: selections.map(([groupId, optionId, optionName]) => ({ groupId, groupName: groupId, optionId, optionName, deltaCents: 0 })) }
}
function order(t: T, businessId: BusinessId, lines: OrderLine[], status: Order['status'] = 'aceptado'): Order {
  const base = t.s.orders[0]
  return { ...base, id: `O-TEST-${++n}`, businessId, lines, status, kind: 'retiro', pickupCode: '042', sessionId: 'SES-NOPE', ticketId: 'K-TEST' }
}

describe('MO · cuándo hay animación', () => {
  it('solo con el pedido aceptado (o más adelante); enviado, rechazado o cancelado no animan', () => {
    const t = T.seed()
    const l = [line('RC-03', 'Cortado')]
    for (const st of ['enviado', 'rechazado', 'cancelado'] as const) expect(orderMotionPlan(t.s, order(t, 'ritual-cafe', l, st), ALL)).toBeNull()
    for (const st of ['aceptado', 'en_preparacion', 'listo', 'retirado'] as const) expect(orderMotionPlan(t.s, order(t, 'ritual-cafe', l, st), ALL)?.id).toBe('MO-CAF')
  })
  it('calcular el plan no cambia el estado (reproducir no crea ni cobra nada)', () => {
    const t = T.seed()
    const before = JSON.stringify(t.s)
    orderMotionPlan(t.s, order(t, 'brasa', [line('BR-01', 'Combo Doble con cheddar')]), ALL)
    expect(JSON.stringify(t.s)).toBe(before)
  })
  it('la duración queda entre 1 y 3 segundos con 1 o con el máximo de capas', () => {
    for (const k of [1, 3, MAX_LAYERS, 20]) {
      const tl = timelineFor(k, 'apilar')
      expect(tl.totalMs).toBeGreaterThanOrEqual(MOTION_BOUNDS.minMs)
      expect(tl.totalMs).toBeLessThanOrEqual(MOTION_BOUNDS.maxMs)
    }
    expect(timelineFor(1, 'ninguno').motifMs).toBe(0)
  })
})

describe('MO-CAF · café + medialunas', () => {
  it('capas de medialuna, dorado y vapor sobre el café pedido; termina en ticket con "pago en el local pendiente"', () => {
    const t = T.seed()
    t.s.session.customerByBusiness['ritual-cafe'] = 'CL-006'
    t.ok({ type: 'cart/add', businessId: 'ritual-cafe', locationId: 'L-RC-centro', itemId: 'RC-11', qty: 2, selections: {} }, 'cliente-recurrente')
    t.ok({ type: 'cart/add', businessId: 'ritual-cafe', locationId: 'L-RC-centro', itemId: 'RC-03', qty: 1, selections: { 'MG-leche': ['le-entera'] } }, 'cliente-recurrente')
    t.ok({ type: 'cart/setFulfillment', cartId: 'CART-L-RC-centro', fulfillment: { kind: 'retiro', startMin: 10 * 60 + 45 }, alias: 'Ana' }, 'cliente-recurrente')
    const op = (t.ok({ type: 'cart/begin', cartId: 'CART-L-RC-centro' }, 'cliente-recurrente').data as { operationId: string }).operationId
    const id = (t.ok({ type: 'order/submit', cartId: 'CART-L-RC-centro', operationId: op }, 'cliente-recurrente').data as { orderId: string }).orderId
    expect(orderMotionPlan(t.s, t.get('orders', id), ALL)).toBeNull() // enviado: todavía no
    t.ok({ type: 'order/accept', orderId: id })
    const o = t.get('orders', id)
    const p = orderMotionPlan(t.s, o, ALL)!
    expect(p.motif).toBe('dorado-y-vapor')
    expect(p.layers.map((x) => x.key)).toEqual(['RC-11', 'RC-11', 'acabado:dorado', 'RC-03'])
    expect(p.ending.kind).toBe('ticket')
    expect(p.ending.number).toBe(o.pickupCode)
    expect(p.ending.payNote).toBe('Pago en el local pendiente')
    expect(p.label).toContain('Medialuna de manteca')
    expect(p.label).toContain('pago en el local pendiente')
  })
  it('un cold brew no humea; sin medialuna no hay dorado', () => {
    const t = T.seed()
    expect(orderMotionPlan(t.s, order(t, 'ritual-cafe', [line('RC-09', 'Cold brew')]), ALL)!.motif).toBe('ninguno')
    expect(orderMotionPlan(t.s, order(t, 'ritual-cafe', [line('RC-05', 'Cappuccino')]), ALL)!.motif).toBe('vapor')
  })
})

describe('MO-HEL · los gustos elegidos forman el helado', () => {
  it('las bochas son las elegidas, en orden, sobre el formato pedido; el comprobante nombra los gustos', () => {
    const t = T.seed()
    const p = orderMotionPlan(t.s, order(t, 'copo', [line('CO-02', 'Cucurucho · 2 gustos', 1, [['MG-CO-gustos-2', 'hg-pistacho', 'Pistacho'], ['MG-CO-gustos-2', 'hg-ddl', 'Dulce de leche granizado'], ['MG-CO-bano', 'hb-chocolate', 'Baño de chocolate']])]), ALL)!
    expect(p.container).toBe('cucurucho')
    expect(p.layers.filter((x) => x.role === 'bocha').map((x) => x.key)).toEqual(['H-bacha-pistacho', 'H-bacha-ddl'])
    expect(p.layers.some((x) => x.label === 'Baño de chocolate')).toBe(true)
    expect(p.motif).toBe('apilar')
    expect(p.ending.lines[0]).toBe('1× Cucurucho · 2 gustos: Pistacho, Dulce de leche granizado')
  })
  it('un pote se arma como pote', () => {
    const t = T.seed()
    expect(orderMotionPlan(t.s, order(t, 'copo', [line('CO-05', 'Pote de ½ kg', 1, [['MG-CO-gustos-m', 'hg-limon', 'Limón']])]), ALL)!.container).toBe('pote')
  })
})

describe('MO-FR · los ingredientes reales del combo', () => {
  it('se ensamblan respetando lo que se sacó y lo que se agregó; termina en el número de retiro', () => {
    const t = T.seed()
    const p = orderMotionPlan(t.s, order(t, 'brasa', [line('BR-01', 'Combo Doble con cheddar', 1, [['MG-BR-acomp', 'ba-papas', 'Papas'], ['MG-BR-bebida', 'bb-cola', 'Gaseosa línea cola'], ['MG-BR-sin', 'bs-cebolla', 'Sin cebolla'], ['MG-BR-sin', 'bs-pepino', 'Sin pepino'], ['MG-BR-extras', 'be-panceta', 'Panceta']])]), ALL)!
    const ing = p.layers.filter((x) => x.role === 'ingrediente').map((x) => x.key.replace('jg-rapida-', ''))
    expect(ing).toEqual(['pan-abajo', 'carne', 'queso', 'carne', 'queso', 'pan-arriba'])
    expect(p.layers.some((x) => x.key === 'BR-06')).toBe(true)
    expect(p.layers.some((x) => x.key === 'BR-08')).toBe(true)
    expect(p.motif).toBe('ensamblar')
    expect(p.ending).toMatchObject({ kind: 'numero', number: '042' })
    expect(p.omitted.join(' ')).toMatch(/panceta/)
    expect(p.omitted.join(' ')).toMatch(/sin cebolla, pepino/)
  })
  it('doble cheddar agrega una feta antes de la tapa; lo que no entra se nombra y no se anima', () => {
    const t = T.seed()
    const p = orderMotionPlan(t.s, order(t, 'brasa', [line('BR-04', 'Doble con cheddar', 1, [['MG-BR-extras', 'be-cheddar', 'Doble cheddar']]), line('BR-07', 'Nuggets'), line('BR-09', 'Agua')]), ALL)!
    expect(p.layers.length).toBe(MAX_LAYERS)
    expect(p.omitted.some((x) => x.includes('sin lugar'))).toBe(true)
  })
})

describe('MO-RES y MO-BAR', () => {
  it('restaurante: el plato principal sobre la loza con cubiertos; el vino no se anima', () => {
    const t = T.seed()
    const p = orderMotionPlan(t.s, order(t, 'mesa-clara', [line('MC-28', 'Vino de la casa (copa)'), line('MC-12', 'Milanesa de ternera'), line('MC-26', 'Agua mineral')]), ALL)!
    expect(p.layers.map((x) => x.key)).toEqual(['contenedor:loza', 'MC-12', 'MC-26', 'cubierto:tenedor-cuchillo'])
    expect(p.omitted.join(' ')).toMatch(/Vino de la casa.*con alcohol/)
    expect(p.ending.lines).toContain('1× Vino de la casa (copa)')
  })
  it('sin pieza de arte → glifo de su categoría (nunca una pieza inventada)', () => {
    const t = T.seed()
    const p = orderMotionPlan(t.s, order(t, 'mesa-clara', [line('MC-12', 'Milanesa de ternera'), line('MC-27', 'Gaseosa línea cola')]), NONE)!
    expect(p.layers.map((x) => x.key)).toEqual(['contenedor:loza', 'glyph:plate', 'glyph:glass', 'cubierto:tenedor-cuchillo'])
  })
  it('bar: tapas en la tabla y bebida sin alcohol; vermut y cerveza solo como texto', () => {
    const t = T.seed()
    const p = orderMotionPlan(t.s, order(t, 'compas', [line('TC-01', 'Patatas bravas'), line('TC-02', 'Croquetas de jamón (4)'), line('TC-13', 'Vermut de la casa'), line('TC-09', 'Limonada con menta (sin alcohol)')]), ALL)!
    expect(p.layers.map((x) => x.key)).toEqual(['contenedor:tabla', 'TC-01', 'TC-02', 'TC-09'])
    expect(p.motif).toBe('armar-tabla')
    expect(JSON.stringify(p.layers)).not.toMatch(/TC-13|TC-14/)
    const solo = orderMotionPlan(t.s, order(t, 'compas', [line('TC-14', 'Cerveza tirada')]), ALL)!
    expect(solo.layers.map((x) => x.key)).toEqual(['glyph:plate'])
    expect(solo.motif).toBe('ninguno')
  })
  it('reserva confirmada de Mesa Clara: la mesa se prepara para hasta 6 y termina en el folio', () => {
    const t = T.seed()
    const r = t.s.reservations.find((x) => x.businessId === 'mesa-clara' && x.status === 'confirmada')!
    const p = reservationMotionPlan(t.s, { ...r, party: 8 })!
    expect(p.motif).toBe('preparar-mesa')
    expect(p.layers.filter((x) => x.key === 'mesa:cubierto')).toHaveLength(6)
    expect(p.ending).toMatchObject({ kind: 'folio', number: r.id })
    expect(p.omitted[0]).toMatch(/6 lugares de 8/)
    expect(reservationMotionPlan(t.s, { ...r, status: 'solicitada' })).toBeNull()
  })
})
