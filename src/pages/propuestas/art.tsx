import { useId, type ReactNode, type SVGProps } from 'react'
import type { ArtStyle, Palette, PzBiz } from './concepts'

// P5-L2 · Escenas de muestra por negocio con seis tratamientos. Cada parte lleva data-step para el
// boceto de animación transaccional (se arma en orden); con movimiento reducido se ve el estado final.

const FOOD: Record<string, string> = {
  coffee: '#5B3A24', crema: '#C89B6D', cup: '#FBF8F2', saucer: '#EDE6DA', pastry: '#D9973F', pastryDark: '#B8742A', gold: '#F4C86A',
  plate: '#F6F2EA', rim: '#E4DccD', sauce: '#B8402C', pasta: '#F1D79E', leaf: '#4F8038', cheese: '#F3C653', cutlery: '#B9B4AA',
  wood: '#B07B4F', woodDark: '#7E5434', potato: '#E9B24C', alioli: '#FFF6DF', croqueta: '#C88B3E', glass: '#E3F1F5', lemonade: '#F6DE6E', lemon: '#F2CF3A', ice: '#F4FBFD', straw: '#E0473A',
  bun: '#E3A24C', bunDark: '#C27F2E', sesame: '#FFF3D6', patty: '#5B3321', lettuce: '#7DB443', tomato: '#E2483B', cheddar: '#F6B422', fries: '#F3C64F', box: '#D93A2B', cupCold: '#2D5BD6',
  cone: '#D9A55E', coneDark: '#B98240', ddl: '#B37B4B', pistacho: '#A9C97B', frutilla: '#F28DAA', note: '#2B2B2B',
}
const ACCENT = new Set(['sauce', 'crema', 'tomato', 'frutilla', 'straw', 'box'])
const SHADE = new Set(['coffee', 'patty', 'sauce', 'woodDark', 'pastryDark', 'ddl', 'croqueta', 'coneDark', 'bunDark'])

interface Kit {
  f: (key: string) => string
  s: SVGProps<SVGElement>
  d: SVGProps<SVGElement>
  style: ArtStyle
  p: Palette
}

function makeKit(style: ArtStyle, p: Palette, uid: string): Kit {
  const base = { strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const }
  const f = (key: string) => {
    const c = FOOD[key] ?? key
    if (style === 'soft') return `url(#${uid}-g-${key})`
    if (style === 'line') return ACCENT.has(key) ? p.accent2 : p.surface
    if (style === 'mono') return SHADE.has(key) ? `url(#${uid}-hatch)` : p.surface
    return c
  }
  const stroke =
    style === 'ink' ? { stroke: p.ink, strokeWidth: 2, strokeOpacity: 0.82 } :
    style === 'line' ? { stroke: p.ink, strokeWidth: 1.5 } :
    style === 'mono' ? { stroke: p.ink, strokeWidth: 1.3 } :
    style === 'block' ? { stroke: p.line, strokeWidth: 3.5 } : { stroke: 'none' }
  const detail =
    style === 'flat' || style === 'soft' ? { stroke: 'rgba(0,0,0,.22)', strokeWidth: 1.6, fill: 'none' } :
    { stroke: style === 'block' ? p.line : p.ink, strokeWidth: style === 'block' ? 2.4 : 1.1, strokeOpacity: style === 'ink' ? 0.7 : 1, fill: 'none' }
  return { f, s: { ...base, ...stroke }, d: { ...base, ...detail }, style, p }
}

const lighten = (hex: string, t: number) => {
  const n = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
  return `rgb(${n.map((v) => Math.round(v + (255 - v) * t)).join(',')})`
}

function Defs({ uid, p }: { uid: string; p: Palette }) {
  return (
    <defs>
      {Object.entries(FOOD).map(([k, c]) => (
        <radialGradient key={k} id={`${uid}-g-${k}`} cx="35%" cy="30%" r="80%">
          <stop offset="0" stopColor={lighten(c, 0.45)} />
          <stop offset=".55" stopColor={c} />
          <stop offset="1" stopColor={c} stopOpacity=".92" />
        </radialGradient>
      ))}
      <pattern id={`${uid}-hatch`} width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect width="4" height="4" fill={p.surface} />
        <line x1="0" y1="0" x2="0" y2="4" stroke={p.ink} strokeWidth="1" />
      </pattern>
    </defs>
  )
}

const Step = ({ i, children, className }: { i: number; children: ReactNode; className?: string }) => (
  <g data-step={i} className={className} style={{ ['--i' as string]: i }}>{children}</g>
)

