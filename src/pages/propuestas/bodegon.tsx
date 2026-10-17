import { useId, type CSSProperties } from 'react'
import { IdRoot, type PieceProps, type SignatureProps } from './shared'
import './bodegon.css'

// Mesa Clara · bodegón porteño. Pizarra con tiza (filtro SVG), cartel enlozado, mantel a cuadros,
// pingüino de vino, sifón y la libretita del mozo. Todo el arte es SVG propio.

const uidOf = (s: string) => s.replace(/[:«»]/g, '')

/** Filtro de tiza: grano + leve desplazamiento. Se aplica a texto HTML con `filter: url(#id)`. */
function ChalkFilter({ id }: { id: string }) {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
      <filter id={id} x="-5%" y="-10%" width="110%" height="120%">
        <feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" seed="7" result="n" />
        <feColorMatrix in="n" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 -2.6 2.05" result="m" />
        <feComposite in="SourceGraphic" in2="m" operator="in" result="t" />
        <feDisplacementMap in="t" in2="n" scale="1.6" xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </svg>
  )
}

function Pizarra({ compact = false, chalk }: { compact?: boolean; chalk: string }) {
  const c: CSSProperties = { filter: `url(#${chalk})` }
  return (
    <div className="bd-pizarra" data-compact={compact || undefined}>
      <div className="bd-board">
        <p className="bd-chalk bd-chalk-k" style={c}>Hoy</p>
        <p className="bd-chalk bd-chalk-t" style={c}>Milanesa napolitana con fritas</p>
        <p className="bd-chalk bd-chalk-p" style={c}>$ 20.200</p>
        {!compact && (
          <ul className="bd-chalk-list" style={c}>
            <li><span>Sorrentinos con fileto</span><b>$ 16.500</b></li>
            <li><span>Bife de chorizo</span><b>$ 24.900</b></li>
            <li><span>Flan con dulce de leche</span><b>$ 7.900</b></li>
          </ul>
        )}
        <svg className="bd-chalk-line" viewBox="0 0 300 20" aria-hidden="true" style={c}><path d="M4 12C60 4 120 16 180 8S270 14 296 6" fill="none" stroke="#f1ede2" strokeWidth="3" strokeLinecap="round" /></svg>
        <span className="bd-chalk-stick" aria-hidden="true" />
      </div>
    </div>
  )
}

