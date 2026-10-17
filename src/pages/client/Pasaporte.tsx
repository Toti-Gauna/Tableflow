import { Link } from 'react-router-dom'
import { useBiz } from '../../ui/hooks'
import { PageHead } from '../../ui/Shell'
import { act, Badge, Callout } from '../../ui/kit'
import { Glyph } from '../../ui/glyphs'
import { BADGE_LABEL, PassportSteps, SavedPick } from '../../ui/passport'
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
      <PageHead title="Mi pasaporte" eyebrow={customer ? `Pasaporte de ${customer.alias} · ficticio` : 'Pasaporte de invitado'} sub="Exploración de sabores + sellos de visita (de muestra, sin premios reales)" />
      {biz.passportPaused && <Callout tone="warn" role="alert">El encargado pausó la mecánica: no se suman tarjetas ni sellos por ahora. Lo que ya tenés se conserva.</Callout>}
      <div className="passport-grid">
        <section className="card" aria-labelledby="expl">
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
          {pass && <p className="small muted">Métricas locales de esta demo: no se cuentan como ventas ni se envían a ningún lado.</p>}
        </section>
        <section className="card" aria-labelledby="sellos">
          <p className="eyebrow">Fidelidad</p>
          <h2 id="sellos">Sellos de visita</h2>
          {customer ? (
            <>
              <p><strong data-testid="stamps">{stamps}</strong> de {STAMPS_FOR_BADGE} sellos {stamps >= STAMPS_FOR_BADGE && <Badge tone="ok" icon="★" label="Insignia de fidelidad" />}</p>
              <ol className="stamps" aria-label={`${stamps} de ${STAMPS_FOR_BADGE} sellos obtenidos`}>
                {Array.from({ length: STAMPS_FOR_BADGE }, (_, i) => (
                  <li key={i} className={`stamp ${i < stamps ? 'on' : ''}`}>
                    {i < stamps ? <Glyph name="stamp" size={30} /> : <span aria-hidden="true">{i + 1}</span>}
                    <span className="sr-only">{i < stamps ? `Sello ${i + 1} obtenido` : `Sello ${i + 1} pendiente`}</span>
                  </li>
                ))}
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
            <Callout>
              Los sellos se asocian a una persona. <button className="linklike" type="button" onClick={() => act({ type: 'session/setRole', role: 'cliente-recurrente' }, 'Ahora sos Ana (cliente recurrente)')}>Verme como Ana (cliente recurrente)</button> para ver un pasaporte con visitas.
            </Callout>
          )}
          <h3 style={{ marginTop: 16 }}>Reglas visibles</h3>
          <ul className="small rules">
            <li>Un sello por persona y fecha en todo el negocio, acreditado por el personal (no por consumo ni por gasto). Desde la vista cliente no se pueden sumar.</li>
            <li>La insignia llega a la quinta visita. No hay premios reales: la configuración de premios está deshabilitada hasta que el negocio la apruebe.</li>
            <li>Un sello acreditado por error se revierte con motivo y queda en el historial.</li>
            <li>La demo no es antifraude: alguien podría editar su navegador.</li>
          </ul>
        </section>
      </div>
    </main>
  )
}
