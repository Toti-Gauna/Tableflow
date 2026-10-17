import { useEffect, useRef } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { dispatch, useApp } from '../../store'
import { useActiveInView, useCart } from '../../ui/hooks'
import { fmtARS } from '../../domain/money'
import { sedeShort } from '../../ui/format'
import { windowsFor } from '../../domain/availability'
import { dateKeyOf, hhmm, minutesOfDay } from '../../domain/time'
import type { AppState, BusinessId } from '../../domain/types'

const KIND: Record<string, string> = { bodegon: 'Bodegón · cocina de casa', cafe: 'Café de especialidad · barra y vitrina' }

/** Estado del servicio según el reloj simulado: "abierto hasta…" o "abre a las…". */
function serviceStatus(state: AppState, locationId: string): { open: boolean; text: string } {
  const now = state.clock.nowMs
  const m = minutesOfDay(now)
  const ws = windowsFor(state, locationId, dateKeyOf(now)).sort((a, b) => a.startMin - b.startMin)
  const cur = ws.find((w) => m >= w.startMin && m < w.endMin)
  const single = ws.length === 1
  if (cur) return { open: true, text: single ? `Abierto hasta las ${hhmm(cur.endMin)}` : `Abierto · ${cur.label.toLowerCase()} hasta las ${hhmm(cur.endMin)}` }
  const next = ws.find((w) => w.startMin > m)
  if (next) return { open: false, text: single ? `Cerrado · abre a las ${hhmm(next.startMin)}` : `Cerrado · ${next.label.toLowerCase()} desde las ${hhmm(next.startMin)}` }
  return { open: false, text: 'Cerrado por hoy' }
}

export function ClientLayout({ biz }: { biz: BusinessId }) {
  const state = useApp()
  const loc = useLocation()
  const b = state.businesses.find((x) => x.id === biz)!
  const locationId = state.session.locationByBusiness[biz]
  const sede = state.locations.find((l) => l.id === locationId)
  const { count, total } = useCart(state, biz, locationId)
  const svc = serviceStatus(state, locationId)
  const navRef = useRef<HTMLElement>(null)
  useActiveInView(navRef, loc.pathname)

  useEffect(() => {
    if (state.session.businessId !== biz) dispatch({ type: 'session/setBusiness', businessId: biz })
  }, [biz, state.session.businessId])

  const links: [string, string, boolean?][] = [
    ['', 'Inicio', true],
    ['carta', 'Carta'],
    ['pedido', 'Mi pedido'],
    ...(b.reservationsEnabled ? ([['reservar', 'Reservar']] as [string, string][]) : []),
    ['explorar', 'Explorar sabores'],
    ['pasaporte', 'Mi pasaporte'],
    ['catas', 'Catas'],
    ['ayuda', 'Ayuda'],
  ]
  const hideBar = /\/(pedido|simulador)(\/|$)/.test(loc.pathname)
  return (
    <div className={`client biz-${b.kind}`} data-biz={biz}>
      <header className="client-head">
        <div className="wrap">
          <div className="masthead">
            <Link to={`/${biz}`} className="wordmark" aria-label={`${b.name}, inicio`}>
              <span className="name">{b.name}</span>
              <span className="kind">{KIND[b.kind]}</span>
            </Link>
            <p className="service-chip" data-open={svc.open} style={{ margin: 0 }}>
              <span className="dot" aria-hidden="true" />
              <span>
                {sede && <span className="sede">{sedeShort(sede.name)} · </span>}
                {svc.text}
              </span>
            </p>
          </div>
          <nav className="nav" ref={navRef} aria-label={`Navegación de ${b.name}`}>
            {links.map(([to, label, end]) => (
              <NavLink key={to} to={`/${biz}${to ? `/${to}` : ''}`} end={end} aria-label={to === 'pedido' && count > 0 ? `${label} (${count})` : undefined}>
                {label}
                {to === 'pedido' && count > 0 && <span className="count" aria-hidden="true">{count}</span>}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <div className="wrap">
        <Outlet />
      </div>
      {count > 0 && !hideBar && (
        <div className="cart-bar" role="region" aria-label="Resumen del pedido">
          <span>
            <span className="count">{count}</span>
            {count === 1 ? 'plato' : 'platos'} · <strong className="money">{fmtARS(total)}</strong>
          </span>
          <Link className="btn" to={`/${biz}/pedido`}>Revisar y enviar</Link>
        </div>
      )}
    </div>
  )
}
