import { useArtId, url } from '../kit'
import { scatter, type FamilyPiece } from './kit'

// Taberna Compás · club de jazz y tapas. Gráfica de tapa de disco: dos tintas (azul y mostaza) más el
// trazo, semitono de puntos en vez de degradés y formas recortadas. El trazo y el papel cambian con el
// tema (variables --cp-line / --cp-paper): tinta negra sobre crema en claro, crema sobre noche en oscuro.

export const BLUE = '#1a4fa0'
export const MUSTARD = '#e39b1b'
export const RED = '#c2402a'
const LINE = { stroke: 'var(--cp-line, #121212)' }
const LINE_FILL = { fill: 'var(--cp-line, #121212)' }
const PAPER = { fill: 'var(--cp-paper, #efe7d6)' }

function Defs() {
  const id = useArtId()
  return (
    <defs>
      <pattern id={id('ht')} width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(30)"><circle cx="2" cy="2" r="1.05" style={LINE_FILL} /></pattern>
      <pattern id={id('htB')} width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(30)"><circle cx="2" cy="2" r="1.25" fill={BLUE} /></pattern>
      <pattern id={id('htM')} width="3.4" height="3.4" patternUnits="userSpaceOnUse" patternTransform="rotate(30)"><circle cx="1.7" cy="1.7" r=".9" fill="#a8650a" /></pattern>
    </defs>
  )
}

/** Cazuela de barro a tres cuartos, en azul con semitono. */
export function Cazuela({ cx = 80, cy = 96, rx = 58, ry = 22, depth = 18 }: { cx?: number; cy?: number; rx?: number; ry?: number; depth?: number }) {
  const id = useArtId()
  return (
    <g>
      <path d={`M${cx - rx} ${cy}C${cx - rx} ${cy + depth + ry * 0.9} ${cx + rx} ${cy + depth + ry * 0.9} ${cx + rx} ${cy}Z`} fill={BLUE} style={LINE} strokeWidth="2" />
      <clipPath id={id('cz')}><path d={`M${cx - rx} ${cy}C${cx - rx} ${cy + depth + ry * 0.9} ${cx + rx} ${cy + depth + ry * 0.9} ${cx + rx} ${cy}Z`} /></clipPath>
      <rect x={cx + rx * 0.15} y={cy} width={rx} height={depth + ry} fill={url(id('ht'))} opacity=".6" clipPath={url(id('cz'))} />
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} style={{ ...PAPER, ...LINE }} strokeWidth="2" />
      <ellipse cx={cx} cy={cy + 1} rx={rx - 6} ry={ry - 4} fill={BLUE} />
      <ellipse cx={cx} cy={cy + 2} rx={rx - 6} ry={ry - 4} fill={url(id('ht'))} opacity=".5" />
    </g>
  )
}

/** Papa frita en cubo de cantos redondeados: cara de arriba mostaza, costados en semitono. */
function Cubo({ x, y, r = 0, s = 1 }: { x: number; y: number; r?: number; s?: number }) {
  const id = useArtId()
  return (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
      <path d="M-9-4Q-9-8-5-8H5Q9-8 9-4V5Q9 9 5 9H-5Q-9 9-9 5Z" fill="#f6c45a" style={LINE} strokeWidth="1.3" />
      <path d="M-9 1Q-9 9-5 9H5Q9 9 9 5V1Q9 4 5 4H-5Q-9 4-9 1Z" fill={url(id('htM'))} />
      <path d="M-5-5H3" stroke="#fff3c2" strokeWidth="1.6" strokeLinecap="round" />
    </g>
  )
}

