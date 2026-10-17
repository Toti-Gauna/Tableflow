import { Link } from 'react-router-dom'
import { useBiz } from '../../ui/hooks'
import { PageHead } from '../../ui/Shell'
import { act, Badge, Callout, DemoHint } from '../../ui/kit'
import { BADGE_LABEL, PassportSteps, SavedPick, StampSeal } from '../../ui/passport'
import { getPassport, stampsOf } from '../../domain/cmd-engage'
import { STAMPS_FOR_BADGE } from '../../domain/content'
import { fmtDateShort } from '../../domain/time'

export function Pasaporte() {
  const { state, biz, locationId } = useBiz()
  const customerId = state.session.customerByBusiness[biz.id] ?? null
  const customer = state.customers.find((c) => c.id === customerId)
  const pass = getPassport(state, biz.id, customerId)
  const visits = customer ? state.visits.filter((v) => v.customerId === customer.id).sort((a, b) => a.dateKey.localeCompare(b.dateKey)) : []
  const stamps = customer ? stampsOf(state, customer.id) : 0
  const done = pass ? Object.values(pass.cards).filter((c) => c.done).length : 0
  return (
    <main>
      <PageHead title="Mi pasaporte" eyebrow={customer ? `Pasaporte de ${customer.alias}` : 'Pasaporte de invitado'} sub="Descubrí sabores en tres tarjetas y sumá sellos con cada visita." />
      {biz.passportPaused && <Callout tone="warn" role="alert">El encargado pausó la mecánica: no se suman tarjetas ni sellos por ahora. Lo que ya tenés se conserva.</Callout>}
      <div className="passport-book">
        <section className="pp-page" aria-labelledby="expl">
          <p className="eyebrow">Exploración</p>
          <h2 id="expl">Pasaporte de sabores</h2>
          <PassportSteps pass={pass} />
          <p><strong>{done} de 3</strong> tarjetas · <Badge tone={pass?.badge === 'guardada' ? 'ok' : 'neutral'} label={BADGE_LABEL[pass?.badge ?? 'sin-empezar']} /></p>
          <SavedPick state={state} biz={biz.id} locationId={locationId} compact />
          {pass?.badge !== 'guardada' && <p className="muted">Todavía no guardaste una selección.</p>}
          <Link className="btn" to={`/${biz.id}/explorar`}>{done === 0 ? 'Empezar a explorar' : 'Seguir explorando'}</Link>
          {pass && (
            <dl className="metrics" aria-label="Métricas locales del pasaporte (no son ventas)">
              <div><dt>Inicio</dt><dd>{pass.metrics.started}</dd></div>
              <div><dt>Completado</dt><dd>{pass.metrics.completed}</dd></div>
              <div><dt>Guardado</dt><dd>{pass.metrics.saved}</dd></div>
              <div><dt>Uso en el pedido</dt><dd>{pass.metrics.usedInCart}</dd></div>
            </dl>
          )}

        </section>
        <section className="pp-page" aria-labelledby="sellos">
          <p className="eyebrow">Fidelidad</p>
          <h2 id="sellos">Sellos de visita</h2>
          {customer ? (
            <>
              <p><strong data-testid="stamps">{stamps}</strong> de {STAMPS_FOR_BADGE} sellos {stamps >= STAMPS_FOR_BADGE && <Badge tone="ok" icon="★" label="Insignia de fidelidad" />}</p>
              <ol className="stamps" aria-label={`${stamps} de ${STAMPS_FOR_BADGE} sellos obtenidos`}>
                {Array.from({ length: STAMPS_FOR_BADGE }, (_, i) => {
                  const v = visits.filter((x) => x.status === 'acreditada')[i]
                  return (
                    <li key={i} className={`stamp-slot ${i < stamps ? 'on' : ''}`}>
                      <StampSeal n={i + 1} on={i < stamps} bizName={biz.name} date={v ? v.dateKey.slice(8, 10) + '/' + v.dateKey.slice(5, 7) : undefined} />
                      <span className="sr-only">{i < stamps ? `Sello ${i + 1} obtenido` : `Sello ${i + 1} pendiente`}</span>
                    </li>
                  )
                })}
              </ol>
              {stamps >= STAMPS_FOR_BADGE ? (
                <p className="ok-text">Llegaste a la quinta visita: insignia de fidelidad. No incluye premio ni descuento.</p>
              ) : (
                <p className="muted small">Te faltan {STAMPS_FOR_BADGE - stamps} para la insignia (quinta visita).</p>
              )}
              <ul className="visit-list">
                {visits.map((v) => (
                  <li key={v.id} data-status={v.status}>
                    <time>{fmtDateShort(v.dateKey)}</time>
                    <span>{v.status === 'acreditada' ? 'Acreditada por el personal' : `Revertida: ${v.reversalReason}`}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <>
              <p className="muted">Los sellos son personales: los acredita el equipo en cada visita.</p>
              <DemoHint>
                <button className="linklike" type="button" onClick={() => act({ type: 'session/setRole', role: 'cliente-recurrente' }, 'Ahora sos Ana (cliente recurrente)')}>Verme como Ana (cliente recurrente)</button> para ver un pasaporte con visitas.
              </DemoHint>
            </>
          )}
          <details className="how">
          <summary>Cómo funcionan los sellos</summary>
          <ul className="small rules">
            <li>Un sello por persona y fecha en todo el negocio, acreditado por el personal (no por consumo ni por gasto). Desde la vista cliente no se pueden sumar.</li>
            <li>La insignia llega a la quinta visita. No hay premios reales: la configuración de premios está deshabilitada hasta que el negocio la apruebe.</li>
            <li>Un sello acreditado por error se revierte con motivo y queda en el historial.</li>
          </ul>
          </details>
        </section>
      </div>
    </main>
  )
}
