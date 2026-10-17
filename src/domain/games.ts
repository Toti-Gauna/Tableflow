/**
 * P5-L5 · Juegos de la zona familiar: lógica pura y determinista (sin reloj, sin azar del sistema, sin datos personales).
 * Cada juego expone niveles, un estado inicial, una acción y si ya se completó. La interfaz solo dibuja.
 * Ningún juego tiene tiempo límite, puntaje público, premios ni relación con la compra.
 */
import type { BusinessId } from './types'

export type GameId = 'memoria' | 'mesa' | 'helado' | 'hamburguesa' | 'donde'
export const GAME_BY_BIZ: Record<BusinessId, GameId> = {
  'ritual-cafe': 'memoria',
  'mesa-clara': 'mesa',
  copo: 'helado',
  brasa: 'hamburguesa',
  compas: 'donde',
}
export const LEVELS = 3

/** PRNG determinista (LCG) para barajar con una semilla fija por partida. */
export function seeded(seed: number) {
  let s = seed >>> 0 || 1
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}
export function shuffle<T>(list: readonly T[], seed: number): T[] {
  const r = seeded(seed)
  const a = [...list]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
const lvl = (level: number) => Math.min(LEVELS, Math.max(1, Math.round(level)))

// ------------------------------------------------------------------ memoria (Ritual Café)
export const MEMO_CARDS = [
  { key: 'jg-cafe-medialuna', name: 'Medialuna' },
  { key: 'jg-cafe-taza', name: 'Taza de café con leche' },
  { key: 'jg-cafe-frutilla', name: 'Frutilla' },
  { key: 'jg-cafe-naranja', name: 'Rodaja de naranja' },
  { key: 'RC-17', name: 'Submarino' },
  { key: 'RC-14', name: 'Budín de limón' },
] as const
export interface MemoState { deck: number[]; open: number[]; found: number[]; moves: number }
export const memoPairs = (level: number) => [3, 4, 6][lvl(level) - 1]
export function memoStart(level: number, seed: number): MemoState {
  const n = memoPairs(level)
  const base = Array.from({ length: n * 2 }, (_, i) => i % n)
  return { deck: shuffle(base, seed * 31 + level), open: [], found: [], moves: 0 }
}
/**
 * Dar vuelta una carta. Sin temporizadores: dos cartas que no son pareja quedan a la vista hasta el próximo toque.
 * Devuelve el estado nuevo y qué pasó, para anunciarlo.
 */
export function memoFlip(s: MemoState, i: number): { s: MemoState; event: 'ignorado' | 'abierta' | 'pareja' | 'distintas' } {
  if (i < 0 || i >= s.deck.length || s.found.includes(i)) return { s, event: 'ignorado' }
  // con dos distintas a la vista, cualquier toque (también sobre una de ellas) las tapa y abre la elegida
  if (s.open.length === 2) return { s: { ...s, open: [i] }, event: 'abierta' }
  if (s.open.includes(i)) return { s, event: 'ignorado' }
  const open = [...s.open, i]
  if (open.length < 2) return { s: { ...s, open }, event: 'abierta' }
  const moves = s.moves + 1
  if (s.deck[open[0]] === s.deck[open[1]]) return { s: { ...s, open: [], found: [...s.found, ...open], moves }, event: 'pareja' }
  return { s: { ...s, open, moves }, event: 'distintas' }
}
export const memoDone = (s: MemoState) => s.found.length === s.deck.length

// ------------------------------------------------------------------ poner la mesa (Mesa Clara)
export type MesaPiece = 'plato' | 'tenedor' | 'cuchillo' | 'cuchara' | 'vaso' | 'servilleta'
export const MESA_NAME: Record<MesaPiece, string> = { plato: 'el plato', tenedor: 'el tenedor', cuchillo: 'el cuchillo', cuchara: 'la cuchara', vaso: 'el vaso', servilleta: 'la servilleta' }
/** Dónde va cada cosa en el individual (como se pone la mesa en casa). */
export const MESA_SLOT: Record<MesaPiece, string> = { plato: 'en el centro', tenedor: 'a la izquierda del plato', cuchillo: 'a la derecha del plato', cuchara: 'a la derecha del cuchillo', vaso: 'arriba a la derecha', servilleta: 'debajo del tenedor' }
export const mesaPieces = (level: number): MesaPiece[] => [
  ['plato', 'tenedor', 'cuchillo'],
  ['plato', 'tenedor', 'cuchillo', 'vaso', 'servilleta'],
  ['plato', 'tenedor', 'cuchillo', 'cuchara', 'vaso', 'servilleta'],
][lvl(level) - 1] as MesaPiece[]
export interface MesaState { pieces: MesaPiece[]; placed: MesaPiece[]; picked: MesaPiece | null }
export const mesaStart = (level: number): MesaState => ({ pieces: mesaPieces(level), placed: [], picked: null })
export function mesaPick(s: MesaState, p: MesaPiece): MesaState {
  if (!s.pieces.includes(p) || s.placed.includes(p)) return s
  return { ...s, picked: s.picked === p ? null : p }
}
/** Poner lo elegido en un lugar. Si no es su lugar, no pasa nada malo: se explica dónde va. */
export function mesaPlace(s: MesaState, slot: MesaPiece): { s: MesaState; event: 'sin-eleccion' | 'bien' | 'otro-lugar' | 'ocupado' } {
  if (!s.picked) return { s, event: 'sin-eleccion' }
  if (s.placed.includes(slot)) return { s, event: 'ocupado' }
  if (slot !== s.picked) return { s, event: 'otro-lugar' }
  return { s: { ...s, placed: [...s.placed, slot], picked: null }, event: 'bien' }
}
export const mesaDone = (s: MesaState) => s.pieces.every((p) => s.placed.includes(p))

// ------------------------------------------------------------------ copiá el helado (Copo)
export const SCOOPS = ['frutilla', 'ddl', 'choco', 'pistacho', 'limon', 'menta'] as const
export type Scoop = (typeof SCOOPS)[number]
export const SCOOP_NAME: Record<Scoop, string> = { frutilla: 'frutilla', ddl: 'dulce de leche', choco: 'chocolate', pistacho: 'pistacho', limon: 'limón', menta: 'menta' }
export const heladoSize = (level: number) => [2, 3, 4][lvl(level) - 1]
export interface HeladoState { model: Scoop[]; cone: Scoop[]; checked: boolean }
export function heladoStart(level: number, seed: number): HeladoState {
  const r = seeded(seed * 17 + level)
  const model: Scoop[] = []
  // gustos variados: nunca dos bochas iguales seguidas, para que se distingan
  while (model.length < heladoSize(level)) {
    const g = SCOOPS[Math.floor(r() * SCOOPS.length)]
    if (model[model.length - 1] !== g) model.push(g)
  }
  return { model, cone: [], checked: false }
}
export function heladoAdd(s: HeladoState, g: Scoop): HeladoState {
  if (s.cone.length >= s.model.length) return s
  return { ...s, cone: [...s.cone, g], checked: false }
}
export const heladoUndo = (s: HeladoState): HeladoState => ({ ...s, cone: s.cone.slice(0, -1), checked: false })
/** Posiciones (de abajo hacia arriba) que no coinciden con el modelo. */
export const heladoDiff = (s: HeladoState) => s.model.map((g, i) => (s.cone[i] === g ? -1 : i)).filter((i) => i >= 0)
export const heladoDone = (s: HeladoState) => s.cone.length === s.model.length && heladoDiff(s).length === 0

// ------------------------------------------------------------------ armá la hamburguesa (Brasa Rápida)
export type Capa = 'pan-abajo' | 'carne' | 'queso' | 'lechuga' | 'tomate' | 'cebolla' | 'pepino' | 'pan-arriba'
export const CAPA_NAME: Record<Capa, string> = { 'pan-abajo': 'pan de abajo', carne: 'medallón', queso: 'cheddar', lechuga: 'lechuga', tomate: 'tomate', cebolla: 'cebolla morada', pepino: 'pepino', 'pan-arriba': 'pan de arriba' }
export const CAPA_ART: Record<Capa, string> = { 'pan-abajo': 'jg-rapida-pan-abajo', carne: 'jg-rapida-carne', queso: 'jg-rapida-queso', lechuga: 'jg-rapida-lechuga', tomate: 'jg-rapida-tomate', cebolla: 'jg-rapida-cebolla', pepino: 'jg-rapida-pepino', 'pan-arriba': 'jg-rapida-pan-arriba' }
/** Comandas de cada nivel, de abajo hacia arriba. */
export const burgerOrder = (level: number): Capa[] => [
  ['pan-abajo', 'carne', 'queso', 'pan-arriba'],
  ['pan-abajo', 'carne', 'queso', 'lechuga', 'tomate', 'pan-arriba'],
  ['pan-abajo', 'lechuga', 'carne', 'queso', 'pepino', 'cebolla', 'tomate', 'pan-arriba'],
][lvl(level) - 1] as Capa[]
export interface BurgerState { order: Capa[]; stack: Capa[] }
export const burgerStart = (level: number): BurgerState => ({ order: burgerOrder(level), stack: [] })
/** Sumar una capa: solo entra la que sigue en la comanda; si no, se avisa cuál va (sin penalidad). */
export function burgerAdd(s: BurgerState, c: Capa): { s: BurgerState; event: 'bien' | 'no-sigue' | 'completa'; expected?: Capa } {
  if (s.stack.length >= s.order.length) return { s, event: 'completa' }
  const expected = s.order[s.stack.length]
  if (c !== expected) return { s, event: 'no-sigue', expected }
  return { s: { ...s, stack: [...s.stack, c] }, event: 'bien' }
}
export const burgerDone = (s: BurgerState) => s.stack.length === s.order.length

// ------------------------------------------------------------------ ¿dónde está? (Taberna Compás, sin alcohol)
export interface DondeObj { key: string; name: string; x: number; y: number }
/** Escena de un patio con música en familia: instrumentos y comida sin alcohol. Coordenadas en % del escenario. */
export const DONDE_SCENE: DondeObj[] = [
  { key: 'jg-bar-saxo', name: 'el saxo', x: 14, y: 22 },
  { key: 'jg-bar-trompeta', name: 'la trompeta', x: 70, y: 16 },
  { key: 'jg-bar-contrabajo', name: 'el contrabajo', x: 86, y: 52 },
  { key: 'jg-bar-piano', name: 'el teclado', x: 40, y: 30 },
  { key: 'jg-bar-platillo', name: 'el platillo', x: 58, y: 48 },
  { key: 'jg-bar-microfono', name: 'el micrófono', x: 28, y: 58 },
  { key: 'jg-bar-disco', name: 'el disco', x: 8, y: 74 },
  { key: 'TC-01', name: 'las papas bravas', x: 46, y: 76 },
  { key: 'TC-07', name: 'las aceitunas', x: 68, y: 80 },
  { key: 'TC-09', name: 'la limonada', x: 90, y: 84 },
  { key: 'TC-04', name: 'el pan con tomate', x: 24, y: 86 },
]
export const dondeCount = (level: number) => [{ objs: 6, targets: 3 }, { objs: 9, targets: 5 }, { objs: 11, targets: 7 }][lvl(level) - 1]
export interface DondeState { objs: DondeObj[]; targets: string[]; found: string[] }
export function dondeStart(level: number, seed: number): DondeState {
  const { objs, targets } = dondeCount(level)
  const pool = DONDE_SCENE.slice(0, objs)
  return { objs: pool, targets: shuffle(pool.map((o) => o.key), seed * 13 + level).slice(0, targets), found: [] }
}
export const dondeTarget = (s: DondeState) => s.targets.find((k) => !s.found.includes(k)) ?? null
export function dondePick(s: DondeState, key: string): { s: DondeState; event: 'bien' | 'otro' | 'terminado' } {
  const t = dondeTarget(s)
  if (!t) return { s, event: 'terminado' }
  if (key !== t) return { s, event: 'otro' }
  return { s: { ...s, found: [...s.found, key] }, event: 'bien' }
}
export const dondeDone = (s: DondeState) => s.targets.every((k) => s.found.includes(k))
