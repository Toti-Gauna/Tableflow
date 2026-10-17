import { useArtId, url } from '../kit'
import { scatter, type FamilyPiece } from './kit'

// Copo · heladería: la vitrina es el menú. Bochas brillantes con cuello festoneado, trocitos y baño;
// formatos reales (cucurucho, vasito, potes). Sin contorno, colores de gusto, luz de mostrador.

export type Gusto = 'frutilla' | 'ddl' | 'choco' | 'pistacho' | 'limon' | 'menta' | 'crema' | 'sambayon'
export const GUSTO: Record<Gusto, { name: string; base: string; light: string; dark: string; bits?: string }> = {
  frutilla: { name: 'Frutilla a la crema', base: '#f06a8a', light: '#ffb3c4', dark: '#b8325a', bits: '#c41f45' },
  ddl: { name: 'Dulce de leche granizado', base: '#c98a4d', light: '#ebbc84', dark: '#8a5527', bits: '#3e1d10' },
  choco: { name: 'Chocolate amargo', base: '#5a2d1c', light: '#8e5338', dark: '#2f150b' },
  pistacho: { name: 'Pistacho', base: '#a4c463', light: '#d3e79b', dark: '#6c8a34', bits: '#5d7a2a' },
  limon: { name: 'Limón', base: '#f6e27a', light: '#fff4b8', dark: '#c9ae35' },
  menta: { name: 'Menta granizada', base: '#9edcc8', light: '#d4f3e9', dark: '#5ea990', bits: '#2f1a12' },
  crema: { name: 'Crema americana', base: '#f7e7c6', light: '#fffaf0', dark: '#d8c193' },
  sambayon: { name: 'Sambayón', base: '#efc25a', light: '#fbe3a0', dark: '#b88a2a' },
}

