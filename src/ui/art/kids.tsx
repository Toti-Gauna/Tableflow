import { Art, Cherry, Plate, rand, Sauce, Speckles, url, useArtId } from './kit'

// "Armá tu plato": un juego de composición. La comida forma una cara sobre el plato (base, sombrero, ojos y sonrisa).
// Mismo sistema de luz que la carta; sin fotos ni assets de terceros.

export type KidsBase = 'pure' | 'fideos' | 'arroz'
export type KidsTop = 'milanesa' | 'pollo' | 'huevo'
export type KidsEyes = 'tomatitos' | 'arvejas' | 'zanahoria'
export type KidsSmile = 'papas' | 'choclo' | 'brocoli'
export interface KidsPlateChoice { base: KidsBase; top: KidsTop; eyes: KidsEyes; smile: KidsSmile }

export const KIDS_OPTIONS = {
  base: [['pure', 'Puré'], ['fideos', 'Fideos'], ['arroz', 'Arroz']],
  top: [['milanesa', 'Milanesa'], ['pollo', 'Pollo'], ['huevo', 'Huevo frito']],
  eyes: [['tomatitos', 'Tomatitos'], ['arvejas', 'Arvejas'], ['zanahoria', 'Zanahoria']],
  smile: [['papas', 'Papas fritas'], ['choclo', 'Choclo'], ['brocoli', 'Brócoli']],
} as const

function Base({ kind }: { kind: KidsBase }) {
  if (kind === 'pure') {
    return (
      <>
        <Sauce cx={80} cy={84} r={44} color="crema" seed={9} />
        <path d="M52 92 C 62 84, 72 100, 84 90 C 94 82, 104 96, 110 88" stroke="#fffaf0" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.8" />
      </>
    )
  }
  if (kind === 'fideos') {
    const r = rand(17)
    return (
      <g>
        <Sauce cx={80} cy={84} r={42} color="manteca" seed={4} />
        {Array.from({ length: 16 }, (_, i) => {
          const a = r() * Math.PI * 2
          const d = 8 + r() * 26
          const x = 80 + Math.cos(a) * d
          const y = 86 + Math.sin(a) * d * 0.9
          return <path key={i} d={`M${x - 10} ${y} C ${x - 4} ${y - 8}, ${x + 4} ${y + 8}, ${x + 10} ${y}`} stroke={i % 2 ? '#f2cf7a' : '#e9bd5c'} strokeWidth="3.2" fill="none" strokeLinecap="round" />
        })}
      </g>
    )
  }
  return (
    <g>
      <Sauce cx={80} cy={84} r={42} color="crema" seed={21} />
      <Speckles cx={80} cy={84} rx={36} ry={32} n={90} color="#ffffff" min={1.2} max={2} seed={23} shape="flake" />
      <Speckles cx={80} cy={84} rx={36} ry={32} n={40} color="#e9e1cf" min={1} max={1.6} seed={29} shape="flake" />
    </g>
  )
}

function Top({ kind }: { kind: KidsTop }) {
  const id = useArtId()
  if (kind === 'milanesa') {
    return (
      <g>
        <ellipse cx="82" cy="47" rx="38" ry="15" fill="#3b2a1a" opacity="0.2" />
        <path d="M44 46 C 46 30, 116 28, 118 44 C 118 56, 46 58, 44 46 Z" fill={url(id('crumb'))} stroke="#a8662a" strokeWidth="1" />
        <Speckles cx={80} cy={43} rx={30} ry={8} n={30} color="#9a5a1d" min={0.5} max={1.2} seed={41} opacity={0.6} />
        <path d="M54 38 C 66 33, 86 32, 100 34" stroke="#fff3cf" strokeWidth="2.4" fill="none" strokeLinecap="round" opacity="0.8" />
      </g>
    )
  }
  if (kind === 'pollo') {
    return (
      <g>
        <path d="M50 46 C 50 30, 100 26, 108 40 C 112 50, 96 56, 80 56 C 64 56, 50 54, 50 46 Z" fill="#d4842f" />
        <path d="M54 44 C 56 34, 92 30, 102 40" stroke="#f6c06e" strokeWidth="4" fill="none" strokeLinecap="round" />
        <path d="M106 40 L120 30 C 124 26, 130 30, 126 34 C 130 36, 126 42, 122 38 Z" fill="#f6ecd8" stroke="#d9c8a6" strokeWidth="0.8" />
        <Speckles cx={78} cy={44} rx={22} ry={7} n={20} color="#8a4614" min={0.5} max={1.2} seed={45} opacity={0.6} />
      </g>
    )
  }
  return (
    <g>
      <path d="M44 44 C 40 30, 60 24, 74 28 C 84 22, 108 24, 116 38 C 122 50, 104 58, 86 56 C 70 60, 48 56, 44 44 Z" fill="#fffdf6" stroke="#eee4cf" strokeWidth="1" />
      <circle cx="80" cy="41" r="11" fill="#f6b52e" />
      <circle cx="76" cy="37" r="3.4" fill="#fde39a" />
    </g>
  )
}

