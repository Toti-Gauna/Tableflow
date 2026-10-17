import { Link, useNavigate } from 'react-router-dom'
import { PageHead } from '../ui/Shell'
import { act } from '../ui/kit'
import { Glyph } from '../ui/glyphs'
import { useApp } from '../store'
import { DEFAULT_ADMIN } from '../ui/format'
import type { Role } from '../domain/types'

const STAFF: { role: Role; label: string; icon: string; does: string }[] = [
  { role: 'recepcion', label: 'Recepción', icon: 'calendar', does: 'Solicitudes, revisión humana y llegadas.' },
  { role: 'mozo', label: 'Mozo', icon: 'floor', does: 'Plano del salón, mesas y pedidos servidos.' },
  { role: 'cocina', label: 'Cocina / barra', icon: 'flame', does: 'Cola por estación, sin arrastre.' },
  { role: 'caja', label: 'Caja', icon: 'register', does: 'Cuenta dividida, pagos DEMO y cierre.' },
  { role: 'encargado', label: 'Encargado', icon: 'grid', does: 'Pendientes, automatizaciones y reportes.' },
]

const COVER: Record<string, { lines: string[]; mark: string }> = {
  'mesa-clara': { lines: ['Pastas amasadas cada mañana', 'Minutas y parrilla', 'Reservas con confirmación'], mark: 'empanada' },
  'ritual-cafe': { lines: ['Métodos y orígenes', 'Pastelería del día', 'Retiro por franja, sin reservas'], mark: 'cup' },
}

export function Landing() {
  const state = useApp()
  const nav = useNavigate()
  const goStaff = (role: Role) => {
    act({ type: 'session/setRole', role })
    nav(`/admin/${DEFAULT_ADMIN[role]}`)
  }
  return (
    <main className="wrap landing">
      <PageHead
        title="TableFlow · demo de gestión gastronómica"
        eyebrow="TableFlow · demo local"
        heading={<>Del salón a la barra, <em>una sola mesa de trabajo.</em></>}
        sub="Dos negocios ficticios, todos los módulos y un estado que vive en este navegador: sin backend, pagos, mensajes ni llamadas reales."
      />
      <div className="covers">
        {state.businesses.map((b) => (
          <section key={b.id} className="cover fx-scene" data-biz={b.id} aria-labelledby={`b-${b.id}`}>
            <Glyph name={COVER[b.id].mark} size={44} className="mark" />
            <p className="eyebrow">{b.kind === 'bodegon' ? 'Bodegón' : 'Café de especialidad'} · ficticio</p>
            <h2 id={`b-${b.id}`}>{b.name}</h2>
            <p className="tag">{b.tagline}</p>
            <ul>
              {COVER[b.id].lines.map((l) => <li key={l}>{l}</li>)}
            </ul>
            <div className="row">
              <Link className="btn" to={`/${b.id}`} onClick={() => act({ type: 'session/setBusiness', businessId: b.id })}>Entrar como cliente</Link>
              <Link className="btn secondary" to={`/${b.id}/carta`} onClick={() => act({ type: 'session/setBusiness', businessId: b.id })}>Ver la carta</Link>
            </div>
          </section>
        ))}
      </div>
      <section aria-labelledby="staff" className="home-sec">
        <p className="eyebrow">Vistas didácticas: muestran pantallas, no permisos</p>
        <h2 id="staff">Entrar como personal</h2>
        <div className="staff">
          {STAFF.map((s) => (
            <button key={s.role} className="staff-card" type="button" onClick={() => goStaff(s.role)}>
              <Glyph name={s.icon} size={24} />
              <span>
                <strong>{s.label}</strong>
                <span className="muted small">{s.does}</span>
              </span>
            </button>
          ))}
        </div>
      </section>
      <p className="home-sec">
        <Link to="/comercial">Qué muestra esta demo y cómo se contrata (alcance comercial)</Link> · <Link to="/simulador">Simulador de WhatsApp y llamada</Link>
      </p>
    </main>
  )
}
