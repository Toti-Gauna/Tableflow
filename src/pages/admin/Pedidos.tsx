import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useApp } from '../../store'
import { PageHead } from '../../ui/Shell'
import { orderCovered, orderDue, orderPayment } from '../../domain/sessions'
import { act, Badge, Callout, ConfirmDialog, Empty, ReasonDialog, StatusBadge } from '../../ui/kit'
import { CHANNEL_LABEL, ORDER_LABEL, STATION_LABEL } from '../../ui/format'
import { OrderTimeline } from '../client/PedidoDetalle'
import { fmtARS } from '../../domain/money'
import { fmtDateTime, hhmm } from '../../domain/time'
import type { Order, OrderStatus } from '../../domain/types'

/** NEG-02 · Comercio: el pago en el local se ve pendiente hasta que caja lo registra; nunca lo cambia el avance del pedido. */
function PayRow({ o }: { o: Order }) {
  const state = useApp()
  const p = orderPayment(state, o)
  if (p.state === 'no-aplica') return null
  return p.state === 'pagado' ? (
    <p className="pay-state paid" data-testid="admin-payment" data-state="pagado"><span><strong>Pagado en el local</strong> (registro DEMO en caja).</span></p>
  ) : (
    <p className="pay-state due" data-testid="admin-payment" data-state="pendiente"><span><strong>Pago en el local pendiente · {fmtARS(p.balanceCents)}.</strong> Se cobra al retirar. <Link to={`/admin/caja?cuenta=${o.sessionId}`}>Cobrar en caja</Link></span></p>
  )
}