function Eyes({ kind }: { kind: KidsEyes }) {
  if (kind === 'tomatitos') return <><Cherry x={62} y={74} r={8} /><Cherry x={98} y={74} r={8} /></>
  if (kind === 'arvejas') {
    return (
      <>
        {[[62, 74], [98, 74]].map(([x, y]) => (
          <g key={x}>
            {[[-4, -2], [3, -3], [0, 3], [-5, 4], [5, 3]].map(([dx, dy], i) => <circle key={i} cx={x + dx} cy={y + dy} r="3.6" fill={i % 2 ? '#6fae3f' : '#5b9a31'} stroke="#3e7426" strokeWidth="0.6" />)}
          </g>
        ))}
      </>
    )
  }
  return (
    <>
      {[62, 98].map((x) => (
        <g key={x}>
          <circle cx={x} cy={74} r="8" fill="#ef8a2e" stroke="#c4621a" strokeWidth="1" />
          <circle cx={x} cy={74} r="4.4" fill="#f6a855" />
          <circle cx={x - 2.4} cy={71.6} r="1.6" fill="#ffffff" opacity="0.7" />
        </g>
      ))}
    </>
  )
}

function Smile({ kind }: { kind: KidsSmile }) {
  const id = useArtId()
  const pts = Array.from({ length: 7 }, (_, i) => {
    const a = Math.PI * (0.15 + (0.7 * i) / 6)
    return [80 - Math.cos(a) * 28, 92 + Math.sin(a) * 16]
  })
  if (kind === 'papas') {
    return (
      <g>
        {pts.map(([x, y], i) => <rect key={i} x={x - 2.6} y={y - 8} width="5.2" height="16" rx="1.6" fill={url(id('fry'))} transform={`rotate(${(i - 3) * -14} ${x} ${y})`} />)}
      </g>
    )
  }
  if (kind === 'choclo') {
    return <g>{pts.flatMap(([x, y], i) => [<circle key={`a${i}`} cx={x} cy={y} r="3.6" fill="#f6cf3e" stroke="#d9a51a" strokeWidth="0.7" />, <circle key={`b${i}`} cx={x + 2} cy={y + 5} r="3" fill="#f2c22e" stroke="#d9a51a" strokeWidth="0.6" />])}</g>
  }
  return (
    <g>
      {pts.filter((_, i) => i % 2 === 0).map(([x, y], i) => (
        <g key={i}>
          <path d={`M${x} ${y + 4} L${x} ${y + 10}`} stroke="#6fae3f" strokeWidth="3" strokeLinecap="round" />
          {[[-4, 0], [4, 0], [0, -4], [0, 2]].map(([dx, dy], j) => <circle key={j} cx={x + dx} cy={y + dy} r="4" fill={j % 2 ? '#3e7426' : '#4f8a32'} />)}
        </g>
      ))}
    </g>
  )
}

/** Plato armado: base de fondo, "sombrero" arriba, ojos y sonrisa. */
export function KidsPlate({ choice, size = 220, label }: { choice: KidsPlateChoice; size?: number; label?: string }) {
  return (
    <Art size={size} label={label}>
      <Plate tone="dessert" r={68} cy={80} />
      <Base kind={choice.base} />
      <Top kind={choice.top} />
      <Eyes kind={choice.eyes} />
      <Smile kind={choice.smile} />
    </Art>
  )
}
