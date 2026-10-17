import type { ReactNode } from 'react'
import { Art, url, useArtId } from './kit'

// Personajes de la casa, dibujados para esta demo con la misma luz que los platos (arriba a la izquierda).
// Ñoqui es la mascota de Mesa Clara, Granito la de Ritual Café y Tomatito acompaña la sección para chicos.
// Grilla de 120 × 120; la cara se arma con piezas compartidas para que las expresiones sean consistentes.

export type CharacterId = 'noqui' | 'granito' | 'tomatito'
export type Mood = 'feliz' | 'guino' | 'pensando' | 'festejo' | 'dormido' | 'triste' | 'sorpresa'

export const CHARACTER_NAME: Record<CharacterId, string> = { noqui: 'Ñoqui', granito: 'Granito', tomatito: 'Tomatito' }
const MOOD_TEXT: Record<Mood, string> = {
  feliz: 'contento',
  guino: 'guiñando un ojo',
  pensando: 'pensando',
  festejo: 'festejando',
  dormido: 'durmiendo',
  triste: 'triste',
  sorpresa: 'sorprendido',
}
export const houseCharacter = (bizId: string): CharacterId => (bizId === 'ritual-cafe' ? 'granito' : 'noqui')

const INK = '#2b1a10'

function Eye({ x, y, mood, side, dark }: { x: number; y: number; mood: Mood; side: -1 | 1; dark: boolean }) {
  const line = dark ? '#fff4e2' : INK
  if (mood === 'festejo' || (mood === 'guino' && side === 1)) return <path d={`M${x - 5} ${y + 1.5} Q ${x} ${y - 5} ${x + 5} ${y + 1.5}`} stroke={line} strokeWidth="2.6" fill="none" strokeLinecap="round" />
  if (mood === 'dormido') return <path d={`M${x - 5} ${y - 0.5} Q ${x} ${y + 4.5} ${x + 5} ${y - 0.5}`} stroke={line} strokeWidth="2.4" fill="none" strokeLinecap="round" />
  const big = mood === 'sorpresa' ? 1.25 : 1
  const gx = mood === 'pensando' ? 1.6 : 0
  const gy = mood === 'pensando' ? -1.8 : mood === 'triste' ? 1 : 0
  if (dark) {
    return (
      <g>
        <ellipse cx={x} cy={y} rx={5.6 * big} ry={6.4 * big} fill="#fff7ea" />
        <ellipse cx={x + gx} cy={y + gy + 0.6} rx={3.2 * big} ry={3.8 * big} fill="#1f0f06" />
        <circle cx={x + gx - 1.2} cy={y + gy - 1} r={1.3} fill="#ffffff" />
      </g>
    )
  }
  return (
    <g>
      <ellipse cx={x + gx * 0.6} cy={y + gy * 0.6} rx={4 * big} ry={5.2 * big} fill={INK} />
      <circle cx={x + gx * 0.6 - 1.4} cy={y + gy * 0.6 - 2} r={1.6} fill="#ffffff" />
      <circle cx={x + gx * 0.6 + 1.3} cy={y + gy * 0.6 + 1.8} r={0.7} fill="#ffffff" opacity="0.8" />
    </g>
  )
}

function Mouth({ x, y, mood, dark }: { x: number; y: number; mood: Mood; dark: boolean }) {
  const line = dark ? '#fff4e2' : INK
  switch (mood) {
    case 'festejo':
      return (
        <g>
          <path d={`M${x - 9} ${y - 1} Q ${x} ${y + 14} ${x + 9} ${y - 1} Z`} fill="#6e2216" />
          <ellipse cx={x} cy={y + 6.4} rx="4.4" ry="2.4" fill="#ee7d6c" />
        </g>
      )
    case 'feliz':
    case 'guino':
      return (
        <g>
          <path d={`M${x - 6.5} ${y} Q ${x} ${y + 9.5} ${x + 6.5} ${y} Z`} fill="#6e2216" />
          <ellipse cx={x} cy={y + 4.6} rx="3" ry="1.7" fill="#ee7d6c" />
        </g>
      )
    case 'pensando':
      return <path d={`M${x - 3} ${y + 2} Q ${x + 1} ${y} ${x + 5} ${y + 1.5}`} stroke={line} strokeWidth="2.2" fill="none" strokeLinecap="round" />
    case 'dormido':
      return <ellipse cx={x} cy={y + 2} rx="2.2" ry="1.6" fill={dark ? '#fff4e2' : '#6e2216'} opacity="0.85" />
    case 'triste':
      return <path d={`M${x - 5} ${y + 4} Q ${x} ${y - 1} ${x + 5} ${y + 4}`} stroke={line} strokeWidth="2.2" fill="none" strokeLinecap="round" />
    case 'sorpresa':
      return <ellipse cx={x} cy={y + 2.5} rx="3.4" ry="4.2" fill="#6e2216" />
  }
}

