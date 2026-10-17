import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useBiz } from '../../ui/hooks'
import { PageHead } from '../../ui/Shell'
import { act, Callout, Empty, StatusBadge } from '../../ui/kit'
import { Glyph } from '../../ui/glyphs'
import { GiftCard } from '../../ui/gift'
import { HouseChar } from '../../ui/art/characters'
import { giftByCode, giftCart, giftStatus } from '../../domain/gifts'
import { dateKeyOf, fmtDateShort } from '../../domain/time'
import { fmtARS } from '../../domain/money'
import { GIFT_LABEL } from '../../ui/format'
import { itemUnavailable } from '../../domain/menu'

/** Página de la invitación: la tarjeta para quien la recibe (sobre que se abre) y la confirmación para quien la crea. */
export function Regalo() {
  const { state, biz, locationId } = useBiz()
  const { code = '' } = useParams()
  const [params] = useSearchParams()
  const isNew = params.get('nuevo') === '1'
  const g = giftByCode(state, code)
  const [copied, setCopied] = useState('')
  if (!g || g.businessId !== biz.id) {
    return (
      <main>
        <PageHead title="No encontramos esa invitación" />
        <Empty art={<HouseChar biz={biz.id} mood="sorpresa" />} title={`El código ${code} no existe en ${biz.name}`} action={<Link className="btn" to={`/${biz.id}/regalar`}>Crear una invitación</Link>}>
          Revisá que esté bien escrito (letras y números, sin 0 ni O). No se creó ni modificó nada.
        </Empty>
      </main>
    )
  }
  const now = state.clock.nowMs
  const st = giftStatus(g, now)
  const item = state.menuItems.find((m) => m.id === g.itemId)
  const until = fmtDateShort(dateKeyOf(g.expiresAt))
  const sealed = st === 'enviado' && !isNew
  const inCart = giftCart(state, g.id)
  const un = item ? itemUnavailable(state, item, locationId) : null
  const link = `${location.origin}${location.pathname}#/${biz.id}/regalo/${g.code}`
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link)
      setCopied('Enlace copiado al portapapeles de este dispositivo.')
    } catch {
      setCopied('No se pudo copiar automáticamente: seleccioná el enlace y copialo.')
    }
  }
  const open = () => act({ type: 'gift/open', code: g.code }, `¡Abriste la invitación de ${g.fromAlias}!`)

  return (
    <main className="gift-page" data-season={g.theme}>
      <PageHead
        title={isNew ? 'Tu invitación está lista' : `${g.toAlias}, tenés una invitación`}
        eyebrow={<><Glyph name="gift" size={14} /> Invitación {g.code} · {biz.name}</>}
        sub={isNew ? `Compartí el enlace o el código con ${g.toAlias}. No se cobró ni se envió nada real.` : `${g.fromAlias} te invita a comer. Válida hasta el ${until} (reloj simulado).`}
      >
        <StatusBadge s={GIFT_LABEL[st]} />
      </PageHead>

      <div className="gift-layout reveal-layout">
        <div className="gift-stage">
          {sealed ? (
            <div className="envelope" data-testid="gift-envelope">
              <div className="env-back" aria-hidden="true" />
              <div className="env-flap" aria-hidden="true" />
              <div className="env-front">
                <HouseChar biz={biz.id} mood="guino" size={96} />
                <p className="env-to">Para <strong>{g.toAlias}</strong></p>
                <p className="env-from">De {g.fromAlias}</p>
                <button type="button" className="btn accent lg" onClick={open} data-testid="gift-open">
                  <Glyph name="envelope" size={18} /> Abrir la invitación
                </button>
              </div>
            </div>
          ) : (
            <div className={`gift-reveal ${isNew ? '' : 'opened'}`}>
              <GiftCard data={{ ...g, until }} item={item} biz={biz} />
              {st !== 'enviado' && st !== 'abierto' && (
                <div className={`gift-stamp ${st}`} aria-hidden="true">{GIFT_LABEL[st].label}</div>
              )}
            </div>
          )}
        </div>

        <aside className="gift-side">
          {isNew ? (
            <section className="card" aria-labelledby="share-h">
              <h2 id="share-h">Compartila</h2>
              <p className="small muted">Mandale el enlace o dictale el código. La demo no envía nada por vos.</p>
              <div className="share-code">
                <span className="small muted">Código</span>
                <strong className="gc-code" data-testid="gift-code">{g.code}</strong>
              </div>
              <label className="sr-only" htmlFor="gift-link">Enlace de la invitación</label>
              <input id="gift-link" className="share-link" readOnly value={link} onFocus={(e) => e.currentTarget.select()} />
              <div className="row" style={{ marginTop: 10 }}>
                <button className="btn secondary" type="button" onClick={copy}>Copiar enlace</button>
                <Link className="btn ghost" to={`/${biz.id}/regalo/${g.code}`} data-testid="gift-view-as">Ver como {g.toAlias}</Link>
              </div>
              <p className="small" role="status">{copied}</p>
              {g.conversationId && (
                <Callout>
                  Se generó el mensaje de WhatsApp <strong>simulado</strong> para {g.toAlias}. <Link to={`/${biz.id}/simulador?c=${g.conversationId}`}>Ver el mensaje en el simulador</Link>.
                </Callout>
              )}
              <div className="row" style={{ marginTop: 12 }}>
                <Link className="btn" to={`/${biz.id}/regalar`}>Crear otra invitación</Link>
              </div>
            </section>
          ) : (
            <section className="card" aria-labelledby="use-h">
              <h2 id="use-h">{st === 'canjeado' ? 'Invitación canjeada' : st === 'vencido' ? 'La invitación venció' : st === 'cancelado' ? 'La invitación fue cancelada' : 'Cómo se canjea'}</h2>
              {st === 'canjeado' && (
                <p>Se usó en el pedido <Link to={`/${biz.id}/pedido/${g.orderId}`}>{g.orderId}</Link>. ¡Buen provecho!</p>
              )}
              {st === 'vencido' && (
                <>
                  <HouseChar biz={biz.id} mood="triste" size={80} />
                  <p>Venció el {until}. Pedile a {g.fromAlias} que genere otra: las invitaciones duran 30 días.</p>
                </>
              )}
              {st === 'cancelado' && <p>Motivo: {g.reason}. No se cobró nada.</p>}
              {(st === 'enviado' || st === 'abierto') && (
                <>
                  <ol className="steps">
                    <li><span>Elegí las opciones de {g.itemName} (guarnición, tamaño…).</span></li>
                    <li><span>El plato base ({fmtARS(g.coveredCents)}) queda cubierto; los extras se pagan.</span></li>
                    <li><span>Enviá tu pedido en la mesa o para retirar, como siempre.</span></li>
                  </ol>
                  {un && <Callout tone="warn">Hoy {item?.name} no está disponible en esta sede ({un === 'fuera-de-franja' ? 'fuera de su franja' : 'agotado'}). Podés canjearla otro día o en otra sede.</Callout>}
                  {inCart ? (
                    <Link className="btn lg" to={`/${biz.id}/pedido`} data-testid="gift-in-cart">Ya está en tu pedido · revisar</Link>
                  ) : (
                    <Link className="btn accent lg" to={`/${biz.id}/carta/${g.itemId}?regalo=${g.code}`} data-testid="gift-redeem">
                      <Glyph name="gift" size={18} /> Canjear en mi pedido
                    </Link>
                  )}
                </>
              )}
            </section>
          )}
        </aside>
      </div>
    </main>
  )
}
