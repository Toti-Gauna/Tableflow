import { Suspense, useRef } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useActiveInView } from '../../ui/hooks'
import { useApp } from '../../store'
import { ADMIN_SECTIONS, isClientRole, ROLE_LABEL } from '../../ui/format'
import { Callout } from '../../ui/kit'
import { Glyph } from '../../ui/glyphs'
import { RouteLoader } from '../../ui/Loader'
import { TabBar } from '../../ui/TabBar'

const ICON: Record<string, string> = {
  resumen: 'grid', reservas: 'calendar', salon: 'floor', pedidos: 'receipt', cocina: 'flame', caja: 'register',
  carta: 'book', stock: 'box', clientes: 'people', regalos: 'gift', automatizaciones: 'bolt', reportes: 'chart', configuracion: 'sliders',
}

export function AdminLayout() {
  const state = useApp()
  const biz = state.businesses.find((b) => b.id === state.session.businessId)!
  const role = state.session.role
  const { pathname } = useLocation()
  const navRef = useRef<HTMLElement>(null)
  useActiveInView(navRef, pathname)
  const counts: Record<string, number> = {
    reservas: state.reservations.filter((r) => r.businessId === biz.id && ['solicitada', 'revision_humana'].includes(r.status)).length,
    pedidos: state.orders.filter((o) => o.businessId === biz.id && o.status === 'enviado').length,
    cocina: state.orders.filter((o) => o.businessId === biz.id && ['aceptado', 'en_preparacion'].includes(o.status)).length,
    resumen: state.tasks.filter((t) => t.businessId === biz.id && t.status === 'pendiente').length,
    automatizaciones: state.runs.filter((r) => r.businessId === biz.id && ['fallida', 'pendiente'].includes(r.status)).length,
    stock: state.ingredients.filter((i) => i.businessId === biz.id && i.alertState !== 'ok').length,
    regalos: state.gifts.filter((g) => g.businessId === biz.id && g.status === 'abierto' && state.clock.nowMs <= g.expiresAt).length,
  }
  const mine = ADMIN_SECTIONS.filter((s) => s.roles.includes(role))
  const others = ADMIN_SECTIONS.filter((s) => !s.roles.includes(role))
  const link = (s: (typeof ADMIN_SECTIONS)[number]) => (
    <NavLink key={s.key} to={`/admin/${s.key}`} data-testid={`nav-${s.key}`}>
      <Glyph name={ICON[s.key] ?? 'grid'} size={18} />
      <span className="lbl">{s.label}</span>
      {counts[s.key] ? <span className="count" aria-label={`${counts[s.key]} pendientes`}>{counts[s.key]}</span> : null}
    </NavLink>
  )
  const toTab = (s: (typeof ADMIN_SECTIONS)[number]) => ({ to: `/admin/${s.key}`, label: s.short ?? s.label, icon: ICON[s.key] ?? 'grid', badge: counts[s.key] || undefined })
  const toLink = (s: (typeof ADMIN_SECTIONS)[number]) => ({ to: `/admin/${s.key}`, label: s.label, icon: ICON[s.key] ?? 'grid', badge: counts[s.key] || undefined })
  const quick = (mine.length ? mine : ADMIN_SECTIONS).slice(0, 4)
  return (
    <div className="admin" data-biz={biz.id}>
      <div className="admin-layout">
        <aside className="admin-side">
          <div className="admin-brand">
            <span className="biz">{biz.name}</span>
            <span className="role">Vista de {ROLE_LABEL[role]}</span>
          </div>
          <nav className="admin-nav" ref={navRef} aria-label="Administración">
            {mine.length > 0 && <span className="grp" aria-hidden="true">Tu turno</span>}
            {mine.map(link)}
            {others.length > 0 && <span className="grp">Otras vistas</span>}
            {others.map(link)}
          </nav>
        </aside>
        <div className="admin-main">
          <p className="role-hint" style={{ margin: '0 0 12px' }}>
            Administración de <strong>{biz.name}</strong> · vista de <strong>{ROLE_LABEL[role]}</strong> (didáctica: no hay permisos ni seguridad real).{' '}
            {isClientRole(role) && <>Estás con un rol de cliente viendo pantallas de personal. <Link to={`/${biz.id}`}>Volver a la vista cliente</Link>.</>}
          </p>
          <Suspense fallback={<RouteLoader variant="admin" />}>
            <Outlet />
          </Suspense>
          <div className="admin-note">
            <Callout>Todo lo que ves acá se deriva del mismo estado local que la vista cliente: un cambio en un pedido o una reserva se refleja en ambas.</Callout>
          </div>
        </div>
      </div>
      <TabBar
        className="admin-tabs"
        label="Accesos rápidos de administración"
        sheetTitle={`Secciones · vista de ${ROLE_LABEL[role]}`}
        tabs={quick.map(toTab)}
        sheet={[
          { heading: mine.length ? 'Tu turno' : undefined, links: mine.filter((s) => !quick.includes(s)).map(toLink) },
          { heading: 'Otras vistas', links: others.filter((s) => !quick.includes(s)).map(toLink) },
        ].filter((g) => g.links.length)}
      />
    </div>
  )
}