function Defs({ u }: { u: string }) {
  return (
    <defs>
      <pattern id={`${u}-ging`} width="36" height="36" patternUnits="userSpaceOnUse">
        <rect width="36" height="36" fill="#fbf4e6" />
        <rect width="18" height="36" fill="#c42b22" opacity=".55" />
        <rect width="36" height="18" fill="#c42b22" opacity=".55" />
        <path d="M0 9H36M0 27H36M9 0V36M27 0V36" stroke="#fff" strokeWidth=".6" opacity=".35" />
      </pattern>
      <linearGradient id={`${u}-wall`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#efe0bf" /><stop offset="1" stopColor="#d9c39a" /></linearGradient>
      <linearGradient id={`${u}-wood`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#7c4a29" /><stop offset="1" stopColor="#4b2a16" /></linearGradient>
      <linearGradient id={`${u}-ceramic`} x1="0" x2="1"><stop offset="0" stopColor="#ffffff" /><stop offset=".6" stopColor="#f1ece2" /><stop offset="1" stopColor="#c9c1b3" /></linearGradient>
      <linearGradient id={`${u}-black`} x1="0" x2="1"><stop offset="0" stopColor="#3a3a3a" /><stop offset=".5" stopColor="#141414" /><stop offset="1" stopColor="#000" /></linearGradient>
      <linearGradient id={`${u}-glass`} x1="0" x2="1"><stop offset="0" stopColor="#1f5f8a" /><stop offset=".25" stopColor="#5fa7cf" /><stop offset=".5" stopColor="#2b77a3" /><stop offset=".8" stopColor="#7cc0e0" /><stop offset="1" stopColor="#1c587f" /></linearGradient>
      <linearGradient id={`${u}-chrome`} x1="0" x2="1"><stop offset="0" stopColor="#6d7378" /><stop offset=".3" stopColor="#f3f6f8" /><stop offset=".55" stopColor="#9aa1a7" /><stop offset=".8" stopColor="#eef1f3" /><stop offset="1" stopColor="#5c6166" /></linearGradient>
      <radialGradient id={`${u}-mila`} cx=".4" cy=".35" r=".8"><stop offset="0" stopColor="#e8a650" /><stop offset=".6" stopColor="#c47a2c" /><stop offset="1" stopColor="#8f5219" /></radialGradient>
      <radialGradient id={`${u}-sauce`} cx=".4" cy=".4" r=".7"><stop offset="0" stopColor="#e2452f" /><stop offset="1" stopColor="#a5221a" /></radialGradient>
      <radialGradient id={`${u}-bread`} cx=".4" cy=".3" r=".8"><stop offset="0" stopColor="#f4c57c" /><stop offset=".6" stopColor="#d79446" /><stop offset="1" stopColor="#9c5c1f" /></radialGradient>
      <radialGradient id={`${u}-ham`} cx=".4" cy=".3" r=".8"><stop offset="0" stopColor="#b35a3c" /><stop offset=".7" stopColor="#7a2c1a" /><stop offset="1" stopColor="#4a170c" /></radialGradient>
      <filter id={`${u}-soft`} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="5" /></filter>
    </defs>
  )
}

function Penguin({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  const u = uidOf(useId())
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Defs u={u} />
      <ellipse cx="4" cy="232" rx="66" ry="12" fill="#000" opacity=".22" filter={`url(#${u}-soft)`} />
      <path d="M58 70C96 76 102 150 66 168" fill="none" stroke={`url(#${u}-black)`} strokeWidth="14" strokeLinecap="round" />
      <path d="M0 34C40 34 62 74 64 130C66 186 46 230 0 232C-46 230-66 186-64 130C-62 74-40 34 0 34Z" fill={`url(#${u}-black)`} />
      <path d="M-10 64C18 64 36 96 36 140C36 188 22 222-6 224C-34 222-46 190-44 146C-42 100-34 64-10 64Z" fill={`url(#${u}-ceramic)`} />
      <path d="M0 0C24 0 38 18 38 40C38 56 30 66 20 72H-22C-32 64-38 54-38 40C-38 18-24 0 0 0Z" fill={`url(#${u}-black)`} />
      <path d="M-34 30L-70 40L-34 50Z" fill="#f29a2e" /><path d="M-34 30L-70 40L-50 38Z" fill="#ffc06b" />
      <circle cx="-14" cy="30" r="8" fill="#fff" /><circle cx="-16" cy="30" r="4" fill="#111" /><circle cx="-17" cy="28" r="1.4" fill="#fff" />
      <path d="M-30 150C-34 186-20 214-2 220" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" opacity=".6" />
      <path d="M20 10C28 16 32 26 32 36" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity=".35" />
      <path d="M-20 228C-12 238 14 238 22 228" fill="#f29a2e" />
    </g>
  )
}

function Sifon({ x, y, s = 1, className }: { x: number; y: number; s?: number; className?: string }) {
  const u = uidOf(useId())
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} className={className}>
      <Defs u={u} />
      <ellipse cx="0" cy="262" rx="48" ry="10" fill="#000" opacity=".22" filter={`url(#${u}-soft)`} />
      <path d="M-40 70C-40 56-30 50-18 50H18C30 50 40 56 40 70V250C40 258 34 262 26 262H-26C-34 262-40 258-40 250Z" fill={`url(#${u}-glass)`} opacity=".95" />
      {[-26, -10, 6, 22].map((xx) => <path key={xx} d={`M${xx} 64V252`} stroke="#bfe6f7" strokeWidth="3" opacity=".35" />)}
      <path d="M-30 70V246" stroke="#fff" strokeWidth="6" strokeLinecap="round" opacity=".55" />
      <path d="M2 40V244" stroke="#d9eef7" strokeWidth="3" opacity=".7" />
      <path d="M-22 4H22L26 44C26 50 22 54 16 54H-16C-22 54-26 50-26 44Z" fill={`url(#${u}-chrome)`} />
      <path d="M-22 12H-70C-76 12-78 18-74 22L-62 30H-26" fill={`url(#${u}-chrome)`} />
      <path d="M8 6C20-14 44-18 58-10C62-8 60-2 56-2C42-6 28-2 18 10Z" fill={`url(#${u}-chrome)`} />
      <rect x="-24" y="-4" width="48" height="12" rx="5" fill={`url(#${u}-chrome)`} />
      <path d="M-18 20H18" stroke="#fff" strokeWidth="2" opacity=".8" />
    </g>
  )
}

