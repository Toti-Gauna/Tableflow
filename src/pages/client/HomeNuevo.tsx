import type { ReactElement } from 'react'
import { Link } from 'react-router-dom'
import { PageHead } from '../../ui/Shell'
import { Glyph } from '../../ui/glyphs'
import { SeasonBand } from '../../ui/season'
import { Piece, pieceFor } from '../../ui/art/families'
import { DishArt } from '../../ui/art'
import { fmtMenu } from '../../ui/food'
import { windowsFor, locationOpenNow } from '../../domain/availability'
import { dateKeyOf, dayName, fmtDateShort, hhmm, minutesOfDay } from '../../domain/time'
import { GUSTOS, GUSTO_ART } from '../../domain/fixtures/nuevos'
import { BOARD_PICKS } from '../../domain/content'
import type { AppState, BusinessProfile } from '../../domain/types'
// Ilustraciones firma de L2b (aprobadas en el estudio de propuestas); sus estilos usan prefijos propios.
import { ConeArt } from '../propuestas/helado'
import { BassArt } from '../propuestas/bar'
import { ComboArt } from '../propuestas/rapida'
import { pickupBoard } from './Numeros'
import { Rhythm } from './Home'
import './l5.css'

/** NEG-CO-01 · Copo: la vitrina con el estado real de cada bacha (queda poco / volvemos pronto). */
function Vitrina({ state }: { state: AppState }) {
  return (
    <aside className="board vitrina fx-scene" aria-labelledby="vitrina">
      <p className="eyebrow">Hoy en la vitrina</p>
      <h2 id="vitrina">Gustos del día</h2>
      <ul>
        {GUSTOS.map(([opt, name, ing]) => {
          const i = state.ingredients.find((x) => x.id === ing)
          const st = i?.alertState ?? 'ok'
          const p = pieceFor(GUSTO_ART[opt])
          return (
            <li key={opt} data-state={st} data-testid={`gusto-${opt}`}>
              {p && <Piece size={44}><p.Comp /></Piece>}
              <span className="g-name">{name}</span>
              <span className="g-state">{st === 'agotado' ? 'Volvemos pronto' : st === 'bajo' ? 'Queda poco' : 'Hay'}</span>
            </li>
          )
        })}
      </ul>
      <p className="foot"><Link to="/copo/carta">Elegir formato y gustos</Link></p>
    </aside>
  )
}

/** NEG-TC-01 · Taberna Compás: próximas noches; se va reservando mesa, no comprando entradas. */
function Agenda({ state }: { state: AppState }) {
  const today = dateKeyOf(state.clock.nowMs)
  const evs = state.tastingEvents.filter((e) => e.businessId === 'compas' && e.status !== 'cancelada' && e.dateKey >= today).sort((a, b) => (a.dateKey + a.startMin).localeCompare(b.dateKey + b.startMin)).slice(0, 3)
  return (
    <aside className="board agenda-board fx-scene" aria-labelledby="agenda">
      <p className="eyebrow">Música en vivo</p>
      <h2 id="agenda">Esta semana</h2>
      <ol>
        {evs.map((e) => (
          <li key={e.id}>
            <span className="ag-when">{dayName(e.dateKey).slice(0, 3)} {Number(e.dateKey.slice(8))} · {hhmm(e.startMin)}</span>
            <span className="ag-what">{e.title}</span>
          </li>
        ))}
      </ol>
      <p className="foot"><Link to="/compas/catas">Ver la agenda</Link> · <Link to="/compas/reservar">Reservar mesa</Link></p>
    </aside>
  )
}

/** NEG-BR-01 · Brasa Rápida: los números del mostrador, lo mismo que ve la pantalla del local. */
function Tablero({ state }: { state: AppState }) {
  const { prep, ready } = pickupBoard(state, 'brasa')
  return (
    <aside className="board tablero fx-scene" aria-labelledby="tablero">
      <p className="eyebrow">Mostrador</p>
      <h2 id="tablero">Números de retiro</h2>
      <div className="tb-cols">
        <div><h3>Preparando</h3><p className="tb-nums">{prep.length ? prep.map((o) => <b key={o.id}>{o.pickupCode}</b>) : <span className="muted">—</span>}</p></div>
        <div className="ready"><h3>Listo</h3><p className="tb-nums">{ready.length ? ready.map((o) => <b key={o.id}>{o.pickupCode}</b>) : <span className="muted">—</span>}</p></div>
      </div>
      <p className="foot"><Link to="/brasa/numeros">Pantalla completa</Link></p>
    </aside>
  )
}

