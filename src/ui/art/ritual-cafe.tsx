import type { ComponentType, ReactNode } from 'react'
import { arc, Plate, rand, Shadow, Speckles, url, useArtId } from './kit'

// Ilustraciones de Ritual Café: tazas de gres vistas desde arriba (latte art), métodos de filtrado de perfil y vitrina.

function CafeDefs() {
  const id = useArtId()
  return (
    <defs>
      <radialGradient id={id('saucer')} cx="40%" cy="36%" r="66%">
        <stop offset="0" stopColor="#f6eee0" />
        <stop offset="0.75" stopColor="#e6d6bc" />
        <stop offset="1" stopColor="#c8ad86" />
      </radialGradient>
      <radialGradient id={id('cupwall')} cx="40%" cy="36%" r="70%">
        <stop offset="0" stopColor="#fbf7f0" />
        <stop offset="0.8" stopColor="#ece2d2" />
        <stop offset="1" stopColor="#cbb89a" />
      </radialGradient>
      <radialGradient id={id('crema')} cx="45%" cy="42%" r="62%">
        <stop offset="0" stopColor="#d9a46c" />
        <stop offset="0.55" stopColor="#b5733c" />
        <stop offset="0.9" stopColor="#7d4420" />
        <stop offset="1" stopColor="#5a2e14" />
      </radialGradient>
      <radialGradient id={id('milk')} cx="40%" cy="35%" r="70%">
        <stop offset="0" stopColor="#fffaf0" />
        <stop offset="1" stopColor="#f1e3c9" />
      </radialGradient>
      <linearGradient id={id('glassV')} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#ffffff" stopOpacity="0.6" />
        <stop offset="0.3" stopColor="#ffffff" stopOpacity="0.12" />
        <stop offset="0.8" stopColor="#ffffff" stopOpacity="0.06" />
        <stop offset="1" stopColor="#ffffff" stopOpacity="0.5" />
      </linearGradient>
      <linearGradient id={id('brew')} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#7a4122" />
        <stop offset="1" stopColor="#2a1208" />
      </linearGradient>
    </defs>
  )
}

/** Taza de gres con plato, vista cenital. `children` se dibuja dentro del líquido (centro 0,0). */
function CupTop({ r = 34, cx = 74, cy = 80, children, spoon = true, glass = false }: { r?: number; cx?: number; cy?: number; children?: ReactNode; spoon?: boolean; glass?: boolean }) {
  const id = useArtId()
  return (
    <g>
      <Shadow cx={cx + 6} cy={cy + 7} rx={r + 26} ry={r + 24} o={0.24} />
      <circle cx={cx} cy={cy} r={r + 22} fill={url(id('saucer'))} />
      <circle cx={cx} cy={cy} r={r + 12} fill="none" stroke="#b39a74" strokeOpacity="0.45" strokeWidth="1.4" />
      {Array.from({ length: 18 }, (_, i) => {
        const rr = rand(i + r)
        const a = rr() * Math.PI * 2
        const d = r + 14 + rr() * 6
        return <circle key={i} cx={cx + Math.cos(a) * d} cy={cy + Math.sin(a) * d} r={0.6 + rr() * 0.6} fill="#7d5d3c" opacity="0.3" />
      })}
      {spoon && (
        <g transform={`translate(${cx + r + 8} ${cy + r - 4}) rotate(48)`}>
          <ellipse cx="0" cy="0" rx="5" ry="7.5" fill="#d9dcd8" stroke="#a9aea8" strokeWidth="0.8" />
          <rect x="-1.6" y="6" width="3.2" height="24" rx="1.6" fill="#cfd3cf" stroke="#a9aea8" strokeWidth="0.6" />
          <ellipse cx="-1.4" cy="-2" rx="1.6" ry="3" fill="#ffffff" opacity="0.8" />
        </g>
      )}
      <rect x={cx + r - 2} y={cy - 7} width="24" height="14" rx="7" fill={url(id('cupwall'))} stroke="#bfa985" strokeWidth="0.8" />
      <rect x={cx + r + 6} y={cy - 3} width="10" height="6" rx="3" fill="#e5d7c0" />
      <circle cx={cx} cy={cy} r={r + 6} fill={glass ? url(id('glassV')) : url(id('cupwall'))} stroke={glass ? '#b8c6c9' : '#bfa985'} strokeWidth="1" />
      <circle cx={cx} cy={cy} r={r} fill={url(id('crema'))} />
      <g transform={`translate(${cx} ${cy})`}>{children}</g>
      <path d={arc(cx, cy, r + 3, 200, 255)} stroke="#ffffff" strokeOpacity="0.9" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#4a250f" strokeOpacity="0.35" strokeWidth="1.2" />
    </g>
  )
}