function Bread({ x, y, r = 0 }: { x: number; y: number; r?: number }) {
  const u = uidOf(useId())
  return (
    <g transform={`translate(${x} ${y}) rotate(${r})`}>
      <Defs u={u} />
      <path d="M-40 0C-40-20-20-30 0-30C20-30 40-20 40 0C40 14 20 18 0 18C-20 18-40 14-40 0Z" fill={`url(#${u}-bread)`} />
      {[-20, -4, 12].map((xx) => <path key={xx} d={`M${xx} -20C${xx + 6} -12 ${xx + 8} -6 ${xx + 6} 2`} stroke="#fbe2b0" strokeWidth="4" strokeLinecap="round" fill="none" />)}
      <path d="M-30-14C-20-24 0-26 14-24" stroke="#fff" strokeWidth="3" opacity=".35" strokeLinecap="round" fill="none" />
    </g>
  )
}

/** Plato: milanesa napolitana (empanado, salsa, jamón, muzzarella gratinada, orégano) con papas fritas. */
function Napo({ x, y, s = 1, className }: { x: number; y: number; s?: number; className?: string }) {
  const u = uidOf(useId())
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} className={className}>
      <Defs u={u} />
      <ellipse cx="0" cy="18" rx="168" ry="56" fill="#000" opacity=".18" filter={`url(#${u}-soft)`} />
      <ellipse cx="0" cy="0" rx="162" ry="58" fill={`url(#${u}-ceramic)`} />
      <ellipse cx="0" cy="-2" rx="126" ry="42" fill="#f3eee4" />
      <ellipse cx="0" cy="0" rx="161" ry="57" fill="none" stroke="#c42b22" strokeWidth="2.2" opacity=".6" />
      <path d="M-138-4C-144-32-102-52-56-50C-10-56 40-46 58-26C72-10 64 18 30 30C-6 42-68 40-104 28C-128 20-134 10-138-4Z" fill={`url(#${u}-mila)`} stroke="#8a4c16" strokeWidth="2" />
      {Array.from({ length: 70 }, (_, i) => {
        const cx = -132 + ((i * 53) % 186)
        const cy = -44 + ((i * 31) % 78)
        return <ellipse key={i} cx={cx} cy={cy} rx={1.6 + (i % 4) * 0.6} ry={1.1 + (i % 3) * 0.4} fill={i % 3 === 0 ? '#fbd38a' : i % 3 === 1 ? '#a85e1c' : '#e7a24a'} opacity=".85" />
      })}
      <path d="M-122-6C-126-26-94-40-56-38C-18-44 28-36 42-22C54-8 46 12 20 21C-10 31-64 30-96 20C-112 14-118 6-122-6Z" fill={`url(#${u}-sauce)`} />
      <path d="M-120-2C-128 4-126 12-118 10M42-16C52-14 52-6 46-4M-30 28C-28 36-20 36-20 28" stroke="#b5271c" strokeWidth="5" strokeLinecap="round" fill="none" />
      <path d="M-104-10C-102-26-68-32-40-28C-12-30 16-24 24-12C30 0 22 12 0 16C-26 22-70 20-90 12C-100 8-106 2-104-10Z" fill="#ef9f9a" />
      <path d="M-92-18C-70-24-40-24-14-20M-96 4C-74 12-40 12-12 8" stroke="#fbd0cb" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M-98-6C-98-22-70-28-46-25C-28-32-2-28 12-18C20-10 18 4 2 9C-14 14-34 10-48 15C-64 20-82 16-92 8C-97 4-98 0-98-6Z" fill="#fbe8b8" />
      <path d="M-60 14C-60 22-54 26-50 20M-20 10C-18 18-12 20-10 13" stroke="#fbe8b8" strokeWidth="6" strokeLinecap="round" fill="none" />
      {[[-80, -10, 7, 4], [-62, -18, 5, 3], [-44, -8, 8, 4.5], [-24, -18, 6, 3.5], [-6, -6, 5, 3], [-70, 4, 6, 3], [-36, 4, 5, 2.6], [-14, 2, 4, 2.4], [-54, -2, 3, 2], [-88, -2, 4, 2.4], [2, -14, 4, 2.2]].map(([a, b, rx, ry]) => <ellipse key={`${a}${b}`} cx={a} cy={b} rx={rx} ry={ry} fill={rx > 6 ? '#b8691f' : '#d99a42'} opacity=".9" />)}
      {[[-74, -14], [-30, -12], [-50, 8], [-10, -10]].map(([a, b]) => <ellipse key={`h${a}`} cx={a} cy={b} rx="3" ry="1.6" fill="#fff" opacity=".7" />)}
      {Array.from({ length: 22 }, (_, i) => {
        const ox = -92 + ((i * 29) % 108)
        const oy = -24 + ((i * 17) % 36)
        return <rect key={`o${i}`} x={ox} y={oy} width="3.4" height="1.6" fill="#35591f" transform={`rotate(${i * 40} ${ox} ${oy})`} />
      })}
      <g>
        {Array.from({ length: 16 }, (_, i) => {
          const fx = 50 + (i % 6) * 14 - (i > 9 ? 20 : 0)
          const fy = -30 + Math.floor(i / 6) * 14
          const a = -30 + ((i * 47) % 70)
          return <g key={i} transform={`rotate(${a} ${fx} ${fy})`}><rect x={fx} y={fy} width="56" height="10" rx="3" fill="#f3c557" /><rect x={fx} y={fy} width="56" height="3" rx="1.5" fill="#ffe7a1" /><rect x={fx + 48} y={fy} width="8" height="10" rx="3" fill="#c98a2b" /></g>
        })}
      </g>
      <path d="M-120 22C-110 10-92 8-84 18C-92 30-110 34-120 22Z" fill="#f6e15b" /><path d="M-118 22C-110 14-96 12-88 18" stroke="#fff" strokeWidth="2" fill="none" />
    </g>
  )
}

