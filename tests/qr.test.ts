import { describe, expect, it } from 'vitest'
import jsQR from 'jsqr'
import { qrModules, qrPathData } from '../src/domain/qr-render'
import { checkCode, parseScan, qrPath, referralCode, referrerOf, type ScanContext } from '../src/domain/qr'
import { fmtARS } from '../src/domain/money'
import { atLocal } from '../src/domain/time'
import type { BusinessId } from '../src/domain/types'
import { MON, T } from './helpers'

// P5-L7 · QR y códigos: lectura real del QR generado, estados contra el store y canje idempotente.
const IDS: BusinessId[] = ['mesa-clara', 'ritual-cafe', 'copo', 'compas', 'brasa']
const RC: ScanContext = { businessId: 'ritual-cafe', locationId: 'L-RC-centro', side: 'comercio' }

/** Dibuja los módulos en píxeles (escala y zona de silencio) y los lee con un decodificador independiente. */
function decode(text: string, scale = 6) {
  const { size } = qrPathData(qrModules(text))
  const m = qrModules(text)
  const px = size * scale
  const data = new Uint8ClampedArray(px * px * 4).fill(255)
  for (let r = 0; r < m.length; r++) {
    for (let c = 0; c < m.length; c++) {
      if (!m[r][c]) continue
      for (let y = 0; y < scale; y++) for (let x = 0; x < scale; x++) {
        const i = (((r + 4) * scale + y) * px + (c + 4) * scale + x) * 4
        data[i] = data[i + 1] = data[i + 2] = 0
      }
    }
  }
  return jsQR(data, px, px)?.data ?? null
}

function retiro(t: T, customerId = 'CL-006', loc = 'L-RC-centro') {
  t.s.session.customerByBusiness['ritual-cafe'] = customerId
  const cartId = `CART-${loc}`
  t.ok({ type: 'cart/add', businessId: 'ritual-cafe', locationId: loc, itemId: 'RC-11', qty: 1, selections: {} }, 'cliente-recurrente')
  t.ok({ type: 'cart/setFulfillment', cartId, fulfillment: { kind: 'retiro', startMin: 10 * 60 + 45 }, alias: 'Lucía' }, 'cliente-recurrente')
  const op = (t.ok({ type: 'cart/begin', cartId }, 'cliente-recurrente').data as { operationId: string }).operationId
  const r = t.ok({ type: 'order/submit', cartId, operationId: op }, 'cliente-recurrente')
  return (r.data as { orderId: string }).orderId
}
const toReady = (t: T, orderId: string) => {
  t.ok({ type: 'order/accept', orderId })
  t.ok({ type: 'order/prepare', orderId })
  t.ok({ type: 'order/ready', orderId })
}
const op = (t: T) => (t.ok({ type: 'op/alloc' }).data as { operationId: string }).operationId
const redeem = (t: T, text: string, operationId = op(t), actor: any = 'caja') =>
  t.run({ type: 'code/redeem', businessId: 'ritual-cafe', locationId: 'L-RC-centro', text, operationId }, actor)

describe('QR-01 · el QR generado se lee de verdad', () => {
  it('un decodificador independiente recupera la URL exacta (varias rutas del producto)', () => {
    const urls = [
      `https://demo.example/tableflow/#${qrPath('ritual-cafe', 'pedido', 'O-012')}`,
      `https://demo.example/tableflow/#${qrPath('mesa-clara', 'mesa', 'T-MC-02', 'L-MC-salon')}`,
      `https://demo.example/tableflow/#${qrPath('brasa', 'beneficio', 'BR-B7KQ')}`,
      `https://demo.example/tableflow/#${qrPath('copo', 'referido', 'CO-F7K2')}`,
    ]
    for (const u of urls) expect(decode(u)).toBe(u)
  })
  it('el trazado SVG cubre los mismos módulos oscuros que la matriz', () => {
    const m = qrModules('hola')
    const dark = m.flat().filter(Boolean).length
    const { d, size } = qrPathData(m)
    expect(size).toBe(m.length + 8)
    expect(d.startsWith('M')).toBe(true)
    expect((d.match(/h\d+v1/g) ?? []).reduce((a, x) => a + Number(x.slice(1, -2)), 0)).toBe(dark)
  })
})

