import { useArtId, url } from '../kit'
import { scatter, type FamilyPiece } from './kit'

// Mesa Clara · bodegón de pizarra y pingüino. Loza blanca con filete rojo, vista a tres cuartos, pintada
// como un cartel de bodegón: contorno de pincel marrón, colores planos con una sombra y un brillo.

export const INK = '#3b2416'

function Defs() {
  const id = useArtId()
  return (
    <defs>
      <radialGradient id={id('shadow')} cx=".5" cy=".5" r=".5"><stop offset="0" stopColor="#2a1a12" stopOpacity=".32" /><stop offset="1" stopColor="#2a1a12" stopOpacity="0" /></radialGradient>
      <linearGradient id={id('wood')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#a8703f" /><stop offset="1" stopColor="#6e4528" /></linearGradient>
      <linearGradient id={id('iron')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#4a4642" /><stop offset="1" stopColor="#1c1a18" /></linearGradient>
      <linearGradient id={id('glass')} x1="0" x2="1"><stop offset="0" stopColor="#bcd9e4" stopOpacity=".55" /><stop offset=".3" stopColor="#ffffff" stopOpacity=".8" /><stop offset="1" stopColor="#9cc0cf" stopOpacity=".5" /></linearGradient>
      <pattern id={id('ging')} width="10" height="10" patternUnits="userSpaceOnUse">
        <rect width="10" height="10" fill="#fbf4e6" /><rect width="5" height="10" fill="#c42b22" opacity=".5" /><rect width="10" height="5" fill="#c42b22" opacity=".5" />
      </pattern>
    </defs>
  )
}

/** Plato playo de loza con filete rojo, a tres cuartos. */
export function Loza({ cx = 80, cy = 100, rx = 70, ry = 33, band = '#c42b22' }: { cx?: number; cy?: number; rx?: number; ry?: number; band?: string }) {
  const id = useArtId()
  return (
    <g>
      <ellipse cx={cx + 4} cy={cy + 8} rx={rx * 1.04} ry={ry * 1.2} fill={url(id('shadow'))} />
      <ellipse cx={cx} cy={cy + 3.4} rx={rx} ry={ry} fill="#d9cdb8" stroke={INK} strokeWidth="1.5" />
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="#fffaf0" stroke={INK} strokeWidth="1.5" />
      <ellipse cx={cx} cy={cy + 0.6} rx={rx * 0.72} ry={ry * 0.68} fill="#f2ead9" />
      <ellipse cx={cx} cy={cy} rx={rx * 0.88} ry={ry * 0.86} fill="none" stroke={band} strokeWidth="1.6" />
      <path d={`M${cx - rx * 0.8} ${cy - ry * 0.3}C${cx - rx * 0.62} ${cy - ry * 0.78} ${cx - rx * 0.2} ${cy - ry * 0.95} ${cx + rx * 0.1} ${cy - ry * 0.95}`} fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
    </g>
  )
}

/** Papas fritas en bastón, a tres cuartos. */
export function Fritas({ x, y, n = 9, seed = 2, s = 1 }: { x: number; y: number; n?: number; seed?: number; s?: number }) {
  const pts = scatter(n, 0, 0, 16, 7, seed)
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {pts.map(([px, py, r], i) => {
        const a = -35 + r * 70
        const len = 24 + r * 10
        return (
          <g key={i} transform={`translate(${px} ${py}) rotate(${a})`}>
            <rect x={-len / 2} y="-3" width={len} height="6" rx="2" fill="#f2c357" stroke={INK} strokeWidth="1" />
            <rect x={-len / 2 + 1.5} y="-2.2" width={len - 3} height="1.6" rx=".8" fill="#ffe9a6" />
            <rect x={len / 2 - 4} y="-3" width="4" height="6" rx="2" fill="#c88a2b" />
          </g>
        )
      })}
    </g>
  )
}

function Napolitana() {
  return (
    <g>
      <Defs />
      <Loza cy={102} rx={74} ry={36} />
      <Fritas x={118} y={88} n={10} s={0.95} seed={4} />
      {/* la milanesa: pieza irregular y alargada, en diagonal; el empanado asoma en todo el borde */}
      <path d="M14 104C10 90 22 80 38 78C52 70 74 68 90 74C104 78 112 88 108 100C112 112 98 122 80 122C64 126 42 126 30 118C20 114 14 110 14 104Z" fill="#cf8a35" stroke={INK} strokeWidth="1.5" />
      <path d="M18 110C26 118 42 122 60 122C78 122 96 118 104 108C100 116 88 120 74 121C56 123 36 121 18 110Z" fill="#a35c1d" />
      {scatter(30, 60, 100, 46, 20, 3).map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={0.7 + r * 0.9} fill={r > 0.55 ? '#f2c06f' : '#9b561b'} />)}
      {/* salsa de tomate: cubre casi todo, con borde de cuchara */}
      <path d="M24 102C22 92 32 84 46 83C58 76 76 76 88 81C100 84 104 92 100 100C104 108 92 116 78 116C64 120 46 118 36 113C28 110 24 106 24 102Z" fill="#d23f2a" stroke={INK} strokeWidth="1.1" />
      <path d="M30 108C40 114 58 116 74 114" fill="none" stroke="#a52a1a" strokeWidth="2" strokeLinecap="round" />
      {/* jamón: una lonja rosada que asoma de un lado */}
      <path d="M30 98C30 90 42 86 54 88C58 96 52 106 40 108C34 106 30 102 30 98Z" fill="#f0a39a" stroke="#b9675c" strokeWidth=".8" />
      {/* muzzarella gratinada: manto irregular corrido hacia la derecha, con burbujas doradas */}
      <path d="M42 96C40 88 52 82 64 84C70 79 84 80 90 86C96 90 96 98 90 102C92 108 82 112 72 110C64 114 52 112 48 106C44 104 42 100 42 96Z" fill="#fbe5ad" />
      <path d="M50 108C48 112 50 116 54 114M86 104C90 108 92 110 90 112" fill="none" stroke="#fbe5ad" strokeWidth="3.4" strokeLinecap="round" />
      {[[56, 92, 4.2, 2.6], [70, 88, 3.4, 2.2], [80, 96, 4, 2.4], [64, 101, 3, 1.8], [86, 90, 2.4, 1.6], [74, 106, 2.6, 1.6], [52, 100, 2.2, 1.4]].map(([x, y, rx, ry]) => (
        <g key={`${x}-${y}`}><ellipse cx={x} cy={y} rx={rx} ry={ry} fill="#c97e2c" /><ellipse cx={x - rx * 0.3} cy={y - ry * 0.35} rx={rx * 0.4} ry={ry * 0.3} fill="#f4c374" /></g>
      ))}
      {scatter(16, 70, 96, 22, 9, 9).map(([x, y, r], i) => <rect key={i} x={x} y={y} width="2.4" height="1.1" fill="#3e6b24" transform={`rotate(${r * 180} ${x} ${y})`} />)}
      <path d="M96 122C102 114 116 114 120 120C116 128 102 130 96 122Z" fill="#f6df57" stroke={INK} strokeWidth="1.1" />
      <path d="M100 121C104 117 112 117 116 120" fill="none" stroke="#fffbe0" strokeWidth="1.2" />
    </g>
  )
}

const P = { stroke: INK, strokeWidth: 1.4, strokeLinejoin: 'round' as const }

