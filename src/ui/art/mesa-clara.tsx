import type { ComponentType } from 'react'
import { arc, Basil, Board, Cherry, Fries, IronPan, Leaf, Lemon, Plate, rand, Sauce, Shadow, Speckles, Steam, url, useArtId } from './kit'

// Ilustraciones de la carta de Mesa Clara (bodegón). Vista cenital sobre vajilla blanca con filete verde.

const CRUMB = ['#f6cf7d', '#dda049', '#b06f24']

function Grad({ id, stops, cx = '40%', cy = '35%', r = '70%' }: { id: string; stops: string[]; cx?: string; cy?: string; r?: string }) {
  return (
    <radialGradient id={id} cx={cx} cy={cy} r={r}>
      {stops.map((c, i) => <stop key={i} offset={i / (stops.length - 1)} stopColor={c} />)}
    </radialGradient>
  )
}

function Gloss({ x, y, rx, ry, rot = -25 }: { x: number; y: number; rx: number; ry: number; rot?: number }) {
  const id = useArtId()
  return <ellipse cx={x} cy={y} rx={rx} ry={ry} fill={url(id('gloss'))} transform={`rotate(${rot} ${x} ${y})`} />
}

/** Rebozado: silueta dorada con miga clara y oscura. */
function Breaded({ d, seed, cx, cy, rx, ry }: { d: string; seed: number; cx: number; cy: number; rx: number; ry: number }) {
  const id = useArtId()
  return (
    <g>
      <path d={d} fill={url(id('crumb'))} />
      <path d={d} fill="none" stroke="#9c5d1c" strokeOpacity="0.55" strokeWidth="1.4" />
      <Speckles cx={cx} cy={cy} rx={rx} ry={ry} n={70} color="#b8742a" min={0.5} max={1.2} seed={seed} opacity={0.75} />
      <Speckles cx={cx} cy={cy} rx={rx} ry={ry} n={50} color="#ffe2a0" min={0.4} max={1} seed={seed + 1} opacity={0.8} />
    </g>
  )
}

function Rosemary({ x, y, rot = 0, s = 1 }: { x: number; y: number; rot?: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <path d="M0 -18 C 1 -6, -1 6, 0 18" stroke="#6b5a32" strokeWidth="1.2" fill="none" />
      {Array.from({ length: 9 }, (_, i) => (
        <g key={i}>
          <path d={`M0 ${-15 + i * 4} l-6 -2`} stroke="#4f7a3a" strokeWidth="1.6" strokeLinecap="round" />
          <path d={`M0 ${-13 + i * 4} l6 -2`} stroke="#5d8a45" strokeWidth="1.6" strokeLinecap="round" />
        </g>
      ))}
    </g>
  )
}

function Parsley({ cx, cy, rx, ry, seed }: { cx: number; cy: number; rx: number; ry: number; seed: number }) {
  return <Speckles cx={cx} cy={cy} rx={rx} ry={ry} n={22} color="#3f7a2c" min={0.7} max={1.5} seed={seed} shape="flake" />
}

// ------------------------------------------------------------------ entradas

function Provoleta() {
  const id = useArtId()
  return (
    <>
      <IronPan cx={76} cy={76} r={54} />
      <defs><Grad id={id('prov')} stops={['#fdeab0', '#f2c862', '#cf8d2e']} /></defs>
      <path d="M40 76 C 38 54, 56 38, 78 38 C 100 38, 114 54, 113 74 C 115 94, 100 112, 78 113 C 56 114, 41 98, 40 76 Z" fill={url(id('prov'))} />
      <path d="M108 90 C 113 95, 112 102, 107 102 C 103 101, 103 95, 108 90 Z M46 96 C 42 100, 43 105, 47 105 C 50 104, 50 99, 46 96 Z" fill="#e3a744" />
      <Speckles cx={78} cy={76} rx={32} ry={30} n={30} color="#a35b1c" min={0.9} max={2.4} seed={57} opacity={0.45} />
      <Speckles cx={78} cy={76} rx={30} ry={28} n={14} color="#fff6d5" min={0.8} max={2} seed={21} opacity={0.6} />
      <Gloss x={62} y={56} rx={15} ry={6} />
      <Speckles cx={78} cy={76} rx={32} ry={30} n={34} color="#4e6f22" min={0.6} max={1.3} seed={4} shape="flake" />
      <path d="M88 52 C 94 54, 100 58, 103 64" stroke="#fff3c4" strokeOpacity="0.8" strokeWidth="2.4" fill="none" strokeLinecap="round" />
    </>
  )
}

function EmpanadaShape({ x, y, rot, s = 1 }: { x: number; y: number; rot: number; s?: number }) {
  const id = useArtId()
  const knots = Array.from({ length: 13 }, (_, i) => {
    const t = ((10 + i * (160 / 12)) * Math.PI) / 180
    return { x: -25 * Math.cos(t), y: 6 - 20 * Math.sin(t), a: (Math.atan2(-20 * Math.cos(t), 25 * Math.sin(t)) * 180) / Math.PI }
  })
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <ellipse cx="2" cy="9" rx="28" ry="6" fill="#3b2a1a" opacity="0.18" />
      <path d="M-27 6 C -27 -19, 27 -19, 27 6 C 14 11, -14 11, -27 6 Z" fill={url(id('emp'))} />
      <Speckles cx={0} cy={-4} rx={18} ry={8} n={16} color="#a7621f" min={0.6} max={1.6} seed={x} opacity={0.55} />
      {knots.map((k, i) => (
        <ellipse key={i} cx={k.x} cy={k.y} rx="3.4" ry="2.3" transform={`rotate(${k.a.toFixed(0)} ${k.x.toFixed(1)} ${k.y.toFixed(1)})`} fill="#e9b55d" stroke="#b87428" strokeWidth="0.7" />
      ))}
      <path d="M-14 -8 C -6 -13, 6 -13, 12 -10" stroke="#fff3cf" strokeOpacity="0.75" strokeWidth="2" fill="none" strokeLinecap="round" />
    </g>
  )
}

function Empanadas() {
  const id = useArtId()
  return (
    <>
      <Plate />
      <defs><Grad id={id('emp')} stops={['#f8d58a', '#e3a24a', '#b46d24']} /></defs>
      <EmpanadaShape x={66} y={70} rot={-14} />
      <EmpanadaShape x={88} y={96} rot={16} />
      <circle cx={112} cy={52} r={13} fill="#f4efe5" stroke="#cdbf9f" strokeWidth="1" />
      <circle cx={112} cy={52} r={10} fill="#c8432a" />
      <Speckles cx={112} cy={52} rx={8} ry={8} n={14} color="#f3e0b0" min={0.8} max={1.4} seed={9} shape="flake" />
      <Speckles cx={112} cy={52} rx={8} ry={8} n={10} color="#5b8a32" min={0.8} max={1.4} seed={10} shape="flake" />
    </>
  )
}

