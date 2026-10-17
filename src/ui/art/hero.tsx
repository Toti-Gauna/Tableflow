import type { ComponentType, ReactNode } from 'react'
import { Art, rand, url, useArtId } from './kit'
import { MC_ART } from './mesa-clara'
import { RC_ART } from './ritual-cafe'

// Ilustraciones firma de cada negocio: una mesa vista desde arriba con platos de la carta real.
// Reutilizan las piezas del set (misma luz y vajilla) sobre mantel de bodegón o mostrador de barra.

function Dish({ id, x, y, s = 1, r = 0 }: { id: string; x: number; y: number; s?: number; r?: number }) {
  const C: ComponentType | undefined = MC_ART[id] ?? RC_ART[id]
  if (!C) return null
  return (
    <g transform={`translate(${x} ${y}) rotate(${r} 80 80) scale(${s})`}>
      <C />
    </g>
  )
}

function Glass({ x, y, wine = true }: { x: number; y: number; wine?: boolean }) {
  const id = useArtId()
  return (
    <g>
      <defs>
        <radialGradient id={id(`gl${x}`)} cx="40%" cy="38%" r="65%">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.65" />
          <stop offset="1" stopColor="#dfe7e4" stopOpacity="0.25" />
        </radialGradient>
        <radialGradient id={id(`wn${x}`)} cx="42%" cy="38%" r="70%">
          <stop offset="0" stopColor="#a0283b" />
          <stop offset="1" stopColor="#4e0c18" />
        </radialGradient>
      </defs>
      <ellipse cx={x + 6} cy={y + 8} rx="30" ry="28" fill="#3b2a1a" opacity="0.12" />
      <circle cx={x} cy={y} r="27" fill={url(id(`gl${x}`))} stroke="#b9c6c1" strokeWidth="1.4" />
      {wine && <circle cx={x} cy={y} r="19" fill={url(id(`wn${x}`))} />}
      <path d={`M${x - 18} ${y - 10} A 22 22 0 0 1 ${x - 4} ${y - 21}`} stroke="#ffffff" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.85" />
    </g>
  )
}

function Cutlery({ x, y, r = 0 }: { x: number; y: number; r?: number }) {
  const id = useArtId()
  return (
    <g transform={`translate(${x} ${y}) rotate(${r})`}>
      <defs>
        <linearGradient id={id(`cut${x}`)} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#9aa1a6" />
          <stop offset="0.5" stopColor="#f1f4f5" />
          <stop offset="1" stopColor="#8b9297" />
        </linearGradient>
      </defs>
      <g opacity="0.16" transform="translate(4 5)">
        <rect x="-3" y="0" width="6" height="96" rx="3" fill="#3b2a1a" />
        <rect x="15" y="0" width="7" height="104" rx="3.5" fill="#3b2a1a" />
      </g>
      {/* tenedor */}
      <rect x="-3" y="34" width="6" height="62" rx="3" fill={url(id(`cut${x}`))} />
      <path d="M-8 0 L-8 22 C -8 30, 8 30, 8 22 L8 0 M-2.6 0 L-2.6 20 M2.6 0 L2.6 20" stroke={url(id(`cut${x}`))} strokeWidth="2.6" fill="none" strokeLinecap="round" />
      <path d="M-8 22 C -8 32, 8 32, 8 22" fill={url(id(`cut${x}`))} />
      {/* cuchillo */}
      <path d="M18 0 C 26 6, 26 30, 22 46 L16 46 Z" fill={url(id(`cut${x}`))} />
      <rect x="15" y="44" width="7" height="60" rx="3.5" fill="#5a3b26" />
    </g>
  )
}

