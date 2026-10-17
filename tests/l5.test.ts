import { describe, expect, it } from 'vitest'
import { makeSeed } from '../src/domain/fixtures'
import { migrate } from '../src/domain/persistence'
import { orderPayment } from '../src/domain/sessions'
import { validateState } from '../src/domain/validate'
import { BIZ_IDS, BIZ_PREFIX } from '../src/domain/business'
import { SCHEMA_VERSION, type AppState, type BusinessId } from '../src/domain/types'
import { T } from './helpers'

// P5-L5 · cinco negocios, esquema 3, pago en el local y aislamiento por businessId.
const NEW: BusinessId[] = ['copo', 'compas', 'brasa']

/** Arma un pedido de retiro completo por los comandos públicos y devuelve su id. */
function pickup(t: T, businessId: BusinessId, locationId: string, lines: { itemId: string; selections?: Record<string, string[]> }[], startMin: number, alias = 'Prueba') {
  const cartId = `CART-${locationId}`
  for (const l of lines) t.ok({ type: 'cart/add', businessId, locationId, itemId: l.itemId, qty: 1, selections: l.selections ?? {} }, 'cliente-invitado')
  t.ok({ type: 'cart/setFulfillment', cartId, fulfillment: { kind: 'retiro', startMin }, alias }, 'cliente-invitado')
  const op = (t.ok({ type: 'cart/begin', cartId }, 'cliente-invitado').data as { operationId: string }).operationId
  return (t.ok({ type: 'order/submit', cartId, operationId: op }, 'cliente-invitado').data as { orderId: string }).orderId
}

describe('NEG-01 · cinco negocios con fixtures estables', () => {
  const s = makeSeed('servicio')
  it('los cinco perfiles existen, con sede, horario y carta propia; la semilla es válida y determinista', () => {
    expect(s.businesses.map((b) => b.id).sort()).toEqual([...BIZ_IDS].sort())
    for (const b of BIZ_IDS) {
      expect(s.locations.some((l) => l.businessId === b), b).toBe(true)
      expect(s.serviceWindows.some((w) => w.businessId === b), b).toBe(true)
      expect(s.menuItems.filter((m) => m.businessId === b).length, b).toBeGreaterThanOrEqual(8)
    }
    expect(validateState(s)).toEqual([])
    expect(JSON.stringify(makeSeed('servicio'))).toBe(JSON.stringify(s))
  })
  it('cada negocio nuevo trae actividad en el comercio: pedidos en curso o reservas por revisar', () => {
    expect(s.orders.filter((o) => o.businessId === 'brasa').map((o) => o.status).sort()).toEqual(['cerrado', 'en_preparacion', 'enviado'].sort())
    expect(s.orders.filter((o) => o.businessId === 'copo').map((o) => o.status).sort()).toEqual(['aceptado', 'listo'])
    expect(s.reservations.filter((r) => r.businessId === 'compas').map((r) => r.status).sort()).toEqual(['confirmada', 'confirmada', 'revision_humana'])
  })
  it('los negocios nuevos numeran aparte y los folios de Mesa Clara y Ritual Café no se mueven (R-019, O-013)', () => {
    for (const b of NEW) for (const o of s.orders.filter((x) => x.businessId === b)) expect(o.id).toMatch(new RegExp(`^O-${BIZ_PREFIX[b]}-\\d{3}$`))
    expect(s.reservations.filter((r) => r.businessId === 'compas').every((r) => r.id.startsWith('R-TC-'))).toBe(true)
    expect(s.counters.R).toBe(18)
    expect(s.counters.O).toBe(12)
  })
  it('los conteos que muestra el reinicio del dock son los de la semilla (21 reservas, 17 pedidos, 14 clientes)', () => {
    expect(s.reservations).toHaveLength(21)
    expect(s.orders).toHaveLength(17)
    expect(s.customers.filter((c) => !c.mergedInto)).toHaveLength(14)
  })
  it('bebidas con alcohol solo en el bar, marcadas +18 y fuera de los regalos de temporada', () => {
    const alc = s.menuItems.filter((m) => m.tags?.includes('+18'))
    expect(alc.map((m) => m.id).sort()).toEqual(['TC-13', 'TC-14'])
  })
})

