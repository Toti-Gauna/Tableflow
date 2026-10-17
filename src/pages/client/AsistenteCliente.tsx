import { Link } from 'react-router-dom'
import { useBiz } from '../../ui/hooks'
import { getSnapshot } from '../../store'
import { PageHead } from '../../ui/Shell'
import { ChatPane } from '../../ui/ChatPane'
import { clientAssistant, CLIENT_SUGGEST, type ClientReply } from '../../domain/assistant-client'
import '../admin/growth.css'

/** GR-F · Asistente del cliente: carta, horarios, sus pedidos y sus beneficios. Nunca datos de otras personas. */
export function AsistenteCliente() {
  const { biz, locationId } = useBiz()
  return (
    <main>
      <PageHead title="Asistente" eyebrow={biz.name} sub="Preguntas sobre la carta, horarios, tus pedidos y tus beneficios" />
      <ChatPane<ClientReply>
        key={biz.id}
        testid="client-assist"
        title={`Asistente de ${biz.name}`}
        note="Asistente simulado con reglas fijas sobre los datos de la demo. No usa IA, no ve datos de otras personas y no envía nada."
        intro={<p>Hola. Te ayudo con la carta, los horarios, tus pedidos y tus beneficios.</p>}
        suggestions={CLIENT_SUGGEST.filter((q) => biz.id === 'copo' || !/gustos/i.test(q))}
        ask={(t) => { const s = getSnapshot().state; return clientAssistant(s, biz.id, t, s.session.customerByBusiness[biz.id], locationId) }}
        render={(r) => (
          <div>
            <p>{r.text}</p>
            {r.items && <ul className="cp-list">{r.items.map((i) => <li key={i.id}><span>{i.name}</span><span className="muted">{i.detail}</span></li>)}</ul>}
            {r.link && <p style={{ marginTop: 6 }}><Link to={r.link.to}>{r.link.label}</Link></p>}
          </div>
        )}
      />
    </main>
  )
}
