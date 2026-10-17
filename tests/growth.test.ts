import { describe, expect, it } from 'vitest'
import { makeSeed } from '../src/domain/fixtures'
import { migrate } from '../src/domain/persistence'
import { validateState } from '../src/domain/validate'
import { orderDue } from '../src/domain/sessions'
import { breakEven, campaignDays, campaignResults, contribution, customerStats, itemContribution, missingCosts, projectCampaign, unitCost } from '../src/domain/growth'
import type { AppState, BusinessId, Campaign } from '../src/domain/types'
import { T } from './helpers'

// P5-L6 · Fidelización, campañas, reglas y costos.
const camp = (t: T, name: string) => t.s.campaigns.find((c) => c.name === name)!
const benefitOf = (t: T, campaignId: string, customerId: string) => t.s.benefits.find((b) => b.campaignId === campaignId && b.customerId === customerId)

/** Pedido de retiro como un cliente identificado (sesión de demo), con un código de beneficio opcional. */
function order(t: T, biz: BusinessId, loc: string, customerId: string, lines: { itemId: string; qty?: number; selections?: Record<string, string[]> }[], code?: string, startMin = 10 * 60 + 45) {
  t.s.session.customerByBusiness[biz] = customerId
  const cartId = `CART-${loc}`
  for (const l of lines) t.ok({ type: 'cart/add', businessId: biz, locationId: loc, itemId: l.itemId, qty: l.qty ?? 1, selections: l.selections ?? {} }, 'cliente-recurrente')
  t.ok({ type: 'cart/setFulfillment', cartId, fulfillment: { kind: 'retiro', startMin }, alias: 'Cliente' }, 'cliente-recurrente')
  if (code) t.ok({ type: 'cart/setBenefit', cartId, code }, 'cliente-recurrente')
  const op = (t.ok({ type: 'cart/begin', cartId }, 'cliente-recurrente').data as { operationId: string }).operationId
  return t.run({ type: 'order/submit', cartId, operationId: op }, 'cliente-recurrente')
}

describe('GR-CALC · fórmulas (casos del manual)', () => {
  it('precio 100, costo 60, variables 5 → contribución 35', () => {
    const c = contribution({ priceCents: 10000, productCents: 6000, variableCents: 500 })
    expect(c.contributionCents).toBe(3500)
    expect(c.netCents).toBe(10000)
    expect(c.pct).toBeCloseTo(0.35, 5)
  })
  it('descuento 10 → ingreso neto 90, contribución 25, 27,8 %', () => {
    const c = contribution({ priceCents: 10000, discountCents: 1000, productCents: 6000, variableCents: 500 })
    expect(c.netCents).toBe(9000)
    expect(c.contributionCents).toBe(2500)
    expect(Math.round(c.pct! * 1000) / 10).toBe(27.8)
  })
  it('costo fijo 100 → 4 pedidos para cubrirlo (sin duplicar el fijo en la unitaria)', () => {
    expect(breakEven(10000, 2500)).toBe(4)
    expect(breakEven(10000, 3500)).toBe(3)
  })
  it('contribución ≤ 0: sin equilibrio por volumen', () => {
    expect(breakEven(10000, 0)).toBeNull()
    expect(breakEven(10000, -500)).toBeNull()
    expect(contribution({ priceCents: 10000, discountCents: 4000, productCents: 6000, variableCents: 500 }).contributionCents).toBe(-500)
  })
  it('las devoluciones también se descuentan del ingreso neto; ingreso 0 no tiene porcentaje', () => {
    expect(contribution({ priceCents: 10000, refundCents: 2000, productCents: 6000, variableCents: 0 }).contributionCents).toBe(2000)
    expect(contribution({ priceCents: 1000, discountCents: 1000, productCents: 0, variableCents: 0 }).pct).toBeNull()
  })
})