/** Cara compartida: ojos, boca, cachetes y cejas según el ánimo. */
function Face({ cx, cy, mood, dark = false, spread = 11 }: { cx: number; cy: number; mood: Mood; dark?: boolean; spread?: number }) {
  const line = dark ? '#fff4e2' : INK
  return (
    <g>
      <ellipse cx={cx - spread - 6} cy={cy + 7} rx="4.6" ry="2.8" fill="#f2808a" opacity={dark ? 0.45 : 0.55} />
      <ellipse cx={cx + spread + 6} cy={cy + 7} rx="4.6" ry="2.8" fill="#f2808a" opacity={dark ? 0.45 : 0.55} />
      <Eye x={cx - spread} y={cy} mood={mood} side={-1} dark={dark} />
      <Eye x={cx + spread} y={cy} mood={mood} side={1} dark={dark} />
      {mood === 'triste' && (
        <>
          <path d={`M${cx - spread - 5} ${cy - 9} L${cx - spread + 4} ${cy - 11}`} stroke={line} strokeWidth="1.8" strokeLinecap="round" />
          <path d={`M${cx + spread + 5} ${cy - 9} L${cx + spread - 4} ${cy - 11}`} stroke={line} strokeWidth="1.8" strokeLinecap="round" />
          <path d={`M${cx + spread + 3} ${cy + 6} c -2 3, -2 5, 0 6 c 2 -1, 2 -3, 0 -6 Z`} fill="#8fd0f2" />
        </>
      )}
      {mood === 'pensando' && <path d={`M${cx + spread - 4} ${cy - 10} Q ${cx + spread + 1} ${cy - 13} ${cx + spread + 6} ${cy - 10}`} stroke={line} strokeWidth="1.8" fill="none" strokeLinecap="round" />}
      <Mouth x={cx} y={cy + 9} mood={mood} dark={dark} />
    </g>
  )
}

/** Bracitos: posición según el ánimo (saludo, festejo, mano al mentón). */
function Arms({ mood, l, r, color, edge }: { mood: Mood; l: [number, number]; r: [number, number]; color: string; edge: string }) {
  const arm = (d: string, k: string) => (
    <g key={k}>
      <path d={d} stroke={edge} strokeWidth="8.4" strokeLinecap="round" fill="none" />
      <path d={d} stroke={color} strokeWidth="6" strokeLinecap="round" fill="none" />
    </g>
  )
  const [lx, ly] = l
  const [rx, ry] = r
  if (mood === 'festejo') return <>{arm(`M${lx} ${ly} Q ${lx - 10} ${ly - 8} ${lx - 12} ${ly - 22}`, 'l')}{arm(`M${rx} ${ry} Q ${rx + 10} ${ry - 8} ${rx + 12} ${ry - 22}`, 'r')}</>
  if (mood === 'pensando') return <>{arm(`M${lx} ${ly} Q ${lx - 8} ${ly + 8} ${lx - 6} ${ly + 14}`, 'l')}{arm(`M${rx} ${ry} Q ${rx + 4} ${ry + 10} ${rx - 12} ${ry + 4}`, 'r')}</>
  if (mood === 'feliz' || mood === 'guino') return <>{arm(`M${lx} ${ly} Q ${lx - 8} ${ly + 8} ${lx - 6} ${ly + 14}`, 'l')}{arm(`M${rx} ${ry} Q ${rx + 10} ${ry - 4} ${rx + 13} ${ry - 16}`, 'r')}</>
  if (mood === 'dormido') return <>{arm(`M${lx} ${ly} Q ${lx - 2} ${ly + 10} ${lx + 6} ${ly + 14}`, 'l')}{arm(`M${rx} ${ry} Q ${rx + 2} ${ry + 10} ${rx - 6} ${ry + 14}`, 'r')}</>
  return <>{arm(`M${lx} ${ly} Q ${lx - 8} ${ly + 8} ${lx - 6} ${ly + 14}`, 'l')}{arm(`M${rx} ${ry} Q ${rx + 8} ${ry + 8} ${rx + 6} ${ry + 14}`, 'r')}</>
}

