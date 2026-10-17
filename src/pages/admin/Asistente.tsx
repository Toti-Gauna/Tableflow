import { useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp, getSnapshot } from '../../store'
import { PageHead } from '../../ui/Shell'
import { ChatPane } from '../../ui/ChatPane'
import { act } from '../../ui/kit'
import { bizAssistant, BIZ_ASSIST_START, type AssistReply, type BizAssistState } from '../../domain/assistant-biz'

/** Respuesta del asistente: texto, datos, faltantes (ND), supuestos y acciones. */
export function AssistReplyView({ r, send, onDraft }: { r: AssistReply; send: (t: string) => void; onDraft: (d: Extract<NonNullable<AssistReply['actions']>[number], { kind: 'crear-borrador' }>) => void }) {
  return (
    <div>
      <p>{r.text}</p>
      {r.facts && r.facts.length > 0 && <dl className="cp-facts">{r.facts.map(([k, v]) => <div key={k} style={{ display: 'contents' }}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>}
      {r.missing && r.missing.length > 0 && <div className="cp-missing"><strong>Falta (ND):</strong><ul>{r.missing.map((m) => <li key={m}>{m}</li>)}</ul></div>}
      {r.ask && r.ask.length > 1 && <div className="cp-assume"><strong>Me falta saber:</strong><ul>{r.ask.map((m) => <li key={m}>{m}</li>)}</ul></div>}
      {r.assumptions && r.assumptions.length > 0 && <div className="cp-assume"><strong>Supuestos:</strong><ul>{r.assumptions.map((a) => <li key={a}>{a}</li>)}</ul></div>}
      {r.actions && (
        <div className="cp-actions">
          {r.actions.map((a) => a.kind === 'sugerencia'
            ? <button key={a.label} type="button" className="chip" onClick={() => send(a.label)}>{a.label}</button>
            : a.kind === 'ir'
              ? <Link key={a.label} className="btn secondary small" to={a.to}>{a.label}</Link>
              : <button key={a.label} type="button" className="btn small" onClick={() => onDraft(a)} data-testid="assist-create-draft">{a.label}</button>)}
        </div>
      )}
    </div>
  )
}

/** GR-E · Asistente del comercio: reglas fijas sobre los datos de la demo. Crea borradores; aprobar lo decide el encargado. */
export function AdminAsistente() {
  const state = useApp()
  const nav = useNavigate()
  const biz = state.businesses.find((b) => b.id === state.session.businessId)!
  const conv = useRef<BizAssistState>(BIZ_ASSIST_START)
  return (
    <>
      <PageHead title="Asistente" sub={`${biz.name} · consultas sobre los datos de la demo y borradores de campaña`} />
      <ChatPane<AssistReply>
        key={biz.id}
        testid="biz-assist"
        title="Asistente del comercio"
        note="Asistente simulado: reglas fijas que consultan los datos de esta demo y calculan con las fórmulas del manual. No usa IA ni envía nada."
        intro={<p>Hola. Te respondo con los datos del negocio y, si falta algo, te lo pido. Puedo preparar el borrador de una campaña; salir lo aprueba el encargado.</p>}
        suggestions={['¿Cuánto vendimos hoy?', '¿Qué platos dejan más contribución?', '¿Qué costos faltan cargar?', 'Armá una campaña para clientes a reactivar', 'Calculá el equilibrio de una promo']}
        ask={(t) => {
          // se consulta el estado vigente en el momento de la pregunta
          const r = bizAssistant(getSnapshot().state, biz.id, t, conv.current)
          conv.current = r.state
          return r.replies
        }}
        render={(r, send) => (
          <AssistReplyView r={r} send={send} onDraft={(a) => {
            const op = (act({ type: 'op/alloc' }).data as { operationId: string }).operationId
            const o = act({ type: 'campaign/save', businessId: biz.id, draft: a.draft, operationId: op, createdBy: 'asistente' }, 'Borrador guardado: necesita aprobación')
            if (o.ok) nav(`/admin/campanas/${(o.data as { campaignId: string }).campaignId}`)
          }} />
        )}
      />
    </>
  )
}