describe('GR-D · costos por ítem, variante, extra y combo; ND sin inventar', () => {
  const s = makeSeed('servicio')
  const item = (id: string) => s.menuItems.find((m) => m.id === id)!
  it('el costo suma los extras con costo propio; un extra en ND deja el total en ND', () => {
    expect(unitCost(s, item('RC-04'), ['ta-mediano', 'le-vegetal'])).toEqual({ productCents: 150000 + 25000 + 30000, variableCents: 30000, missing: [] })
    const nd = unitCost(s, item('BR-03'), ['bp-sintacc'])
    expect(nd.productCents).toBeNull()
    expect(nd.missing).toEqual(['costo del extra Pan sin TACC (cocina compartida)'])
  })
  it('combo con su tamaño grande suma la variante', () => {
    expect(unitCost(s, item('BR-01'), ['bc-grande']).productCents).toBe(620000 + 60000)
  })
  it('los ítems sin costo cargado figuran como faltantes y su contribución es ND', () => {
    const miss = missingCosts(s, 'compas').items.map((m) => m.id)
    expect(miss).toEqual(['TC-05', 'TC-06'])
    expect(itemContribution(s, item('TC-05'))).toBeNull()
    expect(itemContribution(s, item('TC-01'))!.contributionCents).toBe(790000 - 230000 - 24000)
  })
  it('cost/set solo lo hace el encargado; vacío = ND', () => {
    const t = T.seed()
    t.fail({ type: 'cost/set', itemId: 'TC-05', costCents: 300000, variableCents: 36000 }, 'rol-sin-permiso', 'caja')
    t.ok({ type: 'cost/set', itemId: 'TC-05', costCents: 300000, variableCents: 36000 })
    expect(missingCosts(t.s, 'compas').items.map((m) => m.id)).toEqual(['TC-06'])
    t.ok({ type: 'cost/set', itemId: 'TC-05', costCents: null, variableCents: 36000 })
    expect(missingCosts(t.s, 'compas').items.map((m) => m.id)).toEqual(['TC-05', 'TC-06'])
  })
})

describe('GR-A · cliente e historial', () => {
  const s = makeSeed('servicio')
  const st = (id: string) => customerStats(s, s.customers.find((c) => c.id === id)!)
  it('recencia, frecuencia y afinidad combinan el historial sintético con los pedidos reales', () => {
    const lucia = st('CL-007')
    expect(lucia.hasHistory).toBe(true)
    expect(lucia.recencyDays).toBe(0) // pidió hoy en la semilla
    expect(lucia.orders90).toBeGreaterThan(4)
    expect(lucia.topItems[0].id).toBe('RC-07')
  })
  it('segmentos: frecuentes, a reactivar, nuevos y con beneficio sin usar', () => {
    expect(st('CL-003').segments).toContain('frecuentes')
    expect(st('CL-002').segments).toContain('inactivos')
    expect(st('CL-010').segments).toContain('nuevos')
    expect(st('CL-006').segments).toContain('con-beneficio-sin-usar') // Ana recibió la merienda de la semana
  })
  it('sellos de muestra solo en Copo y Brasa (el premio requiere aprobación del negocio)', () => {
    expect(st('CL-009').stamps).toBe(3)
    expect(st('CL-006').stamps).toBeNull()
  })
})

