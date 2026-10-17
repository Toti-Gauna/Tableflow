import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { setPrefs, useApp, useSnapshot } from '../../store'
import { sfx } from '../../ui/sfx'
import { PageHead } from '../../ui/Shell'
import { act, Callout, Empty, ReasonDialog } from '../../ui/kit'
import { Glyph } from '../../ui/glyphs'
import { ORDER_LABEL } from '../../ui/format'
import { atLocal, hhmm } from '../../domain/time'
import type { Order } from '../../domain/types'

type Station = 'todas' | 'cocina' | 'barra'
const COLS: { status: Order['status']; title: string }[] = [
  { status: 'enviado', title: 'Nuevos' },
  { status: 'aceptado', title: 'Aceptados' },
  { status: 'en_preparacion', title: 'Preparando' },
  { status: 'listo', title: 'Listos' },
]
/** Umbral de demora de muestra (minutos desde que empezó la preparación). */
const LATE_MIN = 10

export function AdminCocina() {
  const state = useApp()
  const bizId = state.session.businessId
  const [station, setStation] = useState<Station>('todas')
  const [inc, setInc] = useState<Order | null>(null)
  const [msg, setMsg] = useState<{ tone: 'ok' | 'err'; text: string } | null>(null)
  const orders = state.orders.filter((o) => o.businessId === bizId && COLS.some((c) => c.status === o.status))
  const say = (r: ReturnType<typeof act>) => setMsg(r.ok ? null : { tone: 'err', text: r.message })
  // aviso sonoro opcional: suena solo cuando aparece una comanda nueva mientras la pantalla está abierta
  const { prefs } = useSnapshot()
  const fresh = orders.filter((o) => o.status === 'enviado').map((o) => o.id).join(',')
  const seen = useRef(fresh)
  useEffect(() => {
    const before = new Set(seen.current.split(',').filter(Boolean))
    const added = fresh.split(',').filter((id) => id && !before.has(id))
    if (added.length && prefs.kdsChime) sfx('chime', { force: true })
    seen.current = fresh
  }, [fresh, prefs.kdsChime])
  const mins = (o: Order) => {
    const t = state.tickets.find((k) => k.id === o.ticketId)
    return t?.startedAt ? Math.max(0, Math.round((state.clock.nowMs - t.startedAt) / 60000)) : null
  }
  const where = (o: Order) =>
    o.kind === 'mesa'
      ? `Mesa ${state.tableSessions.find((s) => s.id === o.sessionId)?.tableIds.map((x) => state.tables.find((y) => y.id === x)?.label).join('+')}`
      : `Retiro ${o.pickup ? hhmm(o.pickup.startMin) : ''}`
  return (
    <>
      <PageHead title="Cocina / barra" sub="Cola por estación · temporizador con el reloj simulado de la demo" />
      {msg && <Callout tone="err" role="alert">{msg.text}</Callout>}
      <div className="kds-board">
        <div className="kds-bar">
          <div className="seg" role="group" aria-label="Estación">
            {(['todas', 'cocina', 'barra'] as Station[]).map((s) => (
              <button key={s} type="button" aria-pressed={station === s} onClick={() => setStation(s)} data-testid={`station-${s}`}>
                {s === 'todas' ? 'Todas' : s === 'cocina' ? 'Cocina' : 'Barra'}
              </button>
            ))}
          </div>
          <button type="button" className="kds-chime" aria-pressed={prefs.kdsChime} onClick={() => setPrefs({ kdsChime: !prefs.kdsChime })} data-testid="kds-chime">
            <Glyph name={prefs.kdsChime ? 'volume' : 'mute'} size={16} /> Aviso de comanda nueva
          </button>
          <p className="legend" style={{ margin: 0 }}>
            <span><Glyph name="alert" size={16} /> Tarde: más de {LATE_MIN} min en preparación</span>
            <span><Glyph name="arrow" size={16} /> Sin arrastre: cada comanda avanza con su botón</span>
          </p>
        </div>
        {orders.length === 0 && (
          <div style={{ marginTop: 16 }}>
            <Empty title="No hay comandas activas">Los pedidos enviados por los clientes aparecen acá.</Empty>
          </div>
        )}
        <div className="kds">
          {COLS.map((c) => {
            const list = orders.filter((o) => o.status === c.status && (station === 'todas' || o.lines.some((l) => l.station === station)))
            return (
              <section key={c.status} className="kds-col" data-status={c.status} aria-labelledby={`col-${c.status}`}>
                <h3 id={`col-${c.status}`}>
                  {c.title} <span className="c">{list.length}</span>
                </h3>
                {list.map((o) => {
                  // el temporizador mide preparación; un pedido listo mide la espera de su retiro
                  const m = o.status === 'en_preparacion' ? mins(o) : null
                  const late = m !== null && m > LATE_MIN
                  const waitMin = o.status === 'listo' && o.pickup ? Math.floor((state.clock.nowMs - atLocal(o.pickup.dateKey, o.pickup.startMin)) / 60000) : null
                  const t = state.tickets.find((k) => k.id === o.ticketId)
                  const lines = o.lines.filter((l) => station === 'todas' || l.station === station)
                  return (
                    <article key={o.id} className={`ticket ${late ? 'late' : ''}`} data-testid={`ticket-${o.id}`} aria-label={`Comanda ${t?.id ?? o.id}, ${where(o)}${late ? ', tarde' : ''}`}>
                      <div className="t-head">
                        <div>
                          <span className="t-id"><Link to={`/admin/pedidos/${o.id}`}>{t?.id ?? o.id}</Link></span>
                          <span className="where">{where(o)}</span>
                        </div>
                        {o.status === 'listo' && (
                          <span className={`timer ${waitMin !== null && waitMin > 0 ? 'wait' : ''}`}>
                            <Glyph name={waitMin !== null && waitMin > 0 ? 'alert' : 'check'} size={16} />
                            {waitMin !== null && waitMin > 0 ? `Retiro demorado · ${waitMin} min` : o.kind === 'mesa' ? 'Para servir' : 'Esperando retiro'}
                          </span>
                        )}
                        {m !== null && (
                          <span className="timer" aria-label={`${m} minutos en preparación${late ? ', tarde' : ''}`}>
                            <Glyph name={late ? 'alert' : 'clock'} size={16} />
                            {late && 'Tarde · '}
                            {m} min
                          </span>
                        )}
                      </div>
                      <ul>
                        {lines.map((l) => (
                          <li key={l.id}>
                            <strong>{l.qty}× {l.name}</strong>
                            <span className="st">{l.station}</span>
                            {(l.selections.length > 0 || l.note) && (
                              <span className="mods">
                                {l.selections.map((s) => s.optionName).join(' · ')}
                                {l.note ? `${l.selections.length ? ' · ' : ''}Nota: ${l.note}` : ''}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                      {o.cancelRequested && (
                        <p className="cancel-req"><Glyph name="alert" size={18} /> Cancelación pendiente: el cliente la pidió; no la descartes hasta que el encargado decida.</p>
                      )}
                      {t?.incident && (
                        <p className="incident"><Glyph name="flag" size={18} /> {t.incident}</p>
                      )}
                      <p className="who">{o.alias} · {ORDER_LABEL[o.status].label}</p>
                      <div className="acts">
                        {o.status === 'enviado' && <button className="btn next" type="button" data-testid={`k-accept-${o.id}`} onClick={() => say(act({ type: 'order/accept', orderId: o.id }, `${o.id} aceptado`))}>Aceptar</button>}
                        {o.status === 'aceptado' && <button className="btn next" type="button" data-testid={`k-prepare-${o.id}`} onClick={() => say(act({ type: 'order/prepare', orderId: o.id }, `${o.id} en preparación`))}>Preparar</button>}
                        {o.status === 'en_preparacion' && <button className="btn next" type="button" data-testid={`k-ready-${o.id}`} onClick={() => say(act({ type: 'order/ready', orderId: o.id }, `${o.id} listo`))}>Marcar listo</button>}
                        {o.status === 'listo' && <button className="btn next" type="button" data-testid={`k-deliver-${o.id}`} onClick={() => say(act({ type: 'order/deliver', orderId: o.id }, o.kind === 'mesa' ? `${o.id} servido` : `${o.id} retirado`))}>{o.kind === 'mesa' ? 'Servido' : 'Retirado'}</button>}
                        <button className="btn secondary" type="button" onClick={() => setInc(o)}>Incidencia</button>
                      </div>
                    </article>
                  )
                })}
                {list.length === 0 && <p className="none">Sin comandas.</p>}
              </section>
            )
          })}
        </div>
      </div>
      <ReasonDialog open={!!inc} danger={false} title={`Incidencia en ${inc?.id}`} placeholder="¿Qué pasó? (sin insumo, cambio tardío…)" confirmLabel="Derivar al encargado" body={<p>Se avisa al encargado y la comanda queda intacta: no se borra trabajo.</p>} onCancel={() => setInc(null)} onConfirm={(note) => { say(act({ type: 'order/incident', orderId: inc!.id, note }, 'Incidencia derivada al encargado')); setInc(null) }} />
    </>
  )
}
