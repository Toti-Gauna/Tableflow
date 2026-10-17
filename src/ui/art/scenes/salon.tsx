import { useId } from 'react'

// Ritual Café · ilustración firma (P5-L2b, aprobada): salón bajo el vitral, filete porteño y la mesa servida.
// La usan la app (inicio, portada, galería) y el estudio de identidades.

export const uidOf = (s: string) => s.replace(/[:«»]/g, '')

/** Esquina de filete porteño: voluta dorada, hojas de acanto, flor roja y toques de luz. Simétrica sobre la diagonal. */
export function FileteCorner({ size = 120, className, draw }: { size?: number; className?: string; draw?: boolean }) {
  const u = uidOf(useId())
  const leaf = (
    <g>
      <path d="M22 20C52 6 98 4 150 16C122 24 98 31 72 27C54 25 36 29 22 20Z" fill={`url(#${u}-leaf)`} stroke="#10140f" strokeWidth="1.1" />
      <path d="M40 19C64 13 98 11 132 16" fill="none" stroke="#cfe6b8" strokeWidth="1.2" strokeLinecap="round" opacity=".85" />
      <path d="M58 25C70 18 84 16 96 18M84 26C96 20 110 18 122 19" fill="none" stroke="#173a24" strokeWidth=".9" opacity=".8" />
      <path d="M118 15C128 6 140 4 150 6C146 12 136 16 124 17Z" fill={`url(#${u}-leaf)`} stroke="#10140f" strokeWidth="1" />
      {[[56, 14, -18], [80, 11, -10], [104, 11, -4]].map(([x, y, a]) => <path key={x} d={`M${x} ${y}c4-8 12-10 18-8-3 6-9 9-18 8z`} transform={`rotate(${a} ${x} ${y})`} fill="#5f9a52" stroke="#10140f" strokeWidth=".8" />)}
      <path d="M150 16c4 4 4 10-1 12-4 2-7-2-5-5 2-2 4 0 3 2" fill="none" stroke={`url(#${u}-gold)`} strokeWidth="2.4" strokeLinecap="round" />
    </g>
  )
  return (
    <svg className={`cf-filete ${className ?? ''}`} data-draw={draw || undefined} viewBox="0 0 160 160" width={size} height={size} aria-hidden="true">
      <defs>
        <linearGradient id={`${u}-gold`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fbe7a6" /><stop offset=".45" stopColor="#c9a24e" /><stop offset=".7" stopColor="#8a6424" /><stop offset="1" stopColor="#e8c977" /></linearGradient>
        <linearGradient id={`${u}-leaf`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#7fb069" /><stop offset=".55" stopColor="#2f6b3e" /><stop offset="1" stopColor="#173a24" /></linearGradient>
        <radialGradient id={`${u}-rose`} cx=".4" cy=".35" r=".7"><stop offset="0" stopColor="#ff8a7a" /><stop offset=".5" stopColor="#c8212f" /><stop offset="1" stopColor="#6e0f19" /></radialGradient>
      </defs>
      {leaf}
      <g transform="matrix(0 1 1 0 0 0)">{leaf}</g>
      <path d="M20 26C26 64 54 84 82 80C100 77 106 62 100 54" fill="none" stroke="#9fd0e8" strokeWidth="7" strokeLinecap="round" opacity=".9" />
      <path d="M20 26C26 64 54 84 82 80C100 77 106 62 100 54" fill="none" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" opacity=".95" />
      <path className="cf-voluta" d="M16 16C16 70 52 98 86 90C114 83 118 52 98 43C82 36 66 49 74 61C80 70 93 66 93 57" fill="none" stroke={`url(#${u}-gold)`} strokeWidth="5.5" strokeLinecap="round" />
      <path className="cf-voluta" d="M90 92C98 110 92 126 78 128C66 130 62 118 70 114" fill="none" stroke={`url(#${u}-gold)`} strokeWidth="3.6" strokeLinecap="round" />
      <path className="cf-voluta" d="M92 90C110 98 126 92 128 78C130 66 118 62 114 70" fill="none" stroke={`url(#${u}-gold)`} strokeWidth="3.6" strokeLinecap="round" />
      <path className="cf-voluta" d="M16 16C16 70 52 98 86 90C114 83 118 52 98 43C82 36 66 49 74 61C80 70 93 66 93 57" fill="none" stroke="#fff6d8" strokeWidth="1.1" strokeLinecap="round" opacity=".9" transform="translate(-1.2 -1.2)" />
      <g transform="translate(40 40)">
        {[0, 60, 120, 180, 240, 300].map((a) => <ellipse key={a} cx="0" cy="-9" rx="6.5" ry="10" transform={`rotate(${a})`} fill={`url(#${u}-rose)`} stroke="#3d0710" strokeWidth=".8" />)}
        <circle r="6" fill="#ffd36b" stroke="#6b3f05" strokeWidth=".8" />
        <path d="M-3-4c2-2 5-1 6 1" fill="none" stroke="#fff" strokeWidth="1" strokeLinecap="round" />
        {[30, 150, 270].map((a) => <path key={a} d="M0-14c2-3 5-3 6 0" transform={`rotate(${a})`} fill="none" stroke="#ffe1d8" strokeWidth=".9" strokeLinecap="round" />)}
      </g>
      {[[108, 30], [30, 108], [70, 70]].map(([x, y]) => <g key={`${x}-${y}`}><circle cx={x} cy={y} r="4" fill="#2a64b0" stroke="#0b1d3a" strokeWidth=".8" /><circle cx={x - 1.3} cy={y - 1.3} r="1.2" fill="#fff" /></g>)}
    </svg>
  )
}

/** Guarda horizontal: cinta dorada con volutas simétricas y una gema al centro. */
export function FileteRule({ width = 360 }: { width?: number }) {
  const u = uidOf(useId())
  return (
    <svg className="cf-rule" viewBox="0 0 360 40" width={width} height={width / 9} aria-hidden="true">
      <defs><linearGradient id={`${u}-g`} x1="0" x2="1"><stop offset="0" stopColor="#8a6424" /><stop offset=".5" stopColor="#f1d98f" /><stop offset="1" stopColor="#8a6424" /></linearGradient></defs>
      <path d="M8 20H140C150 20 154 8 166 8C176 8 178 20 170 22C164 24 160 16 166 14M352 20H220C210 20 206 8 194 8C184 8 182 20 190 22C196 24 200 16 194 14" fill="none" stroke={`url(#${u}-g)`} strokeWidth="2.6" strokeLinecap="round" />
      <path d="M150 28C160 34 200 34 210 28" fill="none" stroke={`url(#${u}-g)`} strokeWidth="1.6" strokeLinecap="round" />
      <path d="M180 10l9 10-9 10-9-10z" fill="#c8212f" stroke="#5a0b13" strokeWidth="1" /><path d="M177 15l3-3 3 3" fill="none" stroke="#fff" strokeWidth="1" />
    </svg>
  )
}

/** Vitral en arco: abanico emplomado con vidrios translúcidos y luz detrás. */
export function Vitral({ u }: { u: string }) {
  const cx = 210
  const cy = 300
  const rings = [0, 62, 132, 230]
  const n = 9
  const colors = ['#e0a84a', '#5e8f6e', '#9e2b35', '#2e5a8c', '#f3e3b5']
  const cells: { d: string; c: string }[] = []
  for (let j = 0; j < rings.length - 1; j++) {
    for (let i = 0; i < n; i++) {
      const a0 = Math.PI + (i / n) * Math.PI
      const a1 = Math.PI + ((i + 1) / n) * Math.PI
      const [r0, r1] = [rings[j], rings[j + 1]]
      const p = (r: number, a: number) => `${(cx + r * Math.cos(a)).toFixed(1)} ${(cy + r * Math.sin(a)).toFixed(1)}`
      const d = r0 === 0 ? `M${cx} ${cy}L${p(r1, a0)}A${r1} ${r1} 0 0 1 ${p(r1, a1)}Z` : `M${p(r0, a0)}L${p(r1, a0)}A${r1} ${r1} 0 0 1 ${p(r1, a1)}L${p(r0, a1)}A${r0} ${r0} 0 0 0 ${p(r0, a0)}Z`
      const c = j === 0 ? (i % 2 ? '#e0a84a' : '#f3d38a') : j === 1 ? colors[(i + 1) % 4] : colors[(i * 3 + 2) % 5]
      cells.push({ d, c })
    }
  }
  return (
    <g>
      <clipPath id={`${u}-arch`}><path d="M20 300V150C20 36 400 36 400 150V300Z" /></clipPath>
      <g clipPath={`url(#${u}-arch)`}>
        <rect x="0" y="0" width="420" height="300" fill="#f6e7c4" />
        {cells.map((c, k) => <path key={k} d={c.d} fill={c.c} opacity=".88" />)}
        <rect x="0" y="0" width="420" height="300" fill={`url(#${u}-glow)`} />
        {cells.map((c, k) => <path key={`l${k}`} d={c.d} fill="none" stroke="#24150f" strokeWidth="3.2" strokeLinejoin="round" />)}
        <path d="M60 300C80 210 150 180 210 178C270 180 340 210 360 300" fill="none" stroke="#24150f" strokeWidth="4" />
        <path d="M110 300C118 250 160 226 210 226C260 226 302 250 310 300" fill="none" stroke="#24150f" strokeWidth="3" />
        {[[120, 120], [300, 120], [210, 84]].map(([x, y]) => <g key={x}><circle cx={x} cy={y} r="13" fill="#9e2b35" stroke="#24150f" strokeWidth="3" /><circle cx={x - 4} cy={y - 4} r="3.5" fill="#ffd6c2" opacity=".8" /></g>)}
      </g>
      <path d="M20 300V150C20 36 400 36 400 150V300" fill="none" stroke={`url(#${u}-goldf)`} strokeWidth="12" />
      <path d="M20 300V150C20 36 400 36 400 150V300" fill="none" stroke="#fff3c8" strokeWidth="1.5" opacity=".7" transform="translate(0 -4)" />
    </g>
  )
}

export function Medialuna({ x, y, s = 1, r = 0, u }: { x: number; y: number; s?: number; r?: number; u: string }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
      <ellipse cx="60" cy="54" rx="58" ry="9" fill="#000" opacity=".18" />
      <path d="M6 46C10 14 48 2 60 3C74 2 112 14 116 46C112 55 99 57 93 50C85 30 36 30 28 50C22 57 10 55 6 46Z" fill={`url(#${u}-ml)`} stroke="#7a3f10" strokeWidth="1.3" />
      <path d="M24 22C30 30 32 38 30 47M42 10C46 22 48 30 46 37M60 4C60 15 60 23 60 31M78 10C74 22 72 30 74 37M96 22C90 30 88 38 90 47" fill="none" stroke="#8a4a14" strokeWidth="1.6" strokeLinecap="round" opacity=".75" />
      <path d="M22 26C34 14 50 9 60 8C72 8 88 14 100 26" fill="none" stroke="#fff4d6" strokeWidth="2.4" strokeLinecap="round" opacity=".55" />
      <path d="M36 16C42 12 48 11 52 11M70 11C76 11 82 13 86 16" fill="none" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" opacity=".7" />
      <ellipse cx="8" cy="47" rx="5" ry="4" fill="#9a5216" /><ellipse cx="113" cy="47" rx="5" ry="4" fill="#9a5216" />
    </g>
  )
}

/** Mesa de mármol con bandeja de alpaca, taza de café con leche, medialunas y vaso de soda. */
export function Table({ u }: { u: string }) {
  return (
    <g>
      <ellipse cx="300" cy="344" rx="284" ry="80" fill="#2a1710" />
      <ellipse cx="300" cy="332" rx="284" ry="80" fill={`url(#${u}-marble)`} />
      <g clipPath={`url(#${u}-tableclip)`} fill="none" stroke="#8b7f71" strokeWidth="1.2" opacity=".35">
        <path d="M40 300C120 330 160 290 240 320S380 300 470 340" /><path d="M120 380C200 350 260 380 330 350S470 380 560 340" /><path d="M300 262C320 290 300 310 340 330" />
      </g>
      <clipPath id={`${u}-tableclip`}><ellipse cx="300" cy="332" rx="284" ry="80" /></clipPath>
      <g className="cf-tray">
        <ellipse cx="300" cy="330" rx="214" ry="54" fill="#5b544b" opacity=".35" transform="translate(4 8)" />
        <ellipse cx="300" cy="322" rx="214" ry="54" fill={`url(#${u}-silver)`} />
        <ellipse cx="300" cy="320" rx="196" ry="46" fill={`url(#${u}-silverIn)`} />
        <ellipse cx="300" cy="322" rx="213" ry="53" fill="none" stroke="#fdfcf9" strokeWidth="1.6" opacity=".8" />
        <g>
          <ellipse cx="216" cy="312" rx="82" ry="20" fill={`url(#${u}-porc)`} stroke="#c9a24e" strokeWidth="2" />
          <ellipse cx="216" cy="310" rx="54" ry="12" fill="#e8e1d6" />
          <path d="M150 300C178 318 250 320 276 306" fill="none" stroke="#bdb7ad" strokeWidth="5" strokeLinecap="round" />
          <path d="M276 306l22-4" stroke="#bdb7ad" strokeWidth="9" strokeLinecap="round" />
          <path d="M272 250C304 248 306 284 270 290" fill="none" stroke={`url(#${u}-porc)`} strokeWidth="10" strokeLinecap="round" />
          <path d="M272 250C298 249 300 280 270 286" fill="none" stroke="#c9c2b8" strokeWidth="2" opacity=".7" />
          <path d="M162 236C162 286 184 310 216 310C248 310 270 286 270 236Z" fill={`url(#${u}-porc)`} />
          <path d="M174 258C178 286 196 300 214 302" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" opacity=".75" />
          <path d="M170 262C186 266 246 266 262 262" fill="none" stroke="#c9a24e" strokeWidth="2.5" />
          <ellipse cx="216" cy="236" rx="54" ry="12" fill="#f4efe6" stroke="#c9a24e" strokeWidth="2.5" />
          <ellipse cx="216" cy="237" rx="49" ry="9.5" fill={`url(#${u}-coffee)`} />
          <path d="M200 236c6-6 18-6 22-1 6-4 14-2 14 3-6 5-22 6-36-2z" fill="#f2dfbf" opacity=".85" />
        </g>
        <g>
          <ellipse cx="392" cy="318" rx="96" ry="22" fill={`url(#${u}-porc)`} stroke="#c9a24e" strokeWidth="2" />
          <Medialuna x={328} y={262} s={0.95} r={-6} u={u} />
          <Medialuna x={366} y={278} s={0.95} r={8} u={u} />
          <Medialuna x={346} y={246} s={0.86} r={-14} u={u} />
        </g>
      </g>
      <g>
        <path d="M470 196h50l-6 120h-38z" fill="#dff1f6" opacity=".38" stroke="#fff" strokeWidth="1.4" />
        <ellipse cx="495" cy="228" rx="22" ry="5" fill="#cfe9f2" opacity=".6" />
        <path d="M478 204l4 104" stroke="#fff" strokeWidth="4" opacity=".55" strokeLinecap="round" />
        {[[490, 270], [500, 252], [494, 290], [506, 284]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="2" fill="#fff" opacity=".7" />)}
      </g>
      <g className="cf-steam" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" opacity=".55" filter={`url(#${u}-blur)`}>
        <path d="M196 214C184 194 206 182 194 160" /><path d="M218 210C206 186 230 174 216 146" /><path d="M240 214C228 194 250 182 238 160" />
      </g>
    </g>
  )
}

export function Defs({ u }: { u: string }) {
  return (
    <defs>
      <radialGradient id={`${u}-glow`} cx=".5" cy=".95" r=".9"><stop offset="0" stopColor="#fff6d6" stopOpacity=".75" /><stop offset=".5" stopColor="#fff2c4" stopOpacity=".18" /><stop offset="1" stopColor="#000" stopOpacity=".25" /></radialGradient>
      <linearGradient id={`${u}-goldf`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#f6e3a4" /><stop offset=".35" stopColor="#c9a24e" /><stop offset=".6" stopColor="#7d5a1f" /><stop offset="1" stopColor="#e9cf85" /></linearGradient>
      <radialGradient id={`${u}-marble`} cx=".35" cy=".25" r=".9"><stop offset="0" stopColor="#fbf8f2" /><stop offset=".6" stopColor="#e6dfd3" /><stop offset="1" stopColor="#bfb5a6" /></radialGradient>
      <linearGradient id={`${u}-silver`} x1="0" x2="1"><stop offset="0" stopColor="#8f8a82" /><stop offset=".22" stopColor="#f4f2ee" /><stop offset=".5" stopColor="#a9a39a" /><stop offset=".78" stopColor="#efece6" /><stop offset="1" stopColor="#7b766e" /></linearGradient>
      <radialGradient id={`${u}-silverIn`} cx=".5" cy=".4" r=".7"><stop offset="0" stopColor="#d9d6cf" /><stop offset="1" stopColor="#9c968d" /></radialGradient>
      <linearGradient id={`${u}-porc`} x1="0" x2="1"><stop offset="0" stopColor="#ffffff" /><stop offset=".55" stopColor="#f2ede5" /><stop offset="1" stopColor="#c8c0b4" /></linearGradient>
      <radialGradient id={`${u}-coffee`} cx=".45" cy=".4" r=".7"><stop offset="0" stopColor="#e6c697" /><stop offset=".55" stopColor="#c08a55" /><stop offset="1" stopColor="#8a5a34" /></radialGradient>
      <radialGradient id={`${u}-ml`} cx=".5" cy=".2" r=".9"><stop offset="0" stopColor="#f6c473" /><stop offset=".45" stopColor="#d98e35" /><stop offset="1" stopColor="#99521a" /></radialGradient>
      <linearGradient id={`${u}-wood`} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#6b3524" /><stop offset="1" stopColor="#2c140c" /></linearGradient>
      <filter id={`${u}-blur`} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.4" /></filter>
    </defs>
  )
}

/** Ilustración firma: el salón bajo el vitral, con boiserie y la mesa servida. */
export function SalonArt({ className, label, slice }: { className?: string; label?: string; slice?: boolean }) {
  const u = uidOf(useId())
  return (
    <svg className={`cf-art ${className ?? ''}`} viewBox="0 0 600 640" preserveAspectRatio={slice ? 'xMidYMid slice' : undefined} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      <Defs u={u} />
      <rect x="0" y="0" width="600" height="640" fill={`url(#${u}-wood)`} />
      {[30, 170, 310, 450].map((x) => <g key={x}><rect x={x} y="420" width="120" height="200" rx="4" fill="none" stroke="#8a4b2e" strokeWidth="2" opacity=".6" /><rect x={x + 10} y="430" width="100" height="180" rx="3" fill="#000" opacity=".12" /></g>)}
      <g transform="translate(90 70)"><Vitral u={u} /></g>
      <path d="M0 400H600" stroke="#c9a24e" strokeWidth="3" opacity=".7" />
      {[62, 538].map((x, k) => (
        <g key={x} transform={`translate(${x} 250) scale(${k ? -1 : 1} 1)`}>
          <ellipse cx="22" cy="-10" rx="46" ry="46" fill="#ffe8a6" opacity=".14" />
          <path d="M-14 0C6 0 10-16 22-24" fill="none" stroke={`url(#${u}-goldf)`} strokeWidth="4" strokeLinecap="round" />
          <circle cx="-14" cy="0" r="7" fill={`url(#${u}-goldf)`} />
          <path d="M10-26C10-46 34-46 34-26L28-14H16Z" fill="#fff3d0" opacity=".95" />
          <path d="M10-26C10-46 34-46 34-26" fill="none" stroke="#c9a24e" strokeWidth="2" />
          <ellipse cx="22" cy="-30" rx="6" ry="8" fill="#fff" opacity=".8" />
        </g>
      ))}
      <g transform="translate(0 180)"><Table u={u} /></g>
    </svg>
  )
}

/** Escena de la animación: solo la mesa, para que la bandeja entre. */
export function TrayScene() {
  const u = uidOf(useId())
  return (
    <svg className="cf-art cf-tray-scene" viewBox="0 150 600 300" aria-hidden="true">
      <Defs u={u} />
      <Table u={u} />
    </svg>
  )
}
