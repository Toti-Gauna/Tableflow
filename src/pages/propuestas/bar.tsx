import { useId, type CSSProperties } from 'react'
import { IdRoot, type PieceProps, type SignatureProps } from './shared'
import './bar.css'

// Taberna Compás · club de jazz y tapas. Gráfica de tapa de disco: dos tintas, semitono SVG y tipografía
// condensada. Sin entradas ni listas (eso es EventOS): la música viene con la mesa reservada.

const uidOf = (s: string) => s.replace(/[:«»]/g, '')

function Halftone({ u, ink }: { u: string; ink: string }) {
  return (
    <defs>
      <pattern id={`${u}-ht1`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><circle cx="3" cy="3" r="1.3" fill={ink} /></pattern>
      <pattern id={`${u}-ht2`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><circle cx="3" cy="3" r="2.3" fill={ink} /></pattern>
      <pattern id={`${u}-ht3`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><circle cx="3" cy="3" r="3.1" fill={ink} /></pattern>
    </defs>
  )
}

/** Contrabajo en semitono: tinta plana + sombras con trama de puntos de tres densidades. */
export function BassArt({ ink = '#121212', tone = '#E39B1B', paper = '#EFE7D6', label }: { ink?: string; tone?: string; paper?: string; label?: string }) {
  const u = uidOf(useId())
  const body = 'M200 250C160 250 132 276 132 318C132 352 150 372 150 400C150 430 120 450 120 500C120 560 160 600 230 600C300 600 340 560 340 500C340 450 310 430 310 400C310 372 328 352 328 318C328 276 300 250 260 250C246 250 238 262 230 262C222 262 214 250 200 250Z'
  return (
    <svg className="bc-bass" viewBox="0 0 460 640" role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      <Halftone u={u} ink={ink} />
      <clipPath id={`${u}-body`}><path d={body} /></clipPath>
      <path d={body} fill={tone} />
      <g clipPath={`url(#${u}-body)`}>
        <path d="M250 240C330 260 360 340 330 420C360 470 370 540 320 610H460V240Z" fill={`url(#${u}-ht2)`} />
        <path d="M290 240C350 270 370 340 345 420C370 480 372 560 330 620H460V240Z" fill={`url(#${u}-ht3)`} />
        <path d="M120 300C150 280 170 300 160 340C150 380 130 400 140 450C130 500 140 560 170 600H100V300Z" fill={`url(#${u}-ht1)`} />
      </g>
      <path d={body} fill="none" stroke={ink} strokeWidth="4" />
      <path d="M188 360C176 380 178 410 196 420C186 430 186 446 196 452" fill="none" stroke={ink} strokeWidth="6" strokeLinecap="round" />
      <path d="M272 360C284 380 282 410 264 420C274 430 274 446 264 452" fill="none" stroke={ink} strokeWidth="6" strokeLinecap="round" />
      <circle cx="188" cy="358" r="5" fill={ink} /><circle cx="196" cy="454" r="5" fill={ink} /><circle cx="272" cy="358" r="5" fill={ink} /><circle cx="264" cy="454" r="5" fill={ink} />
      <path d="M216 40H244L250 420H210Z" fill={ink} />
      <path d="M210 470H250L258 486H202Z" fill={paper} stroke={ink} strokeWidth="3" />
      <path d="M214 520H246L240 590H220Z" fill={ink} />
      {[222, 228, 234, 240].map((x) => <path key={x} d={`M${x} 30L${x - 2 + (x - 231) * 0.3} 520`} stroke={paper} strokeWidth="1.4" opacity=".9" />)}
      <path d="M230 600V636" stroke={ink} strokeWidth="6" />
      <path d="M216 40C206 20 214 0 232 0C254 0 258 24 244 32C236 36 230 28 236 22" fill="none" stroke={ink} strokeWidth="8" strokeLinecap="round" />
      {[[204, 60], [256, 60], [204, 86], [256, 86]].map(([x, y]) => <g key={`${x}${y}`}><path d={`M${x < 230 ? x + 12 : x - 12} ${y}H${x}`} stroke={ink} strokeWidth="5" /><circle cx={x} cy={y} r="7" fill={tone} stroke={ink} strokeWidth="3" /></g>)}
    </svg>
  )
}

/** Cazuelita de bravas y jarra de limonada en dos tintas con semitono. */
function TapasArt({ ink, tone, paper }: { ink: string; tone: string; paper: string }) {
  const u = uidOf(useId())
  return (
    <svg className="bc-tapas" viewBox="0 0 360 220" aria-hidden="true">
      <Halftone u={u} ink={ink} />
      <ellipse cx="130" cy="150" rx="118" ry="40" fill={ink} />
      <ellipse cx="130" cy="138" rx="118" ry="40" fill={tone} />
      <ellipse cx="130" cy="132" rx="96" ry="30" fill={`url(#${u}-ht2)`} />
      {[[80, 118, 10], [104, 108, -12], [128, 120, 18], [150, 106, 4], [174, 118, -20], [98, 132, 30], [140, 134, -8], [168, 134, 14], [120, 102, 40]].map(([x, y, a]) => (
        <g key={`${x}${y}`} transform={`rotate(${a} ${x} ${y})`}><rect x={x - 11} y={y - 9} width="22" height="18" rx="3" fill={paper} stroke={ink} strokeWidth="3" /><rect x={x - 11} y={y - 9} width="22" height="6" rx="3" fill={`url(#${u}-ht1)`} /></g>
      ))}
      <path d="M84 110C104 100 120 116 140 104S176 110 186 102" fill="none" stroke={ink} strokeWidth="6" strokeLinecap="round" />
      {[[96, 124], [132, 112], [160, 126]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="4" fill={paper} stroke={ink} strokeWidth="2" />)}
      <path d="M262 40H322L316 200H268Z" fill={paper} stroke={ink} strokeWidth="4" />
      <path d="M266 92H318L314 196H270Z" fill={tone} />
      <path d="M266 92H318L316 140H268Z" fill={`url(#${u}-ht1)`} />
      <circle cx="320" cy="44" r="18" fill={tone} stroke={ink} strokeWidth="4" />
      <path d="M320 26V62M302 44H338" stroke={ink} strokeWidth="2" />
      <path d="M298 18L284 150" stroke={ink} strokeWidth="5" strokeLinecap="round" />
      <path d="M322 70C344 74 344 120 320 124" fill="none" stroke={ink} strokeWidth="5" />
    </svg>
  )
}

/** Disco con etiqueta de reserva (texto en arco). */
function Record({ lines, spin, className, style }: { lines: [string, string]; spin?: boolean; className?: string; style?: CSSProperties }) {
  const u = uidOf(useId())
  return (
    <svg className={`bc-record ${className ?? ''}`} data-spin={spin || undefined} viewBox="0 0 300 300" aria-hidden="true" style={style}>
      <defs>
        <radialGradient id={`${u}-v`} cx=".5" cy=".5" r=".5"><stop offset=".3" stopColor="#1b1b1b" /><stop offset="1" stopColor="#050505" /></radialGradient>
        <path id={`${u}-arc`} d="M150 150m-58 0a58 58 0 1 1 116 0a58 58 0 1 1-116 0" />
        <path id={`${u}-arc2`} d="M150 150m-44 0a44 44 0 1 0 88 0" />
      </defs>
      <circle cx="150" cy="150" r="148" fill={`url(#${u}-v)`} />
      {Array.from({ length: 22 }, (_, i) => <circle key={i} cx="150" cy="150" r={78 + i * 3.1} fill="none" stroke="#2c2c2c" strokeWidth=".8" />)}
      <path d="M60 70A130 130 0 0 1 230 60" stroke="#fff" strokeWidth="6" opacity=".08" fill="none" strokeLinecap="round" />
      <circle cx="150" cy="150" r="74" fill="var(--mustard)" />
      <circle cx="150" cy="150" r="70" fill="none" stroke="#121212" strokeWidth="1.2" />
      <text fontSize="11.5" fontWeight="800" letterSpacing="2" fill="#121212" style={{ fontFamily: 'var(--display)', fontStretch: '75%' }}><textPath href={`#${u}-arc`} startOffset="0">{lines[0]}</textPath></text>
      <text fontSize="11" fontWeight="700" letterSpacing="1.5" fill="#121212" style={{ fontFamily: 'var(--display)', fontStretch: '75%' }}><textPath href={`#${u}-arc2`} startOffset="50%" textAnchor="middle">{lines[1]}</textPath></text>
      <text x="150" y="146" textAnchor="middle" fontSize="30" fontWeight="900" fill="#121212" style={{ fontFamily: 'var(--display)', fontStretch: '62%' }}>MESA 9</text>
      <text x="150" y="164" textAnchor="middle" fontStyle="italic" fontSize="15" fill="#121212" style={{ fontFamily: 'var(--script)' }}>6 personas</text>
      <circle cx="150" cy="150" r="5" fill="var(--bg)" />
    </svg>
  )
}

const NIGHTS = [
  { d: '22', w: 'JUE', t: 'TRÍO DE JAZZ', a: 'Contrabajo, piano y batería', h: '21:30', k: 'drums' },
  { d: '23', w: 'VIE', t: 'BOSSA Y VINILOS', a: 'Guitarra y voz, discos de la casa', h: '22:00', k: 'grooves' },
  { d: '24', w: 'SÁB', t: 'TANGO DE CÁMARA', a: 'Bandoneón y cuerdas', h: '21:00', k: 'fuelle' },
] as const

function Sleeve({ n, i }: { n: (typeof NIGHTS)[number]; i: number }) {
  return (
    <div className={`bc-sleeve v${i}`}>
      <svg className="bc-sleeve-art" viewBox="0 0 200 124" aria-hidden="true" preserveAspectRatio="xMaxYMid slice">
        {n.k === 'drums' && <g>{[[150, 52, 40], [86, 86, 30], [182, 110, 22]].map(([x, y, r]) => <g key={x}><circle cx={x} cy={y} r={r} fill="none" stroke="currentColor" strokeWidth="10" /><circle cx={x} cy={y} r={r - 16} fill="currentColor" opacity=".25" /></g>)}</g>}
        {n.k === 'grooves' && <g>{Array.from({ length: 9 }, (_, k) => <circle key={k} cx="170" cy="62" r={12 + k * 12} fill="none" stroke="currentColor" strokeWidth="5" />)}</g>}
        {n.k === 'fuelle' && <path d="M60 124L80 60L100 124L120 60L140 124L160 60L180 124L200 60V124Z" fill="currentColor" />}
      </svg>
      <div className="bc-sleeve-top"><span className="bc-day">{n.d}</span><span className="bc-wday">{n.w}<br />{n.h}</span></div>
      <p className="bc-sleeve-t">{n.t}</p>
      <p className="bc-sleeve-a">{n.a}</p>
    </div>
  )
}

function Tracklist() {
  const a: [string, string, string][] = [['A1', 'Patatas bravas', '$ 7.800'], ['A2', 'Croquetas de jamón (4)', '$ 8.900'], ['A3', 'Tabla de quesos', '$ 16.400'], ['A4', 'Pimientos de padrón', '$ 7.200']]
  const b: [string, string, string][] = [['B1', 'Tortilla española', '$ 9.500'], ['B2', 'Pulpo a la gallega', '$ 21.000'], ['B3', 'Montadito de lomo', '$ 9.800']]
  return (
    <div className="bc-tracks">
      <p className="bc-side">Lado A <em>para compartir</em></p>
      <ol>{a.map(([k, n, p]) => <li key={k}><span className="bc-k">{k}</span><span>{n}</span><b>{p}</b></li>)}</ol>
      <p className="bc-side">Lado B <em>de la cocina</em></p>
      <ol>{b.map(([k, n, p]) => <li key={k}><span className="bc-k">{k}</span><span>{n}</span><b>{p}</b></li>)}</ol>
      <p className="bc-bonus"><span className="bc-k">★</span> Bonus track: limonada de jengibre, sin alcohol, en jarra para la mesa · <b>$ 4.900</b></p>
    </div>
  )
}

function Cover({ mode, compact = false }: { mode: 'light' | 'dark'; compact?: boolean }) {
  const ink = mode === 'dark' ? '#05070D' : '#121212'
  return (
    <div className="bc-cover" data-compact={compact || undefined}>
      <div className="bc-cover-type">
        <span className="bc-big a">TAPAS</span>
        <span className="bc-amp">&amp;</span>
        <span className="bc-big b">JAZZ</span>
        {!compact && <p className="bc-cover-sub"><em>Taberna Compás</em> · cocina de barra y música en vivo · jueves a sábados desde las 21</p>}
      </div>
      <div className="bc-cover-art"><BassArt ink={ink} tone={mode === 'dark' ? '#F2B84B' : '#E39B1B'} paper={mode === 'dark' ? '#EFE7D6' : '#EFE7D6'} /></div>
      {!compact && <div className="bc-cover-tapas"><TapasArt ink={ink} tone="#E39B1B" paper="#EFE7D6" /></div>}
    </div>
  )
}

export function Store({ mode }: PieceProps) {
  return (
    <IdRoot biz="bar" mode={mode} className="bc">
      <div className="bc-top"><span className="bc-logo">TABERNA COMPÁS</span><nav><span data-on>Agenda</span><span>Carta</span><span>Reservar mesa</span><span>Mi pedido</span></nav><span className="bc-demo">DEMO</span></div>
      <Cover mode={mode} />
      <section className="bc-sec">
        <p className="bc-h2">Esta semana en vivo</p>
        <div className="bc-sleeves">{NIGHTS.map((n, i) => <Sleeve key={n.d} n={n} i={i} />)}</div>
      </section>
      <section className="bc-sec bc-split">
        <Tracklist />
        <div className="bc-res">
          <Record lines={['TABERNA COMPÁS · JUE 22 · 21:30 · FRENTE AL ESCENARIO · ', 'SOLICITUD DE MESA']} />
          <span className="bc-btn block">Reservar mesa para el jueves</span>
          <p className="bc-small">Sin entradas: reservás la mesa y la música viene con la cena. Grupos de 8 o más los revisa el equipo.</p>
        </div>
      </section>
    </IdRoot>
  )
}

export function StoreMobile({ mode }: PieceProps) {
  return (
    <IdRoot biz="bar" mode={mode} className="bc bc-m">
      <div className="bc-mtop"><span className="bc-logo">TABERNA COMPÁS</span><span className="bc-demo">DEMO</span></div>
      <Cover mode={mode} compact />
      <div className="bc-m-sleeves">{NIGHTS.map((n, i) => <Sleeve key={n.d} n={n} i={i} />)}</div>
      <div className="bc-m-cta"><span className="bc-btn block">Reservar mesa</span></div>
      <nav className="bc-tabs"><span data-on>Agenda</span><span>Carta</span><span>Reservar</span><span>Pedido</span></nav>
    </IdRoot>
  )
}

export function Ops({ mode }: PieceProps) {
  return (
    <IdRoot biz="bar" mode={mode} className="bc bc-ops">
      <div className="bc-ops-col">
        <p className="bc-ops-t">Cocina de barra</p>
        {[['Mesa 9', 'Bravas · Croquetas ×2 · Jarra limonada', 'Aceptado'], ['Barra 3', 'Tortilla española', 'Listo'], ['Mesa 4', 'Pulpo · Montadito', 'En preparación']].map(([m, d, s]) => (
          <div key={m} className="bc-oticket"><b>{m}</b><span>{d}</span><i>{s}</i></div>
        ))}
      </div>
      <div className="bc-ops-col">
        <p className="bc-ops-t">Jue 22 · Trío de jazz · mesas</p>
        <div className="bc-cap"><span>Frente al escenario</span><div><i style={{ width: '83%' }} /></div><b>10 / 12</b></div>
        <div className="bc-cap"><span>Barra</span><div><i style={{ width: '40%' }} /></div><b>4 / 10</b></div>
        <div className="bc-cap"><span>Patio</span><div><i style={{ width: '25%' }} /></div><b>4 / 16</b></div>
        <p className="bc-small">R-031 · 6 personas · escenario · <b>solicitada</b></p>
      </div>
    </IdRoot>
  )
}

export function Signature({ mode, play }: SignatureProps) {
  return (
    <IdRoot biz="bar" mode={mode} className="bc bc-sig">
      <div className="bc-sig-stage" data-play={play > 0 || undefined} key={play}>
        <div className="bc-turntable">
          <div className="bc-sig-sleeve"><span>JUE 22</span><b>TRÍO DE JAZZ</b></div>
          <Record className="bc-sig-record" lines={['TABERNA COMPÁS · JUE 22 · 21:30 · FRENTE AL ESCENARIO · ', 'MESA CONFIRMADA']} spin />
          <svg className="bc-arm" viewBox="0 0 120 220" aria-hidden="true"><circle cx="90" cy="30" r="20" fill="#c9cfd4" stroke="#121212" strokeWidth="3" /><path d="M90 30L70 170L40 196" fill="none" stroke="#c9cfd4" strokeWidth="8" strokeLinecap="round" /><rect x="26" y="186" width="26" height="16" rx="3" fill="#121212" transform="rotate(30 39 194)" /></svg>
        </div>
        <div className="bc-sig-side">
          <div className="bc-eq" aria-hidden="true">{Array.from({ length: 9 }, (_, i) => <i key={i} style={{ ['--k' as string]: i } as CSSProperties} />)}</div>
          <p className="bc-sig-t">MESA 9</p>
          <p className="bc-sig-s"><em>6 personas · frente al escenario</em></p>
          <p className="bc-small">Comanda a cocina de barra: bravas, croquetas ×2, jarra de limonada.</p>
        </div>
      </div>
    </IdRoot>
  )
}

export function Gallery({ mode }: PieceProps) {
  const ink = mode === 'dark' ? '#05070D' : '#121212'
  return (
    <IdRoot biz="bar" mode={mode} className="bc bc-gallery">
      <div className="bc-g big"><BassArt ink={ink} tone="#E39B1B" paper="#EFE7D6" label="Contrabajo en semitono a dos tintas" /></div>
      <div className="bc-g"><Sleeve n={NIGHTS[1]} i={1} /></div>
      <div className="bc-g"><TapasArt ink={ink} tone="#E39B1B" paper="#EFE7D6" /></div>
    </IdRoot>
  )
}
