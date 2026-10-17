import { useState } from 'react'
import { useApp } from '../../store'
import { PageHead } from '../../ui/Shell'
import { HBarChart } from '../../ui/chart'

const ORDER_FLOW = ['enviado', 'aceptado', 'en_preparacion', 'listo', 'servido', 'retirado', 'cerrado', 'rechazado', 'cancelado'] as const
import { Callout, Empty, DemoHint } from '../../ui/kit'
import { buildReport } from '../../domain/reports'
import { dateKeyOf, fmtDateShort } from '../../domain/time'
import { fmtARS } from '../../domain/money'
import { ORDER_LABEL, RES_LABEL, sedeShort } from '../../ui/format'
import type { Channel } from '../../domain/types'

export function AdminReportes() {
  const state = useApp()
  const bizId = state.session.businessId
  const today = dateKeyOf(state.clock.nowMs)
  const [from, setFrom] = useState(today)
  const [to, setTo] = useState(today)
  const [loc, setLoc] = useState<string>('todas')
  const [channel, setChannel] = useState<Channel | 'todos'>('todos')
  const locs = state.locations.filter((l) => l.businessId === bizId)
  const rep = buildReport(state, { businessId: bizId, locationId: loc, from, to, channel })
  const reset = () => { setFrom(today); setTo(today); setLoc('todas'); setChannel('todos') }
  return (
    <>
      <PageHead title="Reportes" sub="Pedidos, reservas, caja, stock y eventos del período elegido." />
      <form className="filters" aria-label="Filtros del tablero" onSubmit={(e) => e.preventDefault()}>
        <div className="field" style={{ margin: 0 }}><label htmlFor="from">Desde</label><input id="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} data-testid="rep-from" /></div>
        <div className="field" style={{ margin: 0 }}><label htmlFor="to">Hasta</label><input id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} data-testid="rep-to" /></div>
        <div className="field" style={{ margin: 0 }}><label htmlFor="rloc">Sede</label><select id="rloc" value={loc} onChange={(e) => setLoc(e.target.value)}><option value="todas">Todas</option>{locs.map((l) => <option key={l.id} value={l.id}>{sedeShort(l.name)}</option>)}</select></div>
        <div className="field" style={{ margin: 0 }}><label htmlFor="rch">Canal</label><select id="rch" value={channel} onChange={(e) => setChannel(e.target.value as 'todos')}><option value="todos">Todos</option><option value="web">Web</option><option value="whatsapp">WhatsApp</option><option value="voz">Llamada</option><option value="recepcion">Recepción</option></select></div>
        <button className="btn secondary" type="button" onClick={reset} data-testid="rep-reset" style={{ alignSelf: 'flex-end' }}>Limpiar filtros</button>
      </form>
      <p className="muted small" aria-live="polite">Período: {fmtDateShort(from)} → {fmtDateShort(to)}.</p>
      {rep.empty ? (
        <Empty title="Sin actividad para estos filtros" action={<button className="btn" type="button" onClick={reset}>Restablecer filtros</button>}>
          No hay pedidos, reservas, pagos ni eventos en este período. No se muestran gráficos ni importes inventados.
        </Empty>
      ) : (
        <div data-testid="report">
          <div className="kpis" role="group" aria-label="Indicadores del período">
            <div><p className="k">Pedidos</p><p className="kpi" data-testid="rep-orders">{rep.orders.count}</p><p className="s">{rep.orders.delivered} entregados</p></div>
            <div><p className="k">Ventas · pedidos entregados</p><p className="kpi money" data-testid="rep-sales">{fmtARS(rep.orders.salesCents)}</p><p className="s">no es caja ni beneficio</p></div>
            <div><p className="k">Reservas</p><p className="kpi">{rep.reservations.count}</p><p className="s">en el período</p></div>
            <div><p className="k">Cobros DEMO</p><p className="kpi money">{fmtARS(rep.cash.collectedCents)}</p><p className="s">{Object.entries(rep.cash.byMethod).map(([k, v]) => `${k} ${fmtARS(v)}`).join(' · ') || 'sin cobros'}</p></div>
          </div>
          <div className="admin-grid">
            <section className="card" aria-labelledby="ped">
              <h2 id="ped">Pedidos por estado</h2>
              <HBarChart title={`${rep.orders.count} pedidos en total`} unit={['pedido', 'pedidos']} testId="chart-orders"
                rows={ORDER_FLOW.filter((st) => (rep.orders.byStatus as Record<string, number>)[st] !== undefined || ['enviado', 'aceptado', 'en_preparacion', 'listo'].includes(st)).map((st) => ({ key: st, label: ORDER_LABEL[st].label, value: (rep.orders.byStatus as Record<string, number>)[st] ?? 0 }))} />
              <p className="small muted">Por canal: {Object.entries(rep.orders.byChannel).map(([k, v]) => `${k} ${v}`).join(' · ') || '—'}</p>
            </section>
            <section className="card" aria-labelledby="res">
              <h2 id="res">Reservas por estado</h2>
              {rep.reservations.count === 0 ? <p className="muted">Sin reservas en el período.</p> : (
                <HBarChart title={`${rep.reservations.count} reservas en total`} unit={['reserva', 'reservas']}
                  rows={(Object.entries(rep.reservations.byStatus) as [keyof typeof RES_LABEL, number][]).map(([st, n]) => ({ key: st, label: RES_LABEL[st].label, value: n }))} />
              )}
            </section>
            <section className="card" aria-labelledby="cj">
              <h2 id="cj">Caja (efectivo ≠ ventas)</h2>
              {rep.cash.sessions.length === 0 ? <p className="muted">Sin turnos en el período.</p> : (
                <ul className="kv-list">{rep.cash.sessions.map((c) => <li key={c.id}><span>{c.id} · {c.status === 'abierta' ? 'turno abierto' : 'cerrado'}</span><span>esperado <strong className="money">{fmtARS(c.expectedCents)}</strong>{c.countedCents !== null ? <> · contado <span className="money">{fmtARS(c.countedCents)}</span> · diferencia <strong className="money">{fmtARS(c.differenceCents ?? 0)}</strong>{c.reason ? ` (${c.reason})` : ''}</> : null}</span></li>)}</ul>
              )}
              <p className="small muted">Beneficio y MRR no se calculan: requerirían costos reales.</p>
            </section>
            <section className="card" aria-labelledby="stk">
              <h2 id="stk">Stock, catas y automatizaciones</h2>
              <dl className="kv-dl">
                <div><dt>Insumos</dt><dd>{rep.stock.low} bajo(s) · {rep.stock.out} agotado(s) de {rep.stock.total}</dd></div>
                {rep.events.map((e) => <div key={e.id}><dt>{e.title}</dt><dd>{e.held}/{e.capacity} lugares · {e.waiting} en espera</dd></div>)}
                <div><dt>Automatizaciones</dt><dd>{rep.automations.count} ejecuciones{Object.keys(rep.automations.byStatus).length ? ` (${Object.entries(rep.automations.byStatus).map(([k, v]) => `${k} ${v}`).join(', ')})` : ''} · {rep.automations.campaignPreviews} vista(s) previa(s) de campaña</dd></div>
                <div><dt>Pasaporte</dt><dd>inicio {rep.passport.started} · completado {rep.passport.completed} · guardado {rep.passport.saved} · usado {rep.passport.usedInCart} · insignias {rep.passport.badgesFromVisits}</dd></div>
              </dl>
            </section>
          </div>
        </div>
      )}
      <DemoHint>Cambiá un pedido en Pedidos o Cocina y volvé: los indicadores se recalculan desde el mismo estado.</DemoHint>
    </>
  )
}