// ── Cafetería: flat white y dos medialunas ──
function Medialuna({ k, x, y, s = 1 }: { k: Kit; x: number; y: number; s?: number }) {
  // Media luna acostada: arco exterior hojaldrado, puntas curvas hacia adentro y gajos marcados.
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M0 30C4 6 56 6 60 30C57 35 50 35 47 30C41 19 19 19 13 30C10 35 3 35 0 30z" fill={k.f('pastry')} {...(k.s as object)} />
      <path d="M13 30C19 19 41 19 47 30C41 25 19 25 13 30z" fill={k.f('pastryDark')} stroke="none" opacity=".55" />
      <g {...(k.d as object)}>
        {[[15, 13, 18, 24], [23, 9, 25, 21], [30, 8, 30, 20], [37, 9, 35, 21], [45, 13, 42, 24]].map(([a, b, c, d]) => <path key={a} d={`M${a} ${b}C${a + 2} ${b + 5} ${c} ${d - 4} ${c} ${d}`} />)}
      </g>
    </g>
  )
}
function CafeScene({ k }: { k: Kit }) {
  return (
    <>
      <Step i={0}><ellipse cx="88" cy="146" rx="64" ry="13" fill={k.f('saucer')} {...(k.s as object)} /></Step>
      <Step i={1}>
        <path d="M136 92c22 0 22 30-4 31" fill="none" {...(k.s as object)} strokeWidth={k.style === 'flat' || k.style === 'soft' ? 7 : (k.s.strokeWidth as number) + 4} stroke={k.style === 'flat' || k.style === 'soft' ? FOOD.cup : (k.s.stroke as string)} />
        <path d="M44 84h88v16c0 30-19 44-44 44s-44-14-44-44z" fill={k.f('cup')} {...(k.s as object)} />
      </Step>
      <Step i={2}>
        <ellipse cx="88" cy="86" rx="41" ry="8.5" fill={k.f('coffee')} {...(k.s as object)} />
        <path d="M80 85c3-4 8-3 8 1 0-4 5-5 8-1-3 4-8 5-8 5s-5-1-8-5z" fill={k.f('crema')} stroke="none" />
      </Step>
      <g className="pz-steam" {...(k.d as object)} strokeWidth={1.6}>
        <path d="M74 70c-6-9 6-14 0-24" /><path d="M90 68c-6-9 6-14 0-26" /><path d="M106 70c-6-9 6-14 0-24" />
      </g>
      <Step i={3}>
        <ellipse cx="188" cy="152" rx="44" ry="10" fill={k.f('saucer')} {...(k.s as object)} />
        <Medialuna k={k} x={150} y={106} s={0.95} />
        <Medialuna k={k} x={176} y={118} s={0.95} />
      </Step>
      <Step i={4} className="pz-glaze">
        <path d="M157 116c8-9 34-9 42 0" fill="none" stroke={k.style === 'line' || k.style === 'mono' ? k.p.accent2 : FOOD.gold} strokeWidth="3" strokeLinecap="round" opacity=".85" />
        <path d="M183 128c8-9 34-9 42 0" fill="none" stroke={k.style === 'line' || k.style === 'mono' ? k.p.accent2 : FOOD.gold} strokeWidth="3" strokeLinecap="round" opacity=".85" />
      </Step>
    </>
  )
}

// ── Heladería: cucurucho con tres gustos ──
function Scoop({ k, cx, cy, r, flavor }: { k: Kit; cx: number; cy: number; r: number; flavor: string }) {
  const drip = `M${cx - r} ${cy + 2}c4 10 9 3 12 9s8-2 11 4 9-4 12 1 8 0 ${r * 2 - 35} -12`
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={k.f(flavor)} {...(k.s as object)} />
      <path d={drip} fill={k.f(flavor)} {...(k.s as object)} />
      {k.style !== 'line' && k.style !== 'mono' && <ellipse cx={cx - r * 0.35} cy={cy - r * 0.4} rx={r * 0.25} ry={r * 0.14} fill="#fff" opacity=".35" />}
    </g>
  )
}
function HelaScene({ k, uid }: { k: Kit; uid: string }) {
  return (
    <>
      <Step i={0}>
        <clipPath id={`${uid}-cone`}><path d="M86 100L120 172L154 100z" /></clipPath>
        <path d="M86 100L120 172L154 100z" fill={k.f('cone')} {...(k.s as object)} />
        <g clipPath={`url(#${uid}-cone)`} {...(k.d as object)}>
          {[0, 1, 2, 3, 4, 5].map((i) => <line key={`a${i}`} x1={76 + i * 14} y1="100" x2={116 + i * 14} y2="172" />)}
          {[0, 1, 2, 3, 4, 5].map((i) => <line key={`b${i}`} x1={164 - i * 14} y1="100" x2={124 - i * 14} y2="172" />)}
        </g>
      </Step>
      <Step i={1}><Scoop k={k} cx={120} cy={94} r={34} flavor="ddl" /></Step>
      <Step i={2}><Scoop k={k} cx={101} cy={62} r={25} flavor="pistacho" /></Step>
      <Step i={3}><Scoop k={k} cx={140} cy={60} r={25} flavor="frutilla" /></Step>
      <Step i={4}>
        {[[96, 50, 20], [110, 72, -30], [134, 46, 60], [148, 70, 10], [120, 82, -60]].map(([x, y, a]) => (
          <rect key={`${x}`} x={x} y={y} width="7" height="2.6" rx="1.3" transform={`rotate(${a} ${x} ${y})`} fill={k.style === 'line' || k.style === 'mono' ? k.p.ink : k.p.accent2} />
        ))}
      </Step>
    </>
  )
}