function Defs() {
  const id = useArtId()
  return (
    <defs>
      <radialGradient id={id('shadow')} cx=".5" cy=".5" r=".5"><stop offset="0" stopColor="#3a1a12" stopOpacity=".28" /><stop offset="1" stopColor="#3a1a12" stopOpacity="0" /></radialGradient>
      <linearGradient id={id('cone')} x1="0" x2="1"><stop offset="0" stopColor="#c98a42" /><stop offset=".4" stopColor="#f0c27a" /><stop offset="1" stopColor="#a8682a" /></linearGradient>
      <linearGradient id={id('steel')} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#f2f4f6" /><stop offset=".5" stopColor="#b9c0c6" /><stop offset="1" stopColor="#e3e7ea" /></linearGradient>
      <linearGradient id={id('pote')} x1="0" x2="1"><stop offset="0" stopColor="#ffffff" /><stop offset=".6" stopColor="#f6efe6" /><stop offset="1" stopColor="#d9cfc2" /></linearGradient>
      <linearGradient id={id('choc')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#6b3a22" /><stop offset="1" stopColor="#2f150b" /></linearGradient>
      <radialGradient id={id('shine')} cx=".32" cy=".28" r=".5"><stop offset="0" stopColor="#fff" stopOpacity=".85" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></radialGradient>
    </defs>
  )
}

/** Bocha vista de costado: domo con cuello festoneado, brillo y trocitos del gusto. */
export function Bocha({ cx, cy, r = 22, g, seed = 1 }: { cx: number; cy: number; r?: number; g: Gusto; seed?: number }) {
  const id = useArtId()
  const c = GUSTO[g]
  const n = 9
  const lx = cx - r * 1.04
  const rxp = cx + r * 1.04
  const base = cy + r * 0.5
  const scallops = Array.from({ length: n }, (_, i) => {
    const x1 = rxp - (i * (rxp - lx)) / n
    const x0 = x1 - (rxp - lx) / n
    return `Q${((x0 + x1) / 2).toFixed(2)} ${(base + (i % 2 ? r * 0.14 : r * 0.22)).toFixed(2)} ${x0.toFixed(2)} ${base.toFixed(2)}`
  }).join(' ')
  const d = `M${lx} ${base}C${cx - r * 1.12} ${cy - r * 0.55} ${cx - r * 0.55} ${cy - r * 1.02} ${cx} ${cy - r}C${cx + r * 0.55} ${cy - r * 1.02} ${cx + r * 1.12} ${cy - r * 0.55} ${rxp} ${base}${scallops}Z`
  return (
    <g>
      <path d={d} fill={c.base} />
      <path d={`M${cx - r * 0.9} ${cy + r * 0.36}C${cx - r * 0.5} ${cy + r * 0.58} ${cx + r * 0.5} ${cy + r * 0.58} ${cx + r * 0.95} ${cy + r * 0.3}C${cx + r * 0.9} ${cy + r * 0.05} ${cx + r * 0.6} ${cy + r * 0.3} ${cx} ${cy + r * 0.34}C${cx - r * 0.5} ${cy + r * 0.34} ${cx - r * 0.85} ${cy + r * 0.18} ${cx - r * 0.9} ${cy + r * 0.36}Z`} fill={c.dark} opacity=".45" />
      <path d={`M${cx - r * 0.7} ${cy - r * 0.3}C${cx - r * 0.5} ${cy - r * 0.72} ${cx - r * 0.1} ${cy - r * 0.86} ${cx + r * 0.2} ${cy - r * 0.84}`} fill="none" stroke={c.light} strokeWidth={r * 0.16} strokeLinecap="round" />
      <ellipse cx={cx - r * 0.38} cy={cy - r * 0.48} rx={r * 0.34} ry={r * 0.22} fill={url(id('shine'))} />
      {c.bits && scatter(7, cx, cy - r * 0.15, r * 0.7, r * 0.5, seed).map(([x, y, k], i) => <ellipse key={i} cx={x} cy={y} rx={1 + k * 1.4} ry={0.8 + k} fill={c.bits} transform={`rotate(${k * 90} ${x} ${y})`} />)}
      {g === 'ddl' && <path d={`M${cx - r * 0.5} ${cy - r * 0.05}c${r * 0.3}-${r * 0.3} ${r * 0.7}-${r * 0.1} ${r * 0.9}-${r * 0.35}`} fill="none" stroke={c.dark} strokeWidth="2" strokeLinecap="round" opacity=".6" />}
    </g>
  )
}

/** Cucurucho de oblea con su cuadriculado. */
export function Cucurucho({ cx = 80, top = 92, w = 40, h = 58 }: { cx?: number; top?: number; w?: number; h?: number }) {
  const id = useArtId()
  const l = cx - w / 2
  const r = cx + w / 2
  const tip = top + h
  return (
    <g>
      <path d={`M${l} ${top}L${cx} ${tip}L${r} ${top}Z`} fill={url(id('cone'))} />
      <clipPath id={id('coneclip')}><path d={`M${l} ${top}L${cx} ${tip}L${r} ${top}Z`} /></clipPath>
      <g clipPath={url(id('coneclip'))} stroke="#9a5d22" strokeWidth="1.2" opacity=".75">
        {Array.from({ length: 24 }, (_, i) => i - 12).map((k) => <path key={`a${k}`} d={`M${l + k * 11} ${top}l${h * 0.7} ${h}`} />)}
        {Array.from({ length: 24 }, (_, i) => i - 12).map((k) => <path key={`b${k}`} d={`M${r - k * 11} ${top}l${-h * 0.7} ${h}`} />)}
      </g>
      <rect x={l - 2} y={top - 3} width={w + 4} height="7" rx="3.5" fill="#d99a4e" />
      <rect x={l} y={top - 2} width={w} height="2" rx="1" fill="#f6d39a" />
    </g>
  )
}

const GUSTOS = Object.keys(GUSTO) as Gusto[]

function CucuruchoSimple() {
  const id = useArtId()
  return (
    <g>
      <Defs />
      <ellipse cx="82" cy="150" rx="24" ry="4" fill={url(id('shadow'))} />
      <Cucurucho top={84} w={44} h={64} />
      <Bocha cx={80} cy={70} r={27} g="pistacho" seed={3} />
    </g>
  )
}

function CucuruchoBanado() {
  const id = useArtId()
  return (
    <g>
      <Defs />
      <ellipse cx="82" cy="150" rx="26" ry="4" fill={url(id('shadow'))} />
      <Cucurucho top={92} w={42} h={56} />
      <Bocha cx={80} cy={82} r={23} g="crema" seed={5} />
      <Bocha cx={80} cy={52} r={22} g="sambayon" seed={9} />
      {/* baño de chocolate que cubre la bocha de arriba y chorrea */}
      <path d="M57 54C55 34 66 28 80 28C94 28 105 34 103 54C100 58 98 52 96 60C94 66 90 60 89 56C87 64 84 68 82 60C80 54 76 66 73 58C70 52 68 62 65 58C62 54 60 60 57 54Z" fill={url(id('choc'))} />
      <path d="M64 38C68 32 76 30 84 31" fill="none" stroke="#a8684a" strokeWidth="3" strokeLinecap="round" />
      {[[70, 42], [84, 38], [92, 46], [76, 48], [62, 50]].map(([x, y], i) => <rect key={i} x={x} y={y} width="4" height="1.6" rx=".8" fill={['#f05a7e', '#f6e27a', '#9edcc8', '#fff'][i % 4]} transform={`rotate(${i * 40} ${x} ${y})`} />)}
    </g>
  )
}

function Vasito() {
  const id = useArtId()
  return (
    <g>
      <Defs />
      <ellipse cx="80" cy="148" rx="34" ry="5" fill={url(id('shadow'))} />
      <Bocha cx={68} cy={82} r={22} g="choco" seed={2} />
      <Bocha cx={94} cy={80} r={21} g="limon" seed={8} />
      <path d="M44 92H116L106 146H54Z" fill="#fffaf2" />
      <clipPath id={id('vas')}><path d="M44 92H116L106 146H54Z" /></clipPath>
      <g clipPath={url(id('vas'))}>{[0, 1, 2, 3, 4, 5].map((i) => <path key={i} d={`M${40 + i * 16} 92L${48 + i * 14} 146`} stroke="#f06a8a" strokeWidth="6" />)}</g>
      <path d="M44 92H116" stroke="#e9dccb" strokeWidth="3" />
      <path d="M112 96L128 56" stroke="#fff" strokeWidth="5" strokeLinecap="round" />
      <path d="M112 96L128 56" stroke="#e3d6c6" strokeWidth="1" />
      <ellipse cx="129" cy="52" rx="5" ry="7" fill="#fff" stroke="#e3d6c6" strokeWidth="1" transform="rotate(22 129 52)" />
    </g>
  )
}

/** Pote de cartón para llevar, con la tapa apoyada atrás y los gustos a la vista. */
function Pote({ w, h, gustos, label, k }: { w: number; h: number; gustos: Gusto[]; label: string; k: string }) {
  const id = useArtId()
  const cx = 80
  const top = 148 - h
  const ry = w * 0.2
  const bw = w * 0.82
  return (
    <g>
      <Defs />
      <ellipse cx={cx + 3} cy="150" rx={w * 0.55} ry="5" fill={url(id('shadow'))} />
      <ellipse cx={cx + w * 0.18} cy={top - ry * 0.6} rx={w * 0.52} ry={ry * 1.05} fill="#f6efe6" stroke="#d9cfc2" strokeWidth="1.2" transform={`rotate(-14 ${cx} ${top})`} />
      <path d={`M${cx - w / 2} ${top}L${cx - bw / 2} 146Q${cx} ${146 + ry * 0.6} ${cx + bw / 2} 146L${cx + w / 2} ${top}Z`} fill={url(id('pote'))} />
      <path d={`M${cx - w * 0.47} ${top + h * 0.38}L${cx + w * 0.47} ${top + h * 0.38}L${cx + w * 0.45} ${top + h * 0.58}L${cx - w * 0.45} ${top + h * 0.58}Z`} fill="#b8204f" />
      <text x={cx} y={top + h * 0.53} textAnchor="middle" style={{ font: `800 ${Math.round(h * 0.13)}px var(--font-hela, 'Nunito Variable', sans-serif)` }} fill="#fff">{label}</text>
      <ellipse cx={cx} cy={top} rx={w / 2} ry={ry} fill="#fffaf2" stroke="#d9cfc2" strokeWidth="1.2" />
      <clipPath id={id(`pt${k}`)}><ellipse cx={cx} cy={top} rx={w / 2 - 3} ry={ry - 2.4} /></clipPath>
      <g clipPath={url(id(`pt${k}`))}>
        {gustos.map((g, i) => {
          const c = GUSTO[g]
          const x0 = cx - w / 2 + (i * w) / gustos.length
          return (
            <g key={g}>
              <rect x={x0} y={top - ry} width={w / gustos.length + 1} height={ry * 2} fill={c.base} />
              <path d={`M${x0 + 4} ${top - 2}c4-5 10-5 14 0`} fill="none" stroke={c.light} strokeWidth="2.6" strokeLinecap="round" />
              <path d={`M${x0 + 6} ${top + 4}c4-4 8-4 12 0`} fill="none" stroke={c.dark} strokeWidth="1.6" strokeLinecap="round" opacity=".6" />
            </g>
          )
        })}
      </g>
      <path d={`M${cx - w / 2 + 5} ${top + 6}L${cx - bw / 2 + 5} 140`} stroke="#fff" strokeWidth="3" strokeLinecap="round" />
    </g>
  )
}

const Cuarto = () => <Pote k="q" w={70} h={50} gustos={['frutilla', 'ddl']} label="¼ kg" />
const Medio = () => <Pote k="m" w={90} h={62} gustos={['choco', 'crema', 'menta']} label="½ kg" />
const Kilo = () => <Pote k="k" w={116} h={80} gustos={['ddl', 'frutilla', 'pistacho', 'choco']} label="1 kg" />

/** Bacha de acero vista desde arriba, con las olas de la paleta. */
function Bacha({ g }: { g: Gusto }) {
  const id = useArtId()
  const c = GUSTO[g]
  return (
    <g>
      <Defs />
      <rect x="10" y="30" width="140" height="100" rx="10" fill={url(id('steel'))} stroke="#8d969d" strokeWidth="1" />
      <rect x="18" y="38" width="124" height="84" rx="6" fill={c.base} />
      {[0, 1, 2, 3].map((i) => (
        <path key={i} d={`M24 ${50 + i * 20}C40 ${42 + i * 20} 54 ${58 + i * 20} 72 ${48 + i * 20}S104 ${56 + i * 20} 136 ${46 + i * 20}`} fill="none" stroke={i % 2 ? c.dark : c.light} strokeWidth={i % 2 ? 2.4 : 4.4} strokeLinecap="round" opacity={i % 2 ? 0.5 : 0.9} />
      ))}
      {c.bits && scatter(16, 80, 80, 56, 36, 7).map(([x, y, k], i) => <ellipse key={i} cx={x} cy={y} rx={1.4 + k * 1.6} ry={1 + k} fill={c.bits} transform={`rotate(${k * 120} ${x} ${y})`} />)}
      {g === 'ddl' && <path d="M30 70C50 60 70 84 92 72S124 76 134 66" fill="none" stroke="#8a5527" strokeWidth="3.4" strokeLinecap="round" />}
      {g === 'choco' && [[44, 60], [90, 92], [118, 58]].map(([x, y]) => <ellipse key={x} cx={x} cy={y} rx="9" ry="4" fill="#8e5338" opacity=".7" />)}
      <path d="M118 36L152 6" stroke="#8d969d" strokeWidth="6" strokeLinecap="round" />
      <path d="M118 36L152 6" stroke="#e3e7ea" strokeWidth="3" strokeLinecap="round" />
      <path d="M104 50C108 42 116 36 122 36C120 46 112 52 104 50Z" fill="#d9dee2" stroke="#8d969d" strokeWidth="1" />
    </g>
  )
}

function Salsa() {
  const id = useArtId()
  return (
    <g>
      <Defs />
      <ellipse cx="80" cy="146" rx="40" ry="6" fill={url(id('shadow'))} />
      <path d="M46 70H114L108 138C108 144 96 146 80 146S52 144 52 138Z" fill="#f4f7f8" stroke="#c9d0d5" strokeWidth="1.2" />
      <path d="M49 84H111L108 138C108 144 96 146 80 146S52 144 52 138Z" fill="#5a2d1c" />
      <ellipse cx="80" cy="84" rx="31" ry="7" fill="#7a432a" />
      <path d="M56 90C58 110 60 126 64 138" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity=".5" />
      <ellipse cx="80" cy="70" rx="34" ry="8" fill="none" stroke="#c9d0d5" strokeWidth="1.2" />
      <path d="M92 84L124 30" stroke="#c9d0d5" strokeWidth="6" strokeLinecap="round" />
      <path d="M92 84L124 30" stroke="#f4f7f8" strokeWidth="3.4" strokeLinecap="round" />
      <path d="M94 82c-2 8 4 12 2 18" fill="none" stroke="#5a2d1c" strokeWidth="4" strokeLinecap="round" />
    </g>
  )
}

function Licuado() {
  const id = useArtId()
  return (
    <g>
      <Defs />
      <ellipse cx="80" cy="148" rx="30" ry="5" fill={url(id('shadow'))} />
      <path d="M50 34H110L102 144H58Z" fill="#f06a8a" />
      <path d="M50 34H110L109 46H51Z" fill="#ffd0dc" />
      <path d="M58 42L64 140" stroke="#ffb3c4" strokeWidth="5" strokeLinecap="round" opacity=".7" />
      <path d="M50 34H110L102 144H58Z" fill="none" stroke="#e9c6cf" strokeWidth="1.4" />
      <path d="M90 50L108 6" stroke="#fff" strokeWidth="6" strokeLinecap="round" />
      <path d="M90 50L108 6" stroke="#b8204f" strokeWidth="6" strokeLinecap="round" strokeDasharray="4 4" />
      <g transform="translate(50 34) scale(.5) translate(-80 -84)">
        <path d="M80 84C66 84 52 96 58 114C64 128 76 134 80 136C84 134 96 128 102 114C108 96 94 84 80 84Z" fill="#d7263d" />
        <path d="M80 86C72 78 62 80 60 84C70 86 76 86 80 88C84 86 90 86 100 84C98 80 88 78 80 86Z" fill="#3f8a3a" />
        {[[70, 104], [86, 100], [78, 118], [94, 112]].map(([x, y]) => <ellipse key={x} cx={x} cy={y} rx="2" ry="3" fill="#ffe08a" />)}
      </g>
    </g>
  )
}

function SoloBocha({ g }: { g: Gusto }) {
  return <g><Defs /><Bocha cx={80} cy={84} r={44} g={g} seed={GUSTOS.indexOf(g) + 1} /></g>
}

function CucuruchoVacio() {
  return <g><Defs /><Cucurucho top={46} w={66} h={100} /></g>
}

function CucuruchoDoble() {
  const id = useArtId()
  return (
    <g>
      <Defs />
      <ellipse cx="82" cy="150" rx="26" ry="4" fill={url(id('shadow'))} />
      <Cucurucho top={90} w={42} h={58} />
      <Bocha cx={80} cy={80} r={23} g="ddl" seed={4} />
      <Bocha cx={80} cy={50} r={21} g="frutilla" seed={7} />
    </g>
  )
}

export const COPO_FAMILY: FamilyPiece[] = [
  { key: 'H-cucurucho-1', name: 'Cucurucho de un gusto', group: 'carta', Comp: CucuruchoSimple },
  { key: 'H-cucurucho-2', name: 'Cucurucho de dos gustos', group: 'carta', Comp: CucuruchoDoble },
  { key: 'H-cucurucho-banado', name: 'Cucurucho con baño de chocolate', group: 'carta', Comp: CucuruchoBanado },
  { key: 'H-vasito', name: 'Vasito de dos gustos', group: 'carta', Comp: Vasito },
  { key: 'H-cuarto', name: 'Pote de ¼ kg', group: 'carta', Comp: Cuarto },
  { key: 'H-medio', name: 'Pote de ½ kg', group: 'carta', Comp: Medio },
  { key: 'H-kilo', name: 'Pote de 1 kg', group: 'carta', Comp: Kilo },
  ...GUSTOS.map((g) => ({ key: `H-bacha-${g}`, name: `Bacha de ${GUSTO[g].name.toLowerCase()}`, group: 'carta' as const, Comp: () => <Bacha g={g} /> })),
  { key: 'H-salsa', name: 'Salsa de chocolate (extra)', group: 'carta', Comp: Salsa },
  { key: 'H-licuado', name: 'Licuado de frutilla (sin alcohol)', group: 'carta', Comp: Licuado },
  ...GUSTOS.map((g) => ({ key: `jg-hela-${g}`, name: `Bocha de ${GUSTO[g].name.toLowerCase()} (copiá el helado)`, group: 'juego' as const, Comp: () => <SoloBocha g={g} /> })),
  { key: 'jg-hela-cucurucho', name: 'Cucurucho vacío (copiá el helado)', group: 'juego', Comp: CucuruchoVacio },
]