describe('GR-B/C · ciclo de campaña completo', () => {
  it('semilla: cada campaña en un punto distinto del ciclo', () => {
    const s = makeSeed('servicio')
    const by = (n: string) => s.campaigns.find((c) => c.name === n)!.status
    expect(by('Merienda de la semana')).toBe('activa')
    expect(by('Volvé al bodegón')).toBe('aprobada')
    expect(by('Fiestas en el bodegón')).toBe('programada')
    expect(by('Kilo para la familia')).toBe('borrador')
    expect(by('Bienvenida a la brasa')).toBe('activa')
    expect(by('Martes de tapas')).toBe('programada')
    expect(validateState(s)).toEqual([])
  })
  it('faltan costos → la proyección marca ND y no se puede aprobar (queda en borrador)', () => {
    const t = T.seed()
    const c = camp(t, 'Kilo para la familia')
    const p = projectCampaign(t.s, c)
    expect(p.complete).toBe(false)
    expect(p.missing).toContain('costo de Pote de 1 kg')
    expect(p.breakEvenOrders).toBeNull()
    expect(p.withDiscount).toBeNull()
    t.fail({ type: 'campaign/approve', campaignId: c.id }, 'datos-faltantes')
    t.ok({ type: 'cost/set', itemId: 'CO-06', costCents: 820000, variableCents: 70000 })
    expect(projectCampaign(t.s, camp(t, 'Kilo para la familia')).complete).toBe(true)
    t.ok({ type: 'campaign/approve', campaignId: c.id })
  })
  it('proyección antes de activar: audiencia, descuento, costo máximo, contribución y equilibrio', () => {
    const t = T.seed()
    const p = projectCampaign(t.s, camp(t, 'Volvé al bodegón'))
    // milanesa 18.500, costo 6.900, variables 560, descuento 3.000
    expect(p.discountPerOrderCents).toBe(300000)
    expect(p.withoutDiscount!.contributionCents).toBe(1850000 - 690000 - 56000)
    expect(p.withDiscount!.contributionCents).toBe(1850000 - 300000 - 690000 - 56000)
    expect(p.breakEvenOrders).toBe(Math.ceil(1500000 / (1850000 - 300000 - 690000 - 56000)))
    expect(p.maxCostCents).toBe(Math.min(9000000, 30 * 300000) + 1500000)
    expect(p.audience.included.map((c) => c.id)).toEqual(['CL-004']) // Bruno es inactivo pero sin consentimiento promocional
    expect(p.audience.excluded.map((x) => [x.customer.id, x.reason])).toEqual([['CL-002', 'sin consentimiento promocional']])
    expect(p.expectedOrders).toBe(0)
  })
  it('activar emite beneficios solo con consentimiento y registra el envío simulado (o el omitido, con motivo)', () => {
    const t = T.seed()
    const c = camp(t, 'Volvé al bodegón')
    t.fail({ type: 'campaign/activate', campaignId: c.id }, 'rol-sin-permiso', 'caja')
    const r = t.ok({ type: 'campaign/activate', campaignId: c.id })
    expect((r.data as { issued: number }).issued).toBe(1)
    expect(camp(t, 'Volvé al bodegón').status).toBe('activa')
    const sends = t.s.campaignSends.filter((x) => x.campaignId === c.id)
    expect(sends.map((x) => [x.customerId, x.status])).toEqual([['CL-002', 'omitido'], ['CL-004', 'simulado']])
    expect(benefitOf(t, c.id, 'CL-004')!.code).toMatch(/^MC-B[2-9A-Z]{3}$/)
    expect(benefitOf(t, c.id, 'CL-002')).toBeUndefined()
  })
  it('editar una campaña aprobada la devuelve a borrador; solo se edita lo que no salió', () => {
    const t = T.seed()
    const c = camp(t, 'Volvé al bodegón')
    t.ok({ type: 'campaign/save', businessId: 'mesa-clara', campaignId: c.id, draft: { ...c, name: 'Volvé al bodegón (otoño)' } })
    expect(camp(t, 'Volvé al bodegón (otoño)').status).toBe('borrador')
    const m = camp(t, 'Merienda de la semana')
    t.fail({ type: 'campaign/save', businessId: 'ritual-cafe', campaignId: m.id, draft: { ...m } }, 'estado-invalido')
  })
  it('validación: presupuesto, fechas, porcentaje, alcohol e ítems de otro negocio', () => {
    const t = T.seed()
    const base = camp(t, 'Volvé al bodegón')
    const bad = (patch: Partial<Campaign>) => (t.fail({ type: 'campaign/save', businessId: 'mesa-clara', draft: { ...base, ...patch }, operationId: `op-${Math.random()}` }, 'validacion').data as { errors: Record<string, string> }).errors
    expect(bad({ rules: { ...base.rules, budgetCents: 0 } }).rules).toMatch(/presupuesto/)
    expect(bad({ endKey: '2026-10-01' }).dates).toBeTruthy()
    expect(bad({ benefit: { type: 'porcentaje', value: 95, itemIds: [] } }).benefit).toMatch(/90/)
    expect(bad({ benefit: { type: 'monto', value: 1000, itemIds: ['RC-01'] } }).benefit).toMatch(/esta carta/)
    const t2 = T.seed()
    const tc = camp(t2, 'Martes de tapas')
    expect((t2.fail({ type: 'campaign/save', businessId: 'compas', draft: { ...tc, benefit: { type: 'porcentaje', value: 10, itemIds: ['TC-13'] } }, operationId: 'op-alc' }, 'validacion').data as any).errors.benefit).toMatch(/alcohol/)
  })
  it('pausar, reanudar, finalizar y cancelar (cancelar anula lo no usado y respeta lo canjeado)', () => {
    const t = T.seed()
    const m = camp(t, 'Merienda de la semana')
    t.ok({ type: 'campaign/pause', campaignId: m.id })
    expect(camp(t, 'Merienda de la semana').status).toBe('pausada')
    t.ok({ type: 'campaign/resume', campaignId: m.id })
    expect(camp(t, 'Merienda de la semana').status).toBe('activa')
    t.fail({ type: 'campaign/cancel', campaignId: m.id, reason: '' }, 'motivo-requerido')
    const r = t.ok({ type: 'campaign/cancel', campaignId: m.id, reason: 'Cambio de carta' })
    expect((r.data as { voided: number }).voided).toBeGreaterThan(0)
    expect(t.s.benefits.filter((b) => b.campaignId === m.id).every((b) => b.status === 'anulado')).toBe(true)
    const f = camp(t, 'Fiestas en el bodegón')
    t.ok({ type: 'campaign/finish', campaignId: f.id })
    t.fail({ type: 'campaign/cancel', campaignId: f.id, reason: 'x' }, 'estado-invalido')
  })
})

