import { Suspense, useEffect, useRef } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { dispatch, useApp } from '../../store'
import { useActiveInView, useCart } from '../../ui/hooks'
import { fmtARS } from '../../domain/money'
import { sedeShort } from '../../ui/format'
import { windowsFor } from '../../domain/availability'
import { dateKeyOf, hhmm, minutesOfDay } from '../../domain/time'
import type { AppState, BusinessId } from '../../domain/types'
import { RouteLoader } from '../../ui/Loader'
import { TabBar, type SheetLink } from '../../ui/TabBar'
import { SeasonChip } from '../../ui/season'
import { activeSeason } from '../../domain/season'

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
    ['regalar', 'Regalar'],
    ['chicos', 'Para chicos'],
    ['ayuda', 'Ayuda'],
  ]
  const hideBar = /\/(pedido|simulador|regalar|regalo)(\/|$)/.test(loc.pathname)
  const root = `/${biz}`
  const more: SheetLink[] = [
    ...(b.reservationsEnabled ? [{ to: `${root}/reservar`, label: 'Reservar', icon: 'calendar', hint: 'Mesa para hoy o los próximos días' }] : []),
    { to: `${root}/explorar`, label: 'Explorar sabores', icon: 'compass', hint: 'Recomendaciones según tu gusto' },
    { to: `${root}/pasaporte`, label: 'Mi pasaporte', icon: 'stamp', hint: 'Sellos, insignias y selección guardada' },
    { to: `${root}/catas`, label: 'Catas', icon: 'wine', hint: 'Con cupo y lista de espera' },
    { to: `${root}/chicos`, label: 'Para chicos', icon: 'smile', hint: 'Menú infantil y juegos' },
    { to: `${root}/ayuda`, label: 'Ayuda', icon: 'help', hint: 'Cómo funciona la demo' },
    { to: `${root}/simulador`, label: 'Simulador de canales', icon: 'chat', hint: 'Chat y llamada simulados' },
  ]
  return (
    <div className={`client biz-${b.kind}`} data-biz={biz} data-season={activeSeason(state, biz).id}>
      <header className="client-head">
        <div className="wrap">
          <div className="masthead">
            <Link to={`/${biz}`} className="wordmark" aria-label={`${b.name}, inicio`}>
              <span className="name">{b.name}</span>
              <span className="kind">{KIND[b.kind]}</span>
            </Link>
            <div className="masthead-aside">
              <SeasonChip state={state} biz={biz} />
              <p className="service-chip" data-open={svc.open} style={{ margin: 0 }}>
                <span className="dot" aria-hidden="true" />
                <span>
                  {sede && <span className="sede">{sedeShort(sede.name)} · </span>}
                  {svc.text}
                </span>
              </p>
            </div>
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
        <Suspense fallback={<RouteLoader />}>
          <Outlet />
        </Suspense>
      </div>
      <TabBar
        className="client-tabs"
        label={`Accesos rápidos de ${b.name}`}
        sheetTitle={`Más de ${b.name}`}
        tabs={[
          { to: root, label: 'Inicio', icon: 'home', end: true },
          { to: `${root}/carta`, label: 'Carta', icon: 'book' },
          { to: `${root}/pedido`, label: 'Pedido', icon: 'receipt', badge: count, aria: count > 0 ? `Mi pedido (${count})` : 'Mi pedido' },
          { to: `${root}/regalar`, label: 'Regalar', icon: 'gift' },
        ]}
        sheet={[{ links: more }]}
      />
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
