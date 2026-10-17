import { lazy, Suspense } from 'react'
import { Link } from 'react-router-dom'
import { RouteLoader } from '../../ui/Loader'
import { useBiz } from '../../ui/hooks'
import { PageHead } from '../../ui/Shell'
import { act } from '../../ui/kit'
import { Glyph, Plate } from '../../ui/glyphs'
import { fmtMenu } from '../../ui/food'
import { windowsFor, locationOpenNow } from '../../domain/availability'
import { itemUnavailable } from '../../domain/menu'
import { pickupCount } from '../../domain/pickup'
import { dateKeyOf, fmtDateShort, hhmm, minutesOfDay } from '../../domain/time'
import { eventSeats } from '../../domain/cmd-engage'
import { BOARD_PICKS, ORIGINS } from '../../domain/content'
import { SeasonBand } from '../../ui/season'
import { BodegonArt } from '../../ui/art/scenes/bodegon'
import { SalonArt } from '../../ui/art/scenes/salon'
import type { AppState, BusinessProfile, ServiceWindow } from '../../domain/types'

// P5-L5: los negocios nuevos tienen su propio inicio (y sus ilustraciones firma), en un chunk aparte.
const HomeNuevo = lazy(() => import('./HomeNuevo').then((m) => ({ default: m.HomeNuevo })))
const LEGACY = new Set(['mesa-clara', 'ritual-cafe'])

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
const DAY_FROM = 8 * 60
const DAY_TO = 24 * 60
const pct = (m: number) => `${((Math.min(DAY_TO, Math.max(DAY_FROM, m)) - DAY_FROM) / (DAY_TO - DAY_FROM)) * 100}%`

/** Línea del día con las franjas de servicio y la hora simulada. */
export function Rhythm({ wins, nowMin }: { wins: ServiceWindow[]; nowMin: number }) {
  return (
    <div>
      <div className="rhythm" role="img" aria-label={`Servicio de hoy: ${wins.map((w) => `${w.label} de ${hhmm(w.startMin)} a ${hhmm(w.endMin)}`).join('; ')}. Hora simulada ${hhmm(nowMin)}.`}>
        {wins.map((w) => (
          <span key={w.id} className="band" style={{ left: pct(w.startMin), width: `calc(${pct(w.endMin)} - ${pct(w.startMin)})` }}>
            {w.label === 'Día completo' ? 'Barra' : w.label}
          </span>
        ))}
        <span className="now" style={{ left: pct(nowMin) }} data-label={`Ahora ${hhmm(nowMin)}`} />
      </div>
      <div className="ticks" aria-hidden="true">
        {[8, 12, 16, 20, 24].map((h) => <span key={h}>{String(h % 24).padStart(2, '0')}:00</span>)}
      </div>
    </div>
  )
}

/** Mesa Clara: pizarra del día con la selección editorial y su estado real. */
function DayBoard({ state, biz, locationId }: { state: AppState; biz: BusinessProfile; locationId: string }) {
  const items = BOARD_PICKS[biz.id].map((id) => state.menuItems.find((m) => m.id === id)).filter((m) => !!m)
  return (
    <aside className="board fx-scene" aria-labelledby="pizarra">
      <p className="eyebrow">Hoy en el salón</p>
      <h2 id="pizarra">Pizarra del día</h2>
      <ul>
        {items.map((i) => {
          const un = itemUnavailable(state, i, locationId)
          return (
            <li key={i.id}>
              <Plate item={i} size={40} decorative />
              <Link to={`/${biz.id}/carta/${i.id}`} className="pick">{i.name}</Link>
              <span className="leader" aria-hidden="true" />
              <span className="price">{un ? <span className="off">{un === 'fuera-de-franja' ? 'fuera de franja' : 'agotado'}</span> : fmtMenu(i.priceCents)}</span>
            </li>
          )
        })}
      </ul>
      <p className="foot"><Link to={`/${biz.id}/carta`}>Carta completa</Link></p>
    </aside>
  )
}

/** Ritual Café: ocupación de retiros por franja de 15 min, desde la hora simulada. */
function BarRhythm({ state, biz, locationId }: { state: AppState; biz: BusinessProfile; locationId: string }) {
  const today = dateKeyOf(state.clock.nowMs)
  const nowMin = minutesOfDay(state.clock.nowMs)
  const cap = biz.pickupPerSlot
  const w = windowsFor(state, locationId, today)[0]
  const start = Math.max(w?.startMin ?? DAY_FROM, Math.floor(nowMin / 15) * 15)
  const slots = w ? Array.from({ length: 8 }, (_, i) => start + i * 15).filter((m) => m + 15 <= w.endMin) : []
  return (
    <aside className="board fx-scene" aria-labelledby="ritmo">
      <p className="eyebrow">Retiro por franja · cupo {cap} por franja</p>
      <h2 id="ritmo">Ritmo de la barra</h2>
      {slots.length === 0 ? (
        <p>La barra ya cerró en el día simulado. Mañana abre a las {w ? hhmm(w.startMin) : '08:00'}.</p>
      ) : (
        <>
          <div className="slot-meter" aria-hidden="true">
            {slots.map((m) => {
              const n = pickupCount(state, locationId, today, m)
              return (
                <div className="col" key={m}>
                  <div className="bar-v" style={{ height: '100%' }}>
                    <span style={{ height: `${Math.min(100, (n / cap) * 100)}%` }} />
                  </div>
                  <span className="lbl">{hhmm(m)}</span>
                </div>
              )
            })}
          </div>
          <ul className="sr-only">
            {slots.map((m) => <li key={m}>{hhmm(m)}: {pickupCount(state, locationId, today, m)} de {cap} retiros</li>)}
          </ul>
        </>
      )}
      <p className="foot"><Link to={`/${biz.id}/pedido`}>Pedir para retirar</Link></p>
    </aside>
  )
}