describe('GR-C · reglas de canje y reversión', () => {
  const RC = (t: T) => camp(t, 'Merienda de la semana')
  it('Ana usa su beneficio: descuento en las líneas elegibles, con tope por pedido; el saldo a pagar baja', () => {
    const t = T.seed()
    const b = benefitOf(t, RC(t).id, 'CL-006')!
    const r = order(t, 'ritual-cafe', 'L-RC-centro', 'CL-006', [{ itemId: 'RC-15', selections: { 'MG-leche': ['le-entera'] } }, { itemId: 'RC-11', qty: 2 }, { itemId: 'RC-13' }], b.code)
    expect(r.ok).toBe(true)
    const o = t.get('orders', (r as any).data.orderId)
    // 15 % de (5.900 + 4.400) = 1.545 → tope 1.500; el tostado no participa
    expect(o.lines.find((l: any) => l.itemId === 'RC-13').discountCents ?? 0).toBe(0)
    expect(o.lines.reduce((a: number, l: any) => a + (l.discountCents ?? 0), 0)).toBe(150000)
    expect(orderDue(o)).toBe(o.totalCents - 150000)
    expect(t.get('benefits', b.id)).toMatchObject({ status: 'canjeado', orderId: o.id, discountCents: 150000 })
    expect(validateState(t.s)).toEqual([])
  })
  it('reversión: rechazar el pedido devuelve el beneficio; anular uno disponible pide motivo', () => {
    const t = T.seed()
    const b = benefitOf(t, RC(t).id, 'CL-006')!
    const r = order(t, 'ritual-cafe', 'L-RC-centro', 'CL-006', [{ itemId: 'RC-11', qty: 3 }], b.code) as any
    t.ok({ type: 'order/reject', orderId: r.data.orderId, reason: 'prueba' }, 'cocina')
    expect(t.get('benefits', b.id)).toMatchObject({ status: 'disponible', orderId: null, discountCents: 0 })
    t.fail({ type: 'benefit/void', benefitId: b.id, reason: '' }, 'motivo-requerido', 'caja')
    t.ok({ type: 'benefit/void', benefitId: b.id, reason: 'Pedido de prueba' }, 'caja')
    expect(t.get('benefits', b.id).status).toBe('anulado')
  })
  it('no se usa el beneficio de otra persona, ni vencido, ni junto con una invitación', () => {
    const t = T.seed()
    const b = benefitOf(t, RC(t).id, 'CL-006')!
    t.s.session.customerByBusiness['ritual-cafe'] = 'CL-007'
    t.ok({ type: 'cart/add', businessId: 'ritual-cafe', locationId: 'L-RC-centro', itemId: 'RC-11', qty: 1, selections: {} }, 'cliente-recurrente')
    t.fail({ type: 'cart/setBenefit', cartId: 'CART-L-RC-centro', code: b.code }, 'beneficio-invalido', 'cliente-recurrente')
    // vencido: el reloj pasa la vigencia de 14 días
    const t2 = T.seed()
    for (const d of [7, 7, 1]) t2.ok({ type: 'clock/advance', minutes: d * 24 * 60 })
    expect(t2.get('benefits', b.id).status).toBe('vencido')
    // no acumulable con una invitación
    const t3 = T.seed()
    const g = t3.ok({ type: 'gift/create', businessId: 'ritual-cafe', itemId: 'RC-11', fromAlias: 'Lu', toAlias: 'Ana', message: 'Para vos', operationId: 'g-1' }, 'cliente-invitado').data as any
    t3.s.session.customerByBusiness['ritual-cafe'] = 'CL-006'
    t3.ok({ type: 'cart/add', businessId: 'ritual-cafe', locationId: 'L-RC-centro', itemId: 'RC-11', qty: 1, selections: {}, giftCode: g.code }, 'cliente-recurrente')
    t3.fail({ type: 'cart/setBenefit', cartId: 'CART-L-RC-centro', code: b.code }, 'beneficio-no-acumulable', 'cliente-recurrente')
  })
  it('mínimo de compra, cupo y presupuesto se validan al enviar', () => {
    const t = T.seed()
    const c = camp(t, 'Volvé al bodegón')
    t.ok({ type: 'campaign/activate', campaignId: c.id })
    t.ok({ type: 'clock/jump', minutes: 12 * 60 + 30 })
    const b = benefitOf(t, c.id, 'CL-004')!
    t.s.session.customerByBusiness['mesa-clara'] = 'CL-004'
    t.ok({ type: 'cart/add', businessId: 'mesa-clara', locationId: 'L-MC-salon', itemId: 'MC-22', qty: 1, selections: {} }, 'cliente-recurrente')
    t.ok({ type: 'cart/setFulfillment', cartId: 'CART-L-MC-salon', fulfillment: { kind: 'mesa', tableId: 'T-MC-02' }, alias: 'Marcos' }, 'cliente-recurrente')
    t.ok({ type: 'cart/setBenefit', cartId: 'CART-L-MC-salon', code: b.code }, 'cliente-recurrente')
    const op = (t.ok({ type: 'cart/begin', cartId: 'CART-L-MC-salon' }, 'cliente-recurrente').data as any).operationId
    t.fail({ type: 'order/submit', cartId: 'CART-L-MC-salon', operationId: op }, 'beneficio-minimo', 'cliente-recurrente')
    // cupo: con el cupo en 0 canjes posibles
    const cap = (s: AppState) => { s.campaigns.find((x) => x.id === c.id)!.rules.totalCap = 1; s.benefits.push({ ...b, id: 'BEN-x', code: 'MC-BZZZ', status: 'canjeado', orderId: 'O-001', discountCents: 1 }) }
    const t2 = new T(structuredClone(t.s))
    cap(t2.s)
    t2.ok({ type: 'cart/add', businessId: 'mesa-clara', locationId: 'L-MC-salon', itemId: 'MC-22', qty: 1, selections: {} }, 'cliente-recurrente') // con el flan anterior: 15.800 ≥ mínimo
    const op2 = (t2.ok({ type: 'cart/begin', cartId: 'CART-L-MC-salon' }, 'cliente-recurrente').data as any).operationId
    t2.fail({ type: 'order/submit', cartId: 'CART-L-MC-salon', operationId: op2 }, 'beneficio-cupo', 'cliente-recurrente')
    // presupuesto agotado
    const t3 = new T(structuredClone(t.s))
    t3.s.campaigns.find((x) => x.id === c.id)!.rules.budgetCents = 100000
    t3.ok({ type: 'cart/add', businessId: 'mesa-clara', locationId: 'L-MC-salon', itemId: 'MC-22', qty: 1, selections: {} }, 'cliente-recurrente') // con el flan anterior: 15.800 ≥ mínimo
    const op3 = (t3.ok({ type: 'cart/begin', cartId: 'CART-L-MC-salon' }, 'cliente-recurrente').data as any).operationId
    t3.fail({ type: 'order/submit', cartId: 'CART-L-MC-salon', operationId: op3 }, 'beneficio-presupuesto', 'cliente-recurrente')
  })
})