describe('QR-05 · la URL no lleva personas, precios ni secretos', () => {
  it('la ruta solo trae el negocio, el tipo y una referencia pública', () => {
    const t = T.seed()
    const id = retiro(t)
    const path = qrPath('ritual-cafe', 'pedido', id)
    expect(path).toBe(`/ritual-cafe/q/pedido/${id}`)
    const order = t.s.orders.find((o) => o.id === id)!
    expect(path).not.toContain(order.alias)
    expect(path).not.toContain(String(order.totalCents))
    const ref = qrPath('ritual-cafe', 'referido', referralCode(t.s, 'ritual-cafe', 'CL-006')!)
    for (const c of t.s.customers) {
      expect(ref.toLowerCase()).not.toContain(c.alias.toLowerCase())
      expect(ref).not.toContain(c.id)
    }
  })
  it('lo que un QR trae de más (precio, descuento, estado) se descarta: el store manda', () => {
    const p = parseScan('https://x.test/app/#/ritual-cafe/q/pedido/O-001?s=L-RC-centro&precio=1&descuento=100&estado=listo', IDS)
    expect(p).toEqual({ businessId: 'ritual-cafe', kind: 'pedido', ref: 'O-001', locationId: 'L-RC-centro' })
    const t = T.seed()
    const id = retiro(t)
    const liar = checkCode(t.s, RC, `#/ritual-cafe/q/pedido/${id}?estado=listo&total=1`)
    expect(liar.status).toBe('no-elegible') // sigue "enviado": el QR no cambia lo que dice el store
    expect(liar.facts.find((f) => f.label === 'Total')!.value).toBe(fmtARS(t.s.orders.find((o) => o.id === id)!.totalCents))
  })
  it('rutas ajenas, vacías o con basura no se interpretan', () => {
    expect(parseScan('https://x.test/#/otra-cosa/q/pedido/O-1', IDS).kind).toBeNull()
    expect(parseScan('#/ritual-cafe/q/inventado/O-1', IDS).kind).toBeNull()
    const t = T.seed()
    expect(checkCode(t.s, RC, '').status).toBe('desconocido')
    expect(checkCode(t.s, RC, '#/ritual-cafe/q/pedido/<script>').status).toBe('desconocido')
  })
})

describe('QR-03 · estados del pedido (comercio)', () => {
  it('enviado/en preparación → no elegible; listo → válido y canjeable; entregado → usado', () => {
    const t = T.seed()
    const id = retiro(t)
    expect(checkCode(t.s, RC, id).status).toBe('no-elegible')
    toReady(t, id)
    const ok = checkCode(t.s, RC, `#/ritual-cafe/q/pedido/${id}`)
    expect(ok.status).toBe('valido')
    expect(ok.action?.type).toBe('entregar')
    expect(ok.detail).toMatch(/no acredita el pago/)
    t.ok({ type: 'order/deliver', orderId: id })
    expect(checkCode(t.s, RC, id).status).toBe('usado')
  })
  it('pedido cancelado o rechazado → cancelado', () => {
    const t = T.seed()
    const id = retiro(t)
    t.ok({ type: 'order/reject', orderId: id, reason: 'Sin stock de muestra' })
    expect(checkCode(t.s, RC, id).status).toBe('cancelado')
  })
  it('código que no existe → desconocido', () => {
    expect(checkCode(T.seed().s, RC, 'O-99999').status).toBe('desconocido')
  })
  it('pedido de otra sede → sede incorrecta; de otro negocio → negocio incorrecto, sin mostrar sus datos', () => {
    const t = T.seed()
    const id = retiro(t, 'CL-006', 'L-RC-norte')
    const sede = checkCode(t.s, RC, `#/ritual-cafe/q/pedido/${id}`)
    expect(sede.status).toBe('sede-incorrecta')
    expect(sede.facts).toEqual([])
    const otro = checkCode(t.s, RC, `#/mesa-clara/q/pedido/${id}`)
    expect(otro.status).toBe('negocio-incorrecto')
    expect(otro.facts).toEqual([])
    expect(JSON.stringify(otro)).not.toContain('Lucía')
  })
})

