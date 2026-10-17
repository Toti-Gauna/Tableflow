import { describe, expect, it } from 'vitest'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { FAMILIES, Piece, pieceFor, ALL_PIECES, type IdentityKey } from '../src/ui/art/families'
import { Loyalty, PhoneScreen, Ticket } from '../src/ui/art/families/mockups'
import { makeSeed } from '../src/domain/fixtures'

// P5-L4 · Familias de arte por identidad: cobertura de la carta, SVG sanos y accesibles, mockups.
const IDS = Object.keys(FAMILIES) as IdentityKey[]
const render = (key: string, label?: string) => {
  const p = pieceFor(key)!
  return renderToStaticMarkup(h('div', null, h(Piece, { size: 96, label, children: h(p.Comp) }), h(Piece, { size: 96, label, children: h(p.Comp) })))
}

describe('P5-L4 · familias de arte', () => {
  it('cada ítem de Mesa Clara y Ritual Café tiene su pieza en la familia de su identidad', () => {
    const s = makeSeed('servicio')
    const missing = s.menuItems.filter((m) => !pieceFor(m.id)).map((m) => m.id)
    expect(missing).toEqual([])
    for (const m of s.menuItems) {
      const fam = m.businessId === 'mesa-clara' ? FAMILIES.resto : FAMILIES.cafe
      expect(fam.pieces.some((p) => p.key === m.id), m.id).toBe(true)
    }
  })

  it('las cinco identidades tienen carta y piezas de juego propias; las claves no se repiten', () => {
    const keys = ALL_PIECES.map((p) => p.key)
    expect(new Set(keys).size).toBe(keys.length)
    for (const id of IDS) {
      const ps = FAMILIES[id].pieces
      expect(ps.filter((p) => p.group === 'carta').length, id).toBeGreaterThanOrEqual(12)
      expect(ps.filter((p) => p.group === 'juego').length, id).toBeGreaterThanOrEqual(5)
    }
  })

  it('las bebidas de los negocios familiares que no son el vino de la casa están marcadas sin alcohol', () => {
    for (const id of ['bar', 'hela', 'rapida'] as IdentityKey[]) {
      const drinks = FAMILIES[id].pieces.filter((p) => /limonada|soda|gaseosa|licuado|agua con gas/i.test(p.name))
      expect(drinks.length, id).toBeGreaterThan(0)
      for (const d of drinks) expect(d.name, d.key).toMatch(/sin alcohol/)
    }
  })

  for (const p of ALL_PIECES) {
    it(`${p.key}: viewBox, sin NaN, ids únicos por instancia y referencias resueltas`, () => {
      const html = render(p.key, `Ilustración de ${p.name}`)
      expect(html).toContain('viewBox="0 0 160 160"')
      expect(html).not.toMatch(/NaN|undefined|Infinity/)
      expect(html).not.toMatch(/href="https?:/)
      const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])
      expect(new Set(ids).size, 'ids repetidos entre dos instancias').toBe(ids.length)
      for (const ref of new Set([...html.matchAll(/url\(#([^)]+)\)/g)].map((m) => m[1]))) expect(ids, `url(#${ref})`).toContain(ref)
      expect((html.match(/role="img"/g) ?? []).length).toBe(2)
      expect(html).toContain(`aria-label="Ilustración de ${p.name}"`)
    })
  }

  it('sin etiqueta, la pieza es decorativa (aria-hidden)', () => {
    const html = render('MC-13')
    expect(html).toContain('aria-hidden="true"')
    expect(html).not.toContain('role="img"')
  })

  it('cada identidad tiene comprobante, tarjeta de fidelidad y teléfono con texto real', () => {
    for (const id of IDS) {
      const html = renderToStaticMarkup(h('div', null, h(Ticket, { id }), h(Loyalty, { id }), h(PhoneScreen, { id })))
      expect(html, id).not.toMatch(/NaN|undefined/)
      expect(html, id).toContain(FAMILIES[id].name)
      expect(html, id).toMatch(/aria-label="[^"]+"/)
      expect(html, id).toContain('DEMO')
    }
  })
})
