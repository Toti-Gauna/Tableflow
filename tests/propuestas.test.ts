import { describe, expect, it } from 'vitest'
import { BIZ_ORDER, CONCEPTS, conceptsOf, contrast, contrastPairs } from '../src/pages/propuestas/concepts'

// P5-L2 · Las quince direcciones cumplen AA en claro y oscuro antes de mostrarse (texto 4,5:1, componentes 3:1).
describe('propuestas visuales', () => {
  it('hay tres direcciones por negocio y una recomendada en cada uno', () => {
    for (const b of BIZ_ORDER) {
      expect(conceptsOf(b)).toHaveLength(3)
      expect(conceptsOf(b).filter((c) => c.recommended)).toHaveLength(1)
    }
    expect(new Set(CONCEPTS.map((c) => c.id)).size).toBe(15)
  })
  for (const c of CONCEPTS) {
    for (const mode of ['light', 'dark'] as const) {
      it(`${c.id} ${mode}: contraste AA`, () => {
        const fails = contrastPairs(c[mode]).filter((p) => contrast(p.fg, p.bg) < p.min).map((p) => `${p.label} ${contrast(p.fg, p.bg).toFixed(2)}`)
        expect(fails).toEqual([])
      })
    }
  }
})