describe('NEG-02 · café + medialunas para retirar y pagar en el local', () => {
  it('aceptado ≠ pagado: el pedido queda confirmado con pago pendiente hasta que caja registra el cobro', () => {
    const t = T.seed()
    const id = pickup(t, 'ritual-cafe', 'L-RC-centro', [
      { itemId: 'RC-15', selections: { 'MG-leche': ['le-entera'] } },
      { itemId: 'RC-18', selections: { 'MG-relleno': ['re-jyq'] } },
      { itemId: 'RC-11' },
    ], 630, 'Marta')
    const o = () => t.get('orders', id)
    expect(o().status).toBe('enviado')
    expect(orderPayment(t.s, o()).state).toBe('pendiente-local')
    t.ok({ type: 'order/accept', orderId: id }, 'cocina')
    expect(o().status).toBe('aceptado')
    expect(orderPayment(t.s, o())).toEqual({ state: 'pendiente-local', balanceCents: o().totalCents })
    // preparar, tener listo y entregar no cobran nada
    t.ok({ type: 'order/prepare', orderId: id }, 'cocina')
    t.ok({ type: 'order/ready', orderId: id }, 'cocina')
    expect(orderPayment(t.s, o()).state).toBe('pendiente-local')
    expect(t.s.payments.some((p) => p.sessionId === o().sessionId)).toBe(false)
    // solo el registro en caja (simulado) lo pasa a pagado
    const cash = t.s.cashSessions.find((c) => c.businessId === 'ritual-cafe' && c.status === 'abierta')
    expect(cash, 'la caja de Ritual está abierta en la semilla').toBeTruthy()
    t.ok({ type: 'pay/register', sessionId: o().sessionId, operationId: 'l5-pay', amountCents: o().totalCents, method: 'efectivo' }, 'caja')
    expect(orderPayment(t.s, o()).state).toBe('pagado')
  })
  it('un pedido rechazado no queda como deuda', () => {
    const t = T.seed()
    const id = pickup(t, 'ritual-cafe', 'L-RC-centro', [{ itemId: 'RC-18' }], 645)
    t.ok({ type: 'order/reject', orderId: id, reason: 'prueba' }, 'cocina')
    expect(orderPayment(t.s, t.get('orders', id)).state).toBe('no-aplica')
  })
})

describe('NEG-03 · reglas de cada negocio', () => {
  it('Copo: el cupo de gustos depende del formato y un gusto agotado no se puede elegir', () => {
    const t = T.seed()
    t.fail({ type: 'cart/add', businessId: 'copo', locationId: 'L-CO-mostrador', itemId: 'CO-02', qty: 1, selections: { 'MG-CO-gustos-2': ['hg-frutilla', 'hg-ddl', 'hg-choco'] } }, 'seleccion-invalida', 'cliente-invitado')
    t.fail({ type: 'cart/add', businessId: 'copo', locationId: 'L-CO-mostrador', itemId: 'CO-02', qty: 1, selections: { 'MG-CO-gustos-2': [] } }, 'seleccion-invalida', 'cliente-invitado')
    t.fail({ type: 'cart/add', businessId: 'copo', locationId: 'L-CO-mostrador', itemId: 'CO-01', qty: 1, selections: { 'MG-CO-gustos-1': ['hg-sambayon'] } }, undefined, 'cliente-invitado')
    t.ok({ type: 'cart/add', businessId: 'copo', locationId: 'L-CO-mostrador', itemId: 'CO-06', qty: 1, selections: { 'MG-CO-gustos-k': ['hg-frutilla', 'hg-ddl', 'hg-choco', 'hg-limon'] } }, 'cliente-invitado')
  })
  it('Brasa: el combo exige tamaño, acompañamiento y bebida; el pedido sale con número de retiro y va a plancha', () => {
    const t = T.seed()
    t.fail({ type: 'cart/add', businessId: 'brasa', locationId: 'L-BR-centro', itemId: 'BR-01', qty: 1, selections: { 'MG-BR-combo': ['bc-mediano'] } }, 'seleccion-invalida', 'cliente-invitado')
    const id = pickup(t, 'brasa', 'L-BR-centro', [{ itemId: 'BR-01', selections: { 'MG-BR-combo': ['bc-mediano'], 'MG-BR-acomp': ['ba-papas'], 'MG-BR-bebida': ['bb-agua'] } }], 10 * 60 + 30)
    const o = t.get('orders', id)
    expect(id).toMatch(/^O-BR-\d{3}$/)
    expect(o.pickupCode).toMatch(/^\d{3}$/)
    expect(o.lines[0].station).toBe('plancha')
    expect(orderPayment(t.s, o).state).toBe('pendiente-local')
    expect(t.s.counters.O).toBe(12) // no corre los folios del bodegón y el café
  })
  it('Taberna Compás: reserva para la noche de jazz; la mesa grande va a revisión humana', () => {
    const s = makeSeed('servicio')
    const big = s.reservations.find((r) => r.businessId === 'compas' && r.party >= 10)!
    expect(big.status).toBe('revision_humana')
  })
})

