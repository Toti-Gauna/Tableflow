import { useId, type CSSProperties, type ReactNode } from 'react'
import { IdRoot, type PieceProps, type SignatureProps } from './shared'
import './helado.css'

// Copo · heladería. La vitrina es el menú: bachas vistas desde arriba y bochas con volumen, rizos de paleta,
// brillo y trocitos. Todo SVG propio, generado con semillas fijas (mismo dibujo en cada render).

const uidOf = (s: string) => s.replace(/[:«»]/g, '')
function rng(seed: number) {
  let s = seed >>> 0
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296 }
}

type Fl = 'ddl' | 'choco' | 'pistacho' | 'frutilla' | 'limon' | 'menta' | 'crema' | 'maracuya'
const FLAVOR: Record<Fl, { name: string; base: string; light: string; dark: string; bits?: 'flakes' | 'nuts' | 'berries' | 'zest' | 'specks' | 'seeds'; tag?: string }> = {
  ddl: { name: 'Dulce de leche granizado', base: '#C68A4E', light: '#EBBE84', dark: '#8A552A', bits: 'flakes', tag: 'El más pedido' },
  choco: { name: 'Chocolate amargo 70 %', base: '#4B2416', light: '#83492C', dark: '#220F08' },
  pistacho: { name: 'Pistacho', base: '#A9C76D', light: '#D6E9A2', dark: '#6C8A38', bits: 'nuts', tag: 'Queda poco' },
  frutilla: { name: 'Frutilla a la crema', base: '#F38DAC', light: '#FFC6D6', dark: '#C9567A', bits: 'berries' },
  limon: { name: 'Limón', base: '#F5E59C', light: '#FFF8D4', dark: '#D6BF5E', bits: 'zest' },
  menta: { name: 'Menta granizada', base: '#A6E0CD', light: '#DFF7EF', dark: '#68B39B', bits: 'flakes' },
  crema: { name: 'Crema americana', base: '#F6E9CC', light: '#FFFDF3', dark: '#D8C499', bits: 'specks' },
  maracuya: { name: 'Maracuyá', base: '#F6BE47', light: '#FFE08A', dark: '#CE8C1B', bits: 'seeds' },
}

/** Contorno de bocha: domo arriba y cuello festoneado abajo (la marca de la paleta al servir). */
function scoopPath(r: number, seed: number) {
  const rand = rng(seed)
  const y0 = 0.16 * r
  let d = `M${(-r).toFixed(1)} ${y0.toFixed(1)}A${r} ${r * 0.98} 0 0 1 ${r.toFixed(1)} ${y0.toFixed(1)}`
  const k = 7
  let x = r * 1.03
  d += `L${x.toFixed(1)} ${(0.26 * r).toFixed(1)}`
  for (let i = 0; i < k; i++) {
    const nx = r * 1.03 - ((i + 1) / k) * r * 2.06
    const yb = 0.27 * r + (rand() - 0.5) * 0.05 * r
    const depth = 0.15 * r + rand() * 0.07 * r
    d += `Q${((x + nx) / 2).toFixed(1)} ${(yb + depth).toFixed(1)} ${nx.toFixed(1)} ${yb.toFixed(1)}`
    x = nx
  }
  return d + 'Z'
}

