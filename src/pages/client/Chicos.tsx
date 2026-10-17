import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useBiz } from '../../ui/hooks'
import { PageHead } from '../../ui/Shell'
import { Glyph, Plate } from '../../ui/glyphs'
import { fmtMenu } from '../../ui/food'
import { DishArt } from '../../ui/art'
import { rand } from '../../ui/art/kit'
import { Character, HouseChar } from '../../ui/art/characters'
import { KIDS_OPTIONS, KidsPlate, type KidsPlateChoice } from '../../ui/art/kids'
import { KIDS_MENU, MEMO_ITEMS } from '../../domain/content'
import { itemUnavailable } from '../../domain/menu'
import { sfx } from '../../ui/sfx'
import type { MenuItem } from '../../domain/types'

/** Sección para chicos: menú sugerido, memotest y "Armá tu plato". Juegos sin tiempo límite ni puntajes públicos. */
export function Chicos() {
  const { state, biz, locationId } = useBiz()
  const menu = KIDS_MENU[biz.id].map((k) => ({ ...k, item: state.menuItems.find((m) => m.id === k.itemId)! })).filter((k) => k.item)
  return (
    <main className="kids">
      <section className="kids-hero">
        <div>
          <PageHead title="Para chicos" eyebrow={`${biz.name} · sección infantil`} sub="Platos que los chicos piden siempre y dos juegos para la espera. Sin pantallas de por medio en la mesa: esto es para antes o después." />
          <div className="row">
            <a className="btn" href="#memo" onClick={(e) => { e.preventDefault(); document.getElementById('memo-h')?.focus() }}>Jugar al memotest</a>
            <a className="btn secondary" href="#arma" onClick={(e) => { e.preventDefault(); document.getElementById('arma-h')?.focus() }}>Armá tu plato</a>
          </div>
        </div>
        <div className="kids-cast" aria-hidden="true">
          <Character who="tomatito" mood="festejo" size={150} animate />
          <HouseChar biz={biz.id} mood="feliz" size={120} />
        </div>
      </section>

      <section aria-labelledby="kmenu-h" className="kids-sec">
        <p className="eyebrow">De la carta</p>
        <h2 id="kmenu-h">Lo que más piden</h2>
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
        <p className="hint">Precios de la carta de muestra. Ante una alergia o intolerancia, consultá al equipo: la demo no garantiza ausencia de alérgenos.</p>
      </section>

      <Memotest items={MEMO_ITEMS[biz.id].map((id) => state.menuItems.find((m) => m.id === id)!).filter(Boolean)} biz={biz.id} />
      <ArmaTuPlato />
    </main>
  )
}

function shuffled(n: number, seed: number) {
  const r = rand(seed)
  const a = Array.from({ length: n }, (_, i) => i)
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * Memotest de platos. Sin temporizadores (WCAG 2.2.1): dos cartas que no son pareja quedan a la vista
 * hasta el próximo toque, que las da vuelta y abre la nueva.
 */
function Memotest({ items, biz }: { items: MenuItem[]; biz: string }) {
  const [round, setRound] = useState(1)
  const deck = useMemo(() => shuffled(items.length * 2, round * 7919 + biz.length).map((k) => k % items.length), [round, items.length, biz])
  const [open, setOpen] = useState<number[]>([])
  const [found, setFound] = useState<number[]>([])
  const [moves, setMoves] = useState(0)
  const [live, setLive] = useState('')
  const announce = (m: string, _t?: string) => setLive(m)
  const won = found.length === deck.length
  const restart = () => {
    setRound((r) => r + 1)
    setOpen([])
    setFound([])
    setMoves(0)
    announce('Nueva partida: todas las cartas boca abajo.', 'ok')
  }
  const flip = (i: number) => {
    if (found.includes(i) || open.includes(i) || won) return
    if (open.length === 2) {
      setOpen([i])
      sfx('flip')
      return
    }
    const next = [...open, i]
    setOpen(next)
    if (next.length === 2) {
      setMoves((m) => m + 1)
      const [a, b] = next
      if (deck[a] === deck[b]) {
        const nf = [...found, a, b]
        setFound(nf)
        setOpen([])
        if (nf.length === deck.length) {
          sfx('success')
          announce(`¡Ganaste en ${moves + 1} jugadas!`, 'ok')
        } else {
          sfx('match')
          announce(`¡Pareja! ${items[deck[a]].name}.`, 'ok')
        }
      } else {
        sfx('flip')
        announce(`${items[deck[a]].name} y ${items[deck[b]].name} no son pareja. Tocá otra carta para seguir.`, 'ok')
      }
    } else sfx('flip')
  }
  return (
    <section aria-labelledby="memo-h" className="kids-sec" id="memo">
      <p className="eyebrow">Juego · sin tiempo límite</p>
      <h2 id="memo-h" tabIndex={-1}>Memotest de la casa</h2>
      <p className="muted">Encontrá las parejas de platos. Se juega con el mouse, el dedo o el teclado (Tab y Enter).</p>
      <p className="sr-only" role="status" aria-live="polite">{live}</p>
      <div className="memo-bar">
        <span>Jugadas: <strong data-testid="memo-moves">{moves}</strong></span>
        <span>Parejas: <strong data-testid="memo-found">{found.length / 2}</strong> de {items.length}</span>
        <button type="button" className="btn ghost small" onClick={restart} data-testid="memo-restart"><Glyph name="restart" size={16} /> Mezclar de nuevo</button>
      </div>
      {won ? (
        <div className="memo-win" role="status" data-testid="memo-win">
          <Character who="tomatito" mood="festejo" size={140} animate label />
          <div>
            <h3>¡Encontraste todas las parejas!</h3>
            <p>Lo hiciste en {moves} jugadas. ¿Otra partida?</p>
            <button type="button" className="btn" onClick={restart}>Jugar de nuevo</button>
          </div>
        </div>
      ) : (
        <ul className="memo-grid" aria-label="Cartas del memotest">
          {deck.map((k, i) => {
            const up = open.includes(i) || found.includes(i)
            const done = found.includes(i)
            const item = items[k]
            return (
              <li key={`${round}-${i}`}>
                <button
                  type="button"
                  className={`memo-card ${up ? 'up' : ''} ${done ? 'done' : ''}`}
                  aria-label={up ? `Carta ${i + 1}: ${item.name}${done ? ', encontrada' : ''}` : `Carta ${i + 1}, boca abajo`}
                  aria-disabled={done || undefined}
                  onClick={() => flip(i)}
                  data-testid={`memo-${i}`}
                >
                  <span className="memo-inner">
                    <span className="memo-face back" aria-hidden="true"><span className="memo-mark">?</span></span>
                    <span className="memo-face front" aria-hidden="true"><DishArt item={item} size={76} decorative /></span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
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