/** Tabla de madera a tres cuartos (carnes y quesos). */
function Tabla({ cx = 80, cy = 104, w = 136, h = 52 }: { cx?: number; cy?: number; w?: number; h?: number }) {
  const id = useArtId()
  const l = cx - w / 2
  return (
    <g>
      <ellipse cx={cx + 4} cy={cy + h * 0.32} rx={w * 0.54} ry={h * 0.4} fill={url(id('shadow'))} />
      <rect x={l} y={cy - h / 2 + 6} width={w} height={h} rx="12" fill="#5a3820" {...P} />
      <rect x={l} y={cy - h / 2} width={w} height={h} rx="12" fill={url(id('wood'))} {...P} />
      {[0.25, 0.5, 0.75].map((t) => <path key={t} d={`M${l + 12} ${cy - h / 2 + h * t}C${l + w * 0.4} ${cy - h / 2 + h * t - 4} ${l + w * 0.6} ${cy - h / 2 + h * t + 4} ${l + w - 12} ${cy - h / 2 + h * t}`} fill="none" stroke="#7d4f2c" strokeWidth="1.2" opacity=".7" />)}
      <circle cx={l + w - 12} cy={cy} r="4" fill="#4b2a16" />
    </g>
  )
}

/** Sartén o plancha de hierro a tres cuartos, con mango. */
function Hierro({ cx = 76, cy = 98, rx = 56, ry = 30, mango = true }: { cx?: number; cy?: number; rx?: number; ry?: number; mango?: boolean }) {
  const id = useArtId()
  return (
    <g>
      <ellipse cx={cx + 4} cy={cy + 10} rx={rx * 1.05} ry={ry * 1.1} fill={url(id('shadow'))} />
      {mango && <path d={`M${cx + rx - 6} ${cy - 4}L${cx + rx + 30} ${cy - 18}`} stroke={INK} strokeWidth="9" strokeLinecap="round" />}
      {mango && <path d={`M${cx + rx - 6} ${cy - 4}L${cx + rx + 30} ${cy - 18}`} stroke="#3a3632" strokeWidth="6" strokeLinecap="round" />}
      <ellipse cx={cx} cy={cy + 6} rx={rx} ry={ry} fill="#1c1a18" {...P} />
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={url(id('iron'))} {...P} />
      <ellipse cx={cx} cy={cy + 2} rx={rx - 6} ry={ry - 5} fill="#2b2826" />
      <path d={`M${cx - rx + 8} ${cy - 6}C${cx - rx * 0.5} ${cy - ry + 4} ${cx} ${cy - ry + 2} ${cx + rx * 0.3} ${cy - ry + 4}`} fill="none" stroke="#8d8781" strokeWidth="1.6" strokeLinecap="round" />
    </g>
  )
}

/** Cuenco hondo de loza para ensaladas y guisos. */
function Cuenco({ cx = 80, cy = 86, rx = 58, ry = 22, depth = 34 }: { cx?: number; cy?: number; rx?: number; ry?: number; depth?: number }) {
  const id = useArtId()
  return (
    <g>
      <ellipse cx={cx + 4} cy={cy + depth + 6} rx={rx * 0.8} ry={ry * 0.6} fill={url(id('shadow'))} />
      <path d={`M${cx - rx} ${cy}C${cx - rx} ${cy + depth * 1.2} ${cx + rx} ${cy + depth * 1.2} ${cx + rx} ${cy}Z`} fill="#fffaf0" {...P} />
      <path d={`M${cx - rx + 4} ${cy + depth * 0.45}C${cx - rx * 0.4} ${cy + depth * 0.85} ${cx + rx * 0.4} ${cy + depth * 0.85} ${cx + rx - 4} ${cy + depth * 0.45}`} fill="none" stroke="#c42b22" strokeWidth="1.6" />
      <path d={`M${cx + rx * 0.3} ${cy + depth * 0.8}C${cx + rx * 0.7} ${cy + depth * 0.6} ${cx + rx - 2} ${cy + depth * 0.2} ${cx + rx} ${cy}`} fill="none" stroke="#d9cdb8" strokeWidth="5" />
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="#f2ead9" {...P} />
    </g>
  )
}

/** Gajo de limón con contorno. */
function Limon({ x, y, r = 0, s = 1 }: { x: number; y: number; r?: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
      <path d="M-12 0C-6-9 6-9 12 0C6 6-6 6-12 0Z" fill="#f6df57" {...P} strokeWidth={1.1} />
      <path d="M-8-1C-4-5 4-5 8-1" fill="none" stroke="#fffbe0" strokeWidth="1.3" />
    </g>
  )
}

