import { useId, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useBiz, useCart } from '../../ui/hooks'
import { PageHead } from '../../ui/Shell'
import { act, Callout, Dialog, Empty, ErrorText } from '../../ui/kit'
import { CategoryMark, Glyph, Plate } from '../../ui/glyphs'
import { allergenKey, AllergenCodes, fmtMenu, foodNoteText, isVeg } from '../../ui/food'
import { categoriesOf, checkLine, groupsOf, itemUnavailable, menuFor, searchItems, UNAVAILABLE_TEXT } from '../../domain/menu'
import { optionStockOk } from '../../domain/stock'
import { GUSTO_ART } from '../../domain/fixtures/nuevos'
import { Piece, pieceFor } from '../../ui/art/families'
import { windowsFor } from '../../domain/availability'
import { sedeShort } from '../../ui/format'
import { SavedPick } from '../../ui/passport'
import { HouseChar } from '../../ui/art/characters'
import { giftByCode, giftCart, giftUsable } from '../../domain/gifts'
import { lineGiftCover } from '../../domain/cmd-commerce'
import { dateKeyOf, hhmm } from '../../domain/time'
import { fmtARS } from '../../domain/money'
import { setPrefs, useSnapshot } from '../../store'
import type { AppState, BusinessProfile, GiftInvite, MenuItem } from '../../domain/types'

/** Categorías que el café sirve en la pizarra de barra; el resto va a la vitrina. */
const BAR_CATS = ['Café de barra', 'Métodos']
/** P5-L5 · Copo: cada gusto se elige viendo su bacha (la vitrina es el menú). */
function GustoArt({ id }: { id: string }) {
  const p = pieceFor(GUSTO_ART[id])
  return p ? <Piece size={40} className="gusto-art"><p.Comp /></Piece> : null
}
/** P5-L5 · textos de la carta que cambian con el tipo de negocio. */
const SEARCH_HINT: Record<string, string> = { bodegon: 'Buscar: pasta, milanesa, vegetariano…', cafe: 'Buscar: flat white, avena, medialuna…', heladeria: 'Buscar: cucurucho, pote, frutilla…', bar: 'Buscar: bravas, croquetas, sin alcohol…', rapida: 'Buscar: combo, doble, papas…' }
const EMPTY_HINT: Record<string, string> = { bodegon: 'Elegí un plato de la carta.', cafe: 'Elegí algo de la barra o de la vitrina.', heladeria: 'Elegí un formato y tus gustos.', bar: 'Elegí una tapa del Lado A o del Lado B.', rapida: 'Armá un combo o elegí una hamburguesa.' }
const TICKET_EYEBROW: Record<string, string> = { bodegon: 'Mesa o retiro', cafe: 'Para retirar o tomar acá', heladeria: 'Para retirar · pagás en el mostrador', bar: 'En tu mesa', rapida: 'Para retirar · pagás en el mostrador' }

export function MiniCart({ biz, locationId, state }: { biz: string; locationId: string; state: AppState }) {
  const { cart, total } = useCart(state, biz as never, locationId)
  const kind = state.businesses.find((b) => b.id === biz)?.kind ?? 'bodegon'
  if (!cart || !cart.lines.length) {
    return (
      <p className="empty-cart">
        <HouseChar biz={biz} mood="pensando" size={64} />
        Tu pedido está vacío. {EMPTY_HINT[kind]}
      </p>
    )
  }
  return (
    <div>
      {cart.lines.map((l) => {
        const it = state.menuItems.find((m) => m.id === l.itemId)!
        const chk = checkLine(state, it, l.selections, l.qty)
        return (
          <div className="line has-art fx-cart" key={`${l.id}-${l.qty}`}>
            <Plate item={it} size={40} decorative />
            <div>
              <strong>{l.qty}× {it.name}</strong>
              <div className="opts">{chk.picked.map((p) => p.optionName).join(' · ')}</div>
              {l.giftId && <div className="gift-line"><Glyph name="gift" size={14} /> Invitación · cubre {fmtARS(lineGiftCover(state, l, chk.unitCents))}</div>}
            </div>
            <span className="money">{fmtARS(chk.unitCents * l.qty - lineGiftCover(state, l, chk.unitCents))}</span>
          </div>
        )
      })}
      <div className="total-row"><span>Total</span><span className="money">{fmtARS(total)}</span></div>
      <Link className="btn" style={{ marginTop: 14, width: '100%' }} to={`/${biz}/pedido`}>Revisar y enviar</Link>
    </div>
  )
}

