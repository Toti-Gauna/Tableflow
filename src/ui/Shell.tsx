import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { act, ConfirmDialog, DemoTag, Dialog } from './kit'
import { Glyph } from './glyphs'
import { DEFAULT_ADMIN, isClientRole, ROLE_LABEL, sedeShort } from './format'
import { dismissNotice, dispatch, resetDemo, setPrefs, useSnapshot } from '../store'
import { sfx } from './sfx'
import { dateKeyOf, fmtDateLong, fmtDateShort, hhmm, minutesOfDay } from '../domain/time'
import type { BusinessId, FixtureId, Role } from '../domain/types'

export const BIZ_IDS: BusinessId[] = ['mesa-clara', 'ritual-cafe']

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

export function DemoBar() {
  const { state, prefs } = useSnapshot()
  const nav = useNavigate()
  const loc = useLocation()
  const [resetOpen, setResetOpen] = useState(false)
  const [guide, setGuide] = useState(false)
  const [open, setOpen] = useState(false)
  const [fx, setFx] = useState<FixtureId>('servicio')
  const biz = state.session.businessId
  const locs = state.locations.filter((l) => l.businessId === biz)
  const now = state.clock.nowMs

  const onRole = (role: Role) => {
    act({ type: 'session/setRole', role })
    if (isClientRole(role)) {
      if (loc.pathname.startsWith('/admin') || loc.pathname === '/') nav(`/${biz}`)
    } else nav(`/admin/${DEFAULT_ADMIN[role]}`)
  }
  const onBiz = (b: BusinessId) => {
    dispatch({ type: 'session/setBusiness', businessId: b })
    const m = /^\/(mesa-clara|ritual-cafe)(\/.*)?$/.exec(loc.pathname)
    if (m) {
      const rest = m[2] ?? ''
      // los folios son de un negocio: al cambiar de perfil se vuelve a la sección, no al registro
      nav(`/${b}${/^\/(pedido|reservas)\/[^/]+/.test(rest) ? rest.split('/').slice(0, 2).join('/') : rest}`)
    }
  }
  const when = `${fmtDateShort(dateKeyOf(now))} · ${hhmm(minutesOfDay(now))}`
  const dayShort = fmtDateShort(dateKeyOf(now)).replace(/^(\S{3})\S*/, '$1')
  return (
    <div className="console" role="region" aria-label="Controles de la demo" data-open={open}>
      <div className="console-inner">
        <button type="button" className="cbtn console-toggle" aria-expanded={open} aria-controls="console-panel" onClick={() => setOpen((v) => !v)}>
          <Glyph name="sliders" size={18} /> Controles<span className="sr-only"> de la demo</span> <Glyph name="chevron" size={16} />
        </button>
        <span className="console-mini" aria-hidden="true">
          <Glyph name="clock" size={16} /> {dayShort} · {hhmm(minutesOfDay(now))}
        </span>
        <div className="console-panel" id="console-panel">
        <label className="cfield">
          Rol (vista, no permisos)
          <select value={state.session.role} onChange={(e) => onRole(e.target.value as Role)} data-testid="role-select">
            {(Object.keys(ROLE_LABEL) as Role[]).map((r) => (
              <option key={r} value={r}>
                {ROLE_LABEL[r]}
              </option>
            ))}
          </select>
        </label>
        <label className="cfield">
          Perfil ficticio
          <select value={biz} onChange={(e) => onBiz(e.target.value as BusinessId)} data-testid="biz-select">
            {BIZ_IDS.map((b) => (
              <option key={b} value={b}>
                {state.businesses.find((x) => x.id === b)!.name}
              </option>
            ))}
          </select>
        </label>
        <label className="cfield">
          Sede
          <select value={state.session.locationByBusiness[biz]} onChange={(e) => dispatch({ type: 'session/setLocation', locationId: e.target.value })} data-testid="loc-select">
            {locs.map((l) => (
              <option key={l.id} value={l.id}>
                {sedeShort(l.name)}
              </option>
            ))}
          </select>
        </label>
        <span className="sep" aria-hidden="true" />
        <div className="clock" role="group" aria-label="Reloj simulado">
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
          <span className="sep" aria-hidden="true" />
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
            <Glyph name={prefs.uiSounds ? 'volume' : 'mute'} size={16} />
            <span className="wide-only">Sonidos de interfaz</span>
          </button>
          <button
            className="cbtn"
            type="button"
            aria-pressed={prefs.reducedMotion === 'on'}
            title="Reduce o quita los desplazamientos animados. Por defecto sigue la preferencia del sistema."
            onClick={() => setPrefs({ reducedMotion: prefs.reducedMotion === 'on' ? 'auto' : 'on' })}
          >
            <Glyph name={prefs.reducedMotion === 'on' ? 'check' : 'sliders'} size={16} />
            <span className="wide-only">Reducir movimiento</span>
          </button>
          <button className="cbtn" type="button" onClick={() => setGuide(true)} data-testid="guide-open" aria-haspopup="dialog">
            <Glyph name="book" size={16} /> <span className="wide-only">Guía de la demo</span>
          </button>
          <button className="cbtn" type="button" onClick={() => setResetOpen(true)} data-testid="reset-open">
            <Glyph name="restart" size={16} /> <span className="xl-only">Reiniciar</span><span className="sr-only"> demo</span>
          </button>
        </div>
        </div>
      </div>
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
              Se borran <strong>solo los datos de TableFlow</strong> de este navegador (claves <code>tableflow.demo.v1*</code>) y se restaura el seed elegido, con el reloj en lunes 19/10/2026 10:00. No se toca nada más. Si cancelás, se conserva el estado actual.
            </p>
            <fieldset>
              <legend>Seed</legend>
              <label className="choice">
                <input type="radio" name="fx" checked={fx === 'servicio'} onChange={() => setFx('servicio')} /> Servicio cargado (18 reservas, 12 pedidos, 8 clientes…)
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

/** Recorridos sugeridos para quien muestra la demo (capa de demo, fuera del producto). */
function DemoGuide({ biz, onDone }: { biz: BusinessId; onDone: () => void }) {
  const nav = useNavigate()
  const go = (to: string) => { onDone(); nav(to) }
  const rest = biz === 'mesa-clara'
  return (
    <div className="guide-body">
      <p className="muted">Recorridos de 60–90 segundos. Todo es local y simulado; el reloj solo avanza con los controles.</p>
      <h3>{rest ? 'Mesa Clara · del pedido al cierre' : 'Ritual Café · del pedido al retiro'}</h3>
      {rest ? (
        <ol className="steps">
          <li><span>Pasá el reloj a las 12:00 (el salón abre al mediodía). <button className="linklike" type="button" onClick={() => act({ type: 'clock/jump', minutes: 12 * 60 }, 'Reloj en 12:00')}>Ir a las 12:00</button></span></li>
          <li><span><button className="linklike" type="button" onClick={() => go('/mesa-clara/carta')}>Elegí una milanesa</button> con guarnición y agregala.</span></li>
          <li><span>En Mi pedido indicá tu mesa y enviá: vas a ver el folio.</span></li>
          <li><span>Como recepción aceptá; en cocina prepará y marcá listo; el mozo lo sirve.</span></li>
          <li><span>En caja abrí la caja, dividí la cuenta, registrá los pagos DEMO y cerrá la mesa.</span></li>
        </ol>
      ) : (
        <ol className="steps">
          <li><span>Elegí la sede (Centro o Norte) en los controles.</span></li>
          <li><span><button className="linklike" type="button" onClick={() => go('/ritual-cafe/carta')}>Configurá un flat white</button> (tamaño y leche) y pedilo para retirar.</span></li>
          <li><span>Como barra aceptá, prepará y marcá listo; después marcá retirado.</span></li>
        </ol>
      )}
      <h3>Más para mostrar</h3>
      <ul className="guide-links">
        <li><button className="linklike" type="button" onClick={() => go(`/${biz}/regalar`)}>Invitar a alguien a comer</button> · tarjeta, mensaje simulado y canje en el pedido</li>
        <li><button className="linklike" type="button" onClick={() => go(`/${biz}/chicos`)}>Para chicos</button> · memotest y “Armá tu plato”</li>
        <li><button className="linklike" type="button" onClick={() => go(`/${biz}/simulador`)}>Simulador de canales</button> · reserva por WhatsApp o llamada</li>
        <li><button className="linklike" type="button" onClick={() => { act({ type: 'session/setRole', role: 'cliente-recurrente' }, 'Ahora sos Ana (cliente recurrente)'); go(`/${biz}/pasaporte`) }}>Verme como Ana</button> · pasaporte con sellos e historial</li>
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