// ── Restaurante: sorrentinos con fileto ──
function RestoScene({ k }: { k: Kit }) {
  const pasta = [[100, 86], [128, 80], [146, 102], [112, 112], [136, 124]]
  return (
    <>
      <Step i={0}>
        <circle cx="122" cy="102" r="66" fill={k.f('plate')} {...(k.s as object)} />
        <circle cx="122" cy="102" r="50" fill="none" {...(k.d as object)} strokeOpacity={0.35} />
      </Step>
      <Step i={1}><path d="M80 98c4-24 32-34 56-28 24 5 36 28 26 48-9 19-40 26-62 18-16-6-23-22-20-38z" fill={k.f('sauce')} {...(k.s as object)} /></Step>
      <Step i={2}>
        {pasta.map(([x, y]) => (
          <g key={`${x}`}>
            <circle cx={x} cy={y} r="13" fill={k.f('pasta')} {...(k.s as object)} />
            <circle cx={x} cy={y} r="6" fill="none" {...(k.d as object)} />
          </g>
        ))}
      </Step>
      <Step i={3}>
        {[[118, 96, -20], [142, 88, 40], [126, 120, 100]].map(([x, y, a]) => (
          <path key={`${x}`} d={`M${x} ${y}c6-8 16-8 18 0-6 8-14 8-18 0z`} transform={`rotate(${a} ${x} ${y})`} fill={k.f('leaf')} {...(k.s as object)} strokeWidth={1} />
        ))}
      </Step>
      <Step i={4}>
        <rect x="34" y="52" width="6" height="96" rx="3" fill={k.f('cutlery')} {...(k.s as object)} />
        <path d="M202 52c8 6 8 34 2 42v54h-6V52z" fill={k.f('cutlery')} {...(k.s as object)} />
      </Step>
    </>
  )
}

// ── Bar gastronómico: tabla para compartir y limonada (sin alcohol) ──
function BarScene({ k }: { k: Kit }) {
  return (
    <>
      <Step i={0}>
        <rect x="22" y="112" width="150" height="40" rx="12" fill={k.f('wood')} {...(k.s as object)} />
        <circle cx="178" cy="132" r="7" fill={k.f('woodDark')} {...(k.s as object)} />
      </Step>
      <Step i={1}>
        <ellipse cx="66" cy="114" rx="34" ry="11" fill={k.f('saucer')} {...(k.s as object)} />
        {[[46, 96, 10], [62, 92, -12], [78, 98, 20], [56, 104, 0], [72, 106, 30]].map(([x, y, a]) => (
          <rect key={`${x}-${y}`} x={x} y={y} width="14" height="12" rx="3" transform={`rotate(${a} ${x + 7} ${y + 6})`} fill={k.f('potato')} {...(k.s as object)} />
        ))}
        <path d="M48 96c8 4 14-4 22 0s12-2 16 2" fill="none" stroke={k.style === 'line' || k.style === 'mono' ? k.p.accent2 : FOOD.sauce} strokeWidth="3" strokeLinecap="round" />
      </Step>
      <Step i={2}>
        {[[118, 112], [140, 108], [128, 98]].map(([x, y]) => <ellipse key={`${x}`} cx={x} cy={y} rx="13" ry="8.5" fill={k.f('croqueta')} {...(k.s as object)} />)}
      </Step>
      <Step i={3}>
        <path d="M188 50h34l-5 98h-24z" fill={k.f('glass')} {...(k.s as object)} />
        <path d="M190.5 84h29l-3.3 62h-22.4z" fill={k.f('lemonade')} stroke="none" opacity=".92" />
        <rect x="197" y="92" width="9" height="9" rx="2" fill={k.f('ice')} {...(k.d as object)} />
        <line x1="212" y1="40" x2="206" y2="120" stroke={k.style === 'line' || k.style === 'mono' ? k.p.ink : FOOD.straw} strokeWidth="3" strokeLinecap="round" />
        <circle cx="222" cy="52" r="10" fill={k.f('lemon')} {...(k.s as object)} />
      </Step>
      <Step i={4}>
        <g fill={k.style === 'flat' || k.style === 'soft' ? k.p.accent : k.p.ink}>
          <ellipse cx="146" cy="58" rx="6" ry="4.5" transform="rotate(-20 146 58)" /><rect x="150.5" y="28" width="2.2" height="30" />
          <ellipse cx="166" cy="50" rx="6" ry="4.5" transform="rotate(-20 166 50)" /><rect x="170.5" y="20" width="2.2" height="30" />
          <path d="M150.5 28l22-8v5l-22 8z" />
        </g>
      </Step>
    </>
  )
}