describe('GR-B · disparadores: programada, por evento y referidos', () => {
  it('"Martes de tapas" emite el martes al pasar el reloj, una vez por día', () => {
    const t = T.seed()
    const c = camp(t, 'Martes de tapas')
    expect(t.s.benefits.filter((b) => b.campaignId === c.id)).toHaveLength(0)
    t.ok({ type: 'clock/jump', minutes: 9 * 60 }) // martes 20, 9:00
    const n = t.s.benefits.filter((b) => b.campaignId === c.id).length
    expect(n).toBe(1) // solo Inés tiene consentimiento promocional
    t.ok({ type: 'clock/advance', minutes: 60 })
    expect(t.s.benefits.filter((b) => b.campaignId === c.id)).toHaveLength(n)
  })
  it('"Bienvenida": el primer pedido entregado de un cliente nuevo le deja un beneficio para la próxima', () => {
    const t = T.seed()
    const c = camp(t, 'Bienvenida a la brasa')
    t.s.customers.find((x) => x.id === 'CL-012')!.consent.promo = true
    // Carla tiene historial: no es su primer pedido
    const r1 = order(t, 'brasa', 'L-BR-centro', 'CL-012', [{ itemId: 'BR-03' }]) as any
    for (const a of ['accept', 'prepare', 'ready', 'deliver']) t.ok({ type: `order/${a}`, orderId: r1.data.orderId }, 'cocina')
    expect(benefitOf(t, c.id, 'CL-012')).toBeUndefined()
    // cliente nuevo con consentimiento
    const nuevo = t.ok({ type: 'referral/create', businessId: 'brasa', referrerId: 'CL-011', referredAlias: 'Nico', operationId: 'ref-1' }) as any
    const nicoId = t.get('referrals', nuevo.data.referralId).referredId
    t.s.customers.find((x) => x.id === nicoId)!.consent.promo = true
    t.s.customers.find((x) => x.id === 'CL-011')!.consent.promo = true
    const r2 = order(t, 'brasa', 'L-BR-centro', nicoId, [{ itemId: 'BR-03' }]) as any
    for (const a of ['accept', 'prepare', 'ready', 'deliver']) t.ok({ type: `order/${a}`, orderId: r2.data.orderId }, 'cocina')
    expect(benefitOf(t, c.id, nicoId)?.status).toBe('disponible')
    expect(t.get('referrals', nuevo.data.referralId).status).toBe('cumplido')
    expect(benefitOf(t, camp(t, 'Traé a alguien').id, 'CL-011')?.status).toBe('disponible')
  })
  it('referidos: sin autorreferido, sin duplicados y sin datos de contacto', () => {
    const t = T.seed()
    t.fail({ type: 'referral/create', businessId: 'brasa', referrerId: 'CL-011', referredAlias: 'Julián', operationId: 'r-a' }, 'referido-invalido')
    t.fail({ type: 'referral/create', businessId: 'brasa', referrerId: 'CL-011', referredAlias: '11 5555 1234', operationId: 'r-b' }, 'sin-contacto')
    t.ok({ type: 'referral/create', businessId: 'brasa', referrerId: 'CL-011', referredAlias: 'Nico', operationId: 'r-c' })
    t.fail({ type: 'referral/create', businessId: 'brasa', referrerId: 'CL-012', referredAlias: 'Nico', operationId: 'r-d' }, 'referido-duplicado')
  })
})

