import { lazy, Suspense, useEffect, useRef, type ComponentType } from 'react'
import { HashRouter, Navigate, Outlet, Route, Routes, useLocation, useParams } from 'react-router-dom'
import { LiveRegion } from './ui/kit'
import { DemoBanner, DemoBar, Footer, StatusStrips } from './ui/Shell'
import { isBiz } from './ui/hooks'
import { dispatch, setPrefs, useSnapshot } from './store'
import { ClientLayout } from './pages/client/ClientLayout'
import { Home } from './pages/client/Home'
import { Carta } from './pages/client/Carta'
import { MiPedido } from './pages/client/MiPedido'
import { Landing } from './pages/Landing'
import { Recovery } from './pages/Recovery'
import { NotFound } from './pages/NotFound'
import { RouteLoader } from './ui/Loader'

// Carga diferida por ruta: el recorrido principal (inicio, carta, pedido) va en el bundle inicial;
// administración, simulador, regalos, sección infantil y páginas de referencia bajan al visitarlas.
const named = <K extends string>(load: () => Promise<Record<K, ComponentType>>, name: K) => lazy(() => load().then((m) => ({ default: m[name] })))
const PedidoDetalle = named(() => import('./pages/client/PedidoDetalle'), 'PedidoDetalle')
const Reservar = named(() => import('./pages/client/Reservar'), 'Reservar')
const ReservaDetalle = named(() => import('./pages/client/ReservaDetalle'), 'ReservaDetalle')
const Explorar = named(() => import('./pages/client/Explorar'), 'Explorar')
const Pasaporte = named(() => import('./pages/client/Pasaporte'), 'Pasaporte')
const Catas = named(() => import('./pages/client/Catas'), 'Catas')
const Ayuda = named(() => import('./pages/client/Ayuda'), 'Ayuda')
const Simulador = named(() => import('./pages/client/Simulador'), 'Simulador')
const Regalar = named(() => import('./pages/client/Regalar'), 'Regalar')
const Regalo = named(() => import('./pages/client/Regalo'), 'Regalo')
const Comercial = named(() => import('./pages/Comercial'), 'Comercial')
const Arte = named(() => import('./pages/Arte'), 'Arte')
const AdminLayout = named(() => import('./pages/admin/AdminLayout'), 'AdminLayout')
const AdminResumen = named(() => import('./pages/admin/Resumen'), 'AdminResumen')
const AdminReservas = named(() => import('./pages/admin/Reservas'), 'AdminReservas')
const AdminSalon = named(() => import('./pages/admin/Salon'), 'AdminSalon')
const AdminPedidos = named(() => import('./pages/admin/Pedidos'), 'AdminPedidos')
const AdminCocina = named(() => import('./pages/admin/Cocina'), 'AdminCocina')
const AdminCaja = named(() => import('./pages/admin/Caja'), 'AdminCaja')
const AdminCarta = named(() => import('./pages/admin/CartaAdmin'), 'AdminCarta')
const AdminStock = named(() => import('./pages/admin/Stock'), 'AdminStock')
const AdminClientes = named(() => import('./pages/admin/Clientes'), 'AdminClientes')
const AdminRegalos = named(() => import('./pages/admin/Regalos'), 'AdminRegalos')
const AdminAutomatizaciones = named(() => import('./pages/admin/Automatizaciones'), 'AdminAutomatizaciones')
const AdminReportes = named(() => import('./pages/admin/Reportes'), 'AdminReportes')
const AdminConfig = named(() => import('./pages/admin/Configuracion'), 'AdminConfig')

function BizGuard() {
  const { biz } = useParams()
  if (!isBiz(biz)) return <NotFound what="perfil" />
  return <ClientLayout biz={biz} />
}

function SimRedirect() {
  const { state } = useSnapshot()
  return <Navigate to={`/${state.session.businessId}/simulador`} replace />
}

