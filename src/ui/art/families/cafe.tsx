import { useArtId, url } from '../kit'
import type { FamilyPiece } from './kit'

// Ritual Café · confitería notable. Vajilla de porcelana blanca con filete dorado, vista a tres cuartos,
// sobre su plato. Sin contorno: el volumen lo dan la porcelana, el oro y la luz desde arriba a la izquierda.

function Defs() {
  const id = useArtId()
  return (
    <defs>
      <linearGradient id={id('porc')} x1="0" x2="1"><stop offset="0" stopColor="#ffffff" /><stop offset=".42" stopColor="#f8f3eb" /><stop offset=".78" stopColor="#e2d9cc" /><stop offset="1" stopColor="#c4b8a7" /></linearGradient>
      <linearGradient id={id('porcTop')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffffff" /><stop offset="1" stopColor="#e9e1d4" /></linearGradient>
      <linearGradient id={id('gold')} x1="0" x2="1"><stop offset="0" stopColor="#8a6424" /><stop offset=".3" stopColor="#f3dc96" /><stop offset=".55" stopColor="#c9a24e" /><stop offset=".8" stopColor="#f6e4a8" /><stop offset="1" stopColor="#8a6424" /></linearGradient>
      <radialGradient id={id('coffee')} cx=".45" cy=".4" r=".7"><stop offset="0" stopColor="#6e3a1c" /><stop offset="1" stopColor="#2e150a" /></radialGradient>
      <radialGradient id={id('crema')} cx=".42" cy=".38" r=".75"><stop offset="0" stopColor="#e2ad70" /><stop offset=".6" stopColor="#b8763a" /><stop offset="1" stopColor="#7d4519" /></radialGradient>
      <radialGradient id={id('milk')} cx=".4" cy=".35" r=".8"><stop offset="0" stopColor="#fffaf1" /><stop offset="1" stopColor="#ead9bd" /></radialGradient>
      <radialGradient id={id('shadow')} cx=".5" cy=".5" r=".5"><stop offset="0" stopColor="#1a0f0c" stopOpacity=".34" /><stop offset="1" stopColor="#1a0f0c" stopOpacity="0" /></radialGradient>
      <radialGradient id={id('doughG')} cx=".38" cy=".3" r=".85"><stop offset="0" stopColor="#f3d79c" /><stop offset=".6" stopColor="#dcae64" /><stop offset="1" stopColor="#b07a32" /></radialGradient>
      <radialGradient id={id('dough')} cx=".38" cy=".3" r=".85"><stop offset="0" stopColor="#f7cf7f" /><stop offset=".5" stopColor="#d99440" /><stop offset="1" stopColor="#9a5216" /></radialGradient>
      <linearGradient id={id('glaze')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff3cf" stopOpacity=".9" /><stop offset="1" stopColor="#fff3cf" stopOpacity="0" /></linearGradient>
    </defs>
  )
}

/** Plato de porcelana con filete dorado (platito de pocillo o plato de postre). */
function Saucer({ cx = 80, cy = 120, rx = 54, ry = 13 }: { cx?: number; cy?: number; rx?: number; ry?: number }) {
  const id = useArtId()
  return (
    <g>
      <ellipse cx={cx + 3} cy={cy + 7} rx={rx * 1.04} ry={ry * 1.25} fill={url(id('shadow'))} />
      <ellipse cx={cx} cy={cy + 2.6} rx={rx} ry={ry} fill="#b9ad9c" />
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={url(id('porcTop'))} />
      <ellipse cx={cx} cy={cy - 0.6} rx={rx * 0.56} ry={ry * 0.5} fill="#eee6da" />
      <ellipse cx={cx} cy={cy - 0.4} rx={rx * 0.56} ry={ry * 0.5} fill="none" stroke="#d8cdbd" strokeWidth=".8" />
      <ellipse cx={cx} cy={cy} rx={rx - 3} ry={ry - 1} fill="none" stroke={url(id('gold'))} strokeWidth="1.6" />
    </g>
  )
}

/** Taza de porcelana: cuerpo, asa, filete dorado y la bebida en la boca. */
function Cup({ cx = 80, top = 78, rx = 24, h = 32, drink, handle = true }: { cx?: number; top?: number; rx?: number; h?: number; drink: 'espresso' | 'cortado' | 'flat' | 'capu' | 'latte' | 'filtro' | 'conleche'; handle?: boolean }) {
  const id = useArtId()
  const ry = rx * 0.27
  const body = `M${cx - rx} ${top}C${cx - rx} ${top + h * 0.72} ${cx - rx * 0.56} ${top + h} ${cx} ${top + h}C${cx + rx * 0.56} ${top + h} ${cx + rx} ${top + h * 0.72} ${cx + rx} ${top}Z`
  const surf = drink === 'espresso' ? url(id('crema')) : drink === 'filtro' ? url(id('coffee')) : drink === 'conleche' ? '#c9935e' : url(id('milk'))
  return (
    <g>
      {handle && (
        <>
          <path d={`M${cx + rx - 2} ${top + h * 0.2}C${cx + rx + 17} ${top + h * 0.08} ${cx + rx + 17} ${top + h * 0.78} ${cx + rx - 5} ${top + h * 0.74}`} fill="none" stroke="#c9bdac" strokeWidth="6.4" strokeLinecap="round" />
          <path d={`M${cx + rx - 2} ${top + h * 0.2}C${cx + rx + 16} ${top + h * 0.08} ${cx + rx + 16} ${top + h * 0.78} ${cx + rx - 5} ${top + h * 0.74}`} fill="none" stroke="#f7f2ea" strokeWidth="4" strokeLinecap="round" />
          <path d={`M${cx + rx + 6} ${top + h * 0.22}C${cx + rx + 11} ${top + h * 0.3} ${cx + rx + 11} ${top + h * 0.5} ${cx + rx + 7} ${top + h * 0.6}`} fill="none" stroke={url(id('gold'))} strokeWidth="1.2" strokeLinecap="round" />
        </>
      )}
      <ellipse cx={cx} cy={top + h} rx={rx * 0.46} ry={ry * 0.5} fill="#cfc4b4" />
      <path d={body} fill={url(id('porc'))} />
      <path d={`M${cx - rx + 0.8} ${top + 4.5}A${rx - 0.8} ${ry} 0 0 0 ${cx + rx - 0.8} ${top + 4.5}`} fill="none" stroke={url(id('gold'))} strokeWidth="1.8" />
      <path d={`M${cx - rx + 5} ${top + 8}C${cx - rx + 6} ${top + h * 0.62} ${cx - rx * 0.4} ${top + h * 0.9} ${cx - rx * 0.1} ${top + h - 2}`} fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" opacity=".9" />
      <ellipse cx={cx} cy={top} rx={rx} ry={ry} fill="#fbf8f2" />
      <ellipse cx={cx} cy={top} rx={rx} ry={ry} fill="none" stroke="#d6cbbb" strokeWidth=".8" />
      <ellipse cx={cx} cy={top + 0.8} rx={rx - 2.6} ry={ry - 1.5} fill={surf} />
      {drink === 'espresso' && <path d={`M${cx - 8} ${top + 0.6}c4-2.4 11-2.4 15 0`} fill="none" stroke="#f0c38a" strokeWidth="1.2" strokeLinecap="round" opacity=".8" />}
      {drink === 'conleche' && <ellipse cx={cx - rx * 0.2} cy={top} rx={rx * 0.4} ry={ry * 0.32} fill="#e8c69a" opacity=".7" />}
      {drink === 'filtro' && <ellipse cx={cx - rx * 0.3} cy={top} rx={rx * 0.3} ry={ry * 0.25} fill="#8c4f27" opacity=".7" />}
      {drink === 'cortado' && (
        <>
          <ellipse cx={cx} cy={top + 0.9} rx={rx - 2.6} ry={ry - 1.5} fill={url(id('crema'))} />
          <path d={`M${cx - 5} ${top - 0.2}c2-2.6 5-2.6 5 0 0-2.6 3-2.6 5 0-1.5 2.6-3.6 3.6-5 4.6-1.4-1-3.5-2-5-4.6z`} fill="#f7ead2" />
        </>
      )}
      {(drink === 'flat' || drink === 'latte') && (
        <>
          <ellipse cx={cx} cy={top + 0.9} rx={rx - 2.6} ry={ry - 1.5} fill={url(id('crema'))} />
          <path d={`M${cx - rx * 0.5} ${top + 0.6}C${cx - rx * 0.3} ${top - ry * 0.6} ${cx + rx * 0.3} ${top - ry * 0.6} ${cx + rx * 0.5} ${top + 0.6}C${cx + rx * 0.3} ${top + ry * 0.55} ${cx - rx * 0.3} ${top + ry * 0.55} ${cx - rx * 0.5} ${top + 0.6}Z`} fill="#f7ead2" />
          <path d={`M${cx - rx * 0.32} ${top + 0.6}C${cx - rx * 0.1} ${top - ry * 0.25} ${cx + rx * 0.1} ${top - ry * 0.25} ${cx + rx * 0.32} ${top + 0.6}`} fill="none" stroke="#b8763a" strokeWidth="1" />
          <path d={`M${cx - rx * 0.15} ${top + 0.6}C${cx - rx * 0.05} ${top + 0.1} ${cx + rx * 0.05} ${top + 0.1} ${cx + rx * 0.15} ${top + 0.6}`} fill="none" stroke="#b8763a" strokeWidth=".9" />
        </>
      )}
      {drink === 'capu' && (
        <>
          <ellipse cx={cx} cy={top - 0.6} rx={rx - 2.2} ry={ry - 0.6} fill={url(id('milk'))} />
          <ellipse cx={cx - 3} cy={top - 1.6} rx={rx * 0.42} ry={ry * 0.42} fill="#9a5a26" opacity=".55" />
          <ellipse cx={cx + 6} cy={top - 0.8} rx={rx * 0.22} ry={ry * 0.25} fill="#9a5a26" opacity=".35" />
        </>
      )}
    </g>
  )
}

/** Vapor: dos hilos finos que suben de la taza. */
function Steam({ x = 80, y = 66, s = 1 }: { x?: number; y?: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} fill="none" stroke="#b9ad9c" strokeWidth="1.6" strokeLinecap="round" opacity=".55">
      <path d="M-5 0c-5-6 5-10 0-17s4-11 1-16" />
      <path d="M6 -2c-4-6 4-9 0-15s3-9 1-13" />
    </g>
  )
}

/** Medialuna a tres cuartos: cinco gajos que se angostan hacia las puntas curvadas, almíbar brillante. */
export function Medialuna({ x = 0, y = 0, s = 1, r = 0, grasa = false }: { x?: number; y?: number; s?: number; r?: number; grasa?: boolean }) {
  const id = useArtId()
  // gajos de la punta izquierda a la derecha: centro, ancho y alto de cada uno sobre un arco
  const lobes: [number, number, number, number][] = grasa ? [[14, 40, 9, 7], [34, 32, 14, 11], [60, 28, 18, 14], [86, 32, 14, 11], [106, 40, 9, 7]] : [[16, 44, 9, 8], [34, 30, 14, 14], [60, 22, 18, 19], [86, 30, 14, 14], [104, 44, 9, 8]]
  const dough = url(id(grasa ? 'doughG' : 'dough'))
  return (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
      <path d={grasa ? 'M4 46C4 38 16 30 28 26C42 20 52 16 60 16C68 16 78 20 92 26C104 30 116 38 116 46C112 52 102 52 98 46C92 40 80 38 60 38C40 38 28 40 22 46C18 52 8 52 4 46Z' : 'M6 50C4 38 14 28 26 22C40 12 52 4 60 4C68 4 80 12 94 22C106 28 116 38 114 50C110 56 102 56 98 50C92 40 80 34 60 34C40 34 28 40 22 50C18 56 10 56 6 50Z'} fill={dough} />
      {lobes.map(([cx, cy, rx, ry], i) => (
        <g key={i}>
          <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={dough} transform={`rotate(${(i - 2) * (grasa ? 12 : 24)} ${cx} ${cy})`} />
          <ellipse cx={cx - rx * 0.25} cy={cy - ry * 0.35} rx={rx * 0.5} ry={ry * 0.32} fill="#fbe2a8" opacity={grasa ? 0.35 : 0.7} transform={`rotate(${(i - 2) * 24} ${cx} ${cy})`} />
        </g>
      ))}
      {[[25, 38, 28, 26], [47, 27, 50, 22], [73, 22, 70, 27], [95, 26, 92, 38]].map(([x1, y1, x2, y2], i) => <path key={i} d={`M${x1} ${y1 + 8}Q${(x1 + x2) / 2} ${Math.min(y1, y2) - 2} ${x2} ${y2 + 8}`} fill="none" stroke="#8a4a14" strokeWidth="1.6" strokeLinecap="round" opacity=".55" />)}
      {!grasa && <path d="M30 22C42 12 52 9 60 9C68 9 78 12 90 22" fill="none" stroke={url(id('glaze'))} strokeWidth="5" strokeLinecap="round" opacity=".75" />}
      <path d="M52 13C56 11 64 11 68 13" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" opacity={grasa ? 0.3 : 0.85} />
      <ellipse cx="9" cy="51" rx="4.5" ry="3.6" fill="#8f4a12" />
      <ellipse cx="111" cy="51" rx="4.5" ry="3.6" fill="#8f4a12" />
    </g>
  )
}

/** Cucharita de alpaca apoyada en el plato. */
function Spoon({ x, y, r = -14, s = 1 }: { x: number; y: number; r?: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
      <path d="M0 0h26" stroke="#9c968d" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M0 -.6h24" stroke="#f4f2ee" strokeWidth="1" strokeLinecap="round" />
      <ellipse cx="31" cy="0" rx="7" ry="3.6" fill="#b9b3aa" />
      <ellipse cx="30" cy="-.8" rx="4.4" ry="1.6" fill="#f4f2ee" />
    </g>
  )
}

/** Vaso de vidrio fino con filete dorado; `layers` de abajo hacia arriba (fracción de alto, color). */
function Vaso({ cx = 80, top = 40, w = 46, h = 84, k, layers = [], ice = 0, straw }: { cx?: number; top?: number; w?: number; h?: number; k: string; layers?: [number, string][]; ice?: number; straw?: string }) {
  const id = useArtId()
  const bw = w * 0.84
  const ry = w * 0.12
  const body = `M${cx - w / 2} ${top}L${cx - bw / 2} ${top + h}Q${cx} ${top + h + ry * 1.4} ${cx + bw / 2} ${top + h}L${cx + w / 2} ${top}Z`
  let acc = 0
  return (
    <g>
      <clipPath id={id(`v-${k}`)}><path d={body} /></clipPath>
      <path d={body} fill="#e9f1f2" opacity=".35" />
      <g clipPath={url(id(`v-${k}`))}>
        {layers.map(([f, c], i) => {
          const y0 = top + h - (acc + f) * h
          acc += f
          return <rect key={i} x={cx - w} y={y0} width={w * 2} height={f * h + 8} fill={c} />
        })}
        {Array.from({ length: ice }, (_, i) => (
          <g key={i} transform={`translate(${cx - w * 0.28 + (i % 2) * w * 0.3} ${top + 8 + Math.floor(i / 2) * 15}) rotate(${i * 23 - 20})`}>
            <rect x="-7" y="-7" width="14" height="14" rx="3" fill="#f2fbff" opacity=".55" />
            <path d="M-4-4h6" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" />
          </g>
        ))}
        <rect x={cx - w / 2 + 3} y={top} width="4" height={h} fill="#fff" opacity=".55" />
        <rect x={cx + w / 2 - 9} y={top} width="2.4" height={h} fill="#fff" opacity=".3" />
      </g>
      {straw && <path d={`M${cx + w * 0.12} ${top + h * 0.6}L${cx + w * 0.34} ${top - 18}`} stroke={straw} strokeWidth="4.4" strokeLinecap="round" />}
      {straw && <path d={`M${cx + w * 0.12} ${top + h * 0.6}L${cx + w * 0.34} ${top - 18}`} stroke="#fff" strokeWidth="4.4" strokeLinecap="round" strokeDasharray="3 4" opacity=".9" />}
      <path d={body} fill="none" stroke="#b8c3c4" strokeWidth="1.1" />
      <ellipse cx={cx} cy={top} rx={w / 2} ry={ry} fill="#f7fbfb" opacity=".5" stroke="#b8c3c4" strokeWidth="1" />
      <ellipse cx={cx} cy={top + 1.5} rx={w / 2 - 0.5} ry={ry} fill="none" stroke={url(id('gold'))} strokeWidth="1.6" />
    </g>
  )
}

function Espresso() {
  return (
    <g>
      <Defs />
      <Saucer cy={124} rx={60} ry={15} />
      <Spoon x={36} y={127} r={-8} s={0.9} />
      <Cup cx={78} top={88} rx={27} h={32} drink="espresso" />
      <Steam x={76} y={72} />
    </g>
  )
}

function DobleEspresso() {
  return (
    <g>
      <Defs />
      <Saucer cx={66} cy={126} rx={54} ry={14} />
      <Cup cx={62} top={76} rx={28} h={44} drink="espresso" />
      <Steam x={60} y={60} />
      <Vaso k="soda" cx={128} top={72} w={26} h={52} layers={[[0.82, '#e7f3f6']]} />
      {[[124, 112], [131, 100], [126, 90], [133, 84]].map(([x, y]) => <circle key={y} cx={x} cy={y} r="1.3" fill="#fff" />)}
    </g>
  )
}

function FlatWhite() {
  return (
    <g>
      <Defs />
      <Saucer cy={126} rx={66} ry={16} />
      <Cup cx={76} top={78} rx={34} h={40} drink="flat" />
    </g>
  )
}

function Cappuccino() {
  return (
    <g>
      <Defs />
      <Saucer cy={128} rx={68} ry={17} />
      <Spoon x={30} y={132} r={-6} />
      <Cup cx={76} top={76} rx={37} h={44} drink="capu" />
    </g>
  )
}

function Latte() {
  return (
    <g>
      <Defs />
      <Saucer cy={132} rx={54} ry={14} />
      <Vaso k="latte" cx={78} top={30} w={48} h={92} layers={[[0.34, '#7a4524'], [0.12, '#b98656'], [0.36, '#f1e3cb'], [0.12, '#fffaf0']]} />
      <path d="M96 120L120 18" stroke="#9c968d" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M96 120L120 18" stroke="#f4f2ee" strokeWidth=".9" strokeLinecap="round" />
    </g>
  )
}

function V60() {
  const id = useArtId()
  return (
    <g>
      <Defs />
      <Saucer cy={136} rx={56} ry={13} />
      <Cup cx={80} top={102} rx={30} h={30} drink="filtro" handle={false} />
      {/* dripper de porcelana con nervaduras y su base */}
      <ellipse cx="80" cy="96" rx="30" ry="7" fill="#d8cdbd" />
      <path d="M44 34L68 92H92L116 34Z" fill={url(id('porc'))} />
      <clipPath id={id('v60')}><path d="M44 34L68 92H92L116 34Z" /></clipPath>
      <g clipPath={url(id('v60'))} stroke="#d2c7b6" strokeWidth="1.2">{[-20, -10, 0, 10, 20].map((d) => <path key={d} d={`M${80 + d * 1.6} 34L${80 + d * 0.5} 92`} />)}</g>
      <path d="M50 44L70 90" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity=".85" />
      <ellipse cx="80" cy="34" rx="36" ry="8" fill="#fbf8f2" stroke="#d6cbbb" strokeWidth=".8" />
      <ellipse cx="80" cy="35" rx="31" ry="6" fill={url(id('crema'))} />
      <path d="M49 35A31 6 0 0 0 111 35" fill="none" stroke={url(id('gold'))} strokeWidth="1.6" />
      <path d="M116 40c14-2 16 14 2 18" fill="none" stroke="#f1ebe1" strokeWidth="5" strokeLinecap="round" />
      <path d="M80 92v8" stroke="#5a2d14" strokeWidth="2.2" strokeLinecap="round" />
    </g>
  )
}

function Chemex() {
  const id = useArtId()
  return (
    <g>
      <Defs />
      <ellipse cx="82" cy="146" rx="46" ry="6" fill={url(id('shadow'))} />
      <clipPath id={id('chx')}><path d="M46 22L74 76C46 90 40 112 44 128C48 142 116 142 120 128C124 112 118 90 90 76L118 22Z" /></clipPath>
      <path d="M46 22L74 76C46 90 40 112 44 128C48 142 116 142 120 128C124 112 118 90 90 76L118 22Z" fill="#eef4f4" opacity=".4" />
      <g clipPath={url(id('chx'))}>
        <rect x="30" y="104" width="110" height="40" fill={url(id('coffee'))} />
        <rect x="30" y="102" width="110" height="3" fill="#8c4f27" opacity=".7" />
        <path d="M46 22L74 76" stroke="#fff" strokeWidth="5" opacity=".55" />
        <path d="M50 96C46 110 48 124 54 132" stroke="#fff" strokeWidth="4" fill="none" opacity=".5" strokeLinecap="round" />
      </g>
      <path d="M46 22L74 76C46 90 40 112 44 128C48 142 116 142 120 128C124 112 118 90 90 76L118 22Z" fill="none" stroke="#b8c3c4" strokeWidth="1.2" />
      {/* filtro de papel plegado */}
      <path d="M50 22L76 70L84 22Z" fill="#fbfaf6" opacity=".95" /><path d="M84 22L88 70L114 22Z" fill="#f1eee6" opacity=".95" />
      {/* collar de madera atado con cuero */}
      <path d="M68 66C72 62 92 62 96 66L100 84C94 90 70 90 64 84Z" fill="#8a5a33" />
      <path d="M68 70C76 68 88 68 96 70" stroke="#c48b57" strokeWidth="2" fill="none" />
      <path d="M64 76C74 80 90 80 100 76" stroke="#3b2214" strokeWidth="1.6" fill="none" />
      <path d="M100 77l8 12" stroke="#3b2214" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="109" cy="91" r="3" fill="#c9a24e" />
    </g>
  )
}

function ColdBrew() {
  const id = useArtId()
  return (
    <g>
      <Defs />
      <ellipse cx="80" cy="146" rx="42" ry="7" fill={url(id('shadow'))} />
      <ellipse cx="80" cy="141" rx="38" ry="8" fill="#e6dfd3" stroke="#c9bfb1" strokeWidth=".8" />
      <Vaso k="cold" cx={80} top={30} w={54} h={104} layers={[[0.82, '#3a1b0c'], [0.06, '#6b3a1e']]} ice={5} straw="#7a1e25" />
      {[[62, 118], [96, 96], [66, 74], [100, 120]].map(([x, y]) => <circle key={x + y} cx={x} cy={y} r="1.4" fill="#fff" opacity=".6" />)}
    </g>
  )
}

function Roll() {
  const id = useArtId()
  const turns = Array.from({ length: 60 }, (_, i) => {
    const t = i / 60
    const a = t * Math.PI * 5.4
    const r = 4 + t * 36
    return `${(80 + Math.cos(a) * r).toFixed(1)} ${(96 + Math.sin(a) * r * 0.62).toFixed(1)}`
  })
  return (
    <g>
      <Defs />
      <Saucer cy={120} rx={66} ry={17} />
      <ellipse cx="80" cy="104" rx="44" ry="21" fill="#9a5216" />
      <ellipse cx="80" cy="96" rx="44" ry="27" fill={url(id('dough'))} />
      <path d={`M${turns.join('L')}`} fill="none" stroke="#7a3b10" strokeWidth="3.2" strokeLinecap="round" />
      <path d={`M${turns.join('L')}`} fill="none" stroke="#f3c67e" strokeWidth="1" strokeLinecap="round" opacity=".7" transform="translate(-1.4 -1.6)" />
      <path d="M50 88C60 80 70 98 82 86S100 92 110 84M52 104C64 98 76 110 88 102S104 104 108 98" fill="none" stroke="#fffaf0" strokeWidth="3.6" strokeLinecap="round" opacity=".92" />
    </g>
  )
}

function Muffin() {
  const id = useArtId()
  return (
    <g>
      <Defs />
      <Saucer cy={130} rx={56} ry={14} />
      <path d="M46 86L56 128H104L114 86Z" fill="#f4ede1" />
      {Array.from({ length: 9 }, (_, i) => <path key={i} d={`M${48 + i * 7.6} 86L${57 + i * 5.4} 128`} stroke="#d9cdb9" strokeWidth="1.4" />)}
      <path d="M46 86L56 128H104L114 86Z" fill="none" stroke="#cbbda7" strokeWidth="1" />
      <path d="M38 88C34 62 56 40 80 40C104 40 126 62 122 88C118 94 42 94 38 88Z" fill={url(id('dough'))} />
      <path d="M48 70C56 54 70 48 82 48" fill="none" stroke="#fbe2a8" strokeWidth="4" strokeLinecap="round" opacity=".7" />
      {[[58, 66], [84, 58], [100, 72], [70, 80], [92, 84], [48, 82], [110, 84], [74, 52]].map(([x, y]) => (
        <g key={`${x}-${y}`}><circle cx={x} cy={y} r="5" fill="#3d3a7a" /><circle cx={x - 1.4} cy={y - 1.6} r="1.5" fill="#a9a6e0" /><path d={`M${x - 1.5} ${y + 3}h3`} stroke="#22204a" strokeWidth="1" /></g>
      ))}
      {[[64, 58], [94, 64], [80, 72], [60, 86], [104, 80]].map(([x, y]) => <rect key={`${x}${y}`} x={x} y={y} width="3" height="2.2" rx=".8" fill="#fff4dc" transform={`rotate(${x} ${x} ${y})`} />)}
    </g>
  )
}

/** Media porción de tostado: cara de arriba triangular y el corte de frente con sus capas. */
function MedioTostado({ x, y, s = 1, r = 0 }: { x: number; y: number; s?: number; r?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
      <path d="M0 30L46 0L92 28Z" fill="#c98a42" />
      <path d="M6 28L46 4L86 26Z" fill="#e8b66e" />
      {[[30, 18], [50, 12], [66, 20]].map(([px, py]) => <path key={px} d={`M${px - 9} ${py + 6}l18-12`} stroke="#8a5220" strokeWidth="2.2" opacity=".5" strokeLinecap="round" />)}
      <path d="M0 30L92 28V50L0 52Z" fill="#c98a42" />
      <path d="M1 34L91 32V36L1 38Z" fill="#f1e2bf" />
      <path d="M1 38L91 36V40L1 42Z" fill="#ec9c93" />
      <path d="M1 42L91 40V44L1 46Z" fill="#f6cf55" />
      <path d="M14 46c4 5 2 9-2 8M70 45c3 6 1 9-3 8" fill="#f6cf55" />
      <path d="M1 46L91 44V50L1 52Z" fill="#f1e2bf" />
      <path d="M0 52L92 50" stroke="#a96b2c" strokeWidth="1.4" />
    </g>
  )
}

function Tostado() {
  return (
    <g>
      <Defs />
      <Saucer cy={120} rx={70} ry={18} />
      <MedioTostado x={44} y={58} s={0.92} r={4} />
      <MedioTostado x={22} y={74} />
    </g>
  )
}

function Budin() {
  const id = useArtId()
  return (
    <g>
      <Defs />
      <Saucer cy={124} rx={66} ry={17} />
      <path d="M40 74L96 62L124 76L68 90Z" fill="#c78734" />
      <path d="M40 74L68 90V122L40 108Z" fill="#f2d48a" />
      <path d="M68 90L124 76V108L68 122Z" fill="#efce7f" />
      {Array.from({ length: 18 }, (_, i) => <circle key={i} cx={74 + ((i * 17) % 46)} cy={92 + ((i * 11) % 26)} r=".9" fill="#c99a44" />)}
      <path d="M40 74L96 62L124 76L68 90Z" fill="#fffaf0" opacity=".9" />
      <path d="M68 90L124 76V82C120 86 118 78 114 84S106 82 102 88S92 86 88 92S78 90 74 96 68 94 68 94Z" fill="#fffaf0" opacity=".9" />
      <path d="M40 74L68 90V98C64 96 62 90 58 94S50 88 46 92 40 84 40 84Z" fill="#fffaf0" opacity=".9" />
      {[[60, 72], [82, 70], [100, 74], [72, 78]].map(([x, y]) => <rect key={x} x={x} y={y} width="4" height="1.4" rx=".7" fill="#e9c93a" transform={`rotate(-20 ${x} ${y})`} />)}
      <g transform="translate(126 112)"><circle r="12" fill="#f6e15b" /><circle r="10" fill="#fdf3a8" />{[0, 60, 120, 180, 240, 300].map((a) => <path key={a} d="M0 0L0-9" stroke="#e9cf3a" strokeWidth="1.2" transform={`rotate(${a})`} />)}</g>
      <ellipse cx="54" cy="104" rx="6" ry="3" fill={url(id('glaze'))} opacity=".5" />
    </g>
  )
}

function CafeConLeche() {
  return (
    <g>
      <Defs />
      <Saucer cy={128} rx={70} ry={18} />
      <Cup cx={74} top={72} rx={40} h={48} drink="conleche" />
      <Steam x={72} y={56} s={1.1} />
    </g>
  )
}

function Lagrima() {
  return (
    <g>
      <Defs />
      <Saucer cy={132} rx={50} ry={13} />
      <Vaso k="lag" cx={80} top={42} w={44} h={80} layers={[[0.08, '#b98656'], [0.62, '#f6ead6'], [0.14, '#fffaf0']]} />
      <path d="M80 54c-3 4-3 7 0 8 3-1 3-4 0-8z" fill="#8c4f27" />
    </g>
  )
}

function Submarino() {
  return (
    <g>
      <Defs />
      <Saucer cy={132} rx={52} ry={13} />
      <g transform="rotate(10 88 70)">
        <rect x="80" y="26" width="16" height="78" rx="2" fill="#4a2414" />
        {[34, 46, 58, 70, 82, 94].map((y) => <path key={y} d={`M82 ${y}h12`} stroke="#2e150a" strokeWidth="1.2" />)}
        <rect x="82" y="28" width="3" height="74" fill="#7a3f22" />
      </g>
      <Vaso k="sub" cx={76} top={40} w={50} h={84} layers={[[0.8, 'rgba(246, 234, 214, .82)']]} />
      <path d="M58 58c6 3 14 3 20 0" stroke="#e8d3b2" strokeWidth="2" fill="none" />
    </g>
  )
}

function MedialunaGrasa() {
  return (
    <g>
      <Defs />
      <Saucer cy={116} rx={68} ry={18} />
      <Medialuna x={14} y={66} s={1.1} grasa />
    </g>
  )
}

function Frutilla({ x = 80, y = 84, s = 1 }: { x?: number; y?: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-30-14C-30-40 30-40 30-14C30 14 10 44 0 48C-10 44-30 14-30-14Z" fill="#d7263d" />
      <path d="M-22-18C-20-32 0-36 10-32" stroke="#ff8a96" strokeWidth="5" fill="none" strokeLinecap="round" opacity=".7" />
      {[[-14, -10], [0, -16], [14, -8], [-8, 6], [8, 8], [-16, 12], [16, 14], [0, 24], [-4, 38]].map(([a, b]) => <ellipse key={`${a}${b}`} cx={a} cy={b} rx="1.6" ry="2.4" fill="#ffe08a" />)}
      <path d="M0-36C-10-48-24-44-28-38C-16-38-8-36 0-34C8-36 16-38 28-38C24-44 10-48 0-36Z" fill="#3f8a3a" />
      <path d="M0-34V-50" stroke="#2f6b2a" strokeWidth="3" strokeLinecap="round" />
    </g>
  )
}

function Naranja() {
  return (
    <g>
      <circle cx="80" cy="84" r="46" fill="#f08a1c" />
      <circle cx="80" cy="84" r="40" fill="#fff1d6" />
      <circle cx="80" cy="84" r="36" fill="#f9a83a" />
      {Array.from({ length: 10 }, (_, i) => <path key={i} d="M80 84L80 49" stroke="#fff1d6" strokeWidth="2.4" transform={`rotate(${i * 36} 80 84)`} />)}
      <circle cx="80" cy="84" r="5" fill="#fff1d6" />
      <path d="M52 62C60 52 72 48 84 48" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" opacity=".6" />
    </g>
  )
}

/** Dorso de las cartas del juego: bordó con marco dorado y volutas de filete en las esquinas. */
function Dorso() {
  const id = useArtId()
  const corner = 'M18 40C18 26 26 18 40 18M24 46C24 32 32 24 46 24M30 30c6-6 14-2 10 4'
  return (
    <g>
      <Defs />
      <rect x="10" y="6" width="140" height="148" rx="10" fill="#7a1e25" />
      <rect x="16" y="12" width="128" height="136" rx="7" fill="none" stroke={url(id('gold'))} strokeWidth="2.4" />
      {[0, 90, 180, 270].map((a) => <path key={a} d={corner} fill="none" stroke={url(id('gold'))} strokeWidth="2" strokeLinecap="round" transform={`rotate(${a} 80 80)`} />)}
      <circle cx="80" cy="80" r="22" fill="none" stroke={url(id('gold'))} strokeWidth="2" />
      <path d="M80 62C70 72 70 88 80 98C90 88 90 72 80 62Z" fill="#c9a24e" />
      <circle cx="80" cy="80" r="4" fill="#7a1e25" />
    </g>
  )
}

function JgTaza() {
  return <g><Defs /><Cup cx={74} top={66} rx={40} h={50} drink="capu" /></g>
}
function JgMedialuna() {
  return <g><Defs /><Medialuna x={14} y={52} s={1.1} r={-6} /></g>
}
function JgFrutilla() {
  return <g><Frutilla s={1.2} /></g>
}

function Cortado() {
  return (
    <g>
      <Defs />
      <Saucer cy={124} rx={64} ry={16} />
      <Cup cx={76} top={78} rx={31} h={40} drink="cortado" />
      <Steam x={74} y={62} s={1.1} />
    </g>
  )
}

function MedialunaManteca() {
  return (
    <g>
      <Defs />
      <Saucer cy={116} rx={68} ry={18} />
      <Medialuna x={14} y={64} s={1.1} r={-4} />
    </g>
  )
}

export const CAFE_FAMILY: FamilyPiece[] = [
  { key: 'RC-01', name: 'Espresso', group: 'carta', Comp: Espresso },
  { key: 'RC-02', name: 'Doble espresso', group: 'carta', Comp: DobleEspresso },
  { key: 'RC-03', name: 'Cortado', group: 'carta', Comp: Cortado },
  { key: 'RC-04', name: 'Flat white', group: 'carta', Comp: FlatWhite },
  { key: 'RC-05', name: 'Cappuccino', group: 'carta', Comp: Cappuccino },
  { key: 'RC-06', name: 'Latte', group: 'carta', Comp: Latte },
  { key: 'RC-07', name: 'V60 filtrado', group: 'carta', Comp: V60 },
  { key: 'RC-08', name: 'Chemex (2 tazas)', group: 'carta', Comp: Chemex },
  { key: 'RC-09', name: 'Cold brew', group: 'carta', Comp: ColdBrew },
  { key: 'RC-10', name: 'Roll de canela', group: 'carta', Comp: Roll },
  { key: 'RC-11', name: 'Medialuna de manteca', group: 'carta', Comp: MedialunaManteca },
  { key: 'RC-12', name: 'Muffin de arándanos', group: 'carta', Comp: Muffin },
  { key: 'RC-13', name: 'Tostado de jamón y queso', group: 'carta', Comp: Tostado },
  { key: 'RC-14', name: 'Budín de limón', group: 'carta', Comp: Budin },
  { key: 'RC-15', name: 'Café con leche', group: 'carta', Comp: CafeConLeche },
  { key: 'RC-16', name: 'Lágrima', group: 'carta', Comp: Lagrima },
  { key: 'RC-17', name: 'Submarino', group: 'carta', Comp: Submarino },
  { key: 'RC-18', name: 'Medialuna de grasa', group: 'carta', Comp: MedialunaGrasa },
  { key: 'jg-cafe-taza', name: 'Taza (juego de memoria)', group: 'juego', Comp: JgTaza },
  { key: 'jg-cafe-medialuna', name: 'Medialuna (juego de memoria)', group: 'juego', Comp: JgMedialuna },
  { key: 'jg-cafe-frutilla', name: 'Frutilla (juego de memoria)', group: 'juego', Comp: JgFrutilla },
  { key: 'jg-cafe-naranja', name: 'Rodaja de naranja (juego de memoria)', group: 'juego', Comp: Naranja },
  { key: 'jg-cafe-dorso', name: 'Dorso de las cartas', group: 'juego', Comp: Dorso },
]
