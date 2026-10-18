import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { act, announce, ConfirmDialog, DemoTag, Dialog } from './kit'
import { Glyph } from './glyphs'
import { DEFAULT_ADMIN, isClientRole, ROLE_DESC, ROLE_LABEL, sedeShort } from './format'
import { dismissNotice, dispatch, resetDemo, setPrefs, useSnapshot } from '../store'
import { sfx } from './sfx'
import { dateKeyOf, fmtDateLong, fmtDateShort, hhmm, minutesOfDay } from '../domain/time'
import type { BusinessId, FixtureId, Role } from '../domain/types'
import type { ThemePref } from '../domain/persistence'
import { THEME_LABEL } from './theme'
import { BIZ_IDS, BIZ_ROUTE_RE } from '../domain/business'

export { BIZ_IDS }

export function DemoBanner() {
  const { storageMode } = useSnapshot()
  const ref = useRef<HTMLDivElement>(null)
  // la altura real del banner fija los "sticky" de debajo (categorías, ticket, menú admin)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(() => document.documentElement.style.setProperty('--banner-h', `${Math.ceil(el.getBoundingClientRect().height)}px`))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return (
    <div className="demo-banner" role="region" aria-label="Aviso de demostración" ref={ref}>
      <span>
        <strong className="seal">DEMO</strong>
        <span>Datos ficticios</span>
        <span className="long"> · no se envía, cobra, publica ni conecta nada · sin validez fiscal</span>
        <span className="short"> · nada se envía ni se cobra</span>
      </span>
      <span className="mode">{storageMode === 'local' ? 'Guardado solo en este navegador' : 'Solo en memoria: se pierde al recargar'}</span>
    </div>
  )
}

export function StatusStrips() {
  const { warning, notice } = useSnapshot()
  return (
    <>
      {warning && (
        <div className="storage-warning" role="alert" data-testid="storage-warning">
          <span>⚠ {warning}</span>
        </div>
      )}
      {notice && (
        <div className="notice" role="status">
          <span>{notice}</span>
          <button className="linklike" type="button" onClick={dismissNotice}>
            Cerrar aviso
          </button>
        </div>
      )}
    </>
  )
}

const JUMPS: { label: string; minutes: number }[] = [
  { label: 'Ir a las 08:00', minutes: 8 * 60 },
  { label: 'Ir a las 12:00 (almuerzo)', minutes: 12 * 60 },
  { label: 'Ir a las 20:00 (cena)', minutes: 20 * 60 },
  { label: 'Ir a las 21:45', minutes: 21 * 60 + 45 },
]

/** Casos para presentar: combinan negocio, rol, hora y pantalla con comandos que ya existen. */
interface DemoCase { id: string; title: string; hint: string; biz?: BusinessId; role: Role; at?: number; to: (b: BusinessId) => string }
const CASES: DemoCase[] = [
  { id: 'almuerzo', title: 'Almuerzo en Mesa Clara', hint: '12:00 · carta abierta y pedido a la mesa', biz: 'mesa-clara', role: 'cliente-invitado', at: 12 * 60, to: () => '/mesa-clara/carta' },
  { id: 'retiro', title: 'Retiro en Ritual Café', hint: '08:00 · un café para llevar', biz: 'ritual-cafe', role: 'cliente-invitado', at: 8 * 60, to: () => '/ritual-cafe/carta' },
  { id: 'cocina', title: 'Cocina en hora pico', hint: '20:00 · comandas en el tablero', biz: 'mesa-clara', role: 'cocina', at: 20 * 60, to: () => '/admin/cocina' },
  { id: 'helado', title: 'Un helado en Copo', hint: '16:00 · gustos, retiro y pago en el mostrador', biz: 'copo', role: 'cliente-invitado', at: 16 * 60, to: () => '/copo/carta' },
  { id: 'brasa', title: 'Mostrador de Brasa Rápida', hint: '10:00 · plancha, freidora y números de retiro', biz: 'brasa', role: 'cocina', at: 10 * 60, to: () => '/admin/cocina' },
  { id: 'jazz', title: 'Noche de jazz en Compás', hint: 'Agenda y reserva de mesa por solicitud', biz: 'compas', role: 'cliente-invitado', to: () => '/compas/catas' },
  // el pasaporte es de Mesa Clara y Ritual Café (la fidelización de los negocios nuevos llega en L6)
  { id: 'ana', title: 'Vuelve Ana', hint: 'Pasaporte con sellos e historial', role: 'cliente-recurrente', to: (b) => `/${b === 'ritual-cafe' ? b : 'mesa-clara'}/pasaporte` },
  { id: 'cierre', title: 'Cierre de caja', hint: '21:45 · cuentas y pagos de demostración', biz: 'mesa-clara', role: 'caja', at: 21 * 60 + 45, to: () => '/admin/caja' },
]

