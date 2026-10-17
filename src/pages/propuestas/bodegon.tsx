import { useId, type CSSProperties } from 'react'
import { IdRoot, type PieceProps, type SignatureProps } from './shared'
import { Banderines, BodegonArt, Defs, Napo, Penguin, Sifon } from '../../ui/art/scenes/bodegon'
import './bodegon.css'

// Mesa Clara · bodegón porteño. Pizarra con tiza (filtro SVG), cartel enlozado, mantel a cuadros,
// pingüino de vino, sifón y la libretita del mozo. Todo el arte es SVG propio.

const uidOf = (s: string) => s.replace(/[:«»]/g, '')

/** Filtro de tiza: grano + leve desplazamiento. Se aplica a texto HTML con `filter: url(#id)`. */
function ChalkFilter({ id }: { id: string }) {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
      <filter id={id} x="-5%" y="-10%" width="110%" height="120%">
        <feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" seed="7" result="n" />
        <feColorMatrix in="n" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 -2.6 2.05" result="m" />
        <feComposite in="SourceGraphic" in2="m" operator="in" result="t" />
        <feDisplacementMap in="t" in2="n" scale="1.6" xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </svg>
  )
}

function Pizarra({ compact = false, chalk }: { compact?: boolean; chalk: string }) {
  const c: CSSProperties = { filter: `url(#${chalk})` }
  return (
    <div className="bd-pizarra" data-compact={compact || undefined}>
      <div className="bd-board">
        <p className="bd-chalk bd-chalk-k" style={c}>Hoy</p>
        <p className="bd-chalk bd-chalk-t" style={c}>Milanesa napolitana con fritas</p>
        <p className="bd-chalk bd-chalk-p" style={c}>$ 20.200</p>
        {!compact && (
          <ul className="bd-chalk-list" style={c}>
            <li><span>Sorrentinos con fileto</span><b>$ 16.500</b></li>
            <li><span>Bife de chorizo</span><b>$ 24.900</b></li>
            <li><span>Flan con dulce de leche</span><b>$ 7.900</b></li>
          </ul>
        )}
        <svg className="bd-chalk-line" viewBox="0 0 300 20" aria-hidden="true" style={c}><path d="M4 12C60 4 120 16 180 8S270 14 296 6" fill="none" stroke="#f1ede2" strokeWidth="3" strokeLinecap="round" /></svg>
        <span className="bd-chalk-stick" aria-hidden="true" />
      </div>
    </div>
  )
}

function Libreta({ title, lines, foot }: { title: string; lines: string[]; foot?: string }) {
  return (
    <div className="bd-libreta">
      <div className="bd-espiral" aria-hidden="true">{Array.from({ length: 9 }, (_, i) => <i key={i} />)}</div>
      <p className="bd-lib-t">{title}</p>
      {lines.map((l) => <p key={l} className="bd-hand">{l}</p>)}
      {foot && <p className="bd-lib-f">{foot}</p>}
    </div>
  )
}

const CARTA: [string, [string, string][]][] = [
  ['Minutas', [['Milanesa de ternera', '$ 18.500'], ['Milanesa napolitana', '$ 20.200'], ['Suprema de pollo', '$ 17.200'], ['Revuelto Gramajo', '$ 15.400']]],
  ['Pastas', [['Sorrentinos de jamón y queso', '$ 16.500'], ['Ñoquis de papa', '$ 14.800'], ['Ravioles de verdura', '$ 15.200'], ['Lasagna boloñesa', '$ 17.400']]],
  ['Parrilla', [['Bife de chorizo', '$ 24.900'], ['Asado de tira', '$ 23.500'], ['Provoleta', '$ 12.500'], ['Mollejas crocantes', '$ 16.900']]],
]

function Carta() {
  return (
    <div className="bd-carta">
      <p className="bd-carta-h">La carta</p>
      <div className="bd-carta-cols">
        {CARTA.map(([cat, items]) => (
          <section key={cat}>
            <p className="bd-cat">{cat}</p>
            <ul>{items.map(([n, p]) => <li key={n}><span>{n}</span><i /><b>{p}</b></li>)}</ul>
          </section>
        ))}
      </div>
      <p className="bd-carta-f">Postres: flan casero con dulce de leche $ 7.900 · vigilante $ 7.200 · panqueque $ 7.500</p>
    </div>
  )
}

function Cartel({ sm = false }: { sm?: boolean }) {
  return (
    <div className="bd-cartel" data-sm={sm || undefined}>
      <span className="bd-cartel-n">MESA CLARA</span>
      {!sm && <span className="bd-cartel-s">Comidas · Vinos · Desde el mediodía</span>}
    </div>
  )
}