function Bits({ kind, r, seed, u }: { kind?: string; r: number; seed: number; u: string }) {
  if (!kind) return null
  const rand = rng(seed * 7 + 3)
  const out: ReactNode[] = []
  const n = kind === 'specks' ? 26 : kind === 'seeds' ? 18 : kind === 'zest' ? 14 : 11
  for (let i = 0; i < n; i++) {
    let x = 0
    let y = 0
    for (let t = 0; t < 8; t++) {
      x = (rand() - 0.5) * 1.6 * r
      y = -0.85 * r + rand() * 1.05 * r
      if (x * x + y * y < (0.82 * r) ** 2) break
    }
    const a = rand() * 180
    const s = 0.6 + rand() * 0.7
    if (kind === 'flakes') out.push(<path key={i} d={`M${x} ${y}l${7 * s} ${-2 * s}l${3 * s} ${4 * s}l${-8 * s} ${3 * s}z`} transform={`rotate(${a} ${x} ${y})`} fill="#2d150b" />)
    else if (kind === 'nuts') out.push(<g key={i} transform={`rotate(${a} ${x} ${y})`}><ellipse cx={x} cy={y} rx={5 * s} ry={3.4 * s} fill="#6f8f2c" /><ellipse cx={x - 1} cy={y - 1} rx={2 * s} ry={1.2 * s} fill="#cfe38a" /></g>)
    else if (kind === 'berries') out.push(<g key={i} transform={`rotate(${a} ${x} ${y})`}><path d={`M${x} ${y - 5 * s}c${5 * s} 0 ${7 * s} ${4 * s} ${4 * s} ${8 * s}c${-2 * s} ${3 * s} ${-6 * s} ${3 * s} ${-8 * s} 0c${-3 * s} ${-4 * s} ${-1 * s} ${-8 * s} ${4 * s} ${-8 * s}z`} fill="#d42a46" /><circle cx={x - 1 * s} cy={y - 1 * s} r={1 * s} fill="#ffd2da" /></g>)
    else if (kind === 'zest') out.push(<path key={i} d={`M${x} ${y}q${3 * s} ${-3 * s} ${7 * s} 0`} transform={`rotate(${a} ${x} ${y})`} stroke="#e7cc2a" strokeWidth={2.2 * s} fill="none" strokeLinecap="round" />)
    else if (kind === 'specks') out.push(<circle key={i} cx={x} cy={y} r={0.9 * s} fill="#5b3a22" opacity=".8" />)
    else if (kind === 'seeds') out.push(<ellipse key={i} cx={x} cy={y} rx={2.4 * s} ry={1.6 * s} transform={`rotate(${a} ${x} ${y})`} fill="#1e140a" />)
  }
  void u
  return <g>{out}</g>
}

/** Bocha completa: forma, degradé, rizos de paleta, trocitos, brillo. */
export function Scoop({ fl, r, x, y, seed = 1, u, className, style }: { fl: Fl; r: number; x: number; y: number; seed?: number; u: string; className?: string; style?: CSSProperties }) {
  const f = FLAVOR[fl]
  const id = `${u}-${fl}-${seed}`
  const d = scoopPath(r, seed)
  const rand = rng(seed + 11)
  const ridges = [0, 1, 2].map((i) => {
    const yy = -0.62 * r + i * 0.32 * r + (rand() - 0.5) * 0.08 * r
    const w = 0.72 * r - Math.abs(i - 1) * 0.12 * r
    return `M${-w} ${yy + 0.1 * r}C${-w * 0.4} ${yy - 0.3 * r} ${w * 0.5} ${yy - 0.28 * r} ${w} ${yy + 0.06 * r}`
  })
  return (
    <g transform={`translate(${x} ${y})`} className={className} style={style}>
      <defs>
        <radialGradient id={`${id}-g`} cx=".36" cy=".3" r=".85"><stop offset="0" stopColor={f.light} /><stop offset=".55" stopColor={f.base} /><stop offset="1" stopColor={f.dark} /></radialGradient>
        <clipPath id={`${id}-c`}><path d={d} /></clipPath>
      </defs>
      <ellipse cx="0" cy={0.42 * r} rx={r * 0.95} ry={0.16 * r} fill="#000" opacity=".22" filter={`url(#${u}-soft)`} />
      <path d={d} fill={`url(#${id}-g)`} />
      <g clipPath={`url(#${id}-c)`}>
        {ridges.map((p, i) => <g key={i}><path d={p} fill="none" stroke={f.dark} strokeWidth={0.07 * r} strokeLinecap="round" opacity=".35" transform={`translate(0 ${0.05 * r})`} /><path d={p} fill="none" stroke={f.light} strokeWidth={0.05 * r} strokeLinecap="round" opacity=".7" /></g>)}
        <Bits kind={f.bits} r={r} seed={seed} u={u} />
        <path d={`M${-r} ${0.12 * r}Q0 ${0.36 * r} ${r} ${0.12 * r}L${r} ${0.5 * r}L${-r} ${0.5 * r}Z`} fill={f.dark} opacity=".28" />
      </g>
      <ellipse cx={-0.36 * r} cy={-0.5 * r} rx={0.3 * r} ry={0.15 * r} transform={`rotate(-28 ${-0.36 * r} ${-0.5 * r})`} fill="#fff" opacity=".55" filter={`url(#${u}-soft)`} />
      <ellipse cx={-0.42 * r} cy={-0.56 * r} rx={0.08 * r} ry={0.04 * r} transform={`rotate(-28 ${-0.42 * r} ${-0.56 * r})`} fill="#fff" opacity=".9" />
    </g>
  )
}