function Bravas() {
  const cubes = scatter(12, 80, 92, 44, 12, 5).sort((a, b) => a[1] - b[1])
  return (
    <g>
      <Defs />
      <Cazuela cx={80} cy={98} rx={64} ry={24} depth={20} />
      {cubes.map(([x, y, r], i) => <Cubo key={i} x={x} y={y - 2} r={-25 + r * 50} s={1.05} />)}
      {/* salsa brava en hilos y alioli en gotas, no en manchones */}
      <path d="M50 86C58 80 66 92 74 84S90 80 96 88S108 92 112 86" fill="none" stroke={RED} strokeWidth="4.2" strokeLinecap="round" />
      <path d="M54 98C62 94 70 102 80 96S96 96 104 100" fill="none" stroke={RED} strokeWidth="3.4" strokeLinecap="round" />
      {[[62, 90], [88, 92], [74, 100], [100, 94], [58, 82]].map(([x, y]) => <ellipse key={x} cx={x} cy={y} rx="2.6" ry="1.8" fill="#fff6dc" />)}
      {/* dos escarbadientes clavados */}
      <path d="M90 84L104 54M68 90L62 60" style={LINE} strokeWidth="2.2" strokeLinecap="round" />
    </g>
  )
}

const L = (w = 1.6) => ({ ...LINE, strokeWidth: w, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const })

/** Plato plano de loza, crema con filete del trazo. */
function Plato({ cx = 80, cy = 104, rx = 66, ry = 26 }: { cx?: number; cy?: number; rx?: number; ry?: number }) {
  const id = useArtId()
  return (
    <g>
      <ellipse cx={cx + 3} cy={cy + 4} rx={rx} ry={ry} fill={url(id('ht'))} opacity=".45" />
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} style={{ ...PAPER, ...L(2) }} />
      <ellipse cx={cx} cy={cy} rx={rx * 0.74} ry={ry * 0.7} fill="none" style={L(1)} />
    </g>
  )
}

/** Tabla de madera en mostaza con semitono. */
function Tablita({ cx = 80, cy = 104, w = 132, h = 44 }: { cx?: number; cy?: number; w?: number; h?: number }) {
  const id = useArtId()
  const l = cx - w / 2
  return (
    <g>
      <rect x={l} y={cy - h / 2 + 6} width={w} height={h} rx="8" fill={url(id('htM'))} style={L(2)} />
      <rect x={l} y={cy - h / 2} width={w} height={h} rx="8" fill={MUSTARD} style={L(2)} />
      <path d={`M${l + 10} ${cy - 6}H${l + w - 30}M${l + 22} ${cy + 8}H${l + w - 12}`} style={L(1)} opacity=".5" />
      <path d={`M${l + w} ${cy - 4}h14a6 6 0 0 1 0 12h-14`} fill={MUSTARD} style={L(2)} />
    </g>
  )
}

function Croquetas() {
  const id = useArtId()
  return (
    <g>
      <Defs />
      <Plato />
      {[[52, 98, -14], [80, 92, 4], [108, 100, 16], [78, 110, -6]].map(([x, y, r], i) => (
        <g key={i} transform={`translate(${x} ${y}) rotate(${r})`}>
          <rect x="-18" y="-10" width="36" height="20" rx="10" fill={MUSTARD} style={L(1.6)} />
          <rect x="-16" y="0" width="32" height="9" rx="4.5" fill={url(id('htM'))} />
          <path d="M-10-5h12" stroke="#fff3c2" strokeWidth="2" strokeLinecap="round" />
        </g>
      ))}
      <path d="M96 84c6-8 16-8 20-2-6 6-14 8-20 2z" fill={BLUE} style={L(1.2)} />
      <path d="M100 82c4-3 9-3 12-1" stroke="#fff" strokeWidth="1.2" fill="none" />
    </g>
  )
}

function Pincho() {
  const id = useArtId()
  return (
    <g>
      <Defs />
      <Plato cy={112} rx={60} ry={22} />
      {/* rebanada de pan y una cuña alta de tortilla con su palillo */}
      <path d="M36 112L44 98H118L124 112Z" fill="#f6e3b0" style={L(1.6)} />
      <path d="M44 98L56 60H104L118 98Z" fill={MUSTARD} style={L(2)} />
      <path d="M56 60L104 60L112 80L50 80Z" fill={url(id('htM'))} opacity=".7" />
      {[[66, 76, 5], [88, 70, 4], [96, 88, 5], [74, 90, 4]].map(([x, y, r]) => <ellipse key={x} cx={x} cy={y} rx={r} ry={r * 0.7} fill="#fff1c0" style={L(1)} />)}
      <path d="M80 58V22" style={L(2.4)} />
      <path d="M80 26l-6-6M80 26l6-6" style={L(1.6)} />
    </g>
  )
}