function Extras({ mood }: { mood: Mood }) {
  if (mood === 'festejo') {
    const bits: [number, number, string, number][] = [[14, 22, '#e2533a', 20], [104, 18, '#f2b632', -30], [20, 50, '#4f8a32', 50], [100, 46, '#3c6fb3', 10], [60, 6, '#d24b8b', -12], [86, 8, '#4f8a32', 40]]
    return (
      <g className="char-confetti">
        {bits.map(([x, y, c, a], i) => <rect key={i} x={x - 3} y={y - 1.6} width="6" height="3.2" rx="1" fill={c} transform={`rotate(${a} ${x} ${y})`} />)}
      </g>
    )
  }
  if (mood === 'dormido') {
    return (
      <g stroke="#6d7fa6" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="char-z">
        <path d="M92 18 h8 l-8 9 h8" />
        <path d="M104 6 h6 l-6 7 h6" opacity="0.7" />
      </g>
    )
  }
  if (mood === 'pensando') {
    return <g fill="#c9b79c">{[[94, 26, 2.4], [101, 17, 3.2], [110, 8, 4]].map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} />)}</g>
  }
  return null
}

function Ground() {
  const id = useArtId()
  return (
    <>
      <defs>
        <radialGradient id={id('ground')}>
          <stop offset="0.5" stopColor="#3b2a1a" stopOpacity="0.22" />
          <stop offset="1" stopColor="#3b2a1a" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="60" cy="110" rx="34" ry="6" fill={url(id('ground'))} />
    </>
  )
}