describe('QR-02 · canje idempotente', () => {
  it('entrega una vez: repetir la operación o escanear de nuevo no repite el efecto', () => {
    const t = T.seed()
    const id = retiro(t)
    toReady(t, id)
    const o1 = op(t)
    const r1 = redeem(t, id, o1)
    expect(r1.ok && !r1.duplicate).toBe(true)
    expect(t.s.orders.find((o) => o.id === id)!.status).toBe('retirado')
    const audits = t.s.audit.filter((a) => a.type === 'code.redeemed').length
    const v = t.s.orders.find((o) => o.id === id)!.version
    const r2 = redeem(t, id, o1) // doble clic: misma operación
    expect(r2.ok && r2.duplicate).toBe(true)
    const r3 = redeem(t, id) // otro escaneo del mismo código: ya usado
    expect(r3.ok && r3.duplicate).toBe(true)
    expect(t.s.audit.filter((a) => a.type === 'code.redeemed').length).toBe(audits)
    expect(t.s.orders.find((o) => o.id === id)!.version).toBe(v)
  })
  it('no canjea lo que no corresponde y no deja cambios a medias', () => {
    const t = T.seed()
    const id = retiro(t)
    const before = t.s
    const o = t.run({ type: 'code/redeem', businessId: 'ritual-cafe', locationId: 'L-RC-centro', text: id, operationId: op(t) }, 'caja')
    expect(o.ok).toBe(false)
    if (!o.ok) expect(o.code).toBe('codigo-no-canjeable')
    expect(t.s.orders.find((x) => x.id === id)!.status).toBe(before.orders.find((x) => x.id === id)!.status)
    const x = redeem(t, id, op(t), 'cliente-recurrente') // un cliente no canjea
    expect(x.ok).toBe(false)
  })
  it('un pedido cancelado no se puede canjear', () => {
    const t = T.seed()
    const id = retiro(t)
    t.ok({ type: 'order/reject', orderId: id, reason: 'Sin stock de muestra' })
    const o = redeem(t, id)
    expect(o.ok).toBe(false)
  })
  it('la reserva confirmada de hoy registra llegada una sola vez', () => {
    const t = T.seed()
    t.at(MON, 12)
    const r = t.s.reservations.find((x) => x.businessId === 'mesa-clara' && x.status === 'confirmada' && x.dateKey === MON)
    expect(r).toBeTruthy()
    const MC: ScanContext = { businessId: 'mesa-clara', locationId: r!.locationId, side: 'comercio' }
    const c = checkCode(t.s, MC, r!.id)
    expect(c.status).toBe('valido')
    expect(c.action?.type).toBe('llegada')
    const run = (operationId: string) => t.run({ type: 'code/redeem', businessId: 'mesa-clara', locationId: r!.locationId, text: r!.id, operationId }, 'recepcion')
    const o1 = op(t)
    expect(run(o1).ok).toBe(true)
    expect(t.s.reservations.find((x) => x.id === r!.id)!.status).toBe('llegada')
    expect(checkCode(t.s, MC, r!.id).status).toBe('usado')
    const again = run(o1)
    expect(again.ok && again.duplicate).toBe(true)
  })
  it('una reserva de otro día no es elegible hoy; una pasada está vencida', () => {
    const t = T.seed()
    t.at(MON, 12)
    const r = t.s.reservations.find((x) => x.businessId === 'mesa-clara' && x.status === 'confirmada')!
    const MC: ScanContext = { businessId: 'mesa-clara', locationId: r.locationId, side: 'comercio' }
    t.s.clock.nowMs = atLocal(r.dateKey, 9 * 60) - 24 * 60 * 60 * 1000
    expect(checkCode(t.s, MC, r.id).status).toBe('no-elegible')
    t.s.clock.nowMs = atLocal(r.dateKey, 9 * 60) + 24 * 60 * 60 * 1000
    expect(checkCode(t.s, MC, r.id).status).toBe('vencido')
  })
})

