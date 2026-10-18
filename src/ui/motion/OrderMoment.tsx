import { useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react'
import { Piece, pieceFor } from '../art/families'
import { GUSTO, type Gusto } from '../art/families/copo'
import { Board } from '../art/kit'
import { Glyph } from '../glyphs'
import { sfx } from '../sfx'
import type { MotionLayer, MotionPlan } from '../../domain/motion-plan'
import './moment.css'

/**
 * P5-L8 · Reproduce el plan de `motion-plan.ts`: no decide nada del pedido y no despacha comandos. La composición final
 * (escenario quieto + comprobante) es la misma que se ve al omitir, con movimiento reducido o al volver a la pantalla.
 */

// ------------------------------------------------------------------ cuándo reproducir (comodidad por pestaña)
const KEY = (id: string) => `tableflow.motion.${id}`
const read = (k: string) => {
  try {
    return sessionStorage.getItem(k)
  } catch {
    return null
  }
}
const write = (k: string, v: string) => {
  try {
    sessionStorage.setItem(k, v)
  } catch {
    /* sin almacenamiento: se muestra el cierre quieto */
  }
}

/**
 * Se reproduce una sola vez: cuando esta pestaña vio la entidad antes de su aceptación y ahora la ve aceptada.
 * Un pedido que se abre ya aceptado muestra el cierre quieto; "Ver de nuevo" no pasa por acá.
 */
export function useMomentTrigger(entityId: string, accepted: boolean): boolean {
  // se decide en el render (antes de marcar "reproducida") para que el primer cuadro ya sea el de la animación
  const play = useMemo(() => accepted && read(KEY(entityId)) === 'visto-previo', [entityId, accepted])
  useEffect(() => {
    const k = KEY(entityId)
    const v = read(k)
    if (!accepted && v !== 'reproducida') write(k, 'visto-previo')
    if (accepted && v === 'visto-previo') write(k, 'reproducida')
  }, [entityId, accepted])
  return play
}

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return document.documentElement.getAttribute('data-motion') === 'reduced' || !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

/** Contador para pruebas y para medir: cuántas piezas están corriendo ahora (se descuenta al terminar o desmontar). */
function track(delta: number) {
  const w = window as unknown as { __tableflowMotion?: { active: number; played: number } }
  w.__tableflowMotion ??= { active: 0, played: 0 }
  w.__tableflowMotion.active = Math.max(0, w.__tableflowMotion.active + delta)
  if (delta > 0) w.__tableflowMotion.played++
}

// ------------------------------------------------------------------ piezas de respaldo y dibujos propios del escenario
const GLYPH: Record<string, string> = { cup: 'cup', plate: 'plate', glass: 'glass', bag: 'box' }

function LayerArt({ layer }: { layer: MotionLayer }) {
  if (layer.key.startsWith('glyph:')) {
    return (
      <span className="mo-glyph">
        <Glyph name={GLYPH[layer.key.slice(6)] ?? 'plate'} size={30} />
      </span>
    )
  }
  const p = pieceFor(layer.key)
  if (!p) {
    return (
      <span className="mo-glyph">
        <Glyph name="plate" size={30} />
      </span>
    )
  }
  return (
    <Piece size={120}>
      <p.Comp />
    </Piece>
  )
}

/** Una capa que entra en su turno: el retardo sale del plan (entrada + i × desfase). */
function Layer({ i, plan, style, anim = 'drop', className = '', children }: { i: number; plan: MotionPlan; style?: CSSProperties; anim?: string; className?: string; children: ReactNode }) {
  const t = plan.timeline
  return (
    <div className={`mo-layer mo-${anim} ${className}`} style={{ ...style, ['--d' as string]: `${t.enterMs + i * t.staggerMs}ms`, zIndex: 10 + i }} aria-hidden="true">
      {children}
    </div>
  )
}

const motifDelay = (p: MotionPlan) => p.timeline.enterMs + (p.layers.length - 1) * p.timeline.staggerMs + p.timeline.layerMs
const endingDelay = (p: MotionPlan) => motifDelay(p) + p.timeline.motifMs

/** Fila centrada de piezas (café, bar, acompañamientos). */
function row(n: number, from = 6, span = 88, max = 30) {
  const slot = span / Math.max(1, n)
  const size = Math.min(max, slot * 0.96)
  return (k: number) => ({ left: `${from + k * slot + (slot - size) / 2}%`, width: `${size}%` })
}

// ------------------------------------------------------------------ escenarios
function CafeStage({ plan }: { plan: MotionPlan }) {
  const items = plan.layers.filter((l) => l.role !== 'acabado')
  const pos = row(items.length, 6, 88, 30)
  const md = motifDelay(plan)
  const firstCup = items.findIndex((l) => l.role === 'bebida')
  const bakes = firstCup < 0 ? items.length : firstCup
  const hot = plan.motif === 'vapor' || plan.motif === 'dorado-y-vapor'
  const dorado = plan.layers.some((l) => l.key === 'acabado:dorado')
  return (
    <>
      <div className="mo-base mo-tray" aria-hidden="true" />
      {items.map((l, k) => (
        <Layer key={k} i={k} plan={plan} style={{ ...pos(k), bottom: '14%' }}>
          <LayerArt layer={l} />
          {hot && l.role === 'bebida' && l.key !== 'RC-09' && (
            <span className="mo-steam" style={{ ['--md' as string]: `${md}ms` }}>
              {[0, 1, 2].map((s) => <i key={s} style={{ ['--s' as string]: s }} />)}
            </span>
          )}
        </Layer>
      ))}
      {dorado && bakes > 0 && (
        <div className="mo-motif mo-dorado" aria-hidden="true" style={{ left: pos(0).left, width: `calc(${(88 / items.length) * bakes}% - 2%)`, bottom: '16%', ['--md' as string]: `${md}ms` }} />
      )}
    </>
  )
}

/** Bocha propia del escenario (la de la familia de Copo necesita las definiciones de su pieza). */
function Scoop({ g, cx, cy, r }: { g: Gusto; cx: number; cy: number; r: number }) {
  const c = GUSTO[g]
  return (
    <g>
      <ellipse cx={cx} cy={cy + r * 0.62} rx={r * 1.02} ry={r * 0.3} fill={c.dark} />
      <circle cx={cx} cy={cy} r={r} fill={c.base} />
      <path d={`M${cx - r} ${cy + r * 0.35} q ${r * 0.25} ${r * 0.32} ${r * 0.5} 0 q ${r * 0.25} ${r * 0.32} ${r * 0.5} 0 q ${r * 0.25} ${r * 0.32} ${r * 0.5} 0 q ${r * 0.25} ${r * 0.32} ${r * 0.5} 0`} fill={c.base} />
      <ellipse cx={cx - r * 0.35} cy={cy - r * 0.38} rx={r * 0.32} ry={r * 0.2} fill={c.light} opacity=".85" />
      {c.bits && [0.2, -0.3, 0.45].map((d, i) => <circle key={i} cx={cx + d * r} cy={cy + (i - 1) * r * 0.25} r={r * 0.07} fill={c.bits} />)}
    </g>
  )
}

function HeladoStage({ plan }: { plan: MotionPlan }) {
  const scoops = plan.layers.filter((l) => l.role === 'bocha')
  const toppings = plan.layers.filter((l) => l.role === 'acabado')
  const extras = plan.layers.filter((l) => l.role === 'item' || l.role === 'bebida')
  const fmt = plan.container
  const tall = fmt === 'cucurucho'
  const scoopPos = (k: number) => (tall ? { cx: 80 + (k % 2 ? 5 : -5) * (k > 0 ? 1 : 0), cy: 86 - k * 24 } : { cx: 80 + (k - (scoops.length - 1) / 2) * 30, cy: 92 - (k % 2) * 8 })
  const pos = row(extras.length, 66, 32, 26)
  const idx = (l: MotionLayer) => plan.layers.indexOf(l)
  return (
    <>
      <svg className="mo-svg" viewBox="0 0 160 160" style={{ left: '8%', width: '52%' }} aria-hidden="true">
        <g className="mo-layer mo-rise" style={{ ['--d' as string]: `${plan.timeline.enterMs}ms` }}>
          {tall ? (
            <g>
              <path d="M58 100 L80 156 L102 100 Z" fill="#e4a95c" />
              <path d="M62 104 L98 104 M66 114 L94 114 M70 124 L90 124 M74 134 L86 134" stroke="#a8682a" strokeWidth="1.4" />
              <rect x="56" y="96" width="48" height="8" rx="4" fill="#c98a42" />
            </g>
          ) : fmt === 'vasito' ? (
            <path d="M44 100 L116 100 L106 150 L54 150 Z" fill="#f4ede2" stroke="#d6c7b2" strokeWidth="1.5" />
          ) : (
            <g>
              <path d="M34 100 L126 100 L118 152 L42 152 Z" fill="#fbf7f0" stroke="#d6c7b2" strokeWidth="1.5" />
              <text x="80" y="134" textAnchor="middle" fontSize="12" fontWeight="800" fill="#c2405b" fontFamily="system-ui, sans-serif">COPO</text>
            </g>
          )}
        </g>
        {scoops.map((l, k) => {
          const g = l.key.replace('H-bacha-', '') as Gusto
          const p = scoopPos(k)
          return (
            <g key={k} className="mo-layer mo-squash" style={{ ['--d' as string]: `${plan.timeline.enterMs + idx(l) * plan.timeline.staggerMs}ms` }}>
              <Scoop g={GUSTO[g] ? g : 'crema'} cx={p.cx} cy={p.cy} r={tall ? 22 : 18} />
            </g>
          )
        })}
        {toppings.map((l, k) => {
          const top = scoopPos(Math.max(0, scoops.length - 1))
          return (
            <g key={`t${k}`} className="mo-layer mo-fade" style={{ ['--d' as string]: `${plan.timeline.enterMs + idx(l) * plan.timeline.staggerMs}ms` }}>
              <path d={`M${top.cx - 20} ${top.cy - 6} q 6 -14 20 -16 q 14 2 20 16 q -4 6 -8 0 q -4 8 -8 0 q -4 8 -8 0 q -4 8 -8 0 z`} fill={/chocolate/i.test(l.label) ? '#4a2213' : '#b8325a'} opacity=".92" />
            </g>
          )
        })}
      </svg>
      {extras.map((l, k) => (
        <Layer key={k} i={idx(l)} plan={plan} style={{ ...pos(k), bottom: '14%' }}>
          <LayerArt layer={l} />
        </Layer>
      ))}
    </>
  )
}

function Cutlery({ side }: { side: 'l' | 'r' }) {
  return side === 'l' ? (
    <svg viewBox="0 0 20 100" aria-hidden="true"><path d="M7 4v26M10 4v26M13 4v26M6 30q4 8 8 0M10 34v62" stroke="#8d8d8d" strokeWidth="3" strokeLinecap="round" fill="none" /></svg>
  ) : (
    <svg viewBox="0 0 20 100" aria-hidden="true"><path d="M10 6q8 18 0 40v50" stroke="#8d8d8d" strokeWidth="4" strokeLinecap="round" fill="none" /></svg>
  )
}

function RestoStage({ plan }: { plan: MotionPlan }) {
  const main = plan.layers.find((l) => l.role === 'item')
  const sides = plan.layers.filter((l) => l !== main && (l.role === 'item' || l.role === 'bebida'))
  const cut = plan.layers.find((l) => l.role === 'cubierto')
  const idx = (l: MotionLayer) => plan.layers.indexOf(l)
  return (
    <>
      <Layer i={0} plan={plan} anim="rise" className="mo-base mo-placemat" style={{ left: '4%', width: '62%', bottom: '6%', height: '84%' }}><span /></Layer>
      {main && (
        <Layer i={idx(main)} plan={plan} style={{ left: '14%', width: '42%', bottom: '14%' }}>
          <LayerArt layer={main} />
        </Layer>
      )}
      {cut && (
        <>
          <Layer i={idx(cut)} plan={plan} anim="side-l" className="mo-cut" style={{ left: '7%', width: '5%', bottom: '18%' }}><Cutlery side="l" /></Layer>
          <Layer i={idx(cut)} plan={plan} anim="side-r" className="mo-cut" style={{ left: '58%', width: '5%', bottom: '18%' }}><Cutlery side="r" /></Layer>
        </>
      )}
      {sides.map((l, k) => (
        <Layer key={k} i={idx(l)} plan={plan} style={{ left: '70%', width: '24%', bottom: `${8 + k * 28}%` }}>
          <LayerArt layer={l} />
        </Layer>
      ))}
    </>
  )
}

function MesaStage({ plan }: { plan: MotionPlan }) {
  const places = plan.layers.filter((l) => l.key === 'mesa:cubierto')
  const half = Math.ceil(places.length / 2)
  const idx = (l: MotionLayer) => plan.layers.indexOf(l)
  return (
    <>
      <Layer i={0} plan={plan} anim="rise" className="mo-base mo-cloth" style={{ left: '6%', width: '88%', bottom: '10%', height: '78%' }}><span /></Layer>
      {places.map((l, k) => {
        const top = k < half
        const col = top ? k : k - half
        const n = top ? half : places.length - half
        const slot = 76 / Math.max(1, n)
        return (
          <Layer key={k} i={idx(l)} plan={plan} anim="grow" className="mo-place" style={{ left: `${12 + col * slot + (slot - 15) / 2}%`, width: '15%', bottom: top ? '56%' : '16%' }}>
            <svg viewBox="0 0 60 60" aria-hidden="true"><circle cx="28" cy="32" r="20" fill="#fff" stroke="#c42b22" strokeWidth="2.5" /><circle cx="28" cy="32" r="12" fill="none" stroke="#e8ddd0" strokeWidth="1.5" /><circle cx="52" cy="12" r="6" fill="#dfeef5" stroke="#9fb7c4" strokeWidth="1.5" /></svg>
          </Layer>
        )
      })}
      {plan.layers.filter((l) => l.key === 'mesa:panera').map((l) => (
        <Layer key="pan" i={idx(l)} plan={plan} anim="grow" className="mo-place" style={{ left: '44%', width: '12%', bottom: '40%' }}>
          <svg viewBox="0 0 60 40" aria-hidden="true"><ellipse cx="30" cy="24" rx="26" ry="13" fill="#b9793f" /><ellipse cx="22" cy="18" rx="9" ry="6" fill="#e9b877" /><ellipse cx="37" cy="17" rx="9" ry="6" fill="#dca468" /></svg>
        </Layer>
      ))}
    </>
  )
}

function BarStage({ plan }: { plan: MotionPlan }) {
  const tapas = plan.layers.filter((l) => l.role === 'item')
  const drinks = plan.layers.filter((l) => l.role === 'bebida')
  const idx = (l: MotionLayer) => plan.layers.indexOf(l)
  const board = plan.container === 'tabla'
  const pos = row(tapas.length, 4, board ? 62 : 0, 27)
  const dpos = row(drinks.length, board ? 66 : 20, board ? 30 : 60, board ? 22 : 30)
  return (
    <>
      {board && (
        <Layer i={0} plan={plan} anim="rise" className="mo-board" style={{ left: '0%', width: '68%', bottom: '-6%' }}>
          <Piece size={160}><Board x={6} y={46} w={148} h={78} /></Piece>
        </Layer>
      )}
      {tapas.map((l, k) => (
        <Layer key={k} i={idx(l)} plan={plan} style={{ ...pos(k), bottom: `${22 + (k % 2) * 10}%` }}>
          <LayerArt layer={l} />
        </Layer>
      ))}
      {drinks.map((l, k) => (
        <Layer key={k} i={idx(l)} plan={plan} anim={plan.motif === 'llenar-vaso' ? 'fill' : 'drop'} style={{ ...dpos(k), bottom: '12%' }}>
          <LayerArt layer={l} />
        </Layer>
      ))}
    </>
  )
}

/** Hamburguesa de costado dibujada para el escenario: cada ingrediente real es una capa con su grosor. */
const ING: Record<string, { h: number; draw: (y: number) => ReactNode }> = {
  'pan-abajo': { h: 18, draw: (y) => <><path d={`M22 ${y - 18}h116v6c0 8-10 12-58 12s-58-4-58-12z`} fill="#d9934a" /><rect x="22" y={y - 20} width="116" height="6" rx="3" fill="#f4cf8c" /></> },
  carne: { h: 14, draw: (y) => <><rect x="18" y={y - 14} width="124" height="14" rx="7" fill="#5a2a14" />{[30, 52, 74, 96, 118].map((x) => <circle key={x} cx={x} cy={y - 7} r="1.6" fill="#8f4a22" />)}</> },
  queso: { h: 5, draw: (y) => <path d={`M16 ${y - 5}h128l-4 5h-30l-4 7-4-7h-40l-5 9-5-9h-32z`} fill="#f2a516" /> },
  lechuga: { h: 7, draw: (y) => <path d={`M14 ${y - 3}q10-6 20 0t20 0 20 0 20 0 20 0 20 0 20 0v4h-140z`} fill="#5fae3b" /> },
  tomate: { h: 6, draw: (y) => <rect x="24" y={y - 6} width="112" height="6" rx="3" fill="#d9381f" /> },
  cebolla: { h: 4, draw: (y) => <rect x="28" y={y - 4} width="104" height="4" rx="2" fill="#b56bbf" /> },
  pepino: { h: 4, draw: (y) => <>{[38, 62, 86, 110].map((x) => <ellipse key={x} cx={x} cy={y - 2} rx="10" ry="2.4" fill="#6c9a3a" />)}</> },
  'pan-arriba': { h: 0, draw: (y) => <><path d={`M20 ${y}c0-30 22-42 60-42s60 12 60 42c0 3-4 4-60 4s-60-1-60-4z`} fill="#e1a057" />{[50, 66, 82, 98, 112, 74, 92].map((x, i) => <ellipse key={i} cx={x} cy={y - 26 + (i % 3) * 6} rx="2.6" ry="1.3" fill="#fff4dc" />)}</> },
}

function RapidaStage({ plan }: { plan: MotionPlan }) {
  const ing = plan.layers.filter((l) => l.role === 'ingrediente')
  const rest = plan.layers.filter((l) => l.role !== 'ingrediente')
  const idx = (l: MotionLayer) => plan.layers.indexOf(l)
  const pos = row(rest.length, ing.length ? 50 : 8, ing.length ? 46 : 84, 24)
  const md = motifDelay(plan)
  let y = 164
  return (
    <>
      {ing.length > 0 && (
        <svg className="mo-svg mo-burger" viewBox="0 0 160 170" style={{ left: '4%', width: '44%', ['--md' as string]: `${md}ms` }} aria-hidden="true">
          <ellipse cx="80" cy="166" rx="66" ry="4" fill="rgba(0,0,0,.18)" />
          {ing.map((l, k) => {
            const kind = l.key.replace('jg-rapida-', '')
            const def = ING[kind]
            if (!def) return null
            const at = y
            y -= def.h
            return (
              <g key={k} className="mo-layer" style={{ ['--d' as string]: `${plan.timeline.enterMs + idx(l) * plan.timeline.staggerMs}ms` }}>
                {def.draw(at)}
              </g>
            )
          })}
        </svg>
      )}
      {rest.map((l, k) => (
        <Layer key={k} i={idx(l)} plan={plan} style={{ ...pos(k), bottom: '12%' }}>
          <LayerArt layer={l} />
        </Layer>
      ))}
    </>
  )
}

function Stage({ plan }: { plan: MotionPlan }) {
  if (plan.id === 'MO-CAF') return <CafeStage plan={plan} />
  if (plan.id === 'MO-HEL') return <HeladoStage plan={plan} />
  if (plan.id === 'MO-RES') return plan.entity.type === 'reserva' ? <MesaStage plan={plan} /> : <RestoStage plan={plan} />
  if (plan.id === 'MO-BAR') return <BarStage plan={plan} />
  return <RapidaStage plan={plan} />
}

const TITLE: Record<MotionPlan['id'], string> = {
  'MO-CAF': 'Tu pedido, en la bandeja',
  'MO-HEL': 'Tus gustos, armados',
  'MO-RES': 'Tu plato, en marcha',
  'MO-BAR': 'Para compartir',
  'MO-FR': 'Tu combo, armado',
}

/**
 * La pieza completa. `autoplay` la corre una vez; "Omitir" y Escape van al cierre; "Ver de nuevo" la repite sin tocar el
 * store. Con movimiento reducido se monta directamente el cierre.
 */
export function OrderMoment({ plan, autoplay }: { plan: MotionPlan; autoplay: boolean }) {
  const reduced = useMemo(prefersReducedMotion, [])
  const [run, setRun] = useState(0)
  const [phase, setPhase] = useState<'playing' | 'done'>(autoplay && !reduced ? 'playing' : 'done')
  const timers = useRef<number[]>([])
  const clear = () => {
    timers.current.forEach((t) => window.clearTimeout(t))
    timers.current = []
  }
  // el plan se recalcula con cada cambio del store: los tiempos se leen de una referencia para no reiniciar la pieza
  const planRef = useRef(plan)
  planRef.current = plan
  useEffect(() => {
    if (phase !== 'playing') return
    const p = planRef.current
    track(1)
    timers.current.push(window.setTimeout(() => sfx('success'), endingDelay(p)))
    timers.current.push(window.setTimeout(() => setPhase('done'), p.timeline.totalMs + 60))
    return () => {
      clear()
      track(-1)
    }
  }, [phase, run])
  const skip = () => {
    clear()
    setPhase('done')
  }
  const replay = () => {
    if (phase === 'playing') return
    setRun((r) => r + 1)
    setPhase('playing')
  }
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && phase === 'playing') {
      e.stopPropagation()
      skip()
    }
  }
  const e = plan.ending
  const shown = e.lines.slice(0, 4)
  return (
    <section className="mo" data-phase={phase} data-motion-id={plan.id} data-testid="order-moment" aria-labelledby={`mo-h-${plan.entity.id}`} onKeyDown={onKey}
      style={{ ['--layer' as string]: `${plan.timeline.layerMs}ms`, ['--motif' as string]: `${plan.timeline.motifMs}ms`, ['--ed' as string]: `${endingDelay(plan)}ms`, ['--ending' as string]: `${plan.timeline.endingMs}ms` }}>
      <h2 id={`mo-h-${plan.entity.id}`} className="mo-title">{TITLE[plan.id]}</h2>
      <div className="mo-body">
        <div className="mo-stage" key={run} role="img" aria-label={plan.label} data-container={plan.container} data-motif={plan.motif}>
          <Stage plan={plan} />
        </div>
        <div className="mo-ticket" data-kind={e.kind} data-testid="moment-ticket">
          <p className="mo-ticket-title">{e.title}</p>
          <p className="mo-number" data-testid="moment-number">{e.number}</p>
          <ul className="mo-lines">
            {shown.map((l, k) => <li key={k}>{l}</li>)}
            {e.lines.length > shown.length && <li className="muted">y {e.lines.length - shown.length} más</li>}
          </ul>
          {e.payNote && <p className="mo-pay" data-testid="moment-pay">{e.payNote}</p>}
        </div>
      </div>
      {phase === 'playing' && (
        <button type="button" className="btn small secondary mo-skip" onClick={skip} data-testid="moment-skip">Omitir</button>
      )}
      <div className="mo-actions">
        {!reduced && (
          <button type="button" className="btn small secondary" onClick={replay} disabled={phase === 'playing'} data-testid="moment-replay">Ver de nuevo</button>
        )}
        <span className="small muted">Animación ilustrativa: no cambia ni cobra nada.</span>
      </div>
      {plan.omitted.length > 0 && <p className="small muted mo-omitted">{plan.omitted.join(' · ')}</p>}
    </section>
  )
}