function Tortilla() {
  const id = useArtId()
  const cx = 78
  const cy = 78
  const R = 38
  const pt = (a: number, r = R) => `${(cx + r * Math.cos((a * Math.PI) / 180)).toFixed(1)} ${(cy + r * Math.sin((a * Math.PI) / 180)).toFixed(1)}`
  return (
    <>
      <Plate />
      <defs>
        <Grad id={id('tor')} stops={['#f9dc85', '#e9b04b', '#b9772a']} />
        <linearGradient id={id('torin')} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#f9e9b4" /><stop offset="1" stopColor="#f1d27c" /></linearGradient>
      </defs>
      <path d={`M${cx} ${cy} L${pt(-25)} A${R} ${R} 0 1 1 ${pt(-65)} Z`} fill={url(id('tor'))} />
      <Speckles cx={cx} cy={cy + 4} rx={30} ry={26} n={22} color="#9a5718" min={1} max={2.6} seed={14} opacity={0.45} />
      <Gloss x={64} y={62} rx={14} ry={6} />
      <g transform="translate(9 -9)">
        <path d={`M${cx} ${cy} L${pt(-65)} A${R} ${R} 0 0 1 ${pt(-25)} Z`} fill={url(id('torin'))} />
        <path d={`M${pt(-65)} A${R} ${R} 0 0 1 ${pt(-25)}`} stroke="#c98a33" strokeWidth="3" fill="none" />
        {[[94, 52], [100, 60], [88, 60], [104, 70]].map(([x, y], i) => <ellipse key={i} cx={x} cy={y} rx="3.2" ry="2.2" fill="#fff5d6" stroke="#e8c87a" strokeWidth="0.6" />)}
        <path d="M86 70 C 92 66, 96 64, 102 64" stroke="#d9a75a" strokeWidth="0.8" fill="none" />
      </g>
      <Parsley cx={70} cy={88} rx={18} ry={12} seed={15} />
    </>
  )
}

function Ensalada() {
  const r = rand(77)
  return (
    <>
      <Plate />
      {Array.from({ length: 16 }, (_, i) => {
        const a = (i / 16) * 360 + r() * 18
        const d = 10 + r() * 22
        const x = 78 + Math.cos((a * Math.PI) / 180) * d
        const y = 78 + Math.sin((a * Math.PI) / 180) * d
        return <Leaf key={i} x={x} y={y} rot={a + 90 + r() * 40} s={0.9 + r() * 0.35} shade={i % 3} />
      })}
      {[[64, 66, 20], [92, 72, -30], [76, 94, 60], [86, 58, 10], [70, 82, -50]].map(([x, y, a], i) => (
        <path key={i} d="M-8 -3 C -3 -6, 5 -6, 9 -2 C 6 2, -2 4, -9 2 Z" transform={`translate(${x} ${y}) rotate(${a})`} fill="#f7ecc6" stroke="#ddc88d" strokeWidth="0.7" />
      ))}
      <Cherry x={100} y={90} r={7} half />
      <Cherry x={58} y={92} r={6.5} />
      <Cherry x={96} y={54} r={6} />
      <Lemon x={112} y={78} rot={-80} s={0.8} />
      <Speckles cx={78} cy={78} rx={34} ry={32} n={20} color="#2a2420" min={0.4} max={0.8} seed={8} />
    </>
  )
}

function Mollejas() {
  const id = useArtId()
  const pieces: [number, number, number, number][] = [[64, 64, 13, 10], [86, 60, 12, 9], [70, 86, 14, 10], [94, 82, 12, 10], [56, 78, 10, 8], [80, 100, 11, 8], [100, 98, 9, 7]]
  return (
    <>
      <Plate />
      {pieces.map(([x, y, rx, ry], i) => (
        <g key={i}>
          <ellipse cx={x + 1.5} cy={y + 2} rx={rx} ry={ry} fill="#3b2a1a" opacity="0.18" />
          <path d={`M${x - rx} ${y} C ${x - rx} ${y - ry * 1.2}, ${x + rx * 0.8} ${y - ry * 1.3}, ${x + rx} ${y - ry * 0.2} C ${x + rx * 1.1} ${y + ry}, ${x - rx * 0.4} ${y + ry * 1.2}, ${x - rx} ${y} Z`} fill={url(id('crumb'))} stroke="#9a5a1c" strokeOpacity="0.5" strokeWidth="0.8" />
          <Speckles cx={x} cy={y} rx={rx * 0.8} ry={ry * 0.8} n={9} color="#8f4f16" min={0.6} max={1.4} seed={i + 30} opacity={0.6} />
          <Gloss x={x - rx * 0.3} y={y - ry * 0.4} rx={rx * 0.4} ry={ry * 0.25} />
        </g>
      ))}
      <Lemon x={110} y={62} rot={-120} s={0.85} />
      <Speckles cx={80} cy={80} rx={34} ry={30} n={26} color="#ffffff" min={0.6} max={1.2} seed={44} shape="flake" />
      <Parsley cx={78} cy={80} rx={26} ry={22} seed={46} />
    </>
  )
}

// ------------------------------------------------------------------ pastas

function PastaDefs() {
  const id = useArtId()
  return (
    <defs>
      <Grad id={id('pasta')} stops={['#fdf0c4', '#f0cf7c', '#cf9f48']} />
      <Grad id={id('pastaG')} stops={['#e9f0c0', '#bfd07a', '#8fa64a']} />
    </defs>
  )
}

function Sorrentinos() {
  const id = useArtId()
  const pos: [number, number][] = [[64, 66], [92, 64], [78, 86], [56, 92], [100, 90]]
  return (
    <>
      <Plate />
      <PastaDefs />
      <Sauce cx={78} cy={80} r={40} seed={6} />
      {pos.map(([x, y], i) => (
        <g key={i}>
          <circle cx={x + 1.5} cy={y + 2} r={14} fill="#5a1a0c" opacity="0.25" />
          <circle cx={x} cy={y} r={14} fill={url(id('pasta'))} />
          <circle cx={x} cy={y} r={14} fill="none" stroke="#c99a46" strokeWidth="0.8" strokeDasharray="1.6 1.6" />
          <circle cx={x} cy={y} r={9.5} fill="#f7dc93" stroke="#d6aa55" strokeWidth="0.8" />
          <ellipse cx={x - 3} cy={y - 3.5} rx="4" ry="2.2" fill="#fff" opacity="0.65" transform={`rotate(-30 ${x - 3} ${y - 3.5})`} />
        </g>
      ))}
      <Basil x={86} y={78} rot={30} s={1.1} />
      <Basil x={70} y={76} rot={-40} />
      <Speckles cx={78} cy={78} rx={36} ry={34} n={40} color="#fff5d8" min={0.5} max={1.1} seed={17} />
    </>
  )
}