describe('QR-03 · beneficios, campañas y referidos', () => {
  const benefit = (t: T) => t.s.benefits.find((b) => b.businessId === 'ritual-cafe' && b.status === 'disponible')!
  it('beneficio disponible → válido; vencido por reloj → vencido; anulado → cancelado', () => {
    const t = T.seed()
    const b = benefit(t)
    expect(checkCode(t.s, RC, b.code).status).toBe('valido')
    t.ok({ type: 'benefit/void', benefitId: b.id, reason: 'Prueba' })
    expect(checkCode(t.s, RC, b.code).status).toBe('cancelado')
    const b2 = t.s.benefits.find((x) => x.businessId === 'ritual-cafe' && x.status === 'disponible')!
    t.s.clock.nowMs = b2.expiresAt + 1000
    expect(checkCode(t.s, RC, b2.code).status).toBe('vencido')
  })
  it('canjeado → usado; si el pedido se cae el canje se revierte y se ve como revertido (y sigue siendo usable)', () => {
    const t = T.seed()
    const b = benefit(t)
    const cust = b.customerId
    t.s.session.customerByBusiness['ritual-cafe'] = cust
    const cartId = 'CART-L-RC-centro'
    t.ok({ type: 'cart/add', businessId: 'ritual-cafe', locationId: 'L-RC-centro', itemId: 'RC-11', qty: 3, selections: {} }, 'cliente-recurrente')
    t.ok({ type: 'cart/setFulfillment', cartId, fulfillment: { kind: 'retiro', startMin: 10 * 60 + 45 }, alias: 'Cliente' }, 'cliente-recurrente')
    t.ok({ type: 'cart/setBenefit', cartId, code: b.code }, 'cliente-recurrente')
    const o = (t.ok({ type: 'cart/begin', cartId }, 'cliente-recurrente').data as { operationId: string }).operationId
    const id = (t.ok({ type: 'order/submit', cartId, operationId: o }, 'cliente-recurrente').data as { orderId: string }).orderId
    expect(checkCode(t.s, RC, b.code).status).toBe('usado')
    t.ok({ type: 'order/reject', orderId: id, reason: 'Prueba' })
    const back = checkCode(t.s, RC, b.code)
    expect(back.status).toBe('revertido')
    expect(back.usable).toBe(true)
  })
  it('un cliente solo ve lo suyo: el beneficio de otra persona es "desconocido"', () => {
    const t = T.seed()
    const b = benefit(t)
    const other = t.s.customers.find((c) => c.businessId === 'ritual-cafe' && c.id !== b.customerId)!
    const mine = checkCode(t.s, { ...RC, side: 'cliente', customerId: b.customerId }, b.code)
    expect(mine.status).toBe('valido')
    const theirs = checkCode(t.s, { ...RC, side: 'cliente', customerId: other.id }, b.code)
    expect(theirs.status).toBe('desconocido')
    expect(theirs.facts).toEqual([])
  })
  it('campaña activa: elegible reclama una vez (duplicado después); cupo agotado y no elegible', () => {
    const t = T.seed()
    const camp = t.s.campaigns.find((c) => c.businessId === 'ritual-cafe' && c.status === 'activa' && c.trigger !== 'evento')!
    // la semilla ya les dio su beneficio a todos los que aceptaron promociones: sumamos una clienta nueva y elegible
    const base = t.s.customers.find((c) => c.id === 'CL-006')!
    t.s.customers.push({ ...base, id: 'CL-T01', alias: 'Prueba', displayName: 'Prueba' })
    expect(camp.scope).toBe('segmento')
    expect(checkCode(t.s, { ...RC, side: 'cliente', customerId: 'CL-T01' }, `#${qrPath('ritual-cafe', 'campana', camp.id)}`).status).toBe('no-elegible') // no está en el segmento de la semilla (sin historial)
    camp.scope = 'masiva'
    const sinConsentimiento = t.s.customers.find((c) => c.businessId === 'ritual-cafe' && !c.consent.promo)!
    const ctxOf = (id: string): ScanContext => ({ ...RC, side: 'cliente', customerId: id })
    const url = `#${qrPath('ritual-cafe', 'campana', camp.id)}`
    const mine = () => t.s.benefits.filter((b) => b.campaignId === camp.id && b.customerId === 'CL-T01')
    expect(checkCode(t.s, ctxOf('CL-T01'), url).status).toBe('valido')
    expect(checkCode(t.s, ctxOf('CL-T01'), url).action?.type).toBe('reclamar')
    const claim = (operationId: string) => t.run({ type: 'campaign/claim', businessId: 'ritual-cafe', locationId: 'L-RC-centro', campaignId: camp.id, customerId: 'CL-T01', operationId }, 'cliente-recurrente')
    const o1 = op(t)
    const first = claim(o1)
    expect(first.ok && !first.duplicate).toBe(true)
    expect(mine()).toHaveLength(1)
    expect(mine()[0].status).toBe('disponible')
    const dupe = claim(o1) // doble clic: misma operación
    expect(dupe.ok && dupe.duplicate).toBe(true)
    const again = claim(op(t)) // otro intento: ya tiene su beneficio
    expect(again.ok && again.duplicate).toBe(true)
    expect(mine()).toHaveLength(1)
    expect(checkCode(t.s, ctxOf('CL-T01'), url).status).toBe('duplicado')
    expect(checkCode(t.s, ctxOf(sinConsentimiento.id), url).status).toBe('no-elegible')
    // sin cupo para nadie más
    t.s.campaigns.find((c) => c.id === camp.id)!.rules.totalCap = t.s.benefits.filter((b) => b.campaignId === camp.id).length
    expect(checkCode(t.s, ctxOf('CL-007'), url).status).toBe('cupo-agotado')
    expect(t.run({ type: 'campaign/claim', businessId: 'ritual-cafe', locationId: 'L-RC-centro', campaignId: camp.id, customerId: 'CL-007', operationId: op(t) }, 'cliente-recurrente').ok).toBe(false)
  })
  it('un comercio no reclama beneficios y las campañas en borrador no se ven desde el cliente', () => {
    const t = T.seed()
    const camp = t.s.campaigns.find((c) => c.businessId === 'ritual-cafe' && c.status === 'activa' && c.trigger !== 'evento')!
    const o = t.run({ type: 'campaign/claim', businessId: 'ritual-cafe', locationId: 'L-RC-centro', campaignId: camp.id, customerId: 'CL-006', operationId: op(t) }, 'encargado')
    expect(o.ok).toBe(false)
    const draft = t.s.campaigns.find((c) => c.status === 'borrador')!
    expect(checkCode(t.s, { businessId: draft.businessId, locationId: t.s.locations.find((l) => l.businessId === draft.businessId)!.id, side: 'cliente', customerId: 'x' }, `#${qrPath(draft.businessId, 'campana', draft.id)}`).status).toBe('desconocido')
  })
  it('referido: el código es estable, único y no revela a la persona; usarlo en uno mismo no es elegible', () => {
    const t = T.seed()
    const codes = t.s.customers.filter((c) => c.businessId === 'ritual-cafe').map((c) => referralCode(t.s, 'ritual-cafe', c.id)!)
    expect(new Set(codes).size).toBe(codes.length)
    const mine = referralCode(t.s, 'ritual-cafe', 'CL-006')!
    expect(referralCode(t.s, 'ritual-cafe', 'CL-006')).toBe(mine)
    expect(referrerOf(t.s, 'ritual-cafe', mine)).toBe('CL-006')
    expect(checkCode(t.s, { ...RC, side: 'cliente', customerId: 'CL-006' }, mine).status).toBe('no-elegible')
    expect(checkCode(t.s, RC, mine).status).toBe('valido')
    expect(checkCode(t.s, RC, 'RC-FZZZ').status).toBe('desconocido')
  })
})

