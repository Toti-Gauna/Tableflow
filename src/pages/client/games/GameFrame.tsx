import { SeasonArt } from '../../../ui/art/season'
import type { SeasonId } from '../../../domain/types'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Glyph } from '../../../ui/glyphs'
import { sfx } from '../../../ui/sfx'
import { LEVELS } from '../../../domain/games'
import './games.css'

export type Phase = 'inicio' | 'jugando' | 'pausa' | 'exito'
export interface GameApi {
  level: number
  /** Cambia en cada reintento: la partida nueva se baraja distinto, siempre de forma determinista. */
  seed: number
  /** Movimiento reducido: sin giros ni rebotes (sistema o elección en el juego). */
  calm: boolean
  progress: (done: number, total: number) => void
  say: (msg: string) => void
  win: (msg: string) => void
}

const LEVEL_NAME = ['Fácil', 'Medio', 'Difícil']

function prefersReduced() {
  try {
    return globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
  } catch {
    return false
  }
}

/**
 * JG-FRAME · Marco común de los cinco juegos de la zona familiar: inicio con instrucciones, partida con progreso,
 * pausa (botón o Escape), éxito, reintento y salida. Sin tiempo límite, sin puntajes públicos, sin datos y sin premios.
 */
export function GameFrame({ id, title, tagline, art, howTo, season, children }: { id: string; title: string; tagline: string; art: ReactNode; howTo: ReactNode[]; season?: { id: SeasonId; name: string }; children: (api: GameApi) => ReactNode }) {
  const [phase, setPhase] = useState<Phase>('inicio')
  const [level, setLevel] = useState(1)
  const [seed, setSeed] = useState(1)
  const [prog, setProg] = useState({ done: 0, total: 0 })
  const [winMsg, setWinMsg] = useState('')
  const [live, setLive] = useState('')
  const [calm, setCalm] = useState(prefersReduced)
  const headRef = useRef<HTMLHeadingElement>(null)
  const first = useRef(true)

  // al cambiar de fase, el foco va al título de esa fase (teclado y lector de pantalla saben dónde están)
  useEffect(() => {
    if (first.current) { first.current = false; return }
    headRef.current?.focus()
  }, [phase])

  useEffect(() => {
    if (phase !== 'jugando') return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.preventDefault(); setPhase('pausa'); setLive('Juego en pausa.') } }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [phase])

  const start = (lv = level) => {
    setLevel(lv)
    setSeed((x) => x + 1)
    setProg({ done: 0, total: 0 })
    setWinMsg('')
    setPhase('jugando')
    setLive(`Nivel ${LEVEL_NAME[lv - 1].toLowerCase()}. ¡A jugar!`)
  }
  const api: GameApi = {
    level, seed, calm,
    progress: (done, total) => setProg((p) => (p.done === done && p.total === total ? p : { done, total })),
    say: (m) => setLive(m),
    win: (m) => { setWinMsg(m); setLive(m); sfx('success'); setPhase('exito') },
  }
  const pct = prog.total ? Math.round((prog.done / prog.total) * 100) : 0

  return (
    <section className="game" id={id} data-phase={phase} data-calm={calm || undefined} aria-labelledby={`${id}-t`} data-testid={`game-${id}`}>
      <header className="game-head">
        <p className="eyebrow">Juego opcional · sin tiempo · sin datos · sin compras</p>
        <h2 id={`${id}-t`}>{title}</h2>
        {season && <p className="game-season" data-testid="game-season"><SeasonArt id={season.id} size={32} /> Edición {season.name.toLowerCase()}</p>}
      </header>
      <p className="sr-only" role="status" aria-live="polite">{live}</p>

      {phase === 'inicio' && (
        <div className="game-start">
          <div className="game-art" aria-hidden="true">{art}</div>
          <div>
            <h3 ref={headRef} tabIndex={-1}>{tagline}</h3>
            <p className="eyebrow">Cómo se juega</p>
            <ol className="game-how">{howTo.map((h, i) => <li key={i}>{h}</li>)}</ol>
            <fieldset className="game-levels">
              <legend>Nivel</legend>
              {LEVEL_NAME.map((n, i) => (
                <label key={n} className="chip-radio"><input type="radio" name={`${id}-lv`} checked={level === i + 1} onChange={() => setLevel(i + 1)} /><span>{n}</span></label>
              ))}
            </fieldset>
            <label className="game-calm"><input type="checkbox" checked={calm} onChange={(e) => setCalm(e.target.checked)} /> Sin animaciones</label>
            <div className="row">
              <button className="btn lg" type="button" onClick={() => start()} data-testid={`${id}-start`}><Glyph name="arrow" size={18} /> Empezar</button>
            </div>
          </div>
        </div>
      )}

      {(phase === 'jugando' || phase === 'pausa') && (
        <div className="game-play">
          <div className="game-bar">
            <span className="game-level">Nivel {LEVEL_NAME[level - 1].toLowerCase()}</span>
            <span className="game-prog">
              <span className="bar" aria-hidden="true"><span style={{ width: `${pct}%` }} /></span>
              <span data-testid={`${id}-progress`}>{prog.done} de {prog.total}</span>
            </span>
            <span className="game-ctrls">
              <button className="btn secondary small" type="button" onClick={() => { setPhase('pausa'); setLive('Juego en pausa.') }} disabled={phase === 'pausa'} data-testid={`${id}-pause`}>Pausa</button>
              <button className="btn ghost small" type="button" onClick={() => start(level)} data-testid={`${id}-retry`}><Glyph name="restart" size={16} /> Empezar de nuevo</button>
              <button className="btn ghost small" type="button" onClick={() => setPhase('inicio')} data-testid={`${id}-exit`}>Salir</button>
            </span>
          </div>
          {phase === 'pausa' && (
            <div className="game-pause" role="group" aria-labelledby={`${id}-pz`}>
              <h3 id={`${id}-pz`} ref={headRef} tabIndex={-1}>En pausa</h3>
              <p>La partida queda como estaba. No hay apuro.</p>
              <div className="row">
                <button className="btn" type="button" onClick={() => setPhase('jugando')} data-testid={`${id}-resume`}>Seguir jugando</button>
                <button className="btn secondary" type="button" onClick={() => start(level)}>Empezar de nuevo</button>
                <button className="btn ghost" type="button" onClick={() => setPhase('inicio')}>Salir</button>
              </div>
            </div>
          )}
          {/* la partida sigue montada durante la pausa (no se pierde nada), pero no responde */}
          <div className="game-board" inert={phase === 'pausa'} aria-hidden={phase === 'pausa' || undefined} key={`${level}-${seed}`}>
            {phase === 'jugando' && <h3 className="sr-only" ref={headRef} tabIndex={-1}>Partida de {title}</h3>}
            {children(api)}
          </div>
        </div>
      )}

      {phase === 'exito' && (
        <div className="game-win" data-testid={`${id}-win`}>
          <div className="game-art" aria-hidden="true">{art}</div>
          <div>
            <h3 ref={headRef} tabIndex={-1}>¡Lo lograste!</h3>
            <p>{winMsg}</p>
            <div className="row">
              {level < LEVELS && <button className="btn" type="button" onClick={() => start(level + 1)} data-testid={`${id}-next`}>Siguiente nivel</button>}
              <button className={`btn ${level < LEVELS ? 'secondary' : ''}`} type="button" onClick={() => start(level)} data-testid={`${id}-again`}>Jugar otra vez</button>
              <button className="btn ghost" type="button" onClick={() => setPhase('inicio')}>Salir</button>
            </div>
            <p className="small muted">Sin premios ni puntajes: es solo para divertirse.</p>
          </div>
        </div>
      )}
    </section>
  )
}
