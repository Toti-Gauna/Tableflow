import { describe, expect, it } from 'vitest'
import { makeSeed } from '../src/domain/fixtures'
import { validateState } from '../src/domain/validate'
import { fmtClock, SEED_CLOCK_MS } from '../src/domain/time'
import { fmtARS, splitEqual } from '../src/domain/money'
import { T } from './helpers'

describe('seed v1', () => {
  const s = makeSeed('servicio')
  it('es válido (esquema, IDs, businessId y referencias)', () => {
    expect(validateState(s)).toEqual([])
    expect(validateState(makeSeed('vacio'))).toEqual([])
  })
  it('es determinista: dos construcciones son idénticas', () => {
    expect(JSON.stringify(makeSeed('servicio'))).toBe(JSON.stringify(makeSeed('servicio')))
  })
  it('reloj simulado lunes 19/10/2026 10:00 ART', () => {
    expect(s.clock.nowMs).toBe(SEED_CLOCK_MS)
    expect(fmtClock(s.clock.nowMs)).toBe('lunes 19/10 10:00')
  })
  // P5-L5: cinco perfiles; Ritual suma cuatro clásicos (café con leche, lágrima, submarino, medialuna de grasa).
  it('S01: 78 productos en los cinco perfiles (28 bodegón + 18 café + 8 heladería + 14 bar + 10 rápida)', () => {
    expect(s.menuItems).toHaveLength(78)
    const by = (b: string) => s.menuItems.filter((m) => m.businessId === b)
    expect(by('mesa-clara')).toHaveLength(28)
    expect(by('ritual-cafe')).toHaveLength(18)
    expect(by('copo')).toHaveLength(8)
    expect(by('compas')).toHaveLength(14)
    expect(by('brasa')).toHaveLength(10)
  })
  it('mesas y cubiertos', () => {
    const mc = s.tables.filter((t) => t.businessId === 'mesa-clara')
    const rc = s.tables.filter((t) => t.businessId === 'ritual-cafe')
    expect(mc).toHaveLength(12)
    expect(mc.reduce((a, t) => a + t.seats, 0)).toBe(52)
    expect([2, 4, 6, 8].map((n) => mc.filter((t) => t.seats === n).length)).toEqual([4, 4, 2, 2])
    expect(rc).toHaveLength(6)
    expect(rc.reduce((a, t) => a + t.seats, 0)).toBe(18)
  })
  // P5-L5: los conteos históricos se miden sobre Mesa Clara y Ritual Café; los negocios nuevos tienen su propio test.
  const legacy = <T extends { businessId: string }>(a: T[]) => a.filter((x) => x.businessId === 'mesa-clara' || x.businessId === 'ritual-cafe')
  it('conteos de fixtures', () => {
    expect(legacy(s.reservations)).toHaveLength(18)
    expect(new Set(s.reservations.map((r) => r.status))).toEqual(new Set(['confirmada', 'solicitada', 'revision_humana', 'alternativa_ofrecida', 'completada', 'no_show', 'cancelada']))
    expect(legacy(s.orders)).toHaveLength(12)
    expect(new Set(s.orders.map((o) => o.status)).size).toBeGreaterThanOrEqual(8)
    expect(legacy(s.customers).filter((c) => !c.mergedInto)).toHaveLength(8)
    expect(legacy(s.ingredients)).toHaveLength(16)
    expect(legacy(s.ingredients).filter((i) => i.alertState === 'bajo')).toHaveLength(2)
    expect(legacy(s.ingredients).filter((i) => i.alertState === 'agotado')).toHaveLength(1)
    expect(legacy(s.cashSessions)).toHaveLength(2)
    expect(s.conversations).toHaveLength(4)
    expect(s.runs.filter((r) => r.status === 'fallida' || r.status === 'pendiente').length).toBeGreaterThanOrEqual(3)
  })
  it('próximos folios: R-019 y O-013; C-001 vacío (Ana)', () => {
    const t = new T(makeSeed('servicio'))
    expect(t.s.counters.R).toBe(18)
    expect(t.s.counters.O).toBe(12)
    expect(t.s.messages.filter((m) => m.conversationId === 'C-001')).toHaveLength(0)
    expect(t.get('conversations', 'C-001').customerId).toBe('CL-001')
  })
  it('importes en centavos enteros, es-AR', () => {
    expect(fmtARS(1850000)).toBe('$ 18.500,00')
    expect(s.menuItems.every((m) => Number.isInteger(m.priceCents))).toBe(true)
    expect(s.menuItems.find((m) => m.name.startsWith('Milanesa de ternera'))!.priceCents).toBe(1850000)
    expect(s.menuItems.find((m) => m.name === 'Espresso')!.priceCents).toBe(450000)
    expect(splitEqual(1000000, 3)).toEqual([333333, 333333, 333334])
  })
  it('seed vacío: sin actividad, con perfiles y carta', () => {
    const e = makeSeed('vacio')
    expect(e.reservations).toHaveLength(0)
    expect(e.orders).toHaveLength(0)
    expect(e.menuItems).toHaveLength(78)
    expect(e.ingredients.filter((i) => i.alertState !== 'ok')).toHaveLength(0)
  })
  it('cena del lunes 19 a las 20:00: todas las mesas compatibles con cuatro están retenidas', () => {
    const blockers = s.reservations.filter((r) => r.dateKey === '2026-10-19' && r.startMin === 1200 && r.status === 'confirmada')
    expect(blockers.map((r) => r.tableId).sort()).toEqual(['T-MC-05', 'T-MC-06', 'T-MC-07', 'T-MC-08', 'T-MC-09', 'T-MC-10', 'T-MC-11', 'T-MC-12'])
  })
})