describe('QR-01 · mesa, sede y negocio', () => {
  it('mesa válida en su sede, sede incorrecta en otra y desconocida si no existe', () => {
    const t = T.seed()
    const centro = t.s.tables.find((x) => x.locationId === 'L-RC-centro')!
    expect(checkCode(t.s, RC, `#${qrPath('ritual-cafe', 'mesa', centro.id)}`).status).toBe('valido')
    expect(checkCode(t.s, { ...RC, locationId: 'L-RC-norte' }, `#${qrPath('ritual-cafe', 'mesa', centro.id)}`).status).toBe('sede-incorrecta')
    expect(checkCode(t.s, RC, `#${qrPath('ritual-cafe', 'mesa', 'T-RC-99')}`).status).toBe('desconocido')
  })
  it('sede y negocio: válidos; negocio equivocado se rechaza', () => {
    const t = T.seed()
    expect(checkCode(t.s, RC, `#${qrPath('ritual-cafe', 'sede', 'L-RC-centro')}`).status).toBe('valido')
    expect(checkCode(t.s, RC, `#${qrPath('ritual-cafe', 'negocio', 'ritual-cafe')}`).status).toBe('valido')
    expect(checkCode(t.s, RC, `#${qrPath('brasa', 'negocio', 'brasa')}`).status).toBe('negocio-incorrecto')
  })
})

describe('QR · registro de escaneos', () => {
  it('queda en la auditoría sin datos personales y el mismo escaneo no se cuenta dos veces', () => {
    const t = T.seed()
    const id = retiro(t)
    const o1 = op(t)
    const scan = (operationId: string) => t.run({ type: 'code/scan', businessId: 'ritual-cafe', locationId: 'L-RC-centro', text: id, via: 'simulado', operationId }, 'caja')
    expect(scan(o1).ok).toBe(true)
    const n = t.s.audit.filter((a) => a.type === 'code.scanned').length
    const again = scan(o1)
    expect(again.ok && again.duplicate).toBe(true)
    expect(t.s.audit.filter((a) => a.type === 'code.scanned').length).toBe(n)
    const ev = t.s.audit.filter((a) => a.type === 'code.scanned').at(-1)!
    expect(ev.summary).toMatch(/simulado/)
    expect(ev.summary).not.toContain('Lucía')
  })
})