// ── Comida rápida: hamburguesa doble, papas y bebida ──
function RapidaScene({ k }: { k: Kit }) {
  return (
    <>
      <Step i={0}><path d="M40 128h96c0 14-10 20-24 20H64c-14 0-24-6-24-20z" fill={k.f('bun')} {...(k.s as object)} /></Step>
      <Step i={1}><rect x="36" y="110" width="104" height="18" rx="9" fill={k.f('patty')} {...(k.s as object)} /></Step>
      <Step i={2}><path d="M34 104h108l-8 10-8-6-10 9-10-7-10 8-10-8-10 8-10-7-10 9-8-6-8 6z" fill={k.f('cheddar')} {...(k.s as object)} /></Step>
      <Step i={3}>
        <rect x="36" y="88" width="104" height="17" rx="8.5" fill={k.f('patty')} {...(k.s as object)} />
        <path d="M32 88c8-8 14 2 22-4s14 2 22-4 14 2 22-4 14 2 22-4 14 2 18 0" fill="none" stroke={k.style === 'line' || k.style === 'mono' ? k.p.ink : FOOD.lettuce} strokeWidth="6" strokeLinecap="round" />
      </Step>
      <Step i={4}>
        <path d="M38 80c0-30 22-44 50-44s50 14 50 44z" fill={k.f('bun')} {...(k.s as object)} />
        {[[66, 54], [84, 46], [102, 52], [118, 62], [76, 66], [96, 64]].map(([x, y]) => <ellipse key={`${x}`} cx={x} cy={y} rx="3.2" ry="1.8" fill={k.style === 'line' || k.style === 'mono' ? k.p.ink : FOOD.sesame} />)}
      </Step>
      <Step i={5}>
        {[0, 1, 2, 3, 4].map((i) => <rect key={i} x={160 + i * 7} y={72 - (i % 2) * 8} width="6" height="40" rx="2" fill={k.f('fries')} {...(k.s as object)} strokeWidth={k.style === 'block' ? 2 : (k.s.strokeWidth as number)} />)}
        <path d="M154 100h46l-6 48h-34z" fill={k.f('box')} {...(k.s as object)} />
      </Step>
      <Step i={6}>
        <path d="M206 78h26l-4 70h-18z" fill={k.style === 'line' || k.style === 'mono' ? k.p.surface : k.f('cupCold')} {...(k.s as object)} />
        <line x1="222" y1="78" x2="228" y2="56" stroke={k.p.ink} strokeWidth="3" strokeLinecap="round" />
      </Step>
    </>
  )
}

export function BizArt({ biz, style, palette, size = 240, play = 0, label }: { biz: PzBiz; style: ArtStyle; palette: Palette; size?: number; play?: number; label?: string }) {
  const uid = useId().replace(/:/g, '')
  const k = makeKit(style, palette, uid)
  return (
    <svg className="pz-art" data-play={play > 0 ? play : undefined} key={play} viewBox="0 0 240 180" width={size} height={size * 0.75} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      <Defs uid={uid} p={palette} />
      <ellipse cx="120" cy="164" rx="104" ry="9" fill={palette.ink} opacity=".07" />
      {biz === 'cafe' && <CafeScene k={k} />}
      {biz === 'hela' && <HelaScene k={k} uid={uid} />}
      {biz === 'resto' && <RestoScene k={k} />}
      {biz === 'bar' && <BarScene k={k} />}
      {biz === 'rapida' && <RapidaScene k={k} />}
    </svg>
  )
}