export function Home() {
  const { state, biz, locationId } = useBiz()
  if (!LEGACY.has(biz.id)) return <Suspense fallback={<RouteLoader />}><HomeNuevo state={state} biz={biz} locationId={locationId} /></Suspense>
  const today = dateKeyOf(state.clock.nowMs)
  const wins = windowsFor(state, locationId, today).sort((a, b) => a.startMin - b.startMin)
  const open = locationOpenNow(state, locationId)
  const events = state.tastingEvents.filter((e) => e.businessId === biz.id && e.status === 'abierta')
  const isRest = biz.kind === 'bodegon'
  const nowMin = minutesOfDay(state.clock.nowMs)
  const nextOpen = wins.find((w) => w.startMin > nowMin)
  const methods = state.menuItems.filter((m) => m.businessId === biz.id && m.category === 'Métodos')
  return (
    <main>
      <section className="hero hero-v2">
        <div className="fx-scene hero-copy">
          <PageHead
            title={biz.name}
            eyebrow={isRest ? 'Bodegón contemporáneo' : 'Café de especialidad · barra y vitrina'}
            heading={isRest ? <>Comida de casa, <em>mesa larga.</em></> : <>Café de origen, <em>mañanas lentas.</em></>}
          />
          <p className="lead">{biz.story}</p>
          <div className="row" style={{ marginTop: 20 }}>
            <Link className="btn lg" to={`/${biz.id}/carta`}>Ver la carta <Glyph name="arrow" size={18} /></Link>
            {biz.reservationsEnabled ? (
              <Link className="btn lg accent" to={`/${biz.id}/reservar`}>Reservar una mesa</Link>
            ) : (
              <Link className="btn lg secondary" to={`/${biz.id}/explorar`}>Explorar sabores</Link>
            )}
          </div>
          {!biz.reservationsEnabled && (
            <div style={{ marginTop: 16 }}>
              <p className="policy-note">
                <Glyph name="clock" size={16} /> En este perfil atendemos por orden de llegada: no tomamos reservas. Podés {biz.kind === 'cafe' ? 'pedir para retirar por franja' : 'pedir en tu mesa'}.
              </p>
            </div>
          )}
        </div>
        <div className="hero-figure">
          {isRest ? <BodegonArt className="art scene" label="Mesa Clara: pingüino de vino, sifón, panera y milanesa napolitana sobre el mantel a cuadros" /> : <SalonArt className="art scene" label="Ritual Café: el salón bajo el vitral, con café con leche y medialunas en la bandeja" />}
          <div className="hero-board">
            {isRest ? <DayBoard state={state} biz={biz} locationId={locationId} /> : <BarRhythm state={state} biz={biz} locationId={locationId} />}
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
        {!open && isRest && nextOpen && (
          <button className="btn secondary small" style={{ marginTop: 12 }} type="button" onClick={() => act({ type: 'clock/jump', minutes: nextOpen.startMin }, `Reloj en ${hhmm(nextOpen.startMin)}`)}>
            <Glyph name="clock" size={16} /> Ir a las {hhmm(nextOpen.startMin)}
          </button>
        )}
      </section>

      {!isRest && (
        <>
          <section aria-labelledby="metodos" className="home-sec">
            <p className="eyebrow">En la barra</p>
            <h2 id="metodos">Métodos de la casa</h2>
            <div className="methods">
              {methods.map((m) => (
                <Link key={m.id} to={`/${biz.id}/carta/${m.id}`} className="method">
                  <Plate item={m} size={76} decorative />
                  <span>
                    <strong>{m.name}</strong>
                    <span className="muted small">{m.description}</span>
                    <span className="small"> · desde {fmtMenu(m.priceCents)}</span>
                  </span>
                </Link>
              ))}
            </div>
          </section>
          <section aria-labelledby="origenes" className="home-sec">
            <p className="eyebrow">Notas de cata</p>
            <h2 id="origenes">Orígenes de la semana</h2>
            <ol className="origins">
              {ORIGINS.map((o, i) => (
                <li key={o.optionId}>
                  <span className="num" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                  <span>
                    <strong>{o.name}</strong>
                    <span className="muted">{o.notes} · {o.process}</span>
                  </span>
                </li>
              ))}
            </ol>
          </section>
        </>
      )}

      <section className="home-sec events" aria-labelledby="catas">
        <div className="sec-head">
          <p className="eyebrow">Con cupo y lista de espera</p>
          <h2 id="catas">Próximas catas</h2>
        </div>
        {events.length === 0 ? (
          <p className="muted">No hay catas programadas.</p>
        ) : (
          <ul className="event-list">
            {events.map((e) => {
              const { free } = eventSeats(state, e)
              const [, m, d] = e.dateKey.split('-')
              return (
                <li key={e.id}>
                  <Link to={`/${biz.id}/catas`} className="event-card">
                    <span className="ev-date" aria-hidden="true"><b>{Number(d)}</b><span>{MONTHS[Number(m) - 1]}</span></span>
                    <span className="ev-main">
                      <strong>{e.title}</strong>
                      <span className="muted small">{fmtDateShort(e.dateKey)} · {hhmm(e.startMin)} · {free > 0 ? `${free} lugar${free === 1 ? '' : 'es'} libre${free === 1 ? '' : 's'}` : 'cupo completo: lista de espera'}</span>
                    </span>
                    <span className="ev-cta">Ver <Glyph name="arrow" size={16} /></span>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </main>
  )
}