const COPY: Record<string, { eyebrow: string; heading: ReactElement; primary: [string, string]; secondary?: [string, string]; art: (label: string) => ReactElement; label: string }> = {
  copo: {
    eyebrow: 'Heladería artesanal', heading: <>La vitrina <em>es el menú.</em></>,
    primary: ['carta', 'Elegí tu helado'], secondary: ['pedido', 'Pedir para retirar'],
    art: (label) => <ConeArt label={label} compact />, label: 'Copo: cucurucho de tres bochas con baño de chocolate',
  },
  compas: {
    eyebrow: 'Tapas y jazz en vivo', heading: <>Lado A, <em>Lado B.</em></>,
    primary: ['carta', 'Ver la carta'], secondary: ['reservar', 'Reservar una mesa'],
    art: (label) => <BassArt label={label} />, label: 'Taberna Compás: contrabajo en dos tintas con trama de semitono',
  },
  brasa: {
    eyebrow: 'Comida rápida a la brasa', heading: <>Pedís, te llaman, <em>retirás.</em></>,
    primary: ['carta', 'Armá tu combo'], secondary: ['numeros', 'Números de retiro'],
    art: (label) => <ComboArt label={label} compact className="art" />, label: 'Brasa Rápida: combo con hamburguesa doble, papas y bebida',
  },
}

export function HomeNuevo({ state, biz, locationId }: { state: AppState; biz: BusinessProfile; locationId: string }) {
  const c = COPY[biz.id]
  const today = dateKeyOf(state.clock.nowMs)
  const nowMin = minutesOfDay(state.clock.nowMs)
  const wins = windowsFor(state, locationId, today).sort((a, b) => a.startMin - b.startMin)
  const open = locationOpenNow(state, locationId)
  const nextOpen = wins.find((w) => w.startMin > nowMin)
  const picks = (BOARD_PICKS[biz.id] ?? []).map((id) => state.menuItems.find((m) => m.id === id)).filter((m) => !!m)
  return (
    <main className={`home-nuevo hn-${biz.kind}`}>
      <section className="hero hero-v2">
        <div className="fx-scene hero-copy">
          <PageHead title={biz.name} eyebrow={c.eyebrow} heading={c.heading} />
          <p className="lead">{biz.story}</p>
          <div className="row" style={{ marginTop: 20 }}>
            <Link className="btn lg" to={`/${biz.id}/${c.primary[0]}`}>{c.primary[1]} <Glyph name="arrow" size={18} /></Link>
            {c.secondary && <Link className="btn lg secondary" to={`/${biz.id}/${c.secondary[0]}`}>{c.secondary[1]}</Link>}
          </div>
          <div style={{ marginTop: 16 }}>
            {biz.paysAtCounter ? (
              <p className="policy-note" data-testid="pay-at-counter">
                <Glyph name="receipt" size={16} /> <span>Pedís acá, retirás en el mostrador y <strong>pagás en el local</strong>. La app no cobra: tu pedido queda confirmado con el pago pendiente hasta la caja.</span>
              </p>
            ) : (
              <p className="policy-note">
                <Glyph name="calendar" size={16} /> <span>Reservás la mesa por solicitud; el local la confirma. Pedís y pagás en el salón. Las bebidas con alcohol son solo para mayores de 18.</span>
              </p>
            )}
          </div>
        </div>
        <div className="hero-figure">
          <div className="hn-art">{c.art(c.label)}</div>
          <div className="hero-board">
            {biz.id === 'copo' ? <Vitrina state={state} /> : biz.id === 'compas' ? <Agenda state={state} /> : <Tablero state={state} />}
          </div>
        </div>
      </section>

      <SeasonBand state={state} biz={biz.id} />

      <section className="day-strip" aria-labelledby="hoy">
        <div className="row between" style={{ alignItems: 'baseline' }}>
          <h2 id="hoy">Hoy, {fmtDateShort(today)}</h2>
          <p className="small" style={{ margin: 0 }}>
            <span className={`state-dot ${open ? 'on' : ''}`} aria-hidden="true" />
            {open ? 'Abierto ahora' : nextOpen ? `Cerrado · abre a las ${hhmm(nextOpen.startMin)}` : 'Cerrado por hoy'} <span className="muted">(reloj simulado {hhmm(nowMin)})</span>
          </p>
        </div>
        {wins.length ? <Rhythm wins={wins} nowMin={nowMin} /> : <p className="muted">Hoy no hay servicio.</p>}
      </section>

      {picks.length > 0 && (
        <section className="home-sec" aria-labelledby="destacados">
          <p className="eyebrow">De la carta</p>
          <h2 id="destacados">{biz.id === 'copo' ? 'Formatos' : biz.id === 'compas' ? 'Para empezar la noche' : 'Los más pedidos'}</h2>
          <ul className="hn-picks">
            {picks.map((m) => (
              <li key={m.id}>
                <Link to={`/${biz.id}/carta/${m.id}`} className="hn-pick">
                  <DishArt item={m} size={88} decorative />
                  <strong>{m.name}</strong>
                  <span className="small muted">{fmtMenu(m.priceCents)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="home-sec family-note" aria-labelledby="familia">
        <h2 id="familia">Zona familiar</h2>
        <p>Un juego opcional para chicos, sin tiempo, sin datos y sin compras. No hace falta para pedir. <Link to={`/${biz.id}/chicos`}>Ir a la zona familiar</Link></p>
      </section>
    </main>
  )
}