describe('NEG-06 · alcohol fuera de regalos y de la zona familiar', () => {
  it('no se puede crear una invitación por una bebida +18', () => {
    const t = T.seed()
    t.fail({ type: 'gift/create', businessId: 'compas', itemId: 'TC-13', fromAlias: 'Lu', toAlias: 'Sol', message: 'Salud', operationId: 'g-alc' }, 'validacion', 'cliente-invitado')
    t.ok({ type: 'gift/create', businessId: 'compas', itemId: 'TC-09', fromAlias: 'Lu', toAlias: 'Sol', message: 'Una limonada', operationId: 'g-ok' }, 'cliente-invitado')
  })
  it('las temporadas nunca sugieren regalar alcohol', async () => {
    const { SEASON_IDS, seasonById } = await import('../src/domain/season')
    const alc = new Set(makeSeed('servicio').menuItems.filter((m) => m.tags?.includes('+18')).map((m) => m.id))
    for (const id of SEASON_IDS) for (const item of Object.values(seasonById(id).picks).flat()) expect(alc.has(item), `${id} ${item}`).toBe(false)
  })
})

describe('NEG-04 · aislamiento por businessId', () => {
  const s = makeSeed('servicio')
  it('cada registro referencia solo entidades de su propio negocio', () => {
    const biz = (coll: { id: string; businessId: string }[]) => new Map(coll.map((x) => [x.id, x.businessId]))
    const items = biz(s.menuItems), locs = biz(s.locations), sess = biz(s.tableSessions), custs = biz(s.customers)
    for (const o of s.orders) {
      expect(locs.get(o.locationId), o.id).toBe(o.businessId)
      expect(sess.get(o.sessionId), o.id).toBe(o.businessId)
      for (const l of o.lines) expect(items.get(l.itemId), `${o.id} ${l.itemId}`).toBe(o.businessId)
      if (o.customerId) expect(custs.get(o.customerId), o.id).toBe(o.businessId)
    }
    for (const t of s.tickets) expect(s.orders.find((o) => o.id === t.orderId)?.businessId, t.id).toBe(t.businessId)
    for (const p of s.payments) expect(sess.get(p.sessionId), p.id).toBe(p.businessId)
    for (const m of s.stockMovements) expect(s.ingredients.find((i) => i.id === m.ingredientId)?.businessId, m.id).toBe(m.businessId)
  })
  it('no se puede pedir un plato de otro negocio ni retirar en una sede ajena', () => {
    const t = T.seed()
    t.fail({ type: 'cart/add', businessId: 'brasa', locationId: 'L-BR-centro', itemId: 'CO-01', qty: 1, selections: {} }, 'item-inexistente', 'cliente-invitado')
    t.fail({ type: 'cart/add', businessId: 'copo', locationId: 'L-CO-mostrador', itemId: 'RC-11', qty: 1, selections: {} }, 'item-inexistente', 'cliente-invitado')
  })
  it('un pedido en Copo no aparece en las vistas de otro negocio', () => {
    const t = T.seed()
    const id = pickup(t, 'copo', 'L-CO-mostrador', [{ itemId: 'CO-01', selections: { 'MG-CO-gustos-1': ['hg-limon'] } }], 10 * 60 + 30)
    for (const b of BIZ_IDS.filter((x) => x !== 'copo')) expect(t.s.orders.filter((o) => o.businessId === b).some((o) => o.id === id)).toBe(false)
    expect(validateState(t.s)).toEqual([])
  })
})

