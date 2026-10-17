import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../../store'
import { PageHead } from '../../ui/Shell'
import { entityRef, TASK_KIND_LABEL } from '../../ui/format'
import { act, Empty, ReasonDialog } from '../../ui/kit'
import { Glyph } from '../../ui/glyphs'
import { dateKeyOf, fmtDateShort } from '../../domain/time'
import { fmtARS } from '../../domain/money'
import { buildReport } from '../../domain/reports'
import { openCashFor } from '../../domain/cmd-cash'

export function AdminResumen() {
  const state = useApp()
  const bizId = state.session.businessId
  const biz = state.businesses.find((b) => b.id === bizId)!
  const today = dateKeyOf(state.clock.nowMs)
  const rep = buildReport(state, { businessId: bizId, locationId: 'todas', from: today, to: today, channel: 'todos' })
  const tasks = state.tasks.filter((t) => t.businessId === bizId && t.status === 'pendiente')
  const [resolve, setResolve] = useState<string | null>(null)
  const failed = state.runs.filter((r) => r.businessId === bizId && ['fallida', 'pendiente'].includes(r.status))
  const loc = state.session.locationByBusiness[bizId]
  const cash = openCashFor(state, loc)
  const resToday = state.reservations.filter((r) => r.businessId === bizId && r.dateKey === today)
  const pendingOrders = state.orders.filter((o) => o.businessId === bizId && o.status === 'enviado').length
  const toReview = state.reservations.filter((r) => r.businessId === bizId && ['solicitada', 'revision_humana'].includes(r.status)).length
  const alerts: { icon: string; tone: string; text: string; to: string; cta: string; n: number }[] = [
    { icon: 'calendar', tone: 'warn', text: 'Reservas por revisar', to: '/admin/reservas', cta: 'Ver reservas', n: toReview },
    { icon: 'receipt', tone: 'warn', text: 'Pedidos sin aceptar', to: '/admin/pedidos', cta: 'Ver pedidos', n: pendingOrders },
    { icon: 'box', tone: 'err', text: `Stock: ${rep.stock.low} bajo(s), ${rep.stock.out} agotado(s)`, to: '/admin/stock', cta: 'Ver stock', n: rep.stock.low + rep.stock.out },
    { icon: 'bolt', tone: 'err', text: 'Automatizaciones fallidas o pendientes', to: '/admin/automatizaciones', cta: 'Ver ejecuciones', n: failed.length },
  ]
  return (
    <>
      <PageHead title="Resumen" sub={`${biz.name} · ${fmtDateShort(today)} (día simulado)`} />
      <div className="kpis" role="group" aria-label="Indicadores del día">
        <div><p className="k">Reservas de hoy</p><p className="kpi" data-testid="kpi-res">{resToday.length}</p><p className="s">{resToday.filter((r) => r.status === 'solicitada').length} solicitadas · {resToday.filter((r) => r.status === 'confirmada').length} confirmadas</p></div>
        <div><p className="k">Pedidos de hoy</p><p className="kpi" data-testid="kpi-orders">{rep.orders.count}</p><p className="s">{rep.orders.delivered} entregados</p></div>
        <div><p className="k">Ventas (pedidos entregados)</p><p className="kpi money">{fmtARS(rep.orders.salesCents)}</p><p className="s">Derivado de pedidos; no es caja ni beneficio.</p></div>
        <div><p className="k">Caja de la sede</p><p className="kpi">{cash ? 'Abierta' : 'Cerrada'}</p><p className="s"><Link to="/admin/caja">Ir a caja</Link></p></div>
      </div>
      <div className="admin-grid">
        <section className="card" aria-labelledby="tareas">
          <div className="row between"><h2 id="tareas" style={{ margin: 0 }}>Revisión humana</h2><span className="badge review">{tasks.length} pendiente(s)</span></div>
          {tasks.length === 0 ? <div style={{ marginTop: 12 }}><Empty title="Sin tareas pendientes">Las consultas alimentarias, grupos grandes y derivaciones aparecen acá.</Empty></div> : (
            <ul className="task-list">
              {tasks.map((t) => (
                <li key={t.id} className="task-row" data-testid="task">
                  <Glyph name="flag" size={18} />
                  <div>
                    {(() => {
                      const ref = entityRef(state, t.entityType, t.entityId)
                      return <strong>{ref.to ? <Link to={ref.to}>{ref.text}</Link> : ref.text}</strong>
                    })()}{' '}
                    <span className="badge review">{TASK_KIND_LABEL[t.kind] ?? t.kind}</span>
                    <div className="small">{t.note}</div>
                    <details className="tech"><summary>Detalle técnico</summary><span className="small muted">{t.id} · hilo {t.correlationId}</span></details>
                  </div>
                  <button className="btn secondary small" type="button" onClick={() => setResolve(t.id)}>Resolver<span className="sr-only"> {t.id}</span></button>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="card" aria-labelledby="alertas">
          <h2 id="alertas">Alertas</h2>
          <ul className="alert-list">
            {alerts.map((a) => (
              <li key={a.to} data-on={a.n > 0}>
                <Glyph name={a.icon} size={18} />
                <span><strong className="num">{a.n}</strong> {a.text}</span>
                <Link to={a.to}>{a.cta}</Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
      <ReasonDialog
        open={!!resolve}
        title="Resolver la tarea"
        confirmLabel="Marcar como resuelta"
        placeholder="¿Cómo se resolvió?"
        danger={false}
        onCancel={() => setResolve(null)}
        onConfirm={(r) => { act({ type: 'task/resolve', taskId: resolve, resolution: r }, 'Tarea resuelta'); setResolve(null) }}
      />
    </>
  )
}