/** Crema atigrada del espresso. */
function Tiger({ r, seed }: { r: number; seed: number }) {
  const rr = rand(seed)
  return (
    <g>
      {Array.from({ length: 9 }, (_, i) => {
        const a0 = rr() * 360
        const rad = r * (0.25 + rr() * 0.6)
        return <path key={i} d={arc(0, 0, rad, a0, a0 + 40 + rr() * 60)} stroke="#6b3518" strokeOpacity="0.45" strokeWidth={1 + rr() * 1.2} fill="none" strokeLinecap="round" />
      })}
      <Speckles cx={0} cy={0} rx={r * 0.8} ry={r * 0.8} n={20} color="#f1c38c" min={0.4} max={0.9} seed={seed + 1} opacity={0.8} />
      <ellipse cx={-r * 0.3} cy={-r * 0.35} rx={r * 0.25} ry={r * 0.12} fill="#ffffff" opacity="0.25" transform="rotate(-30)" />
    </g>
  )
}

function Tulip({ s = 1 }: { s?: number }) {
  const id = useArtId()
  const blob = (y: number, w: number) => `M${-w} ${y} C ${-w} ${y - w * 0.8}, ${w} ${y - w * 0.8}, ${w} ${y} C ${w * 0.7} ${y + w * 0.45}, ${-w * 0.7} ${y + w * 0.45}, ${-w} ${y} Z`
  return (
    <g transform={`scale(${s})`}>
      <path d={blob(16, 16)} fill={url(id('milk'))} />
      <path d={blob(6, 12.5)} fill={url(id('milk'))} stroke="#c58a52" strokeOpacity="0.5" strokeWidth="0.8" />
      <path d={blob(-4, 9.5)} fill={url(id('milk'))} stroke="#c58a52" strokeOpacity="0.5" strokeWidth="0.8" />
      <path d="M0 -16 C -6 -16, -7 -9, 0 -6 C 7 -9, 6 -16, 0 -16 Z" fill={url(id('milk'))} stroke="#c58a52" strokeOpacity="0.5" strokeWidth="0.8" />
      <path d="M0 -18 V22" stroke="#b07440" strokeWidth="1" />
    </g>
  )
}

function Heart({ s = 1 }: { s?: number }) {
  const id = useArtId()
  return (
    <g transform={`scale(${s})`}>
      <path d="M0 18 C -26 2, -24 -18, -9 -18 C -3 -18, 0 -14, 0 -10 C 0 -14, 3 -18, 9 -18 C 24 -18, 26 2, 0 18 Z" fill={url(id('milk'))} />
      <path d="M0 -10 V16" stroke="#b07440" strokeWidth="1" />
    </g>
  )
}

function Rosetta({ s = 1 }: { s?: number }) {
  return (
    <g transform={`scale(${s})`}>
      {Array.from({ length: 8 }, (_, i) => {
        const y = 18 - i * 4.6
        const w = 17 - i * 1.7
        return <path key={i} d={`M${-w} ${y} Q 0 ${y - 8} ${w} ${y}`} stroke="#fff6e6" strokeWidth="3.4" fill="none" strokeLinecap="round" />
      })}
      <circle cx="0" cy="-20" r="3.2" fill="#fff6e6" />
      <path d="M0 -22 V22" stroke="#b07440" strokeWidth="1" />
    </g>
  )
}

