import { Link } from 'react-router-dom'
import { activeSeason, specialDay } from '../domain/season'
import { dateKeyOf, fmtDateShort } from '../domain/time'
import type { AppState, BusinessId } from '../domain/types'
import { SeasonArt } from './art/season'
import { SeasonScene } from './motion/SeasonScene'
import { Plate } from './glyphs'
import { Glyph } from './glyphs'

/** Texto del día especial respecto del día simulado: "es el domingo 18/10", "fue ayer"… */
export function specialNote(state: AppState, biz: BusinessId): string | null {
  const s = activeSeason(state, biz)
  const key = dateKeyOf(state.clock.nowMs)
  const day = specialDay(s.id, key)
  if (!day || s.forced) return null
  if (day === key) return '¡Es hoy!'
  const diff = Math.round((Date.parse(`${day}T12:00:00Z`) - Date.parse(`${key}T12:00:00Z`)) / 86400000)
  if (diff === -1) return 'Fue ayer: todavía estás a tiempo'
  if (diff < 0) return `Fue el ${fmtDateShort(day)}: todavía estás a tiempo`
  if (diff === 1) return 'Es mañana'
  return `Es el ${fmtDateShort(day)}`
}

/** Distintivo de temporada del encabezado del negocio. */
export function SeasonChip({ state, biz }: { state: AppState; biz: BusinessId }) {
  const s = activeSeason(state, biz)
  return (
    <Link to={`/${biz}/regalar`} className="season-chip" data-testid="season-chip" aria-label={`${s.name}: invitar a alguien a comer`}>
      <SeasonArt id={s.id} size={26} />
      <span className="txt">{s.name}</span>
    </Link>
  )
}

/** Banda de temporada del inicio: propuesta del momento, platos sugeridos e invitación a regalar. */
export function SeasonBand({ state, biz }: { state: AppState; biz: BusinessId }) {
  const s = activeSeason(state, biz)
  const note = specialNote(state, biz)
  const items = s.picks[biz].map((id) => state.menuItems.find((m) => m.id === id)).filter((m) => !!m)
  return (
    <section className="season-band fx-scene" aria-labelledby="temporada" data-testid="season-band">
      <SeasonScene biz={biz} season={s.id} />
      <div>
        <p className="eyebrow">{s.kind === 'fecha' ? s.name : `Temporada de ${s.name.toLowerCase()}`} · {note ?? s.when}</p>
        <h2 id="temporada">{s.headline[biz]}</h2>
        <p>{s.body[biz]}</p>
        <ul className="picks" aria-label="Sugeridos de la temporada">
          {items.map((m) => (
            <li key={m.id}>
              <Link to={`/${biz}/carta/${m.id}`}>
                <Plate item={m} size={36} decorative />
                {m.name}
              </Link>
            </li>
          ))}
        </ul>
        <div className="row">
          <Link className="btn season" to={`/${biz}/regalar`} data-testid="season-gift">
            <Glyph name="gift" size={18} /> Invitar a alguien a comer
          </Link>
          <Link className="btn secondary" to={`/${biz}/carta`}>Ver la carta</Link>
        </div>
      </div>
    </section>
  )
}