function Napkin({ x, y, r = 0 }: { x: number; y: number; r?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${r})`}>
      <rect x="4" y="5" width="86" height="86" rx="4" fill="#3b2a1a" opacity="0.1" />
      <rect x="0" y="0" width="86" height="86" rx="4" fill="#fbf8f1" stroke="#e3dccb" />
      <path d="M0 0 L86 86" stroke="#e8e1d1" strokeWidth="1.4" />
      <rect x="0" y="66" width="86" height="5" fill="#355443" opacity="0.85" />
      <rect x="0" y="74" width="86" height="2" fill="#355443" opacity="0.6" />
    </g>
  )
}

function BreadBasket({ x, y }: { x: number; y: number }) {
  const id = useArtId()
  return (
    <g>
      <defs>
        <radialGradient id={id('roll')} cx="38%" cy="32%" r="75%">
          <stop offset="0" stopColor="#f7d394" />
          <stop offset="0.6" stopColor="#d99a4c" />
          <stop offset="1" stopColor="#a8662a" />
        </radialGradient>
      </defs>
      <ellipse cx={x + 7} cy={y + 9} rx="70" ry="50" fill="#3b2a1a" opacity="0.16" />
      <ellipse cx={x} cy={y} rx="68" ry="48" fill="#8d5f2c" />
      <ellipse cx={x} cy={y} rx="62" ry="43" fill="#b98a4e" />
      {Array.from({ length: 9 }, (_, i) => (
        <ellipse key={i} cx={x} cy={y} rx={62 - i * 2.5} ry={43 - i * 1.8} fill="none" stroke="#9c6d35" strokeWidth="1.2" strokeDasharray="6 4" strokeDashoffset={i * 3} opacity="0.7" />
      ))}
      {/* paño de lino con la raya de la casa */}
      <path d={`M${x - 58} ${y - 6} L${x - 6} ${y - 40} L${x + 52} ${y - 10} L${x + 4} ${y + 38} Z`} fill="#fbf8f1" stroke="#e3dccb" />
      <path d={`M${x - 44} ${y - 15} L${x + 14} ${y + 28}`} stroke="#355443" strokeWidth="3" opacity="0.8" />
      {[[-18, -6, -28], [16, -2, 22], [-2, 16, -6]].map(([dx, dy, a], i) => (
        <g key={i} transform={`translate(${x + dx} ${y + dy}) rotate(${a})`}>
          <ellipse cx="2" cy="3" rx="26" ry="13" fill="#3b2a1a" opacity="0.18" />
          <ellipse rx="26" ry="13" fill={url(id('roll'))} />
          {[-10, 0, 10].map((k) => <path key={k} d={`M${k - 4} -8 C ${k + 1} -3, ${k + 1} 3, ${k - 4} 8`} stroke="#8d4f1a" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.75" />)}
          <ellipse cx="-8" cy="-5" rx="9" ry="3" fill="#fff3d6" opacity="0.55" />
        </g>
      ))}
    </g>
  )
}

function Beans({ n, w, h, seed }: { n: number; w: number; h: number; seed: number }) {
  const r = rand(seed)
  return (
    <g>
      {Array.from({ length: n }, (_, i) => {
        const x = 20 + r() * (w - 40)
        const y = 20 + r() * (h - 40)
        const a = r() * 180
        return (
          <g key={i} transform={`translate(${x} ${y}) rotate(${a})`}>
            <ellipse rx="6" ry="4.4" fill="#4a2513" />
            <ellipse rx="6" ry="4.4" fill="#6e3b1e" transform="translate(-0.6 -0.6) scale(.92)" />
            <path d="M-5 0 C -2 -1.6, 2 1.6, 5 0" stroke="#2a1408" strokeWidth="1.2" fill="none" />
          </g>
        )
      })}
    </g>
  )
}

function Tablecloth({ w, h }: { w: number; h: number }) {
  const id = useArtId()
  return (
    <>
      <defs>
        <pattern id={id('linen')} width="6" height="6" patternUnits="userSpaceOnUse">
          <rect width="6" height="6" fill="#f6f1e6" />
          <path d="M0 3 H6 M3 0 V6" stroke="#ece4d4" strokeWidth="0.8" />
        </pattern>
      </defs>
      <rect width={w} height={h} fill={url(id('linen'))} />
      <rect x="18" y="18" width={w - 36} height={h - 36} fill="none" stroke="#355443" strokeWidth="5" opacity="0.85" />
      <rect x="28" y="28" width={w - 56} height={h - 56} fill="none" stroke="#355443" strokeWidth="1.6" opacity="0.6" />
    </>
  )
}

function Counter({ w, h }: { w: number; h: number }) {
  const id = useArtId()
  const r = rand(5)
  const planks = 6
  const pw = w / planks
  return (
    <>
      <defs>
        <linearGradient id={id('wood')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#5a3420" />
          <stop offset="0.5" stopColor="#6e4229" />
          <stop offset="1" stopColor="#56311d" />
        </linearGradient>
      </defs>
      <rect width={w} height={h} fill={url(id('wood'))} />
      {Array.from({ length: planks }, (_, i) => (
        <g key={i}>
          <rect x={i * pw} y="0" width={pw} height={h} fill={i % 2 ? '#000' : '#fff'} opacity={0.025 + r() * 0.02} />
          {Array.from({ length: 4 }, (_, j) => {
            const x0 = i * pw + 10 + j * (pw / 4.2) + r() * 6
            return <path key={j} d={`M${x0} 0 C ${x0 + 4} ${h * 0.3}, ${x0 - 4} ${h * 0.6}, ${x0 + 2} ${h}`} stroke="#3e2213" strokeWidth="0.9" fill="none" opacity="0.22" />
          })}
          <rect x={i * pw} y="0" width="1.4" height={h} fill="#341c0f" opacity="0.7" />
        </g>
      ))}
    </>
  )
}

/** Mesa Clara: la mesa larga (mantel de bodegón, platos para compartir, pan y vino). */
export function HeroMesa({ size = 480, label, slice }: { size?: number; label?: string; slice?: boolean }) {
  return (
    <Frame size={size} label={label} w={480} h={560} slice={slice}>
      <Tablecloth w={480} h={560} />
      <Napkin x={330} y={420} r={12} />
      <Dish id="MC-06" x={248} y={40} s={1.32} r={-8} />
      <Dish id="MC-12" x={18} y={52} s={1.38} r={6} />
      <Cutlery x={214} y={238} r={-14} />
      <Glass x={418} y={268} />
      <Glass x={372} y={316} />
      <Dish id="MC-01" x={30} y={280} s={1.12} r={-4} />
      <Dish id="MC-04" x={232} y={300} s={1.12} r={10} />
      <BreadBasket x={150} y={482} />
    </Frame>
  )
}

/** Ritual Café: la barra (mostrador de madera, tazas con latte art y pastelería). */
export function HeroBarra({ size = 480, label, slice }: { size?: number; label?: string; slice?: boolean }) {
  return (
    <Frame size={size} label={label} w={480} h={560} slice={slice}>
      <Counter w={480} h={560} />
      <Beans n={26} w={480} h={560} seed={33} />
      <Dish id="RC-04" x={14} y={22} s={1.3} r={-10} />
      <Dish id="RC-05" x={270} y={40} s={1.12} r={14} />
      <Dish id="RC-11" x={196} y={244} s={1.2} r={-6} />
      <Dish id="RC-01" x={22} y={262} s={0.98} r={20} />
      <Dish id="RC-13" x={36} y={398} s={0.98} r={-8} />
      <Dish id="RC-10" x={322} y={424} s={0.84} r={0} />
    </Frame>
  )
}

function Frame({ size, label, w, h, children, slice }: { size: number; label?: string; w: number; h: number; children: ReactNode; slice?: boolean }) {
  return (
    <Art size={size} label={label} ratio={[w, h]} slice={slice} className="hero-art-svg">
      {children}
    </Art>
  )
}