function PanTomate() {
  const id = useArtId()
  return (
    <g>
      <Defs />
      <Tablita cy={108} />
      {[[30, 88, -6], [84, 92, 6]].map(([x, y, r], i) => (
        <g key={i} transform={`translate(${x} ${y}) rotate(${r})`}>
          <path d="M0 6C0-4 8-10 22-10C38-10 48-4 48 6V12H0Z" fill="#f6e3b0" style={L(1.8)} />
          <path d="M3 4C4-3 12-6 22-6C34-6 44-3 45 4C34 8 14 8 3 4Z" fill={RED} />
          <path d="M3 4C14 8 34 8 45 4V12H3Z" fill={url(id('ht'))} opacity=".35" />
          {[[14, 0], [28, -2], [36, 2]].map(([a, b]) => <ellipse key={a} cx={a} cy={b} rx="2.6" ry="1.4" fill="#8bc34a" />)}
          <path d="M8 -2h8" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
        </g>
      ))}
    </g>
  )
}

function Rabas() {
  return (
    <g>
      <Defs />
      <Plato />
      {[[52, 100], [70, 94], [88, 98], [106, 94], [62, 110], [84, 112], [102, 108], [76, 104]].map(([x, y], i) => (
        <g key={i} transform={`translate(${x} ${y}) rotate(${i * 25})`}>
          <ellipse rx="11" ry="7" fill={MUSTARD} style={L(1.5)} />
          <ellipse rx="5.6" ry="3.2" style={{ ...PAPER, ...L(1.1) }} />
        </g>
      ))}
      <path d="M110 76c10-10 22-6 24 2-8 8-18 8-24-2z" fill="#f6e15b" style={L(1.4)} />
      <path d="M114 76c6-5 13-4 16 0" stroke="#fff" strokeWidth="1.4" fill="none" />
    </g>
  )
}

function TablaQuesos() {
  const id = useArtId()
  return (
    <g>
      <Defs />
      <Tablita cy={108} w={136} h={48} />
      <path d="M22 100L46 82L62 104Z" fill="#f6d36b" style={L(1.6)} />
      <path d="M22 100L62 104L62 112L22 108Z" fill={url(id('htM'))} />
      {[[34, 98], [46, 94], [40, 102]].map(([x, y]) => <circle key={x} cx={x} cy={y} r="2" style={{ ...PAPER, ...L(.8) }} />)}
      {[[78, 92], [92, 98], [84, 106]].map(([x, y], i) => <g key={i}><circle cx={x} cy={y} r="10" fill={RED} style={L(1.4)} />{[[-3, -3], [3, 1], [-1, 4]].map(([a, b]) => <circle key={a} cx={x + a} cy={y + b} r="1.4" fill="#fbd0c8" />)}</g>)}
      {[[112, 92], [122, 98], [114, 104], [124, 108]].map(([x, y]) => <ellipse key={x} cx={x} cy={y} rx="5" ry="6" fill="#3d5a1e" style={L(1.1)} />)}
      <path d="M50 116L58 128M70 118L66 130" style={L(1.6)} />
    </g>
  )
}

function Aceitunas() {
  const id = useArtId()
  return (
    <g>
      <Defs />
      <path d="M34 92C34 126 126 126 126 92Z" fill={BLUE} style={L(2)} />
      <path d="M90 116C110 110 124 100 126 92H96Z" fill={url(id('ht'))} opacity=".55" />
      <ellipse cx="80" cy="92" rx="46" ry="16" style={{ ...PAPER, ...L(2) }} />
      {scatter(11, 80, 88, 32, 9, 4).map(([x, y, r], i) => (
        <g key={i} transform={`translate(${x} ${y}) rotate(${r * 60 - 30})`}>
          <ellipse rx="7" ry="5.4" fill={i % 3 ? '#4f6b22' : '#2b2b2b'} style={L(1.1)} />
          <ellipse cx="-2" cy="-2" rx="2" ry="1.2" fill="#fff" opacity=".7" />
        </g>
      ))}
      <path d="M112 74l18-28" style={L(2.2)} />
    </g>
  )
}

