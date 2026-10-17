import type { ReactNode } from 'react'
import type { SeasonId } from '../../domain/types'
import { Art, url, useArtId } from './kit'

// Ornamentos de temporada: misma luz y paleta que los platos, en grilla de 120 × 120.
// Se usan en la banda de temporada, el distintivo del encabezado y las tarjetas de regalo.

function Blossom({ x, y, r, c1, c2, rot = 0 }: { x: number; y: number; r: number; c1: string; c2: string; rot?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      {[0, 72, 144, 216, 288].map((a) => (
        <ellipse key={a} cx="0" cy={-r * 0.62} rx={r * 0.42} ry={r * 0.62} fill={c1} stroke={c2} strokeWidth="0.8" transform={`rotate(${a})`} />
      ))}
      <circle r={r * 0.26} fill="#f6c84a" />
      {[0, 60, 120, 180, 240, 300].map((a) => <circle key={a} cx={Math.cos((a * Math.PI) / 180) * r * 0.16} cy={Math.sin((a * Math.PI) / 180) * r * 0.16} r="0.8" fill="#b9791f" />)}
    </g>
  )
}

function LeafShape({ x, y, s = 1, rot = 0, c1, c2 }: { x: number; y: number; s?: number; rot?: number; c1: string; c2: string }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <path d="M0 -18 C 10 -12, 12 4, 0 18 C -12 4, -10 -12, 0 -18 Z" fill={c1} />
      <path d="M0 -16 L0 17 M0 -4 L6 -9 M0 4 L-6 -1 M0 10 L5 6" stroke={c2} strokeWidth="1.1" strokeLinecap="round" fill="none" />
    </g>
  )
}

function Heart({ x, y, s = 1, fill }: { x: number; y: number; s?: number; fill: string }) {
  return <path transform={`translate(${x} ${y}) scale(${s})`} d="M0 14 C -18 2, -16 -12, -7 -12 C -3 -12, 0 -9, 0 -6 C 0 -9, 3 -12, 7 -12 C 16 -12, 18 2, 0 14 Z" fill={fill} />
}

/** Destello de grabado: punto con rayos finos (no la estrella de cuatro puntas de banco de íconos). */
function Sparkle({ x, y, s = 1, c = '#f6c84a' }: { x: number; y: number; s?: number; c?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} stroke={c} strokeLinecap="round">
      <circle r="1.6" fill={c} stroke="none" />
      {[0, 45, 90, 135].map((a) => <path key={a} d="M0 -6 V -3.4 M0 3.4 V 6" strokeWidth={a % 90 ? 0.9 : 1.3} transform={`rotate(${a})`} />)}
    </g>
  )
}

function Primavera() {
  return (
    <>
      <path d="M18 98 C 38 80, 58 70, 100 30" stroke="#7a5236" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M52 72 C 50 60, 56 52, 64 48" stroke="#7a5236" strokeWidth="2" fill="none" strokeLinecap="round" />
      <LeafShape x={34} y={80} rot={-60} s={0.7} c1="#8cc063" c2="#4f8a32" />
      <LeafShape x={74} y={62} rot={40} s={0.6} c1="#9cc66b" c2="#4f8a32" />
      <LeafShape x={92} y={46} rot={-30} s={0.55} c1="#7fb150" c2="#3e7426" />
      <Blossom x={64} y={44} r={14} c1="#f7c6d0" c2="#e39aab" rot={10} />
      <Blossom x={96} y={30} r={11} c1="#fbd9df" c2="#e7a1b0" rot={30} />
      <Blossom x={44} y={70} r={10} c1="#f4b6c2" c2="#d98699" />
      <Blossom x={22} y={96} r={7} c1="#fbd9df" c2="#e7a1b0" rot={18} />
    </>
  )
}