function serviceHours(state: AppState, locationId: string) {
  return windowsFor(state, locationId, dateKeyOf(state.clock.nowMs))
    .sort((a, b) => a.startMin - b.startMin)
    .map((w) => `${w.label === 'Día completo' ? 'Barra' : w.label} ${hhmm(w.startMin)}–${hhmm(w.endMin)}`)
    .join(' · ')
}

export function Carta() {
  const { state, biz, locationId } = useBiz()
  const { prefs } = useSnapshot()
  const { itemId } = useParams()
  const [params] = useSearchParams()
  const fromPassport = params.get('origen') === 'pasaporte'
  const giftParam = params.get('regalo')
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const [onlyAvail, setOnlyAvail] = useState(false)
  const [veg, setVeg] = useState(false)
  const [favOnly, setFavOnly] = useState(false)
  const loc = state.locations.find((l) => l.id === locationId)!
  const all = menuFor(state, biz.id, locationId)
  const items = useMemo(() => {
    let r = searchItems(state, all, q)
    if (onlyAvail) r = r.filter((i) => !itemUnavailable(state, i, locationId))
    if (veg) r = r.filter(isVeg)
    if (favOnly) r = r.filter((i) => prefs.favorites.includes(i.id))
    return r
  }, [state, all, q, onlyAvail, veg, favOnly, prefs.favorites, locationId])
  const cats = [...biz.categoryOrder.filter((c) => categoriesOf(all).includes(c)), ...categoriesOf(all).filter((c) => !biz.categoryOrder.includes(c))]
  const [cat, setCat] = useState<string | null>(null)
  const filtered = cats.map((c) => ({ c, list: items.filter((i) => i.category === c) })).filter((g) => g.list.length && (!cat || g.c === cat))
  const hiddenElsewhere = menuFor(state, biz.id).length - all.length
  const selected = itemId ? state.menuItems.find((m) => m.id === itemId && m.businessId === biz.id) : undefined
  const saved = state.passports.find((p) => p.businessId === biz.id && p.customerId === (state.session.customerByBusiness[biz.id] ?? null))?.savedPreference
  const active = q !== '' || onlyAvail || veg || favOnly || cat !== null
  const cafe = biz.kind === 'cafe'

  const clear = () => {
    setQ('')
    setOnlyAvail(false)
    setVeg(false)
    setFavOnly(false)
    setCat(null)
  }
  const toggleFav = (id: string) => setPrefs({ favorites: prefs.favorites.includes(id) ? prefs.favorites.filter((x) => x !== id) : [...prefs.favorites, id] })
  const row = { state, locationId, biz: biz.id, saved }

  return (
    <main>
      <PageHead title="Carta" sub={`${sedeShort(loc.name)} · precios en ARS`}>
        <span className="muted small">{serviceHours(state, locationId)}</span>
      </PageHead>
      {hiddenElsewhere > 0 && <Callout>En esta sede no se sirven {hiddenElsewhere} plato(s) que sí están en otra. Cambiá la sede en los controles de la demo para verlos.</Callout>}
      <div className="menu-layout">
        <nav aria-label="Categorías" className="cat-nav">
          <p className="eyebrow">Secciones</p>
          <button type="button" aria-current={cat === null} onClick={() => setCat(null)}>
            Todas <span className="n">{items.length}</span>
          </button>
          {cats.map((c) => (
            <button key={c} type="button" aria-current={cat === c} onClick={() => setCat(c)}>
              {c} <span className="n">{items.filter((i) => i.category === c).length}</span>
            </button>
          ))}
        </nav>
        <div>
          <form role="search" aria-label="Buscar en la carta" onSubmit={(e) => e.preventDefault()} className="menu-tools">
            <div className="search">
              <label htmlFor="q" className="sr-only">Buscar un plato</label>
              <Glyph name="search" size={18} />
              <input id="q" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={SEARCH_HINT[biz.kind]} data-testid="menu-search" />
            </div>
            <div className="chips" role="group" aria-label="Filtros">
              <button type="button" className="chip-toggle" aria-pressed={onlyAvail} onClick={() => setOnlyAvail((v) => !v)}>Solo disponibles</button>
              <button type="button" className="chip-toggle" aria-pressed={veg} onClick={() => setVeg((v) => !v)}><Glyph name="leaf" size={16} /> Vegetarianos</button>
              <button type="button" className="chip-toggle" aria-pressed={favOnly} onClick={() => setFavOnly((v) => !v)}><Glyph name="heart" size={16} /> Mis favoritas</button>
              {active && <button type="button" className="btn ghost small" onClick={clear}>Limpiar filtros</button>}
            </div>
          </form>
          <SavedPick state={state} biz={biz.id} locationId={locationId} compact />
          <p className="allergen-key">
            <b>Alérgenos</b> (muestra): {allergenKey(all)}. Sin código: no declarados. Ante una alergia, consultá al equipo.
          </p>
          <p className="sr-only" role="status" aria-live="polite">{items.length} resultado(s)</p>
          {items.length === 0 ? (
            <Empty title="No encontramos platos con esos filtros" art={<HouseChar biz={biz.id} mood="pensando" />} action={<button className="btn" type="button" onClick={clear} data-testid="clear-filters">Limpiar filtros</button>}>
              Probá con otra palabra o quitá algún filtro. La carta completa sigue intacta.
            </Empty>
          ) : cafe ? (
            filtered.map(({ c, list }) =>
              BAR_CATS.includes(c) ? (
                <section key={c} className="barboard" aria-labelledby={`cat-${c}`}>
                  <h2 id={`cat-${c}`}><CategoryMark cat={c} /> {c}</h2>
                  <div className="head-row" aria-hidden="true">
                    <span>En la barra</span>
                    <span>Chico</span>
                    <span>Mediano</span>
                    <span />
                  </div>
                  {list.map((i) => <Drink key={i.id} item={i} {...row} />)}
                </section>
              ) : (
                <section key={c} aria-labelledby={`cat-${c}`}>
                  <div className="vitrina-head">
                    <h2 id={`cat-${c}`}><CategoryMark cat={c} /> {c}</h2>
                    <span className="small muted">Ilustraciones de la casa · no son fotos</span>
                  </div>
                  <div className="vitrina">
                    {list.map((i) => <Pastry key={i.id} item={i} {...row} />)}
                  </div>
                </section>
              ),
            )
          ) : (
            filtered.map(({ c, list }) => (
              <section key={c} className="menu-cat" aria-labelledby={`cat-${c}`}>
                <header>
                  <h2 id={`cat-${c}`}><CategoryMark cat={c} /> {c}</h2>
                </header>
                {list.map((i) => (
                  <Dish key={i.id} item={i} {...row} fav={prefs.favorites.includes(i.id)} onFav={() => toggleFav(i.id)} />
                ))}
              </section>
            ))
          )}
        </div>
        <aside className="side-cart side-cart-desktop" aria-label="Tu pedido">
          <div className="ticket-paper">
            <p className="eyebrow">{TICKET_EYEBROW[biz.kind]}</p>
            <h2>Tu pedido</h2>
            <MiniCart biz={biz.id} locationId={locationId} state={state} />
          </div>
        </aside>
      </div>
      <ItemDialog item={selected} biz={biz} locationId={locationId} state={state} gift={giftFor(state, giftParam, selected)} fromPassport={fromPassport && !!selected && saved === selected.id} fav={!!selected && prefs.favorites.includes(selected.id)} onFav={() => selected && toggleFav(selected.id)} onClose={() => nav(`/${biz.id}/carta`)} />
    </main>
  )
}