function Montadito() {
  return (
    <g>
      <Defs />
      <Plato cy={112} rx={60} ry={22} />
      {[[44, 98], [92, 94]].map(([x, y], i) => (
        <g key={i} transform={`translate(${x} ${y})`}>
          <path d="M0 10C0 2 6-2 14-2H34C42-2 48 2 48 10V18H0Z" fill="#f6e3b0" style={L(1.6)} />
          <path d="M2 6C10-2 20 4 26-2S40 2 46 4C40 10 30 6 24 10S8 10 2 6Z" fill="#d65a62" style={L(1.2)} />
          <path d="M8 4c6-3 12 1 18-2" stroke="#fbd0c8" strokeWidth="1.6" fill="none" strokeLinecap="round" />
          <path d="M24 -2V-34" style={L(2)} />
          <ellipse cx="24" cy="-36" rx="5" ry="6" fill="#3d5a1e" style={L(1.1)} />
        </g>
      ))}
    </g>
  )
}

/** Vaso alto de bebida sin alcohol, con rodaja y hojitas. */
function Trago({ color, fruit = '#f6e15b', mint = true, k }: { color: string; fruit?: string; mint?: boolean; k: string }) {
  const id = useArtId()
  return (
    <g>
      <Defs />
      <clipPath id={id(`tr${k}`)}><path d="M50 30H110L104 146H56Z" /></clipPath>
      <g clipPath={url(id(`tr${k}`))}>
        <rect x="40" y="52" width="80" height="100" fill={color} />
        <rect x="80" y="52" width="40" height="100" fill={url(id('ht'))} opacity=".22" />
        {[[66, 68], [88, 84], [70, 104]].map(([x, y], i) => <rect key={i} x={x - 9} y={y - 9} width="18" height="18" rx="3" style={{ ...PAPER, ...L(1.2) }} opacity=".85" transform={`rotate(${i * 20 - 10} ${x} ${y})`} />)}
      </g>
      <path d="M50 30H110L104 146H56Z" fill="none" style={L(2)} />
      <path d="M56 40L62 138" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity=".55" />
      <circle cx="110" cy="34" r="14" fill={fruit} style={L(1.6)} />
      <circle cx="110" cy="34" r="9" fill="none" style={L(1)} />
      {[0, 60, 120].map((a) => <path key={a} d="M110 25V43" style={L(1)} transform={`rotate(${a} 110 34)`} />)}
      {mint && <path d="M62 30c-4-10 4-16 10-12-2 6-6 10-10 12zM72 30c2-10 12-12 14-6-4 4-10 6-14 6z" fill="#5c9a3a" style={L(1.1)} />}
      <path d="M92 52L100 8" style={L(3)} />
    </g>
  )
}

const Limonada = () => <Trago k="li" color="#f3e48c" />
const Pomelo = () => <Trago k="po" color="#f6a7a0" fruit="#f08a7a" mint={false} />

function Jarra() {
  const id = useArtId()
  return (
    <g>
      <Defs />
      <clipPath id={id('jar')}><path d="M42 30H110L116 136C116 142 110 146 104 146H50C44 146 38 142 38 136Z" /></clipPath>
      <g clipPath={url(id('jar'))}>
        <rect x="30" y="56" width="100" height="100" fill="#f3e48c" />
        <rect x="80" y="56" width="50" height="100" fill={url(id('ht'))} opacity=".2" />
        {[[58, 76], [84, 70], [70, 98], [96, 104]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="11" fill="#f6e15b" style={L(1.2)} />)}
      </g>
      <path d="M42 30H110L116 136C116 142 110 146 104 146H50C44 146 38 142 38 136Z" fill="none" style={L(2.2)} />
      <path d="M110 46C136 48 138 100 114 104" fill="none" style={L(5)} />
      <path d="M110 46C134 48 136 100 114 104" fill="none" stroke={BLUE} strokeWidth="2.4" />
      <path d="M42 30L32 22H50" fill="none" style={L(2.2)} />
      <path d="M48 40L52 136" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity=".55" />
      <path d="M60 30c-4-10 4-16 10-12-2 6-6 10-10 12z" fill="#5c9a3a" style={L(1.1)} />
    </g>
  )
}