function Verano() {
  const id = useArtId()
  return (
    <>
      <defs>
        <radialGradient id={id('sun')} cx="40%" cy="35%" r="70%"><stop offset="0" stopColor="#ffe08a" /><stop offset="0.7" stopColor="#f2b632" /><stop offset="1" stopColor="#d98a1a" /></radialGradient>
      </defs>
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i * 30 * Math.PI) / 180
        return <path key={i} d={`M${54 + Math.cos(a) * 30} ${50 + Math.sin(a) * 30} L${54 + Math.cos(a) * 42} ${50 + Math.sin(a) * 42}`} stroke="#f2b632" strokeWidth="4" strokeLinecap="round" />
      })}
      <circle cx="54" cy="50" r="24" fill={url(id('sun'))} />
      <path d="M40 40 C 44 34, 52 31, 58 31" stroke="#fff3c4" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.8" />
      <g transform="translate(86 86)">
        <circle r="20" fill="#f4d64e" />
        <circle r="17" fill="#fbf1b4" />
        {Array.from({ length: 8 }, (_, i) => <path key={i} d="M0 0 L-4.4 -14 A 15 15 0 0 1 4.4 -14 Z" fill="#f2d74a" transform={`rotate(${i * 45})`} />)}
        <circle r="2.4" fill="#fbf1b4" />
      </g>
    </>
  )
}

function Otono() {
  return (
    <>
      <LeafShape x={40} y={40} rot={-30} s={1.25} c1="#d9772e" c2="#8e3b1f" />
      <LeafShape x={82} y={58} rot={50} s={1.05} c1="#b5402a" c2="#6b1f12" />
      <LeafShape x={54} y={88} rot={-80} s={0.95} c1="#e2a33a" c2="#8e5a1f" />
      <path d="M92 20 c 4 8, -4 12, 0 20" stroke="#c9b79c" strokeWidth="1.6" fill="none" strokeDasharray="2 4" strokeLinecap="round" />
      <path d="M22 70 c 6 6, -2 12, 4 18" stroke="#c9b79c" strokeWidth="1.6" fill="none" strokeDasharray="2 4" strokeLinecap="round" />
    </>
  )
}

function Invierno() {
  const id = useArtId()
  return (
    <>
      <defs>
        <radialGradient id={id('mate')} cx="35%" cy="35%" r="75%"><stop offset="0" stopColor="#c9874d" /><stop offset="0.6" stopColor="#8a5128" /><stop offset="1" stopColor="#4f2a12" /></radialGradient>
        <linearGradient id={id('metal')} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#9aa1a6" /><stop offset="0.5" stopColor="#eef1f2" /><stop offset="1" stopColor="#8b9297" /></linearGradient>
      </defs>
      {/* vapor */}
      {[44, 58].map((x, i) => <path key={x} d={`M${x} ${36 - i * 4} c -6 -8, 6 -12, 0 -20 c -4 -5, 2 -9, 0 -12`} stroke="#b9c4d6" strokeWidth="2.6" fill="none" strokeLinecap="round" opacity="0.8" />)}
      {/* bombilla */}
      <rect x="64" y="12" width="5" height="52" rx="2.5" fill={url(id('metal'))} transform="rotate(18 66 38)" />
      {/* mate */}
      <ellipse cx="56" cy="104" rx="26" ry="5" fill="#3b2a1a" opacity="0.2" />
      <path d="M30 60 C 26 84, 36 104, 56 104 C 76 104, 86 84, 82 60 Z" fill={url(id('mate'))} />
      <ellipse cx="56" cy="60" rx="26" ry="8" fill="#6b3f1e" />
      <ellipse cx="56" cy="60" rx="21" ry="5.6" fill="#7aa64a" />
      {[0, 1, 2, 3, 4, 5].map((i) => <circle key={i} cx={42 + i * 5.6} cy={59 + (i % 2)} r="1.1" fill="#4f7a2a" />)}
      <path d="M30 60 C 30 66, 82 66, 82 60" stroke="#d9b37a" strokeWidth="3" fill="none" />
      <path d="M36 72 C 36 86, 42 96, 50 100" stroke="#f0c896" strokeWidth="2.6" fill="none" opacity="0.6" strokeLinecap="round" />
      {/* copos / estrellas suaves */}
      <Sparkle x={96} y={30} s={1.1} c="#c9d4e8" />
      <Sparkle x={20} y={30} s={0.8} c="#c9d4e8" />
    </>
  )
}

