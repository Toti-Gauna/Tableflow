import type { CSSProperties } from 'react'
import { Link, NavLink, useParams } from 'react-router-dom'
import { useSnapshot } from '../store'
import { PageHead } from '../ui/Shell'
import { useTheme } from '../ui/theme'
import { Character, CHARACTER_NAME, MOODS, type CharacterId } from '../ui/art/characters'
import { SeasonArt } from '../ui/art/season'
import { SEASON_IDS, SEASON_NAME } from '../domain/season'
import { FAMILIES, Piece, type FamilyPiece, type IdentityKey } from '../ui/art/families'
import { Loyalty, PhoneScreen, Ticket } from '../ui/art/families/mockups'
import { SalonArt } from '../ui/art/scenes/salon'
import { BodegonArt } from '../ui/art/scenes/bodegon'
import { identityOf, vars, type Mode } from './propuestas/identities'
import { NotFound } from './NotFound'
import './propuestas/fonts'
import './arte.css'

// P5-L4 · Galería del arte por identidad: muestra a tamaño real, familia completa, piezas de juego y mockups.

const ORDER: IdentityKey[] = ['cafe', 'resto', 'hela', 'bar', 'rapida']
const SAMPLE: Record<IdentityKey, string> = { cafe: 'RC-03', resto: 'MC-13', hela: 'H-cucurucho-2', bar: 'T-bravas', rapida: 'B-doble' }
const SIZES = [40, 64, 96, 160, 320]
const isIdentity = (x: string | undefined): x is IdentityKey => !!x && (ORDER as string[]).includes(x)

/** Tokens de la identidad en un modo, más el trazo y el papel de las piezas de dos tintas. */
function idStyle(id: IdentityKey, mode: Mode): CSSProperties {
  const v = vars(identityOf(id)!, mode)
  return { ...v, '--cp-line': mode === 'dark' ? '#efe7d6' : '#121212', '--cp-paper': mode === 'dark' ? '#0d1220' : '#efe7d6' } as CSSProperties
}

const CAST: { who: CharacterId; role: string }[] = [
  { who: 'noqui', role: 'Mesa Clara' },
  { who: 'granito', role: 'Ritual Café' },
  { who: 'tomatito', role: 'Sección para chicos' },
]

export function Arte() {
  const { id } = useParams()
  const { prefs } = useSnapshot()
  const theme = useTheme(prefs.theme)
  if (id === undefined) return <ArteIndex theme={theme} />
  if (!isIdentity(id)) return <NotFound what="esa identidad" back="/arte" backLabel="Volver a la galería" />
  return <IdentityGallery id={id} theme={theme} />
}

function Tabs({ current }: { current?: IdentityKey }) {
  return (
    <nav className="gx-tabs" aria-label="Identidades">
      <NavLink to="/arte" end>Todas</NavLink>
      {ORDER.map((k) => <NavLink key={k} to={`/arte/${k}`} aria-current={current === k ? 'page' : undefined}>{FAMILIES[k].name}</NavLink>)}
    </nav>
  )
}

