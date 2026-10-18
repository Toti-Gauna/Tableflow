import { describe, expect, it } from 'vitest'
import { activeSeason } from '../src/domain/season'
import { migrate } from '../src/domain/persistence'
import { validateState } from '../src/domain/validate'
import type { AppState } from '../src/domain/types'
import { MON, T } from './helpers'

// P5-L8 · Temporadas con activación manual, inicio y fin, independientes del modo claro u oscuro.
const set = (t: T, season: string, window?: { from: string; to: string } | null) => t.run({ type: 'config/season', businessId: 'ritual-cafe', season, window })

describe('TE-01 · temporada manual con inicio y fin', () => {
  it('dentro del rango vale la manual; antes y después, la automática (con aviso de que hay una programada)', () => {
    const t = T.seed()
    expect(activeSeason(t.s, 'ritual-cafe').forced).toBe(false)
    expect(set(t, 'invierno', { from: '2026-10-21', to: '2026-10-25' }).ok).toBe(true)
    const before = activeSeason(t.s, 'ritual-cafe')
    expect(before.forced).toBe(false)
    expect(before.outside).toBe(true)
    t.at('2026-10-22', 10)
    const during = activeSeason(t.s, 'ritual-cafe')
    expect(during).toMatchObject({ id: 'invierno', forced: true, when: 'del 21/10 al 25/10' })
    t.at('2026-10-26', 10)
    expect(activeSeason(t.s, 'ritual-cafe').forced).toBe(false)
  })
  it('sin fechas queda hasta volver a automática; automática borra las fechas', () => {
    const t = T.seed()
    set(t, 'verano', null)
    expect(activeSeason(t.s, 'ritual-cafe')).toMatchObject({ id: 'verano', forced: true, when: 'manual, sin fecha de fin' })
    set(t, 'invierno', { from: MON, to: MON })
    set(t, 'auto', { from: MON, to: MON })
    expect(t.s.settings.seasonWindowByBusiness['ritual-cafe']).toBeNull()
  })
  it('valida las fechas sin dejar cambios a medias; repetir lo mismo es un duplicado', () => {
    const t = T.seed()
    t.fail({ type: 'config/season', businessId: 'ritual-cafe', season: 'invierno', window: { from: '2026-10-25', to: '2026-10-21' } }, 'fechas-invertidas')
    t.fail({ type: 'config/season', businessId: 'ritual-cafe', season: 'invierno', window: { from: 'mañana', to: '2026-10-21' } }, 'fechas-invalidas')
    t.fail({ type: 'config/season', businessId: 'ritual-cafe', season: 'invierno', window: { from: '2026-01-01', to: '2027-06-01' } }, 'fechas-largas')
    expect(set(t, 'invierno', { from: MON, to: '2026-10-30' }).ok).toBe(true)
    const again = set(t, 'invierno', { from: MON, to: '2026-10-30' })
    expect(again.ok && again.duplicate).toBe(true)
  })
  it('cambiar la temporada no crea campañas, beneficios ni descuentos y no toca el tema claro/oscuro', () => {
    const t = T.seed()
    const snap = (s: AppState) => JSON.stringify([s.campaigns, s.benefits, s.campaignSends, s.carts.map((c) => c.benefitCode)])
    const before = snap(t.s)
    for (const season of ['verano', 'fiestas', 'madre', 'auto']) set(t, season, season === 'auto' ? null : { from: MON, to: '2026-10-31' })
    expect(snap(t.s)).toBe(before)
    expect(t.s.audit.filter((a) => a.type === 'config.season').at(-2)!.summary).toMatch(/no crea promociones/)
  })
})

describe('MG-03 · migración v4 → v5', () => {
  it('agrega las fechas en null y respeta lo forzado', () => {
    const t = T.seed()
    const v4 = structuredClone(t.s) as any
    v4.schemaVersion = 4
    v4.settings.seasonByBusiness.copo = 'verano'
    delete v4.settings.seasonWindowByBusiness
    const r = migrate(v4, 4)
    expect(r.ok).toBe(true)
    if (!r.ok) return
    const m = r.state as AppState
    expect(m.schemaVersion).toBe(5)
    expect(m.settings.seasonByBusiness.copo).toBe('verano')
    expect(Object.values(m.settings.seasonWindowByBusiness).every((w) => w === null)).toBe(true)
    expect(validateState(m)).toEqual([])
  })
  it('la validación rechaza fechas invertidas guardadas a mano', () => {
    const t = T.seed()
    const bad = structuredClone(t.s)
    bad.settings.seasonWindowByBusiness.brasa = { from: '2026-12-01', to: '2026-11-01' }
    expect(validateState(bad).join(' ')).toMatch(/Fechas de temporada inválidas en brasa/)
  })
})