function AguaGas() {
  const id = useArtId()
  return (
    <g>
      <Defs />
      <path d="M50 14H62V36C62 44 74 48 74 62V142H38V62C38 48 50 44 50 36Z" fill={BLUE} style={L(2)} />
      <rect x="40" y="62" width="32" height="80" fill={url(id('ht'))} opacity=".35" />
      <rect x="38" y="86" width="36" height="26" style={{ ...PAPER, ...L(1.4) }} />
      <path d="M44 96h24M48 104h16" style={L(1.6)} />
      <path d="M44 66V136" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" opacity=".6" />
      <path d="M90 82H128L124 142H94Z" style={{ ...PAPER, ...L(2) }} />
      <path d="M92 94H126L124 142H94Z" fill="#cfe0f2" />
      {[[100, 130], [112, 118], [104, 108], [118, 136], [108, 98]].map(([x, y]) => <circle key={y} cx={x} cy={y} r="2" fill="none" style={L(1)} />)}
    </g>
  )
}

/** Bebidas con alcohol (+18): solo en la carta del bar, nunca en la zona familiar ni en regalos. */
function Vermut() {
  const id = useArtId()
  return (
    <g>
      <Defs />
      <path d="M48 52H112L106 132C106 140 98 144 80 144S54 140 54 132Z" style={{ ...PAPER, ...L(2.2) }} />
      <path d="M51 70H109L106 132C106 140 98 144 80 144S54 140 54 132Z" fill="#8a2a1c" />
      <rect x="52" y="70" width="56" height="74" fill={url(id('ht'))} opacity=".25" />
      {[[70, 84], [90, 92], [78, 108]].map(([x, y]) => <rect key={y} x={x - 7} y={y - 7} width="14" height="14" rx="3" fill="#f6efe4" opacity=".55" style={L(1)} />)}
      <circle cx="104" cy="58" r="16" fill={MUSTARD} style={L(2)} />
      <circle cx="104" cy="58" r="10" fill="#f6c45a" />
      <path d="M104 48V68M94 58H114M97 51L111 65M111 51L97 65" stroke={MUSTARD} strokeWidth="1.4" />
      <path d="M60 76V132" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" opacity=".45" />
      <path d="M86 40L98 120" style={L(2.4)} />
      <circle cx="86" cy="38" r="5" fill="#2f6a2a" style={L(1.4)} />
    </g>
  )
}

function Cerveza() {
  const id = useArtId()
  return (
    <g>
      <Defs />
      <path d="M50 40H110L104 142H56Z" style={{ ...PAPER, ...L(2.2) }} />
      <path d="M52 58H108L104 142H56Z" fill="#e7a52a" />
      <rect x="54" y="58" width="52" height="84" fill={url(id('ht'))} opacity=".22" />
      <path d="M46 46C46 30 62 28 68 34C72 24 90 24 94 34C100 26 116 30 114 46C112 56 50 58 46 46Z" fill="#fffaf0" style={L(2)} />
      {[[68, 120], [86, 100], [76, 86], [94, 128]].map(([x, y]) => <circle key={y} cx={x} cy={y} r="2.2" fill="none" stroke="#fff3c2" strokeWidth="1.2" />)}
      <path d="M62 64L64 136" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity=".45" />
    </g>
  )
}

