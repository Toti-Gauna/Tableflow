import { describe, expect, it } from 'vitest'

// Verificación real de contraste (WCAG 2.x) de los tokens de styles.css. Objetivo AA: 4,5:1 texto normal, 3:1 componentes.
const lum = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
export const ratio = (a: string, b: string) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p)
  return (x + 0.05) / (y + 0.05)
}
// Pares P2 (styles.css por marca, consola, admin y KDS). Los decorativos sin información no se incluyen.
const pairs: [string, string, string, number][] = [
  ['MC tinta/papel', '#1f271e', '#f7f3ea', 4.5],
  ['MC atenuado/papel', '#566052', '#f7f3ea', 4.5],
  ['MC atenuado/papel-2', '#566052', '#efe8d8', 4.5],
  ['MC atenuado/superficie', '#566052', '#fffdf8', 4.5],
  ['MC marca/papel', '#355443', '#f7f3ea', 4.5],
  ['blanco/marca MC', '#ffffff', '#355443', 4.5],
  ['MC acento/papel', '#a44431', '#f7f3ea', 4.5],
  ['MC acento/papel-2', '#a44431', '#efe8d8', 4.5],
  ['MC tiza/pizarra', '#f3ebd9', '#233528', 4.5],
  ['MC tiza tenue/pizarra', '#c9d2c3', '#233528', 4.5],
  ['agotado claro/pizarra MC', '#ffb4a6', '#233528', 4.5],
  ['RC tinta/papel', '#241a14', '#f5efe6', 4.5],
  ['RC atenuado/papel', '#5e5247', '#f5efe6', 4.5],
  ['RC atenuado/papel-2', '#5e5247', '#ece2d3', 4.5],
  ['RC atenuado/superficie', '#5e5247', '#fffcf7', 4.5],
  ['RC marca/papel', '#2b1d15', '#f5efe6', 4.5],
  ['crema/espresso', '#f6eedf', '#2b1d15', 4.5],
  ['RC acento/papel', '#8a4b26', '#f5efe6', 4.5],
  ['RC tiza tenue/espresso', '#d8c8b1', '#2b1d15', 4.5],
  ['agotado claro/espresso', '#ffb4a6', '#2b1d15', 4.5],
  ['consultar/espresso', '#f3c77a', '#2b1d15', 4.5],
  ['guardado/espresso', '#f0b48a', '#2b1d15', 4.5],
  ['barra ocupación/espresso (no texto)', '#e7b58f', '#2b1d15', 3],
  ['revisión', '#5b3a7a', '#efe7f6', 4.5],
  ['callout revisión', '#3b2453', '#efe7f6', 4.5],
  ['aviso/papel', '#7a4b00', '#f7f3ea', 4.5],
  ['aviso/superficie RC', '#7a4b00', '#fffcf7', 4.5],
  ['banner texto', '#e8ece4', '#121812', 4.5],
  ['banner modo', '#b9c3b5', '#121812', 4.5],
  ['sello DEMO', '#ffffff', '#a44431', 4.5],
  ['consola rótulo', '#b3bdaf', '#1f281e', 4.5],
  ['consola control', '#f3f6ef', '#2a3428', 4.5],
  ['consola reloj', '#1f271e', '#e8ece4', 4.5],
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
  ['foco claro/consola (3:1)', '#8ab4f8', '#1f281e', 3],
  ['foco claro/espresso (3:1)', '#8ab4f8', '#2b1d15', 3],
  ['foco claro/KDS (3:1)', '#8ab4f8', '#101510', 3],
  ['foco/papel RC (3:1)', '#0b57d0', '#f5efe6', 3],
  ['aviso efímero', '#f7f3ea', '#1f271e', 4.5],
  ['aviso efímero error', '#ffffff', '#6b150c', 4.5],
  ['borde campo/blanco (3:1)', '#8f8a79', '#ffffff', 3],
  ['atenuado/admin', '#566052', '#f3f4f1', 4.5],
  ['atenuado/blanco', '#566052', '#ffffff', 4.5],
  ['ok/papel', '#276a3b', '#f7f3ea', 4.5],
  ['err/papel', '#9c2316', '#f7f3ea', 4.5],
  ['libre/mesa', '#276a3b', '#f3faf4', 4.5],
  ['reservada/mesa', '#7a4b00', '#fbeccb', 4.5],
  ['ocupada/mesa', '#9c2316', '#fbe3df', 4.5],
  ['consola borde de control (3:1)', '#7d8a7a', '#1f281e', 3],
]
describe('Contraste de tokens (WCAG 2.2 AA, medido)', () => {
  for (const [name, fg, bg, min] of pairs) {
    it(`${name}: ${fg} / ${bg} ≥ ${min}:1`, () => {
      expect(ratio(fg, bg)).toBeGreaterThanOrEqual(min)
    })
  }
})
