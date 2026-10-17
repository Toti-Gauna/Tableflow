import { useState, type ReactElement } from 'react'
import { Link } from 'react-router-dom'
import { useBiz } from '../../ui/hooks'
import { PageHead } from '../../ui/Shell'
import { Glyph, Plate } from '../../ui/glyphs'
import { fmtMenu } from '../../ui/food'
import { Character, HouseChar } from '../../ui/art/characters'
import { KIDS_OPTIONS, KidsPlate, type KidsPlateChoice } from '../../ui/art/kids'
import { KIDS_MENU } from '../../domain/content'
import { GAME_BY_BIZ, type GameId } from '../../domain/games'
import { GameFrame, type GameApi } from './games/GameFrame'
import { Art, DondeBoard, HamburguesaBoard, HeladoBoard, MemoriaBoard, MesaBoard } from './games/boards'
import { itemUnavailable } from '../../domain/menu'
import { sfx } from '../../ui/sfx'

/** Sección para chicos: menú sugerido, memotest y "Armá tu plato". Juegos sin tiempo límite ni puntajes públicos. */
/** Juego propio de cada negocio (JG-CAF, JG-RES, JG-HEL, JG-FR, JG-BAR): uno distinto por identidad, no un recolor. */
const GAMES: Record<GameId, { title: string; tagline: string; art: string; howTo: string[]; Board: (p: { api: GameApi }) => ReactElement }> = {
  memoria: {
    title: 'Memoria de la merienda', tagline: 'Medialunas, frutas y tazas: encontrá las parejas.', art: 'jg-cafe-medialuna', Board: MemoriaBoard,
    howTo: ['Tocá una carta para darla vuelta y después otra.', 'Si son iguales, quedan a la vista. Si no, tocá otra carta para seguir: no hay apuro.', 'Se juega con el dedo, el mouse o el teclado (Tab y Enter).'],
  },
  mesa: {
    title: 'Poner la mesa', tagline: 'Plato, cubiertos, vaso y servilleta: cada cosa en su lugar.', art: 'jg-resto-individual', Board: MesaBoard,
    howTo: ['Elegí una pieza de la bandeja.', 'Tocá su lugar en el individual: las siluetas te ayudan.', 'Si no es su lugar, te contamos dónde va. Nada se rompe.'],
  },
  helado: {
    title: 'Copiá el helado', tagline: 'Armá el cucurucho igual al del cartel.', art: 'jg-hela-frutilla', Board: HeladoBoard,
    howTo: ['Mirá el modelo: las bochas se cuentan de abajo hacia arriba.', 'Tocá los gustos en el mismo orden.', 'Si querés un desafío, escondé el modelo. Siempre podés volver a mostrarlo.'],
  },
  hamburguesa: {
    title: 'Armá la hamburguesa', tagline: 'Seguí la comanda capa por capa.', art: 'jg-rapida-queso', Board: HamburguesaBoard,
    howTo: ['La comanda dice el orden, de abajo hacia arriba.', 'Tocá el ingrediente que sigue.', 'Si no es el que va, te decimos cuál toca. Sin apuro.'],
  },
  donde: {
    title: '¿Dónde está?', tagline: 'Un patio con música en familia: buscá lo que te pedimos.', art: 'jg-bar-saxo', Board: DondeBoard,
    howTo: ['Arriba aparece qué buscar.', 'Tocá esa cosa en el patio. Si tocás otra, te decimos qué es.', 'Con el teclado, Tab recorre el patio y Enter elige.'],
  },
}

/**
 * Zona familiar: un juego opcional por negocio. No bloquea la compra, no pide datos (ni nombre), no tiene chat, apuestas,
 * compras ni premios. Lo comercial (platos que suelen pedir los chicos) va aparte, para los adultos.
 */
