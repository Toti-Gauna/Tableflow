import { useApp } from '../store'
import { PageHead } from '../ui/Shell'
import { DishArt } from '../ui/art'
import { Character, CHARACTER_NAME, MOODS, type CharacterId } from '../ui/art/characters'
import { SeasonArt } from '../ui/art/season'
import { HeroBarra, HeroMesa } from '../ui/art/hero'
import { SEASON_IDS, SEASON_NAME } from '../domain/season'

const CAST: { who: CharacterId; role: string }[] = [
  { who: 'noqui', role: 'Mesa Clara' },
  { who: 'granito', role: 'Ritual Café' },
  { who: 'tomatito', role: 'Sección para chicos' },
]

/** Galería del sistema de ilustración: todas las piezas propias de la demo, con su plato. */
export function Arte() {
  const state = useApp()
  const big = typeof location !== 'undefined' && /grande/.test(location.hash)
  const biz = state.businesses
  return (
    <main className="wrap art-gallery">
      <PageHead title="Ilustraciones de la casa" eyebrow="Sistema de ilustración · propio de la demo" sub="Cada plato y bebida tiene su ilustración dibujada para TableFlow: misma luz, misma vajilla, sin fotos ni assets de terceros." />
      <section className="art-sec" aria-labelledby="g-hero">
        <h2 id="g-hero">Ilustraciones firma</h2>
        <div className="art-heroes">
          <figure data-biz="mesa-clara"><HeroMesa size={420} label="Mesa Clara: la mesa larga, vista desde arriba" /><figcaption>Mesa Clara · la mesa larga</figcaption></figure>
          <figure data-biz="ritual-cafe"><HeroBarra size={420} label="Ritual Café: la barra, vista desde arriba" /><figcaption>Ritual Café · la barra</figcaption></figure>
        </div>
      </section>
      <section className="art-sec" aria-labelledby="g-cast">
        <h2 id="g-cast">Personajes</h2>
        {CAST.map((c) => (
          <div key={c.who}>
            <h3>{CHARACTER_NAME[c.who]} <span className="muted small">· {c.role}</span></h3>
            <ul className="art-cast">
              {MOODS.map((m) => (
                <li key={m}>
                  <Character who={c.who} mood={m} size={112} label animate />
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
              <SeasonArt id={s} size={112} label={`Ornamento de ${SEASON_NAME[s]}`} />
              <span>{SEASON_NAME[s]}</span>
            </li>
          ))}
        </ul>
      </section>
      {biz.map((b) => (
        <section key={b.id} data-biz={b.id} className="art-sec" aria-labelledby={`g-${b.id}`}>
          <h2 id={`g-${b.id}`}>{b.name}</h2>
          <ul className="art-grid">
            {state.menuItems.filter((m) => m.businessId === b.id).map((m) => (
              <li key={m.id}>
                <DishArt item={m} size={big ? 300 : 160} />
                <span className="name">{m.name}</span>
                <span className="muted small">{m.id} · {m.category}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  )
}