function Cone({ x, y, s = 1, u }: { x: number; y: number; s?: number; u: string }) {
  const lines: string[] = []
  for (let i = -6; i <= 10; i++) lines.push(`M${-90 + i * 20} 0L${30 + i * 20} 250`)
  const lines2: string[] = []
  for (let i = -6; i <= 10; i++) lines2.push(`M${90 - i * 20} 0L${-30 - i * 20} 250`)
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <defs>
        <linearGradient id={`${u}-cone`} x1="0" x2="1"><stop offset="0" stopColor="#f0be78" /><stop offset=".45" stopColor="#d79a52" /><stop offset="1" stopColor="#9c6127" /></linearGradient>
        <linearGradient id={`${u}-rim`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#e8ad62" /><stop offset=".5" stopColor="#b9773a" /><stop offset="1" stopColor="#8a5222" /></linearGradient>
        <clipPath id={`${u}-cc`}><path d="M-72 20H72L9 238Q0 252-9 238Z" /></clipPath>
      </defs>
      <ellipse cx="0" cy="262" rx="40" ry="8" fill="#000" opacity=".2" filter={`url(#${u}-soft)`} />
      <path d="M-72 20H72L9 238Q0 252-9 238Z" fill={`url(#${u}-cone)`} />
      <g clipPath={`url(#${u}-cc)`}>
        {lines.map((l, i) => <path key={`a${i}`} d={l} stroke="#94591f" strokeWidth="3.4" opacity=".75" />)}
        {lines2.map((l, i) => <path key={`b${i}`} d={l} stroke="#94591f" strokeWidth="3.4" opacity=".75" />)}
        {lines.map((l, i) => <path key={`c${i}`} d={l} stroke="#ffd79a" strokeWidth="1.2" opacity=".55" transform="translate(2 -1)" />)}
        {lines2.map((l, i) => <path key={`e${i}`} d={l} stroke="#ffd79a" strokeWidth="1.2" opacity=".45" transform="translate(-2 -1)" />)}
        <rect x="20" y="0" width="70" height="260" fill="#5a300f" opacity=".22" />
      </g>
      <rect x="-80" y="2" width="160" height="28" rx="12" fill={`url(#${u}-rim)`} />
      <path d="M-74 10H74" stroke="#ffd18c" strokeWidth="2" opacity=".6" strokeLinecap="round" />
      {[-60, -36, -12, 12, 36, 60].map((cx) => <path key={cx} d={`M${cx - 8} 22q8-6 16 0`} stroke="#7d4718" strokeWidth="1.6" fill="none" opacity=".6" />)}
    </g>
  )
}

function Defs({ u }: { u: string }) {
  return (
    <defs>
      <filter id={`${u}-soft`} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4" /></filter>
      <radialGradient id={`${u}-halo`} cx=".5" cy=".45" r=".55"><stop offset="0" stopColor="#fff" stopOpacity=".9" /><stop offset=".6" stopColor="#ffd6e1" stopOpacity=".7" /><stop offset="1" stopColor="#ffd6e1" stopOpacity="0" /></radialGradient>
      <linearGradient id={`${u}-sauce`} x1="0" x2="1"><stop offset="0" stopColor="#6b351d" /><stop offset=".4" stopColor="#3a170b" /><stop offset="1" stopColor="#1c0904" /></linearGradient>
    </defs>
  )
}