function Madre() {
  const carnation = (x: number, y: number, c1: string, c2: string, r = 11) => (
    <g key={`${x}-${y}`}>
      {Array.from({ length: 9 }, (_, i) => {
        const a = (i * 40 * Math.PI) / 180
        return <circle key={i} cx={x + Math.cos(a) * r * 0.55} cy={y + Math.sin(a) * r * 0.55} r={r * 0.5} fill={i % 2 ? c1 : c2} />
      })}
      <circle cx={x} cy={y} r={r * 0.45} fill={c2} />
      <path d={`M${x - r * 0.4} ${y - r * 0.1} q ${r * 0.2} ${-r * 0.3} ${r * 0.4} 0 q ${r * 0.2} ${-r * 0.3} ${r * 0.4} 0`} stroke="#fff" strokeOpacity="0.6" strokeWidth="1" fill="none" />
    </g>
  )
  return (
    <>
      {[[46, 70, 30, 30], [60, 70, 60, 26], [74, 70, 88, 32]].map(([x1, y1, x2, y2], i) => <path key={i} d={`M${x1} ${y1 + 20} L${x2} ${y2 + 10}`} stroke="#4f8a32" strokeWidth="2.4" strokeLinecap="round" />)}
      <LeafShape x={36} y={54} rot={-50} s={0.6} c1="#8cc063" c2="#4f8a32" />
      <LeafShape x={84} y={56} rot={50} s={0.6} c1="#7fb150" c2="#3e7426" />
      {carnation(30, 34, '#e9758f', '#d24b6b')}
      {carnation(88, 36, '#f39bb0', '#e36b88')}
      {carnation(60, 26, '#d9667f', '#b9304f', 13)}
      {/* cono de papel */}
      <path d="M34 62 L86 62 L66 108 L54 108 Z" fill="#f4eadb" stroke="#d9c6a6" strokeWidth="1.2" />
      <path d="M40 62 L60 108 M80 62 L60 108" stroke="#e6d7bd" strokeWidth="1" />
      {/* moño */}
      <path d="M60 84 C 48 74, 40 82, 46 90 C 52 94, 58 88, 60 84 Z M60 84 C 72 74, 80 82, 74 90 C 68 94, 62 88, 60 84 Z" fill="#c2334d" />
      <circle cx="60" cy="85" r="3.4" fill="#9e2238" />
      <path d="M58 87 L52 100 M62 87 L68 100" stroke="#c2334d" strokeWidth="3" strokeLinecap="round" />
    </>
  )
}

function Padre() {
  const id = useArtId()
  return (
    <>
      <defs>
        <linearGradient id={id('tie')} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#4f86c9" /><stop offset="1" stopColor="#24487a" /></linearGradient>
        <clipPath id={id('tieclip')}><path d="M50 34 L70 34 L76 86 L60 104 L44 86 Z" /></clipPath>
      </defs>
      <path d="M36 18 L60 30 L84 18 L84 28 L60 40 L36 28 Z" fill="#f4f1ea" stroke="#d6cfbf" strokeWidth="1.2" />
      <path d="M52 26 L68 26 L66 38 L54 38 Z" fill="#2f5d99" />
      <path d="M50 34 L70 34 L76 86 L60 104 L44 86 Z" fill={url(id('tie'))} />
      <g clipPath={url(id('tieclip'))}>
        {[0, 1, 2, 3, 4, 5].map((i) => <path key={i} d={`M30 ${40 + i * 14} L90 ${20 + i * 14}`} stroke="#d9b45a" strokeWidth="3.2" />)}
      </g>
      <path d="M54 40 L52 80" stroke="#ffffff" strokeOpacity="0.35" strokeWidth="2.6" strokeLinecap="round" />
      <Sparkle x={92} y={64} s={1.2} c="#d9b45a" />
      <Sparkle x={26} y={78} s={0.9} c="#d9b45a" />
    </>
  )
}

function Amigo() {
  const cup = (x: number, rot: number, body: string) => (
    <g transform={`translate(${x} 68) rotate(${rot})`}>
      <path d="M-16 -20 L16 -20 L13 18 C 12 22, -12 22, -13 18 Z" fill="#fbf7f0" stroke="#cbb89a" strokeWidth="1.2" />
      <path d="M-15 -12 L15 -12 L13.4 6 L-13.4 6 Z" fill={body} />
      <path d="M16 -10 C 26 -10, 26 6, 14 6" stroke="#cbb89a" strokeWidth="3.4" fill="none" />
      <ellipse cx="0" cy="-20" rx="16" ry="3.4" fill="#e9d8bf" />
      <path d="M-10 -16 L-9 14" stroke="#fff" strokeWidth="2" opacity="0.7" strokeLinecap="round" />
    </g>
  )
  return (
    <>
      <ellipse cx="60" cy="98" rx="40" ry="5" fill="#3b2a1a" opacity="0.18" />
      {cup(40, 14, '#3fa08a')}
      {cup(80, -14, '#f2b632')}
      <Sparkle x={60} y={30} s={1.6} c="#f2b632" />
      <Sparkle x={44} y={22} s={0.8} c="#3fa08a" />
      <Sparkle x={78} y={20} s={0.9} c="#e2533a" />
      <path d="M50 36 L46 30 M70 36 L74 30 M60 40 L60 44" stroke="#c9b79c" strokeWidth="2" strokeLinecap="round" />
    </>
  )
}

