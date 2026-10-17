import { Link } from 'react-router-dom'
import { useBiz } from '../../ui/hooks'
import { PageHead } from '../../ui/Shell'
import { DemoTag } from '../../ui/kit'
import { dateKeyOf, hhmm, minutesOfDay } from '../../domain/time'
import type { AppState, Order } from '../../domain/types'
import './l5.css'

const PREP: Order['status'][] = ['enviado', 'aceptado', 'en_preparacion']

/** Pedidos de retiro de hoy de un negocio, separados en "preparando" y "listo para retirar". */
export function pickupBoard(state: AppState, businessId: string) {
  const today = dateKeyOf(state.clock.nowMs)
  const mine = state.orders.filter((o) => o.businessId === businessId && o.kind === 'retiro' && dateKeyOf(o.createdAt) === today)
  const byCode = (a: Order, b: Order) => a.pickupCode.localeCompare(b.pickupCode)
  return { prep: mine.filter((o) => PREP.includes(o.status)).sort(byCode), ready: mine.filter((o) => o.status === 'listo').sort(byCode) }
}

/** NEG-BR-03 · Pantalla de números del mostrador: lo que cambia en cocina se ve acá, sin nombres de clientes. */
export function Numeros() {
  const { state, biz } = useBiz()
  const { prep, ready } = pickupBoard(state, biz.id)
  return (
    <main className="numeros">
      <PageHead title="Números de retiro" eyebrow={`${biz.name} · pantalla del mostrador`} />
      <p className="lead">Cuando tu número pasa a <strong>Listo</strong>, acercate al mostrador y pagás ahí. La pantalla muestra solo números, nunca nombres. <DemoTag>reloj simulado {hhmm(minutesOfDay(state.clock.nowMs))}</DemoTag></p>
      <div className="num-board">
        <section aria-labelledby="nb-prep" className="nb-col">
          <h2 id="nb-prep">Preparando</h2>
          {prep.length === 0 ? <p className="muted">No hay pedidos en preparación.</p> : (
            <ul>{prep.map((o) => <li key={o.id} data-testid={`prep-${o.pickupCode}`}><span className="nb-num">{o.pickupCode}</span></li>)}</ul>
          )}
        </section>
        <section aria-labelledby="nb-ready" className="nb-col ready">
          <h2 id="nb-ready">Listo para retirar</h2>
          <div aria-live="polite">
            {ready.length === 0 ? <p className="muted">Todavía no hay números listos.</p> : (
              <ul>{ready.map((o) => <li key={o.id} data-testid={`ready-${o.pickupCode}`}><span className="nb-num">{o.pickupCode}</span></li>)}</ul>
            )}
          </div>
        </section>
      </div>
      <p className="row" style={{ marginTop: 20 }}>
        <Link className="btn" to={`/${biz.id}/carta`}>Hacer un pedido</Link>
        <Link className="btn secondary" to={`/${biz.id}/pedido`}>Ver mi pedido</Link>
      </p>
    </main>
  )
}