export function Store({ mode }: PieceProps) {
  const chalk = `${uidOf(useId())}-chalk`
  return (
    <IdRoot biz="resto" mode={mode} className="bd">
      <ChalkFilter id={chalk} />
      <header className="bd-head">
        <Cartel />
        <nav className="bd-nav"><span data-on>La carta</span><span>Reservar mesa</span><span>Pedir a la mesa</span><span>Mi pedido · 2</span></nav>
        <span className="bd-demo">DEMO</span>
      </header>
      <section className="bd-hero">
        <div className="bd-hero-l">
          <Pizarra chalk={chalk} />
          <div className="bd-ctas"><span className="bd-btn">Reservar una mesa</span><span className="bd-btn ghost">Ver la carta</span></div>
        </div>
        <div className="bd-hero-r"><BodegonArt />
          <Libreta title="Mesa para 4 · lun 19 · 21:45" lines={['4 personas, salón', 'Cumpleaños de la abuela']} foot="Solicitud enviada: el encargado la confirma" />
        </div>
      </section>
      <div className="bd-guarda" aria-hidden="true"><svg viewBox="0 0 1200 50" preserveAspectRatio="none"><Banderines width={1200} y={4} /></svg></div>
      <section className="bd-body"><Carta /></section>
    </IdRoot>
  )
}

export function StoreMobile({ mode }: PieceProps) {
  const chalk = `${uidOf(useId())}-chalk`
  return (
    <IdRoot biz="resto" mode={mode} className="bd bd-m">
      <ChalkFilter id={chalk} />
      <header className="bd-mhead"><Cartel sm /><span className="bd-demo">DEMO</span></header>
      <div className="bd-m-art"><BodegonArt compact /></div>
      <div className="bd-m-board"><Pizarra compact chalk={chalk} /></div>
      <div className="bd-m-ctas"><span className="bd-btn block">Reservar una mesa</span></div>
      <nav className="bd-tabs"><span data-on>Pizarra</span><span>Carta</span><span>Reservar</span><span>Pedido</span></nav>
    </IdRoot>
  )
}

export function Ops({ mode }: PieceProps) {
  const tickets = [
    { t: 'Mesa 4 · 13:10', l: ['1 napo c/ fritas', '1 sorrentinos fileto', '1 provoleta s/ orégano'], s: 'En preparación' },
    { t: 'Mesa 7 · 13:02', l: ['2 bife de chorizo', 'jugoso / a punto', '1 ensalada mixta'], s: 'Aceptado' },
    { t: 'Mesa 2 · 12:55', l: ['1 flan c/ dulce', '2 cafés'], s: 'Listo' },
  ]
  return (
    <IdRoot biz="resto" mode={mode} className="bd bd-ops">
      <p className="bd-ops-t">Cocina · comandas</p>
      <div className="bd-rail">
        {tickets.map((k) => (
          <div key={k.t} className="bd-comanda">
            <span className="bd-clip" aria-hidden="true" />
            <p className="bd-com-t">{k.t}</p>
            {k.l.map((x) => <p key={x} className="bd-hand sm">{x}</p>)}
            <span className="bd-com-s">{k.s}</span>
          </div>
        ))}
      </div>
    </IdRoot>
  )
}

export function Signature({ mode, play }: SignatureProps) {
  const u = uidOf(useId())
  return (
    <IdRoot biz="resto" mode={mode} className="bd bd-sig">
      <div className="bd-sig-stage" data-play={play > 0 || undefined} key={play}>
        <div className="bd-sig-lib">
          <Libreta title="Mesa 4" lines={['1 napo c/ fritas', '1 sorrentinos fileto', '1 sifón']} foot="Comanda C-0123 · en cocina" />
        </div>
        <svg viewBox="0 0 640 420" className="bd-sig-svg" aria-hidden="true">
          <Defs u={u} />
          <rect x="0" y="0" width="640" height="420" fill={`url(#${u}-ging)`} />
          <Sifon x={520} y={-10} s={0.8} className="bd-sig-sifon" />
          <path className="bd-jet" d="M466 0C440 10 420 40 410 90" fill="none" stroke="#e8f6fc" strokeWidth="5" strokeLinecap="round" />
          <g transform="translate(400 150)"><path d="M-26-50H26L20 40H-20Z" fill="#e6f4fa" opacity=".6" stroke="#fff" strokeWidth="1.5" /><path className="bd-soda" d="M-22-10H22L20 40H-20Z" fill="#d6ecf6" /></g>
          <g className="bd-sig-plate"><Napo x={250} y={290} s={1} /></g>
        </svg>
      </div>
    </IdRoot>
  )
}

export function Gallery({ mode }: PieceProps) {
  const chalk = `${uidOf(useId())}-chalk`
  return (
    <IdRoot biz="resto" mode={mode} className="bd bd-gallery">
      <ChalkFilter id={chalk} />
      <div className="bd-g big"><BodegonArt label="Naturaleza muerta de bodegón: pingüino, sifón, panera y milanesa napolitana" /></div>
      <div className="bd-g"><Pizarra compact chalk={chalk} /></div>
      <div className="bd-g"><svg viewBox="-80 -10 160 260" className="bd-g-svg" aria-hidden="true"><Penguin x={0} y={0} s={0.95} /></svg><span>Pingüino de vino</span></div>
    </IdRoot>
  )
}
