import type { ReactNode } from 'react'
import { IdRoot, type PieceProps, type SignatureProps } from './shared'
import { FileteCorner, FileteRule, Medialuna, SalonArt, TrayScene, Vitral } from '../../ui/art/scenes/salon'
import './cafe.css'

// Ritual Café · confitería notable porteña. Vitral, boiserie, mármol, alpaca y filete porteño.
// Todo el arte es SVG propio; los colores del filete siguen la tradición (verde, rojo, oro, toques de luz).

const CARTA = {
  cafeteria: [
    { n: 'Café en pocillo', d: 'Espresso, molienda del día', p: '$ 4.500' },
    { n: 'Cortado', d: 'Con un toque de leche', p: '$ 5.100' },
    { n: 'Lágrima', d: 'Leche con una gota de café', p: '$ 5.400', prov: true },
    { n: 'Café con leche', d: 'En taza grande, como siempre', p: '$ 5.900', prov: true },
    { n: 'Submarino', d: 'Leche caliente y barra de chocolate', p: '$ 6.300', prov: true },
    { n: 'Flat white de especialidad', d: 'Doble espresso, leche texturizada', p: '$ 5.800' },
  ],
  pasteleria: [
    { n: 'Medialuna de manteca', d: 'Con almíbar · c/u', p: '$ 2.200' },
    { n: 'Medialuna de grasa', d: 'Salada, crocante · c/u', p: '$ 2.000', prov: true },
    { n: 'Tostado de jamón y queso', d: 'Pan de molde artesanal', p: '$ 9.900' },
    { n: 'Budín de limón', d: 'Porción glaseada', p: '$ 4.800' },
    { n: 'Roll de canela', d: 'Glaseado de queso crema', p: '$ 6.200' },
  ],
}

function CardFrame({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`cf-card ${className}`}>
      <FileteCorner className="cf-tl" size={112} /><FileteCorner className="cf-tr" size={112} /><FileteCorner className="cf-bl" size={112} /><FileteCorner className="cf-br" size={112} />
      {children}
    </div>
  )
}