function Espresso() {
  return (
    <>
      <CafeDefs />
      <CupTop r={22} cx={74} cy={80}>
        <Tiger r={22} seed={3} />
      </CupTop>
    </>
  )
}
function Doble() {
  return (
    <>
      <CafeDefs />
      <CupTop r={28} cx={74} cy={80}>
        <Tiger r={28} seed={8} />
        <circle r="10" fill="#e3b07a" opacity="0.5" />
      </CupTop>
    </>
  )
}
function Cortado() {
  const id = useArtId()
  return (
    <>
      <CafeDefs />
      <CupTop r={24} cx={74} cy={80} glass>
        <Tiger r={24} seed={12} />
        <path d="M0 9 C -12 1, -11 -8, -4.5 -8 C -2 -8, 0 -6.5, 0 -4.5 C 0 -6.5, 2 -8, 4.5 -8 C 11 -8, 12 1, 0 9 Z" fill={url(id('milk'))} />
      </CupTop>
    </>
  )
}
function FlatWhite() {
  return (
    <>
      <CafeDefs />
      <CupTop r={32}>
        <Tulip s={1.05} />
      </CupTop>
    </>
  )
}
function Cappuccino() {
  return (
    <>
      <CafeDefs />
      <CupTop r={36}>
        <Heart s={1.1} />
        <Speckles cx={0} cy={0} rx={30} ry={30} n={40} color="#4a2410" min={0.4} max={0.9} seed={21} opacity={0.7} />
      </CupTop>
    </>
  )
}
function Latte() {
  return (
    <>
      <CafeDefs />
      <CupTop r={36}>
        <Rosetta s={1.15} />
      </CupTop>
    </>
  )
}

function V60() {
  const id = useArtId()
  return (
    <>
      <CafeDefs />
      <Shadow cx={84} cy={138} rx={46} ry={9} o={0.26} />
      <defs>
        <linearGradient id={id('cone')} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#d9cfc0" /><stop offset="0.4" stopColor="#fbf7f0" /><stop offset="1" stopColor="#cfc2ad" /></linearGradient>
      </defs>
      {/* jarra */}
      <path d="M50 92 H108 L104 132 C 103 136, 100 138, 96 138 H62 C 58 138, 55 136, 54 132 Z" fill={url(id('glassV'))} stroke="#b8c6c9" strokeWidth="1.2" />
      <path d="M52 108 H106 L103.5 131 C 103 134, 100 136, 96 136 H62 C 58 136, 55 134, 54.5 131 Z" fill={url(id('brew'))} opacity="0.92" />
      <path d="M108 98 C 118 98, 118 116, 106 118" stroke="#b8c6c9" strokeWidth="3" fill="none" />
      <path d="M58 100 L60 130" stroke="#ffffff" strokeOpacity="0.7" strokeWidth="2" strokeLinecap="round" />
      {/* cono */}
      <path d="M40 34 H120 L92 88 H68 Z" fill={url(id('cone'))} stroke="#b9ab94" strokeWidth="1" />
      <rect x="34" y="28" width="92" height="9" rx="4.5" fill="#efe6d8" stroke="#b9ab94" strokeWidth="1" />
      {[0, 1, 2, 3, 4].map((i) => <path key={i} d={`M${54 + i * 13} 40 L${72 + i * 4} 84`} stroke="#c5b79f" strokeWidth="1.2" />)}
      <path d="M46 40 L70 84" stroke="#ffffff" strokeOpacity="0.85" strokeWidth="2.4" strokeLinecap="round" />
      <rect x="62" y="86" width="36" height="7" rx="3" fill="#e2d6c2" stroke="#b9ab94" strokeWidth="0.8" />
      <path d="M80 94 V100" stroke="#5a2e14" strokeWidth="2.4" strokeLinecap="round" />
      <ellipse cx="80" cy="103" rx="1.6" ry="2.2" fill="#5a2e14" />
    </>
  )
}

function Chemex() {
  const id = useArtId()
  return (
    <>
      <CafeDefs />
      <Shadow cx={84} cy={140} rx={42} ry={8} o={0.26} />
      <defs>
        <linearGradient id={id('collar')} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#8a5a33" /><stop offset="0.5" stopColor="#c48b55" /><stop offset="1" stopColor="#7a4c28" /></linearGradient>
      </defs>
      <path d="M46 20 H114 L88 70 L114 132 C 116 138, 112 140, 108 140 H52 C 48 140, 44 138, 46 132 L72 70 Z" fill={url(id('glassV'))} stroke="#b8c6c9" strokeWidth="1.3" />
      <path d="M58 108 H102 L109 130 C 110 134, 108 136, 105 136 H55 C 52 136, 50 134, 51 130 Z" fill={url(id('brew'))} opacity="0.92" />
      <path d="M50 24 H110 L90 64 H70 Z" fill="#f7f1e6" opacity="0.85" />
      <path d="M68 60 L74 74 H86 L92 60 Z" fill={url(id('collar'))} />
      <path d="M70 66 H90" stroke="#3f2414" strokeWidth="1.2" />
      <circle cx="80" cy="76" r="3" fill="#6b4226" />
      <path d="M80 79 C 78 86, 76 90, 74 94 M80 79 C 82 86, 84 90, 86 94" stroke="#6b4226" strokeWidth="1.4" fill="none" />
      <path d="M54 28 L74 66 M78 74 L56 128" stroke="#ffffff" strokeOpacity="0.75" strokeWidth="2" strokeLinecap="round" />
    </>
  )
}