function Strawberry({ x, y, s = 1, r = 0 }: { x: number; y: number; s?: number; r?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
      <path d="M0-26C18-26 26-10 20 6C14 20 4 28 0 30C-4 28-14 20-20 6C-26-10-18-26 0-26Z" fill="#e0263f" />
      <path d="M0-18C10-18 14-8 10 4C6 14 2 18 0 20C-2 18-6 14-10 4C-14-8-10-18 0-18Z" fill="#ff8a9c" opacity=".7" />
      <path d="M0-14V16" stroke="#fff" strokeWidth="2" opacity=".6" />
      {[[-12, -8], [12, -8], [-14, 4], [14, 4], [-8, 14], [8, 14]].map(([a, b]) => <ellipse key={`${a}${b}`} cx={a} cy={b} rx="1.4" ry="2" fill="#ffe28a" />)}
      <path d="M-10-26c4-8 8-8 10-2 2-6 6-6 10 2-6-2-14-2-20 0z" fill="#3d8b3d" />
    </g>
  )
}
function Shard({ x, y, s = 1, r = 0 }: { x: number; y: number; s?: number; r?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
      <path d="M-14-8L10-12L16 6L-6 12Z" fill="#2a1209" />
      <path d="M-14-8L10-12L12-6L-10-2Z" fill="#6b3a22" />
    </g>
  )
}
function Pistachio({ x, y, s = 1, r = 0 }: { x: number; y: number; s?: number; r?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
      <ellipse rx="13" ry="8" fill="#8fb046" />
      <ellipse cx="-3" cy="-2" rx="6" ry="3" fill="#d4ea96" />
      <path d="M-13 0C-6 6 6 6 13 0" stroke="#7a5a3a" strokeWidth="2.4" fill="none" />
    </g>
  )
}

/** Ilustración firma: cucurucho de tres bochas con baño de chocolate y trocitos flotando. */
export function ConeArt({ label, compact = false }: { label?: string; compact?: boolean }) {
  const u = uidOf(useId())
  return (
    <svg className="hl-art" viewBox="0 0 560 660" role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      <Defs u={u} />
      <circle cx="280" cy="300" r="250" fill={`url(#${u}-halo)`} />
      {!compact && <>
        <Strawberry x={92} y={170} s={1.3} r={-24} />
        <Strawberry x={470} y={300} s={1.1} r={28} />
        <Shard x={460} y={140} s={1.6} r={20} />
        <Shard x={110} y={380} s={1.3} r={-35} />
        <Shard x={500} y={430} s={1} r={60} />
        <Pistachio x={70} y={280} s={1.3} r={30} />
        <Pistachio x={480} y={220} s={1.1} r={-20} />
        <Pistachio x={440} y={520} s={1} r={10} />
      </>}
      <Cone x={280} y={360} s={1.12} u={u} />
      <Scoop fl="ddl" r={100} x={280} y={350} seed={3} u={u} />
      <Scoop fl="pistacho" r={88} x={290} y={242} seed={8} u={u} />
      <Scoop fl="frutilla" r={78} x={274} y={152} seed={5} u={u} />
      <path d="M200 146C204 100 238 74 274 74C312 74 344 100 348 142C348 152 344 160 340 158C334 156 336 146 330 144C326 156 326 186 318 190C310 194 306 172 304 156C298 150 292 152 290 158C288 178 286 210 277 212C268 214 266 184 264 162C258 154 250 154 246 160C244 176 242 190 234 188C226 186 230 170 226 158C220 152 212 156 208 160C202 164 198 156 200 146Z" fill={`url(#${u}-sauce)`} />
      <path d="M218 112C232 92 252 84 274 83" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" opacity=".42" />
      <path d="M226 106C234 98 242 94 250 92" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" opacity=".85" />
      <path d="M316 172C317 178 317 183 315 187M276 186C277 194 277 202 275 208" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" opacity=".45" />
      <g transform="translate(326 86) rotate(24)">
        <rect x="-10" y="-58" width="20" height="74" rx="4" fill="#e8c27a" />
        {[-50, -38, -26, -14, -2].map((y) => <path key={y} d={`M-10 ${y}H10`} stroke="#b88b45" strokeWidth="2" />)}
        <rect x="-10" y="-58" width="6" height="74" fill="#fff" opacity=".35" />
      </g>
      {[[200, 140, '#ffd23f'], [240, 112, '#5fd0c0'], [318, 112, '#ff6b8b'], [338, 150, '#ffd23f'], [252, 150, '#fff'], [296, 128, '#5fd0c0']].map(([cx, cy, c], k) => <rect key={k} x={cx as number} y={cy as number} width="10" height="3.4" rx="1.7" transform={`rotate(${k * 47} ${cx} ${cy})`} fill={c as string} />)}
    </svg>
  )
}