function Carta() {
  return (
    <CardFrame className="cf-carta">
      <p className="cf-card-kicker">La carta</p>
      <div className="cf-carta-cols">
        {(['cafeteria', 'pasteleria'] as const).map((k) => (
          <section key={k}>
            <p className="cf-section">{k === 'cafeteria' ? 'Cafetería' : 'Pastelería'}</p>
            <ul>
              {CARTA[k].map((i) => (
                <li key={i.n}><span className="cf-iname">{i.n}</span><span className="cf-lead" /><span className="cf-price">{i.p}</span><span className="cf-idesc">{i.d}</span></li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <p className="cf-note">Medialunas también por media docena ($ 12.600) y por docena ($ 24.000).</p>
    </CardFrame>
  )
}

function Comanda() {
  const rows: [string, [string, boolean][]][] = [
    ['Servicio', [['Pocillo', false], ['Jarrito', false], ['Taza grande', true]]],
    ['Café', [['Con leche', true], ['Cortado', false], ['Lágrima', false]]],
    ['Medialunas', [['2 de manteca', true], ['½ docena', false], ['Docena', false]]],
  ]
  return (
    <div className="cf-comanda">
      <div className="cf-comanda-head"><span>Para llevar</span><span className="cf-num">Nº 014</span></div>
      {rows.map(([label, opts]) => (
        <div className="cf-row" key={label}>
          <span className="cf-row-l">{label}</span>
          <div className="cf-tokens">{opts.map(([o, on]) => <span key={o} className="cf-token" data-on={on || undefined}>{o}</span>)}</div>
        </div>
      ))}
      <div className="cf-total"><span>Café con leche y dos medialunas</span><strong>$ 10.300</strong></div>
      <span className="cf-btn block">Pedir para retirar</span>
      <p className="cf-small">Pagás en el local al retirar. No se cobra nada desde la web.</p>
    </div>
  )
}

function Espejo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="cf-espejo" data-compact={compact || undefined}>
      <p className="cf-espejo-k">Hoy en el salón</p>
      <p className="cf-espejo-t">Café con leche<br />y dos medialunas</p>
      <p className="cf-espejo-p">$ 10.300</p>
    </div>
  )
}

export function Store({ mode }: PieceProps) {
  return (
    <IdRoot biz="cafe" mode={mode} className="cf">
      <div className="cf-topbar"><span>Salón · Barra · Para llevar</span><span>Abierto hasta las 20:00</span><span className="cf-demo">DEMO</span></div>
      <header className="cf-head">
        <p className="cf-script">Confitería</p>
        <p className="cf-wordmark">Ritual Café</p>
        <FileteRule width={360} />
        <nav className="cf-nav"><span data-on>Carta</span><span>Desayunos y meriendas</span><span>Pastelería</span><span>Mi pedido · 2</span></nav>
      </header>
      <section className="cf-hero">
        <div className="cf-hero-copy">
          <p className="cf-script lg">Buenos días,</p>
          <p className="cf-title">El café con leche y las medialunas de siempre.</p>
          <p className="cf-lead-p">Pedilo para retirar en la barra o sentate en el salón. Las medialunas salen del horno cada mañana.</p>
          <div className="cf-ctas"><span className="cf-btn">Pedir para retirar</span><span className="cf-btn ghost">Ver la carta</span></div>
          <Espejo />
        </div>
        <div className="cf-hero-art"><SalonArt /></div>
      </section>
      <section className="cf-body"><Carta /><Comanda /></section>
      <footer className="cf-damero"><span>Cafetería · Pastelería · Desde la primera mañana</span></footer>
    </IdRoot>
  )
}

export function StoreMobile({ mode }: PieceProps) {
  return (
    <IdRoot biz="cafe" mode={mode} className="cf cf-m">
      <header className="cf-mhead"><span className="cf-wordmark sm">Ritual Café</span><span className="cf-demo">DEMO</span></header>
      <div className="cf-m-art"><SalonArt /></div>
      <div className="cf-m-copy">
        <p className="cf-script lg">Buenos días,</p>
        <p className="cf-title">El café con leche y las medialunas de siempre.</p>
        <span className="cf-btn block">Pedir para retirar</span>
        <span className="cf-btn ghost block">Ver la carta</span>
      </div>
      <nav className="cf-tabs"><span data-on>Inicio</span><span>Carta</span><span>Pedido</span><span>Salón</span></nav>
    </IdRoot>
  )
}

export function Ops({ mode }: PieceProps) {
  return (
    <IdRoot biz="cafe" mode={mode} className="cf cf-ops">
      <div className="cf-kds">
        <div className="cf-kds-head"><span>Barra · Para llevar</span><span className="cf-num">Nº 014</span></div>
        <ul><li><b>1</b> Café con leche · taza grande</li><li><b>2</b> Medialunas de manteca</li></ul>
        <p className="cf-kds-note">Retira 10:30 · Pago en el local pendiente</p>
        <div className="cf-kds-actions"><span className="cf-btn">Listo para retirar</span><span className="cf-btn ghost">Incidencia</span></div>
      </div>
      <table className="cf-table">
        <thead><tr><th>Nº</th><th>Pedido</th><th>Estado</th><th>Hora</th></tr></thead>
        <tbody>
          <tr><td>014</td><td>Café con leche + 2 medialunas</td><td><span className="cf-badge">Aceptado</span></td><td>10:30</td></tr>
          <tr><td>013</td><td>Submarino</td><td><span className="cf-badge">En preparación</span></td><td>10:20</td></tr>
          <tr><td>Mesa 6</td><td>Lágrima + tostado</td><td><span className="cf-badge">Servido</span></td><td>10:12</td></tr>
        </tbody>
      </table>
    </IdRoot>
  )
}

export function Signature({ mode, play }: SignatureProps) {
  return (
    <IdRoot biz="cafe" mode={mode} className="cf cf-sig" style={{ minHeight: 360 }}>
      <div className="cf-sig-stage" data-play={play > 0 || undefined} key={play}>
        <div className="cf-sig-tray"><TrayScene /></div>
        <div className="cf-sig-ticket">
          <FileteCorner className="cf-tl" size={70} draw /><FileteCorner className="cf-br" size={70} draw />
          <p className="cf-script">Para llevar</p>
          <p className="cf-sig-num">Nº 014</p>
          <p className="cf-sig-state">Aceptado</p>
          <p className="cf-small">Pago en el local pendiente</p>
        </div>
      </div>
    </IdRoot>
  )
}

export function Gallery({ mode }: PieceProps) {
  return (
    <IdRoot biz="cafe" mode={mode} className="cf cf-gallery">
      <div className="cf-g-item big"><SalonArt label="El salón bajo el vitral con la mesa servida" /></div>
      <div className="cf-g-item"><FileteCorner size={200} /><span>Esquina de filete</span></div>
      <div className="cf-g-item"><Espejo compact /><span>Espejo con letras doradas</span></div>
    </IdRoot>
  )
}
