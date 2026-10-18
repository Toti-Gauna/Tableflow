import { describe, expect, it } from 'vitest'
import { runStep, SCENE_IDS, sceneFor, scenesFor, type SceneApi } from '../src/domain/scenes'
import type { BusinessId } from '../src/domain/types'
import { T } from './helpers'

// P5-L9 · Las escenas recorren el producto con comandos reales y cada paso deja un efecto verificable.
const BIZ: BusinessId[] = ['mesa-clara', 'ritual-cafe', 'copo', 'compas', 'brasa']
function api(t: T): SceneApi {
  return { state: () => t.s, run: (cmd) => t.run({ ...cmd }, (cmd.actor as any) ?? t.s.session.role), vars: {} }
}

describe('SC · variantes pertinentes por negocio', () => {
  it('cada negocio tiene al menos dos escenas y solo las que le corresponden', () => {
    const map = Object.fromEntries(BIZ.map((b) => [b, scenesFor(b).map((s) => s.id)]))
    expect(map).toEqual({
      'mesa-clara': ['llamada', 'qr-mesa', 'campana'],
      'ritual-cafe': ['whatsapp', 'qr-mesa', 'retiro', 'campana'],
      copo: ['whatsapp', 'retiro'],
      compas: ['llamada', 'qr-mesa'],
      brasa: ['whatsapp', 'retiro'],
    })
    for (const id of SCENE_IDS) expect(BIZ.some((b) => sceneFor(b, id))).toBe(true)
  })
  it('los briefs son breves (5–10 s) y cada paso dice qué mira el teléfono y qué pantalla queda de fondo', () => {
    for (const b of BIZ) for (const sc of scenesFor(b)) for (const st of sc.steps) {
      expect(st.seconds).toBeGreaterThanOrEqual(5)
      expect(st.seconds).toBeLessThanOrEqual(10)
      expect(st.brief.length).toBeLessThan(200)
      expect(st.phone.kind).toBeTruthy()
    }
  })
})

describe('SC · cada escena se completa con efectos verificables', () => {
  for (const b of BIZ) {
    for (const sc of scenesFor(b)) {
      it(`${b} · ${sc.id}`, () => {
        const t = T.seed()
        t.s.session.businessId = b
        const a = api(t)
        for (const st of sc.steps) {
          const r = runStep(a, st)
          expect(r.message, `${sc.id}/${st.id}: ${r.message}`).toBeNull()
          expect(st.screen(t.s, a.vars)).toMatch(/^\//)
        }
      })
    }
  }
})

describe('SC · repetir un paso no duplica nada', () => {
  it('correr dos veces el mismo paso deja un solo pedido', () => {
    const t = T.seed()
    t.s.session.businessId = 'brasa'
    const a = api(t)
    const sc = sceneFor('brasa', 'retiro')!
    runStep(a, sc.steps[0])
    const n = t.s.orders.length
    runStep(a, sc.steps[0])
    runStep(a, sc.steps[0])
    expect(t.s.orders.length).toBe(n)
  })
  it('una escena terminada se puede volver a mirar sin nuevos efectos (verificación pura)', () => {
    const t = T.seed()
    t.s.session.businessId = 'copo'
    const a = api(t)
    const sc = sceneFor('copo', 'whatsapp')!
    for (const st of sc.steps) runStep(a, st)
    const snap = JSON.stringify(t.s.orders)
    for (const st of sc.steps) expect(runStep(a, st).ok).toBe(true)
    expect(JSON.stringify(t.s.orders)).toBe(snap)
  })
})

describe('GU-01 · guía por rol, módulo y tarea', () => {
  it('cada tarea aplicable tiene rol, módulo, explicación adaptada al negocio y pasos; Copo y Brasa no tienen reservas', async () => {
    const { tasksFor, GUIDE_TASKS } = await import('../src/domain/guide')
    const t = T.seed()
    for (const b of t.s.businesses) {
      const ts = tasksFor(b)
      expect(ts.length).toBeGreaterThanOrEqual(10)
      for (const k of ts) {
        expect(k.why(b)).toBeTruthy()
        expect(k.steps(b).length).toBeGreaterThan(0)
        expect(k.to(b)).toMatch(/^\//)
      }
      if (!b.reservationsEnabled) expect(ts.some((k) => k.id === 'cliente-reserva')).toBe(false)
    }
    expect(new Set(GUIDE_TASKS.map((k) => k.role)).size).toBe(5)
    const mc = t.s.businesses.find((b) => b.id === 'mesa-clara')!
    const rc = t.s.businesses.find((b) => b.id === 'ritual-cafe')!
    const caja = GUIDE_TASKS.find((k) => k.id === 'caja-cobro')!
    expect(caja.why(rc)).toMatch(/mostrador/)
    expect(caja.why(mc)).toMatch(/mesa/)
  })
  it('una tarea cuenta como hecha solo por un evento real posterior al inicio de la práctica', async () => {
    const { GUIDE_TASKS, taskDone } = await import('../src/domain/guide')
    const t = T.seed()
    const task = GUIDE_TASKS.find((k) => k.id === 'cocina-tablero')!
    const since = t.s.audit.length
    expect(taskDone(t.s, 'brasa', task, since)).toBe(false)
    t.s.session.businessId = 'brasa'
    const a = api(t)
    const sc = sceneFor('brasa', 'retiro')!
    runStep(a, sc.steps[0])
    expect(taskDone(t.s, 'brasa', task, since)).toBe(false)
    runStep(a, sc.steps[1])
    expect(taskDone(t.s, 'brasa', task, since)).toBe(true)
    expect(taskDone(t.s, 'copo', task, since)).toBe(false) // otro negocio no cuenta
  })
})
