import type { ReactNode } from 'react'
import { Piece, pieceFor } from '../art/families'
import { Board } from '../art/kit'
import { SeasonArt } from '../art/season'
import type { BusinessId, SeasonId } from '../../domain/types'
import './season-scene.css'

/**
 * P5-L8 · Escena de temporada por identidad: cada negocio cambia composición, arte y movimiento (no solo el color de
 * una banda). El movimiento ambiental dura como mucho dos ciclos y se apaga con movimiento reducido.
 */
export const SIGNATURE: Record<BusinessId, SeasonId[]> = {
  'ritual-cafe': ['invierno', 'otono'],
  copo: ['verano'],
  'mesa-clara': ['fiestas', 'madre', 'padre'],
  compas: ['primavera', 'amigo'],
  brasa: ['madre', 'padre', 'amigo'],
}
export const SIGNATURE_LABEL: Record<BusinessId, string> = {
  'ritual-cafe': 'merienda de invierno',
  copo: 'verano en el mostrador',
  'mesa-clara': 'mesa larga de celebración',
  compas: 'noche de música y tapas',
  brasa: 'bolsa para la familia',
}

function P({ k, style, className = '' }: { k: string; style?: React.CSSProperties; className?: string }) {
  const p = pieceFor(k)
  if (!p) return null
  return (
    <span className={`ss-item ${className}`} style={style}>
      <Piece size={120}><p.Comp /></Piece>
    </span>
  )
}

const Steam = () => (
  <span className="ss-steam ss-amb" aria-hidden="true">{[0, 1, 2].map((i) => <i key={i} style={{ ['--s' as string]: i }} />)}</span>
)
const Leaves = () => (
  <svg className="ss-leaves" viewBox="0 0 200 100" aria-hidden="true">
    {[[30, 10, '#c4682c'], [92, 2, '#d9952f'], [150, 14, '#a8461f']].map(([x, y, c], i) => (
      <path key={i} className="ss-amb ss-fall" style={{ ['--s' as string]: i }} transform={`translate(${x} ${y})`} d="M0 -8 C 5 -5, 6 2, 0 8 C -6 2, -5 -5, 0 -8 Z" fill={c as string} />
    ))}
  </svg>
)
const Sun = () => (
  <svg className="ss-sun" viewBox="0 0 60 60" aria-hidden="true">
    <g className="ss-amb ss-spin">{Array.from({ length: 10 }, (_, i) => <path key={i} d="M30 4v8" stroke="#f2b63a" strokeWidth="3" strokeLinecap="round" transform={`rotate(${i * 36} 30 30)`} />)}</g>
    <circle cx="30" cy="30" r="13" fill="#f6c84a" />
  </svg>
)
const Lights = () => (
  <svg className="ss-lights" viewBox="0 0 200 30" aria-hidden="true">
    <path d="M0 6 Q 50 22 100 8 T 200 6" stroke="#6b4a2a" strokeWidth="1.2" fill="none" />
    {[16, 40, 64, 88, 112, 136, 160, 184].map((x, i) => <circle key={x} className="ss-amb ss-twinkle" style={{ ['--s' as string]: i % 3 }} cx={x} cy={i % 2 ? 14 : 12} r="3.4" fill={['#f6c84a', '#c42b22', '#f6f0e4'][i % 3]} />)}
  </svg>
)
const Notes = () => (
  <svg className="ss-notes" viewBox="0 0 80 60" aria-hidden="true">
    {[[14, 44], [40, 34], [62, 46]].map(([x, y], i) => (
      <g key={i} className="ss-amb ss-float" style={{ ['--s' as string]: i }}>
        <path transform={`translate(${x} ${y})`} d="M0 0 a4 3 0 1 0 0.1 0 M3.6 -1 V -16 l8 -3 v4" stroke="#1a4fa0" strokeWidth="2" fill="#1a4fa0" />
      </g>
    ))}
  </svg>
)
const Bag = () => (
  <svg className="ss-bag" viewBox="0 0 100 110" aria-hidden="true">
    <path d="M30 34 q0 -22 20 -22 t20 22" stroke="#7a3d17" strokeWidth="5" fill="none" />
    <path d="M12 34h76l-6 70H18z" fill="#c98a4a" />
    <path d="M12 34h76l-1 8H13z" fill="#a8682a" />
    <circle cx="50" cy="70" r="15" fill="#d6261d" />
    <path d="M44 64 q6 -10 12 0 q-6 -2 -6 10 q0 -12 -6 -10z" fill="#ffd34d" />
  </svg>
)