describe('GR-B · resultados observados y calendario', () => {
  it('resultados: canjes, ingreso neto, descuentos y contribución observada (atribuida, no causal)', () => {
    const t = T.seed()
    const c = camp(t, 'Merienda de la semana')
    expect(campaignResults(t.s, c.id)).toMatchObject({ redeemed: 0, orders: 0, discountCents: 0, contributionCents: 0 })
    const b = benefitOf(t, c.id, 'CL-006')!
    order(t, 'ritual-cafe', 'L-RC-centro', 'CL-006', [{ itemId: 'RC-11', qty: 2 }], b.code)
    const r = campaignResults(t.s, c.id)
    // 2 × 2.200 = 4.400; 15 % = 660; costo 2 × 600; variables 2 × 90
    expect(r).toMatchObject({ redeemed: 1, orders: 1, grossCents: 440000, discountCents: 66000, netCents: 374000, productCents: 120000, variableCents: 18000, contributionCents: 374000 - 120000 - 18000, budgetUsedCents: 66000 })
    expect(r.sent).toBeGreaterThan(0)
  })
  it('calendario: única, semanal, mensual, bimestral, estacional y por festividad', () => {
    const base = { startKey: '2026-10-20', endKey: '2027-03-31', seasonId: null }
    expect(campaignDays({ ...base, cadence: 'semanal' }, '2026-10-19', '2026-11-05')).toEqual(['2026-10-20', '2026-10-27', '2026-11-03'])
    expect(campaignDays({ ...base, cadence: 'mensual' }, '2026-10-01', '2027-01-31')).toEqual(['2026-10-20', '2026-11-20', '2026-12-20', '2027-01-20'])
    expect(campaignDays({ ...base, cadence: 'bimestral' }, '2026-10-01', '2027-03-31')).toEqual(['2026-10-20', '2026-12-20', '2027-02-20'])
    expect(campaignDays({ ...base, cadence: 'unica', endKey: '2026-10-22' }, '2026-10-01', '2026-10-31')).toEqual(['2026-10-20', '2026-10-21', '2026-10-22'])
    const fest = campaignDays({ ...base, cadence: 'festividad', seasonId: 'fiestas' }, '2026-11-25', '2027-01-10')
    expect(fest[0]).toBe('2026-12-01')
    expect(fest.at(-1)).toBe('2027-01-06')
    const est = campaignDays({ ...base, cadence: 'estacional', seasonId: 'verano' }, '2026-12-15', '2027-03-31')
    expect(est[0]).toBe('2027-01-07') // diciembre y la primera semana de enero son "fiestas"
  })
})