function Fiestas() {
  const bulbs = ['#e2533a', '#f2b632', '#3fa08a', '#3c6fb3', '#d24b8b', '#f2b632', '#e2533a']
  return (
    <>
      <path d="M6 44 C 30 72, 90 72, 114 44" stroke="#3b4a3a" strokeWidth="1.8" fill="none" />
      {bulbs.map((c, i) => {
        const t = (i + 0.5) / bulbs.length
        const x = 6 + t * 108
        const y = 44 + Math.sin(t * Math.PI) * 21
        return (
          <g key={i} transform={`translate(${x} ${y + 4}) rotate(${(t - 0.5) * -50})`}>
            <rect x="-2.4" y="-5" width="4.8" height="4" rx="1" fill="#6b6f68" />
            <path d="M0 -1 C 6 2, 6 12, 0 14 C -6 12, -6 2, 0 -1 Z" fill={c} />
            <ellipse cx="-1.6" cy="5" rx="1.4" ry="3" fill="#fff" opacity="0.55" />
          </g>
        )
      })}
      <path d="M60 4 L64.6 15.4 L76.8 16 L67.4 23.8 L70.4 35.6 L60 29 L49.6 35.6 L52.6 23.8 L43.2 16 L55.4 15.4 Z" fill="#d9a73a" stroke="#b5832a" strokeWidth="1" strokeLinejoin="round" />
      <path d="M58 12 L56 20" stroke="#fff3c4" strokeWidth="1.6" strokeLinecap="round" />
      <g transform="translate(60 104) scale(.9)">
        <path d="M-22 -10 C -22 -26, 22 -26, 22 -10 L22 6 C 22 12, -22 12, -22 6 Z" fill="#e3b26a" />
        <path d="M-22 -10 C -22 -26, 22 -26, 22 -10" fill="#c98a3c" />
        <path d="M-24 -6 L24 -6 L24 8 L-24 8 Z" fill="#f6efe2" stroke="#d9c6a6" strokeWidth="1" />
        {[-14, -4, 6, 14].map((x, i) => <circle key={i} cx={x} cy={-16 + (i % 2) * 4} r="2.2" fill={i % 2 ? '#3fa08a' : '#c2334d'} />)}
      </g>
      <Sparkle x={18} y={84} s={1} c="#d9a73a" />
      <Sparkle x={102} y={84} s={0.9} c="#d9a73a" />
    </>
  )
}

function Enamorados() {
  return (
    <>
      <Heart x={48} y={58} s={2.3} fill="#c2334d" />
      <Heart x={76} y={54} s={1.8} fill="#f2a7b4" />
      <path d="M30 46 C 34 38, 40 36, 46 36" stroke="#ffffff" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.6" />
      <Sparkle x={96} y={24} s={1.2} c="#f2a7b4" />
      <Sparkle x={22} y={92} s={1} c="#c2334d" />
      <Sparkle x={100} y={94} s={0.8} c="#f6c84a" />
    </>
  )
}

const DRAW: Record<SeasonId, () => ReactNode> = {
  primavera: Primavera, verano: Verano, otono: Otono, invierno: Invierno,
  madre: Madre, padre: Padre, amigo: Amigo, fiestas: Fiestas, enamorados: Enamorados,
}

/** Ornamento ilustrado de la temporada. Decorativo salvo que se pase `label`. */
export function SeasonArt({ id, size = 96, label, className }: { id: SeasonId; size?: number; label?: string; className?: string }) {
  const Draw = DRAW[id]
  return (
    <Art size={size} view={120} label={label} className={`season-art ${className ?? ''}`}>
      <Draw />
    </Art>
  )
}