/** Bacha vista desde arriba con olas talladas por la paleta. */
export function Tub({ fl, empty = false }: { fl: Fl; empty?: boolean }) {
  const u = uidOf(useId())
  const f = FLAVOR[fl]
  const rand = rng(fl.length * 13 + f.base.charCodeAt(2))
  const waves = [0, 1, 2, 3, 4].map((i) => {
    const y = 26 + i * 24
    const a = 8 + rand() * 7
    const ph = rand() * 40
    return { y, d: `M10 ${y}C${50 + ph} ${y - a} ${90 + ph} ${y + a} ${130 + ph / 2} ${y - a / 2}S${176} ${y + a} 190 ${y}` }
  })
  return (
    <svg className="hl-tub" viewBox="0 0 200 150" aria-hidden="true">
      <defs>
        <linearGradient id={`${u}-steel`} x1="0" x2="1"><stop offset="0" stopColor="#8f979e" /><stop offset=".25" stopColor="#f2f5f7" /><stop offset=".55" stopColor="#aab2b8" /><stop offset=".8" stopColor="#eef2f4" /><stop offset="1" stopColor="#7c858c" /></linearGradient>
        <linearGradient id={`${u}-band`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={f.light} /><stop offset=".6" stopColor={f.base} /><stop offset="1" stopColor={f.dark} /></linearGradient>
        <clipPath id={`${u}-in`}><rect x="12" y="12" width="176" height="126" rx="6" /></clipPath>
      </defs>
      <rect x="2" y="2" width="196" height="146" rx="12" fill={`url(#${u}-steel)`} />
      <rect x="12" y="12" width="176" height="126" rx="6" fill={empty ? '#b9c1c7' : f.base} />
      {empty ? (
        <g clipPath={`url(#${u}-in)`}><rect x="12" y="12" width="176" height="126" fill="#d5dbdf" /><path d="M12 30L188 120" stroke="#fff" strokeWidth="10" opacity=".5" /></g>
      ) : (
        <g clipPath={`url(#${u}-in)`}>
          {waves.map((w, i) => (
            <g key={i}>
              <linearGradient id={`${u}-w${i}`} gradientUnits="userSpaceOnUse" x1="0" y1={w.y - 14} x2="0" y2={w.y + 22}><stop offset="0" stopColor={f.light} /><stop offset=".45" stopColor={f.base} /><stop offset="1" stopColor={f.dark} /></linearGradient>
              <path d={`${w.d}L190 150L10 150Z`} fill={`url(#${u}-w${i})`} />
              <path d={w.d} fill="none" stroke="#fff" strokeWidth="2.4" opacity=".45" transform="translate(0 2)" />
            </g>
          ))}
          <g transform="translate(100 78)"><Bits kind={f.bits} r={74} seed={fl.length * 5} u={u} /></g>
          <path d="M20 22L180 40" stroke="#fff" strokeWidth="5" opacity=".25" strokeLinecap="round" />
        </g>
      )}
      {!empty && fl === 'ddl' && <g transform="translate(150 44) rotate(-30)"><rect x="-6" y="-46" width="12" height="70" rx="4" fill="#d9dee2" /><rect x="-10" y="18" width="20" height="30" rx="6" fill="#22303a" /></g>}
    </svg>
  )
}

const VITRINA: { fl: Fl; state?: 'pocas' | 'agotado' }[] = [
  { fl: 'ddl' }, { fl: 'choco' }, { fl: 'pistacho', state: 'pocas' }, { fl: 'frutilla' },
  { fl: 'limon' }, { fl: 'menta' }, { fl: 'crema' }, { fl: 'maracuya', state: 'agotado' },
]

function Vitrina({ cols = 4 }: { cols?: number }) {
  return (
    <div className="hl-vitrina" style={{ ['--cols' as string]: cols }}>
      <div className="hl-glass" aria-hidden="true" />
      {VITRINA.map((v) => (
        <div key={v.fl} className="hl-bacha" data-state={v.state}>
          <Tub fl={v.fl} empty={v.state === 'agotado'} />
          <span className="hl-cartel"><i style={{ background: FLAVOR[v.fl].base }} />{FLAVOR[v.fl].name}</span>
          {v.state === 'pocas' && <span className="hl-flag">Queda poco</span>}
          {v.state === 'agotado' && <span className="hl-flag off">Volvemos pronto</span>}
        </div>
      ))}
    </div>
  )
}

/** Formatos dibujados: el formato real, no un ícono genérico. */
function FormatIcon({ kind }: { kind: 'cucu' | 'vaso' | 'cuarto' | 'medio' | 'kilo' }) {
  const u = uidOf(useId())
  if (kind === 'cucu' || kind === 'vaso') {
    return (
      <svg viewBox="0 0 80 100" className="hl-fmt" aria-hidden="true">
        <defs><linearGradient id={`${u}-c`} x1="0" x2="1"><stop offset="0" stopColor="#f0be78" /><stop offset="1" stopColor="#a8682b" /></linearGradient></defs>
        {kind === 'cucu' ? <path d="M18 44H62L42 96Q40 100 38 96Z" fill={`url(#${u}-c)`} /> : <path d="M16 46H64L58 92H22Z" fill="#fff" stroke="#e8c9b8" strokeWidth="2" />}
        <circle cx="32" cy="38" r="16" fill="#c68a4e" /><circle cx="48" cy="34" r="16" fill="#f38dac" />
        <ellipse cx="44" cy="28" rx="5" ry="3" fill="#fff" opacity=".6" />
      </svg>
    )
  }
  const sc = kind === 'cuarto' ? 0.72 : kind === 'medio' ? 0.86 : 1
  const w = 58 * sc
  const h = 44 * sc
  const y0 = 96 - h
  return (
    <svg viewBox="0 0 80 100" className="hl-fmt" aria-hidden="true">
      <circle cx={40 - w * 0.22} cy={y0 - 2} r={w * 0.27} fill="#c68a4e" />
      <circle cx={40 + w * 0.2} cy={y0 - 3} r={w * 0.29} fill="#f38dac" />
      <circle cx={40} cy={y0 - 10 * sc} r={w * 0.26} fill="#a9c76d" />
      <ellipse cx={40 - w * 0.08} cy={y0 - 16 * sc} rx={w * 0.09} ry={w * 0.05} fill="#fff" opacity=".7" />
      <path d={`M${40 - w / 2} ${y0}H${40 + w / 2}L${40 + w * 0.4} 96H${40 - w * 0.4}Z`} fill="#fff" stroke="#e8c9b8" strokeWidth="2" />
      <rect x={40 - w * 0.47} y={y0 + h * 0.28} width={w * 0.94} height={h * 0.3} fill="#f05a7e" />
      <text x="40" y={y0 + h * 0.5} textAnchor="middle" fontSize={12 * sc + 3} fontWeight="900" fill="#fff" style={{ fontFamily: 'system-ui' }}>{kind === 'cuarto' ? '¼' : kind === 'medio' ? '½' : '1 kg'}</text>
    </svg>
  )
}

function Armado() {
  const fmts: { k: 'cucu' | 'vaso' | 'cuarto' | 'medio' | 'kilo'; n: string; g: string; p: string; on?: boolean }[] = [
    { k: 'cucu', n: 'Cucurucho', g: '2 gustos', p: '$ 4.200' },
    { k: 'vaso', n: 'Vasito', g: '2 gustos', p: '$ 3.900' },
    { k: 'cuarto', n: '¼ kg', g: '3 gustos', p: '$ 6.800', on: true },
    { k: 'medio', n: '½ kg', g: '4 gustos', p: '$ 12.500' },
    { k: 'kilo', n: '1 kg', g: '4 gustos', p: '$ 22.000' },
  ]
  return (
    <div className="hl-armado">
      <p className="hl-h2">Armá tu helado</p>
      <div className="hl-fmts">{fmts.map((f) => <div key={f.k} className="hl-fmtcard" data-on={f.on || undefined}><FormatIcon kind={f.k} /><b>{f.n}</b><span>{f.g}</span><span className="hl-p">{f.p}</span></div>)}</div>
      <div className="hl-elegidos">
        <span className="hl-elab">Tus gustos · 3 de 3</span>
        {(['ddl', 'pistacho', 'frutilla'] as Fl[]).map((k) => <span key={k} className="hl-chip"><i style={{ background: FLAVOR[k].base }} />{FLAVOR[k].name}</span>)}
      </div>
      <div className="hl-total"><span>¼ kg · retirás en el mostrador</span><strong>$ 6.800</strong></div>
      <span className="hl-btn block">Agregar al pedido</span>
    </div>
  )
}

function Wordmark({ sm = false }: { sm?: boolean }) {
  return <span className="hl-word" data-sm={sm || undefined}>cop<span className="hl-o">o<svg viewBox="0 0 30 40" aria-hidden="true"><path d="M2 0H28C28 6 24 8 22 12C20 16 22 22 20 28C19 33 15 34 14 30C13 26 15 20 12 16C10 13 8 16 7 12C6 8 2 6 2 0Z" fill="currentColor" /></svg></span></span>
}

export function Store({ mode }: PieceProps) {
  return (
    <IdRoot biz="hela" mode={mode} className="hl">
      <header className="hl-head">
        <Wordmark />
        <span className="hl-tag">helado artesanal</span>
        <nav className="hl-nav"><span data-on>Gustos</span><span>Formatos</span><span>Para llevar</span></nav>
        <span className="hl-demo">DEMO</span>
        <span className="hl-cart">Pedido · $ 6.800</span>
      </header>
      <section className="hl-hero">
        <div className="hl-hero-copy">
          <p className="hl-kicker">24 gustos en la vitrina · hoy</p>
          <p className="hl-title">¿De qué gustos lo querés?</p>
          <p className="hl-lead">Cucurucho, vasito o por kilo. Servido con paleta, como tiene que ser. Lo retirás en el mostrador o te lo enviamos (simulado).</p>
          <div className="hl-ctas"><span className="hl-btn">Armar mi helado</span><span className="hl-btn ghost">Ver la vitrina</span></div>
        </div>
        <div className="hl-hero-art"><ConeArt /></div>
      </section>
      <section className="hl-sec">
        <div className="hl-sec-head"><p className="hl-h2">La vitrina de hoy</p><span className="hl-muted">Tocá una bacha para sumarla</span></div>
        <Vitrina />
      </section>
      <section className="hl-sec"><Armado /></section>
    </IdRoot>
  )
}

export function StoreMobile({ mode }: PieceProps) {
  return (
    <IdRoot biz="hela" mode={mode} className="hl hl-m">
      <header className="hl-mhead"><Wordmark sm /><span className="hl-demo">DEMO</span></header>
      <div className="hl-m-art"><ConeArt compact /></div>
      <div className="hl-m-copy">
        <p className="hl-title">¿De qué gustos lo querés?</p>
        <span className="hl-btn block">Armar mi helado</span>
      </div>
      <div className="hl-m-row"><Vitrina cols={8} /></div>
      <nav className="hl-tabs"><span data-on>Vitrina</span><span>Formatos</span><span>Pedido</span><span>Familia</span></nav>
    </IdRoot>
  )
}

export function Ops({ mode }: PieceProps) {
  const stock: [Fl, number][] = [['ddl', 72], ['choco', 58], ['pistacho', 14], ['frutilla', 46], ['limon', 80], ['maracuya', 0]]
  return (
    <IdRoot biz="hela" mode={mode} className="hl hl-ops">
      <div className="hl-ticket">
        <div className="hl-ticket-h"><b>H-007</b><span>Aceptado</span></div>
        <p className="hl-ticket-f">¼ kg · retira 16:20</p>
        <ul>{(['ddl', 'pistacho', 'frutilla'] as Fl[]).map((k) => <li key={k}><i style={{ background: FLAVOR[k].base }} />{FLAVOR[k].name}</li>)}</ul>
        <p className="hl-ticket-n">Pago en el local pendiente</p>
        <div className="hl-ticket-a"><span className="hl-btn">Listo</span><span className="hl-btn ghost">Incidencia</span></div>
      </div>
      <div className="hl-stock">
        <p className="hl-stock-t">Bachas · kilos restantes</p>
        {stock.map(([k, v]) => (
          <div key={k} className="hl-bar" data-low={v < 20 || undefined}>
            <span>{FLAVOR[k].name}</span>
            <div className="hl-bar-track"><i style={{ width: `${v}%`, background: FLAVOR[k].base }} /></div>
            <b>{v === 0 ? 'Agotado' : v < 20 ? 'Reponer' : `${(v / 20).toFixed(1)} kg`}</b>
          </div>
        ))}
      </div>
    </IdRoot>
  )
}

export function Signature({ mode, play }: SignatureProps) {
  const u = uidOf(useId())
  const jumps: { fl: Fl; r: number; x: number; y: number; dx: number; dy: number; seed: number }[] = [
    { fl: 'ddl', r: 64, x: 300, y: 214, dx: -190, dy: 170, seed: 3 },
    { fl: 'pistacho', r: 56, x: 304, y: 146, dx: 0, dy: 240, seed: 8 },
    { fl: 'frutilla', r: 50, x: 298, y: 88, dx: 190, dy: 296, seed: 5 },
  ]
  return (
    <IdRoot biz="hela" mode={mode} className="hl hl-sig">
      <div className="hl-sig-stage" data-play={play > 0 || undefined} key={play}>
        <svg viewBox="0 0 600 460" className="hl-sig-svg" aria-hidden="true">
          <Defs u={u} />
          <circle cx="300" cy="200" r="190" fill={`url(#${u}-halo)`} />
          <Cone x={300} y={220} s={0.72} u={u} />
          {jumps.map((j, k) => <g key={j.fl} className="hl-jump" style={{ ['--dx' as string]: `${j.dx}px`, ['--dy' as string]: `${j.dy}px`, ['--k' as string]: k } as CSSProperties}><Scoop fl={j.fl} r={j.r} x={j.x} y={j.y} seed={j.seed} u={u} /></g>)}
          <path className="hl-drip" d="M262 236C262 252 260 268 266 276C272 284 278 270 276 256C276 248 274 240 274 236Z" fill="#8a552a" />
        </svg>
        <div className="hl-sig-tubs"><Tub fl="ddl" /><Tub fl="pistacho" /><Tub fl="frutilla" /></div>
        <div className="hl-sig-ticket"><b>H-007</b><span>¼ kg · Aceptado</span><small>Retirás en el mostrador · pago en el local pendiente</small></div>
      </div>
    </IdRoot>
  )
}

export function Gallery({ mode }: PieceProps) {
  return (
    <IdRoot biz="hela" mode={mode} className="hl hl-gallery">
      <div className="hl-g big"><ConeArt label="Cucurucho de tres bochas con baño de chocolate" /></div>
      <div className="hl-g"><Tub fl="ddl" /><span>Bacha con olas de paleta</span></div>
      <div className="hl-g"><Tub fl="pistacho" /><span>Pistacho con trocitos</span></div>
    </IdRoot>
  )
}
