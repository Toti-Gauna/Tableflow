import { describe, expect, it } from 'vitest'
import {
  GAME_BY_BIZ, LEVELS,
  memoStart, memoFlip, memoDone, memoPairs, MEMO_CARDS,
  mesaStart, mesaPick, mesaPlace, mesaDone, mesaPieces,
  heladoStart, heladoAdd, heladoUndo, heladoDiff, heladoDone, heladoSize,
  burgerStart, burgerAdd, burgerDone, burgerOrder,
  dondeStart, dondePick, dondeTarget, dondeDone, DONDE_SCENE,
} from '../src/domain/games'
import { pieceFor } from '../src/ui/art/families'
import { BIZ_IDS } from '../src/domain/business'

// P5-L5 · JG-01…05: cinco juegos distintos, con niveles, progreso, éxito y reintento; sin tiempo, sin azar del sistema.
describe('JG-00 · un juego distinto por negocio', () => {
  it('cada negocio tiene su juego y no se repiten', () => {
    const games = BIZ_IDS.map((b) => GAME_BY_BIZ[b])
    expect(new Set(games).size).toBe(5)
  })
  it('todas las piezas que usan los juegos existen en las familias de arte', () => {
    const keys = [...MEMO_CARDS.map((c) => c.key), ...DONDE_SCENE.map((o) => o.key), 'jg-cafe-dorso', 'jg-resto-individual', 'jg-hela-cucurucho']
    for (const k of keys) expect(pieceFor(k), k).toBeTruthy()
  })
  it('la escena del bar no tiene bebidas con alcohol', () => {
    for (const o of DONDE_SCENE) expect(o.name).not.toMatch(/vermut|cerveza|vino|trago/i)
    expect(DONDE_SCENE.map((o) => o.key)).not.toContain('TC-13')
    expect(DONDE_SCENE.map((o) => o.key)).not.toContain('TC-14')
  })
})

describe('JG-CAF · memoria de la merienda', () => {
  it('tres niveles con 3, 4 y 6 parejas; el mazo es determinista por semilla', () => {
    expect([1, 2, 3].map(memoPairs)).toEqual([3, 4, 6])
    expect(memoStart(2, 5)).toEqual(memoStart(2, 5))
    expect(memoStart(2, 5).deck).not.toEqual(memoStart(2, 6).deck)
  })
  it('pareja, distintas que quedan a la vista hasta el próximo toque, y ganar', () => {
    let s = memoStart(1, 1)
    const pos = (v: number) => s.deck.map((x, i) => (x === v ? i : -1)).filter((i) => i >= 0)
    const [a, b] = pos(0)
    const c = pos(1)[0]
    let r = memoFlip(s, a); s = r.s
    r = memoFlip(s, c); s = r.s
    expect(r.event).toBe('distintas')
    expect(s.open).toEqual([a, c]) // sin temporizador: siguen abiertas
    r = memoFlip(s, a); s = r.s
    expect(s.open).toEqual([a])
    r = memoFlip(s, b); s = r.s
    expect(r.event).toBe('pareja')
    expect(memoFlip(s, a).event).toBe('ignorado')
    for (const v of [1, 2]) { const [x, y] = pos(v); s = memoFlip(memoFlip(s, x).s, y).s }
    expect(memoDone(s)).toBe(true)
    expect(s.moves).toBe(4)
  })
})

describe('JG-RES · poner la mesa', () => {
  it('cada nivel suma piezas; poner algo en otro lugar explica y no rompe nada', () => {
    expect([1, 2, 3].map((l) => mesaPieces(l).length)).toEqual([3, 5, 6])
    let s = mesaStart(1)
    expect(mesaPlace(s, 'plato').event).toBe('sin-eleccion')
    s = mesaPick(s, 'tenedor')
    const wrong = mesaPlace(s, 'cuchillo')
    expect(wrong.event).toBe('otro-lugar')
    expect(wrong.s).toBe(s)
    s = mesaPlace(s, 'tenedor').s
    expect(mesaPick(s, 'tenedor')).toBe(s) // ya está puesto
    for (const p of ['plato', 'cuchillo'] as const) s = mesaPlace(mesaPick(s, p), p).s
    expect(mesaDone(s)).toBe(true)
  })
})

describe('JG-HEL · copiá el helado', () => {
  it('2, 3 y 4 bochas, sin dos iguales seguidas; deshacer y marcar diferencias', () => {
    expect([1, 2, 3].map(heladoSize)).toEqual([2, 3, 4])
    for (let seed = 1; seed < 30; seed++) {
      const m = heladoStart(3, seed).model
      expect(m).toHaveLength(4)
      for (let i = 1; i < m.length; i++) expect(m[i]).not.toBe(m[i - 1])
    }
    let s = heladoStart(2, 3)
    const other = (g: string) => (['frutilla', 'menta'] as const).find((x) => x !== g)!
    s = heladoAdd(s, s.model[0])
    s = heladoAdd(s, other(s.model[1]))
    s = heladoAdd(s, s.model[2])
    expect(heladoAdd(s, 'choco')).toBe(s) // no entra más que el modelo
    expect(heladoDone(s)).toBe(false)
    expect(heladoDiff(s)).toEqual([1])
    s = heladoUndo(heladoUndo(s))
    s = heladoAdd(heladoAdd(s, s.model[1]), s.model[2])
    expect(heladoDone(s)).toBe(true)
  })
})

describe('JG-FR · armá la hamburguesa', () => {
  it('solo entra la capa que sigue en la comanda; si no, dice cuál va', () => {
    expect([1, 2, 3].map((l) => burgerOrder(l).length)).toEqual([4, 6, 8])
    let s = burgerStart(1)
    const r = burgerAdd(s, 'queso')
    expect(r.event).toBe('no-sigue')
    expect(r.expected).toBe('pan-abajo')
    expect(r.s).toBe(s)
    for (const c of burgerOrder(1)) s = burgerAdd(s, c).s
    expect(burgerDone(s)).toBe(true)
    expect(burgerAdd(s, 'carne').event).toBe('completa')
  })
})

describe('JG-BAR · ¿dónde está?', () => {
  it('3, 5 y 7 cosas para encontrar entre 6, 9 y 11; tocar otra cosa no penaliza', () => {
    for (let l = 1; l <= LEVELS; l++) {
      let s = dondeStart(l, 2)
      expect(s.targets.length).toBe([3, 5, 7][l - 1])
      expect(s.objs.length).toBe([6, 9, 11][l - 1])
      const t = dondeTarget(s)!
      const other = s.objs.find((o) => o.key !== t)!.key
      expect(dondePick(s, other).event).toBe('otro')
      while (dondeTarget(s)) s = dondePick(s, dondeTarget(s)!).s
      expect(dondeDone(s)).toBe(true)
      expect(dondePick(s, t).event).toBe('terminado')
    }
  })
})
