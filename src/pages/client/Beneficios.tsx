import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useBiz, useCart, useOperation } from '../../ui/hooks'
import { PageHead } from '../../ui/Shell'
import { act, Badge, Callout, DemoTag, Empty } from '../../ui/kit'
import { fmtARS } from '../../domain/money'
import { customerStats, STAMP_GOAL } from '../../domain/growth'
import { benefitDaysLeft } from '../../domain/benefits'
import { fmtDateShort, dateKeyOf } from '../../domain/time'
import '../admin/growth.css'

const STATUS: Record<string, { label: string; tone: 'ok' | 'neutral' | 'warn' | 'err' }> = { disponible: { label: 'Disponible', tone: 'ok' }, canjeado: { label: 'Usado', tone: 'neutral' }, vencido: { label: 'Vencido', tone: 'warn' }, anulado: { label: 'Anulado', tone: 'err' } }

/** GR-A/F · Mis beneficios: los propios (nunca de otra persona), sellos de muestra y recomendar a alguien. */
export function Beneficios() {
  const { state, biz, locationId } = useBiz()
  const nav = useNavigate()
  const customerId = state.session.customerByBusiness[biz.id]
  const customer = state.customers.find((c) => c.id === customerId)
  const { cart } = useCart(state, biz.id, locationId)
  const [alias, setAlias] = useState('')
  const [msg, setMsg] = useState<{ tone: 'ok' | 'err'; text: string } | null>(null)
  const getOp = useOperation(`${biz.id}|ref|${alias}`)
  if (!customer) {
    return (
      <main>
        <PageHead title="Mis beneficios" eyebrow={biz.name} />
        <Empty title="Los beneficios son personales" action={<button className="btn" type="button" onClick={() => act({ type: 'session/setRole', role: 'cliente-recurrente' }, 'Ahora sos Ana (cliente recurrente)')} data-testid="as-ana">Entrar como Ana (cliente de muestra)</button>}>
          Para verlos hace falta saber quién sos. En la demo podés entrar como Ana, una clienta recurrente ficticia.
        </Empty>
      </main>
    )
  }
  const mine = state.benefits.filter((b) => b.businessId === biz.id && b.customerId === customer.id).sort((a, b) => (a.status === 'disponible' ? -1 : 1) - (b.status === 'disponible' ? -1 : 1) || b.createdAt - a.createdAt)
  const stats = customerStats(state, customer)
  const use = (code: string) => {
    if (!cart || !cart.lines.length) return setMsg({ tone: 'err', text: 'Primero agregá algo al pedido desde la carta; después elegí el beneficio.' })
    const o = act({ type: 'cart/setBenefit', cartId: cart.id, code }, 'Beneficio elegido para tu pedido')
    if (o.ok) nav(`/${biz.id}/pedido`)
    else setMsg({ tone: 'err', text: o.message })
  }
  const refer = () => {
    const o = act({ type: 'referral/create', businessId: biz.id, referrerId: customer.id, referredAlias: alias, operationId: getOp() }, 'Recomendación registrada')
    setMsg(o.ok ? { tone: 'ok', text: `Listo: cuando ${alias.trim()} reciba su primer pedido, se cumple la recomendación. No se envía ningún mensaje.` } : { tone: 'err', text: o.message })
    if (o.ok) setAlias('')
  }
  return (
    <main className="beneficios">
      <PageHead title="Mis beneficios" eyebrow={`${biz.name} · ${customer.alias}`} sub="Solo los tuyos · se usan en Mi pedido antes de enviar" />
      {msg && <Callout tone={msg.tone === 'ok' ? 'ok' : 'err'} role="alert">{msg.text}</Callout>}
      {mine.length === 0 ? (
        <Empty title="Todavía no tenés beneficios acá">Cuando el local lance una campaña para vos, aparece en esta lista. Nada se compra ni se cobra en la demo.</Empty>
      ) : (
        <ul className="benefit-list">
          {mine.map((b) => {
            const c = state.campaigns.find((x) => x.id === b.campaignId)!
            const items = c.benefit.itemIds.map((id) => state.menuItems.find((m) => m.id === id)?.name).filter(Boolean)
            return (
              <li key={b.id} className="benefit-card" data-status={b.status} data-testid={`mine-${b.code}`}>
                <div className="bc-main">
                  <p className="bc-value">{c.benefit.type === 'porcentaje' ? `${c.benefit.value} %` : fmtARS(c.benefit.value)}<span> de descuento</span></p>
                  <h2>{c.name}</h2>
                  <p className="small muted">{items.length ? `En: ${items.join(', ')}` : 'En toda la carta'}{c.rules.minOrderCents ? ` · compra mínima ${fmtARS(c.rules.minOrderCents)}` : ''}{c.rules.maxDiscountCents ? ` · hasta ${fmtARS(c.rules.maxDiscountCents)}` : ''} · uno por pedido, no se suma a una invitación</p>
                </div>
                <div className="bc-side">
                  <Badge tone={STATUS[b.status].tone} label={STATUS[b.status].label} />
                  <code className="bc-code">{b.code}</code>
                  <span className="small muted">{b.status === 'disponible' ? `Vence en ${benefitDaysLeft(state, b)} día(s) (${fmtDateShort(dateKeyOf(b.expiresAt))})` : b.status === 'canjeado' ? `Usado en ${b.orderId}` : b.reason ?? ''}</span>
                  {b.status === 'disponible' && <button className="btn small" type="button" onClick={() => use(b.code)} data-testid={`use-${b.code}`}>Usar en mi pedido</button>}
                </div>
              </li>
            )
          })}
        </ul>
      )}
      {stats.stamps !== null && (
        <section className="card stamps" aria-labelledby="st-h">
          <h2 id="st-h">Tus sellos <DemoTag>de muestra</DemoTag></h2>
          <p className="stamp-row" aria-label={`${stats.stamps} de ${STAMP_GOAL} sellos`}>{Array.from({ length: STAMP_GOAL }, (_, i) => <span key={i} className={i < stats.stamps! ? 'on' : ''} aria-hidden="true" />)}</p>
          <p className="small muted">{stats.stamps} de {STAMP_GOAL}. El premio por completar la tarjeta lo define el local y requiere su aprobación: la demo no entrega premios.</p>
        </section>
      )}
      <section className="card" aria-labelledby="ref-h" style={{ marginTop: 16 }}>
        <h2 id="ref-h">Recomendá {biz.name}</h2>
        <p className="small muted">Solo un nombre (alias de muestra), sin teléfono ni correo. Se cumple cuando esa persona recibe su primer pedido.</p>
        <div className="row">
          <label className="sr-only" htmlFor="ref-alias">Nombre de la persona</label>
          <input id="ref-alias" type="text" value={alias} onChange={(e) => setAlias(e.target.value)} placeholder="Nombre" data-testid="ref-alias" />
          <button className="btn secondary" type="button" onClick={refer} disabled={!alias.trim()} data-testid="ref-send">Recomendar</button>
        </div>
        {stats.referrals > 0 && <p className="small">Recomendaste a {stats.referrals} persona(s).</p>}
      </section>
      <p className="small muted" style={{ marginTop: 14 }}>¿Dudas? <Link to={`/${biz.id}/asistente`}>Preguntale al asistente</Link>.</p>
    </main>
  )
}