/** Invitación válida para el plato abierto (de `?regalo=CÓDIGO`), o el motivo por el que no se puede usar. */
function giftFor(state: AppState, code: string | null, item?: MenuItem): { gift: GiftInvite; problem: string | null } | undefined {
  if (!code || !item) return undefined
  const g = giftByCode(state, code)
  if (!g || g.businessId !== item.businessId || g.itemId !== item.id) return undefined
  const problem = !giftUsable(g, state.clock.nowMs) ? 'Esta invitación ya no está disponible (canjeada, cancelada o vencida).' : giftCart(state, g.id) ? 'Esta invitación ya está en tu pedido.' : null
  return { gift: g, problem }
}

type RowProps = { item: MenuItem; state: AppState; locationId: string; biz: string; saved?: string | null }

function OffNote({ state, item, locationId, un }: { state: AppState; item: MenuItem; locationId: string; un: keyof typeof UNAVAILABLE_TEXT }) {
  return <p className="note-off">{UNAVAILABLE_TEXT[un]}. {alternativesText(state, item, locationId)}</p>
}
const offLabel = (un: string) => (un === 'fuera-de-franja' ? 'Fuera de su franja' : 'Agotado')

/** Mesa Clara: renglón de carta impresa. */
function Dish({ item, state, locationId, biz, saved, fav, onFav }: RowProps & { fav: boolean; onFav: () => void }) {
  const un = itemUnavailable(state, item, locationId)
  return (
    <article className={`dish has-art ${un ? 'is-off' : ''}`} data-testid={`dish-${item.id}`}>
      <Plate item={item} size={84} decorative />
      <div className="title-line">
        <h3>{item.name}</h3>
        <span className="leader" aria-hidden="true" />
        <span className="price money">{fmtMenu(item.priceCents)}</span>
      </div>
      <div>
        <p className="desc">{item.description}</p>
        <div className="meta">
          {un && <span className="stamp-off">{offLabel(un)}</span>}
          <AllergenCodes note={item.foodNote} />
          {isVeg(item) && <span><Glyph name="leaf" size={14} /> Vegetariano</span>}
          {item.hours && <span><Glyph name="sun" size={14} /> Solo al mediodía</span>}
          {saved === item.id && <span className="saved"><Glyph name="star" size={14} /> Tu selección del pasaporte</span>}
        </div>
        {un && <OffNote state={state} item={item} locationId={locationId} un={un} />}
      </div>
      <div className="acts">
        <button type="button" className="icon-btn" aria-pressed={fav} onClick={onFav} aria-label={`Favorita: ${item.name}`}>
          <Glyph name="heart" size={20} />
        </button>
        <Link className="choose" to={`/${biz}/carta/${item.id}`} data-testid={`open-${item.id}`}>
          {un ? 'Ver detalle' : <>Elegir <Glyph name="plus" size={16} /></>}
          <span className="sr-only"> {item.name}</span>
        </Link>
      </div>
    </article>
  )
}