function Saxo() {
  return (
    <g>
      <path d="M58 18L66 22L74 96C76 120 92 134 110 128C124 124 130 108 124 92L118 80" fill="none" style={L(16)} />
      <path d="M58 18L66 22L74 96C76 120 92 134 110 128C124 124 130 108 124 92L118 80" fill="none" stroke={MUSTARD} strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M104 76C110 62 132 60 140 72C134 78 120 84 110 86Z" fill={MUSTARD} style={L(2)} />
      {[44, 58, 72, 86].map((y) => <circle key={y} cx={72 + (y - 44) * 0.06} cy={y} r="4" style={{ ...PAPER, ...L(1.4) }} />)}
      <path d="M58 18L46 10" style={L(4)} />
      <path d="M70 40L74 100" stroke="#fff3c2" strokeWidth="2.4" strokeLinecap="round" />
    </g>
  )
}

function Trompeta() {
  return (
    <g>
      <path d="M20 84H96" style={L(10)} />
      <path d="M20 84H96" stroke={MUSTARD} strokeWidth="6" />
      <path d="M96 84L140 58V110Z" fill={MUSTARD} style={L(2.2)} />
      <ellipse cx="140" cy="84" rx="6" ry="26" style={{ ...PAPER, ...L(2) }} />
      <path d="M36 84C36 62 84 62 84 84" fill="none" style={L(8)} />
      <path d="M36 84C36 62 84 62 84 84" fill="none" stroke={MUSTARD} strokeWidth="4.4" />
      {[48, 60, 72].map((x) => <g key={x}><rect x={x - 3} y="56" width="6" height="20" style={{ ...PAPER, ...L(1.4) }} /><circle cx={x} cy="54" r="4.4" fill={BLUE} style={L(1.4)} /></g>)}
      <path d="M12 80v8" style={L(4)} />
    </g>
  )
}

function Contrabajo() {
  const id = useArtId()
  return (
    <g>
      <Defs />
      <path d="M80 6V40" style={L(6)} />
      <path d="M76 6h8" style={L(4)} />
      <path d="M80 40C62 40 58 54 64 66C52 72 44 88 48 106C52 128 66 146 80 146C94 146 108 128 112 106C116 88 108 72 96 66C102 54 98 40 80 40Z" fill={BLUE} style={L(2.2)} />
      <path d="M90 52C102 62 104 70 100 76C112 84 116 98 110 116C106 132 96 142 86 144C98 126 102 100 90 52Z" fill={url(id('ht'))} opacity=".6" />
      <path d="M70 90c4-2 4 10 0 10M90 90c-4-2-4 10 0 10" fill="none" style={L(2)} />
      <path d="M74 50V130M78 50V130M82 50V130M86 50V130" style={L(.8)} />
      <rect x="70" y="122" width="20" height="5" fill={MUSTARD} style={L(1)} />
    </g>
  )
}

function Piano() {
  return (
    <g>
      <rect x="12" y="48" width="136" height="70" rx="4" style={{ ...PAPER, ...L(2.2) }} />
      {Array.from({ length: 9 }, (_, i) => <path key={i} d={`M${12 + (i + 1) * 13.6} 48V118`} style={L(1.2)} />)}
      {[0, 1, 3, 4, 5, 7, 8].map((i) => <rect key={i} x={12 + (i + 1) * 13.6 - 4.5} y="48" width="9" height="40" style={{ ...LINE_FILL, ...L(1) }} />)}
      <rect x="12" y="34" width="136" height="14" fill={BLUE} style={L(2)} />
    </g>
  )
}

function Platillo() {
  const id = useArtId()
  return (
    <g>
      <Defs />
      <path d="M80 70V150M60 150L80 124L100 150" style={L(3)} />
      <ellipse cx="80" cy="66" rx="62" ry="16" fill={MUSTARD} style={L(2.2)} />
      <ellipse cx="80" cy="70" rx="56" ry="10" fill={url(id('htM'))} opacity=".7" />
      <ellipse cx="80" cy="62" rx="10" ry="3.4" fill={MUSTARD} style={L(1.6)} />
      <path d="M30 60c14-6 40-8 60-6" stroke="#fff3c2" strokeWidth="2.6" fill="none" strokeLinecap="round" />
      <path d="M118 30L138 52M126 24l16 20" style={L(2)} />
    </g>
  )
}