function Noqui({ mood }: { mood: Mood }) {
  const id = useArtId()
  return (
    <>
      <defs>
        <radialGradient id={id('dough')} cx="38%" cy="30%" r="75%">
          <stop offset="0" stopColor="#fff3cf" />
          <stop offset="0.55" stopColor="#f1cf87" />
          <stop offset="1" stopColor="#c99146" />
        </radialGradient>
        <linearGradient id={id('toque')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#e6e1d6" />
        </linearGradient>
      </defs>
      <Ground />
      <g className="char-body">
        <Arms mood={mood} l={[26, 72]} r={[94, 72]} color="#f1cf87" edge="#b98a44" />
        <path d="M60 104 C 34 104, 20 90, 20 70 C 20 50, 36 36, 60 36 C 84 36, 100 50, 100 70 C 100 90, 86 104, 60 104 Z" fill="#b98a44" />
        <path d="M60 102 C 36 102, 22 89, 22 70 C 22 51, 37 38, 60 38 C 83 38, 98 51, 98 70 C 98 89, 84 102, 60 102 Z" fill={url(id('dough'))} />
        {/* marcas del tenedor del ñoqui */}
        {[86, 92, 98].map((y, i) => <path key={y} d={`M${34 + i * 3} ${y - 2} Q 60 ${y + 4} ${86 - i * 3} ${y - 2}`} stroke="#c08a43" strokeOpacity="0.6" strokeWidth="2" fill="none" strokeLinecap="round" />)}
        <path d="M32 56 C 38 46, 48 42, 58 41" stroke="#ffffff" strokeOpacity="0.75" strokeWidth="3.4" fill="none" strokeLinecap="round" />
        {/* gorro de cocina */}
        <g transform="rotate(-8 60 30)">
          <rect x="44" y="30" width="32" height="10" rx="3" fill={url(id('toque'))} stroke="#cfc8b8" strokeWidth="1" />
          <path d="M42 31 C 34 30, 34 16, 44 16 C 44 6, 58 4, 62 12 C 66 4, 82 6, 80 18 C 90 18, 88 32, 78 31 Z" fill={url(id('toque'))} stroke="#cfc8b8" strokeWidth="1" />
          <path d="M52 30 L52 22 M60 30 L60 20 M68 30 L68 22" stroke="#d9d3c5" strokeWidth="1.2" strokeLinecap="round" />
          <rect x="44" y="34" width="32" height="2.4" fill="#355443" opacity="0.85" />
        </g>
        <Face cx={60} cy={68} mood={mood} />
      </g>
      <Extras mood={mood} />
    </>
  )
}

function Granito({ mood }: { mood: Mood }) {
  const id = useArtId()
  return (
    <>
      <defs>
        <radialGradient id={id('bean')} cx="36%" cy="28%" r="78%">
          <stop offset="0" stopColor="#b9764a" />
          <stop offset="0.55" stopColor="#7c4325" />
          <stop offset="1" stopColor="#3f200f" />
        </radialGradient>
      </defs>
      <Ground />
      <g className="char-body">
        <Arms mood={mood} l={[30, 74]} r={[90, 74]} color="#7c4325" edge="#3f200f" />
        <ellipse cx="60" cy="68" rx="34" ry="40" fill="#3f200f" />
        <ellipse cx="60" cy="67" rx="32.5" ry="38.5" fill={url(id('bean'))} />
        {/* surco del grano */}
        <path d="M64 30 C 54 40, 70 46, 62 54" stroke="#2a1408" strokeWidth="3.4" fill="none" strokeLinecap="round" />
        <path d="M66 31 C 57 40, 72 46, 64 54" stroke="#c48a5c" strokeOpacity="0.6" strokeWidth="1.2" fill="none" strokeLinecap="round" />
        <path d="M60 98 C 64 102, 60 104, 58 105" stroke="#2a1408" strokeWidth="2.4" fill="none" strokeLinecap="round" opacity="0.7" />
        <path d="M36 52 C 40 42, 46 36, 54 33" stroke="#e7b48a" strokeOpacity="0.6" strokeWidth="3" fill="none" strokeLinecap="round" />
        {/* brote */}
        <path d="M60 29 C 60 22, 62 18, 64 15" stroke="#4f8a32" strokeWidth="2.4" fill="none" strokeLinecap="round" />
        <path d="M64 15 C 72 8, 82 12, 80 18 C 74 22, 66 20, 64 15 Z" fill={url(id('leaf1'))} />
        <path d="M63 18 C 56 12, 48 16, 50 21 C 55 24, 61 22, 63 18 Z" fill={url(id('leaf2'))} />
        <Face cx={60} cy={70} mood={mood} dark spread={10} />
      </g>
      <Extras mood={mood} />
    </>
  )
}

function Tomatito({ mood }: { mood: Mood }) {
  const id = useArtId()
  return (
    <>
      <defs>
        <radialGradient id={id('tom')} cx="34%" cy="30%" r="75%">
          <stop offset="0" stopColor="#ff9a7a" />
          <stop offset="0.5" stopColor="#e2452b" />
          <stop offset="1" stopColor="#a52414" />
        </radialGradient>
      </defs>
      <Ground />
      <g className="char-body">
        <Arms mood={mood} l={[24, 74]} r={[96, 74]} color="#e2452b" edge="#9a2112" />
        <path d="M60 106 C 30 106, 18 88, 20 68 C 22 48, 38 36, 60 38 C 82 36, 98 48, 100 68 C 102 88, 90 106, 60 106 Z" fill="#9a2112" />
        <path d="M60 104 C 32 104, 21 87, 22 68 C 24 50, 39 39, 60 40 C 81 39, 96 50, 98 68 C 99 87, 88 104, 60 104 Z" fill={url(id('tom'))} />
        <ellipse cx="40" cy="54" rx="9" ry="5" fill="#ffffff" opacity="0.45" transform="rotate(-30 40 54)" />
        <path d="M60 42 C 54 34, 44 34, 40 38 C 48 40, 52 42, 56 44 C 50 46, 46 52, 46 56 C 52 52, 56 48, 60 46 C 64 48, 68 52, 74 56 C 74 52, 70 46, 64 44 C 68 42, 72 40, 80 38 C 76 34, 66 34, 60 42 Z" fill={url(id('leaf1'))} />
        <path d="M60 42 C 60 36, 61 32, 64 28" stroke="#3e7426" strokeWidth="3" fill="none" strokeLinecap="round" />
        <Face cx={60} cy={72} mood={mood} />
      </g>
      <Extras mood={mood} />
    </>
  )
}

const DRAW: Record<CharacterId, (p: { mood: Mood }) => ReactNode> = { noqui: Noqui, granito: Granito, tomatito: Tomatito }

/**
 * Personaje ilustrado. Decorativo por defecto (`aria-hidden`); con `label` se anuncia.
 * `animate` agrega un vaivén suave que se apaga con movimiento reducido.
 */
export function Character({ who, mood = 'feliz', size = 120, label, animate = false, className }: { who: CharacterId; mood?: Mood; size?: number; label?: string | true; animate?: boolean; className?: string }) {
  const Draw = DRAW[who]
  const text = label === true ? `${CHARACTER_NAME[who]}, ${MOOD_TEXT[mood]}` : label
  return (
    <Art size={size} view={120} label={text} className={`char char-${who} mood-${mood} ${animate ? 'char-anim' : ''} ${className ?? ''}`}>
      <Draw mood={mood} />
    </Art>
  )
}

export const MOODS = Object.keys(MOOD_TEXT) as Mood[]

/** Personaje de la casa del negocio (decorativo): Ñoqui en Mesa Clara, Granito en Ritual Café. */
export function HouseChar({ biz, mood = 'feliz', size = 96, animate = false, className }: { biz: string; mood?: Mood; size?: number; animate?: boolean; className?: string }) {
  return <Character who={houseCharacter(biz)} mood={mood} size={size} animate={animate} className={className} />
}
