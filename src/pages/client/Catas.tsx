import { useState } from 'react'
import { useBiz, useOperation } from '../../ui/hooks'
import { PageHead } from '../../ui/Shell'
import { act, Badge, Callout, ErrorText } from '../../ui/kit'
import { eventSeats } from '../../domain/cmd-engage'
import { dayName, fmtDateShort, hhmm } from '../../domain/time'
import { Glyph } from '../../ui/glyphs'

export function Catas() {
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