function Microfono() {
  const id = useArtId()
  return (
    <g>
      <Defs />
      <path d="M80 92V150M58 150H102" style={L(3)} />
      <rect x="64" y="20" width="32" height="56" rx="16" fill={url(id('ht'))} style={L(2.2)} />
      <rect x="64" y="20" width="32" height="56" rx="16" fill={BLUE} opacity=".5" />
      <path d="M64 48H96" style={L(1.6)} />
      <rect x="70" y="76" width="20" height="18" rx="3" fill={MUSTARD} style={L(2)} />
      <path d="M70 28c4-4 10-4 14-2" stroke="#fff" strokeWidth="2.2" fill="none" strokeLinecap="round" />
    </g>
  )
}

function Disco() {
  return (
    <g>
      <circle cx="80" cy="80" r="68" fill="#121212" style={L(1.4)} />
      {[60, 52, 44].map((r) => <circle key={r} cx="80" cy="80" r={r} fill="none" stroke="#3a3a3a" strokeWidth="1" />)}
      <circle cx="80" cy="80" r="26" fill={MUSTARD} />
      <circle cx="80" cy="80" r="4" style={PAPER} />
      <path d="M40 46C52 34 66 30 80 30" stroke="#fff" strokeWidth="2.4" fill="none" strokeLinecap="round" opacity=".5" />
    </g>
  )
}

export const COMPAS_FAMILY: FamilyPiece[] = [
  { key: 'TC-01', name: 'Patatas bravas', group: 'carta', Comp: Bravas },
  { key: 'TC-02', name: 'Croquetas de jamón', group: 'carta', Comp: Croquetas },
  { key: 'TC-03', name: 'Pincho de tortilla', group: 'carta', Comp: Pincho },
  { key: 'TC-04', name: 'Pan con tomate', group: 'carta', Comp: PanTomate },
  { key: 'TC-05', name: 'Rabas', group: 'carta', Comp: Rabas },
  { key: 'TC-06', name: 'Tabla de quesos y fiambres', group: 'carta', Comp: TablaQuesos },
  { key: 'TC-07', name: 'Aceitunas', group: 'carta', Comp: Aceitunas },
  { key: 'TC-08', name: 'Montaditos de jamón', group: 'carta', Comp: Montadito },
  { key: 'TC-09', name: 'Limonada con menta (sin alcohol)', group: 'carta', Comp: Limonada },
  { key: 'TC-10', name: 'Jarra de limonada para la mesa (sin alcohol)', group: 'carta', Comp: Jarra },
  { key: 'TC-11', name: 'Soda de pomelo (sin alcohol)', group: 'carta', Comp: Pomelo },
  { key: 'TC-13', name: 'Vermut de la casa (+18)', group: 'carta', Comp: Vermut },
  { key: 'TC-14', name: 'Cerveza tirada (+18)', group: 'carta', Comp: Cerveza },
  { key: 'TC-12', name: 'Agua con gas (sin alcohol)', group: 'carta', Comp: AguaGas },
  { key: 'jg-bar-saxo', name: 'Saxo (¿dónde está?)', group: 'juego', Comp: Saxo },
  { key: 'jg-bar-trompeta', name: 'Trompeta (¿dónde está?)', group: 'juego', Comp: Trompeta },
  { key: 'jg-bar-contrabajo', name: 'Contrabajo (¿dónde está?)', group: 'juego', Comp: Contrabajo },
  { key: 'jg-bar-piano', name: 'Teclado (¿dónde está?)', group: 'juego', Comp: Piano },
  { key: 'jg-bar-platillo', name: 'Platillo (¿dónde está?)', group: 'juego', Comp: Platillo },
  { key: 'jg-bar-microfono', name: 'Micrófono (¿dónde está?)', group: 'juego', Comp: Microfono },
  { key: 'jg-bar-disco', name: 'Disco (¿dónde está?)', group: 'juego', Comp: Disco },
]
