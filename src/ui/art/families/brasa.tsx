import { useArtId, url } from '../kit'
import { scatter, type FamilyPiece } from './kit'

// Brasa Rápida · brasa a la vista. Fotografía de producto dibujada: vista de frente, volúmenes grandes,
// brillo fuerte, marcas de parrilla y queso que se derrite. Colores saturados de parrilla.

function Defs() {
  const id = useArtId()
  return (
    <defs>
      <radialGradient id={id('shadow')} cx=".5" cy=".5" r=".5"><stop offset="0" stopColor="#1c0f08" stopOpacity=".34" /><stop offset="1" stopColor="#1c0f08" stopOpacity="0" /></radialGradient>
      <linearGradient id={id('bun')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f0a94a" /><stop offset=".55" stopColor="#d8822a" /><stop offset="1" stopColor="#a85a17" /></linearGradient>
      <linearGradient id={id('bunLow')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f6d08e" /><stop offset=".4" stopColor="#e2a352" /><stop offset="1" stopColor="#b26a22" /></linearGradient>
      <linearGradient id={id('patty')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#7a3a1a" /><stop offset=".5" stopColor="#4e220e" /><stop offset="1" stopColor="#2f1307" /></linearGradient>
      <linearGradient id={id('cheese')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffd34d" /><stop offset="1" stopColor="#f2a516" /></linearGradient>
      <linearGradient id={id('carton')} x1="0" x2="1"><stop offset="0" stopColor="#e0342a" /><stop offset=".55" stopColor="#c3241a" /><stop offset="1" stopColor="#8f160f" /></linearGradient>
      <linearGradient id={id('cup')} x1="0" x2="1"><stop offset="0" stopColor="#ffffff" /><stop offset=".6" stopColor="#f6f1ea" /><stop offset="1" stopColor="#d8cfc4" /></linearGradient>
      <linearGradient id={id('fry')} x1="0" x2="1"><stop offset="0" stopColor="#f6c445" /><stop offset=".5" stopColor="#ffdf7a" /><stop offset="1" stopColor="#e0a52a" /></linearGradient>
      <linearGradient id={id('crispy')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f0b04a" /><stop offset="1" stopColor="#b8681f" /></linearGradient>
      <radialGradient id={id('gloss')} cx=".35" cy=".25" r=".6"><stop offset="0" stopColor="#fff" stopOpacity=".7" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></radialGradient>
    </defs>
  )
}

export function Patty({ y, w = 116, cx = 80 }: { y: number; w?: number; cx?: number }) {
  const id = useArtId()
  const l = cx - w / 2
  return (
    <g>
      <path d={`M${l} ${y + 4}C${l} ${y - 4} ${l + 8} ${y - 6} ${cx} ${y - 6}C${l + w - 8} ${y - 6} ${l + w} ${y - 4} ${l + w} ${y + 4}C${l + w} ${y + 12} ${l + w - 8} ${y + 14} ${cx} ${y + 14}C${l + 8} ${y + 14} ${l} ${y + 12} ${l} ${y + 4}Z`} fill={url(id('patty'))} />
      {scatter(16, cx, y + 4, w * 0.44, 6, Math.round(y)).map(([x, yy, r], i) => <ellipse key={i} cx={x} cy={yy} rx={1 + r * 1.6} ry={0.8 + r * 0.8} fill={r > 0.5 ? '#8f4a22' : '#24100a'} />)}
      {[-36, -12, 12, 36].map((dx) => <path key={dx} d={`M${cx + dx - 8} ${y - 3}l14 12`} stroke="#1c0b04" strokeWidth="2.4" strokeLinecap="round" opacity=".55" />)}
    </g>
  )
}

export function Cheddar({ y, w = 120, cx = 80, drips = [0.18, 0.46, 0.78] }: { y: number; w?: number; cx?: number; drips?: number[] }) {
  const id = useArtId()
  const l = cx - w / 2
  const d = drips.map((t) => {
    const x = l + w * t
    return `L${x - 6} ${y + 3}C${x - 5} ${y + 13} ${x + 5} ${y + 13} ${x + 6} ${y + 3}`
  }).join('')
  return <path d={`M${l} ${y - 2}L${l + w} ${y - 2}L${l + w - 4} ${y + 4}${d.replace(/^L/, 'L')}L${l + 4} ${y + 4}Z`} fill={url(id('cheese'))} />
}

function Doble() {
  const id = useArtId()
  return (
    <g>
      <Defs />
      <ellipse cx="80" cy="140" rx="62" ry="8" fill={url(id('shadow'))} />
      <path d="M24 122C24 132 40 138 80 138C120 138 136 132 136 122Z" fill={url(id('bunLow'))} />
      <rect x="24" y="116" width="112" height="8" rx="4" fill="#f4cf8c" />
      <Patty y={106} />
      <Cheddar y={98} drips={[0.2, 0.55, 0.85]} />
      <Patty y={86} />
      <Cheddar y={78} drips={[0.12, 0.4, 0.7]} />
      <path d="M20 74C30 66 44 72 54 66C64 72 76 64 86 70C96 64 108 72 118 66C126 70 136 68 140 74C130 80 120 76 110 80C100 76 90 82 80 78C70 82 60 76 50 80C40 76 30 80 20 74Z" fill="#5fae3b" />
      <path d="M30 72C40 70 50 72 60 70" stroke="#a8de7c" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <path d="M22 70C22 34 48 20 80 20C112 20 138 34 138 70C138 74 132 76 80 76C28 76 22 74 22 70Z" fill={url(id('bun'))} />
      <ellipse cx="60" cy="36" rx="30" ry="12" fill={url(id('gloss'))} />
      {scatter(18, 80, 44, 48, 18, 11).map(([x, y, r], i) => <ellipse key={i} cx={x} cy={y} rx="2.6" ry="1.4" fill="#fff4dc" transform={`rotate(${-30 + r * 60} ${x} ${y})`} />)}
      <path d="M26 66C40 72 120 72 134 66" stroke="#a85a17" strokeWidth="1.4" fill="none" opacity=".5" />
    </g>
  )
}

/** Llama de la marca, en amarillo. */
export function Llama({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M0 14C-9 14-13 6-11-1C-9-7-4-9-4-15C2-11 4-6 3-2C6-4 7-7 7-10C12-5 12 4 9 8C7 12 4 14 0 14Z" fill="#ffb21a" />
      <path d="M0 12C-4 12-6 8-5 4C-4 1-1 0-1-4C2-2 3 1 2 4C4 3 5 1 5-1C7 2 7 6 5 8C4 11 2 12 0 12Z" fill="#fff3c2" />
    </g>
  )
}

function PanArriba({ y = 70, w = 116, cx = 80 }: { y?: number; w?: number; cx?: number }) {
  const id = useArtId()
  const l = cx - w / 2
  return (
    <g>
      <path d={`M${l} ${y}C${l} ${y - 36} ${l + w * 0.22} ${y - 50} ${cx} ${y - 50}C${l + w * 0.78} ${y - 50} ${l + w} ${y - 36} ${l + w} ${y}C${l + w} ${y + 4} ${l + w - 6} ${y + 6} ${cx} ${y + 6}C${l + 6} ${y + 6} ${l} ${y + 4} ${l} ${y}Z`} fill={url(id('bun'))} />
      <ellipse cx={cx - w * 0.18} cy={y - 34} rx={w * 0.26} ry="10" fill={url(id('gloss'))} />
      {scatter(14, cx, y - 26, w * 0.4, 14, Math.round(w)).map(([x, yy, r], i) => <ellipse key={i} cx={x} cy={yy} rx="2.6" ry="1.4" fill="#fff4dc" transform={`rotate(${-30 + r * 60} ${x} ${yy})`} />)}
    </g>
  )
}
function PanAbajo({ y = 122, w = 112, cx = 80 }: { y?: number; w?: number; cx?: number }) {
  const id = useArtId()
  const l = cx - w / 2
  return (
    <g>
      <path d={`M${l} ${y}C${l} ${y + 12} ${l + 16} ${y + 16} ${cx} ${y + 16}C${l + w - 16} ${y + 16} ${l + w} ${y + 12} ${l + w} ${y}Z`} fill={url(id('bunLow'))} />
      <rect x={l} y={y - 6} width={w} height="8" rx="4" fill="#f4cf8c" />
    </g>
  )
}
function Lechuga({ y, cx = 80, w = 122 }: { y: number; cx?: number; w?: number }) {
  const l = cx - w / 2
  const n = 8
  const d = Array.from({ length: n }, (_, i) => `Q${l + (i + 0.5) * (w / n)} ${y + (i % 2 ? 8 : 4)} ${l + (i + 1) * (w / n)} ${y + 2}`).join(' ')
  return (
    <g>
      <path d={`M${l} ${y - 4}C${l + w * 0.3} ${y - 9} ${l + w * 0.7} ${y - 9} ${l + w} ${y - 4}L${l + w} ${y + 2}L${l} ${y + 2}Z`} fill="#5fae3b" />
      <path d={`M${l} ${y + 2}${d}`} fill="#5fae3b" stroke="#5fae3b" strokeWidth="1" />
      <path d={`M${l + 8} ${y - 3}C${l + w * 0.3} ${y - 6} ${l + w * 0.5} ${y - 6} ${l + w * 0.6} ${y - 4}`} stroke="#a8de7c" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    </g>
  )
}
function Tomate({ y, cx = 80, w = 100 }: { y: number; cx?: number; w?: number }) {
  return (
    <g>
      {[-1, 1].map((k) => (
        <g key={k}>
          <rect x={cx + (k < 0 ? -w / 2 : 2)} y={y - 4} width={w / 2 - 2} height="9" rx="4" fill="#d9381f" />
          <rect x={cx + (k < 0 ? -w / 2 + 4 : 6)} y={y - 3} width={w / 2 - 10} height="3" rx="1.5" fill="#ff8a6b" />
        </g>
      ))}
    </g>
  )
}

function SimpleBody() {
  const id = useArtId()
  return (
    <g>
      <ellipse cx="80" cy="140" rx="60" ry="8" fill={url(id('shadow'))} />
      <PanAbajo y={122} />
      <Patty y={106} />
      <Cheddar y={98} drips={[0.2, 0.5, 0.82]} />
      <Tomate y={92} />
      <Lechuga y={86} />
      <PanArriba y={82} />
    </g>
  )
}

function PolloBody() {
  const id = useArtId()
  return (
    <g>
      <ellipse cx="80" cy="140" rx="60" ry="8" fill={url(id('shadow'))} />
      <PanAbajo y={122} />
      {/* pechuga crocante, de borde irregular y más ancha que el pan */}
      <path d="M16 112C14 102 22 96 30 98C34 90 46 92 52 94C60 88 74 90 80 94C88 88 102 90 108 94C116 90 128 94 130 100C140 100 146 108 142 114C138 122 124 120 118 122C108 126 92 124 80 124C66 126 50 124 40 122C28 124 16 120 16 112Z" fill={url(id('crispy'))} />
      {scatter(30, 80, 108, 58, 10, 3).map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={0.8 + r * 1.4} fill={r > 0.5 ? '#f8cf7a' : '#9a5216'} />)}
      <path d="M24 98C40 92 60 92 76 94" stroke="#ffd98a" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <Lechuga y={92} />
      <path d="M26 86C40 92 60 84 80 90S120 84 134 88" fill="none" stroke="#fffaf0" strokeWidth="5" strokeLinecap="round" />
      <PanArriba y={84} />
    </g>
  )
}

const Simple = () => <g><Defs /><SimpleBody /></g>
const Pollo = () => <g><Defs /><PolloBody /></g>

/** Cartón de papas en tres tamaños. */
function PapasBody({ h }: { h: number }) {
  const id = useArtId()
  const top = 150 - h
  const w = 40 + h * 0.3
  const l = 80 - w / 2
  const fries = scatter(14, 80, top - 6, w * 0.42, 6, Math.round(h)).sort((a, b) => a[0] - b[0])
  return (
    <g>
      <ellipse cx="82" cy="150" rx={w * 0.6} ry="5" fill={url(id('shadow'))} />
      {fries.map(([x, y, r], i) => <g key={i} transform={`rotate(${-14 + r * 28} ${x} ${y + 20})`}><rect x={x - 3.4} y={y - 18 - r * 12} width="6.8" height={44 + r * 10} rx="2" fill={url(id('fry'))} /><rect x={x - 3.4} y={y - 18 - r * 12} width="6.8" height="4" rx="2" fill="#d99a2a" /></g>)}
      <path d={`M${l} ${top}C${l + w * 0.3} ${top + 10} ${l + w * 0.7} ${top + 10} ${l + w} ${top}L${l + w - 8} 148H${l + 8}Z`} fill={url(id('carton'))} />
      <path d={`M${l} ${top}C${l + w * 0.3} ${top + 10} ${l + w * 0.7} ${top + 10} ${l + w} ${top}`} fill="none" stroke="#8f160f" strokeWidth="1.6" />
      <Llama x={80} y={top + (148 - top) * 0.55} s={h / 60} />
      <path d={`M${l + 6} ${top + 8}L${l + 12} 142`} stroke="#ff7a6a" strokeWidth="3" strokeLinecap="round" opacity=".6" />
    </g>
  )
}
const Papas = ({ h }: { h: number }) => <g><Defs /><PapasBody h={h} /></g>
const PapasCh = () => <Papas h={52} />
const PapasMd = () => <Papas h={66} />
const PapasGr = () => <Papas h={80} />

/** Vaso de gaseosa con tapa y sorbete, en tres tamaños. */
function VasoBody({ h }: { h: number }) {
  const id = useArtId()
  const top = 150 - h
  const w = 34 + h * 0.3
  const l = 80 - w / 2
  return (
    <g>
      <ellipse cx="82" cy="150" rx={w * 0.55} ry="5" fill={url(id('shadow'))} />
      <path d={`M90 ${top - 4}L104 ${top - 36}`} stroke="#c3241a" strokeWidth="5" strokeLinecap="round" />
      <path d={`M${l} ${top}L${l + w * 0.1} 148H${l + w * 0.9}L${l + w} ${top}Z`} fill={url(id('cup'))} />
      <path d={`M${l + w * 0.03} ${top + h * 0.3}L${l + w * 0.97} ${top + h * 0.3}L${l + w * 0.95} ${top + h * 0.62}L${l + w * 0.05} ${top + h * 0.62}Z`} fill="#c3241a" />
      <Llama x={80} y={top + h * 0.46} s={h / 80} />
      <rect x={l - 3} y={top - 7} width={w + 6} height="9" rx="4" fill="#f2ede6" stroke="#cfc6ba" strokeWidth="1" />
      <ellipse cx="80" cy={top - 7} rx={w * 0.36} ry="3" fill="#e2dbd1" />
      <path d={`M${l + 6} ${top + 6}L${l + 10} 142`} stroke="#fff" strokeWidth="3" strokeLinecap="round" />
    </g>
  )
}
const Vaso = ({ h }: { h: number }) => <g><Defs /><VasoBody h={h} /></g>
const VasoCh = () => <Vaso h={60} />
const VasoMd = () => <Vaso h={76} />
const VasoGr = () => <Vaso h={92} />

function Nuggets() {
  const id = useArtId()
  return (
    <g>
      <Defs />
      <ellipse cx="80" cy="146" rx="64" ry="7" fill={url(id('shadow'))} />
      <path d="M24 82L44 54H116L136 82Z" fill="#8f160f" />
      {[[50, 76], [70, 72], [92, 76], [110, 72], [60, 64], [84, 62], [102, 64]].map(([x, y], i) => (
        <g key={i} transform={`translate(${x} ${y}) rotate(${i * 30})`}>
          <path d="M-12 2C-12-8-2-12 6-10C14-8 14 4 8 8C2 12-12 10-12 2Z" fill={url(id('crispy'))} />
          {[[-6, -2], [2, -6], [4, 3]].map(([a, b]) => <circle key={a} cx={a} cy={b} r="1.4" fill="#f8cf7a" />)}
        </g>
      ))}
      <path d="M24 82H136L128 142H32Z" fill={url(id('carton'))} />
      <Llama x={80} y={112} s={1.3} />
      <path d="M30 88L36 136" stroke="#ff7a6a" strokeWidth="3" strokeLinecap="round" opacity=".6" />
      <g transform="translate(130 128)">
        <path d="M-14 0H14L11 14H-11Z" fill="#fff" stroke="#cfc6ba" strokeWidth="1" />
        <ellipse cy="0" rx="14" ry="4" fill="#e04a2a" />
      </g>
    </g>
  )
}

function Cono() {
  const id = useArtId()
  return (
    <g>
      <Defs />
      <ellipse cx="80" cy="150" rx="18" ry="4" fill={url(id('shadow'))} />
      <path d="M62 84L80 148L98 84Z" fill="#e0a052" />
      {[0, 1, 2, 3].map((i) => <path key={i} d={`M${64 + i * 4} ${92 + i * 12}H${96 - i * 4}`} stroke="#b0702a" strokeWidth="1.6" />)}
      <path d="M58 84C54 70 64 64 72 64C64 54 72 40 82 42C80 34 90 26 96 30C94 38 104 44 98 52C108 56 108 70 100 72C106 78 104 86 98 86Z" fill="#fffaf2" stroke="#e9dfd0" strokeWidth="1.2" />
      <path d="M66 74C76 70 88 72 96 70M72 60C80 56 90 58 96 54" fill="none" stroke="#ebe1d2" strokeWidth="2" strokeLinecap="round" />
      <path d="M70 66c2-6 8-8 12-8" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" />
    </g>
  )
}

function Combo() {
  return (
    <g>
      <Defs />
      <g transform="translate(-10 34) scale(.58)"><PapasBody h={80} /></g>
      <g transform="translate(76 24) scale(.62)"><VasoBody h={92} /></g>
      <g transform="translate(22 56) scale(.72)"><SimpleBody /></g>
    </g>
  )
}

/** El mismo cartón y vaso, con el sándwich de pollo al frente. */
function ComboPollo() {
  return (
    <g>
      <Defs />
      <g transform="translate(-10 34) scale(.58)"><PapasBody h={80} /></g>
      <g transform="translate(76 24) scale(.62)"><VasoBody h={92} /></g>
      <g transform="translate(22 56) scale(.72)"><PolloBody /></g>
    </g>
  )
}

function Agua() {
  const id = useArtId()
  return (
    <g>
      <Defs />
      <ellipse cx="82" cy="150" rx="22" ry="4" fill={url(id('shadow'))} />
      <path d="M72 14H88V32C88 38 100 42 100 54V144C100 148 96 150 80 150S60 148 60 144V54C60 42 72 38 72 32Z" fill="#d6ecf6" opacity=".9" stroke="#9cc0cf" strokeWidth="1.2" />
      <rect x="60" y="74" width="40" height="30" fill="#c3241a" />
      <Llama x={80} y={89} s={0.9} />
      <rect x="72" y="8" width="16" height="9" rx="2" fill="#ffb21a" />
      <path d="M66 58V138" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity=".7" />
    </g>
  )
}

const IngPanArriba = () => <g><Defs /><PanArriba y={104} w={136} /></g>
const IngPanAbajo = () => <g><Defs /><PanAbajo y={78} w={136} /></g>
const IngCarne = () => <g><Defs /><Patty y={78} w={136} /></g>
const IngQueso = () => {
  const id = useArtId()
  return <g><Defs /><path d="M18 64L80 44L142 64L80 84Z" fill={url(id('cheese'))} /><path d="M18 64L80 84V92L18 72Z" fill="#e6960f" /><path d="M80 84L142 64V72L80 92Z" fill="#f2a516" /><path d="M120 70c2 10-4 14-6 18" stroke="#f2a516" strokeWidth="6" strokeLinecap="round" /></g>
}
const IngLechuga = () => <g><Defs /><Lechuga y={82} w={140} /></g>
const IngTomate = () => (
  <g>
    <circle cx="80" cy="80" r="56" fill="#d9381f" />
    <circle cx="80" cy="80" r="48" fill="#f05a3c" />
    {[0, 72, 144, 216, 288].map((a) => <g key={a} transform={`rotate(${a} 80 80)`}><path d="M80 80L80 36" stroke="#d9381f" strokeWidth="5" /><ellipse cx="80" cy="54" rx="8" ry="12" fill="#ffb4a2" />{[48, 58].map((y) => <ellipse key={y} cx="80" cy={y} rx="1.6" ry="2.4" fill="#fff3c2" />)}</g>)}
    <circle cx="80" cy="80" r="8" fill="#ffb4a2" />
  </g>
)
const IngCebolla = () => <g>{[52, 42, 32, 22].map((r, i) => <circle key={r} cx="80" cy="80" r={r} fill="none" stroke={i % 2 ? '#e3c6e6' : '#b56bbf'} strokeWidth="7" />)}<circle cx="80" cy="80" r="56" fill="none" stroke="#7f3a8c" strokeWidth="2" /></g>
const IngPepino = () => (
  <g>
    <circle cx="80" cy="80" r="52" fill="#3f7a2a" />
    <circle cx="80" cy="80" r="46" fill="#a8cf6a" />
    {Array.from({ length: 8 }, (_, i) => <ellipse key={i} cx="80" cy="56" rx="4" ry="7" fill="#e9f3c8" transform={`rotate(${i * 45} 80 80)`} />)}
    <circle cx="80" cy="80" r="10" fill="#d6e8a0" />
  </g>
)

export const BRASA_FAMILY: FamilyPiece[] = [
  { key: 'BR-03', name: 'Hamburguesa clásica', group: 'carta', Comp: Simple },
  { key: 'BR-04', name: 'Hamburguesa doble con cheddar', group: 'carta', Comp: Doble },
  { key: 'BR-05', name: 'Sándwich de pollo crocante', group: 'carta', Comp: Pollo },
  { key: 'B-papas-ch', name: 'Papas chicas', group: 'carta', Comp: PapasCh },
  { key: 'BR-06', name: 'Papas medianas', group: 'carta', Comp: PapasMd },
  { key: 'B-papas-gr', name: 'Papas grandes', group: 'carta', Comp: PapasGr },
  { key: 'BR-07', name: 'Nuggets de pollo', group: 'carta', Comp: Nuggets },
  { key: 'B-vaso-ch', name: 'Gaseosa chica (sin alcohol)', group: 'carta', Comp: VasoCh },
  { key: 'BR-08', name: 'Gaseosa mediana (sin alcohol)', group: 'carta', Comp: VasoMd },
  { key: 'B-vaso-gr', name: 'Gaseosa grande (sin alcohol)', group: 'carta', Comp: VasoGr },
  { key: 'BR-09', name: 'Agua mineral', group: 'carta', Comp: Agua },
  { key: 'BR-10', name: 'Cono de helado', group: 'carta', Comp: Cono },
  { key: 'BR-02', name: 'Combo Pollo crocante', group: 'carta', Comp: ComboPollo },
  { key: 'BR-01', name: 'Combo Doble con cheddar: hamburguesa, papas y bebida', group: 'carta', Comp: Combo },
  { key: 'jg-rapida-pan-arriba', name: 'Pan de arriba (armá la hamburguesa)', group: 'juego', Comp: IngPanArriba },
  { key: 'jg-rapida-pan-abajo', name: 'Pan de abajo (armá la hamburguesa)', group: 'juego', Comp: IngPanAbajo },
  { key: 'jg-rapida-carne', name: 'Medallón de carne (armá la hamburguesa)', group: 'juego', Comp: IngCarne },
  { key: 'jg-rapida-queso', name: 'Feta de cheddar (armá la hamburguesa)', group: 'juego', Comp: IngQueso },
  { key: 'jg-rapida-lechuga', name: 'Lechuga (armá la hamburguesa)', group: 'juego', Comp: IngLechuga },
  { key: 'jg-rapida-tomate', name: 'Rodaja de tomate (armá la hamburguesa)', group: 'juego', Comp: IngTomate },
  { key: 'jg-rapida-cebolla', name: 'Aros de cebolla morada (armá la hamburguesa)', group: 'juego', Comp: IngCebolla },
  { key: 'jg-rapida-pepino', name: 'Pepino (armá la hamburguesa)', group: 'juego', Comp: IngPepino },
]
