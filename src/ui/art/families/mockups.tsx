import type { ReactNode } from 'react'
import { FAMILIES, Piece, type IdentityKey } from './index'
import './mockups.css'

// P5-L4 · Mockups con acabado final: comprobante, tarjeta de fidelidad y teléfono por identidad.
// "Mock" describe los datos (ficticios) y las conexiones (ninguna), no una calidad visual menor.
// Son HTML con texto real (legible por lectores de pantalla); el arte de cada pieza sale de su familia.

const art = (id: IdentityKey, key: string, size: number) => {
  const p = FAMILIES[id].pieces.find((x) => x.key === key)
  return p ? <Piece size={size}><p.Comp /></Piece> : null
}

function Filete() {
  return (
    <svg className="mk-filete" viewBox="0 0 40 40" aria-hidden="true">
      <path d="M4 36C4 18 18 4 36 4M10 36C10 22 22 10 36 10M16 30c4-6 10-6 12-2" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  )
}

/** Comprobante del pedido, uno por identidad (lo que ve la persona al confirmar). */
export function Ticket({ id }: { id: IdentityKey }) {
  switch (id) {
    case 'cafe':
      return (
        <article className="mk-ticket mk-t-cafe" aria-label="Comprobante de Ritual Café, número 014">
          {[0, 1, 2, 3].map((k) => <span key={k} className={`mk-corner c${k}`}><Filete /></span>)}
          <p className="mk-brand">Ritual Café</p>
          <p className="mk-script">para retirar en el mostrador</p>
          <p className="mk-num"><small>Nº</small> 014</p>
          <ul>
            <li><span>Café con leche</span><b>$ 5.900</b></li>
            <li><span>Medialunas de manteca × 2</span><b>$ 4.400</b></li>
          </ul>
          <p className="mk-total"><span>Total</span><b>$ 10.300</b></p>
          <p className="mk-pill">Aceptado · pago en el local pendiente</p>
        </article>
      )
    case 'resto':
      return (
        <article className="mk-ticket mk-t-resto" aria-label="Comanda de Mesa Clara, mesa 12">
          <div className="mk-rings" aria-hidden="true">{Array.from({ length: 9 }, (_, i) => <i key={i} />)}</div>
          <p className="mk-hand mk-head">Mesa 12 · 4 cubiertos</p>
          <ol className="mk-hand">
            <li>1 milanesa napolitana c/ fritas</li>
            <li>1 sorrentinos con fileto</li>
            <li>2 flan con dulce de leche</li>
            <li>1 sifón y 1 agua</li>
          </ol>
          <p className="mk-folio"><span>Comanda</span> <b>0412</b></p>
          <p className="mk-stamp">En cocina</p>
        </article>
      )
    case 'hela':
      return (
        <article className="mk-ticket mk-t-hela" aria-label="Comprobante de Copo, pedido H-007">
          <p className="mk-brand">Copo</p>
          <p className="mk-num">H-007</p>
          <p className="mk-fmt">Pote de ½ kg · retiro en el mostrador</p>
          <ul>
            {[['Chocolate amargo', '#5a2d1c'], ['Crema americana', '#f7e7c6'], ['Menta granizada', '#9edcc8']].map(([n, c]) => <li key={n}><i style={{ background: c }} aria-hidden="true" />{n}</li>)}
          </ul>
          <p className="mk-total"><span>Total</span><b>$ 12.800</b></p>
          <p className="mk-pill">Listo para retirar</p>
        </article>
      )
    case 'bar':
      return (
        <article className="mk-ticket mk-t-bar" aria-label="Reserva de Taberna Compás, mesa 9">
          <div className="mk-label">
            <p className="mk-side">Lado A · noche de jazz</p>
            <p className="mk-num">Mesa 9</p>
            <span className="mk-hole" aria-hidden="true" />
            <p className="mk-meta">4 personas · jueves 22/10 · 21:00</p>
          </div>
          <p className="mk-note">Reserva de mesa. Sin entradas ni consumo mínimo.</p>
        </article>
      )
    case 'rapida':
      return (
        <article className="mk-ticket mk-t-rapida" aria-label="Número de retiro de Brasa Rápida, 047, listo">
          <div className="mk-board">
            <div><p>Preparando</p><b>048</b><b>049</b></div>
            <div className="on"><p>Listo</p><b className="mine">047</b><b>045</b></div>
          </div>
          <p className="mk-num">047</p>
          <p className="mk-meta">Combo doble mediano · sin cebolla</p>
          <p className="mk-pill">Retirá en el mostrador 2</p>
        </article>
      )
  }
}