/** Escena propia de la identidad para su temporada característica; en las demás, la base con el acento de la época. */
export function SeasonScene({ biz, season, animate = true }: { biz: BusinessId; season: SeasonId; animate?: boolean }) {
  const signature = SIGNATURE[biz].includes(season)
  let body: ReactNode
  if (biz === 'ritual-cafe') {
    const cold = season === 'verano'
    body = signature ? (
      <>
        <div className="ss-surface ss-wood" />
        <P k="RC-17" style={{ left: '8%', width: '34%', bottom: '10%' }} />
        <span className="ss-steam-wrap" style={{ left: '14%', width: '22%', bottom: '58%' }}><Steam /></span>
        <P k="RC-11" style={{ left: '40%', width: '28%', bottom: '8%' }} />
        <P k="RC-15" style={{ left: '64%', width: '30%', bottom: '10%' }} />
        {season === 'otono' && <Leaves />}
      </>
    ) : (
      <>
        <div className="ss-surface ss-wood" />
        <P k={cold ? 'RC-09' : 'RC-04'} style={{ left: '18%', width: '32%', bottom: '10%' }} />
        <P k="RC-12" style={{ left: '52%', width: '28%', bottom: '8%' }} />
      </>
    )
  } else if (biz === 'copo') {
    body = signature ? (
      <>
        <div className="ss-surface ss-counter" />
        <span className="ss-sun-wrap"><Sun /></span>
        <P k="CO-02" style={{ left: '10%', width: '28%', bottom: '8%' }} />
        <P k="H-cucurucho-banado" style={{ left: '36%', width: '28%', bottom: '8%' }} />
        <P k="CO-08" style={{ left: '64%', width: '26%', bottom: '8%' }} />
      </>
    ) : (
      <>
        <div className="ss-surface ss-counter" />
        <P k={season === 'invierno' || season === 'otono' ? 'CO-05' : 'CO-01'} style={{ left: '22%', width: '30%', bottom: '8%' }} />
        <P k="CO-07" style={{ left: '54%', width: '26%', bottom: '8%' }} />
      </>
    )
  } else if (biz === 'mesa-clara') {
    body = signature ? (
      <>
        <Lights />
        <div className="ss-surface ss-cloth" />
        <P k="MC-16" style={{ left: '4%', width: '30%', bottom: '10%' }} />
        <P k="MC-06" style={{ left: '35%', width: '30%', bottom: '14%' }} />
        <P k="MC-22" style={{ left: '66%', width: '28%', bottom: '10%' }} />
      </>
    ) : (
      <>
        <div className="ss-surface ss-cloth" />
        <P k="MC-12" style={{ left: '24%', width: '34%', bottom: '10%' }} />
        <P k="MC-26" style={{ left: '60%', width: '20%', bottom: '12%' }} />
      </>
    )
  } else if (biz === 'compas') {
    body = signature ? (
      <>
        <span className="ss-notes-wrap"><Notes /></span>
        <span className="ss-item" style={{ left: '0%', width: '62%', bottom: '-8%' }}><Piece size={160}><Board x={6} y={46} w={148} h={78} /></Piece></span>
        <P k="TC-01" style={{ left: '6%', width: '24%', bottom: '16%' }} />
        <P k="TC-03" style={{ left: '30%', width: '24%', bottom: '20%' }} />
        <P k="TC-10" style={{ left: '62%', width: '20%', bottom: '10%' }} />
        <P k="jg-bar-saxo" style={{ left: '80%', width: '18%', bottom: '14%' }} />
      </>
    ) : (
      <>
        <span className="ss-item" style={{ left: '8%', width: '56%', bottom: '-8%' }}><Piece size={160}><Board x={6} y={46} w={148} h={78} /></Piece></span>
        <P k="TC-04" style={{ left: '16%', width: '26%', bottom: '18%' }} />
        <P k="TC-09" style={{ left: '66%', width: '20%', bottom: '10%' }} />
      </>
    )
  } else {
    body = signature ? (
      <>
        <div className="ss-surface ss-tray" />
        <span className="ss-item ss-amb ss-bob" style={{ left: '4%', width: '30%', bottom: '8%' }}><Bag /></span>
        <P k="BR-01" style={{ left: '32%', width: '30%', bottom: '8%' }} />
        <P k="BR-02" style={{ left: '56%', width: '26%', bottom: '8%' }} />
        <P k="BR-10" style={{ left: '78%', width: '18%', bottom: '10%' }} />
      </>
    ) : (
      <>
        <div className="ss-surface ss-tray" />
        <P k="BR-03" style={{ left: '20%', width: '32%', bottom: '8%' }} />
        <P k="BR-06" style={{ left: '54%', width: '24%', bottom: '8%' }} />
      </>
    )
  }
  return (
    <div className={`season-scene ${animate ? 'is-live' : ''}`} data-biz={biz} data-season={season} data-signature={signature || undefined} data-testid="season-scene" aria-hidden="true">
      {body}
      <span className="ss-accent"><SeasonArt id={season} size={44} /></span>
    </div>
  )
}
