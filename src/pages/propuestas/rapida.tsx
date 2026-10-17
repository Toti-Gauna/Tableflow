import { useId, type CSSProperties } from 'react'
import { IdRoot, type PieceProps, type SignatureProps } from './shared'
import './rapida.css'

// Brasa Rápida · comida rápida "brasa a la vista". Producto como foto (hamburguesa ilustrada con brillo,
// cheddar derretido y marcas de parrilla), rail de categorías de kiosco, combo por pasos y tablero de números.

const uidOf = (s: string) => s.replace(/[:«»]/g, '')

function Defs({ u }: { u: string }) {
  return (
    <defs>
      <radialGradient id={`${u}-bun`} cx=".42" cy=".25" r=".85"><stop offset="0" stopColor="#ffcf7a" /><stop offset=".45" stopColor="#e8902f" /><stop offset=".85" stopColor="#b35d1a" /><stop offset="1" stopColor="#8a4311" /></radialGradient>
      <linearGradient id={`${u}-bunb`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#e9973a" /><stop offset="1" stopColor="#a8541a" /></linearGradient>
      <radialGradient id={`${u}-patty`} cx=".45" cy=".3" r=".8"><stop offset="0" stopColor="#7a4428" /><stop offset=".6" stopColor="#4a2414" /><stop offset="1" stopColor="#2a1208" /></radialGradient>
      <linearGradient id={`${u}-cheese`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffd34d" /><stop offset=".6" stopColor="#ffab1a" /><stop offset="1" stopColor="#e88a0c" /></linearGradient>
      <linearGradient id={`${u}-lettuce`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#9be05c" /><stop offset=".6" stopColor="#5cb33a" /><stop offset="1" stopColor="#3a8326" /></linearGradient>
      <linearGradient id={`${u}-fry`} x1="0" x2="1"><stop offset="0" stopColor="#ffd96b" /><stop offset=".5" stopColor="#f7bd38" /><stop offset="1" stopColor="#d9921c" /></linearGradient>
      <linearGradient id={`${u}-box`} x1="0" x2="1"><stop offset="0" stopColor="#e8402c" /><stop offset=".6" stopColor="#c8261b" /><stop offset="1" stopColor="#951510" /></linearGradient>
      <linearGradient id={`${u}-cup`} x1="0" x2="1"><stop offset="0" stopColor="#ffffff" /><stop offset=".7" stopColor="#f2ece2" /><stop offset="1" stopColor="#cfc6b8" /></linearGradient>
      <radialGradient id={`${u}-glow`} cx=".5" cy=".55" r=".6"><stop offset="0" stopColor="#ffd28a" stopOpacity=".9" /><stop offset=".6" stopColor="#ff8a3d" stopOpacity=".25" /><stop offset="1" stopColor="#ff8a3d" stopOpacity="0" /></radialGradient>
      <filter id={`${u}-blur`} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6" /></filter>
    </defs>
  )
}

/** Capas de la hamburguesa por separado: así la animación las puede dejar caer una por una. */
function BurgerLayers({ u }: { u: string }) {
  const seeds = [[230, 120, -20], [262, 100, 10], [300, 92, -5], [338, 102, 25], [372, 122, -15], [208, 150, 30], [248, 140, -35], [290, 128, 15], [330, 136, -10], [370, 152, 40], [400, 150, -25], [270, 170, 5], [314, 166, -30], [352, 178, 20], [228, 182, -10], [192, 178, 15]]
  return (
    <>
      <g data-layer="0" style={{ ['--i' as string]: 0 } as CSSProperties}>
        <path d="M118 428C118 474 172 504 300 504C428 504 482 474 482 428Z" fill={`url(#${u}-bunb)`} />
        <ellipse cx="300" cy="428" rx="182" ry="20" fill="#f7d39a" />
        <path d="M130 446C180 468 420 468 470 446" stroke="#fff" strokeWidth="5" opacity=".25" strokeLinecap="round" fill="none" />
      </g>
      <g data-layer="1" style={{ ['--i' as string]: 1 } as CSSProperties}>
        <path d="M106 398C96 376 128 358 160 356H440C472 358 504 376 494 398C504 420 472 438 440 440H160C128 438 96 420 106 398Z" fill={`url(#${u}-patty)`} />
        {[0, 1, 2, 3, 4, 5, 6].map((k) => <path key={k} d={`M${150 + k * 46} 366L${176 + k * 46} 386`} stroke="#1e0b04" strokeWidth="6" strokeLinecap="round" opacity=".55" />)}
        {Array.from({ length: 30 }, (_, k) => <circle key={k} cx={120 + ((k * 61) % 360)} cy={372 + ((k * 23) % 56)} r={1.5 + (k % 3)} fill={k % 2 ? '#a5602e' : '#1e0b04'} opacity=".6" />)}
        <path d="M130 384C180 372 260 370 330 372" stroke="#c98a55" strokeWidth="3" opacity=".55" strokeLinecap="round" fill="none" />
      </g>
      <g data-layer="2" style={{ ['--i' as string]: 2 } as CSSProperties}>
        <path className="br-cheese" d="M116 360L486 352L478 374L460 412L442 378L384 384L364 424L344 384L256 388L238 420L218 382L152 380L136 408L124 376Z" fill={`url(#${u}-cheese)`} />
        <path d="M130 362L470 356" stroke="#fff3c0" strokeWidth="3" opacity=".8" strokeLinecap="round" />
      </g>
      <g data-layer="3" style={{ ['--i' as string]: 3 } as CSSProperties}>
        <path d="M110 330C100 310 130 294 162 292H438C470 294 500 310 490 330C500 350 470 366 438 368H162C130 366 100 350 110 330Z" fill={`url(#${u}-patty)`} />
        {[0, 1, 2, 3, 4, 5, 6].map((k) => <path key={k} d={`M${152 + k * 46} 300L${178 + k * 46} 320`} stroke="#1e0b04" strokeWidth="6" strokeLinecap="round" opacity=".55" />)}
        {Array.from({ length: 26 }, (_, k) => <circle key={k} cx={124 + ((k * 67) % 352)} cy={306 + ((k * 29) % 54)} r={1.5 + (k % 3)} fill={k % 2 ? '#a5602e' : '#1e0b04'} opacity=".6" />)}
      </g>
      <g data-layer="4" style={{ ['--i' as string]: 4 } as CSSProperties}>
        <path className="br-cheese" d="M120 296L482 288L474 310L456 350L438 316L380 320L360 360L340 320L252 324L234 356L214 318L150 316L134 344L124 312Z" fill={`url(#${u}-cheese)`} />
        <path d="M134 298L468 292" stroke="#fff3c0" strokeWidth="3" opacity=".8" strokeLinecap="round" />
        {[[176, 300], [418, 298]].map(([x, y]) => <g key={x}><ellipse cx={x} cy={y} rx="26" ry="9" fill="#5f8f2a" /><ellipse cx={x} cy={y} rx="20" ry="6" fill="#9cc65a" /></g>)}
      </g>
      <g data-layer="5" style={{ ['--i' as string]: 5 } as CSSProperties}>
        {[[200, 278], [300, 272], [400, 278]].map(([x, y]) => <g key={x}><ellipse cx={x} cy={y} rx="64" ry="16" fill="#c9231b" /><ellipse cx={x} cy={y - 2} rx="54" ry="11" fill="#e8453a" /><ellipse cx={x - 14} cy={y - 4} rx="10" ry="4" fill="#ffb3a6" opacity=".7" /></g>)}
        <path d="M96 268C110 248 124 276 140 256C156 238 168 272 186 252C204 234 216 270 236 250C254 232 266 268 286 250C304 232 318 268 338 248C356 232 368 268 388 250C406 234 420 270 438 252C454 236 468 266 486 250C498 240 508 256 504 266C480 286 120 290 96 268Z" fill={`url(#${u}-lettuce)`} />
        <path d="M120 266C170 262 260 262 330 260" stroke="#d6f5a8" strokeWidth="2.5" opacity=".8" fill="none" strokeLinecap="round" />
      </g>
      <g data-layer="6" style={{ ['--i' as string]: 6 } as CSSProperties}>
        <path d="M98 250C98 118 200 68 300 68C400 68 502 118 502 250C502 270 470 278 300 278C130 278 98 270 98 250Z" fill={`url(#${u}-bun)`} />
        <path d="M108 248C132 262 468 262 492 248C492 260 470 270 300 270C130 270 108 262 108 248Z" fill="#f6c27a" opacity=".55" />
        <ellipse cx="236" cy="128" rx="86" ry="34" transform="rotate(-18 236 128)" fill="#fff" opacity=".35" filter={`url(#${u}-blur)`} />
        <ellipse cx="226" cy="118" rx="26" ry="8" transform="rotate(-20 226 118)" fill="#fff" opacity=".75" />
        {seeds.map(([x, y, a]) => <g key={`${x}${y}`} className="br-seed" transform={`rotate(${a} ${x} ${y})`}><ellipse cx={x + 1} cy={y + 2} rx="7" ry="3.6" fill="#8a4311" opacity=".35" /><ellipse cx={x} cy={y} rx="7" ry="3.6" fill="#fff4d9" /><ellipse cx={x - 2} cy={y - 1} rx="3" ry="1.2" fill="#fff" /></g>)}
      </g>
    </>
  )
}

function Fries({ u, x, y, s = 1, logo = true }: { u: string; x: number; y: number; s?: number; logo?: boolean }) {
  const fries = [[-46, -40, -8], [-30, -64, -4], [-14, -50, 2], [2, -72, 6], [18, -56, 10], [34, -66, 14], [48, -44, 18], [-38, -22, -12], [26, -30, 8], [-6, -34, 0]]
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <g data-layer="7" style={{ ['--i' as string]: 7 } as CSSProperties}>
        {fries.map(([fx, fy, a], k) => <g key={k} transform={`rotate(${a} ${fx} ${fy + 40})`}><rect x={fx - 7} y={fy} width="14" height="110" rx="3" fill={`url(#${u}-fry)`} /><rect x={fx - 7} y={fy} width="14" height="9" rx="3" fill="#c7811a" /><rect x={fx - 7} y={fy + 9} width="4" height="90" fill="#fff0b5" opacity=".6" /></g>)}
      </g>
      <path d="M-70 10C-40 26 40 26 70 10L60 140H-60Z" fill={`url(#${u}-box)`} />
      <path d="M-70 10C-40 26 40 26 70 10L68 30C38 44-38 44-68 30Z" fill="#fff" opacity=".18" />
      {logo && <g transform="translate(0 84)"><path d="M0-30C10-18 22-12 20 4C18 18 8 24 0 24C-8 24-18 18-20 4C-22-12-10-18 0-30Z" fill="#ffb21a" /><path d="M0-12C6-4 10 0 9 8C8 14 4 16 0 16C-4 16-8 14-9 8C-10 0-6-4 0-12Z" fill="#fff3e2" /></g>}
    </g>
  )
}

function Cup({ u, x, y, s = 1 }: { u: string; x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-56 0H56L44 190H-44Z" fill={`url(#${u}-cup)`} />
      <path d="M-52 40H52L48 96H-48Z" fill="#c8261b" />
      <path d="M-49 96H49L47 112H-47Z" fill="#ffb21a" />
      <path d="M-60-14H60V2H-60Z" fill="#f2ece2" stroke="#d9cfbf" strokeWidth="2" />
      <path d="M8-14L28-90" stroke="#c8261b" strokeWidth="10" strokeLinecap="round" />
      <path d="M8-14L28-90" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity=".5" />
      {[[-30, 130], [-18, 150], [30, 140], [20, 168], [-36, 160]].map(([a, b]) => <ellipse key={`${a}${b}`} cx={a} cy={b} rx="2.6" ry="4" fill="#fff" opacity=".85" />)}
      <path d="M-44 10L-36 180" stroke="#fff" strokeWidth="6" opacity=".6" strokeLinecap="round" />
    </g>
  )
}

/** Ilustración firma: combo con hamburguesa doble, papas y bebida sobre brasa. */
export function ComboArt({ label, compact = false, className }: { label?: string; compact?: boolean; className?: string }) {
  const u = uidOf(useId())
  return (
    <svg className={`br-art ${className ?? ''}`} viewBox="0 0 640 560" role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      <Defs u={u} />
      <circle cx="320" cy="300" r="280" fill={`url(#${u}-glow)`} />
      {!compact && Array.from({ length: 16 }, (_, k) => <path key={k} d="M320 300L320 10L336 12Z" transform={`rotate(${k * 22.5} 320 300)`} fill="#fff" opacity=".12" />)}
      {!compact && <Cup u={u} x={92} y={250} s={0.9} />}
      {!compact && <Fries u={u} x={560} y={350} s={0.95} />}
      <ellipse cx="300" cy="520" rx="210" ry="22" fill="#000" opacity=".22" filter={`url(#${u}-blur)`} />
      <g transform="translate(14 0)"><BurgerLayers u={u} /></g>
    </svg>
  )
}

function Sticker({ top, price }: { top: string; price: string }) {
  return (
    <div className="br-sticker">
      <svg viewBox="0 0 200 200" aria-hidden="true"><path d={Array.from({ length: 32 }, (_, i) => { const a = (i / 32) * Math.PI * 2; const r = i % 2 ? 84 : 98; return `${i ? 'L' : 'M'}${(100 + r * Math.cos(a)).toFixed(1)} ${(100 + r * Math.sin(a)).toFixed(1)}` }).join('') + 'Z'} fill="var(--mustard)" /></svg>
      <span><small>{top}</small><b>{price}</b></span>
    </div>
  )
}

function CatIcon({ k }: { k: 'burger' | 'pollo' | 'papas' | 'bebida' | 'postre' | 'kids' }) {
  const u = uidOf(useId())
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" className="br-cat-ic">
      <Defs u={u} />
      {k === 'burger' && <g><path d="M18 52C18 26 34 18 50 18S82 26 82 52Z" fill={`url(#${u}-bun)`} /><rect x="16" y="54" width="68" height="10" rx="5" fill="#5cb33a" /><rect x="14" y="62" width="72" height="12" rx="6" fill={`url(#${u}-patty)`} /><path d="M18 74H82C82 84 70 88 50 88S18 84 18 74Z" fill={`url(#${u}-bunb)`} /></g>}
      {k === 'pollo' && <g>{[[34, 56, 20], [60, 44, 18], [62, 70, 16]].map(([x, y, r]) => <g key={x}><circle cx={x} cy={y} r={r} fill="#e8a23c" /><circle cx={x - r / 3} cy={y - r / 3} r={r / 3} fill="#ffd27a" /></g>)}</g>}
      {k === 'papas' && <g transform="translate(50 30) scale(.42)"><Fries u={u} x={0} y={60} logo={false} /></g>}
      {k === 'bebida' && <g transform="translate(50 30) scale(.32)"><Cup u={u} x={0} y={30} /></g>}
      {k === 'postre' && <g><path d="M30 50H70L64 86H36Z" fill="#fff" stroke="#e0d6c8" strokeWidth="3" /><path d="M28 50C28 30 72 30 72 50Z" fill="#f8efe0" /><path d="M32 46C40 40 46 52 54 44S66 46 70 48" stroke="#6b351d" strokeWidth="6" strokeLinecap="round" fill="none" /></g>}
      {k === 'kids' && <g><path d="M22 40H78V84H22Z" fill="#c8261b" /><path d="M22 40L30 26H70L78 40Z" fill="#ffb21a" /><circle cx="40" cy="60" r="5" fill="#fff" /><circle cx="60" cy="60" r="5" fill="#fff" /><path d="M38 72C46 78 54 78 62 72" stroke="#fff" strokeWidth="4" fill="none" strokeLinecap="round" /></g>}
    </svg>
  )
}

const CATS = [['burger', 'Hamburguesas'], ['pollo', 'Pollo'], ['papas', 'Papas'], ['bebida', 'Bebidas'], ['postre', 'Postres'], ['kids', 'Cajita'] ] as const

function Rail() {
  return <div className="br-rail">{CATS.map(([k, n], i) => <div key={k} className="br-cat" data-on={i === 0 || undefined}><CatIcon k={k} /><span>{n}</span></div>)}</div>
}

function Builder() {
  return (
    <div className="br-builder">
      <div className="br-step">
        <p className="br-step-t"><b>1</b>Tamaño del combo</p>
        <div className="br-sizes">
          {[['Mediano', 0.72, '$ 14.900', true], ['Grande', 0.86, '$ 16.400', false], ['Mega', 1, '$ 17.900', false]].map(([n, sc, p, on]) => (
            <div key={n as string} className="br-size" data-on={on || undefined}>
              <svg viewBox="0 0 120 150" aria-hidden="true"><SizeFries s={sc as number} /></svg>
              <b>{n as string}</b><span>{p as string}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="br-step">
        <p className="br-step-t"><b>2</b>Bebida</p>
        <div className="br-chips"><span data-on>Cola sin azúcar</span><span>Naranja</span><span>Agua</span></div>
      </div>
      <div className="br-step">
        <p className="br-step-t"><b>3</b>A tu manera</p>
        <div className="br-chips"><span data-on>Sin cebolla</span><span>Extra cheddar + $ 1.200</span><span>Panceta + $ 1.500</span><span>Sin pepinos</span></div>
      </div>
      <div className="br-total"><span>Combo Brasa Doble mediano</span><strong>$ 14.900</strong></div>
      <span className="br-btn block">Agregar y pagar en el local</span>
    </div>
  )
}

function SizeFries({ s }: { s: number }) {
  const u = uidOf(useId())
  return <g><Defs u={u} /><Fries u={u} x={60} y={150 - 140 * s} s={s * 0.85} logo={false} /></g>
}

function Board({ compact = false }: { compact?: boolean }) {
  return (
    <div className="br-board" data-compact={compact || undefined}>
      <div><p className="br-board-h">Preparando</p><div className="br-nums"><span>045</span><span>046</span><span className="me">047</span></div></div>
      <div><p className="br-board-h ok">Listo</p><div className="br-nums ok"><span>042</span><span>043</span><span>044</span></div></div>
    </div>
  )
}

function Logo({ sm = false }: { sm?: boolean }) {
  return (
    <span className="br-logo" data-sm={sm || undefined}>
      <svg viewBox="0 0 40 50" aria-hidden="true"><path d="M20 0C28 12 40 18 38 32C36 44 28 50 20 50C12 50 4 44 2 32C0 18 12 12 20 0Z" fill="var(--flame)" /><path d="M20 20C25 27 30 30 29 37C28 43 24 45 20 45C16 45 12 43 11 37C10 30 15 27 20 20Z" fill="var(--mustard)" /></svg>
      <span>brasa</span>
    </span>
  )
}

export function Store({ mode }: PieceProps) {
  return (
    <IdRoot biz="rapida" mode={mode} className="br">
      <header className="br-head">
        <Logo />
        <div className="br-toggle"><span data-on>Para llevar</span><span>Comer acá</span></div>
        <span className="br-demo">DEMO</span>
        <span className="br-cart"><b>2</b> Mi pedido · $ 14.900</span>
      </header>
      <Rail />
      <section className="br-hero">
        <div className="br-hero-copy">
          <p className="br-kicker">Nuevo · hecho a la brasa</p>
          <p className="br-title">Combo Brasa Doble</p>
          <p className="br-lead">Doble medallón a la parrilla, cheddar derretido, lechuga, tomate y pepinos. Con papas y bebida.</p>
          <div className="br-ctas"><span className="br-btn">Armalo</span><span className="br-btn ghost">Repetir mi último pedido</span></div>
        </div>
        <div className="br-hero-art"><ComboArt /><Sticker top="Combo" price="$ 14.900" /></div>
      </section>
      <section className="br-lower"><Builder /><div className="br-side"><p className="br-h2">Tu número</p><Board /><p className="br-small">Retirás en el mostrador cuando tu número pase a Listo. Pagás en el local.</p></div></section>
    </IdRoot>
  )
}

export function StoreMobile({ mode }: PieceProps) {
  return (
    <IdRoot biz="rapida" mode={mode} className="br br-m">
      <header className="br-mhead"><Logo sm /><span className="br-demo">DEMO</span></header>
      <Rail />
      <div className="br-m-art"><ComboArt compact /><Sticker top="Combo" price="$ 14.900" /></div>
      <div className="br-m-copy"><p className="br-title">Combo Brasa Doble</p><span className="br-btn block">Armalo</span></div>
      <nav className="br-tabs"><span data-on>Menú</span><span>Ofertas</span><span>Pedido</span><span>Cajita</span></nav>
    </IdRoot>
  )
}

export function Ops({ mode }: PieceProps) {
  const st: [string, string[]][] = [['Plancha', ['#047 · 2 medallones', '#048 · 1 medallón']], ['Freidora', ['#047 · papas M', '#046 · papas G']], ['Armado', ['#046 · Combo Verde', '#045 · Pollo crispy']]]
  return (
    <IdRoot biz="rapida" mode={mode} className="br br-ops">
      <div className="br-stations">{st.map(([n, l]) => <div key={n} className="br-station"><p>{n}</p>{l.map((x) => <span key={x}>{x}</span>)}</div>)}</div>
      <Board compact />
    </IdRoot>
  )
}

export function Signature({ mode, play }: SignatureProps) {
  return (
    <IdRoot biz="rapida" mode={mode} className="br br-sig">
      <div className="br-sig-stage" data-play={play > 0 || undefined} key={play}>
        <ComboArt className="br-sig-art" />
        <div className="br-sig-board">
          <p className="br-board-h">Tu número</p>
          <p className="br-sig-num">047</p>
          <p className="br-sig-st"><span className="a">Preparando</span><span className="b">¡Listo! Retiralo en el mostrador</span></p>
          <p className="br-small">Pago en el local pendiente</p>
        </div>
      </div>
    </IdRoot>
  )
}

export function Gallery({ mode }: PieceProps) {
  return (
    <IdRoot biz="rapida" mode={mode} className="br br-gallery">
      <div className="br-g big"><ComboArt label="Combo con hamburguesa doble, papas y bebida" /></div>
      <div className="br-g"><Rail /></div>
      <div className="br-g"><Board compact /></div>
    </IdRoot>
  )
}