function Jamon({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  const u = uidOf(useId())
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Defs u={u} />
      <path d="M0-60V0" stroke="#a88b5a" strokeWidth="2" />
      <path d="M-6 0H6L8 14C30 20 40 60 30 100C22 126 4 138-6 134C-26 128-36 96-30 60C-26 34-18 18-8 14Z" fill={`url(#${u}-ham)`} />
      <path d="M-24 70C-20 100-6 122 8 126" stroke="#f1d6b0" strokeWidth="6" fill="none" strokeLinecap="round" opacity=".75" />
      <path d="M10 30C20 50 22 70 18 90" stroke="#fff" strokeWidth="3" fill="none" opacity=".25" strokeLinecap="round" />
    </g>
  )
}

function Banderines({ width = 640, y = 0 }: { width?: number; y?: number }) {
  const cols = ['#c42b22', '#f6ecd6', '#2c6e8e', '#f2b23a', '#3d7a4a']
  const n = Math.round(width / 46)
  return (
    <g transform={`translate(0 ${y})`}>
      <path d={`M0 6Q${width / 2} 30 ${width} 6`} stroke="#5a3a22" strokeWidth="2" fill="none" />
      {Array.from({ length: n }, (_, i) => {
        const x = 10 + i * 46
        const t = x / width
        const yy = 6 + 4 * 24 * t * (1 - t)
        return <path key={i} d={`M${x} ${yy}H${x + 34}L${x + 17} ${yy + 34}Z`} fill={cols[i % cols.length]} />
      })}
    </g>
  )
}

/** Ilustración firma: naturaleza muerta de bodegón. */
export function BodegonArt({ label, compact = false }: { label?: string; compact?: boolean }) {
  const u = uidOf(useId())
  return (
    <svg className="bd-art" viewBox="0 0 640 560" role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      <Defs u={u} />
      <rect x="0" y="0" width="640" height="560" fill={`url(#${u}-wall)`} />
      <rect x="0" y="230" width="640" height="90" fill={`url(#${u}-wood)`} />
      <rect x="0" y="226" width="640" height="8" fill="#9c6a3e" />
      {!compact && <><Jamon x={70} y={70} s={0.9} /><Jamon x={570} y={60} s={1} /></>}
      <rect x="250" y="40" width="140" height="110" rx="4" fill="#4b2a16" />
      <rect x="260" y="50" width="120" height="90" fill="#d9c9a8" />
      <path d="M268 132L300 90L322 116L340 98L372 132Z" fill="#8a7a5a" opacity=".7" /><circle cx="350" cy="72" r="10" fill="#b2a27e" />
      <Banderines width={640} y={4} />
      <Penguin x={150} y={150} s={0.95} />
      <Sifon x={470} y={130} s={0.95} />
      <path d="M0 360H640V560H0Z" fill={`url(#${u}-ging)`} />
      <path d="M0 360H640" stroke="#fff" strokeWidth="2" opacity=".4" />
      <path d="M0 356C80 366 160 350 240 362S400 350 480 362S600 354 640 360V372H0Z" fill="#000" opacity=".1" />
      <g transform="translate(110 400)">
        <ellipse cx="0" cy="18" rx="74" ry="20" fill="#7a4a1e" />
        <path d="M-74 12C-74 0-40-8 0-8S74 0 74 12V20C74 34 40 40 0 40S-74 34-74 20Z" fill="#b07c3d" />
        {Array.from({ length: 9 }, (_, i) => <path key={i} d={`M${-64 + i * 16} 4V36`} stroke="#7a4a1e" strokeWidth="2" opacity=".5" />)}
        <Bread x={-22} y={-4} r={-12} /><Bread x={26} y={-10} r={10} />
      </g>
      <Napo x={372} y={468} s={1.12} />
      <g transform="translate(560 440)">
        <path d="M-26-60H26L20 30H-20Z" fill="#e6f4fa" opacity=".5" stroke="#fff" strokeWidth="1.5" />
        <path d="M-23-30H23L20 30H-20Z" fill="#d6ecf6" opacity=".55" />
        {[[-8, 10], [6, -6], [-2, -18], [10, 16], [-12, -4]].map(([a, b]) => <circle key={`${a}${b}`} cx={a} cy={b} r="2" fill="#fff" opacity=".85" />)}
        <path d="M-18-54L-14 26" stroke="#fff" strokeWidth="4" opacity=".6" strokeLinecap="round" />
      </g>
      <g transform="translate(560 528) rotate(-8)"><rect x="-70" y="-5" width="140" height="10" rx="5" fill="#cfd4d8" /><rect x="-70" y="-5" width="60" height="10" rx="5" fill="#4b2a16" /></g>
    </svg>
  )
}

