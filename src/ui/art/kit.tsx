import { createContext, useContext, useId, type ReactNode } from 'react'

// Kit de ilustración de TableFlow: vajilla, materiales y guarniciones dibujados para esta demo.
// Una sola mano para todo el set: luz cenital desde arriba a la izquierda (10 h), sombra abajo a la derecha,
// grilla de 160 × 160, gradientes por material y brillos especulares suaves. Sin fotos ni assets de terceros.

const IdCtx = createContext<(n: string) => string>((n) => n)
/** Cada SVG tiene su propio prefijo de ids: dos ilustraciones iguales en la página no comparten gradientes. */
export const useArtId = () => useContext(IdCtx)
export const url = (id: string) => `url(#${id})`

export function Art({ size, label, children, className, view = 160 }: { size: number; label?: string; children: ReactNode; className?: string; view?: number }) {
  const raw = useId().replace(/[^a-zA-Z0-9]/g, '')
  const id = (n: string) => `a${raw}-${n}`
  return (
    <svg
      className={`art ${className ?? ''}`}
      width={size}
      height={size}
      viewBox={`0 0 ${view} ${view}`}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      <IdCtx.Provider value={id}>
        <CommonDefs />
        {children}
      </IdCtx.Provider>
    </svg>
  )
}

/** Gradientes compartidos por las guarniciones: se definen una vez por SVG. */
function CommonDefs() {
  const id = useArtId()
  return (
    <defs>
      <linearGradient id={id('leaf0')} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#9cc66b" /><stop offset="1" stopColor="#4f8a32" /></linearGradient>
      <linearGradient id={id('leaf1')} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#7fb150" /><stop offset="1" stopColor="#3e7426" /></linearGradient>
      <linearGradient id={id('leaf2')} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#b4d57f" /><stop offset="1" stopColor="#5c9638" /></linearGradient>
      <linearGradient id={id('basil')} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#8cc063" /><stop offset="1" stopColor="#3f7a2c" /></linearGradient>
      <radialGradient id={id('cherry')} cx="35%" cy="30%" r="70%"><stop offset="0" stopColor="#ff8a6b" /><stop offset="0.6" stopColor="#d9381f" /><stop offset="1" stopColor="#9a2112" /></radialGradient>
      <linearGradient id={id('fry')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#c47a26" /><stop offset="0.18" stopColor="#f2c25a" /><stop offset="0.82" stopColor="#f7d27a" /><stop offset="1" stopColor="#c88a33" /></linearGradient>
      <radialGradient id={id('crumb')} cx="38%" cy="32%" r="72%"><stop offset="0" stopColor="#f6cf7d" /><stop offset="0.55" stopColor="#dda049" /><stop offset="1" stopColor="#b06f24" /></radialGradient>
      <radialGradient id={id('gloss')} cx="30%" cy="25%" r="60%"><stop offset="0" stopColor="#ffffff" stopOpacity="0.85" /><stop offset="1" stopColor="#ffffff" stopOpacity="0" /></radialGradient>
    </defs>
  )
}

/** Generador determinista (mulberry32): mismas migas y salpicados en cada render. */
export function rand(seed: number) {
  let t = seed >>> 0
  return () => {
    t += 0x6d2b79f5
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

export function Shadow({ cx = 84, cy = 86, rx = 66, ry = 64, o = 0.26 }: { cx?: number; cy?: number; rx?: number; ry?: number; o?: number }) {
  const id = useArtId()
  return (
    <>
      <defs>
        <radialGradient id={id(`sh${Math.round(cx)}-${Math.round(cy)}`)}>
          <stop offset="0.62" stopColor="#3b2a1a" stopOpacity={o} />
          <stop offset="1" stopColor="#3b2a1a" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={url(id(`sh${Math.round(cx)}-${Math.round(cy)}`))} />
    </>
  )
}

export type PlateTone = 'mc' | 'rc' | 'dessert'
/** Plato visto desde arriba: ala con gradiente, filete de la casa y hueco con sombra interna. */
export function Plate({ tone = 'mc', r = 64, cx = 80, cy = 78, well = 0.7 }: { tone?: PlateTone; r?: number; cx?: number; cy?: number; well?: number }) {
  const id = useArtId()
  const stone = tone === 'rc'
  const rim = stone ? ['#f4ebdc', '#e8dac2', '#cdb894'] : ['#ffffff', '#f5f1e8', '#d9cfbb']
  const sp = rand(cx * 7 + cy)
  return (
    <g>
      <Shadow cx={cx + 5} cy={cy + 7} rx={r + 4} ry={r + 3} />
      <defs>
        <radialGradient id={id('rim')} cx="40%" cy="36%" r="66%">
          <stop offset="0" stopColor={rim[0]} />
          <stop offset="0.72" stopColor={rim[1]} />
          <stop offset="1" stopColor={rim[2]} />
        </radialGradient>
        <radialGradient id={id('well')} cx="44%" cy="40%" r="62%">
          <stop offset="0" stopColor={stone ? '#f8f1e4' : '#ffffff'} />
          <stop offset="1" stopColor={stone ? '#eadcc4' : '#eee8dc'} />
        </radialGradient>
      </defs>
      <circle cx={cx} cy={cy} r={r} fill={url(id('rim'))} />
      <circle cx={cx} cy={cy} r={r - 0.4} fill="none" stroke={stone ? '#b79d76' : '#cbbfa6'} strokeWidth="0.9" />
      {tone === 'mc' && <circle cx={cx} cy={cy} r={r * 0.865} fill="none" stroke="#355443" strokeOpacity="0.6" strokeWidth="1.3" />}
      {tone === 'dessert' && <circle cx={cx} cy={cy} r={r * 0.87} fill="none" stroke="#a44431" strokeOpacity="0.45" strokeWidth="0.9" strokeDasharray="1.5 3" />}
      {stone && Array.from({ length: 26 }, (_, i) => {
        const a = sp() * Math.PI * 2
        const d = r * (0.74 + sp() * 0.22)
        return <circle key={i} cx={cx + Math.cos(a) * d} cy={cy + Math.sin(a) * d} r={0.5 + sp() * 0.7} fill="#7d5d3c" opacity={0.25 + sp() * 0.25} />
      })}
      <circle cx={cx} cy={cy} r={r * well} fill={url(id('well'))} />
      <circle cx={cx} cy={cy} r={r * well} fill="none" stroke="#a89878" strokeOpacity="0.32" strokeWidth="2.2" />
      <circle cx={cx + 0.8} cy={cy + 1} r={r * well - 1.6} fill="none" stroke="#ffffff" strokeOpacity="0.7" strokeWidth="0.8" />
      <path d={arc(cx, cy, r - 3.5, 200, 255)} stroke="#ffffff" strokeOpacity="0.95" strokeWidth="2.6" strokeLinecap="round" fill="none" />
    </g>
  )
}

/** Arco SVG por ángulos en grados (0 = derecha, sentido horario). */
export function arc(cx: number, cy: number, r: number, a0: number, a1: number) {
  const p = (a: number) => [cx + r * Math.cos((a * Math.PI) / 180), cy + r * Math.sin((a * Math.PI) / 180)]
  const [x0, y0] = p(a0)
  const [x1, y1] = p(a1)
  return `M${x0.toFixed(2)} ${y0.toFixed(2)} A${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`
}

/** Sartén de hierro (provoleta). */
export function IronPan({ cx = 76, cy = 76, r = 54 }: { cx?: number; cy?: number; r?: number }) {
  const id = useArtId()
  return (
    <g>
      <Shadow cx={cx + 8} cy={cy + 9} rx={r + 14} ry={r + 8} o={0.32} />
      <defs>
        <radialGradient id={id('iron')} cx="38%" cy="34%" r="70%">
          <stop offset="0" stopColor="#4a4541" />
          <stop offset="0.7" stopColor="#2a2725" />
          <stop offset="1" stopColor="#161413" />
        </radialGradient>
        <linearGradient id={id('handle')} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#4b4642" />
          <stop offset="1" stopColor="#1c1a19" />
        </linearGradient>
      </defs>
      <rect x={cx + r * 0.62} y={cy + r * 0.52} width="44" height="13" rx="6.5" transform={`rotate(38 ${cx + r * 0.62} ${cy + r * 0.52})`} fill={url(id('handle'))} />
      <circle cx={cx} cy={cy} r={r} fill={url(id('iron'))} />
      <circle cx={cx} cy={cy} r={r - 6} fill="#1f1c1b" />
      <circle cx={cx} cy={cy} r={r - 6} fill="none" stroke="#000" strokeOpacity="0.45" strokeWidth="2" />
      <path d={arc(cx, cy, r - 2, 195, 265)} stroke="#8b847d" strokeOpacity="0.6" strokeWidth="2" strokeLinecap="round" fill="none" />
    </g>
  )
}

/** Tabla de madera (vitrina y salado). */
export function Board({ x = 18, y = 30, w = 124, h = 100, rx = 14 }: { x?: number; y?: number; w?: number; h?: number; rx?: number }) {
  const id = useArtId()
  const r = rand(x * 13 + w)
  return (
    <g>
      <Shadow cx={x + w / 2 + 6} cy={y + h / 2 + 8} rx={w / 2 + 8} ry={h / 2 + 6} o={0.28} />
      <defs>
        <linearGradient id={id('wood')} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#d9a873" />
          <stop offset="0.55" stopColor="#c48b55" />
          <stop offset="1" stopColor="#a56d3c" />
        </linearGradient>
      </defs>
      <rect x={x} y={y} width={w} height={h} rx={rx} fill={url(id('wood'))} />
      {Array.from({ length: 7 }, (_, i) => {
        const yy = y + 10 + i * ((h - 20) / 6)
        const wob = 2 + r() * 3
        return <path key={i} d={`M${x + 8} ${yy} C ${x + w * 0.3} ${yy - wob}, ${x + w * 0.6} ${yy + wob}, ${x + w - 8} ${yy - 1}`} stroke="#8a5a2f" strokeOpacity={0.22 + r() * 0.15} strokeWidth="0.9" fill="none" />
      })}
      <rect x={x} y={y} width={w} height={h} rx={rx} fill="none" stroke="#7d4f28" strokeOpacity="0.5" strokeWidth="1" />
      <path d={`M${x + rx} ${y + 2.5} H${x + w - rx}`} stroke="#f4d2a6" strokeOpacity="0.7" strokeWidth="2" strokeLinecap="round" />
    </g>
  )
}

// ---------------------------------------------------------------- guarniciones y detalles

export function Basil({ x, y, rot = 0, s = 1 }: { x: number; y: number; rot?: number; s?: number }) {
  const id = useArtId()
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <path d="M0 -10 C 7 -7, 8 4, 0 10 C -8 4, -7 -7, 0 -10 Z" fill={url(id('basil'))} />
      <path d="M0 -8 L0 8" stroke="#2f5e20" strokeOpacity="0.6" strokeWidth="0.7" />
      <path d="M0 -2 L3 -4 M0 2 L-3 0 M0 5 L3 3" stroke="#2f5e20" strokeOpacity="0.4" strokeWidth="0.5" />
      <path d="M-2 -6 C -1 -8, 1 -8, 2 -7" stroke="#d6f0b8" strokeOpacity="0.8" strokeWidth="0.8" fill="none" />
    </g>
  )
}

export function Lemon({ x, y, rot = 0, s = 1 }: { x: number; y: number; rot?: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <path d="M-14 0 A14 14 0 0 1 14 0 Z" fill="#f1c93b" />
      <path d="M-12 0 A12 12 0 0 1 12 0 Z" fill="#fbeea2" />
      <path d="M-10.5 -0.5 A10.5 10.5 0 0 1 10.5 -0.5 Z" fill="#f8e27a" />
      {[-60, -30, 0, 30, 60].map((a) => (
        <path key={a} d={`M0 -0.5 L${(9.5 * Math.sin((a * Math.PI) / 180)).toFixed(2)} ${(-9.5 * Math.cos((a * Math.PI) / 180)).toFixed(2)}`} stroke="#fdf6cf" strokeWidth="0.9" />
      ))}
      <path d="M-14 0 H14" stroke="#e0b52a" strokeWidth="1.2" />
      <path d="M-9 -8 A12 12 0 0 1 3 -12" stroke="#fffbe6" strokeOpacity="0.8" strokeWidth="1" fill="none" />
    </g>
  )
}

/** Papas fritas: bastones dorados con puntas tostadas. */
export function Fries({ x, y, n = 9, seed = 1, spread = 22 }: { x: number; y: number; n?: number; seed?: number; spread?: number }) {
  const id = useArtId()
  const r = rand(seed)
  return (
    <g>
      {Array.from({ length: n }, (_, i) => {
        const fx = x + (r() - 0.5) * spread
        const fy = y + (r() - 0.5) * spread * 0.7
        const a = -60 + r() * 120
        const len = 20 + r() * 9
        return (
          <g key={i} transform={`translate(${fx.toFixed(1)} ${fy.toFixed(1)}) rotate(${a.toFixed(0)})`}>
            <rect x={-2.6} y={-len / 2} width="5.2" height={len} rx="1.6" fill={url(id('fry'))} />
            <rect x={-2.6} y={-len / 2} width="1.4" height={len} rx="0.7" fill="#fff3c8" opacity="0.55" />
          </g>
        )
      })}
    </g>
  )
}

/** Migas, sal, orégano o cacao: puntos dentro de una elipse. */
export function Speckles({ cx, cy, rx, ry, n, color, min = 0.5, max = 1.3, seed = 3, opacity = 1, shape = 'dot' }: { cx: number; cy: number; rx: number; ry: number; n: number; color: string; min?: number; max?: number; seed?: number; opacity?: number; shape?: 'dot' | 'flake' }) {
  const r = rand(seed)
  return (
    <g opacity={opacity}>
      {Array.from({ length: n }, (_, i) => {
        const a = r() * Math.PI * 2
        const d = Math.sqrt(r())
        const px = cx + Math.cos(a) * rx * d
        const py = cy + Math.sin(a) * ry * d
        const s = min + r() * (max - min)
        return shape === 'flake' ? (
          <rect key={i} x={px} y={py} width={s * 2.2} height={s} rx={s / 2} fill={color} transform={`rotate(${(r() * 180).toFixed(0)} ${px} ${py})`} />
        ) : (
          <circle key={i} cx={px} cy={py} r={s} fill={color} />
        )
      })}
    </g>
  )
}

/** Charco de salsa con brillo. */
export function Sauce({ cx, cy, r, color = 'tomate', seed = 5 }: { cx: number; cy: number; r: number; color?: 'tomate' | 'crema' | 'manteca' | 'caramelo' | 'chimi'; seed?: number }) {
  const id = useArtId()
  const pal = {
    tomate: ['#e35a3c', '#b8341f', '#8a2414'],
    crema: ['#fbf3df', '#efe0bd', '#dcc596'],
    manteca: ['#f6e3a0', '#e9c862', '#cf9f3c'],
    caramelo: ['#d9933f', '#a85d1f', '#7a3d12'],
    chimi: ['#7da34a', '#557a2f', '#3a5a1f'],
  }[color]
  const rr = rand(seed)
  const N = 14
  const pts = Array.from({ length: N }, (_, i) => {
    const a = (i / N) * Math.PI * 2
    const d = r * (0.93 + rr() * 0.1)
    return [cx + Math.cos(a) * d, cy + Math.sin(a) * d]
  })
  const mid = (i: number) => {
    const p = pts[i % N]
    const n = pts[(i + 1) % N]
    return [(p[0] + n[0]) / 2, (p[1] + n[1]) / 2]
  }
  const m0 = mid(0)
  const path = [`M${m0[0].toFixed(1)} ${m0[1].toFixed(1)}`, ...Array.from({ length: N }, (_, i) => {
    const c = pts[(i + 1) % N]
    const m = mid(i + 1)
    return `Q ${c[0].toFixed(1)} ${c[1].toFixed(1)} ${m[0].toFixed(1)} ${m[1].toFixed(1)}`
  })]
  return (
    <g>
      <defs>
        <radialGradient id={id(`sauce-${color}-${Math.round(cx)}-${Math.round(cy)}`)} cx="42%" cy="38%" r="66%">
          <stop offset="0" stopColor={pal[0]} />
          <stop offset="0.7" stopColor={pal[1]} />
          <stop offset="1" stopColor={pal[2]} />
        </radialGradient>
      </defs>
      <path d={`${path.join(' ')} Z`} fill={url(id(`sauce-${color}-${Math.round(cx)}-${Math.round(cy)}`))} />
      <ellipse cx={cx - r * 0.35} cy={cy - r * 0.4} rx={r * 0.3} ry={r * 0.12} fill="#ffffff" opacity="0.35" transform={`rotate(-30 ${cx - r * 0.35} ${cy - r * 0.4})`} />
    </g>
  )
}

/** Vapor estático (no se anima: el movimiento se reserva a cambios de estado). */
export function Steam({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} stroke="#ffffff" strokeOpacity="0.75" strokeWidth="2.2" strokeLinecap="round" fill="none">
      <path d="M0 0 C -6 -8, 6 -14, 0 -22" />
      <path d="M10 2 C 4 -6, 16 -12, 10 -20" strokeOpacity="0.5" />
      <path d="M-10 3 C -16 -4, -4 -10, -10 -17" strokeOpacity="0.4" />
    </g>
  )
}

/** Hoja verde genérica (ensaladas, rúcula). */
export function Leaf({ x, y, rot = 0, s = 1, shade = 0 }: { x: number; y: number; rot?: number; s?: number; shade?: number }) {
  const id = useArtId()
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <path d="M0 -16 C 5 -12, 4 -8, 8 -6 C 5 -3, 8 1, 5 4 C 7 7, 4 12, 0 16 C -4 12, -7 7, -5 4 C -8 1, -5 -3, -8 -6 C -4 -8, -5 -12, 0 -16 Z" fill={url(id(`leaf${shade % 3}`))} />
      <path d="M0 -14 V14" stroke="#2f5c1e" strokeOpacity="0.55" strokeWidth="0.7" />
    </g>
  )
}

/** Tomate cherry asado (entero o mitad). */
export function Cherry({ x, y, r = 6, half = false }: { x: number; y: number; r?: number; half?: boolean }) {
  const id = useArtId()
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill={url(id('cherry'))} />
      {half ? (
        <>
          <circle cx={x} cy={y} r={r * 0.78} fill="#f06a4f" />
          <circle cx={x - r * 0.3} cy={y - r * 0.15} r={r * 0.22} fill="#ffd2a8" opacity="0.8" />
          <circle cx={x + r * 0.3} cy={y + r * 0.2} r={r * 0.22} fill="#ffd2a8" opacity="0.8" />
        </>
      ) : (
        <ellipse cx={x - r * 0.35} cy={y - r * 0.4} rx={r * 0.32} ry={r * 0.2} fill="#fff" opacity="0.7" />
      )}
    </g>
  )
}
