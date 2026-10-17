import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

// Verificación real de contraste (WCAG 2.x) de los tokens de styles.css. Objetivo AA: 4,5:1 texto normal, 3:1 componentes.
const lum = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
export const ratio = (a: string, b: string) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p)
  return (x + 0.05) / (y + 0.05)
}
// Pares fijos (franja DEMO, dock, lateral, KDS y comanda impresa: no cambian con el tema). Los decorativos no se incluyen.
// Los tokens de cada identidad y modo se leen de styles.css más abajo (P5-L3).
const pairs: [string, string, string, number][] = [
  ['banner texto', '#e8ece4', '#121812', 4.5],
  ['banner modo', '#b9c3b5', '#121812', 4.5],
  ['dock botón', '#f3f6ef', '#1a2219', 4.5],
  ['dock reloj del botón', '#cfd8cb', '#1a2219', 4.5],
  ['dock rótulo', '#b3bdaf', '#161d15', 4.5],
  ['dock texto', '#cfd8cb', '#161d15', 4.5],
  ['dock control', '#f3f6ef', '#222c20', 4.5],
  ['dock caso', '#b9c3b5', '#1d251c', 4.5],
  ['dock reiniciar', '#ffc2b6', '#222c20', 4.5],
  ['dock reloj', '#1f271e', '#e8ece4', 4.5],
  ['dock borde de control (3:1)', '#7d8a7a', '#161d15', 3],
  ['foco claro/dock (3:1)', '#8ab4f8', '#161d15', 3],
  ['sello DEMO', '#ffffff', '#a44431', 4.5],
  ['lateral texto', '#e8ece4', '#141b13', 4.5],
  ['lateral atenuado', '#a9b3a5', '#141b13', 4.5],
  ['lateral activo', '#141b13', '#e8ece4', 4.5],
  ['KDS texto/columna', '#e8ece4', '#1a221a', 4.5],
  ['KDS atenuado/columna', '#b8c2b4', '#1a221a', 4.5],
  ['KDS leyenda/fondo', '#b8c2b4', '#101510', 4.5],
  ['KDS vacío/columna', '#a9b3a5', '#1a221a', 4.5],
  ['ticket texto', '#1f271e', '#fbf9f4', 4.5],
  ['ticket atenuado', '#566052', '#fbf9f4', 4.5],
  ['ticket mods', '#3a4437', '#fbf9f4', 4.5],
  ['ticket tarde', '#ffffff', '#9c2316', 4.5],
  ['ticket espera retiro', '#6b4100', '#fbeccb', 4.5],
  ['ticket temporizador', '#1f271e', '#e7e9e2', 4.5],
  ['foco claro/KDS (3:1)', '#8ab4f8', '#101510', 3],
  ['aviso efímero', '#f7f3ea', '#1f271e', 4.5],
  ['aviso efímero error', '#ffffff', '#6b150c', 4.5],
]
describe('Contraste de tokens (WCAG 2.2 AA, medido)', () => {
  for (const [name, fg, bg, min] of pairs) {
    it(`${name}: ${fg} / ${bg} ≥ ${min}:1`, () => {
      expect(ratio(fg, bg)).toBeGreaterThanOrEqual(min)
    })
  }
})