/** Ritual Café: renglón de pizarra con precio por tamaño. */
function Drink({ item, state, locationId, biz, saved }: RowProps) {
  const un = itemUnavailable(state, item, locationId)
  const groups = groupsOf(state, item)
  const size = groups.find((g) => g.id === 'MG-tamano')
  const big = size?.options.find((o) => o.id === 'ta-mediano')
  const origin = groups.some((g) => g.id === 'MG-origen')
  return (
    <article className={`drink ${un ? 'is-off' : ''}`} data-testid={`dish-${item.id}`}>
      <div className="info">
        <Plate item={item} size={56} decorative />
        <div>
          <h3>{item.name}</h3>
          <p className="notes">{item.description}</p>
        </div>
      </div>
      <div className="meta">
        {un && <span className="stamp-off">{offLabel(un)}</span>}
        <AllergenCodes note={item.foodNote} />
        {origin && <span><Glyph name="bean" size={14} /> Origen a elección</span>}
        {saved === item.id && <span className="saved"><Glyph name="star" size={14} /> Tu selección del pasaporte</span>}
        {un && <OffNote state={state} item={item} locationId={locationId} un={un} />}
      </div>
      {big ? (
        <>
          <span className="p p1 money"><span className="sr-only">Chico: </span>{fmtMenu(item.priceCents)}</span>
          <span className="p p2 money"><span className="sr-only">Mediano: </span>{fmtMenu(item.priceCents + big.deltaCents)}</span>
        </>
      ) : (
        <>
          <span className="p p1 money"><span className="sr-only">Tamaño único: </span>{fmtMenu(item.priceCents)}</span>
          <span className="p p2 na" aria-hidden="true">—</span>
        </>
      )}
      <Link className="choose act" to={`/${biz}/carta/${item.id}`} data-testid={`open-${item.id}`} aria-label={`${un ? 'Ver detalle de' : 'Elegir'} ${item.name}`}>
        <Glyph name={un ? 'arrow' : 'plus'} size={18} />
      </Link>
    </article>
  )
}

