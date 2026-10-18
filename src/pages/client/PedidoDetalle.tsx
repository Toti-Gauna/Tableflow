import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useBiz } from '../../ui/hooks'
import { PageHead } from '../../ui/Shell'
import { Glyph } from '../../ui/glyphs'
import { orderCovered, orderDiscount, orderDue, orderPayment } from '../../domain/sessions'
import { hasFeature } from '../../ui/features'
import { HouseChar, type Mood } from '../../ui/art/characters'
import { act, Callout, DemoHint, Empty, ReasonDialog, StatusBadge } from '../../ui/kit'
import { ORDER_LABEL, sedeShort, STATION_LABEL } from '../../ui/format'
import { fmtARS } from '../../domain/money'
import { QrDisclosure } from '../../ui/Qr'
import { OrderMomentFor } from '../../ui/motion/Moments'
import { hhmm, minutesOfDay, HOUR } from '../../domain/time'
import type { AppState, Order, OrderStatus } from '../../domain/types'

/** Estado protagonista del seguimiento: personaje, titular y una línea clara por estado. */
const STATUS_COPY: Record<OrderStatus, { mood: Mood; title: string; text: (o: Order) => string }> = {
  enviado: { mood: 'pensando', title: 'Recibimos tu pedido', text: () => 'Solicitud recibida; el equipo todavía debe aceptarla.' },
  aceptado: { mood: 'feliz', title: 'Pedido aceptado', text: () => 'Ya está en la cola de cocina y barra.' },
  en_preparacion: { mood: 'guino', title: 'En preparación', text: (o) => (o.kind === 'retiro' ? 'Te avisamos cuando esté listo para retirar.' : 'En unos minutos llega a tu mesa.') },
  listo: { mood: 'festejo', title: '¡Listo!', text: (o) => (o.kind === 'retiro' ? `Retiralo ${o.businessId === 'ritual-cafe' ? 'en barra' : 'en el mostrador'} con el código ${o.pickupCode}.` : 'Tu mozo lo lleva a la mesa.') },
  servido: { mood: 'feliz', title: '¡Buen provecho!', text: () => 'Cuando quieras, pedí la cuenta.' },
  retirado: { mood: 'feliz', title: '¡Buen provecho!', text: (o) => (o.businessId === 'ritual-cafe' ? 'Gracias por pasar por la barra.' : '¡Gracias por pasar!') },
  cerrado: { mood: 'dormido', title: 'Cuenta cerrada', text: () => 'Este pedido ya está cerrado. ¡Gracias!' },
  rechazado: { mood: 'triste', title: 'No pudimos tomarlo', text: (o) => o.reason ?? 'El equipo rechazó el pedido.' },
  cancelado: { mood: 'triste', title: 'Pedido cancelado', text: (o) => o.reason ?? 'El pedido se canceló.' },
}

/**
 * NEG-02 · Pago en el local: el estado sale del saldo registrado en caja (orderPayment), nunca del avance del pedido.
 * "Aceptado" o "listo" siguen con el pago pendiente hasta que la caja registra el cobro de demostración.
 */
function PayAtCounter({ state, o }: { state: AppState; o: Order }) {
  const p = orderPayment(state, o)
  if (p.state === 'no-aplica') return <p className="small muted" data-testid="payment-state" data-state="no-aplica">No hay nada para pagar: el pedido no sigue en curso.</p>
  return p.state === 'pagado' ? (
    <p className="pay-state paid" data-testid="payment-state" data-state="pagado"><Glyph name="check" size={16} /> <span><strong>Pagado en el local.</strong> Cobro registrado por la caja (simulado, sin dinero real).</span></p>
  ) : (
    <p className="pay-state due" data-testid="payment-state" data-state="pendiente"><Glyph name="receipt" size={16} /> <span><strong>Pago en el local: pendiente · {fmtARS(p.balanceCents)}.</strong> Pagás en el mostrador al retirar. La app no cobra nada.</span></p>
  )
}

const FLOW: OrderStatus[] = ['enviado', 'aceptado', 'en_preparacion', 'listo', 'servido', 'cerrado']