function ArteIndex({ theme }: { theme: Mode }) {
  return (
    <main className="wrap gx">
      <PageHead title="Arte de las cinco casas" eyebrow="Sistema de ilustración · P5-L4" sub="Cada negocio tiene su familia propia: material, punto de vista y luz. Sin fotos ni assets de terceros; todo SVG dibujado para esta demo." />
      <Tabs />
      <ul className="gx-index">
        {ORDER.map((k) => {
          const f = FAMILIES[k]
          const idn = identityOf(k)!
          const first = f.pieces.find((p) => p.key === SAMPLE[k])!
          const more = f.pieces.filter((p) => p.group === 'carta' && p.key !== SAMPLE[k]).slice(0, 3)
          return (
            <li key={k} className="gx-root gx-card" style={idStyle(k, theme)}>
              <Link to={`/arte/${k}`} className="gx-card-link">
                <span className="gx-card-art"><Piece size={150}><first.Comp /></Piece></span>
                <span className="gx-card-more" aria-hidden="true">{more.map((p) => <Piece key={p.key} size={56}><p.Comp /></Piece>)}</span>
                <span className="gx-card-name">{f.name}</span>
                <span className="gx-card-sub">{idn.concept} · {f.pieces.length} piezas{idn.provisional ? ' · negocio de L5' : ''}</span>
              </Link>
            </li>
          )
        })}
      </ul>
      <section className="art-sec" aria-labelledby="g-hero">
        <h2 id="g-hero">Ilustraciones firma</h2>
        <div className="gx-scenes">
          <figure><BodegonArt className="art" label="Mesa Clara: pingüino, sifón, panera y milanesa napolitana sobre el mantel a cuadros" /><figcaption>Mesa Clara · bodegón de pizarra y pingüino</figcaption></figure>
          <figure><SalonArt className="art" label="Ritual Café: el salón bajo el vitral, con la mesa servida" /><figcaption>Ritual Café · el salón bajo el vitral</figcaption></figure>
        </div>
        <p className="muted small">Las de Copo, Taberna Compás y Brasa Rápida están en el <Link to="/propuestas">estudio de identidades</Link>; entran a la app con sus negocios (L5).</p>
      </section>
      <section className="art-sec" aria-labelledby="g-cast">
        <h2 id="g-cast">Personajes de Mesa Clara y Ritual Café</h2>
        <p className="muted small">Acompañan estados vacíos, la carga y la sección para chicos de los dos negocios actuales. Los negocios nuevos no los usan.</p>
        {CAST.map((c) => (
          <div key={c.who}>
            <h3>{CHARACTER_NAME[c.who]} <span className="muted small">· {c.role}</span></h3>
            <ul className="art-cast">
              {MOODS.map((m) => (
                <li key={m}>
                  <Character who={c.who} mood={m} size={96} label animate />
                  <span>{m === 'guino' ? 'guiño' : m}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>
      <section className="art-sec" aria-labelledby="g-season">
        <h2 id="g-season">Temporadas</h2>
        <ul className="art-cast">
          {SEASON_IDS.map((s) => (
            <li key={s} data-season={s}>
              <SeasonArt id={s} size={96} label={`Ornamento de ${SEASON_NAME[s]}`} />
              <span>{SEASON_NAME[s]}</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}

function Grid({ pieces }: { pieces: FamilyPiece[] }) {
  return (
    <ul className="gx-grid">
      {pieces.map((p) => (
        <li key={p.key} data-testid={`piece-${p.key}`}>
          <Piece size={128} label={`Ilustración de ${p.name}`}><p.Comp /></Piece>
          <span className="gx-name">{p.name}</span>
          <span className="gx-key">{p.key}</span>
        </li>
      ))}
    </ul>
  )
}

function IdentityGallery({ id, theme }: { id: IdentityKey; theme: Mode }) {
  const f = FAMILIES[id]
  const idn = identityOf(id)!
  const sample = f.pieces.find((p) => p.key === SAMPLE[id])!
  const groups: [FamilyPiece['group'], string, string][] = [
    ['carta', 'Carta', 'Cada ítem con su pieza. Para los negocios de L5, el contenido es provisional hasta tener fixtures.'],
    ['juego', 'Juego infantil', 'Piezas del juego propio de este negocio (se arma en L5).'],
    ['extra', 'Objetos de la casa', 'Piezas de ambientación.'],
  ]
  return (
    <main className="wrap gx gx-root gx-page" style={idStyle(id, theme)} data-identity={id}>
      <PageHead title={`Arte de ${f.name}`} eyebrow={`${idn.rubro} · ${idn.concept}`} sub={idn.differs} />
      <Tabs current={id} />
      <section className="art-sec" aria-labelledby="gx-sample">
        <h2 id="gx-sample">Muestra a tamaño real: {sample.name}</h2>
        <p className="muted small">La misma pieza a 40, 64, 96, 160 y 320 px, sobre el fondo claro y el oscuro de la identidad. Así se revisan proporciones, curvas, materiales y legibilidad antes de producir la familia.</p>
        {(['light', 'dark'] as Mode[]).map((m) => (
          <div key={m} className="gx-root gx-swatch" style={idStyle(id, m)} data-mode={m}>
            <span className="gx-mode">{idn.modeNames[m]}</span>
            <div className="gx-sizes">{SIZES.map((s) => <figure key={s}><Piece size={s} label={`${sample.name} a ${s} px`}><sample.Comp /></Piece><figcaption>{s} px</figcaption></figure>)}</div>
          </div>
        ))}
      </section>
      {groups.map(([g, title, note]) => {
        const ps = f.pieces.filter((p) => p.group === g)
        if (!ps.length) return null
        return (
          <section key={g} className="art-sec" aria-labelledby={`gx-${g}`}>
            <h2 id={`gx-${g}`}>{title} <span className="muted small">· {ps.length}</span></h2>
            <p className="muted small">{note}</p>
            <Grid pieces={ps} />
          </section>
        )
      })}
      <section className="art-sec" aria-labelledby="gx-mock">
        <h2 id="gx-mock">Comprobante, fidelidad y teléfono</h2>
        <p className="muted small">Datos ficticios, sin conexiones; el acabado es el final. El código QR se genera en L7.</p>
        <div className="gx-mocks">
          <Ticket id={id} />
          <Loyalty id={id} />
          <PhoneScreen id={id} />
        </div>
      </section>
    </main>
  )
}