/** Ritual Café: pieza de vitrina con ilustración propia (sin foto). */
function Pastry({ item, state, locationId, biz, saved }: RowProps) {
  const un = itemUnavailable(state, item, locationId)
  return (
    <article className={`pastry ${un ? 'is-off' : ''}`} data-testid={`dish-${item.id}`}>
      <Plate item={item} size={120} decorative />
      <h3>{item.name}</h3>
      <p className="desc">{item.description}</p>
      <div className="meta">
        {un && <span className="stamp-off">{offLabel(un)}</span>}
        <AllergenCodes note={item.foodNote} />
        {saved === item.id && <span className="saved"><Glyph name="star" size={14} /> Tu selección del pasaporte</span>}
      </div>
      {un && <OffNote state={state} item={item} locationId={locationId} un={un} />}
      <div className="foot">
        <span className="price money">{fmtMenu(item.priceCents)}</span>
        <Link className="choose" to={`/${biz}/carta/${item.id}`} data-testid={`open-${item.id}`}>
          {un ? 'Ver detalle' : <>Elegir <Glyph name="plus" size={16} /></>}
          <span className="sr-only"> {item.name}</span>
        </Link>
      </div>
    </article>
  )
}

function alternativesText(state: AppState, item: MenuItem, locationId: string) {
  const alts = state.menuItems.filter((m) => m.businessId === item.businessId && m.category === item.category && m.id !== item.id && !itemUnavailable(state, m, locationId)).slice(0, 3)
  return alts.length ? `Alternativas de la misma categoría: ${alts.map((a) => a.name).join(', ')}.` : ''
}

function reqText(required: boolean, min: number, max: number, done: boolean) {
  if (required) return done ? 'Listo' : `Obligatorio · elegí ${min === max ? min : `de ${min} a ${max}`}`
  return max > 1 ? `Opcional · hasta ${max}` : 'Opcional'
}