/** Navegación al cambiar de rol: el negocio y los registros se conservan. */
function useRoleNav() {
  const { state } = useSnapshot()
  const nav = useNavigate()
  const loc = useLocation()
  return (role: Role) => {
    act({ type: 'session/setRole', role }, `Vista de ${ROLE_LABEL[role]}`)
    const biz = state.session.businessId
    if (isClientRole(role)) {
      if (loc.pathname.startsWith('/admin')) nav(`/${biz}`)
    } else nav(`/admin/${DEFAULT_ADMIN[role]}`)
  }
}

/**
 * P5-L3 · Dock de la demo: reemplaza la consola superior. Abajo a la derecha en escritorio y en la franja DEMO
 * cuando hay barra inferior; se cierra con Escape, con un clic afuera y al cambiar de rol o de negocio.
 */
export function DemoDock() {
  const { state, prefs } = useSnapshot()
  const nav = useNavigate()
  const loc = useLocation()
  const onRole = useRoleNav()
  const [resetOpen, setResetOpen] = useState(false)
  const [guide, setGuide] = useState(false)
  const [open, setOpen] = useState(false)
  const [fx, setFx] = useState<FixtureId>('servicio')
  const rootRef = useRef<HTMLDivElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)
  const biz = state.session.businessId
  const locs = state.locations.filter((l) => l.businessId === biz)
  const now = state.clock.nowMs

  const close = (focusToggle = true) => {
    setOpen(false)
    if (focusToggle) toggleRef.current?.focus()
  }
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !document.querySelector('dialog[open]')) close()
    }
    const onDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node) && !(e.target as Element).closest?.('dialog')) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onDown)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onDown)
    }
  }, [open])

  const switchBiz = (b: BusinessId) => {
    dispatch({ type: 'session/setBusiness', businessId: b })
    const m = BIZ_ROUTE_RE.exec(loc.pathname)
    if (m) {
      const rest = m[2] ?? ''
      // los folios son de un negocio: al cambiar de perfil se vuelve a la sección, no al registro
      nav(`/${b}${/^\/(pedido|reservas|regalo)\/[^/]+/.test(rest) ? rest.split('/').slice(0, 2).join('/').replace('/regalo', '/regalar') : rest}`)
    } else if (/^\/admin\/(pedidos|reservas|clientes)\/[^/]+/.test(loc.pathname)) {
      nav(loc.pathname.split('/').slice(0, 3).join('/'))
    }
  }
  const runCase = (c: DemoCase) => {
    const b = c.biz ?? biz
    if (b !== biz) dispatch({ type: 'session/setBusiness', businessId: b })
    dispatch({ type: 'session/setRole', role: c.role })
    if (c.at !== undefined) dispatch({ type: 'clock/jump', minutes: c.at })
    announce(`Caso: ${c.title}`)
    close(false)
    nav(c.to(b))
  }
  const when = `${fmtDateShort(dateKeyOf(now))} · ${hhmm(minutesOfDay(now))}`
  const dayShort = fmtDateShort(dateKeyOf(now)).replace(/^(\S{3})\S*/, '$1')
  return (
    <div className="dock" role="region" aria-label="Controles de la demo" data-open={open} ref={rootRef}>
      <div className="dock-panel" id="dock-panel" hidden={!open} data-testid="dock-panel">
        <div className="dock-head">
          <div>
            <h2>Controles de la demo</h2>
            <p>Para presentar. No forman parte del producto.</p>
          </div>
          <button type="button" className="dock-close" onClick={() => close()} aria-label="Cerrar controles">
            <Glyph name="x" size={18} />
          </button>
        </div>

        <section className="dock-sec" aria-labelledby="dock-rol">
          <h3 id="dock-rol">Rol y negocio</h3>
          <label className="cfield">
            Rol (vista, no permisos)
            <select value={state.session.role} onChange={(e) => { onRole(e.target.value as Role); close() }} data-testid="role-select">
              {(Object.keys(ROLE_LABEL) as Role[]).map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABEL[r]}
                </option>
              ))}
            </select>
          </label>
          <p className="role-desc" data-testid="role-desc">{ROLE_DESC[state.session.role]}</p>
          <div className="row2">
            <label className="cfield">
              Negocio ficticio
              <select value={biz} onChange={(e) => { switchBiz(e.target.value as BusinessId); close() }} data-testid="biz-select">
                {BIZ_IDS.map((b) => (
                  <option key={b} value={b}>
                    {state.businesses.find((x) => x.id === b)!.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="cfield">
              Sede
              <select value={state.session.locationByBusiness[biz]} onChange={(e) => { act({ type: 'session/setLocation', locationId: e.target.value }, `Sede: ${sedeShort(state.locations.find((l) => l.id === e.target.value)?.name ?? '')}`); close() }} data-testid="loc-select">
                {locs.map((l) => (
                  <option key={l.id} value={l.id}>
                    {sedeShort(l.name)}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <section className="dock-sec" aria-labelledby="dock-casos">
          <h3 id="dock-casos">Reloj y casos</h3>
          <div className="clock-row" role="group" aria-label="Reloj simulado">
            <span className="clock-now" data-testid="sim-clock" title={fmtDateLong(dateKeyOf(now))}>
              <Glyph name="clock" size={18} />
              <span>
                <span className="sr-only">Día simulado: </span>
                <time dateTime={new Date(now).toISOString()}>{when}</time>
              </span>
            </span>
            <button className="cbtn" type="button" onClick={() => act({ type: 'clock/advance', minutes: 15 }, 'Reloj +15 min')} data-testid="clock-15">
              +15 min
            </button>
            <button className="cbtn" type="button" onClick={() => act({ type: 'clock/advance', minutes: 60 }, 'Reloj +1 h')} data-testid="clock-60">
              +1 h
            </button>
            <label>
              <span className="sr-only">Saltar a una hora</span>
              <select
                aria-label="Saltar a una hora"
                value=""
                data-testid="clock-jump"
                onChange={(e) => {
                  const j = JUMPS[Number(e.target.value)]
                  if (j) act({ type: 'clock/jump', minutes: j.minutes }, `Reloj en ${hhmm(j.minutes)}`)
                }}
              >
                <option value="">Saltar a…</option>
                {JUMPS.map((j, i) => (
                  <option key={j.label} value={i}>
                    {j.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <ul className="cases" aria-label="Casos para mostrar">
            {CASES.map((c) => (
              <li key={c.id}>
                <button type="button" onClick={() => runCase(c)} data-testid={`case-${c.id}`}>
                  <b>{c.title}</b>
                  <span>{c.hint}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="dock-sec" aria-labelledby="dock-vista">
          <h3 id="dock-vista">Vista y presentación</h3>
          <fieldset className="theme-seg" data-testid="theme-control">
            <legend>Tema de color</legend>
            {(['system', 'light', 'dark'] as ThemePref[]).map((t) => (
              <label key={t}>
                <input type="radio" name="tf-theme" value={t} checked={prefs.theme === t} onChange={() => setPrefs({ theme: t })} data-testid={`theme-${t}`} />
                {THEME_LABEL[t]}
              </label>
            ))}
          </fieldset>
          <div className="tools">
            <button
              className="cbtn"
              type="button"
              aria-pressed={prefs.uiSounds}
              data-testid="sfx-toggle"
              title="Sonidos cortos al agregar, enviar o abrir un regalo. Apagados por defecto; el volumen se ajusta en Configuración."
              onClick={() => {
                const on = !prefs.uiSounds
                setPrefs({ uiSounds: on })
                if (on) sfx('tap', { force: true })
              }}
            >
              <Glyph name={prefs.uiSounds ? 'volume' : 'mute'} size={16} /> Sonidos
            </button>
            <button
              className="cbtn"
              type="button"
              aria-pressed={prefs.reducedMotion === 'on'}
              data-testid="motion-toggle"
              title="Reduce o quita los desplazamientos animados. Por defecto sigue la preferencia del sistema."
              onClick={() => setPrefs({ reducedMotion: prefs.reducedMotion === 'on' ? 'auto' : 'on' })}
            >
              <Glyph name={prefs.reducedMotion === 'on' ? 'check' : 'sliders'} size={16} /> Reducir movimiento
            </button>
            <button className="cbtn" type="button" onClick={() => { close(false); setGuide(true) }} data-testid="guide-open" aria-haspopup="dialog">
              <Glyph name="book" size={16} /> Guía de la demo
            </button>
            <button className="cbtn" type="button" onClick={() => { close(false); nav('/escenas') }} data-testid="scenes-open">
              <Glyph name="film" size={16} /> Escenas guiadas
            </button>
            <button className="cbtn danger" type="button" onClick={() => { close(false); setResetOpen(true) }} data-testid="reset-open" aria-haspopup="dialog">
              <Glyph name="restart" size={16} /> Reiniciar demo
            </button>
          </div>
          <p className="small muted dock-trailer" data-testid="trailer-status">Tráiler: todavía no existe (no se grabó ningún video). Las escenas guiadas muestran el producto en vivo.</p>
        </section>
      </div>
      <button
        ref={toggleRef}
        type="button"
        className="dock-toggle"
        aria-expanded={open}
        aria-controls="dock-panel"
        aria-label={`Controles de la demo (reloj ${dayShort} ${hhmm(minutesOfDay(now))})`}
        data-testid="dock-toggle"
        onClick={() => setOpen((v) => !v)}
      >
        <Glyph name="sliders" size={16} />
        <span>Demo</span>
        <span className="when" aria-hidden="true">{dayShort} {hhmm(minutesOfDay(now))}</span>
        <Glyph name="chevron" size={14} className="chev" />
      </button>
      <Dialog open={guide} onClose={() => setGuide(false)} title="Guía de la demo" className="guide" testId="guide">
        <DemoGuide biz={biz} onDone={() => setGuide(false)} />
      </Dialog>
      <ConfirmDialog
        open={resetOpen}
        title="Reiniciar la demo"
        confirmLabel="Reiniciar demo"
        danger
        onCancel={() => setResetOpen(false)}
        onConfirm={() => {
          resetDemo(fx)
          setResetOpen(false)
          nav('/')
        }}
        body={
          <>
            <p>
              Se borran <strong>solo los datos de TableFlow</strong> de este navegador (claves <code>tableflow.demo.v1*</code>) y se restaura el seed elegido, con el reloj en lunes 19/10/2026 10:00. Se conserva el tema de color. No se toca nada más. Si cancelás, se conserva el estado actual.
            </p>
            <fieldset>
              <legend>Seed</legend>
              <label className="choice">
                <input type="radio" name="fx" checked={fx === 'servicio'} onChange={() => setFx('servicio')} /> Servicio cargado (cinco negocios: 21 reservas, 17 pedidos, 14 clientes…)
              </label>
              <label className="choice">
                <input type="radio" name="fx" checked={fx === 'vacio'} onChange={() => setFx('vacio')} /> Vacío (perfiles, carta y stock sin actividad)
              </label>
            </fieldset>
          </>
        }
      />
    </div>
  )
}

/**
 * P5-L3 · Selector de rol de bienvenida: aparece una sola vez, en la portada, cuando la página ya cargó del todo.
 * Se puede omitir y el rol se cambia después desde el dock.
 */
export function RoleIntro() {
  const { prefs, phase } = useSnapshot()
  const { pathname } = useLocation()
  const onRole = useRoleNav()
  const [ready, setReady] = useState(false)
  useEffect(() => {
    if (document.readyState === 'complete') {
      const t = window.setTimeout(() => setReady(true), 250)
      return () => clearTimeout(t)
    }
    const on = () => setReady(true)
    window.addEventListener('load', on, { once: true })
    return () => window.removeEventListener('load', on)
  }, [])
  const open = ready && phase === 'ready' && pathname === '/' && !prefs.roleIntroSeen
  const done = () => setPrefs({ roleIntroSeen: true })
  return (
    <Dialog open={open} onClose={done} title="¿Desde qué lugar querés recorrer la demo?" className="role-intro" testId="role-intro">
      <p className="muted">Cada rol muestra otras pantallas del mismo negocio. Son vistas de la demo, no permisos. Lo podés cambiar cuando quieras desde el botón <strong>Demo</strong>.</p>
      <ul className="role-cards">
        {(Object.keys(ROLE_LABEL) as Role[]).map((r) => (
          <li key={r}>
            <button type="button" onClick={() => { done(); onRole(r) }} data-testid={`role-intro-${r}`}>
              <b>{ROLE_LABEL[r]}</b>
              <span>{ROLE_DESC[r]}</span>
            </button>
          </li>
        ))}
      </ul>
      <div className="dialog-actions">
        <button className="btn secondary" type="button" onClick={done} data-testid="role-intro-skip">Omitir por ahora</button>
      </div>
    </Dialog>
  )
}

/** Recorridos sugeridos para quien muestra la demo (capa de demo, fuera del producto). */
function DemoGuide({ biz, onDone }: { biz: BusinessId; onDone: () => void }) {
  const nav = useNavigate()
  const go = (to: string) => { onDone(); nav(to) }
  const rest = biz === 'mesa-clara'
  const legacy = biz === 'mesa-clara' || biz === 'ritual-cafe'
  const NEW_GUIDE: Partial<Record<BusinessId, { title: string; steps: ReactNode[] }>> = {
    copo: { title: 'Copo · del gusto al mostrador', steps: [
      <><button className="linklike" type="button" onClick={() => go('/copo/carta')}>Elegí un cucurucho de dos gustos</button>: el sambayón está agotado y no se puede marcar.</>,
      <>Pedilo para retirar: queda confirmado con <strong>pago en el local pendiente</strong>.</>,
      <>Como mostrador aceptá, prepará y marcá listo; en caja cobrá la cuenta del retiro.</>,
    ] },
    compas: { title: 'Taberna Compás · agenda y reserva', steps: [
      <><button className="linklike" type="button" onClick={() => go('/compas/catas')}>Mirá la agenda</button>: no hay entradas, se reserva la mesa.</>,
      <>Reservá para el jueves: la mesa de 10 del seed espera revisión humana.</>,
      <>Como recepción confirmá la solicitud desde Reservas.</>,
    ] },
    brasa: { title: 'Brasa Rápida · combo y número', steps: [
      <><button className="linklike" type="button" onClick={() => go('/brasa/carta/BR-01')}>Armá un combo</button>: tamaño, acompañamiento y bebida son obligatorios.</>,
      <>Pedilo para retirar y abrí <button className="linklike" type="button" onClick={() => go('/brasa/numeros')}>la pantalla de números</button>.</>,
      <>Como cocina avanzalo por plancha, freidora y armado: el número pasa a Listo en la pantalla.</>,
    ] },
  }
  const g = NEW_GUIDE[biz]
  return (
    <div className="guide-body">
      <p className="muted">Recorridos de 60–90 segundos. Todo es local y simulado; el reloj solo avanza desde el botón Demo.</p>
      <h3>{g ? g.title : rest ? 'Mesa Clara · del pedido al cierre' : 'Ritual Café · del pedido al retiro'}</h3>
      {g ? (
        <ol className="steps">{g.steps.map((s, i) => <li key={i}><span>{s}</span></li>)}</ol>
      ) : rest ? (
        <ol className="steps">
          <li><span>Pasá el reloj a las 12:00 (el salón abre al mediodía). <button className="linklike" type="button" onClick={() => act({ type: 'clock/jump', minutes: 12 * 60 }, 'Reloj en 12:00')}>Ir a las 12:00</button></span></li>
          <li><span><button className="linklike" type="button" onClick={() => go('/mesa-clara/carta')}>Elegí una milanesa</button> con guarnición y agregala.</span></li>
          <li><span>En Mi pedido indicá tu mesa y enviá: vas a ver el folio.</span></li>
          <li><span>Como recepción aceptá; en cocina prepará y marcá listo; el mozo lo sirve.</span></li>
          <li><span>En caja abrí la caja, dividí la cuenta, registrá los pagos DEMO y cerrá la mesa.</span></li>
        </ol>
      ) : (
        <ol className="steps">
          <li><span>Elegí la sede (Centro o Norte) desde el botón Demo.</span></li>
          <li><span><button className="linklike" type="button" onClick={() => go('/ritual-cafe/carta')}>Configurá un flat white</button> (tamaño y leche) y pedilo para retirar.</span></li>
          <li><span>Como barra aceptá, prepará y marcá listo; después marcá retirado.</span></li>
        </ol>
      )}
      <p><button className="linklike" type="button" onClick={() => go('/guia')} data-testid="guide-full">Guía completa por rol y tarea</button> · <button className="linklike" type="button" onClick={() => go('/escenas')}>Escenas guiadas</button></p>
      <h3>Más para mostrar</h3>
      <ul className="guide-links">
        <li><button className="linklike" type="button" onClick={() => go(`/${biz}/regalar`)}>Invitar a alguien a comer</button> · tarjeta, mensaje simulado y canje en el pedido</li>
        <li><button className="linklike" type="button" onClick={() => go(`/${biz}/chicos`)}>Zona familiar</button> · un juego distinto en cada negocio</li>
        {legacy && <li><button className="linklike" type="button" onClick={() => go(`/${biz}/simulador`)}>Simulador de canales</button> · reserva por WhatsApp o llamada</li>}
        {legacy && <li><button className="linklike" type="button" onClick={() => { act({ type: 'session/setRole', role: 'cliente-recurrente' }, 'Ahora sos Ana (cliente recurrente)'); go(`/${biz}/pasaporte`) }}>Verme como Ana</button> · pasaporte con sellos e historial</li>}
        <li><button className="linklike" type="button" onClick={() => go('/arte')}>Ilustraciones y personajes</button> · el sistema visual completo</li>
      </ul>
    </div>
  )
}

export function Footer() {
  return (
    <footer className="site">
      <div className="wrap">
        <p>
          <DemoTag /> TableFlow · demo local con datos ficticios. WhatsApp, llamada, pagos y regalos son simulaciones. <Link to="/comercial">Alcance de la demo</Link>
        </p>
      </div>
    </footer>
  )
}

export function PageHead({ title, children, sub, eyebrow, heading, className }: { title: string; children?: ReactNode; sub?: ReactNode; eyebrow?: ReactNode; heading?: ReactNode; className?: string }) {
  useEffect(() => {
    document.title = `${title} · TableFlow demo`
  }, [title])
  return (
    <div className={`page-title ${className ?? ''}`}>
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 tabIndex={-1} id="page-h1">{heading ?? title}</h1>
        {sub && <p className="sub">{sub}</p>}
      </div>
      {children && <div className="row">{children}</div>}
    </div>
  )
}

export function MainNavLink({ to, children, end, onClick, ...rest }: { to: string; children: ReactNode; end?: boolean; onClick?: () => void; [k: string]: unknown }) {
  return (
    <NavLink to={to} end={end} onClick={onClick} {...rest}>
      {children}
    </NavLink>
  )
}