export function Chicos() {
  const { state, biz, locationId } = useBiz()
  const gameId = GAME_BY_BIZ[biz.id]
  const g = GAMES[gameId]
  const menu = (KIDS_MENU[biz.id] ?? []).map((k) => ({ ...k, item: state.menuItems.find((m) => m.id === k.itemId)! })).filter((k) => k.item && !k.item.tags?.includes('+18'))
  return (
    <main className="kids">
      <section className="kids-hero">
        <div>
          <PageHead title="Para chicos" eyebrow={`${biz.name} · zona familiar`} sub="Un juego opcional para la espera: sin tiempo, sin datos y sin compras. No hace falta jugar para pedir." />
          {biz.kind === 'bar' && <p className="policy-note"><Glyph name="smile" size={16} /> <span>Sección familiar aparte de la barra: acá no se muestran ni se ofrecen bebidas con alcohol.</span></p>}
        </div>
        <div className="kids-cast" aria-hidden="true">
          <Character who="tomatito" mood="festejo" size={150} animate />
          <HouseChar biz={biz.id} mood="feliz" size={120} />
        </div>
      </section>

      <GameFrame key={biz.id} id={gameId} title={g.title} tagline={g.tagline} art={<Art k={g.art} size={180} />} howTo={g.howTo}>
        {(api) => <g.Board api={api} />}
      </GameFrame>

      {biz.id === 'mesa-clara' && <ArmaTuPlato />}

      {menu.length > 0 && (
        <section aria-labelledby="kmenu-h" className="kids-sec kids-adults">
          <p className="eyebrow">Para los adultos · de la carta</p>
          <h2 id="kmenu-h">Lo que suelen pedir los chicos</h2>
          <ul className="kids-menu">
            {menu.map(({ item, note }) => {
              const un = itemUnavailable(state, item, locationId)
              return (
                <li key={item.id} className="kids-dish">
                  <Plate item={item} size={96} decorative />
                  <div>
                    <h3>{item.name}</h3>
                    <p className="muted small">{note}</p>
                    <p className="small"><span className="money">{fmtMenu(item.priceCents)}</span>{un && <span className="muted"> · hoy {un === 'fuera-de-franja' ? 'fuera de su franja' : 'agotado'}</span>}</p>
                    <Link className="btn secondary small" to={`/${biz.id}/carta/${item.id}`}>Ver en la carta<span className="sr-only"> {item.name}</span></Link>
                  </div>
                </li>
              )
            })}
          </ul>
          <p className="hint">Precios de la carta. Ante una alergia o intolerancia, consultá al equipo: la demo no garantiza ausencia de alérgenos.</p>
        </section>
      )}
    </main>
  )
}

const NAMES: Record<KidsPlateChoice['top'], string> = { milanesa: 'Milanesa', pollo: 'Pollito', huevo: 'Huevito' }
const MOODS: Record<KidsPlateChoice['smile'], string> = { papas: 'sonriente', choclo: 'dorado', brocoli: 'del bosque' }

function ArmaTuPlato() {
  const [c, setC] = useState<KidsPlateChoice>({ base: 'pure', top: 'milanesa', eyes: 'tomatitos', smile: 'papas' })
  const name = `${NAMES[c.top]} ${MOODS[c.smile]}`
  const groups: [keyof KidsPlateChoice, string][] = [['base', 'La base'], ['top', 'El sombrero'], ['eyes', 'Los ojos'], ['smile', 'La sonrisa']]
  return (
    <section aria-labelledby="arma-h" className="kids-sec arma" id="arma">
      <p className="eyebrow">Juego · para dibujar con comida</p>
      <h2 id="arma-h" tabIndex={-1}>Armá tu plato</h2>
      <div className="arma-layout">
        <div className="arma-controls">
          {groups.map(([g, label]) => (
            <fieldset key={g} className="arma-group">
              <legend>{label}</legend>
              <div className="chips">
                {KIDS_OPTIONS[g].map(([v, txt]) => (
                  <label key={v} className="chip-radio">
                    <input type="radio" name={`arma-${g}`} checked={c[g] === v} onChange={() => { setC({ ...c, [g]: v }); sfx('tap') }} />
                    <span>{txt}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
        </div>
        <figure className="arma-plate">
          <KidsPlate choice={c} size={260} label={`Plato armado: ${KIDS_OPTIONS.base.find(([v]) => v === c.base)![1]}, ${NAMES[c.top].toLowerCase()} de sombrero, ojos de ${c.eyes} y sonrisa de ${KIDS_OPTIONS.smile.find(([v]) => v === c.smile)![1].toLowerCase()}`} />
          <figcaption>
            <span className="muted small">Tu plato se llama</span>
            <strong data-testid="arma-name">{name}</strong>
            <span className="muted small">Es un juego: no se agrega al pedido.</span>
          </figcaption>
        </figure>
      </div>
    </section>
  )
}