/** Hojita de perejil o albahaca. */
function Hojita({ x, y, r = 0, s = 1, c = '#4f8a32' }: { x: number; y: number; r?: number; s?: number; c?: string }) {
  return <path d="M0 0C3-6 10-7 14-4C10 1 4 3 0 0Z" fill={c} stroke={INK} strokeWidth=".9" transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`} />
}

/** Milanesa (ternera o pollo): pieza empanada irregular. */
function Mila({ x = 0, y = 0, s = 1, tone = '#cf8a35' }: { x?: number; y?: number; s?: number; tone?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M14 104C10 90 22 80 38 78C52 70 74 68 90 74C104 78 112 88 108 100C112 112 98 122 80 122C64 126 42 126 30 118C20 114 14 110 14 104Z" fill={tone} {...P} />
      <path d="M18 110C26 118 42 122 60 122C78 122 96 118 104 108C100 116 88 120 74 121C56 123 36 121 18 110Z" fill="#a35c1d" opacity=".8" />
      {scatter(30, 60, 100, 44, 18, 3).map(([px, py, r], i) => <circle key={i} cx={px} cy={py} r={0.7 + r * 0.9} fill={r > 0.55 ? '#f2c06f' : '#9b561b'} />)}
      <path d="M30 86C44 78 64 76 80 78" fill="none" stroke="#f2c06f" strokeWidth="2.4" strokeLinecap="round" opacity=".8" />
    </g>
  )
}

/** Salsa de tomate (fileto) en charco. */
function Fileto({ cx, cy, rx, ry, seed = 2 }: { cx: number; cy: number; rx: number; ry: number; seed?: number }) {
  const pts = Array.from({ length: 14 }, (_, i) => {
    const a = (i / 14) * Math.PI * 2
    const k = 0.86 + ((i * 37 + seed * 11) % 10) / 50
    return `${(cx + Math.cos(a) * rx * k).toFixed(1)} ${(cy + Math.sin(a) * ry * k).toFixed(1)}`
  })
  return (
    <g>
      <path d={`M${pts.join('L')}Z`} fill="#c8321f" stroke={INK} strokeWidth="1.1" strokeLinejoin="round" />
      <path d={`M${cx - rx * 0.6} ${cy - ry * 0.3}C${cx - rx * 0.3} ${cy - ry * 0.7} ${cx + rx * 0.2} ${cy - ry * 0.7} ${cx + rx * 0.5} ${cy - ry * 0.4}`} fill="none" stroke="#e8634c" strokeWidth="2" strokeLinecap="round" />
    </g>
  )
}

/** Queso rallado: escamas pálidas. */
function Rallado({ cx, cy, rx, ry, n = 14, seed = 4 }: { cx: number; cy: number; rx: number; ry: number; n?: number; seed?: number }) {
  return <g>{scatter(n, cx, cy, rx, ry, seed).map(([x, y, r], i) => <rect key={i} x={x} y={y} width="3.2" height="1.4" rx=".6" fill="#fff6d4" transform={`rotate(${r * 180} ${x} ${y})`} />)}</g>
}

function Provoleta() {
  return (
    <g>
      <Defs />
      <Hierro cx={72} cy={98} rx={54} ry={28} />
      <path d="M30 96C28 82 48 74 72 74C96 74 116 82 114 96C112 110 92 118 72 118C52 118 32 110 30 96Z" fill="#f2c45e" {...P} />
      <path d="M36 98C40 108 56 114 72 114C90 114 104 108 108 98C104 104 90 108 72 108C54 108 40 104 36 98Z" fill="#d99a35" />
      {[[52, 88, 6], [80, 84, 5], [94, 98, 6], [64, 102, 5], [72, 92, 3], [44, 100, 3]].map(([x, y, r]) => <ellipse key={x} cx={x} cy={y} rx={r} ry={r * 0.6} fill="#8a4a14" opacity=".75" />)}
      {[[56, 84], [86, 92], [68, 98], [96, 86]].map(([x, y]) => <ellipse key={x} cx={x} cy={y} rx="3" ry="1.6" fill="#fff3c2" />)}
      {scatter(18, 72, 94, 34, 14, 6).map(([x, y, r], i) => <rect key={i} x={x} y={y} width="2.2" height="1.1" fill={r > 0.7 ? '#b4271a' : '#3e6b24'} transform={`rotate(${r * 180} ${x} ${y})`} />)}
    </g>
  )
}

/** Empanada vista a tres cuartos, con repulgue. */
function Empanada({ x, y, r = 0, s = 1 }: { x: number; y: number; r?: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
      <path d="M-34 8C-34-14-16-26 0-26C16-26 34-14 34 8C20 14-20 14-34 8Z" fill="#dc9a45" {...P} />
      <path d="M-26 0C-22-14-10-20 0-20C10-20 22-14 26 0" fill="none" stroke="#f6c97c" strokeWidth="3" strokeLinecap="round" opacity=".8" />
      {Array.from({ length: 11 }, (_, i) => {
        const t = i / 10
        const px = -32 + t * 64
        const py = 9 + Math.sin(t * Math.PI) * 4
        return <path key={i} d={`M${px - 3} ${py}q3-5 6 0`} fill="#c47f33" stroke={INK} strokeWidth=".9" />
      })}
      {[[-10, -10], [8, -14], [16, -4]].map(([a, b]) => <circle key={a} cx={a} cy={b} r="1.4" fill="#8a4a14" />)}
    </g>
  )
}

function Empanadas() {
  return (
    <g>
      <Defs />
      <Loza />
      <Empanada x={58} y={96} r={-8} />
      <Empanada x={102} y={104} r={10} s={0.96} />
      <Hojita x={40} y={116} r={-10} />
    </g>
  )
}

function Tortilla() {
  return (
    <g>
      <Defs />
      <Loza />
      {/* tortilla gruesa con una porción cortada: se ve el interior de papa y huevo */}
      <path d="M26 96C26 80 50 72 80 72C110 72 134 80 134 96V108C134 120 110 128 80 128C50 128 26 120 26 108Z" fill="#d6a03e" {...P} />
      <ellipse cx="80" cy="96" rx="54" ry="22" fill="#ecbc5a" {...P} />
      <path d="M80 96L134 96V108C130 116 116 122 104 124L80 108Z" fill="#f6dc8a" {...P} />
      <path d="M80 96L104 124" stroke={INK} strokeWidth="1.4" />
      {[[100, 104, 4], [116, 106, 3.4], [92, 110, 3], [122, 98, 2.6], [108, 114, 2.6]].map(([x, y, r]) => <ellipse key={x} cx={x} cy={y} rx={r} ry={r * 0.7} fill="#fff1c0" stroke="#d9b45a" strokeWidth=".7" />)}
      <path d="M40 90C50 80 66 77 80 77" fill="none" stroke="#f9d98a" strokeWidth="3" strokeLinecap="round" />
      {[[52, 92], [66, 86], [44, 100], [70, 100]].map(([x, y]) => <ellipse key={x} cx={x} cy={y} rx="4" ry="2" fill="#b77a24" opacity=".6" />)}
    </g>
  )
}

function Rucula() {
  return (
    <g>
      <Defs />
      <Cuenco cy={84} />
      {scatter(16, 80, 80, 44, 14, 8).map(([x, y, r], i) => (
        <path key={i} d="M0 0C2-4 6-3 7-7C9-3 13-4 14-8C15-3 18-2 22-4C20 1 14 4 6 3C3 3 1 2 0 0Z" fill={r > 0.5 ? '#4e8a2e' : '#6aa63e'} stroke={INK} strokeWidth=".8" transform={`translate(${x - 11} ${y}) rotate(${-30 + r * 60} 11 0)`} />
      ))}
      {[[64, 74], [96, 78], [80, 86]].map(([x, y]) => <g key={x}><circle cx={x} cy={y} r="5.4" fill="#d9381f" {...P} strokeWidth={1} /><circle cx={x - 1.6} cy={y - 1.8} r="1.4" fill="#ffb4a2" /></g>)}
      {[[58, 82], [72, 72], [90, 70], [104, 84], [84, 78]].map(([x, y], i) => <path key={i} d={`M${x} ${y}l10-3 1 4-10 2z`} fill="#fff4cf" stroke="#c9b27a" strokeWidth=".6" />)}
    </g>
  )
}

function Mollejas() {
  return (
    <g>
      <Defs />
      <Loza />
      {scatter(9, 70, 96, 30, 12, 12).map(([x, y, r], i) => (
        <g key={i}>
          <path d={`M${x - 10} ${y}C${x - 10} ${y - 8} ${x - 2} ${y - 10} ${x + 4} ${y - 8}C${x + 11} ${y - 6} ${x + 12} ${y + 2} ${x + 6} ${y + 6}C${x} ${y + 9} ${x - 10} ${y + 6} ${x - 10} ${y}Z`} fill={r > 0.5 ? '#c9822f' : '#b06c22'} {...P} strokeWidth={1.1} />
          <path d={`M${x - 6} ${y - 4}c3-3 7-3 9-2`} fill="none" stroke="#f2c06f" strokeWidth="1.6" strokeLinecap="round" />
        </g>
      ))}
      <Limon x={116} y={98} r={-20} s={1.2} />
      <Hojita x={46} y={112} r={20} />
      {scatter(10, 70, 96, 36, 14, 3).map(([x, y], i) => <circle key={i} cx={x} cy={y} r=".9" fill="#fff" opacity=".8" />)}
    </g>
  )
}

function Sorrentinos() {
  return (
    <g>
      <Defs />
      <Loza />
      <Fileto cx={78} cy={100} rx={48} ry={22} />
      {[[60, 94], [88, 90], [74, 108], [102, 104], [52, 108]].map(([x, y], i) => (
        <g key={i}>
          <ellipse cx={x} cy={y + 2} rx="14" ry="8" fill="#d9b25e" {...P} strokeWidth={1.1} />
          <ellipse cx={x} cy={y} rx="11" ry="6" fill="#f6dd96" />
          <ellipse cx={x} cy={y} rx="7" ry="3.6" fill="#fbebb8" />
          <path d={`M${x - 6} ${y - 2}c3-2 8-2 10 0`} fill="none" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" />
        </g>
      ))}
      <Rallado cx={78} cy={98} rx={30} ry={10} />
      <Hojita x={92} y={84} r={-30} s={1.2} c="#3f8a2c" />
    </g>
  )
}

function Noquis() {
  return (
    <g>
      <Defs />
      <Loza />
      <Fileto cx={80} cy={100} rx={46} ry={21} seed={5} />
      {scatter(16, 80, 98, 32, 13, 21).sort((a, b) => a[1] - b[1]).map(([x, y, r], i) => (
        <g key={i} transform={`translate(${x} ${y}) rotate(${-30 + r * 60})`}>
          <ellipse rx="6.6" ry="4.4" fill="#f4d98e" stroke={INK} strokeWidth=".9" />
          <path d="M-3-3v6M0-4v8M3-3v6" stroke="#c9a24e" strokeWidth=".9" />
        </g>
      ))}
      <Rallado cx={80} cy={96} rx={28} ry={9} n={10} />
      <Hojita x={64} y={84} r={-40} s={1.1} c="#3f8a2c" />
    </g>
  )
}

function Ravioles() {
  return (
    <g>
      <Defs />
      <Loza />
      <Fileto cx={80} cy={100} rx={48} ry={22} seed={7} />
      {[[54, 92], [78, 88], [102, 94], [64, 108], [90, 108]].map(([x, y], i) => (
        <g key={i} transform={`translate(${x} ${y}) rotate(${(i % 3) * 8 - 8}) scale(1 .62)`}>
          <rect x="-12" y="-12" width="24" height="24" rx="2" fill="#f2d68a" stroke={INK} strokeWidth="1.2" />
          <rect x="-7" y="-7" width="14" height="14" rx="5" fill="#f9e6aa" />
          <rect x="-12" y="-12" width="24" height="24" rx="2" fill="none" stroke="#c9a24e" strokeWidth="1.4" strokeDasharray="2 2" />
          <circle cx="-1" cy="-1" r="2.4" fill="#7fae5a" opacity=".7" />
        </g>
      ))}
      <Rallado cx={80} cy={98} rx={30} ry={10} n={12} />
    </g>
  )
}

function Tallarines() {
  return (
    <g>
      <Defs />
      <Loza />
      <ellipse cx="80" cy="98" rx="44" ry="20" fill="#e9c66e" {...P} />
      {Array.from({ length: 16 }, (_, i) => {
        const a = (i / 16) * Math.PI * 2
        return <path key={i} d={`M${80 + Math.cos(a) * 40} ${98 + Math.sin(a) * 17}C${80 + Math.cos(a + 1.4) * 34} ${98 + Math.sin(a + 1.4) * 16} ${80 + Math.cos(a + 2.6) * 26} ${98 + Math.sin(a + 2.6) * 11} ${80 + Math.cos(a + 3.4) * 14} ${98 + Math.sin(a + 3.4) * 6}`} fill="none" stroke={i % 2 ? '#f6dd96' : '#d9b25e'} strokeWidth="2.6" strokeLinecap="round" />
      })}
      <Fileto cx={80} cy={94} rx={22} ry={10} seed={3} />
      <Rallado cx={80} cy={92} rx={16} ry={6} n={8} />
      <Hojita x={84} y={86} r={-20} s={1.2} c="#3f8a2c" />
    </g>
  )
}

function Lasagna() {
  const layers: [string, number][] = [['#f2d68a', 4], ['#a8331f', 6], ['#fff1cf', 4], ['#f2d68a', 4], ['#a8331f', 6], ['#fff1cf', 4]]
  let y = 96
  return (
    <g>
      <Defs />
      <Loza />
      {/* porción rectangular a tres cuartos: tapa gratinada y corte con capas */}
      <path d="M36 96L60 76H128L104 96Z" fill="#e9b04e" {...P} />
      {[[66, 82, 5], [92, 80, 4], [104, 88, 5], [80, 90, 3.4], [116, 80, 3]].map(([x, yy, r]) => <ellipse key={x} cx={x} cy={yy} rx={r} ry={r * 0.6} fill="#a8601f" opacity=".7" />)}
      <path d="M104 96L128 76V104L104 124Z" fill="#c7452a" {...P} />
      {layers.map(([c, h], i) => {
        const r = <rect key={i} x="36" y={y} width="68" height={h} fill={c} />
        y += h
        return r
      })}
      <rect x="36" y="96" width="68" height="28" fill="none" stroke={INK} strokeWidth="1.4" />
      <path d="M40 102c4 3 8-3 12 0s8-3 12 0 8-3 12 0 8-3 12 0 8-3 10 0" fill="none" stroke="#6e1d10" strokeWidth="1.2" />
      <Hojita x={70} y={72} r={-10} s={1.2} c="#3f8a2c" />
    </g>
  )
}

function Canelones() {
  return (
    <g>
      <Defs />
      <Loza />
      {[[50, 92], [76, 98], [102, 104]].map(([x, y], i) => (
        <g key={i} transform={`translate(${x} ${y}) rotate(-24)`}>
          <rect x="-34" y="-9" width="68" height="18" rx="9" fill="#f2d68a" stroke={INK} strokeWidth="1.2" />
          <ellipse cx="-34" cy="0" rx="5" ry="9" fill="#e9f0d6" stroke={INK} strokeWidth="1" />
          <ellipse cx="-34" cy="0" rx="3" ry="6" fill="#7fae5a" />
        </g>
      ))}
      <path d="M38 98C52 90 66 100 80 92S104 96 118 90" fill="none" stroke="#fff6dc" strokeWidth="9" strokeLinecap="round" />
      <path d="M44 108C58 102 74 110 90 104S110 108 122 102" fill="none" stroke="#c8321f" strokeWidth="6" strokeLinecap="round" />
      <Rallado cx={80} cy={98} rx={34} ry={10} n={10} />
    </g>
  )
}

function Milanesa() {
  return (
    <g>
      <Defs />
      <Loza cy={102} rx={74} ry={36} />
      <Fritas x={118} y={88} n={10} s={0.95} seed={4} />
      <Mila />
      <Limon x={100} y={120} r={-12} s={1.3} />
    </g>
  )
}

function Suprema() {
  return (
    <g>
      <Defs />
      <Loza cy={102} rx={74} ry={36} />
      <path d="M96 96C96 80 112 74 124 78C136 82 140 94 134 104C128 114 108 116 100 108C96 104 96 100 96 96Z" fill="#fbf1d8" {...P} />
      <path d="M104 92c6-6 16-6 22-2M102 102c8 4 18 4 26-2" fill="none" stroke="#e9d9b2" strokeWidth="2" strokeLinecap="round" />
      <ellipse cx="118" cy="92" rx="4" ry="2.4" fill="#f6dc6a" />
      <g transform="translate(-6 -4) scale(.94)"><Mila tone="#dfa24a" /></g>
      <Limon x={58} y={124} r={-8} s={1.2} />
    </g>
  )
}

function Bife() {
  return (
    <g>
      <Defs />
      <Tabla cy={102} />
      <path d="M26 96C24 80 44 70 72 72C96 68 120 76 122 92C124 108 102 120 74 118C48 120 28 112 26 96Z" fill="#6e3218" {...P} />
      <path d="M26 96C28 108 46 116 74 116C100 118 118 108 122 96" fill="none" stroke="#f3e2c2" strokeWidth="4" />
      <path d="M32 92C32 80 50 74 72 76C94 72 114 80 116 92C116 104 98 110 74 110C52 112 34 104 32 92Z" fill="#8a4422" />
      {[-24, -8, 8, 24].map((d) => <path key={d} d={`M${66 + d} 78l22 28`} stroke="#3a160a" strokeWidth="3" strokeLinecap="round" opacity=".7" />)}
      {[-20, 0, 20].map((d) => <path key={d} d={`M${50 + d} 102l34-22`} stroke="#3a160a" strokeWidth="3" strokeLinecap="round" opacity=".55" />)}
      <path d="M44 84c10-6 26-8 38-6" fill="none" stroke="#c46a3a" strokeWidth="2.4" strokeLinecap="round" />
      {scatter(20, 96, 92, 18, 8, 5).map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r > 0.6 ? 1.6 : 1.1} fill={r > 0.7 ? '#c8321f' : '#3e7a2a'} />)}
    </g>
  )
}

function Asado() {
  return (
    <g>
      <Defs />
      <Tabla cy={104} />
      {[[30, 86], [34, 104]].map(([x, y], k) => (
        <g key={k} transform={`translate(${x} ${y}) rotate(${k ? 4 : -4})`}>
          <rect x="0" y="0" width="100" height="18" rx="7" fill="#7a361a" {...P} />
          <rect x="2" y="2" width="96" height="6" rx="3" fill="#a24f27" />
          {[14, 40, 66, 90].map((bx) => <g key={bx}><ellipse cx={bx} cy="10" rx="5.4" ry="7" fill="#f5ead2" stroke={INK} strokeWidth="1" /><ellipse cx={bx} cy="10" rx="2.4" ry="3.4" fill="#d9b58a" /></g>)}
          {[26, 52, 78].map((gx) => <path key={gx} d={`M${gx - 4} 2l8 14`} stroke="#3a160a" strokeWidth="2" opacity=".5" />)}
        </g>
      ))}
      <Limon x={124} y={126} r={-10} s={1.1} />
    </g>
  )
}

function Pollo() {
  const id = useArtId()
  return (
    <g>
      <Defs />
      <ellipse cx="84" cy="128" rx="68" ry="12" fill={url(id('shadow'))} />
      <rect x="12" y="78" width="136" height="52" rx="22" fill="#3a3632" {...P} />
      <rect x="18" y="76" width="124" height="44" rx="18" fill="#2b2826" />
      {[[34, 104], [126, 100], [46, 88], [120, 86], [36, 92]].map(([x, y], i) => <g key={i}><ellipse cx={x} cy={y} rx="10" ry="7" fill="#d9a046" {...P} strokeWidth={1} /><path d={`M${x - 5} ${y - 3}c3-2 7-2 9 0`} stroke="#f6d38a" strokeWidth="1.6" fill="none" /></g>)}
      <path d="M58 106C50 92 58 76 76 74C96 72 110 84 106 98C104 110 90 116 78 114L66 124C60 128 54 122 58 116Z" fill="#b8641f" {...P} />
      <path d="M64 92C70 82 84 80 94 84" fill="none" stroke="#e8a656" strokeWidth="3.4" strokeLinecap="round" />
      <path d="M58 116L50 126" stroke="#f5ead2" strokeWidth="5" strokeLinecap="round" />
      <path d="M58 116L50 126" stroke={INK} strokeWidth="1" />
      {[[82, 96], [92, 90], [74, 104]].map(([x, y]) => <path key={x} d={`M${x} ${y}l3-6`} stroke="#3e6b24" strokeWidth="1.6" strokeLinecap="round" />)}
    </g>
  )
}

function Matambre() {
  return (
    <g>
      <Defs />
      <Hierro cx={76} cy={98} rx={58} ry={28} mango={false} />
      <path d="M26 96C24 82 46 76 76 76C106 76 128 82 126 96C124 110 104 116 76 116C48 116 28 110 26 96Z" fill="#9a4a24" {...P} />
      <path d="M34 96C34 86 52 82 76 82C100 82 118 86 118 96C116 106 98 110 76 110C54 110 36 106 34 96Z" fill="#c8321f" />
      <path d="M42 94C42 88 56 86 74 87C92 86 108 88 108 95C106 102 92 105 76 104C60 106 44 102 42 94Z" fill="#fbe5ad" />
      {[[56, 92, 4], [80, 90, 3.4], [96, 96, 4], [68, 100, 3]].map(([x, y, r]) => <ellipse key={x} cx={x} cy={y} rx={r} ry={r * 0.6} fill="#c97e2c" />)}
      {[[62, 96], [88, 94], [74, 90]].map(([x, y]) => <g key={x}><ellipse cx={x} cy={y} rx="3.6" ry="2.4" fill="#2e3b1e" /><ellipse cx={x} cy={y} rx="1.2" ry=".8" fill="#c8321f" /></g>)}
      {scatter(12, 76, 95, 28, 8, 4).map(([x, y, r], i) => <rect key={i} x={x} y={y} width="2.2" height="1.1" fill="#3e6b24" transform={`rotate(${r * 180} ${x} ${y})`} />)}
    </g>
  )
}

function Gramajo() {
  return (
    <g>
      <Defs />
      <Hierro cx={72} cy={98} rx={54} ry={28} />
      {scatter(14, 72, 96, 38, 14, 31).map(([x, y, r], i) => <path key={`e${i}`} d={`M${x - 7} ${y}c2-5 10-6 14-1 1 4-4 6-8 5-3 1-6-1-6-4z`} fill={r > 0.5 ? '#f7d24a' : '#fbe58a'} stroke="#c9a24e" strokeWidth=".7" />)}
      {scatter(22, 72, 94, 38, 14, 7).map(([x, y, r], i) => <rect key={`p${i}`} x={x} y={y} width="12" height="2" rx="1" fill="#f2c357" stroke={INK} strokeWidth=".5" transform={`rotate(${r * 180} ${x} ${y})`} />)}
      {scatter(8, 72, 96, 30, 11, 9).map(([x, y], i) => <rect key={`j${i}`} x={x} y={y} width="5" height="3" rx="1" fill="#e98a86" />)}
      {scatter(10, 72, 96, 32, 12, 14).map(([x, y], i) => <circle key={`a${i}`} cx={x} cy={y} r="2.2" fill="#6faa3a" stroke="#3e6b24" strokeWidth=".6" />)}
    </g>
  )
}

function Merluza() {
  return (
    <g>
      <Defs />
      <Loza />
      {[[24, 82, -6], [44, 96, 6]].map(([x, y, r], i) => (
        <g key={i} transform={`translate(${x} ${y}) rotate(${r})`}>
          <path d="M0 10C0-2 18-8 42-8C66-8 84-2 86 6C88 16 70 24 44 24C18 24 0 20 0 10Z" fill="#e9b85a" {...P} />
          {scatter(10, 44, 8, 34, 8, 5 + i).map(([px, py, k], j) => <ellipse key={j} cx={px} cy={py} rx={2 + k * 2} ry={1.2 + k} fill="#f6d68a" />)}
          <path d="M12 4C24-2 44-4 60-2" fill="none" stroke="#fff1c0" strokeWidth="2.4" strokeLinecap="round" />
        </g>
      ))}
      <Limon x={120} y={88} r={20} s={1.3} />
      <Hojita x={112} y={110} r={10} s={1.1} />
    </g>
  )
}

function Salmon() {
  return (
    <g>
      <Defs />
      <Loza />
      <path d="M34 98C32 84 50 76 74 78C98 76 114 84 114 96C114 108 98 116 74 116C52 118 36 110 34 98Z" fill="#f08a6a" {...P} />
      {[52, 64, 76, 88, 100].map((x) => <path key={x} d={`M${x - 6} 82C${x} 92 ${x} 104 ${x - 6} 114`} fill="none" stroke="#fbd0bf" strokeWidth="2.4" />)}
      {[-20, 0, 20].map((d) => <path key={d} d={`M${56 + d} 108l26-26`} stroke="#7a2e18" strokeWidth="2.6" strokeLinecap="round" opacity=".6" />)}
      {[[118, 98], [128, 108], [112, 112]].map(([x, y]) => <g key={x}><path d={`M${x} ${y}l-6 10`} stroke="#3e6b24" strokeWidth="2" /><ellipse cx={x} cy={y - 2} rx="6" ry="4" fill="#5c9a3a" stroke={INK} strokeWidth=".9" /></g>)}
      <Limon x={44} y={120} r={-10} s={1.1} />
    </g>
  )
}

function Flan() {
  return (
    <g>
      <Defs />
      <Loza cy={108} rx={62} ry={28} />
      <path d="M48 70H96L104 108C96 118 52 118 44 108Z" fill="#f2c46a" {...P} />
      <path d="M48 70H96L98 80C88 86 56 86 46 80Z" fill="#9a4a14" />
      <ellipse cx="72" cy="70" rx="24" ry="7" fill="#7d3810" {...P} />
      <path d="M46 80C42 92 40 100 44 108M98 80C102 92 104 100 100 108" fill="none" stroke="#9a4a14" strokeWidth="2" opacity=".6" />
      <path d="M56 86c-1 8 0 14 2 20" stroke="#fff3c2" strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M100 104C98 94 108 88 118 92C128 96 126 108 116 112C110 114 102 110 100 104Z" fill="#a8622a" {...P} />
      <path d="M106 98c4-3 10-2 12 2" stroke="#d99a5a" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M30 104C28 94 40 90 48 96C52 88 64 92 60 102C58 110 36 112 30 104Z" fill="#fffaf0" {...P} />
    </g>
  )
}

function Tiramisu() {
  return (
    <g>
      <Defs />
      <Loza cy={110} rx={64} ry={28} />
      <path d="M40 86L66 72H122L96 86Z" fill="#7a4a2a" {...P} />
      {scatter(24, 81, 79, 34, 6, 3).map(([x, y], i) => <circle key={i} cx={x} cy={y} r=".9" fill="#3a1d0e" />)}
      <path d="M96 86L122 72V100L96 116Z" fill="#ead9b6" {...P} />
      <rect x="40" y="86" width="56" height="30" fill="#f4e6c6" />
      <rect x="40" y="94" width="56" height="5" fill="#8a5232" />
      <rect x="40" y="106" width="56" height="5" fill="#8a5232" />
      <rect x="40" y="86" width="56" height="30" fill="none" stroke={INK} strokeWidth="1.4" />
      <path d="M100 96L118 86" stroke="#8a5232" strokeWidth="4" />
      <path d="M100 108L118 98" stroke="#8a5232" strokeWidth="4" />
    </g>
  )
}

function Vigilante() {
  return (
    <g>
      <Defs />
      <Loza />
      <path d="M30 96L54 84H90L66 96Z" fill="#fbf0c8" {...P} />
      <path d="M30 96H66V114H30Z" fill="#f4e3a6" {...P} />
      <path d="M66 96L90 84V102L66 114Z" fill="#e9d48c" {...P} />
      {[[40, 104], [52, 108], [46, 100]].map(([x, y]) => <circle key={x} cx={x} cy={y} r="1.6" fill="#d9c27a" />)}
      <path d="M70 102L94 90H128L104 102Z" fill="#b8342a" {...P} />
      <path d="M70 102H104V120H70Z" fill="#8f1f19" {...P} />
      <path d="M104 102L128 90V108L104 120Z" fill="#a52a20" {...P} />
      <path d="M80 98c8-3 18-4 30-4" stroke="#e56a5a" strokeWidth="2" fill="none" strokeLinecap="round" />
    </g>
  )
}

function Panqueque() {
  const rollo = (y: number, k: number) => (
    <g key={k} transform={`translate(80 ${y}) rotate(-14)`}>
      <rect x="-52" y="-11" width="104" height="22" rx="11" fill="#e3ad55" stroke={INK} strokeWidth="1.4" />
      <path d="M-46-5C-20-9 20-9 46-5" fill="none" stroke="#f6d68a" strokeWidth="3" strokeLinecap="round" />
      {[[-30, 2], [-6, 4], [20, 1], [36, 5]].map(([x, yy]) => <ellipse key={x} cx={x} cy={yy} rx="4" ry="1.8" fill="#8a4a14" opacity=".55" />)}
      <ellipse cx="52" cy="0" rx="7" ry="11" fill="#f0c370" stroke={INK} strokeWidth="1.2" />
      <path d="M52-6c4 0 4 6 0 6s-3-3 0-3" fill="none" stroke="#9a5320" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M58 4C66 6 66 14 60 16" fill="#a8622a" stroke={INK} strokeWidth="1" />
    </g>
  )
  return (
    <g>
      <Defs />
      <Loza />
      {rollo(96, 0)}
      {rollo(112, 1)}
      {[[52, 88], [64, 86], [90, 82]].map(([x, y]) => <rect key={x} x={x} y={y} width="3" height="1.6" rx=".6" fill="#fff6d4" />)}
    </g>
  )
}

function Botella({ cx = 62, liquid = '#dff1f6', cap = '#2c6e8e', label = '#2c6e8e', dark = false }: { cx?: number; liquid?: string; cap?: string; label?: string; dark?: boolean }) {
  const id = useArtId()
  return (
    <g>
      <ellipse cx={cx + 3} cy="146" rx="22" ry="5" fill={url(id('shadow'))} />
      <path d={`M${cx - 7} 16H${cx + 7}V40C${cx + 7} 50 ${cx + 20} 54 ${cx + 20} 70V138C${cx + 20} 144 ${cx + 14} 146 ${cx} 146C${cx - 14} 146 ${cx - 20} 144 ${cx - 20} 138V70C${cx - 20} 54 ${cx - 7} 50 ${cx - 7} 40Z`} fill={dark ? liquid : url(id('glass'))} {...P} />
      {!dark && <path d={`M${cx - 19} 76H${cx + 19}V138C${cx + 19} 143 ${cx + 13} 145 ${cx} 145C${cx - 13} 145 ${cx - 19} 143 ${cx - 19} 138Z`} fill={liquid} opacity=".7" />}
      <rect x={cx - 20} y="88" width="40" height="26" fill={label} {...P} strokeWidth={1.1} />
      <path d={`M${cx - 12} 98h24M${cx - 8} 105h16`} stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity=".85" />
      <rect x={cx - 8} y="10" width="16" height="9" rx="2" fill={cap} {...P} strokeWidth={1.1} />
      <path d={`M${cx - 14} 64V134`} stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity=".6" />
    </g>
  )
}

function VasoAgua({ cx = 116, top = 84, w = 34, h = 54, liquid = '#dff1f6', ice = false }: { cx?: number; top?: number; w?: number; h?: number; liquid?: string; ice?: boolean }) {
  const id = useArtId()
  const bw = w * 0.82
  return (
    <g>
      <path d={`M${cx - w / 2} ${top}L${cx - bw / 2} ${top + h}H${cx + bw / 2}L${cx + w / 2} ${top}Z`} fill={url(id('glass'))} {...P} />
      <path d={`M${cx - w * 0.47} ${top + h * 0.28}L${cx - bw / 2 + 1} ${top + h - 1}H${cx + bw / 2 - 1}L${cx + w * 0.47} ${top + h * 0.28}Z`} fill={liquid} opacity=".75" />
      {ice && [[-6, 0.38], [5, 0.5]].map(([dx, f]) => <rect key={dx} x={cx + dx - 5} y={top + h * f} width="10" height="10" rx="2" fill="#f4fbff" opacity=".7" stroke="#b9d3dc" strokeWidth=".6" />)}
      <ellipse cx={cx} cy={top} rx={w / 2} ry="4" fill="#eef7fa" {...P} strokeWidth={1.1} />
      <path d={`M${cx - w / 2 + 4} ${top + 6}L${cx - bw / 2 + 4} ${top + h - 4}`} stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
    </g>
  )
}

function Agua() {
  return <g><Defs /><Botella /><VasoAgua /></g>
}

function Cola() {
  return (
    <g>
      <Defs />
      <Botella cx={60} liquid="#3a1a10" cap="#c42b22" label="#c42b22" dark />
      <VasoAgua cx={118} liquid="#4a2014" ice />
      {[[112, 112], [120, 120], [116, 100]].map(([x, y]) => <circle key={y} cx={x} cy={y} r="1.1" fill="#fff" opacity=".7" />)}
    </g>
  )
}

function Copa({ cx = 80, wine = '#6e0f19' }: { cx?: number; wine?: string }) {
  const id = useArtId()
  return (
    <g>
      <ellipse cx={cx + 3} cy="146" rx="28" ry="5" fill={url(id('shadow'))} />
      <ellipse cx={cx} cy="142" rx="24" ry="5" fill="#eef7fa" {...P} strokeWidth={1.1} />
      <path d={`M${cx - 2} 96V140M${cx + 2} 96V140`} stroke="#c6dbe2" strokeWidth="2.2" />
      <path d={`M${cx} 96V141`} stroke={INK} strokeWidth="1" opacity=".5" />
      <path d={`M${cx - 30} 24C${cx - 34} 60 ${cx - 26} 94 ${cx} 96C${cx + 26} 94 ${cx + 34} 60 ${cx + 30} 24Z`} fill={url(id('glass'))} {...P} />
      <path d={`M${cx - 31} 56C${cx - 30} 80 ${cx - 20} 94 ${cx} 95C${cx + 20} 94 ${cx + 30} 80 ${cx + 31} 56Z`} fill={wine} />
      <ellipse cx={cx} cy="56" rx="31" ry="6" fill="#9a2232" />
      <path d={`M${cx - 22} 34C${cx - 24} 54 ${cx - 20} 74 ${cx - 12} 86`} fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" opacity=".75" />
      <ellipse cx={cx} cy="24" rx="30" ry="5" fill="none" {...P} />
    </g>
  )
}

function Vino() {
  return <g><Defs /><Copa /></g>
}

/** Pingüino de vino de loza blanca, como en todo bodegón. */
function Pinguino() {
  const id = useArtId()
  return (
    <g>
      <Defs />
      <ellipse cx="80" cy="148" rx="34" ry="6" fill={url(id('shadow'))} />
      <path d="M108 56C128 60 130 96 108 108" fill="none" stroke={INK} strokeWidth="9" strokeLinecap="round" />
      <path d="M108 56C126 60 128 96 108 108" fill="none" stroke="#f7f2e8" strokeWidth="6" strokeLinecap="round" />
      <path d="M80 30C104 30 116 58 116 92C116 124 104 146 80 146C56 146 44 124 44 92C44 58 56 30 80 30Z" fill="#fbf7ee" {...P} />
      <path d="M80 52C96 52 104 72 104 96C104 122 96 138 80 138C64 138 56 122 56 96C56 72 64 52 80 52Z" fill="#f2ead9" />
      <path d="M58 40C66 22 94 22 102 40L98 52H62Z" fill="#fbf7ee" {...P} />
      <path d="M58 42L36 48L58 54Z" fill="#f29a2e" {...P} strokeWidth={1.1} />
      <circle cx="70" cy="40" r="4.4" fill="#fff" stroke={INK} strokeWidth="1" /><circle cx="69" cy="40" r="2.2" fill={INK} />
      <path d="M50 92C48 112 54 130 66 138" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
      <path d="M68 146C72 152 88 152 92 146" fill="#f29a2e" {...P} strokeWidth={1.1} />
    </g>
  )
}

function Sifon() {
  const id = useArtId()
  return (
    <g>
      <Defs />
      <ellipse cx="80" cy="150" rx="26" ry="5" fill={url(id('shadow'))} />
      <path d="M60 60C60 52 66 48 72 48H88C94 48 100 52 100 60V142C100 146 96 148 92 148H68C64 148 60 146 60 142Z" fill="#2c6e8e" {...P} />
      {[66, 74, 82, 90].map((x) => <path key={x} d={`M${x} 56V144`} stroke="#8cc6e0" strokeWidth="2" opacity=".5" />)}
      <path d="M66 62V140" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" opacity=".55" />
      <path d="M68 24H92L94 48H66Z" fill="#d6dbdf" {...P} />
      <path d="M68 30H46C42 30 40 34 44 36L52 40H68" fill="#c8ced3" {...P} strokeWidth={1.1} />
      <path d="M86 26C94 14 108 12 116 16C118 18 116 22 114 22C106 20 98 22 92 30Z" fill="#c8ced3" {...P} strokeWidth={1.1} />
      <rect x="66" y="18" width="28" height="8" rx="3" fill="#e9edf0" {...P} strokeWidth={1.1} />
    </g>
  )
}

function Panera() {
  return (
    <g>
      <Defs />
      <ellipse cx="80" cy="120" rx="66" ry="18" fill="#6e4528" {...P} />
      <path d="M14 108C14 96 44 88 80 88S146 96 146 108V118C146 132 116 138 80 138S14 132 14 118Z" fill="#b07c3d" {...P} />
      {Array.from({ length: 10 }, (_, i) => <path key={i} d={`M${22 + i * 13} 98V132`} stroke="#7a4a1e" strokeWidth="2" opacity=".55" />)}
      {[[54, 96, -14], [100, 92, 12], [78, 84, 0]].map(([x, y, r]) => (
        <g key={x} transform={`translate(${x} ${y}) rotate(${r})`}>
          <path d="M-26 0C-26-14-12-20 0-20C12-20 26-14 26 0C26 9 12 12 0 12C-12 12-26 9-26 0Z" fill="#e0a456" {...P} />
          {[-12, -2, 8].map((xx) => <path key={xx} d={`M${xx} -14C${xx + 4} -8 ${xx + 5} -4 ${xx + 4} 2`} stroke="#fbe2b0" strokeWidth="3" strokeLinecap="round" fill="none" />)}
        </g>
      ))}
    </g>
  )
}

function Tenedor() {
  return (
    <g transform="rotate(-30 80 80)">
      <path d="M74 150V74C74 66 66 62 66 50V18M80 74V18M86 74C86 66 94 62 94 50V18M74 74H86" fill="none" stroke={INK} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M74 150V74C74 66 66 62 66 50V18M80 74V18M86 74C86 66 94 62 94 50V18M74 74H86" fill="none" stroke="#d6dbdf" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M78 140V82" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
    </g>
  )
}
function Cuchillo() {
  return (
    <g transform="rotate(30 80 80)">
      <rect x="72" y="88" width="16" height="64" rx="6" fill="#6e4528" {...P} />
      {[104, 120, 136].map((y) => <circle key={y} cx="80" cy={y} r="2" fill="#d6dbdf" />)}
      <path d="M72 88V22C72 14 88 10 88 22V88Z" fill="#d6dbdf" {...P} />
      <path d="M76 84V26" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
    </g>
  )
}
function Cuchara() {
  return (
    <g transform="rotate(-20 80 80)">
      <path d="M80 150V70" stroke={INK} strokeWidth="9" strokeLinecap="round" />
      <path d="M80 150V70" stroke="#d6dbdf" strokeWidth="6" strokeLinecap="round" />
      <ellipse cx="80" cy="44" rx="20" ry="28" fill="#d6dbdf" {...P} />
      <ellipse cx="74" cy="38" rx="7" ry="12" fill="#fff" opacity=".8" />
    </g>
  )
}
function PlatoVacio() {
  return <g><Defs /><Loza cy={88} rx={72} ry={52} /></g>
}
function Vaso() {
  return <g><Defs /><VasoAgua cx={80} top={30} w={64} h={104} /></g>
}
function Servilleta() {
  const id = useArtId()
  return (
    <g>
      <Defs />
      <path d="M24 60L104 36L136 100L56 124Z" fill={url(id('ging'))} {...P} />
      <path d="M56 124L104 36" stroke={INK} strokeWidth="1.2" opacity=".5" />
      <path d="M24 60L56 124" stroke="#fff" strokeWidth="2" opacity=".5" />
    </g>
  )
}
function Individual() {
  const id = useArtId()
  return (
    <g>
      <Defs />
      <rect x="8" y="32" width="144" height="96" rx="8" fill={url(id('ging'))} {...P} />
      <ellipse cx="80" cy="80" rx="38" ry="26" fill="none" stroke="#fffaf0" strokeWidth="2.4" strokeDasharray="5 5" />
      <path d="M28 54V106M132 54V106M120 46L128 40" stroke="#fffaf0" strokeWidth="2.4" strokeDasharray="5 5" strokeLinecap="round" />
    </g>
  )
}

export const BODEGON_FAMILY: FamilyPiece[] = [
  { key: 'MC-01', name: 'Provoleta a la parrilla', group: 'carta', Comp: Provoleta },
  { key: 'MC-02', name: 'Empanadas de carne (x2)', group: 'carta', Comp: Empanadas },
  { key: 'MC-03', name: 'Tortilla de papas', group: 'carta', Comp: Tortilla },
  { key: 'MC-04', name: 'Ensalada de rúcula y parmesano', group: 'carta', Comp: Rucula },
  { key: 'MC-05', name: 'Mollejas crocantes', group: 'carta', Comp: Mollejas },
  { key: 'MC-06', name: 'Sorrentinos de jamón y queso', group: 'carta', Comp: Sorrentinos },
  { key: 'MC-07', name: 'Ñoquis de papa', group: 'carta', Comp: Noquis },
  { key: 'MC-08', name: 'Ravioles de verdura', group: 'carta', Comp: Ravioles },
  { key: 'MC-09', name: 'Tallarines caseros', group: 'carta', Comp: Tallarines },
  { key: 'MC-10', name: 'Lasagna boloñesa', group: 'carta', Comp: Lasagna },
  { key: 'MC-11', name: 'Canelones de verdura y ricota', group: 'carta', Comp: Canelones },
  { key: 'MC-12', name: 'Milanesa de ternera', group: 'carta', Comp: Milanesa },
  { key: 'MC-13', name: 'Milanesa napolitana', group: 'carta', Comp: Napolitana },
  { key: 'MC-14', name: 'Suprema de pollo', group: 'carta', Comp: Suprema },
  { key: 'MC-15', name: 'Bife de chorizo', group: 'carta', Comp: Bife },
  { key: 'MC-16', name: 'Asado de tira', group: 'carta', Comp: Asado },
  { key: 'MC-17', name: 'Pollo al horno con papas', group: 'carta', Comp: Pollo },
  { key: 'MC-18', name: 'Matambre a la pizza', group: 'carta', Comp: Matambre },
  { key: 'MC-19', name: 'Revuelto Gramajo', group: 'carta', Comp: Gramajo },
  { key: 'MC-20', name: 'Merluza a la romana', group: 'carta', Comp: Merluza },
  { key: 'MC-21', name: 'Salmón rosado a la plancha', group: 'carta', Comp: Salmon },
  { key: 'MC-22', name: 'Flan casero con dulce de leche', group: 'carta', Comp: Flan },
  { key: 'MC-23', name: 'Tiramisú', group: 'carta', Comp: Tiramisu },
  { key: 'MC-24', name: 'Vigilante de queso y dulce', group: 'carta', Comp: Vigilante },
  { key: 'MC-25', name: 'Panqueque con dulce de leche', group: 'carta', Comp: Panqueque },
  { key: 'MC-26', name: 'Agua mineral', group: 'carta', Comp: Agua },
  { key: 'MC-27', name: 'Gaseosa línea cola', group: 'carta', Comp: Cola },
  { key: 'MC-28', name: 'Vino de la casa (copa)', group: 'carta', Comp: Vino },
  { key: 'jg-resto-tenedor', name: 'Tenedor (poner la mesa)', group: 'juego', Comp: Tenedor },
  { key: 'jg-resto-cuchillo', name: 'Cuchillo (poner la mesa)', group: 'juego', Comp: Cuchillo },
  { key: 'jg-resto-cuchara', name: 'Cuchara (poner la mesa)', group: 'juego', Comp: Cuchara },
  { key: 'jg-resto-plato', name: 'Plato (poner la mesa)', group: 'juego', Comp: PlatoVacio },
  { key: 'jg-resto-vaso', name: 'Vaso (poner la mesa)', group: 'juego', Comp: Vaso },
  { key: 'jg-resto-servilleta', name: 'Servilleta (poner la mesa)', group: 'juego', Comp: Servilleta },
  { key: 'jg-resto-individual', name: 'Individual con los lugares marcados', group: 'juego', Comp: Individual },
  { key: 'x-resto-pinguino', name: 'Pingüino de vino', group: 'extra', Comp: Pinguino },
  { key: 'x-resto-sifon', name: 'Sifón de soda', group: 'extra', Comp: Sifon },
  { key: 'x-resto-panera', name: 'Panera', group: 'extra', Comp: Panera },
]
