import { useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useBiz, useOperation } from '../../ui/hooks'
import { PageHead } from '../../ui/Shell'
import { act, Callout, DemoHint, Empty } from '../../ui/kit'
import { QrCard } from '../../ui/Qr'
import { CodeResultCard } from '../../ui/CodeResult'
import { rememberMesa } from '../../ui/qrMesa'
import { checkCode, CODE_KINDS, ORDER_STATUS_ES, RES_STATUS_ES, referralCode, referrerOf, type CodeKind } from '../../domain/qr'
import './../../ui/qr.css'

const askLogin = (
  <button className="btn" type="button" onClick={() => act({ type: 'session/setRole', role: 'cliente-recurrente' }, 'Ahora sos Ana (cliente recurrente)')} data-testid="as-ana">Entrar como Ana (cliente de muestra)</button>
)

/** Mis códigos: el QR de cada pedido, reserva y beneficio propios, más el código para recomendar. Nada de otras personas. */
export function MisCodigos() {
  const { state, biz } = useBiz()
  const customerId = state.session.customerByBusiness[biz.id]
  const customer = state.customers.find((c) => c.id === customerId)
  if (!customer) {
    return (
      <main>
        <PageHead title="Mis códigos" eyebrow={biz.name} />
        <Empty title="Los códigos son personales" action={askLogin}>Para mostrar tus QR hace falta saber quién sos. En la demo podés entrar como Ana, una clienta ficticia.</Empty>
      </main>
    )
  }
  const orders = state.orders.filter((o) => o.businessId === biz.id && o.customerId === customer.id && !['rechazado', 'cancelado'].includes(o.status)).slice(-4).reverse()
  const reservations = state.reservations.filter((r) => r.businessId === biz.id && r.customerId === customer.id && ['confirmada', 'llegada'].includes(r.status)).slice(-3).reverse()
  const benefits = state.benefits.filter((b) => b.businessId === biz.id && b.customerId === customer.id && b.status === 'disponible')
  const mine = referralCode(state, biz.id, customer.id)
  const none = !orders.length && !reservations.length && !benefits.length
  return (
    <main>
      <PageHead title="Mis códigos" eyebrow={`${biz.name} · ${customer.alias}`} sub="Mostralos en el local para que los lean · solo los tuyos" />
      <DemoHint>El QR solo lleva un identificador. No acredita un pago, y como la demo guarda todo en este navegador, otro teléfono no vería tus datos.</DemoHint>
      {none && <Empty title="Todavía no tenés códigos para mostrar">Cuando hagas un pedido, tengas una reserva o un beneficio disponible, vas a encontrar su QR acá.</Empty>}
      <ul className="my-codes">
        {orders.map((o) => (
          <li key={o.id}><QrCard businessId={biz.id} kind="pedido" reference={o.id} title={`Pedido ${o.id}`} caption={`${o.kind === 'retiro' ? `Retiro · N.º ${o.pickupCode}` : 'En la mesa'} · ${ORDER_STATUS_ES[o.status]}`} /></li>
        ))}
        {reservations.map((r) => (
          <li key={r.id}><QrCard businessId={biz.id} kind="reserva" reference={r.id} title={`Reserva ${r.id}`} caption={`${r.party} ${r.party === 1 ? 'persona' : 'personas'} · ${RES_STATUS_ES[r.status]}`} /></li>
        ))}
        {benefits.map((b) => (
          <li key={b.id}><QrCard businessId={biz.id} kind="beneficio" reference={b.code} title={`Beneficio ${b.code}`} caption="Se canjea al enviar el pedido" /></li>
        ))}
        {mine && <li><QrCard businessId={biz.id} kind="referido" reference={mine} title="Mi código para recomendar" caption="Sin tu nombre: quien lo use queda registrado como recomendado" /></li>}
      </ul>
    </main>
  )
}

