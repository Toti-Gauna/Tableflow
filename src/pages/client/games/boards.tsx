import { useEffect, useState } from 'react'
import { Piece, pieceFor } from '../../../ui/art/families'
import { sfx } from '../../../ui/sfx'
import {
  MEMO_CARDS, memoStart, memoFlip, memoDone,
  MESA_NAME, MESA_SLOT, mesaStart, mesaPick, mesaPlace, mesaDone, type MesaPiece,
  SCOOPS, SCOOP_NAME, heladoStart, heladoAdd, heladoUndo, heladoDiff, heladoDone, type Scoop,
  CAPA_ART, CAPA_NAME, burgerStart, burgerAdd, burgerDone, type Capa,
  dondeStart, dondePick, dondeTarget, dondeDone,
} from '../../../domain/games'
import type { GameApi } from './GameFrame'

/** Pieza de una familia de arte por clave (decorativa: el texto accesible lo lleva el botón). */
export function Art({ k, size }: { k: string; size: number }) {
  const p = pieceFor(k)
  return p ? <Piece size={size}><p.Comp /></Piece> : null
}

// ------------------------------------------------------------------ JG-CAF · memoria de la merienda
export function MemoriaBoard({ api }: { api: GameApi }) {
  const [s, setS] = useState(() => memoStart(api.level, api.seed))
  const pairs = s.deck.length / 2
  useEffect(() => api.progress(s.found.length / 2, pairs), [s.found.length, pairs, api])
  const flip = (i: number) => {
    const r = memoFlip(s, i)
    if (r.event === 'ignorado') return
    setS(r.s)
    const name = (k: number) => MEMO_CARDS[r.s.deck[k]].name
    if (r.event === 'pareja') {
      if (memoDone(r.s)) return api.win(`Encontraste las ${pairs} parejas en ${r.s.moves} jugadas.`)
      sfx('match'); api.say(`¡Pareja! ${name(i)}.`)
    } else if (r.event === 'distintas') {
      sfx('flip'); api.say(`${name(r.s.open[0])} y ${name(r.s.open[1])} no son pareja. Tocá otra carta para seguir.`)
    } else sfx('flip')
  }
  return (
    <>
      <p className="game-tip">Jugadas: <strong data-testid="memoria-moves">{s.moves}</strong> · Si dos cartas no son pareja, quedan a la vista hasta que toques otra.</p>
      <ul className="memo-grid g-memo" data-pairs={pairs} aria-label="Cartas de la merienda">
        {s.deck.map((v, i) => {
          const up = s.open.includes(i) || s.found.includes(i)
          const done = s.found.includes(i)
          const card = MEMO_CARDS[v]
          return (
            <li key={i}>
              <button type="button" className={`memo-card ${up ? 'up' : ''} ${done ? 'done' : ''}`} onClick={() => flip(i)} aria-disabled={done || undefined}
                aria-label={up ? `Carta ${i + 1}: ${card.name}${done ? ', encontrada' : ''}` : `Carta ${i + 1}, boca abajo`} data-testid={`memoria-${i}`} data-card={card.key}>
                <span className="memo-inner">
                  <span className="memo-face back" aria-hidden="true"><Art k="jg-cafe-dorso" size={72} /></span>
                  <span className="memo-face front" aria-hidden="true"><Art k={card.key} size={72} /></span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </>
  )
}

// ------------------------------------------------------------------ JG-RES · poner la mesa
const MESA_ART: Record<MesaPiece, string> = { plato: 'jg-resto-plato', tenedor: 'jg-resto-tenedor', cuchillo: 'jg-resto-cuchillo', cuchara: 'jg-resto-cuchara', vaso: 'jg-resto-vaso', servilleta: 'jg-resto-servilleta' }
/** Lugar de cada cosa sobre el individual, en % (izquierda, arriba). */
const MESA_POS: Record<MesaPiece, [number, number]> = { plato: [50, 52], tenedor: [25, 52], cuchillo: [73, 52], cuchara: [88, 52], vaso: [82, 16], servilleta: [25, 88] }

export function MesaBoard({ api }: { api: GameApi }) {
  const [s, setS] = useState(() => mesaStart(api.level))
  useEffect(() => api.progress(s.placed.length, s.pieces.length), [s.placed.length, s.pieces.length, api])
  const pick = (p: MesaPiece) => {
    const n = mesaPick(s, p)
    setS(n)
    sfx('tap')
    api.say(n.picked ? `Elegiste ${MESA_NAME[p]}. Ahora tocá su lugar en el individual.` : 'Soltaste la pieza.')
  }
  const place = (slot: MesaPiece) => {
    const r = mesaPlace(s, slot)
    if (r.event === 'sin-eleccion') return api.say('Primero elegí una pieza de la bandeja.')
    if (r.event === 'ocupado') return api.say('Ese lugar ya está listo.')
    if (r.event === 'otro-lugar') return api.say(`Ese lugar es para ${MESA_NAME[slot]}. ${cap(MESA_NAME[s.picked!])} va ${MESA_SLOT[s.picked!]}.`)
    setS(r.s)
    if (mesaDone(r.s)) return api.win('¡La mesa quedó lista para comer!')
    sfx('match'); api.say(`¡Bien! ${cap(MESA_NAME[slot])} va ${MESA_SLOT[slot]}.`)
  }
  const tray = s.pieces.filter((p) => !s.placed.includes(p))
  return (
    <div className="g-mesa">
      <div className="g-tray" role="group" aria-label="Bandeja: elegí una pieza">
        {tray.map((p) => (
          <button key={p} type="button" className="g-piece" aria-pressed={s.picked === p} onClick={() => pick(p)} data-testid={`mesa-pick-${p}`}>
            <Art k={MESA_ART[p]} size={64} /><span>{cap(MESA_NAME[p].split(' ')[1])}</span>
          </button>
        ))}
        {tray.length === 0 && <p className="muted">¡Bandeja vacía!</p>}
      </div>
      <div className="g-mantel" role="group" aria-label="Individual con los lugares marcados">
        {s.pieces.map((p) => {
          const done = s.placed.includes(p)
          const [x, y] = MESA_POS[p]
          return (
            <button key={p} type="button" className={`g-slot ${done ? 'done' : ''}`} style={{ left: `${x}%`, top: `${y}%` }} onClick={() => place(p)}
              aria-label={done ? `${cap(MESA_NAME[p])}, en su lugar` : `Lugar ${MESA_SLOT[p]}`} data-testid={`mesa-slot-${p}`}>
              <span className={done ? '' : 'ghost'} aria-hidden="true"><Art k={MESA_ART[p]} size={p === 'plato' ? 96 : 64} /></span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1)

// ------------------------------------------------------------------ JG-HEL · copiá el helado
function Cone({ scoops, size, slots, mark = [] }: { scoops: Scoop[]; size: number; slots: number; mark?: number[] }) {
  // posiciones fijas: la bocha i se apoya sobre la anterior, siempre a la misma altura en el modelo y en el tuyo
  const step = size * 0.36
  return (
    <div className="g-cone" style={{ width: size, height: size + step * (slots - 1) + size * 0.42 }}>
      <span className="g-cup" style={{ bottom: 0 }}><Art k="jg-hela-cucurucho" size={size} /></span>
      {scoops.map((g, i) => <span key={i} className={`g-scoop ${mark.includes(i) ? 'off' : ''}`} style={{ bottom: size * 0.42 + i * step, zIndex: 10 + i }}><Art k={`jg-hela-${g}`} size={size} /></span>)}
    </div>
  )
}

export function HeladoBoard({ api }: { api: GameApi }) {
  const [s, setS] = useState(() => heladoStart(api.level, api.seed))
  const [hide, setHide] = useState(false)
  const diff = s.cone.length === s.model.length ? heladoDiff(s) : []
  const okCount = s.cone.filter((g, i) => s.model[i] === g).length
  useEffect(() => api.progress(okCount, s.model.length), [okCount, s.model.length, api])
  const add = (g: Scoop) => {
    const n = heladoAdd(s, g)
    if (n === s) return api.say('El cucurucho ya está completo. Sacá la última bocha para cambiarla.')
    setS(n)
    sfx('tap')
    if (heladoDone(n)) return api.win(`¡Igualito al del cartel! ${n.model.length} bochas en su lugar.`)
    if (n.cone.length === n.model.length) {
      const d = heladoDiff(n).map((i) => i + 1)
      api.say(`Casi: ${d.length === 1 ? `la bocha ${d[0]}` : `las bochas ${d.join(' y ')}`} (contando desde abajo) no ${d.length === 1 ? 'es igual' : 'son iguales'}. Sacá bochas y probá otra vez.`)
    } else api.say(`Bocha de ${SCOOP_NAME[g]}. Van ${n.cone.length} de ${n.model.length}.`)
  }
  const describe = (list: Scoop[]) => list.map((g) => SCOOP_NAME[g]).join(', ')
  return (
    <div className="g-helado">
      <figure className="g-model" data-model={hide ? undefined : s.model.join(' ')}>
        <figcaption>Así lo pidieron <span className="muted small">(de abajo hacia arriba: {hide ? 'oculto' : describe(s.model)})</span></figcaption>
        {hide ? <div className="g-hidden"><p>Modelo escondido.</p></div> : <Cone scoops={s.model} size={84} slots={s.model.length} />}
        <label className="game-calm"><input type="checkbox" checked={hide} onChange={(e) => setHide(e.target.checked)} data-testid="helado-hide" /> Esconder el modelo (desafío de memoria)</label>
      </figure>
      <figure className="g-mine">
        <figcaption>Tu helado</figcaption>
        <Cone scoops={s.cone} size={84} slots={s.model.length} mark={diff} />
        <button className="btn ghost small" type="button" onClick={() => { setS(heladoUndo(s)); api.say('Sacaste la última bocha.') }} disabled={!s.cone.length} data-testid="helado-undo">Sacar la última bocha</button>
      </figure>
      <div className="g-palette" role="group" aria-label="Gustos">
        {SCOOPS.map((g) => (
          <button key={g} type="button" className="g-piece" onClick={() => add(g)} data-testid={`helado-${g}`}>
            <Art k={`jg-hela-${g}`} size={56} /><span>{cap(SCOOP_NAME[g])}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ------------------------------------------------------------------ JG-FR · armá la hamburguesa
/** Rodajas dibujadas desde arriba: en la pila se ven de costado. */
const ROUND: Capa[] = ['tomate', 'cebolla', 'pepino']
const ALL_CAPAS: Capa[] = ['pan-abajo', 'carne', 'queso', 'lechuga', 'tomate', 'cebolla', 'pepino', 'pan-arriba']
export function HamburguesaBoard({ api }: { api: GameApi }) {
  const [s, setS] = useState(() => burgerStart(api.level))
  const [hint, setHint] = useState<Capa | null>(null)
  useEffect(() => api.progress(s.stack.length, s.order.length), [s.stack.length, s.order.length, api])
  const add = (c: Capa) => {
    const r = burgerAdd(s, c)
    if (r.event === 'no-sigue') { setHint(r.expected!); return api.say(`Todavía no: según la comanda ahora va ${CAPA_NAME[r.expected!]}.`) }
    if (r.event === 'completa') return
    setS(r.s); setHint(null); sfx('tap')
    if (burgerDone(r.s)) return api.win(`¡Comanda lista! Armaste una hamburguesa de ${r.s.order.length} capas.`)
    api.say(`${cap(CAPA_NAME[c])}. Sigue ${CAPA_NAME[r.s.order[r.s.stack.length]]}.`)
  }
  const next = s.order[s.stack.length]
  return (
    <div className="g-burger">
      <ol className="g-ticket" aria-label="Comanda, de abajo hacia arriba">
        {s.order.map((c, i) => (
          <li key={i} data-state={i < s.stack.length ? 'done' : i === s.stack.length ? 'next' : 'todo'} className={hint === c && i === s.stack.length ? 'hint' : ''}>
            <span className="sr-only">{i < s.stack.length ? 'Hecho: ' : i === s.stack.length ? 'Sigue: ' : ''}</span>{i + 1}. {cap(CAPA_NAME[c])}
          </li>
        ))}
      </ol>
      <div className="g-stack" aria-label={`Tu hamburguesa: ${s.stack.length ? s.stack.map((c) => CAPA_NAME[c]).join(', ') : 'vacía'}`} role="img" style={{ height: 120 + s.order.length * 22 }}>
        {/* cada capa se apoya sobre la anterior: el centro del dibujo sube 22 px por capa */}
        {s.stack.map((c, i) => <span key={i} className={`g-layer ${ROUND.includes(c) ? 'round' : ''}`} style={{ zIndex: i + 1, bottom: 30 + i * 22 - 75 }}><Art k={CAPA_ART[c]} size={150} /></span>)}
        {!s.stack.length && <span className="g-plate-empty">Plato vacío</span>}
      </div>
      <div className="g-palette" role="group" aria-label="Ingredientes">
        {ALL_CAPAS.map((c) => (
          <button key={c} type="button" className={`g-piece ${hint === c ? 'is-hint' : ''}`} onClick={() => add(c)} data-testid={`burger-${c}`} data-next={c === next || undefined}>
            <Art k={CAPA_ART[c]} size={56} /><span>{cap(CAPA_NAME[c])}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ------------------------------------------------------------------ JG-BAR · ¿dónde está?
export function DondeBoard({ api }: { api: GameApi }) {
  const [s, setS] = useState(() => dondeStart(api.level, api.seed))
  useEffect(() => api.progress(s.found.length, s.targets.length), [s.found.length, s.targets.length, api])
  const target = dondeTarget(s)
  const tName = s.objs.find((o) => o.key === target)?.name ?? ''
  const pick = (key: string) => {
    const r = dondePick(s, key)
    const name = s.objs.find((o) => o.key === key)!.name
    if (r.event === 'otro') return api.say(`Eso es ${name}. Seguí buscando ${tName}.`)
    if (r.event !== 'bien') return
    setS(r.s); sfx('match')
    if (dondeDone(r.s)) return api.win(`¡Encontraste las ${r.s.targets.length} cosas del patio!`)
    const nt = r.s.objs.find((o) => o.key === dondeTarget(r.s))!.name
    api.say(`¡Ahí está ${name}! Ahora buscá ${nt}.`)
  }
  return (
    <div className="g-donde">
      <p className="g-ask" aria-live="polite">¿Dónde está <strong data-testid="donde-target">{tName}</strong>?</p>
      <div className="g-scene" role="group" aria-label="Patio con música en familia">
        <span className="g-lights" aria-hidden="true" />
        <span className="g-stage" aria-hidden="true" />
        <span className="g-rug" aria-hidden="true" />
        {[[46, 80], [79, 84], [24, 88]].map(([x, y]) => <span key={x} className="g-table" style={{ left: `${x}%`, top: `${y}%` }} aria-hidden="true" />)}
        {s.objs.map((o) => {
          const done = s.found.includes(o.key)
          return (
            <button key={o.key} type="button" className={`g-obj ${done ? 'done' : ''}`} style={{ left: `${o.x}%`, top: `${o.y}%` }} onClick={() => pick(o.key)}
              aria-label={done ? `${cap(o.name)}, encontrado` : cap(o.name)} data-testid={`donde-${o.key}`}>
              <Art k={o.key} size={80} />
            </button>
          )
        })}
      </div>
      <p className="game-tip">Encontradas: {s.found.length} de {s.targets.length}. Con el teclado, Tab recorre las cosas del patio y Enter elige.</p>
    </div>
  )
}
