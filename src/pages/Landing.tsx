import { openEclipse } from '../ui/eclipseHost'
import { Link, useNavigate } from 'react-router-dom'
import { PageHead } from '../ui/Shell'
import { act } from '../ui/kit'
import { Glyph } from '../ui/glyphs'
import { useApp } from '../store'
import { DEFAULT_ADMIN } from '../ui/format'
import { BodegonArt } from '../ui/art/scenes/bodegon'
import { SalonArt } from '../ui/art/scenes/salon'
import { DishArt } from '../ui/art'
import { SeasonArt } from '../ui/art/season'
import { activeSeason } from '../domain/season'
import type { Role } from '../domain/types'

const STAFF: { role: Role; label: string; icon: string; does: string }[] = [
  { role: 'recepcion', label: 'Recepción', icon: 'calendar', does: 'Solicitudes y llegadas' },
  { role: 'mozo', label: 'Mozo', icon: 'floor', does: 'Plano del salón' },
  { role: 'cocina', label: 'Cocina / barra', icon: 'flame', does: 'Comandas por estación' },
  { role: 'caja', label: 'Caja', icon: 'register', does: 'Cuentas y cierre' },
  { role: 'encargado', label: 'Encargado', icon: 'grid', does: 'Pendientes y reportes' },
]

const COVER: Record<string, string[]> = {
  'mesa-clara': ['Pastas amasadas cada mañana', 'Minutas y parrilla', 'Reservas con confirmación'],
  'ritual-cafe': ['Métodos y orígenes', 'Pastelería del día', 'Retiro por franja, sin reservas'],
  copo: ['Vitrina con el estado de cada bacha', 'Cupo de gustos por formato', 'Retirás y pagás en el mostrador'],
  compas: ['Tapas en Lado A y Lado B', 'Agenda de música en vivo', 'Reserva por solicitud · +18 en la barra'],
  brasa: ['Combos armados por pasos', 'Número de retiro en pantalla', 'Pagás en el local al retirar'],
}
const EYEBROW: Record<string, string> = { bodegon: 'Bodegón', cafe: 'Café de especialidad', heladeria: 'Heladería', bar: 'Bar gastronómico', rapida: 'Comida rápida' }
/** Plato firma de la tapa de cada negocio nuevo (pieza de su familia de arte, P5-L4). */
const COVER_PIECE: Record<string, string> = { copo: 'CO-02', compas: 'TC-01', brasa: 'BR-01' }

export function Landing() {
  const state = useApp()
  const nav = useNavigate()
  const season = activeSeason(state, 'mesa-clara')
  const goStaff = (role: Role) => {
    act({ type: 'session/setRole', role })
    nav(`/admin/${DEFAULT_ADMIN[role]}`)
  }
  const enter = (b: string) => act({ type: 'session/setBusiness', businessId: b })
  const milanesa = state.menuItems.find((m) => m.id === 'MC-12')
  return (
    <main className="wrap landing">
      <PageHead
        title="TableFlow · demo de gestión gastronómica"
        eyebrow="TableFlow"
        heading={<>Del salón a la barra, <em>una sola mesa de trabajo.</em></>}
        sub="Carta, reservas, pedidos para retirar, cocina, caja y regalos de cinco negocios ficticios (bodegón, café, heladería, bar y comida rápida), conectados en una sola experiencia para el comensal y para el equipo."
      />
      <section className="discover card" aria-labelledby="disc" data-testid="discover">
        <h2 id="disc">Probalo sin la consola</h2>
        <p className="small muted">Tres maneras de entenderlo solo: mirarlo, practicarlo o ver qué costaría en tu negocio.</p>
        <div className="row">
          <Link className="btn" to="/escenas" data-testid="discover-scenes">Ver escenas guiadas</Link>
          <Link className="btn secondary" to="/guia" data-testid="discover-guide">Practicar con la guía</Link>
          <button type="button" className="btn secondary" onClick={() => openEclipse('boton')} data-testid="discover-adapt">Adaptarlo a mi negocio</button>
        </div>
      </section>
      <div className="covers">
        {state.businesses.map((b) => (
          <section key={b.id} className="cover cover-v2 fx-scene" data-biz={b.id} aria-labelledby={`b-${b.id}`}>
            <div className={`cover-art${COVER_PIECE[b.id] ? ' cover-piece' : ''}`} aria-hidden="true">{b.id === 'mesa-clara' ? <BodegonArt className="art" slice compact /> : b.id === 'ritual-cafe' ? <SalonArt className="art" slice /> : <DishArt item={{ id: COVER_PIECE[b.id], name: b.name }} size={200} decorative />}</div>
            <div className="cover-body">
              <p className="eyebrow">{EYEBROW[b.kind]}</p>
              <h2 id={`b-${b.id}`}>{b.name}</h2>
              <p className="tag">{b.tagline}</p>
              <ul>
                {(COVER[b.id] ?? []).map((l) => <li key={l}>{l}</li>)}
              </ul>
              <div className="row">
                <Link className="btn" to={`/${b.id}`} onClick={() => enter(b.id)}>Entrar como cliente</Link>
                <Link className="btn secondary" to={`/${b.id}/carta`} onClick={() => enter(b.id)}>Ver la carta</Link>
              </div>
            </div>
          </section>
        ))}
      </div>

      <section className="moments home-sec" aria-labelledby="mom">
        <h2 id="mom" className="sr-only">Qué podés recorrer</h2>
        <Link to="/mesa-clara/carta/MC-12" onClick={() => enter('mesa-clara')} className="moment">
          {milanesa && <DishArt item={milanesa} size={88} decorative />}
          <span><span className="n">01</span><strong>Pedir con el plato a la vista</strong><span className="muted">Configurador con guarniciones, alérgenos y total en el mismo botón.</span></span>
        </Link>
        <Link to="/mesa-clara/regalar" onClick={() => enter('mesa-clara')} className="moment">
          <SeasonArt id={season.id} size={88} />
          <span><span className="n">02</span><strong>Invitar a alguien a comer</strong><span className="muted">Tarjeta de temporada ({season.name}) con mensaje; se canjea en el pedido.</span></span>
        </Link>
        <button type="button" onClick={() => goStaff('cocina')} className="moment">
          <span className="moment-ticket" aria-hidden="true"><b>K-011</b><span>1× Cappuccino</span><span className="t-late">Tarde · 12 min</span></span>
          <span><span className="n">03</span><strong>La cocina lo ve al instante</strong><span className="muted">Comandas por estación, demoras con texto y sin arrastrar.</span></span>
        </button>
      </section>

      <section aria-labelledby="staff" className="home-sec staff-row">
        <h2 id="staff">Entrar como el equipo</h2>
        <p className="muted small">Cada rol muestra sus pantallas (son vistas, no permisos).</p>
        <div className="staff-chips">
          {STAFF.map((s) => (
            <button key={s.role} className="staff-chip" type="button" onClick={() => goStaff(s.role)}>
              <Glyph name={s.icon} size={18} />
              <strong>{s.label}</strong>
              <span className="muted small">{s.does}</span>
            </button>
          ))}
        </div>
      </section>
      <p className="home-sec landing-links">
        <Link to="/comercial">Alcance de la demo y condiciones comerciales</Link> · <Link to="/simulador">Simulador de WhatsApp y llamada</Link> · <Link to="/arte">Ilustraciones y personajes</Link>
      </p>
    </main>
  )
}
