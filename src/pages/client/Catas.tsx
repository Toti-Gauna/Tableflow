import { useState } from 'react'
import { useBiz, useOperation } from '../../ui/hooks'
import { PageHead } from '../../ui/Shell'
import { act, Badge, Callout, ErrorText } from '../../ui/kit'
import { eventSeats } from '../../domain/cmd-engage'
import { dayName, fmtDateShort, hhmm } from '../../domain/time'
import { Glyph } from '../../ui/glyphs'
import { Link } from 'react-router-dom'
import type { BusinessProfile, TastingEvent } from '../../domain/types'

/** P5-L5 · Taberna Compás: la agenda de música no vende entradas ni toma inscripciones; se reserva la mesa. */
function Agenda({ biz, events }: { biz: BusinessProfile; events: TastingEvent[] }) {
  return (
    <main className="agenda">
      <PageHead title="Agenda de la semana" eyebrow="Música en vivo · con la mesa reservada" sub="Sin venta de entradas: la música viene con la mesa" />
      <Callout>Noches de muestra. Para ir, reservá una mesa para esa noche; la reserva es una solicitud que confirma el local. Las bebidas con alcohol son solo para mayores de 18.</Callout>
      <ol className="agenda-list">
        {events.map((e, i) => (
          <li key={e.id} data-testid={`agenda-${e.id}`}>
            <span className="ag-side" aria-hidden="true">Lado {i % 2 ? 'B' : 'A'} · {String(i + 1).padStart(2, '0')}</span>
            <div>
              <h2>{e.title}</h2>
              <p className="small muted" style={{ margin: '0 0 6px' }}><Glyph name="calendar" size={14} /> {dayName(e.dateKey)} {fmtDateShort(e.dateKey)} · {hhmm(e.startMin)}</p>
              <p>{e.description}</p>
              <Link className="btn" to={`/${biz.id}/reservar`}>Reservar mesa para esa noche</Link>
            </div>
          </li>
        ))}
      </ol>
      {events.length === 0 && <p className="muted">No hay noches programadas.</p>}
    </main>
  )
}

export function Catas() {
  const { state, biz } = useBiz()
  if (biz.kind === 'bar') return <Agenda key={biz.id} biz={biz} events={state.tastingEvents.filter((e) => e.businessId === biz.id && e.status !== 'cancelada')} />
  return <Inscripciones key={biz.id} />
}

function Inscripciones() {
  const { state, biz } = useBiz()
  const events = state.tastingEvents.filter((e) => e.businessId === biz.id)
  const customerId = state.session.customerByBusiness[biz.id] ?? null
  const customer = state.customers.find((c) => c.id === customerId)
  const [alias, setAlias] = useState('')
  const [err, setErr] = useState<Record<string, string>>({})
  const getOp = useOperation(`${biz.id}|${alias}|${customerId}`)
  return (
    <main>
      <PageHead title="Catas y encuentros" eyebrow="Agenda de muestra" sub="Cupos limitados con lista de espera · sin venta de entradas real" />
      <Callout>Actividades de muestra. No hay cobro: inscribirse solo reserva un lugar local. Solo mayores de 18 en catas con alcohol.</Callout>
      {!customer && (
        <div className="field" style={{ maxWidth: 360, marginTop: 10 }}>
          <label htmlFor="alias">Tu nombre (alias de muestra)</label>
          <input id="alias" type="text" value={alias} onChange={(e) => setAlias(e.target.value)} />
        </div>
      )}
      <div className="events" style={{ marginTop: 16 }}>
        {events.length === 0 && <p className="muted">No hay catas programadas.</p>}
        {events.map((e) => {
          const { free, held } = eventSeats(state, e)
          const mine = state.eventBookings.find((b) => b.eventId === e.id && b.customerId === customerId && ['inscripto', 'espera', 'oferta'].includes(b.status))
          const waiting = state.eventBookings.filter((b) => b.eventId === e.id && b.status === 'espera').length
          const enroll = (joinWaitlist: boolean) => {
            const o = act({ type: 'event/enroll', eventId: e.id, alias: alias.trim() || undefined, operationId: getOp(), joinWaitlist })
            setErr((x) => ({ ...x, [e.id]: o.ok ? '' : o.message }))
          }
          return (
            <section key={e.id} className="event" aria-labelledby={`e-${e.id}`} data-testid={`event-${e.id}`}>
              <div className="ev-date" aria-hidden="true">
                <span className="d">{dayName(e.dateKey).slice(0, 3)}</span>
                <span className="n">{Number(e.dateKey.slice(8))}</span>
                <span className="t">{hhmm(e.startMin)}</span>
              </div>
              <div className="ev-body">
              <h2 id={`e-${e.id}`}>{e.title}</h2>
              <p className="small muted" style={{ margin: '0 0 8px' }}><Glyph name="calendar" size={14} /> {fmtDateShort(e.dateKey)} · {hhmm(e.startMin)} · {e.priceNote}</p>
              <p>{e.description}</p>
              <div className="seats">
                <div className="bar" aria-hidden="true"><span style={{ width: `${Math.min(100, (held / e.capacity) * 100)}%` }} /></div>
                <p style={{ margin: '6px 0 12px' }}>
                  <Badge tone={free > 0 ? 'ok' : 'warn'} label={free > 0 ? `${free} lugar(es) libre(s) de ${e.capacity}` : `Cupo completo (${held}/${e.capacity})`} />{' '}
                  {waiting > 0 && <span className="muted small">{waiting} en lista de espera</span>}
                </p>
              </div>
              {mine ? (
                <div className="stack tight">
                  <p className="ok-text" role="status">{mine.status === 'inscripto' ? '✓ Estás inscripto.' : mine.status === 'espera' ? 'Estás en la lista de espera.' : 'Se liberó un lugar para vos. Aceptalo para confirmarlo.'}</p>
                  <div className="row">
                    {mine.status === 'oferta' && <button className="btn" type="button" onClick={() => act({ type: 'event/acceptOffer', bookingId: mine.id }, 'Lugar confirmado')}>Aceptar el lugar</button>}
                    <button className="btn danger" type="button" onClick={() => act({ type: 'event/cancel', bookingId: mine.id }, 'Inscripción cancelada; el lugar se liberó una vez')}>Cancelar mi inscripción</button>
                  </div>
                </div>
              ) : (
                <div className="row">
                  <button className="btn" type="button" onClick={() => enroll(false)} disabled={free <= 0} data-testid={`enroll-${e.id}`}>Inscribirme</button>
                  {free <= 0 && <button className="btn secondary" type="button" onClick={() => enroll(true)} data-testid={`wait-${e.id}`}>Anotarme en la lista de espera</button>}
                </div>
              )}
              <ErrorText>{err[e.id]}</ErrorText>
              </div>
            </section>
          )
        })}
      </div>
    </main>
  )
}