/** Tarjeta de fidelidad: la mecánica de cada negocio, con el progreso de una clienta ficticia. */
export function Loyalty({ id }: { id: IdentityKey }) {
  const cfg = {
    cafe: { t: 'Pasaporte de sabores', s: '3 de 8 orígenes probados', n: 8, done: 3, mark: <span className="mk-seal">R</span> },
    resto: { t: 'Tarjeta de visitas', s: '3 de 10 visitas', n: 10, done: 3, mark: art('resto', 'x-resto-pinguino', 30) },
    hela: { t: 'Gustos probados', s: '4 de 8 gustos', n: 8, done: 4, mark: null },
    bar: { t: 'Noches de la agenda', s: '2 de 6 noches', n: 6, done: 2, mark: art('bar', 'jg-bar-disco', 30) },
    rapida: { t: 'Sellos por combo', s: '5 de 8 combos', n: 8, done: 5, mark: <svg viewBox="-12 -16 24 32" width="22" height="28" aria-hidden="true"><path d="M0 14C-9 14-13 6-11-1C-9-7-4-9-4-15C2-11 4-6 3-2C6-4 7-7 7-10C12-5 12 4 9 8C7 12 4 14 0 14Z" fill="currentColor" /></svg> },
  }[id]
  const gustos = ['frutilla', 'ddl', 'choco', 'pistacho', 'limon', 'menta', 'crema', 'sambayon']
  return (
    <article className={`mk-loyal mk-l-${id}`} aria-label={`${cfg.t}: ${cfg.s}`}>
      <header>
        <p className="mk-ltitle">{cfg.t}</p>
        <p className="mk-lsub">{FAMILIES[id].name} · Ana (cliente ficticia)</p>
      </header>
      <ol className="mk-slots">
        {Array.from({ length: cfg.n }, (_, i) => (
          <li key={i} data-done={i < cfg.done || undefined} aria-label={i < cfg.done ? `Casilla ${i + 1}: sellada` : `Casilla ${i + 1}: libre`}>
            {id === 'hela' ? art('hela', `jg-hela-${gustos[i]}`, 34) : i < cfg.done ? cfg.mark : <span className="mk-n">{i + 1}</span>}
          </li>
        ))}
      </ol>
      <p className="mk-lfoot">{cfg.s} · el sello lo pone el equipo en la visita · beneficio de muestra</p>
    </article>
  )
}

function StatusBar({ time }: { time: string }) {
  return (
    <div className="mk-status" aria-hidden="true">
      <span>{time}</span>
      <span className="mk-island" />
      <svg viewBox="0 0 54 12" width="54" height="12">
        {[0, 1, 2, 3].map((i) => <rect key={i} x={i * 4.5} y={9 - i * 2.4} width="3" height={3 + i * 2.4} rx="1" fill="currentColor" />)}
        <path d="M26 5.5a8 8 0 0 1 10 0M28 7.6a5 5 0 0 1 6 0M30 9.6a2 2 0 0 1 2 0" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <rect x="40" y="2" width="12" height="8" rx="2" fill="none" stroke="currentColor" strokeWidth="1.2" /><rect x="41.6" y="3.6" width="8" height="4.8" rx="1" fill="currentColor" /><rect x="52.6" y="4.6" width="1.4" height="2.8" rx=".6" fill="currentColor" />
      </svg>
    </div>
  )
}

/** Teléfono con acabado de producto: bisel, isla, barra de estado y barra de inicio. */
export function PhoneFrame({ children, time = '10:00', label, className = '' }: { children: ReactNode; time?: string; label?: string; className?: string }) {
  return (
    <figure className={`mk-phone ${className}`} aria-label={label}>
      <div className="mk-screen">
        <StatusBar time={time} />
        <div className="mk-content">{children}</div>
        <span className="mk-home" aria-hidden="true" />
      </div>
    </figure>
  )
}

const SCREEN: Record<IdentityKey, { title: string; items: [string, string, string][] }> = {
  cafe: { title: 'La merienda', items: [['RC-15', 'Café con leche', '$ 5.900'], ['RC-11', 'Medialuna de manteca', '$ 2.200'], ['RC-14', 'Budín de limón', '$ 4.800']] },
  resto: { title: 'Hoy en la pizarra', items: [['MC-13', 'Milanesa napolitana', '$ 20.200'], ['MC-06', 'Sorrentinos con fileto', '$ 16.500'], ['MC-22', 'Flan con dulce de leche', '$ 7.900']] },
  hela: { title: 'Elegí el formato', items: [['CO-02', 'Cucurucho · 2 gustos', '$ 5.400'], ['CO-03', 'Vasito · 2 gustos', '$ 5.200'], ['CO-05', 'Pote de ½ kg · 3 gustos', '$ 12.800']] },
  bar: { title: 'Lado A · para compartir', items: [['TC-01', 'Patatas bravas', '$ 7.900'], ['TC-02', 'Croquetas de jamón', '$ 8.400'], ['TC-10', 'Jarra de limonada (sin alcohol)', '$ 9.000']] },
  rapida: { title: 'Armá tu combo', items: [['BR-04', 'Doble con cheddar', '$ 11.900'], ['BR-06', 'Papas medianas', '$ 3.900'], ['BR-08', 'Gaseosa mediana', '$ 3.200']] },
}

/** Pantalla móvil de muestra de cada identidad, dentro del teléfono. */
export function PhoneScreen({ id }: { id: IdentityKey }) {
  const s = SCREEN[id]
  return (
    <PhoneFrame label={`${FAMILIES[id].name} en el teléfono (pantalla de muestra)`} className={`mk-p-${id}`}>
      <header className="mk-ph-head">
        <span className="mk-ph-brand">{FAMILIES[id].name}</span>
        <span className="mk-ph-demo">DEMO</span>
      </header>
      <p className="mk-ph-title">{s.title}</p>
      <ul className="mk-ph-list">
        {s.items.map(([k, n, p]) => (
          <li key={k}>{art(id, k, 48)}<span>{n}</span><b>{p}</b></li>
        ))}
      </ul>
      <div className="mk-ph-ticket"><Ticket id={id} /></div>
    </PhoneFrame>
  )
}