/** Mueve el foco al título al navegar (lectores de pantalla y teclado). */
function FocusOnNav() {
  const first = useRef(true)
  const { pathname: raw } = useLocation()
  // abrir/cerrar el detalle de un plato (diálogo) no es una navegación de página: el foco lo maneja el diálogo
  const pathname = raw.replace(/^(\/[^/]+\/carta)\/[^/]+$/, '$1')
  useEffect(() => {
    if (first.current) {
      first.current = false // la carga inicial no roba el foco
      return
    }
    // una pantalla nueva empieza arriba (la SPA no hereda la posición de la anterior)
    window.scrollTo(0, 0)
    // si la persona ya movió el foco (eligió algo en la pantalla nueva), no se lo quitamos.
    // Con carga diferida el título puede tardar en existir: se espera hasta 2 s sin bloquear nada.
    const before = document.activeElement
    let tries = 0
    let t = 0
    const tick = () => {
      if (document.activeElement !== before && document.activeElement !== document.body) return
      const h = document.getElementById('page-h1')
      if (h && !h.closest('.route-loader')) return h.focus({ preventScroll: false })
      if (++tries < 66) t = window.setTimeout(tick, 30)
    }
    t = window.setTimeout(tick, 30)
    return () => clearTimeout(t)
  }, [pathname])
  return null
}

function Chrome() {
  const { phase, prefs } = useSnapshot()
  useEffect(() => {
    const root = document.documentElement
    if (prefs.reducedMotion === 'on') root.setAttribute('data-motion', 'reduced')
    else root.removeAttribute('data-motion')
  }, [prefs.reducedMotion])
  return (
    <>
      <a className="skip" href="#contenido" onClick={(e) => { e.preventDefault(); document.getElementById('page-h1')?.focus() }}>
        Saltar al contenido
      </a>
      <DemoBanner />
      <StatusStrips />
      {phase === 'recovery' ? (
        <Recovery />
      ) : (
        <>
          <DemoBar />
          <FocusOnNav />
          <div id="contenido">
            <Suspense fallback={<RouteLoader />}>
              <Outlet />
            </Suspense>
          </div>
          <Footer />
        </>
      )}
      <LiveRegion />
    </>
  )
}

export function App() {
  void dispatch
  void setPrefs
  return (
    <HashRouter>
      <Routes>
        <Route element={<Chrome />}>
          <Route path="/" element={<Landing />} />
          <Route path="/simulador" element={<SimRedirect />} />
          <Route path="/comercial" element={<Comercial />} />
          <Route path="/arte" element={<Arte />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="resumen" replace />} />
            <Route path="resumen" element={<AdminResumen />} />
            <Route path="reservas" element={<AdminReservas />} />
            <Route path="reservas/:id" element={<AdminReservas />} />
            <Route path="salon" element={<AdminSalon />} />
            <Route path="pedidos" element={<AdminPedidos />} />
            <Route path="pedidos/:id" element={<AdminPedidos />} />
            <Route path="cocina" element={<AdminCocina />} />
            <Route path="caja" element={<AdminCaja />} />
            <Route path="carta" element={<AdminCarta />} />
            <Route path="stock" element={<AdminStock />} />
            <Route path="clientes" element={<AdminClientes />} />
            <Route path="clientes/:id" element={<AdminClientes />} />
            <Route path="regalos" element={<AdminRegalos />} />
            <Route path="automatizaciones" element={<AdminAutomatizaciones />} />
            <Route path="reportes" element={<AdminReportes />} />
            <Route path="configuracion" element={<AdminConfig />} />
            <Route path="*" element={<NotFound what="sección de administración" back="/admin/resumen" backLabel="Volver al resumen" />} />
          </Route>
          <Route path="/:biz" element={<BizGuard />}>
            <Route index element={<Home />} />
            <Route path="carta" element={<Carta />} />
            <Route path="carta/:itemId" element={<Carta />} />
            <Route path="pedido" element={<MiPedido />} />
            <Route path="pedido/:id" element={<PedidoDetalle />} />
            <Route path="reservar" element={<Reservar />} />
            <Route path="reservas/:id" element={<ReservaDetalle />} />
            <Route path="explorar" element={<Explorar />} />
            <Route path="pasaporte" element={<Pasaporte />} />
            <Route path="catas" element={<Catas />} />
            <Route path="ayuda" element={<Ayuda />} />
            <Route path="simulador" element={<Simulador />} />
            <Route path="regalar" element={<Regalar />} />
            <Route path="regalo/:code" element={<Regalo />} />
            <Route path="*" element={<NotFound what="página" />} />
          </Route>
          <Route path="*" element={<NotFound what="página" />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}