// ---- P5-L3 · tokens por identidad y modo, leídos de styles.css ----------------------------------
const css = readFileSync(resolve(__dirname, '../src/styles.css'), 'utf8')
/** Declaraciones `--x: #hex` del primer bloque cuyo selector empieza exactamente así. */
function block(selector: string): Record<string, string> {
  const i = css.indexOf(`\n${selector}`)
  if (i < 0) throw new Error(`bloque no encontrado: ${selector}`)
  const body = css.slice(css.indexOf('{', i) + 1, css.indexOf('}', i))
  const out: Record<string, string> = {}
  for (const m of body.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})\b/g)) out[m[1]] = m[2].toLowerCase()
  return out
}
const base = block(':root {')
const baseDark = block(":root[data-theme='dark'] {")
const biz = (b: string) => ({ light: block(`[data-biz='${b}'] {`), dark: block(`:root[data-theme='dark'][data-biz='${b}'],`) })
const themes: [string, Record<string, string>][] = [
  ['TableFlow claro', base],
  ['TableFlow oscuro', { ...base, ...baseDark }],
]
for (const [b, label] of [['mesa-clara', 'Mesa Clara'], ['ritual-cafe', 'Ritual Café']] as const) {
  const t = biz(b)
  themes.push([`${label} claro`, { ...base, ...t.light }])
  themes.push([`${label} oscuro`, { ...base, ...baseDark, ...t.light, ...t.dark }])
}
// [texto, fondo, mínimo]: texto común, secundario, marca y acento como texto y como botón, estados, tiza, campos y foco
const tokenPairs: [string, string, number][] = [
  ['ink', 'paper', 4.5], ['ink', 'surface', 4.5], ['ink', 'field', 4.5], ['ink-soft', 'paper', 4.5],
  ['muted', 'paper', 4.5], ['muted', 'paper-2', 4.5], ['muted', 'surface', 4.5], ['muted', 'admin-bg', 4.5], ['muted', 'admin-surface', 4.5],
  ['brand', 'paper', 4.5], ['brand', 'surface', 4.5], ['brand', 'brand-tint', 4.5], ['brand-ink', 'brand', 4.5],
  ['accent', 'paper', 4.5], ['accent', 'surface', 4.5], ['accent-ink', 'accent', 4.5],
  ['ok', 'ok-bg', 4.5], ['warn', 'warn-bg', 4.5], ['err', 'err-bg', 4.5], ['info', 'info-bg', 4.5], ['review', 'review-bg', 4.5],
  ['ok-deep', 'ok-bg', 4.5], ['warn-deep', 'warn-bg', 4.5], ['err-deep', 'err-bg', 4.5], ['info-deep', 'info-bg', 4.5], ['review-deep', 'review-bg', 4.5],
  ['ok', 'paper', 4.5], ['err', 'paper', 4.5], ['warn', 'surface', 4.5], ['ok', 'ok-soft', 4.5], ['err', 'err-soft', 4.5],
  ['chalk', 'board', 4.5], ['chalk-dim', 'board', 4.5], ['seal-ink', 'seal', 4.5],
  ['side-ink', 'side', 4.5], ['side-muted', 'side', 4.5],
  ['line-strong', 'field', 3], ['line-strong', 'paper', 3], ['focus', 'paper', 3], ['focus', 'surface', 3],
]
// colores fijos de la pizarra de barra (Ritual) y del tablero (Mesa Clara), sobre la pizarra de cada modo
const boardInks: [string, string, number][] = [['agotado', '#ffb4a6', 4.5], ['consultar', '#f3c77a', 4.5], ['guardado', '#f0b48a', 4.5], ['ocupación (no texto)', '#e7b58f', 3]]

describe('P5-L3 · contraste de cada identidad en claro y oscuro (tokens de styles.css)', () => {
  for (const [name, t] of themes) {
    for (const [fg, bg, min] of tokenPairs) {
      it(`${name}: --${fg} / --${bg} ≥ ${min}:1`, () => {
        expect(t[fg], `falta --${fg}`).toBeTruthy()
        expect(t[bg], `falta --${bg}`).toBeTruthy()
        expect(ratio(t[fg], t[bg])).toBeGreaterThanOrEqual(min)
      })
    }
    for (const [label, hex, min] of boardInks) {
      it(`${name}: ${label} ${hex} / --board ≥ ${min}:1`, () => expect(ratio(hex, t.board)).toBeGreaterThanOrEqual(min))
    }
  }
  it('el oscuro de cada negocio redefine todos los colores que redefine su claro', () => {
    for (const b of ['mesa-clara', 'ritual-cafe']) {
      const t = biz(b)
      const missing = Object.keys(t.light).filter((k) => !(k in t.dark))
      expect(missing, b).toEqual([])
    }
  })
  it('el oscuro de TableFlow redefine papel, tinta, campos y estados', () => {
    for (const k of ['paper', 'surface', 'ink', 'muted', 'field', 'ok-bg', 'err-bg', 'info-bg', 'warn-bg', 'review-bg', 'admin-bg', 'admin-surface']) expect(baseDark[k], k).toBeTruthy()
  })
})