/** Lo que abre un QR: se vuelve a leer del store, nunca del enlace. Cada tipo lleva a su acción natural. */
export function QrLanding() {
  const { state, biz, locationId } = useBiz()
  const { kind, ref = '' } = useParams()
  const [q] = useSearchParams()
  const nav = useNavigate()
  const customerId = state.session.customerByBusiness[biz.id]
  const [alias, setAlias] = useState('')
  const [msg, setMsg] = useState<{ tone: 'ok' | 'err'; text: string } | null>(null)
  const getClaimOp = useOperation(`claim|${biz.id}|${ref}|${customerId ?? ''}`)
  const getRefOp = useOperation(`qref|${biz.id}|${ref}|${alias}`)
  const known = (CODE_KINDS as string[]).includes(kind ?? '')
  const text = `#/${biz.id}/q/${kind}/${encodeURIComponent(ref)}${q.get('s') ? `?s=${encodeURIComponent(q.get('s')!)}` : ''}`
  const check = known ? checkCode(state, { businessId: biz.id, locationId: q.get('s') ?? locationId, side: 'cliente', customerId }, text) : null
  const k = kind as CodeKind

  let extra: ReactNode = null
  if (check) {
    if (check.status === 'desconocido') {
      extra = <p className="small muted">Si es el código de un pedido o una reserva tuyos, entrá con tu cuenta. Los códigos se validan en el local.</p>
    } else if (k === 'negocio') {
      extra = <Link className="btn" to={`/${biz.id}/carta`}>Ver la carta</Link>
    } else if (k === 'sede' && check.usable) {
      extra = <button className="btn" type="button" onClick={() => { act({ type: 'session/setLocation', locationId: ref }); nav(`/${biz.id}/carta`) }} data-testid="qr-go">Elegir esta sede y ver la carta</button>
    } else if (k === 'mesa' && check.usable) {
      const t = state.tables.find((x) => x.id === ref)
      extra = (
        <button className="btn" type="button" data-testid="qr-go" onClick={() => {
          if (t && t.locationId !== locationId) act({ type: 'session/setLocation', locationId: t.locationId })
          rememberMesa(biz.id, ref)
          nav(`/${biz.id}/carta`)
        }}>Pedir desde esta mesa</button>
      )
    } else if (k === 'campana' && check.action?.type === 'reclamar') {
      extra = (
        <button className="btn" type="button" data-testid="qr-claim" onClick={() => {
          const o = act({ type: 'campaign/claim', businessId: biz.id, locationId, campaignId: ref, customerId, operationId: getClaimOp() })
          setMsg(o.ok ? { tone: 'ok', text: o.message ?? 'Beneficio reclamado.' } : { tone: 'err', text: o.message })
        }}>{check.action.label}</button>
      )
    } else if (k === 'campana' && !customerId) {
      extra = askLogin
    } else if (k === 'referido' && check.usable && !customerId) {
      const who = referrerOf(state, biz.id, ref)
      extra = (
        <form className="row" onSubmit={(e) => {
          e.preventDefault()
          const o = act({ type: 'referral/create', businessId: biz.id, referrerId: who, referredAlias: alias, operationId: getRefOp() })
          setMsg(o.ok ? { tone: 'ok', text: `Listo, ${alias.trim()}: quedaste registrada como recomendada. Cuando recibas tu primer pedido, se cumple. No se envía ningún mensaje.` } : { tone: 'err', text: o.message })
          if (o.ok) setAlias('')
        }}>
          <label className="sr-only" htmlFor="qr-alias">Tu nombre</label>
          <input id="qr-alias" type="text" value={alias} onChange={(e) => setAlias(e.target.value)} placeholder="Tu nombre (sin teléfono ni correo)" data-testid="qr-alias" />
          <button className="btn" type="submit" disabled={!alias.trim()} data-testid="qr-ref-send">Usar este código</button>
        </form>
      )
    } else if (k === 'pedido') {
      extra = <Link className="btn" to={`/${biz.id}/pedido/${check.ref}`}>Ver el seguimiento</Link>
    } else if (k === 'reserva') {
      extra = <Link className="btn" to={`/${biz.id}/reservas/${check.ref}`}>Ver mi reserva</Link>
    } else if (k === 'beneficio') {
      extra = <Link className="btn" to={`/${biz.id}/beneficios`}>Ir a Mis beneficios</Link>
    } else if (k === 'regalo') {
      extra = <Link className="btn" to={`/${biz.id}/regalo/${check.ref}`}>Abrir la invitación</Link>
    }
  }
  return (
    <main>
      <PageHead title="Código QR" eyebrow={biz.name} sub="Lo que dice esta demo de ese código" />
      {check ? <CodeResultCard check={check} /> : <Callout tone="err" role="alert">Ese enlace no corresponde a un tipo de código conocido.</Callout>}
      {msg && <Callout tone={msg.tone === 'ok' ? 'ok' : 'err'} role="alert">{msg.text}</Callout>}
      {extra && <div style={{ marginTop: 14 }}>{extra}</div>}
      <p className="small muted" style={{ marginTop: 14 }}>Un QR no trae precios ni datos tuyos y no acredita ningún pago. Todo se lee del estado guardado en este navegador.</p>
    </main>
  )
}
