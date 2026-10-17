import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBiz, useOperation } from '../../ui/hooks'
import { PageHead } from '../../ui/Shell'
import { act, Callout, ErrorText } from '../../ui/kit'
import { Glyph, Plate } from '../../ui/glyphs'
import { fmtMenu } from '../../ui/food'
import { GiftCard } from '../../ui/gift'
import { SeasonArt } from '../../ui/art/season'
import { activeSeason, SEASON_IDS, SEASON_NAME } from '../../domain/season'
import { GIFT_MESSAGE_MAX } from '../../domain/gifts'
import { itemUnavailable } from '../../domain/menu'
import type { SeasonId } from '../../domain/types'

/** Invitar a comer: elegir el plato, para quién, el mensaje y la tarjeta. Sin cobro ni envío real. */
export function Regalar() {
  const { state, biz, locationId } = useBiz()
  const nav = useNavigate()
  const season = activeSeason(state, biz.id)
  const items = useMemo(() => {
    const all = state.menuItems.filter((m) => m.businessId === biz.id)
    const picks = season.picks[biz.id]
    return [...all].sort((a, b) => (picks.includes(b.id) ? 1 : 0) - (picks.includes(a.id) ? 1 : 0))
  }, [state.menuItems, biz.id, season.picks])
  const [itemId, setItemId] = useState<string>(season.picks[biz.id][0])
  const [fromAlias, setFrom] = useState('')
  const [toAlias, setTo] = useState('')
  const [message, setMessage] = useState('')
  const [theme, setTheme] = useState<SeasonId>(season.id)
  const [delivery, setDelivery] = useState<'enlace' | 'whatsapp-simulado'>('enlace')
  const [showAll, setShowAll] = useState(false)
  const [errs, setErrs] = useState<Record<string, string>>({})
  const getOp = useOperation(`${itemId}|${fromAlias}|${toAlias}|${message}|${theme}|${delivery}`)
  const item = state.menuItems.find((m) => m.id === itemId)
  const list = showAll ? items : items.slice(0, 6)
  const suggestions = [season.giftLine, '¡Gracias por todo! Este va por mi cuenta.', 'Para que te des un gusto. ¡Disfrutalo!']

  const submit = () => {
    const o = act({ type: 'gift/create', businessId: biz.id, itemId, fromAlias, toAlias, message, theme, delivery, operationId: getOp() })
    if (!o.ok) {
      const e = ((o.data as { errors?: Record<string, string> } | undefined)?.errors ?? {}) as Record<string, string>
      setErrs(e)
      const first = ['item', 'fromAlias', 'toAlias', 'message'].find((k) => e[k])
      if (first) document.getElementById(`g-${first}`)?.focus()
      return
    }
    const { code } = o.data as { code: string }
    nav(`/${biz.id}/regalo/${code}?nuevo=1`)
  }
  const field = (k: string) => ({ 'aria-invalid': !!errs[k] || undefined, 'aria-describedby': errs[k] ? `g-${k}-err` : undefined })

  return (
    <main className="gift-page" data-season={theme}>
      <PageHead
        title="Invitar a alguien a comer"
        eyebrow={<><Glyph name="gift" size={14} /> Regalo con mensaje · {season.name}</>}
        sub="Elegí un plato, escribí unas palabras y elegí la tarjeta. Quien la recibe la canjea en su pedido. En la demo no se cobra ni se envía nada real."
      />
      <div className="gift-layout">
        <form className="gift-form" noValidate onSubmit={(e) => { e.preventDefault(); submit() }}>
          <fieldset className="gift-step" id="g-item" tabIndex={-1} aria-describedby={errs.item ? 'g-item-err' : undefined}>
            <legend><span className="n">1</span> ¿Qué querés regalar?</legend>
            <div className="gift-dishes">
              {list.map((m) => {
                const un = itemUnavailable(state, m, locationId)
                const pick = season.picks[biz.id].includes(m.id)
                return (
                  <label key={m.id} className="gift-dish" data-testid={`gift-item-${m.id}`}>
                    <input type="radio" name="gift-item" value={m.id} checked={itemId === m.id} onChange={() => setItemId(m.id)} />
                    <Plate item={m} size={72} decorative />
                    <span className="nm">{m.name}</span>
                    <span className="pr money">{fmtMenu(m.priceCents)}</span>
                    {pick && <span className="tag">{season.name}</span>}
                    {un && <span className="small muted">Hoy no disponible: se canjea otro día</span>}
                  </label>
                )
              })}
            </div>
            {items.length > 6 && (
              <button type="button" className="btn ghost small" onClick={() => setShowAll((v) => !v)} aria-expanded={showAll}>
                {showAll ? 'Ver menos platos' : `Ver toda la carta (${items.length})`}
              </button>
            )}
            <ErrorText id="g-item-err">{errs.item}</ErrorText>
          </fieldset>

          <fieldset className="gift-step">
            <legend><span className="n">2</span> ¿De parte de quién y para quién?</legend>
            <div className="grid cols-2">
              <div className="field">
                <label htmlFor="g-fromAlias">Tu nombre (alias de muestra)</label>
                <input id="g-fromAlias" value={fromAlias} onChange={(e) => setFrom(e.target.value)} maxLength={30} autoComplete="off" data-testid="gift-from" {...field('fromAlias')} />
                <ErrorText id="g-fromAlias-err">{errs.fromAlias}</ErrorText>
              </div>
              <div className="field">
                <label htmlFor="g-toAlias">Para (nombre de quien recibe)</label>
                <input id="g-toAlias" value={toAlias} onChange={(e) => setTo(e.target.value)} maxLength={30} autoComplete="off" data-testid="gift-to" {...field('toAlias')} />
                <ErrorText id="g-toAlias-err">{errs.toAlias}</ErrorText>
              </div>
            </div>
            <p className="hint">Solo nombres: no pedimos teléfono ni correo porque la demo no envía nada.</p>
          </fieldset>

          <fieldset className="gift-step">
            <legend><span className="n">3</span> Tu mensaje</legend>
            <div className="field">
              <label htmlFor="g-message">Mensaje para la tarjeta</label>
              <textarea id="g-message" rows={4} value={message} onChange={(e) => setMessage(e.target.value)} maxLength={GIFT_MESSAGE_MAX + 20} data-testid="gift-message" {...field('message')} />
              <span className={`hint counter ${message.trim().length > GIFT_MESSAGE_MAX ? 'over' : ''}`} aria-live="polite">{message.trim().length}/{GIFT_MESSAGE_MAX}</span>
              <ErrorText id="g-message-err">{errs.message}</ErrorText>
            </div>
            <div className="chips" role="group" aria-label="Mensajes sugeridos">
              {suggestions.map((s) => (
                <button key={s} type="button" className="chip-toggle" onClick={() => setMessage(s)}>{s}</button>
              ))}
            </div>
          </fieldset>

          <fieldset className="gift-step">
            <legend><span className="n">4</span> Tarjeta y entrega</legend>
            <div className="gift-themes" role="radiogroup" aria-label="Diseño de la tarjeta">
              {[season.id, ...SEASON_IDS.filter((s) => s !== season.id)].map((s) => (
                <label key={s} className="gift-theme" data-season={s}>
                  <input type="radio" name="gift-theme" checked={theme === s} onChange={() => setTheme(s)} />
                  <SeasonArt id={s} size={40} />
                  <span>{SEASON_NAME[s]}</span>
                </label>
              ))}
            </div>
            <div className="segmented" role="radiogroup" aria-label="Cómo la entregás" style={{ marginTop: 14 }}>
              <label><input type="radio" name="gift-delivery" checked={delivery === 'enlace'} onChange={() => setDelivery('enlace')} /> <Glyph name="envelope" size={16} /> Enlace para compartir</label>
              <label><input type="radio" name="gift-delivery" checked={delivery === 'whatsapp-simulado'} onChange={() => setDelivery('whatsapp-simulado')} data-testid="gift-wa" /> <Glyph name="chat" size={16} /> WhatsApp simulado</label>
            </div>
            <p className="hint">{delivery === 'enlace' ? 'Al crearla te mostramos el enlace y el código para que los compartas vos.' : 'Se genera un mensaje de muestra en el simulador de canales: no sale ningún mensaje real.'}</p>
          </fieldset>

          <Callout>
            <strong>Sin cobro real.</strong> La invitación cubre el precio base de {item?.name ?? 'el plato'} ({item ? fmtMenu(item.priceCents) : '—'}); si quien la canjea elige extras, los paga en su pedido. Vence a los 30 días del reloj simulado.
          </Callout>
          <button className="btn accent lg gift-submit" type="submit" data-testid="gift-submit">
            <Glyph name="gift" size={20} /> Crear invitación
          </button>
        </form>
        <aside className="gift-preview" aria-label="Vista previa de la tarjeta">
          <p className="eyebrow">Así la va a ver {toAlias.trim() || 'quien la reciba'}</p>
          <GiftCard data={{ fromAlias, toAlias, message, theme }} item={item} biz={biz} />
        </aside>
      </div>
    </main>
  )
}