export function OrderTimeline({ o }: { o: Order }) {
  const flow = o.kind === 'retiro' ? (['enviado', 'aceptado', 'en_preparacion', 'listo', 'retirado', 'cerrado'] as OrderStatus[]) : FLOW
  if (o.status === 'rechazado' || o.status === 'cancelado') {
    return (
      <ol className="track short" aria-label="Estado del pedido">
        <li data-state="done"><span className="sr-only">Hecho: </span>Enviado</li>
        <li data-state="off" aria-current="step"><span className="sr-only">Estado actual: </span>{ORDER_LABEL[o.status].label}</li>
      </ol>
    )
  }
  const idx = flow.indexOf(o.status)
  return (
    <ol className="track" aria-label="Estado del pedido">
      {flow.map((st, i) => (
        <li key={st} data-state={i < idx ? 'done' : i === idx ? 'now' : 'todo'} aria-current={i === idx ? 'step' : undefined}>
          <span className="sr-only">{i < idx ? 'Hecho: ' : i === idx ? 'Estado actual: ' : 'Pendiente: '}</span>
          {ORDER_LABEL[st].label}
        </li>
      ))}
    </ol>
  )
}

export function PedidoDetalle() {
  const { id } = useParams()
  const { state, biz } = useBiz()
  const nav = useNavigate()
  const [cancel, setCancel] = useState(false)
  const [msg, setMsg] = useState('')
  const o = state.orders.find((x) => x.id === id && x.businessId === biz.id)
  if (!o) {
    return (
      <main>
        <PageHead title="No encontramos ese pedido" />
        <Empty art={<HouseChar biz={biz.id} mood="sorpresa" />} title={`El folio ${id ?? ''} no existe en ${biz.name}`} action={<Link className="btn" to={`/${biz.id}/pedido`}>Volver a mis pedidos</Link>}>
          Puede ser de otro perfil o de un seed anterior. No se creó ni modificó nada.
        </Empty>
      </main>
    )
  }
  const sess = state.tableSessions.find((s) => s.id === o.sessionId)
  const table = sess?.tableIds.map((t) => state.tables.find((x) => x.id === t)?.label).join('+')
  const notice = o.noticeRunId ? state.runs.find((r) => r.id === o.noticeRunId) : undefined
  const noticeMsg = notice?.messageId ? state.messages.find((m) => m.id === notice.messageId) : undefined
  const loc = state.locations.find((l) => l.id === o.locationId)
  const cancellable = ['enviado', 'aceptado', 'en_preparacion', 'listo'].includes(o.status)
  void HOUR
  void minutesOfDay
  return (
    <main>
      <PageHead
        title={`Pedido ${o.id}`}
        eyebrow="Seguimiento del pedido"
        heading={<><span className="folio-pre">Pedido</span> <span className="folio">{o.id}</span></>}
        sub={`${loc ? sedeShort(loc.name) : ''} · ${o.kind === 'mesa' ? `mesa ${table ?? ''}` : `retiro ${o.pickup ? hhmm(o.pickup.startMin) : ''} a nombre de ${o.alias}`}`}
      >
        <StatusBadge s={ORDER_LABEL[o.status]} />
      </PageHead>
      <section className="status-hero" data-status={o.status} role="status" aria-live="polite">
        <HouseChar biz={biz.id} mood={STATUS_COPY[o.status].mood} size={112} animate={o.status === 'listo'} />
        <div className="sh-copy">
          <h2>{STATUS_COPY[o.status].title}</h2>
          <p>
            {STATUS_COPY[o.status].text(o)}
            {o.status === 'listo' && notice && notice.status !== 'fallida' && <span className="sh-note"> {notice.detail}</span>}
          </p>
          {o.status === 'enviado' && <p className="sent-tick" data-testid="sent-tick"><span className="tick" aria-hidden="true">✓</span> Enviado (simulado)</p>}
        </div>
        {o.kind === 'retiro' && !['rechazado', 'cancelado'].includes(o.status) && (
          <div className="pickup-code" aria-label={`Código de retiro ${o.pickupCode}`}>
            <small>Código de retiro</small>
            <span className="num">{o.pickupCode}</span>
          </div>
        )}
      </section>
      <OrderMomentFor order={o} />
      {!['rechazado', 'cancelado', 'cerrado'].includes(o.status) && <QrDisclosure businessId={o.businessId} kind="pedido" reference={o.id} title={`Pedido ${o.id}`} caption={o.kind === 'retiro' ? `Retiro · N.º ${o.pickupCode}` : 'En la mesa'} summary="Mostrar el QR de este pedido" />}
      <OrderTimeline o={o} />
      {(o.status === 'rechazado' || o.status === 'cancelado') && <Callout tone="err" role="alert">{ORDER_LABEL[o.status].label}: {o.reason ?? 'sin motivo registrado'}.</Callout>}
      {o.cancelRequested && <Callout tone="warn">Pediste cancelar con el pedido ya en marcha. El encargado debe decidir; la comanda no se borra.</Callout>}
      {notice?.status === 'fallida' && <DemoHint>El aviso por WhatsApp de este pedido falló (simulado): el equipo lo reintenta desde Automatizaciones. El pedido sigue listo.</DemoHint>}
      <section className="ticket-paper receipt" style={{ marginTop: 20, maxWidth: 640 }} aria-labelledby="det">
        <p className="eyebrow">Comanda {o.ticketId}</p>
        <h2 id="det">Detalle</h2>
        {o.lines.map((l) => (
          <div className="line" key={l.id}>
            <div>
              <strong>{l.qty}× {l.name}</strong> <span className="st-tag">{STATION_LABEL[l.station]}</span>
              <div className="opts">{l.selections.map((s) => s.optionName).join(' · ')}</div>
              {l.note && <div className="opts">Nota: {l.note}</div>}
              {l.giftId && <div className="gift-line"><Glyph name="gift" size={14} /> Invitación {state.gifts.find((g) => g.id === l.giftId)?.code} · cubre {fmtARS(l.coveredCents ?? 0)}</div>}
            </div>
            <span className="money">{fmtARS(l.lineCents)}</span>
          </div>
        ))}
        <div className="total-row"><span>Total</span><span className="money">{fmtARS(o.totalCents)}</span></div>
        {orderCovered(o) > 0 && <div className="total-row sub"><span>Cubierto por invitación</span><span className="money">− {fmtARS(orderCovered(o))}</span></div>}
        {orderDiscount(o) > 0 && <div className="total-row sub"><span>Beneficio {state.benefits.find((b) => b.id === o.benefitId)?.code ?? ''}</span><span className="money" data-testid="order-discount">− {fmtARS(orderDiscount(o))}</span></div>}
        {(orderCovered(o) > 0 || orderDiscount(o) > 0) && <div className="total-row"><span>A pagar</span><span className="money" data-testid="order-due">{fmtARS(orderDue(o))}</span></div>}
        {biz.paysAtCounter && o.kind === 'retiro' ? <PayAtCounter state={state} o={o} /> : <p className="small muted">Pago simulado: no se cobró nada.</p>}
        <details className="tech"><summary>Detalle técnico</summary><span className="small muted">Canal {o.channel} · operación {o.operationId} · hilo {o.correlationId}</span></details>
      </section>
      <div className="row" style={{ marginTop: 14 }}>
        {cancellable && !o.cancelRequested && <button className="btn danger" type="button" onClick={() => setCancel(true)} data-testid="cancel-order">Cancelar pedido</button>}
        <button className="btn secondary" type="button" onClick={() => { const r = act({ type: 'order/duplicate', orderId: o.id }, 'Copiado al carrito para revisar'); if (r.ok) nav(`/${biz.id}/pedido`) }}>Volver a pedir (copia al carrito)</button>
        {hasFeature(biz, 'simulador') && <Link className="btn ghost" to={`/${biz.id}/simulador`}>Seguir por WhatsApp (simulado)</Link>}
      </div>
      {msg && <Callout tone="info" role="status">{msg}</Callout>}
      <ReasonDialog
        open={cancel}
        title="Cancelar el pedido"
        confirmLabel="Cancelar pedido"
        body={<p>{['en_preparacion', 'listo'].includes(o.status) ? 'El pedido ya está en marcha: se abre una incidencia para el encargado y no se borra la comanda ni se devuelven insumos.' : 'Todavía no se preparó: se cancela y se libera lo reservado.'}</p>}
        onCancel={() => setCancel(false)}
        onConfirm={(reason) => {
          const r = act({ type: 'order/cancel', orderId: o.id, reason })
          setCancel(false)
          setMsg(r.ok ? (r.message ?? 'Pedido cancelado.') : r.message)
        }}
      />
    </main>
  )
}
