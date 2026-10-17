import { describe, expect, it } from 'vitest'
import { IDENTITIES, contrast, contrastPairs } from '../src/pages/propuestas/identities'

// P5-L2b · Una identidad por negocio; los tokens de texto cumplen AA (4,5:1) en claro y oscuro.
describe('identidades visuales', () => {
  it('hay exactamente una identidad por negocio', () => {
    expect(IDENTITIES.map((i) => i.biz).sort()).toEqual(['bar', 'cafe', 'hela', 'rapida', 'resto'])
  })
  it('cada identidad declara tipografías propias distintas a las demás', () => {
    const displays = IDENTITIES.map((i) => i.type.display.split(',')[0])
    expect(new Set(displays).size).toBe(5)
  })
  for (const i of IDENTITIES) {
    for (const mode of ['light', 'dark'] as const) {
      it(`${i.biz} ${mode}: contraste AA de los tokens de texto`, () => {
        const fails = contrastPairs(i[mode]).filter((p) => contrast(p.fg, p.bg) < 4.5).map((p) => `${p.label} ${contrast(p.fg, p.bg).toFixed(2)}`)
        expect(fails).toEqual([])
      })
    }
  }
})