export function AdminPedidos() {
  const state = useApp()
  const { id } = useParams()
  const nav = useNavigate()
  const bizId = state.session.businessId
  const biz = state.businesses.find((b) => b.id === bizId)
  const [status, setStatus] = useState<'todos' | OrderStatus>('todos')
  const [reject, setReject] = useState<Order | null>(null)
  const [cancel, setCancel] = useState<Order | null>(null)
  const [edit, setEdit] = useState<Order | null>(null)
  const [qtys, setQtys] = useState<Record<string, number>>({})
  const [msg, setMsg] = useState<{ tone: 'ok' | 'err'; text: string } | null>(null)
  const orders = state.orders.filter((o) => o.businessId === bizId).sort((a, b) => b.createdAt - a.createdAt || b.id.localeCompare(a.id))
  const list = orders.filter((o) => status === 'todos' || o.status === status)
  const o = id ? orders.find((x) => x.id === id) : undefined
  const say = (r: ReturnType<typeof act>, ok: string) => setMsg(r.ok ? { tone: 'ok', text: r.message ?? ok } : { tone: 'err', text: r.message })

  if (id && !o) {
    return (
      <>
        <PageHead title="Pedidos" />
        <Empty title={`No existe el pedido ${id} en este perfil`} action={<Link className="btn" to="/admin/pedidos">Volver al listado</Link>}>No se modificó nada.</Empty>
      </>
    )
  }
  if (o) {
    const ses = state.tableSessions.find((s) => s.id === o.sessionId)
    const mvs = state.stockMovements.filter((m) => m.orderId === o.id)
    const task = state.tasks.find((t) => t.kind === 'cancelacion-preparacion' && t.entityId === o.id && t.status === 'pendiente')
    const hist = state.audit.filter((a) => a.entityType === 'Order' && a.entityId === o.id)
    return (
      <>
        <PageHead title={`Pedido ${o.id}`} sub={`${o.kind === 'mesa' ? `Mesa ${ses?.tableIds.map((t) => state.tables.find((x) => x.id === t)?.label).join('+')}` : `Retiro ${o.pickup ? hhmm(o.pickup.startMin) : ''} · ${o.alias}`} · canal ${o.channel}`}>
          <StatusBadge s={ORDER_LABEL[o.status]} />
        </PageHead>
        <p><Link to="/admin/pedidos">← Todos los pedidos</Link> · <Link to={`/${o.businessId}/pedido/${o.id}`}>Ver como cliente</Link></p>
        <OrderTimeline o={o} />
        {msg && <Callout tone={msg.tone === 'ok' ? 'ok' : 'err'} role="alert">{msg.text}</Callout>}
        {o.cancelRequested && task && (
          <Callout tone="warn" role="alert">
            <strong>Incidencia pendiente:</strong> {task.note}
            <div className="row" style={{ marginTop: 6 }}>
              <button className="btn small" type="button" onClick={() => say(act({ type: 'order/resolveCancel', orderId: o.id, decision: 'cancelar-con-merma' }), 'Cancelado con merma')} data-testid="resolve-merma">Cancelar y registrar merma</button>
              <button className="btn secondary small" type="button" onClick={() => say(act({ type: 'order/resolveCancel', orderId: o.id, decision: 'cancelar-sin-merma' }), 'Cancelado')}>Cancelar sin merma</button>
              <button className="btn secondary small" type="button" onClick={() => say(act({ type: 'order/resolveCancel', orderId: o.id, decision: 'mantener' }), 'Pedido mantenido')}>Mantener el pedido</button>
            </div>
          </Callout>
        )}
        <section className="card" style={{ marginTop: 12 }}>
          <h2>Platos</h2>
          {o.lines.map((l) => (
            <div className="line" key={l.id}>
              <div><strong>{l.qty}× {l.name}</strong> <span className="badge neutral">{STATION_LABEL[l.station]}</span><div className="opts">{l.selections.map((s) => s.optionName).join(' · ')}{l.note ? ` · Nota: ${l.note}` : ''}</div>{l.giftId && <div className="gift-line">Invitación {state.gifts.find((g) => g.id === l.giftId)?.code} · cubre {fmtARS(l.coveredCents ?? 0)} (sin cobro)</div>}</div>
              <span className="money">{fmtARS(l.lineCents)}</span>
            </div>
          ))}
          <div className="total-row"><span>Total</span><span className="money">{fmtARS(o.totalCents)}</span></div>
          {orderCovered(o) > 0 && <div className="total-row sub"><span>Cubierto por invitación · a cobrar {fmtARS(orderDue(o))}</span><span className="money">− {fmtARS(orderCovered(o))}</span></div>}
          {biz?.paysAtCounter && o.kind === 'retiro' && <PayRow o={o} />}
          <p className="small muted">{o.reviewed ? 'Editado con revisión. ' : ''}Operación {o.operationId} · correlación {o.correlationId} · versión {o.version}</p>
        </section>
        <div className="row" style={{ marginTop: 12 }}>
          {o.status === 'enviado' && <button className="btn" type="button" onClick={() => say(act({ type: 'order/accept', orderId: o.id, expectedVersion: o.version }), `${o.id} aceptado`)} data-testid="admin-accept">Aceptar</button>}
          {o.status === 'aceptado' && <button className="btn" type="button" onClick={() => say(act({ type: 'order/prepare', orderId: o.id }), 'En preparación')}>Iniciar preparación</button>}
          {['enviado', 'aceptado'].includes(o.status) && <button className="btn danger" type="button" onClick={() => setReject(o)}>Rechazar</button>}
          {['enviado', 'aceptado'].includes(o.status) && <button className="btn secondary" type="button" onClick={() => { setEdit(o); setQtys(Object.fromEntries(o.lines.map((l) => [l.id, l.qty]))) }}>Editar cantidades</button>}
          {['enviado', 'aceptado', 'en_preparacion', 'listo'].includes(o.status) && !o.cancelRequested && <button className="btn danger" type="button" onClick={() => setCancel(o)}>Cancelar</button>}
          <button className="btn secondary" type="button" onClick={() => { const r = act({ type: 'order/duplicate', orderId: o.id }, 'Copiado como nuevo para revisar'); if (r.ok) nav(`/${o.businessId}/pedido`) }}>Duplicar como nuevo</button>
        </div>
        <div className="grid cols-2" style={{ marginTop: 14 }}>
          <section className="card"><h2>Movimientos de stock</h2>
            {mvs.length === 0 ? <p className="muted">Sin movimientos (todavía no se aceptó o el plato no tiene receta).</p> : (
              <ul className="small">{mvs.map((m) => <li key={m.id}>{m.kind} · {state.ingredients.find((i) => i.id === m.ingredientId)?.name} · {m.deltaReserved ? `reservado ${m.deltaReserved > 0 ? '+' : ''}${m.deltaReserved}` : ''} {m.deltaOnHand ? `stock ${m.deltaOnHand}` : ''} <span className="muted">({m.eventKey})</span></li>)}</ul>
            )}
          </section>
          <section className="card"><h2>Historial</h2>
            <ul className="small">{hist.map((a) => <li key={a.id}>{fmtDateTime(a.at)} · {a.summary}</li>)}</ul>
          </section>
        </div>
        <ReasonDialog open={!!reject} title={`Rechazar ${reject?.id}`} confirmLabel="Rechazar pedido" body={<p>Se libera lo reservado y el motivo queda en el pedido.</p>} onCancel={() => setReject(null)} onConfirm={(reason) => { say(act({ type: 'order/reject', orderId: reject!.id, reason }), 'Pedido rechazado'); setReject(null) }} />
        <ReasonDialog open={!!cancel} title={`Cancelar ${cancel?.id}`} confirmLabel="Cancelar pedido" body={<p>{cancel && ['en_preparacion', 'listo'].includes(cancel.status) ? 'Está en marcha: se abre una incidencia y no se borra la comanda ni se devuelven insumos.' : 'Todavía no se preparó: se cancela y se libera lo reservado.'}</p>} onCancel={() => setCancel(null)} onConfirm={(reason) => { say(act({ type: 'order/cancel', orderId: cancel!.id, reason }), 'Cancelación registrada'); setCancel(null) }} />
        <ConfirmDialog open={!!edit} title={`Editar ${edit?.id}`} confirmLabel="Guardar con revisión" onCancel={() => setEdit(null)} onConfirm={() => { say(act({ type: 'order/edit', orderId: edit!.id, expectedVersion: edit!.version, changes: Object.entries(qtys).map(([lineId, qty]) => ({ lineId, qty })) }, 'Pedido editado; stock revalidado'), 'Pedido editado'); setEdit(null) }} body={<p className="muted">Poner 0 quita el plato. Se revalida el stock y queda marcado como editado.</p>}>
          {edit?.lines.map((l) => (
            <div className="field" key={l.id}>
              <label htmlFor={`q-${l.id}`}>{l.name}</label>
              <input id={`q-${l.id}`} type="number" min={0} max={20} value={qtys[l.id] ?? l.qty} onChange={(e) => setQtys((q) => ({ ...q, [l.id]: Number(e.target.value) }))} />
            </div>
          ))}
        </ConfirmDialog>
      </>
    )
  }
  return (
    <>
      <PageHead title="Pedidos" sub="Recepción acepta o rechaza; cocina y barra producen; el mozo sirve" />
      <div className="filters" role="group" aria-label="Filtros de pedidos">
        <div className="field" style={{ margin: 0, minWidth: 220 }}>
          <label htmlFor="fst">Estado</label>
          <select id="fst" value={status} onChange={(e) => setStatus(e.target.value as 'todos')}>
            <option value="todos">Todos</option>
            {(Object.keys(ORDER_LABEL) as OrderStatus[]).map((s) => <option key={s} value={s}>{ORDER_LABEL[s].label}</option>)}
          </select>
        </div>
        <p className="small muted" style={{ margin: '0 0 0 auto', alignSelf: 'center' }}>{list.length} pedido(s)</p>
      </div>
      {msg && <Callout tone={msg.tone === 'ok' ? 'ok' : 'err'} role="alert">{msg.text}</Callout>}
      {list.length === 0 ? <Empty title="No hay pedidos con ese filtro">Cuando un cliente envíe un pedido, aparece acá con su folio.</Empty> : (
        <>
          <div className="table-wrap responsive">
            <table>
              <caption className="sr-only">Pedidos</caption>
              <thead><tr><th>Folio</th><th>Entrega</th><th>Cliente</th><th>Canal</th><th>Total</th><th>Estado</th><th /></tr></thead>
              <tbody>
                {list.map((x) => {
                  const ses = state.tableSessions.find((s) => s.id === x.sessionId)
                  return (
                    <tr key={x.id} data-testid={`order-row-${x.id}`} data-status={x.status}>
                      <td><Link to={`/admin/pedidos/${x.id}`}>{x.id}</Link></td>
                      <td>{x.kind === 'mesa' ? `Mesa ${ses?.tableIds.map((t) => state.tables.find((y) => y.id === t)?.label).join('+')}` : `Retiro ${x.pickup ? hhmm(x.pickup.startMin) : ''} · N.º ${x.pickupCode}`}{biz?.paysAtCounter && x.kind === 'retiro' && orderPayment(state, x).state === 'pendiente-local' && <div className="small muted">Paga en el local</div>}</td>
                      <td>{x.alias}</td><td>{CHANNEL_LABEL[x.channel] ?? x.channel}</td><td className="money">{fmtARS(x.totalCents)}</td>
                      <td><StatusBadge s={ORDER_LABEL[x.status]} />{x.cancelRequested && <div style={{ marginTop: 4 }}><Badge tone="review" icon="⚑" label="Cancelación pendiente" /></div>}</td>
                      <td>{x.status === 'enviado' ? <button className="btn small" type="button" onClick={() => say(act({ type: 'order/accept', orderId: x.id }, `${x.id} aceptado`), 'Aceptado')} data-testid={`quick-accept-${x.id}`}>Aceptar</button> : <Link className="btn secondary small" to={`/admin/pedidos/${x.id}`}>Abrir</Link>}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="cards-m">
            {list.map((x) => (
              <div className="card mcard" key={x.id} data-status={x.status}>
                <div className="row between"><Link to={`/admin/pedidos/${x.id}`}><strong>{x.id}</strong></Link><StatusBadge s={ORDER_LABEL[x.status]} /></div>
                <p style={{ margin: '6px 0 10px' }}>{x.alias} · {x.kind === 'mesa' ? 'mesa' : `retiro ${x.pickup ? hhmm(x.pickup.startMin) : ''}`} · <span className="money">{fmtARS(x.totalCents)}</span></p>
                {x.cancelRequested && <p style={{ margin: '0 0 10px' }}><Badge tone="review" icon="⚑" label="Cancelación pendiente" /></p>}
                {x.status === 'enviado' ? <button className="btn small" type="button" onClick={() => say(act({ type: 'order/accept', orderId: x.id }, `${x.id} aceptado`), 'Aceptado')} data-testid={`m-quick-accept-${x.id}`}>Aceptar {x.id}</button> : <Link className="btn secondary small" to={`/admin/pedidos/${x.id}`}>Abrir {x.id}</Link>}
              </div>
            ))}
          </div>
        </>
      )}
    </>
  )
}
