import { describe, expect, it } from 'vitest'
import { applyCommand } from '../src/domain/reducer'
import { makeSeed } from '../src/domain/fixtures'
import { activeSeason, nthSunday, SEASON_IDS, seasonById, seasonForDate } from '../src/domain/season'
import { validateState } from '../src/domain/validate'

describe('Temática por época (reloj simulado, hemisferio sur)', () => {
  it('estaciones del calendario argentino', () => {
    expect(seasonForDate('2026-09-21').id).toBe('primavera')
    expect(seasonForDate('2026-12-20').id).toBe('fiestas') // las Fiestas tienen prioridad en diciembre
    expect(seasonForDate('2027-01-10').id).toBe('verano')
    expect(seasonForDate('2026-04-02').id).toBe('otono')
    expect(seasonForDate('2026-08-02').id).toBe('invierno')
  })
  it('fechas especiales: tercer domingo de octubre y de junio, 20/7, 14/2', () => {
    expect(nthSunday(2026, 10, 3)).toBe('2026-10-18')
    expect(nthSunday(2026, 6, 3)).toBe('2026-06-21')
    expect(nthSunday(2027, 10, 3)).toBe('2027-10-17')
    expect(seasonForDate('2026-10-18')).toMatchObject({ id: 'madre', when: 'domingo 18/10' })
    expect(seasonForDate('2026-10-19').id).toBe('madre') // el seed (lunes 19/10) sigue en la ventana
    expect(seasonForDate('2026-10-22').id).toBe('primavera')
    expect(seasonForDate('2026-07-20').id).toBe('amigo')
    expect(seasonForDate('2026-06-21').id).toBe('padre')
    expect(seasonForDate('2027-02-14').id).toBe('enamorados')
  })
  it('cada temporada sugiere platos que existen en la carta de cada negocio', () => {
    const s = makeSeed('servicio')
    for (const id of SEASON_IDS) {
      const se = seasonById(id)
      for (const biz of ['mesa-clara', 'ritual-cafe'] as const) {
        expect(se.picks[biz]).toHaveLength(3)
        for (const pid of se.picks[biz]) expect(s.menuItems.find((m) => m.id === pid && m.businessId === biz), `${id}/${pid}`).toBeTruthy()
      }
    }
  })
  it('Configuración puede forzar una temporada por negocio y volver a automática (auditado)', () => {
    let s = makeSeed('servicio')
    expect(activeSeason(s, 'mesa-clara')).toMatchObject({ id: 'madre', forced: false })
    let r = applyCommand(s, { type: 'config/season', businessId: 'mesa-clara', season: 'fiestas' })
    expect(r.outcome.ok).toBe(true)
    s = r.state
    expect(activeSeason(s, 'mesa-clara')).toMatchObject({ id: 'fiestas', forced: true })
    expect(activeSeason(s, 'ritual-cafe').id).toBe('madre')
    expect(s.audit.at(-1)?.type).toBe('config.season')
    expect(validateState(s)).toEqual([])
    r = applyCommand(s, { type: 'config/season', businessId: 'mesa-clara', season: 'fiestas' })
    expect(r.outcome.ok && r.outcome.duplicate).toBe(true)
    r = applyCommand(s, { type: 'config/season', businessId: 'mesa-clara', season: 'carnaval' })
    expect(r.outcome.ok).toBe(false)
    expect(r.state).toBe(s)
  })
})