function Noquis() {
  const id = useArtId()
  const r = rand(91)
  const items = Array.from({ length: 15 }, () => {
    const a = r() * Math.PI * 2
    const d = Math.sqrt(r()) * 30
    return [78 + Math.cos(a) * d, 80 + Math.sin(a) * d, r() * 180] as const
  })
  return (
    <>
      <Plate />
      <PastaDefs />
      <Sauce cx={78} cy={80} r={40} seed={12} />
      {items.map(([x, y, a], i) => (
        <g key={i} transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${a.toFixed(0)})`}>
          <ellipse cx="1" cy="1.5" rx="9" ry="6" fill="#5a1a0c" opacity="0.25" />
          <ellipse rx="9" ry="6" fill={url(id('pasta'))} stroke="#c9963f" strokeWidth="0.6" />
          <path d="M-5 -4 Q -6 0 -5 4 M-1.5 -5 Q -2.5 0 -1.5 5 M2 -5 Q 1 0 2 5 M5.5 -4 Q 4.5 0 5.5 4" stroke="#d3a250" strokeWidth="0.8" fill="none" />
        </g>
      ))}
      <Basil x={96} y={66} rot={20} s={1.1} />
      <Speckles cx={78} cy={80} rx={34} ry={32} n={36} color="#fff5d8" min={0.5} max={1.1} seed={19} />
    </>
  )
}

function Ravioles() {
  const id = useArtId()
  const pos: [number, number, number][] = [[62, 64, -8], [88, 62, 10], [60, 90, 6], [86, 88, -12], [108, 76, 18], [74, 112, 0]]
  return (
    <>
      <Plate />
      <PastaDefs />
      <Sauce cx={80} cy={82} r={38} color="manteca" seed={23} />
      {pos.slice(0, 5).map(([x, y, a], i) => (
        <g key={i} transform={`translate(${x} ${y}) rotate(${a})`}>
          <rect x="-11" y="-11" width="24" height="24" rx="3" fill="#3b2a1a" opacity="0.18" />
          <rect x="-12" y="-12" width="24" height="24" rx="3" fill={url(id('pasta'))} stroke="#c9963f" strokeWidth="1.2" strokeDasharray="1.4 1.6" />
          <rect x="-7" y="-7" width="14" height="14" rx="5" fill={url(id('pastaG'))} opacity="0.75" />
          <ellipse cx="-3" cy="-4" rx="4" ry="2" fill="#fff" opacity="0.6" />
        </g>
      ))}
      {[[74, 76, -30], [98, 92, 40], [70, 102, 70]].map(([x, y, a], i) => (
        <path key={i} d="M0 -9 C 5 -6, 5 6, 0 9 C -5 6, -5 -6, 0 -9 Z" transform={`translate(${x} ${y}) rotate(${a})`} fill="#7f9a6a" stroke="#556f45" strokeWidth="0.6" />
      ))}
      <Speckles cx={80} cy={82} rx={34} ry={32} n={24} color="#2a2420" min={0.4} max={0.8} seed={25} />
    </>
  )
}

function Tallarines() {
  const r = rand(5)
  const noodles = Array.from({ length: 34 }, () => {
    const rr = 8 + r() * 28
    const a0 = r() * 360
    const len = 70 + r() * 120
    return { d: arc(78 + (r() - 0.5) * 6, 80 + (r() - 0.5) * 6, rr, a0, a0 + len) }
  })
  return (
    <>
      <Plate />
      <circle cx={80} cy={82} r={38} fill="#3b2a1a" opacity="0.16" />
      {noodles.map((n, i) => <path key={`o${i}`} d={n.d} stroke="#c99a45" strokeWidth="4.2" fill="none" strokeLinecap="round" />)}
      {noodles.map((n, i) => <path key={`i${i}`} d={n.d} stroke="#f6dd98" strokeWidth="2.6" fill="none" strokeLinecap="round" />)}
      <Sauce cx={80} cy={76} r={17} seed={31} />
      <Basil x={88} y={70} rot={35} s={1.2} />
      <Basil x={74} y={70} rot={-30} s={0.9} />
      <Speckles cx={80} cy={78} rx={20} ry={18} n={26} color="#fff5d8" min={0.5} max={1.1} seed={33} />
    </>
  )
}

function Lasagna() {
  const id = useArtId()
  return (
    <>
      <Plate />
      <defs>
        <Grad id={id('gratin')} stops={['#f7d27e', '#e3a243', '#b5672a']} />
      </defs>
      <ellipse cx={84} cy={102} rx={40} ry={8} fill="#3b2a1a" opacity="0.2" />
      {/* cara frontal con capas */}
      <path d="M40 72 L100 72 L100 104 L40 104 Z" fill="#f4dfae" />
      {[
        ['#b93a22', 76, 5],
        ['#f1d38a', 81, 3],
        ['#8a3b22', 84, 5],
        ['#faf2dc', 89, 3],
        ['#b93a22', 92, 4],
        ['#f1d38a', 96, 3],
        ['#8a3b22', 99, 5],
      ].map(([c, y, h], i) => <rect key={i} x="40" y={y as number} width="60" height={h as number} fill={c as string} />)}
      {/* cara lateral */}
      <path d="M100 72 L118 58 L118 90 L100 104 Z" fill="#c8892f" opacity="0.85" />
      {/* tapa gratinada */}
      <path d="M40 72 L58 58 L118 58 L100 72 Z" fill={url(id('gratin'))} />
      <Speckles cx={79} cy={65} rx={30} ry={5} n={20} color="#8f4510" min={0.8} max={2} seed={37} opacity={0.65} />
      <path d="M44 72 C 48 76, 52 74, 54 78 M86 72 C 88 77, 92 76, 94 80" stroke="#c23e24" strokeWidth="3" fill="none" strokeLinecap="round" />
      <Basil x={86} y={62} rot={10} />
      <Steam x={70} y={52} s={0.8} />
    </>
  )
}

function Canelones() {
  const id = useArtId()
  return (
    <>
      <Plate />
      <PastaDefs />
      {[52, 78, 104].map((x, i) => (
        <g key={i}>
          <rect x={x - 12 + 2} y={44 + 3} width="24" height="66" rx="12" fill="#3b2a1a" opacity="0.18" />
          <rect x={x - 12} y="44" width="24" height="66" rx="12" fill={url(id('pasta'))} />
          <path d={`M${x - 8} 50 C ${x - 4} 47, ${x + 4} 47, ${x + 8} 50`} stroke="#fff" strokeOpacity="0.6" strokeWidth="1.4" fill="none" />
        </g>
      ))}
      <path d="M36 70 C 50 62, 66 78, 80 70 C 94 62, 108 78, 124 68 L124 84 C 108 94, 94 78, 80 86 C 66 94, 50 80, 36 88 Z" fill="#c03a22" />
      <path d="M38 92 C 52 86, 66 100, 80 94 C 94 88, 108 100, 122 92" stroke="#fbf3df" strokeWidth="7" fill="none" strokeLinecap="round" />
      <Speckles cx={80} cy={84} rx={40} ry={16} n={26} color="#c9772a" min={0.8} max={2} seed={41} opacity={0.6} />
      <Parsley cx={80} cy={80} rx={36} ry={20} seed={43} />
    </>
  )
}

// ------------------------------------------------------------------ minutas y carnes

const CUTLET = 'M38 70 C 34 50, 54 36, 76 38 C 96 38, 112 48, 114 64 C 118 82, 104 100, 82 104 C 60 108, 42 96, 38 70 Z'

function Milanesa() {
  return (
    <>
      <Plate />
      <Breaded d={CUTLET} seed={51} cx={76} cy={70} rx={34} ry={30} />
      <Fries x={60} y={104} n={10} seed={7} spread={26} />
      <Lemon x={104} y={58} rot={-140} s={0.9} />
      <Steam x={70} y={40} s={0.7} />
    </>
  )
}

function Napolitana() {
  const id = useArtId()
  return (
    <>
      <Plate />
      <Breaded d={CUTLET} seed={53} cx={76} cy={70} rx={34} ry={30} />
      <defs><Grad id={id('ham')} stops={['#f7c2b8', '#e98e85', '#c66560']} /></defs>
      <path d="M48 70 C 46 56, 60 46, 76 47 C 92 47, 104 56, 104 68 C 106 82, 94 94, 78 95 C 62 96, 50 86, 48 70 Z" fill={url(id('ham'))} />
      <Sauce cx={76} cy={70} r={24} seed={55} />
      {[[66, 62, 9], [86, 64, 10], [74, 80, 11], [94, 80, 7], [60, 78, 7]].map(([x, y, r], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={r} fill="#fdf6e3" />
          <circle cx={x - r * 0.25} cy={y - r * 0.2} r={r * 0.45} fill="#ffffff" />
          <circle cx={x + r * 0.35} cy={y + r * 0.3} r={r * 0.22} fill="#d99a4a" opacity="0.7" />
        </g>
      ))}
      <Speckles cx={76} cy={70} rx={28} ry={24} n={30} color="#4e6f22" min={0.6} max={1.2} seed={57} shape="flake" />
      <Fries x={60} y={106} n={8} seed={9} spread={24} />
    </>
  )
}

function Suprema() {
  return (
    <>
      <Plate />
      <Breaded d="M40 84 C 36 62, 58 42, 84 42 C 104 44, 116 58, 112 74 C 108 92, 86 104, 64 104 C 50 104, 42 96, 40 84 Z" seed={61} cx={76} cy={74} rx={32} ry={26} />
      <Leaf x={106} y={98} rot={40} shade={0} />
      <Leaf x={98} y={106} rot={-20} shade={1} />
      <Leaf x={114} y={90} rot={80} shade={2} s={0.9} />
      <Cherry x={102} y={96} r={6} half />
      <Lemon x={60} y={48} rot={-170} s={0.85} />
    </>
  )
}

function Steak({ x, y, w, h, rot, seed }: { x: number; y: number; w: number; h: number; rot: number; seed: number }) {
  const id = useArtId()
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <rect x={-w / 2 + 3} y={-h / 2 + 4} width={w} height={h} rx={h * 0.45} fill="#3b2a1a" opacity="0.25" />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h * 0.45} fill={url(id('beef'))} />
      <path d={`M${-w / 2 + h * 0.3} ${-h / 2 + 2} H${w / 2 - h * 0.3}`} stroke={url(id('fat'))} strokeWidth="6" strokeLinecap="round" />
      {Array.from({ length: Math.round(w / 12) }, (_, i) => (
        <path key={i} d={`M${-w / 2 + 10 + i * 12} ${-h / 2 + 6} l10 ${h - 12}`} stroke="#2a110a" strokeOpacity="0.75" strokeWidth="2.6" strokeLinecap="round" />
      ))}
      <Speckles cx={0} cy={0} rx={w * 0.4} ry={h * 0.35} n={18} color="#ffffff" min={0.4} max={0.9} seed={seed} shape="flake" opacity={0.8} />
      <ellipse cx={-w * 0.2} cy={-h * 0.15} rx={w * 0.16} ry={h * 0.12} fill="#ffffff" opacity="0.18" />
    </g>
  )
}

function BeefDefs() {
  const id = useArtId()
  return (
    <defs>
      <Grad id={id('beef')} stops={['#9a4a2b', '#6a2c17', '#41190c']} />
      <linearGradient id={id('fat')} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#efd2ab" /><stop offset="1" stopColor="#d1a172" /></linearGradient>
    </defs>
  )
}

/** Cazuelita de barro con chimichurri. */
function Chimi({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <circle cx={x + 1.5} cy={y + 2} r="13" fill="#3b2a1a" opacity="0.2" />
      <circle cx={x} cy={y} r="13" fill="#b9673a" />
      <circle cx={x} cy={y} r="10.5" fill="#8d4524" />
      <Sauce cx={x} cy={y} r={9} color="chimi" seed={x} />
      <Speckles cx={x} cy={y} rx={7} ry={7} n={12} color="#e2533a" min={0.6} max={1.1} seed={y} />
      <Speckles cx={x} cy={y} rx={7} ry={7} n={10} color="#c9e08c" min={0.5} max={1} seed={y + 3} shape="flake" />
      <path d={arc(x, y, 12, 200, 250)} stroke="#e7a77b" strokeWidth="1.4" fill="none" strokeLinecap="round" />
    </g>
  )
}

function Bife() {
  return (
    <>
      <Plate />
      <BeefDefs />
      <Steak x={74} y={78} w={70} h={48} rot={-12} seed={63} />
      <Chimi x={110} y={102} />
      <Rosemary x={112} y={60} rot={30} s={0.9} />
    </>
  )
}

function Asado() {
  return (
    <>
      <Plate />
      <BeefDefs />
      {[[78, 58], [78, 80], [78, 102]].map(([x, y], i) => (
        <g key={i}>
          <Steak x={x} y={y} w={84} h={18} rot={-10} seed={70 + i} />
          {[-24, 2, 28].map((dx, j) => {
            const bx = x + dx * Math.cos((-10 * Math.PI) / 180)
            const by = y + dx * Math.sin((-10 * Math.PI) / 180)
            return (
              <g key={j}>
                <path d={`M${bx - 3} ${by - 8} C ${bx - 4} ${by - 2}, ${bx - 3} ${by + 4}, ${bx - 1} ${by + 7} C ${bx + 2} ${by + 7}, ${bx + 3} ${by + 1}, ${bx + 2.5} ${by - 8} Z`} fill="#e6d6b8" opacity="0.92" transform={`rotate(-10 ${bx} ${by})`} />
                <path d={`M${bx - 2} ${by - 6} C ${bx - 2.6} ${by - 1}, ${bx - 2} ${by + 3}, ${bx - 0.8} ${by + 5}`} stroke="#fffaf0" strokeWidth="0.9" fill="none" opacity="0.8" transform={`rotate(-10 ${bx} ${by})`} />
              </g>
            )
          })}
        </g>
      ))}
      <Chimi x={114} y={110} />
    </>
  )
}

function Pollo() {
  const id = useArtId()
  return (
    <>
      <Plate />
      <defs><Grad id={id('skin')} stops={['#f6c06e', '#d4842f', '#94501a']} /></defs>
      {/* muslo */}
      <path d="M40 76 C 36 56, 56 42, 76 44 C 96 46, 106 60, 102 76 C 98 92, 80 102, 62 100 C 50 98, 42 90, 40 76 Z" fill={url(id('skin'))} />
      {/* pata */}
      <path d="M92 84 C 102 84, 112 90, 116 98 C 118 104, 114 108, 108 106 C 102 104, 96 98, 88 96 Z" fill={url(id('skin'))} />
      <path d="M110 104 C 113 108, 120 109, 122 104 C 124 100, 120 97, 117 99" fill="#f6ecd8" stroke="#d9c8a6" strokeWidth="0.8" />
      <Speckles cx={70} cy={70} rx={26} ry={22} n={34} color="#8a4614" min={0.6} max={1.6} seed={81} opacity={0.55} />
      <Gloss x={60} y={58} rx={15} ry={6} />
      <path d="M52 62 C 60 54, 74 52, 84 56" stroke="#ffe6b8" strokeOpacity="0.8" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      {[[48, 110, 20], [64, 114, -10], [34, 96, 60], [96, 56, -40], [80, 112, 30]].map(([x, y, a], i) => (
        <g key={i} transform={`translate(${x} ${y}) rotate(${a})`}>
          <path d="M-9 4 C -9 -6, 9 -8, 10 3 C 6 7, -5 8, -9 4 Z" fill={url(id('crumb'))} stroke="#a8662a" strokeWidth="0.6" />
          <ellipse cx="-2" cy="-1" rx="3.5" ry="1.6" fill="#fff" opacity="0.5" />
        </g>
      ))}
      <Rosemary x={34} y={62} rot={-20} s={0.85} />
      {[[112, 70], [116, 80]].map(([x, y], i) => <path key={i} d={`M${x} ${y - 5} C ${x + 5} ${y - 3}, ${x + 5} ${y + 4}, ${x} ${y + 5} C ${x - 4} ${y + 3}, ${x - 4} ${y - 3}, ${x} ${y - 5} Z`} fill="#f8f1df" stroke="#e1d4b8" strokeWidth="0.7" />)}
    </>
  )
}

function Matambre() {
  const id = useArtId()
  return (
    <>
      <Plate />
      <defs><Grad id={id('mat')} stops={['#a8563a', '#7d3a22', '#552213']} /></defs>
      <path d="M36 62 C 40 48, 64 44, 82 46 C 104 48, 120 56, 120 72 C 120 92, 104 108, 80 108 C 56 108, 34 96, 36 62 Z" fill={url(id('mat'))} />
      <Sauce cx={78} cy={76} r={32} seed={85} />
      {[[62, 66, 12, 9], [92, 70, 13, 10], [74, 92, 14, 9], [100, 92, 9, 7]].map(([x, y, rx, ry], i) => (
        <ellipse key={i} cx={x} cy={y} rx={rx} ry={ry} fill="#f2b0a6" stroke="#d98a80" strokeWidth="0.8" />
      ))}
      {[[70, 74, 10], [86, 84, 12], [58, 86, 8], [96, 60, 8]].map(([x, y, r], i) => (
        <g key={i}><circle cx={x} cy={y} r={r} fill="#fdf6e3" /><circle cx={x + r * 0.3} cy={y + r * 0.25} r={r * 0.25} fill="#d99a4a" opacity="0.7" /></g>
      ))}
      {[[64, 98], [104, 78], [82, 60]].map(([x, y], i) => (
        <g key={i}><circle cx={x} cy={y} r="4.2" fill="#5f7a2a" /><circle cx={x} cy={y} r="1.6" fill="#d9452a" /></g>
      ))}
      <Speckles cx={78} cy={78} rx={32} ry={26} n={26} color="#4e6f22" min={0.6} max={1.2} seed={87} shape="flake" />
    </>
  )
}

function Gramajo() {
  const id = useArtId()
  const r = rand(95)
  return (
    <>
      <Plate />
      <defs><Grad id={id('egg')} stops={['#fff1b0', '#f7d35e', '#e3aa2c']} /></defs>
      {Array.from({ length: 16 }, (_, i) => {
        const a = r() * Math.PI * 2
        const d = Math.sqrt(r()) * 30
        const x = 78 + Math.cos(a) * d
        const y = 80 + Math.sin(a) * d
        const s = 7 + r() * 6
        return <path key={i} d={`M${x - s} ${y} C ${x - s} ${y - s}, ${x + s} ${y - s * 1.1}, ${x + s} ${y} C ${x + s * 0.8} ${y + s}, ${x - s * 0.6} ${y + s * 0.9}, ${x - s} ${y} Z`} fill={url(id('egg'))} />
      })}
      <Fries x={78} y={80} n={12} seed={13} spread={56} />
      {Array.from({ length: 9 }, (_, i) => {
        const a = r() * Math.PI * 2
        const d = Math.sqrt(r()) * 28
        return <rect key={i} x={78 + Math.cos(a) * d} y={80 + Math.sin(a) * d} width="6" height="5" rx="1" fill="#ec9c93" transform={`rotate(${(r() * 90).toFixed(0)} ${78 + Math.cos(a) * d} ${80 + Math.sin(a) * d})`} />
      })}
      <Parsley cx={78} cy={80} rx={30} ry={28} seed={97} />
    </>
  )
}

// ------------------------------------------------------------------ pescados

function Merluza() {
  return (
    <>
      <Plate />
      <Breaded d="M30 82 C 40 62, 70 54, 96 60 C 108 62, 116 66, 122 60 C 124 70, 124 82, 122 92 C 116 86, 108 90, 96 94 C 70 102, 42 98, 30 82 Z" seed={101} cx={76} cy={78} rx={40} ry={16} />
      <Lemon x={58} y={56} rot={-160} s={0.9} />
      <Leaf x={100} y={108} rot={30} shade={1} s={0.9} />
      <Leaf x={88} y={112} rot={-30} shade={0} s={0.8} />
      <Parsley cx={76} cy={78} rx={30} ry={12} seed={103} />
    </>
  )
}

function Salmon() {
  const id = useArtId()
  return (
    <>
      <Plate />
      <defs><Grad id={id('sal')} stops={['#ffb08a', '#f07b55', '#c9553a']} /></defs>
      <path d="M42 62 C 52 50, 92 48, 108 58 C 116 64, 116 82, 106 90 C 90 100, 54 100, 44 88 C 36 80, 36 70, 42 62 Z" fill={url(id('sal'))} />
      {[0, 1, 2, 3, 4, 5].map((i) => <path key={i} d={`M${50 + i * 10} 54 C ${44 + i * 10} 66, ${46 + i * 10} 82, ${54 + i * 10} 96`} stroke="#ffe3d3" strokeOpacity="0.75" strokeWidth="1.4" fill="none" />)}
      {[0, 1, 2, 3].map((i) => <path key={i} d={`M${54 + i * 14} 58 l10 30`} stroke="#7a3320" strokeOpacity="0.55" strokeWidth="2.4" strokeLinecap="round" />)}
      <Gloss x={62} y={60} rx={14} ry={5} />
      {[[54, 108], [70, 112], [86, 112]].map(([x, y], i) => (
        <g key={i}><circle cx={x} cy={y} r="7" fill="#5f8f3e" /><circle cx={x} cy={y} r="5" fill="#dfe9b8" /><circle cx={x} cy={y} r="1.6" fill="#a6bf6a" /></g>
      ))}
      {[[104, 104, 30], [112, 96, 60]].map(([x, y, a], i) => <rect key={i} x={x} y={y} width="16" height="4" rx="2" fill="#f08c2e" transform={`rotate(${a} ${x} ${y})`} />)}
      <Cherry x={100} y={50} r={6} />
      <path d="M30 80 c4 -4 4 -10 2 -14 M32 70 l4 -2 M31 75 l-4 -1" stroke="#5f8f3e" strokeWidth="1.2" fill="none" strokeLinecap="round" />
    </>
  )
}

// ------------------------------------------------------------------ postres

function Flan() {
  // vista de tres cuartos: el flan se reconoce por su perfil (tronco de cono con caramelo que chorrea)
  const id = useArtId()
  return (
    <>
      <defs>
        <radialGradient id={id('dplate')} cx="42%" cy="35%" r="70%"><stop offset="0" stopColor="#ffffff" /><stop offset="0.8" stopColor="#f3eee4" /><stop offset="1" stopColor="#d9cfbb" /></radialGradient>
        <linearGradient id={id('custard')} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#e9b14c" /><stop offset="0.35" stopColor="#f8d98a" /><stop offset="0.75" stopColor="#efc160" /><stop offset="1" stopColor="#c98a2c" /></linearGradient>
        <radialGradient id={id('caramel')} cx="40%" cy="35%" r="70%"><stop offset="0" stopColor="#d7802f" /><stop offset="0.7" stopColor="#a5501a" /><stop offset="1" stopColor="#6f300c" /></radialGradient>
        <Grad id={id('ddl')} stops={['#c88446', '#94531f', '#5f300f']} />
      </defs>
      {/* plato de postre en perspectiva */}
      <ellipse cx="84" cy="108" rx="68" ry="34" fill="#3b2a1a" opacity="0.18" />
      <ellipse cx="80" cy="102" rx="68" ry="33" fill={url(id('dplate'))} stroke="#d9cfbb" />
      <ellipse cx="80" cy="102" rx="50" ry="23" fill="none" stroke="#e8dfcf" strokeWidth="1.4" />
      <ellipse cx="80" cy="102" rx="60" ry="28" fill="none" stroke="#c9764f" strokeWidth="1" strokeDasharray="1.5 4" opacity="0.7" />
      {/* caramelo en el plato */}
      <ellipse cx="80" cy="104" rx="42" ry="15" fill={url(id('caramel'))} opacity="0.92" />
      {/* cuerpo del flan */}
      <path d="M46 101 C 46 108, 114 108, 114 101 L106 58 C 106 52, 54 52, 54 58 Z" fill={url(id('custard'))} />
      <path d="M60 64 C 60 78, 58 92, 56 102" stroke="#fff3cf" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.7" />
      {/* tapa de caramelo con chorreado */}
      <ellipse cx="80" cy="58" rx="26" ry="8" fill={url(id('caramel'))} />
      <path d="M56 59 C 56 66, 60 70, 61 76 C 62 80, 66 80, 66 75 C 66 70, 68 66, 72 65 C 74 72, 76 74, 79 73 C 82 72, 82 66, 86 65 C 89 70, 92 82, 96 80 C 99 78, 98 70, 104 60 Z" fill={url(id('caramel'))} />
      <ellipse cx="72" cy="56" rx="9" ry="2.6" fill="#ffd9a8" opacity="0.7" />
      {/* dulce de leche y crema */}
      <ellipse cx="124" cy="100" rx="13" ry="7" fill={url(id('ddl'))} transform="rotate(-12 124 100)" />
      <path d="M116 97 C 120 94, 127 94, 131 97" stroke="#fff" strokeOpacity="0.55" strokeWidth="1.3" fill="none" />
      <g transform="translate(34 98)">
        <ellipse cx="0" cy="4" rx="11" ry="4.5" fill="#3b2a1a" opacity="0.12" />
        <path d="M-10 2 C -10 -6, 10 -6, 10 2 C 6 -2, 2 -9, 0 -13 C -2 -9, -6 -2, -10 2 Z" fill="#fffdf6" stroke="#e7dfcf" />
        <path d="M-5 0 C -3 -5, 3 -5, 5 0" stroke="#e7dfcf" strokeWidth="1" fill="none" />
      </g>
      <Basil x={96} y={50} rot={40} s={0.6} />
    </>
  )
}

function Tiramisu() {
  const id = useArtId()
  return (
    <>
      <Plate tone="dessert" />
      <defs><Grad id={id('cocoa')} stops={['#8a5233', '#5e341f', '#3e2112']} /></defs>
      <g transform="rotate(8 78 78)">
        <rect x="52" y="54" width="54" height="50" rx="4" fill="#3b2a1a" opacity="0.2" transform="translate(3 4)" />
        <rect x="52" y="54" width="54" height="50" rx="4" fill="#f6ecd2" />
        <rect x="55" y="57" width="48" height="44" rx="3" fill={url(id('cocoa'))} />
        <Speckles cx={79} cy={79} rx={22} ry={20} n={60} color="#2a160b" min={0.4} max={1} seed={121} />
        <Speckles cx={79} cy={79} rx={22} ry={20} n={30} color="#b27a52" min={0.4} max={0.9} seed={122} />
      </g>
      <ellipse cx={86} cy={70} rx="5" ry="3.4" fill="#4a2513" transform="rotate(-30 86 70)" />
      <path d="M83 71 C 85 69, 88 69, 89 70" stroke="#2a130a" strokeWidth="0.9" fill="none" />
      <Leaf x={70} y={68} rot={-40} s={0.45} shade={2} />
      <Speckles cx={78} cy={80} rx={44} ry={40} n={30} color="#5e341f" min={0.4} max={0.9} seed={124} opacity={0.6} />
    </>
  )
}

function Vigilante() {
  const id = useArtId()
  return (
    <>
      <Plate tone="dessert" />
      <defs><linearGradient id={id('bat')} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#b2443c" /><stop offset="1" stopColor="#6a1f1c" /></linearGradient></defs>
      <rect x="44" y="52" width="40" height="52" rx="5" fill="#3b2a1a" opacity="0.18" transform="translate(3 4)" />
      <rect x="44" y="52" width="40" height="52" rx="5" fill="#fbf7ea" stroke="#e5dcc4" strokeWidth="1" />
      {[[54, 64], [70, 78], [58, 92], [74, 60]].map(([x, y], i) => <ellipse key={i} cx={x} cy={y} rx="2.6" ry="1.8" fill="#efe6cd" />)}
      <rect x="78" y="58" width="38" height="48" rx="5" fill="#3b2a1a" opacity="0.2" transform="translate(3 4)" />
      <rect x="78" y="58" width="38" height="48" rx="5" fill={url(id('bat'))} />
      <path d="M84 64 L100 64" stroke="#ffffff" strokeOpacity="0.45" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M84 70 L92 70" stroke="#ffffff" strokeOpacity="0.25" strokeWidth="1.6" strokeLinecap="round" />
    </>
  )
}

function Panqueque() {
  const id = useArtId()
  return (
    <>
      <Plate tone="dessert" />
      <defs>
        <linearGradient id={id('crepe')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f6d495" /><stop offset="0.5" stopColor="#e3a85a" /><stop offset="1" stopColor="#b8743a" /></linearGradient>
        <Grad id={id('ddl2')} stops={['#c88446', '#94531f', '#5f300f']} />
      </defs>
      <ellipse cx={112} cy={96} rx="12" ry="9" fill={url(id('ddl2'))} />
      <ellipse cx={44} cy={62} rx="10" ry="8" fill={url(id('ddl2'))} />
      <g transform="rotate(28 78 78)">
        <rect x="32" y="64" width="94" height="30" rx="15" fill="#3b2a1a" opacity="0.2" transform="translate(2 4)" />
        <rect x="32" y="64" width="94" height="30" rx="15" fill={url(id('crepe'))} />
        <Speckles cx={79} cy={76} rx={40} ry={8} n={26} color="#a35d24" min={0.8} max={2.2} seed={131} opacity={0.5} />
        <path d="M40 70 H118" stroke="#fff6dc" strokeOpacity="0.8" strokeWidth="3" strokeLinecap="round" />
        <ellipse cx="38" cy="79" rx="6" ry="14" fill="#f2c786" stroke="#c98a45" strokeWidth="1" />
        <path d="M38 69 C 34 74, 34 84, 38 89 C 40 84, 40 74, 38 69" stroke="#a8662a" strokeWidth="0.9" fill="none" />
      </g>
      <circle cx={97} cy={56} r={9} fill="#3b2a1a" opacity="0.15" />
      <circle cx={96} cy={54} r={9} fill="#fffdf7" />
      <path d={`${arc(96, 54, 6.5, 0, 300)} ${arc(96, 54, 3.5, 300, 620).replace('M', 'L')}`} stroke="#e6dccb" strokeWidth="1.3" fill="none" />
      <Speckles cx={78} cy={78} rx={30} ry={26} n={24} color="#ffffff" min={0.5} max={1} seed={133} />
    </>
  )
}

// ------------------------------------------------------------------ bebidas (vista lateral)

function GlassDefs() {
  const id = useArtId()
  return (
    <defs>
      <linearGradient id={id('glass')} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#ffffff" stopOpacity="0.55" />
        <stop offset="0.25" stopColor="#ffffff" stopOpacity="0.15" />
        <stop offset="0.8" stopColor="#ffffff" stopOpacity="0.05" />
        <stop offset="1" stopColor="#ffffff" stopOpacity="0.45" />
      </linearGradient>
    </defs>
  )
}

function Agua() {
  const id = useArtId()
  return (
    <>
      <Shadow cx={84} cy={136} rx={52} ry={10} o={0.25} />
      <GlassDefs />
      <defs>
        <linearGradient id={id('bottle')} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#a9d3cf" /><stop offset="0.5" stopColor="#d9efea" /><stop offset="1" stopColor="#8fbfb9" /></linearGradient>
        <linearGradient id={id('water')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#d6eef0" /><stop offset="1" stopColor="#a7d4d8" /></linearGradient>
      </defs>
      <path d="M52 24 H66 V38 C 66 46, 78 50, 78 62 V128 C 78 134, 74 136, 68 136 H50 C 44 136, 40 134, 40 128 V62 C 40 50, 52 46, 52 38 Z" fill={url(id('bottle'))} stroke="#7aa8a2" strokeWidth="1" />
      <rect x="50" y="18" width="18" height="8" rx="2" fill="#355443" />
      <rect x="40" y="78" width="38" height="28" fill="#f7f3ea" />
      <rect x="40" y="84" width="38" height="2" fill="#355443" opacity="0.7" />
      <rect x="40" y="98" width="38" height="2" fill="#355443" opacity="0.7" />
      <path d="M45 66 V124" stroke="#ffffff" strokeOpacity="0.7" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M92 76 H128 L124 134 H96 Z" fill={url(id('glass'))} stroke="#b8c6c9" strokeWidth="1.2" />
      <path d="M94 90 H126 L123.5 132 H96.5 Z" fill={url(id('water'))} opacity="0.85" />
      {[[102, 120], [110, 108], [116, 124], [106, 98], [118, 102]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="1.4" fill="none" stroke="#ffffff" strokeOpacity="0.9" strokeWidth="0.8" />)}
      <path d="M97 84 L99 128" stroke="#ffffff" strokeOpacity="0.8" strokeWidth="2" strokeLinecap="round" />
    </>
  )
}

function Gaseosa() {
  const id = useArtId()
  return (
    <>
      <Shadow cx={82} cy={138} rx={40} ry={9} o={0.25} />
      <GlassDefs />
      <defs><linearGradient id={id('cola')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#6b3418" /><stop offset="1" stopColor="#2a0f05" /></linearGradient></defs>
      <path d="M50 40 H110 L102 136 H58 Z" fill={url(id('glass'))} stroke="#b8c6c9" strokeWidth="1.2" />
      <path d="M53 58 H107 L100.5 133 H59.5 Z" fill={url(id('cola'))} />
      {[[62, 62, 8], [80, 60, -10], [94, 66, 14]].map(([x, y, a], i) => (
        <rect key={i} x={x} y={y} width="16" height="14" rx="3" fill="#ffffff" fillOpacity="0.55" stroke="#ffffff" strokeOpacity="0.8" transform={`rotate(${a} ${x} ${y})`} />
      ))}
      {Array.from({ length: 12 }, (_, i) => <circle key={i} cx={64 + ((i * 37) % 36)} cy={84 + ((i * 53) % 44)} r={0.8 + (i % 3) * 0.4} fill="#e9b07a" opacity="0.7" />)}
      <path d="M92 20 L84 112" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" />
      <path d="M92 20 L84 112" stroke="#a44431" strokeWidth="5" strokeDasharray="5 5" strokeLinecap="round" />
      <path d="M58 50 L64 126" stroke="#ffffff" strokeOpacity="0.6" strokeWidth="2" strokeLinecap="round" />
      <Lemon x={54} y={40} rot={-30} s={0.9} />
    </>
  )
}

function Vino() {
  const id = useArtId()
  return (
    <>
      <Shadow cx={86} cy={138} rx={54} ry={9} o={0.25} />
      <GlassDefs />
      <defs>
        <linearGradient id={id('vbottle')} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#1f2a1c" /><stop offset="0.45" stopColor="#3f5236" /><stop offset="1" stopColor="#141c12" /></linearGradient>
        <radialGradient id={id('wine')} cx="40%" cy="30%" r="80%"><stop offset="0" stopColor="#9c2240" /><stop offset="1" stopColor="#4a0d1e" /></radialGradient>
      </defs>
      <path d="M40 22 H52 V40 C 52 48, 62 52, 62 64 V130 C 62 134, 60 136, 56 136 H36 C 32 136, 30 134, 30 130 V64 C 30 52, 40 48, 40 40 Z" fill={url(id('vbottle'))} />
      <rect x="39" y="16" width="14" height="10" rx="2" fill="#a44431" />
      <rect x="30" y="80" width="32" height="34" fill="#f5efe1" />
      <text x="46" y="96" textAnchor="middle" fontFamily="Georgia, serif" fontSize="7" fontStyle="italic" fill="#355443">Casa</text>
      <path d="M34 103 H58" stroke="#a44431" strokeWidth="0.8" />
      <path d="M34 66 V126" stroke="#ffffff" strokeOpacity="0.35" strokeWidth="2" strokeLinecap="round" />
      <path d="M82 48 C 82 76, 92 90, 104 90 C 116 90, 126 76, 126 48 Z" fill={url(id('glass'))} stroke="#b8c6c9" strokeWidth="1.2" />
      <path d="M83.5 64 C 85 80, 94 88, 104 88 C 114 88, 123 80, 124.5 64 Z" fill={url(id('wine'))} />
      <ellipse cx="104" cy="64" rx="20.5" ry="3" fill="#b9314f" />
      <path d="M104 90 V128" stroke="#c9d4d6" strokeWidth="2.6" />
      <ellipse cx="104" cy="131" rx="16" ry="4" fill="#e6eef0" stroke="#b8c6c9" strokeWidth="1" />
      <path d="M88 54 C 88 66, 92 76, 96 80" stroke="#ffffff" strokeOpacity="0.75" strokeWidth="2" fill="none" strokeLinecap="round" />
    </>
  )
}

export const MC_ART: Record<string, ComponentType> = {
  'MC-01': Provoleta,
  'MC-02': Empanadas,
  'MC-03': Tortilla,
  'MC-04': Ensalada,
  'MC-05': Mollejas,
  'MC-06': Sorrentinos,
  'MC-07': Noquis,
  'MC-08': Ravioles,
  'MC-09': Tallarines,
  'MC-10': Lasagna,
  'MC-11': Canelones,
  'MC-12': Milanesa,
  'MC-13': Napolitana,
  'MC-14': Suprema,
  'MC-15': Bife,
  'MC-16': Asado,
  'MC-17': Pollo,
  'MC-18': Matambre,
  'MC-19': Gramajo,
  'MC-20': Merluza,
  'MC-21': Salmon,
  'MC-22': Flan,
  'MC-23': Tiramisu,
  'MC-24': Vigilante,
  'MC-25': Panqueque,
  'MC-26': Agua,
  'MC-27': Gaseosa,
  'MC-28': Vino,
}

export { Board, Breaded, Gloss, Rosemary }