describe('MG-02 · migración v3 → v4', () => {
  it('suma costos de muestra donde no hay, historial sintético y colecciones vacías, sin tocar lo existente', () => {
    const s = makeSeed('servicio') as any
    const v3 = structuredClone(s)
    for (const m of v3.menuItems) { delete m.costCents; delete m.variableCents }
    for (const g of v3.modifierGroups) for (const o of g.options) delete o.costCents
    v3.menuItems.find((m: any) => m.id === 'MC-12').costCents = 700000 // ya cargado por el negocio: no se pisa
    v3.menuItems.find((m: any) => m.id === 'MC-12').variableCents = 50000
    for (const k of ['customerHistory', 'campaigns', 'benefits', 'campaignSends', 'referrals']) delete v3[k]
    for (const o of v3.orders) delete o.benefitId
    v3.schemaVersion = 3
    const r = migrate(v3, 3)
    expect(r.ok).toBe(true)
    if (!r.ok) return
    const m = r.state as AppState
    expect(m.schemaVersion).toBe(4)
    expect(validateState(m)).toEqual([])
    expect(m.menuItems.find((x) => x.id === 'MC-12')!.costCents).toBe(700000)
    expect(m.menuItems.find((x) => x.id === 'RC-11')!.costCents).toBe(60000)
    expect(m.menuItems.find((x) => x.id === 'TC-05')!.costCents).toBeNull()
    expect(m.customerHistory.length).toBe(11)
    expect(m.campaigns).toEqual([])
    expect(m.orders).toEqual(v3.orders)
  })
})