function Libreta({ title, lines, foot }: { title: string; lines: string[]; foot?: string }) {
  return (
    <div className="bd-libreta">
      <div className="bd-espiral" aria-hidden="true">{Array.from({ length: 9 }, (_, i) => <i key={i} />)}</div>
      <p className="bd-lib-t">{title}</p>
      {lines.map((l) => <p key={l} className="bd-hand">{l}</p>)}
      {foot && <p className="bd-lib-f">{foot}</p>}
    </div>
  )
}

const CARTA: [string, [string, string][]][] = [
  ['Minutas', [['Milanesa de ternera', '$ 18.500'], ['Milanesa napolitana', '$ 20.200'], ['Suprema de pollo', '$ 17.200'], ['Revuelto Gramajo', '$ 15.400']]],
  ['Pastas', [['Sorrentinos de jamón y queso', '$ 16.500'], ['Ñoquis de papa', '$ 14.800'], ['Ravioles de verdura', '$ 15.200'], ['Lasagna boloñesa', '$ 17.400']]],
  ['Parrilla', [['Bife de chorizo', '$ 24.900'], ['Asado de tira', '$ 23.500'], ['Provoleta', '$ 12.500'], ['Mollejas crocantes', '$ 16.900']]],
]

function Carta() {
  return (
    <div className="bd-carta">
      <p className="bd-carta-h">La carta</p>
      <div className="bd-carta-cols">
        {CARTA.map(([cat, items]) => (
          <section key={cat}>
            <p className="bd-cat">{cat}</p>
            <ul>{items.map(([n, p]) => <li key={n}><span>{n}</span><i /><b>{p}</b></li>)}</ul>
          </section>
        ))}
      </div>
      <p className="bd-carta-f">Postres: flan casero con dulce de leche $ 7.900 · vigilante $ 7.200 · panqueque $ 7.500</p>
    </div>
  )
}

function Cartel({ sm = false }: { sm?: boolean }) {
  return (
    <div className="bd-cartel" data-sm={sm || undefined}>
      <span className="bd-cartel-n">MESA CLARA</span>
      {!sm && <span className="bd-cartel-s">Comidas · Vinos · Desde el mediodía</span>}
    </div>
  )
}

export function Store({ mode }: PieceProps) {
  const chalk = `${uidOf(useId())}-chalk`
  return (
    <IdRoot biz="resto" mode={mode} className="bd">
      <ChalkFilter id={chalk} />
      <header className="bd-head">
        <Cartel />
        <nav className="bd-nav"><span data-on>La carta</span><span>Reservar mesa</span><span>Pedir a la mesa</span><span>Mi pedido · 2</span></nav>
        <span className="bd-demo">DEMO</span>
      </header>
      <section className="bd-hero">
        <div className="bd-hero-l">
          <Pizarra chalk={chalk} />
          <div className="bd-ctas"><span className="bd-btn">Reservar una mesa</span><span className="bd-btn ghost">Ver la carta</span></div>
        </div>
        <div className="bd-hero-r"><BodegonArt />
          <Libreta title="Mesa para 4 · lun 19 · 21:45" lines={['4 personas, salón', 'Cumpleaños de la abuela']} foot="Solicitud enviada: el encargado la confirma" />
        </div>
      </section>
      <div className="bd-guarda" aria-hidden="true"><svg viewBox="0 0 1200 50" preserveAspectRatio="none"><Banderines width={1200} y={4} /></svg></div>
      <section className="bd-body"><Carta /></section>
    </IdRoot>
  )
}