describe('NEG-05 · migración explícita desde la versión detectada', () => {
  /** Un guardado v2 real: solo los dos negocios de P2/P4, sin paysAtCounter ni claves de los negocios nuevos. */
  function v2Save(): AppState {
    const s = JSON.parse(JSON.stringify(makeSeed('servicio'))) as AppState & Record<string, unknown>
    const legacy = (x: { businessId?: string; id?: string }) => x.businessId === 'mesa-clara' || x.businessId === 'ritual-cafe'
    for (const [k, v] of Object.entries(s)) if (Array.isArray(v) && v.every((x) => x && typeof x === 'object' && 'businessId' in x)) (s as Record<string, unknown>)[k] = v.filter(legacy)
    s.businesses = s.businesses.filter((b) => b.id === 'mesa-clara' || b.id === 'ritual-cafe').map(({ paysAtCounter: _p, ...b }) => b as never)
    s.menuItems = s.menuItems.filter((m) => !['RC-15', 'RC-16', 'RC-17', 'RC-18'].includes(m.id))
    s.modifierGroups = s.modifierGroups.filter((g) => g.id !== 'MG-relleno')
    for (const k of Object.keys(s.counters)) if (k.includes('@')) delete s.counters[k]
    for (const m of [s.session.locationByBusiness, s.session.customerByBusiness, s.settings.seasonByBusiness] as Record<string, unknown>[]) for (const b of NEW) delete m[b]
    s.schemaVersion = 2 as never
    return s
  }
  it('el esquema vigente es 3 (la versión detectada antes de L5 era 2)', () => {
    expect(SCHEMA_VERSION).toBe(3)
  })
  it('v2 → v3 suma los tres negocios y los cuatro clásicos del café sin tocar lo existente', () => {
    const old = v2Save()
    const r = migrate(JSON.parse(JSON.stringify(old)), 2)
    expect(r.ok).toBe(true)
    if (!r.ok) return
    const s = r.state as AppState
    expect(s.schemaVersion).toBe(3)
    expect(validateState(s)).toEqual([])
    expect(s.businesses.map((b) => b.id).sort()).toEqual([...BIZ_IDS].sort())
    expect(s.businesses.find((b) => b.id === 'ritual-cafe')!.paysAtCounter).toBe(true)
    expect(s.businesses.find((b) => b.id === 'mesa-clara')!.paysAtCounter).toBe(false)
    for (const id of ['RC-15', 'RC-18', 'CO-01', 'TC-01', 'BR-01']) expect(s.menuItems.some((m) => m.id === id), id).toBe(true)
    // lo que el usuario ya tenía sigue igual
    expect(s.orders).toEqual(old.orders)
    expect(s.reservations).toEqual(old.reservations)
    expect(s.payments).toEqual(old.payments)
    expect(s.counters.O).toBe(old.counters.O)
    expect(s.session.locationByBusiness.copo).toBe('L-CO-mostrador')
    expect(s.settings.seasonByBusiness.brasa).toBe('auto')
  })
  it('es idempotente: migrar dos veces no duplica registros', () => {
    const once = migrate(v2Save(), 2)
    if (!once.ok) throw new Error('migración')
    const s = once.state as AppState
    const twice = migrate({ ...JSON.parse(JSON.stringify(s)), schemaVersion: 2 }, 2)
    if (!twice.ok) throw new Error('migración')
    expect((twice.state as AppState).menuItems.length).toBe(s.menuItems.length)
    expect((twice.state as AppState).businesses.length).toBe(5)
  })
})