function ItemDialog({ item, biz, locationId, state, fav, onFav, onClose, fromPassport, gift }: { item?: MenuItem; biz: BusinessProfile; locationId: string; state: AppState; fav: boolean; onFav: () => void; onClose: () => void; fromPassport?: boolean; gift?: { gift: GiftInvite; problem: string | null } }) {
  const [sel, setSel] = useState<Record<string, string[]>>({})
  const [qty, setQty] = useState(1)
  const [note, setNote] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [key, setKey] = useState<string | undefined>(undefined)
  const titleId = useId()
  if (item?.id !== key) {
    // reinicia el formulario al abrir otro plato
    setKey(item?.id)
    setSel({})
    setQty(1)
    setNote('')
    setErrors({})
  }
  const nav = useNavigate()
  if (!item) return <Dialog open={false} onClose={onClose} title="Plato"><span /></Dialog>
  const un = itemUnavailable(state, item, locationId)
  const groups = groupsOf(state, item)
  const chk = checkLine(state, item, sel, qty)
  const fn = foodNoteText(item.foodNote)
  const giftOn = !!gift && !gift.problem
  const toggle = (gid: string, oid: string, max: number) => {
    setErrors((e) => ({ ...e, [gid]: '' }))
    setSel((s) => {
      const cur = s[gid] ?? []
      if (max === 1) return { ...s, [gid]: [oid] }
      return { ...s, [gid]: cur.includes(oid) ? cur.filter((x) => x !== oid) : [...cur, oid] }
    })
  }
  const add = () => {
    const useGift = gift && !gift.problem ? gift.gift.code : undefined
    const o = act({ type: 'cart/add', businessId: biz.id, locationId, itemId: item.id, qty: useGift ? 1 : qty, selections: sel, note, source: fromPassport ? 'pasaporte' : undefined, giftCode: useGift }, `${item.name} agregado al pedido`)
    if (!o.ok) {
      const errs = ((o.data as { errors?: Record<string, string> } | undefined)?.errors ?? {}) as Record<string, string>
      setErrors(Object.keys(errs).length ? errs : { _item: o.message })
      const first = Object.keys(errs)[0]
      if (first) document.getElementById(`grp-${first}`)?.focus()
      return
    }
    onClose()
  }
  const head = (
    <>
      <button type="button" className="icon-btn item-x" aria-label="Cerrar" onClick={onClose}>
        <Glyph name="x" size={20} />
      </button>
      <div className="item-head">
        <Plate item={item} size={168} />
        <div>
          <p className="eyebrow" style={{ marginBottom: 4 }}>{item.category}</p>
          <h2 id={titleId}>{item.name}</h2>
          <p className="desc">{item.description}</p>
          <p className="from money">
            {fmtARS(item.priceCents)} <span>· precio base</span>
          </p>
        </div>
        <button type="button" className="icon-btn fav" aria-pressed={fav} onClick={onFav} aria-label={`Favorita: ${item.name}`}>
          <Glyph name="heart" size={22} />
        </button>
      </div>
      {gift && (
        <p className={`gift-note ${gift.problem ? 'off' : ''}`} data-testid="gift-note">
          <Glyph name="gift" size={16} />
          <span>{gift.problem ?? <>Invitación de <strong>{gift.gift.fromAlias}</strong> ({gift.gift.code}): el plato base ({fmtARS(gift.gift.coveredCents)}) queda cubierto. Elegí las opciones; los extras se pagan.</>}</span>
        </p>
      )}
      {fromPassport && (
        <p className="from-passport" data-testid="from-passport">
          <Glyph name="star" size={16} /> Tu selección del pasaporte, revalidada recién: elegí las opciones de hoy; el precio es el actual.
        </p>
      )}
      <div className="food-note">
        <Glyph name={fn.tone === 'warn' ? 'flag' : 'alert'} size={16} />
        <span>
          {fn.text} {item.foodNote.status === 'completa' && item.foodNote.note && <span className="muted">{item.foodNote.note}</span>}
        </span>
      </div>
    </>
  )
  return (
    <Dialog open onClose={onClose} title={item.name} titleId={titleId} className="item" testId="item-dialog">
      {un ? (
        <>
          <div className="item-scroll">
            {head}
            <Callout tone="warn" role="alert">
              {UNAVAILABLE_TEXT[un]}. {alternativesText(state, item, locationId)}
            </Callout>
          </div>
          <div className="item-foot">
            <button type="button" className="btn lg" style={{ flex: '1 1 220px' }} onClick={() => nav(`/${biz.id}/carta`)}>Volver a la carta</button>
          </div>
        </>
      ) : (
        <form
          className="item-form"
          onSubmit={(e) => {
            e.preventDefault()
            add()
          }}
          noValidate
        >
          <div className="item-scroll">
            {head}
            {groups.map((g) => {
              const err = errors[g.id] || (chk.errors[g.id] && Object.keys(errors).length ? chk.errors[g.id] : '')
              const done = !chk.errors[g.id] && (sel[g.id]?.length ?? 0) > 0
              return (
                <fieldset key={g.id} className={`opt-group ${err ? 'invalid' : ''}`} id={`grp-${g.id}`} tabIndex={-1} aria-describedby={err ? `err-${g.id}` : undefined}>
                  <legend>
                    <span className="og-title">{g.name}</span>
                    <span className={`req ${g.required ? (done ? 'done' : 'must') : ''}`}>
                      {g.required && done && <Glyph name="check" size={12} />}
                      {reqText(g.required, g.min, g.max, done)}
                    </span>
                  </legend>
                  <div>
                    {g.options.map((o) => {
                      const stockOk = optionStockOk(state, o)
                      const checked = (sel[g.id] ?? []).includes(o.id)
                      return (
                        <label key={o.id} className={`opt${GUSTO_ART[o.id] ? ' opt-gusto' : ''}`}>
                          <input type={g.max === 1 ? 'radio' : 'checkbox'} name={g.id} checked={checked} disabled={!stockOk} onChange={() => toggle(g.id, o.id, g.max)} />
                          {GUSTO_ART[o.id] && <GustoArt id={o.id} />}
                          <span className="grow">
                            {o.name}
                            {!stockOk && <small>{GUSTO_ART[o.id] ? 'Bacha vacía: volvemos pronto' : 'Sin stock por ahora'}</small>}
                          </span>
                          {o.deltaCents > 0 && <span className="delta money">+ {fmtARS(o.deltaCents)}</span>}
                        </label>
                      )
                    })}
                    <ErrorText id={`err-${g.id}`}>{err}</ErrorText>
                  </div>
                </fieldset>
              )
            })}
            <div className="field">
              <label htmlFor="note">Nota para la cocina (opcional)</label>
              <input id="note" type="text" value={note} onChange={(e) => setNote(e.target.value)} maxLength={120} aria-describedby="note-hint" />
              <span className="hint" id="note-hint">Una alergia no se resuelve con una nota: consultá al equipo. La demo no garantiza ausencia de alérgenos.</span>
            </div>
          </div>
          <div className="item-foot">
            {giftOn ? (
              <span className="gift-qty"><Glyph name="gift" size={16} /> 1 · invitación</span>
            ) : (
              <div className="qty" role="group" aria-label="Cantidad">
                <button type="button" onClick={() => setQty((v) => Math.max(1, v - 1))} aria-label="Menos"><Glyph name="minus" size={18} /></button>
                <output aria-live="polite" data-testid="qty">{qty}</output>
                <button type="button" onClick={() => setQty((v) => Math.min(item.maxQty, v + 1))} aria-label="Más"><Glyph name="plus" size={18} /></button>
              </div>
            )}
            <button type="submit" className="btn lg" data-testid="add-to-cart">
              <span className="cta-label">{giftOn ? 'Canjear y agregar' : 'Agregar al pedido'}</span>
              <span className="money" data-testid="subtotal">{fmtARS(giftOn ? Math.max(0, chk.unitCents - Math.min(gift!.gift.coveredCents, chk.unitCents)) : chk.unitCents * qty)}</span>
            </button>
            <ErrorText>{errors._item || errors._qty}</ErrorText>
          </div>
        </form>
      )}
    </Dialog>
  )
}