export function StoreMobile({ mode }: PieceProps) {
  const chalk = `${uidOf(useId())}-chalk`
  return (
    <IdRoot biz="resto" mode={mode} className="bd bd-m">
      <ChalkFilter id={chalk} />
      <header className="bd-mhead"><Cartel sm /><span className="bd-demo">DEMO</span></header>
      <div className="bd-m-art"><BodegonArt compact /></div>
      <div className="bd-m-board"><Pizarra compact chalk={chalk} /></div>
      <div className="bd-m-ctas"><span className="bd-btn block">Reservar una mesa</span></div>
      <nav className="bd-tabs"><span data-on>Pizarra</span><span>Carta</span><span>Reservar</span><span>Pedido</span></nav>
    </IdRoot>
  )
}

export function Ops({ mode }: PieceProps) {
  const tickets = [
    { t: 'Mesa 4 · 13:10', l: ['1 napo c/ fritas', '1 sorrentinos fileto', '1 provoleta s/ orégano'], s: 'En preparación' },
    { t: 'Mesa 7 · 13:02', l: ['2 bife de chorizo', 'jugoso / a punto', '1 ensalada mixta'], s: 'Aceptado' },
    { t: 'Mesa 2 · 12:55', l: ['1 flan c/ dulce', '2 cafés'], s: 'Listo' },
  ]
  return (
    <IdRoot biz="resto" mode={mode} className="bd bd-ops">
      <p className="bd-ops-t">Cocina · comandas</p>
      <div className="bd-rail">
        {tickets.map((k) => (
          <div key={k.t} className="bd-comanda">
            <span className="bd-clip" aria-hidden="true" />
            <p className="bd-com-t">{k.t}</p>
            {k.l.map((x) => <p key={x} className="bd-hand sm">{x}</p>)}
            <span className="bd-com-s">{k.s}</span>
          </div>
        ))}
      </div>
    </IdRoot>
  )
}

export function Signature({ mode, play }: SignatureProps) {
  const u = uidOf(useId())
  return (
    <IdRoot biz="resto" mode={mode} className="bd bd-sig">
      <div className="bd-sig-stage" data-play={play > 0 || undefined} key={play}>
        <div className="bd-sig-lib">
          <Libreta title="Mesa 4" lines={['1 napo c/ fritas', '1 sorrentinos fileto', '1 sifón']} foot="Comanda C-0123 · en cocina" />
        </div>
        <svg viewBox="0 0 640 420" className="bd-sig-svg" aria-hidden="true">
          <Defs u={u} />
          <rect x="0" y="0" width="640" height="420" fill={`url(#${u}-ging)`} />
          <Sifon x={520} y={-10} s={0.8} className="bd-sig-sifon" />
          <path className="bd-jet" d="M466 0C440 10 420 40 410 90" fill="none" stroke="#e8f6fc" strokeWidth="5" strokeLinecap="round" />
          <g transform="translate(400 150)"><path d="M-26-50H26L20 40H-20Z" fill="#e6f4fa" opacity=".6" stroke="#fff" strokeWidth="1.5" /><path className="bd-soda" d="M-22-10H22L20 40H-20Z" fill="#d6ecf6" /></g>
          <g className="bd-sig-plate"><Napo x={250} y={290} s={1} /></g>
        </svg>
      </div>
    </IdRoot>
  )
}

export function Gallery({ mode }: PieceProps) {
  const chalk = `${uidOf(useId())}-chalk`
  return (
    <IdRoot biz="resto" mode={mode} className="bd bd-gallery">
      <ChalkFilter id={chalk} />
      <div className="bd-g big"><BodegonArt label="Naturaleza muerta de bodegón: pingüino, sifón, panera y milanesa napolitana" /></div>
      <div className="bd-g"><Pizarra compact chalk={chalk} /></div>
      <div className="bd-g"><svg viewBox="-80 -10 160 260" className="bd-g-svg" aria-hidden="true"><Penguin x={0} y={0} s={0.95} /></svg><span>Pingüino de vino</span></div>
    </IdRoot>
  )
}