function ColdBrew() {
  const id = useArtId()
  return (
    <>
      <CafeDefs />
      <Shadow cx={82} cy={140} rx={38} ry={8} o={0.26} />
      <defs>
        <linearGradient id={id('cold')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#8a4b26" /><stop offset="0.6" stopColor="#4a2210" /><stop offset="1" stopColor="#2a1006" /></linearGradient>
      </defs>
      <path d="M52 30 H108 L102 138 H58 Z" fill={url(id('glassV'))} stroke="#b8c6c9" strokeWidth="1.3" />
      <path d="M54.5 50 H105.5 L100.5 135 H59.5 Z" fill={url(id('cold'))} />
      {[[60, 52, 12], [80, 50, -8], [92, 60, 18], [66, 70, -14]].map(([x, y, a], i) => (
        <g key={i} transform={`rotate(${a} ${x} ${y})`}>
          <rect x={x} y={y} width="17" height="15" rx="3.5" fill="#ffffff" fillOpacity="0.4" stroke="#ffffff" strokeOpacity="0.85" />
          <path d={`M${x + 3} ${y + 3} h7`} stroke="#ffffff" strokeOpacity="0.9" strokeWidth="1.4" strokeLinecap="round" />
        </g>
      ))}
      <path d="M90 14 L80 116" stroke="#2b1d15" strokeWidth="4.5" strokeLinecap="round" />
      {[[56, 96], [104, 84], [62, 118], [100, 112], [58, 70]].map(([x, y], i) => <ellipse key={i} cx={x} cy={y} rx="1.4" ry="2" fill="#ffffff" opacity="0.8" />)}
      <path d="M60 40 L66 130" stroke="#ffffff" strokeOpacity="0.55" strokeWidth="2.2" strokeLinecap="round" />
    </>
  )
}

function Roll() {
  const id = useArtId()
  const pts: string[] = []
  for (let t = 0; t <= 6 * Math.PI; t += 0.25) {
    const rr = 4 + t * 1.75
    pts.push(`${(78 + Math.cos(t) * rr).toFixed(1)} ${(78 + Math.sin(t) * rr).toFixed(1)}`)
  }
  return (
    <>
      <Plate tone="rc" r={62} />
      <defs><radialGradient id={id('dough')} cx="40%" cy="36%" r="66%"><stop offset="0" stopColor="#f2c98a" /><stop offset="0.7" stopColor="#d99a52" /><stop offset="1" stopColor="#a8682e" /></radialGradient></defs>
      <circle cx={80} cy={81} r={38} fill="#3b2a1a" opacity="0.2" />
      <circle cx={78} cy={78} r={38} fill={url(id('dough'))} />
      <path d={`M${pts.join(' L')}`} stroke="#8c4f20" strokeWidth="4.5" fill="none" strokeLinecap="round" opacity="0.75" />
      <path d={`M${pts.join(' L')}`} stroke="#c4793a" strokeWidth="1.6" fill="none" strokeLinecap="round" transform="translate(-1.2 -1.2)" />
      <path d="M46 70 C 60 56, 70 92, 84 74 C 96 58, 104 96, 114 78" stroke="#fffdf6" strokeWidth="3.4" fill="none" strokeLinecap="round" />
      <path d="M52 92 C 64 80, 74 108, 88 94 C 98 84, 104 104, 110 96" stroke="#fffdf6" strokeWidth="2.6" fill="none" strokeLinecap="round" />
      <path d="M58 58 C 68 50, 76 66, 90 56" stroke="#fffdf6" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <Speckles cx={78} cy={78} rx={30} ry={30} n={30} color="#6e3a16" min={0.4} max={0.9} seed={41} opacity={0.6} />
    </>
  )
}

function Medialuna() {
  const id = useArtId()
  const body = 'M30 104 C 22 70, 50 40, 80 40 C 110 40, 138 70, 130 104 C 126 111, 117 109, 115 102 C 109 86, 96 78, 80 78 C 64 78, 51 86, 45 102 C 43 109, 34 111, 30 104 Z'
  const band = (a: number) => {
    const t = (a * Math.PI) / 180
    const p = (r: number, bend = 0) => [80 + Math.cos(t + bend) * r, 104 + Math.sin(t + bend) * r * 0.92]
    const [x1, y1] = p(28)
    const [cx, cy] = p(44, a < 270 ? -0.08 : 0.08)
    const [x2, y2] = p(62)
    return `M${x1.toFixed(1)} ${y1.toFixed(1)} Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`
  }
  return (
    <>
      <Plate tone="rc" r={62} />
      <defs>
        <radialGradient id={id('crois')} cx="46%" cy="30%" r="80%"><stop offset="0" stopColor="#f8d792" /><stop offset="0.5" stopColor="#e3a24b" /><stop offset="0.85" stopColor="#b56a25" /><stop offset="1" stopColor="#8c4b17" /></radialGradient>
        <clipPath id={id('crclip')}><path d={body} /></clipPath>
      </defs>
      <path d={body} fill="#3b2a1a" opacity="0.2" transform="translate(3 5)" />
      <path d={body} fill={url(id('crois'))} />
      <g clipPath={url(id('crclip'))}>
        {[208, 232, 256, 284, 308, 332].map((a) => <path key={a} d={band(a)} stroke="#8f4c16" strokeWidth="2.4" fill="none" opacity="0.55" strokeLinecap="round" />)}
        {[220, 244, 270, 296, 320].map((a) => <path key={a} d={band(a)} stroke="#ffe7b0" strokeWidth="1.4" fill="none" opacity="0.5" strokeLinecap="round" transform="translate(-1.5 -1.5)" />)}
      </g>
      <path d="M42 74 C 54 54, 72 46, 92 46" stroke="#fff3cf" strokeOpacity="0.8" strokeWidth="3" fill="none" strokeLinecap="round" />
      <Speckles cx={80} cy={58} rx={36} ry={12} n={22} color="#fff6dc" min={0.4} max={0.9} seed={51} />
    </>
  )
}

function Muffin() {
  const id = useArtId()
  return (
    <>
      <Shadow cx={84} cy={136} rx={44} ry={8} o={0.26} />
      <defs>
        <linearGradient id={id('paper')} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#d7c3a1" /><stop offset="0.5" stopColor="#f3e7cf" /><stop offset="1" stopColor="#c8b18a" /></linearGradient>
        <radialGradient id={id('top')} cx="40%" cy="35%" r="70%"><stop offset="0" stopColor="#f2c37d" /><stop offset="0.7" stopColor="#cf8f45" /><stop offset="1" stopColor="#9c5d24" /></radialGradient>
      </defs>
      <path d="M46 84 H114 L104 134 H56 Z" fill={url(id('paper'))} stroke="#b39b72" strokeWidth="1" />
      {Array.from({ length: 9 }, (_, i) => <path key={i} d={`M${50 + i * 7.6} 86 L${58 + i * 5.6} 132`} stroke="#b39b72" strokeOpacity="0.7" strokeWidth="1" />)}
      <path d="M40 86 C 36 52, 124 52, 120 86 C 112 92, 48 92, 40 86 Z" fill={url(id('top'))} />
      <Speckles cx={80} cy={70} rx={34} ry={12} n={26} color="#f7dfa6" min={1} max={2.2} seed={61} />
      {[[62, 72], [84, 64], [100, 76], [74, 82], [94, 84], [56, 82]].map(([x, y], i) => (
        <g key={i}><circle cx={x} cy={y} r="4.2" fill="#3c3f78" /><circle cx={x - 1.2} cy={y - 1.4} r="1.2" fill="#9ea6e0" /></g>
      ))}
      <path d="M52 66 C 62 58, 82 56, 96 58" stroke="#fff3cf" strokeOpacity="0.75" strokeWidth="2.4" fill="none" strokeLinecap="round" />
    </>
  )
}

function Tostado() {
  const id = useArtId()
  // Un sándwich cuadrado cortado en diagonal; las mitades se separan y muestran el relleno sobre el corte.
  const halves = [
    { d: 'M44 48 L44 114 L110 114 Z', dx: -4, dy: 4, cut: 'M44 48 L110 114', key: 'a' },
    { d: 'M50 42 L116 42 L116 108 Z', dx: 5, dy: -3, cut: 'M50 42 L116 108', key: 'b' },
  ]
  return (
    <>
      <Plate tone="rc" r={64} />
      <defs>
        <linearGradient id={id('toast')} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#f3cb8a" /><stop offset="0.55" stopColor="#dd9b52" /><stop offset="1" stopColor="#b06c2e" /></linearGradient>
        {halves.map((h) => <clipPath key={h.key} id={id(`tc-${h.key}`)}><path d={h.d} /></clipPath>)}
      </defs>
      {halves.map((h) => (
        <g key={h.key} transform={`translate(${h.dx} ${h.dy})`}>
          <path d={h.d} fill="#3b2a1a" opacity="0.24" transform="translate(3 4)" strokeLinejoin="round" stroke="#3b2a1a" strokeOpacity="0.24" strokeWidth="6" />
          {/* relleno asomando por el corte */}
          <path d={h.cut} stroke="#f2c23e" strokeWidth="9" strokeLinecap="round" />
          <path d={h.cut} stroke="#e98f8f" strokeWidth="5.5" strokeLinecap="round" transform={h.key === 'a' ? 'translate(2 -2)' : 'translate(-2 2)'} />
          <path d={h.d} fill={url(id('toast'))} stroke="#9a5a22" strokeWidth="4" strokeLinejoin="round" />
          <g clipPath={url(id(`tc-${h.key}`))}>
            {[0, 1, 2, 3, 4].map((j) => <path key={j} d={`M${26 + j * 20} 124 L${66 + j * 20} 34`} stroke="#6b3712" strokeOpacity="0.4" strokeWidth="3" strokeLinecap="round" />)}
            <Speckles cx={h.key === 'a' ? 60 : 98} cy={h.key === 'a' ? 96 : 60} rx={18} ry={16} n={14} color="#fff0cc" min={0.5} max={1} seed={h.key === 'a' ? 3 : 9} opacity={0.6} />
          </g>
          <path d={h.key === 'a' ? 'M48 60 L48 108' : 'M60 46 L110 46'} stroke="#ffe4b0" strokeOpacity="0.7" strokeWidth="1.8" strokeLinecap="round" />
        </g>
      ))}
      {/* queso fundido que cae del corte */}
      <path d="M76 80 c 2 5, -1 9, 1 13 c 1 3, 4 3, 4 0 c 0 -4, -2 -8, 0 -11" fill="#f2c23e" />
    </>
  )
}

function Budin() {
  const id = useArtId()
  return (
    <>
      <Plate tone="rc" r={62} />
      <defs>
        <linearGradient id={id('cake')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f9e3a4" /><stop offset="1" stopColor="#f0cd73" /></linearGradient>
      </defs>
      <path d="M40 66 H118 V106 C 118 110, 116 112, 112 112 H46 C 42 112, 40 110, 40 106 Z" fill="#3b2a1a" opacity="0.18" transform="translate(3 4)" />
      <path d="M40 66 H118 V106 C 118 110, 116 112, 112 112 H46 C 42 112, 40 110, 40 106 Z" fill={url(id('cake'))} stroke="#c9963f" strokeWidth="1.2" />
      <path d="M40 66 C 52 56, 106 56, 118 66" fill="#b8742d" />
      <Speckles cx={79} cy={90} rx={34} ry={16} n={60} color="#d9a94a" min={0.5} max={1.2} seed={71} opacity={0.7} />
      <path d="M38 64 C 52 54, 106 54, 120 64 L120 70 C 116 72, 116 80, 112 80 C 108 80, 108 72, 104 72 C 100 72, 98 84, 92 84 C 86 84, 88 72, 82 72 C 76 72, 76 78, 70 78 C 64 78, 64 70, 58 70 C 52 70, 52 82, 46 82 C 41 82, 42 72, 38 70 Z" fill="#fffaf0" />
      <Speckles cx={80} cy={62} rx={30} ry={4} n={16} color="#e6c02e" min={0.6} max={1.2} seed={73} shape="flake" />
      <path d="M48 60 C 62 56, 88 55, 104 58" stroke="#ffffff" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    </>
  )
}

export const RC_ART: Record<string, ComponentType> = {
  'RC-01': Espresso,
  'RC-02': Doble,
  'RC-03': Cortado,
  'RC-04': FlatWhite,
  'RC-05': Cappuccino,
  'RC-06': Latte,
  'RC-07': V60,
  'RC-08': Chemex,
  'RC-09': ColdBrew,
  'RC-10': Roll,
  'RC-11': Medialuna,
  'RC-12': Muffin,
  'RC-13': Tostado,
  'RC-14': Budin,
}

export { CupTop, Heart, Tulip, Rosetta, CafeDefs }
