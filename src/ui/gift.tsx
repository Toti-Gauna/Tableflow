import type { BusinessProfile, MenuItem, SeasonId } from '../domain/types'
import { DishArt } from './art'
import { SeasonArt } from './art/season'
import { seasonById } from '../domain/season'

export interface GiftCardData {
  fromAlias: string
  toAlias: string
  message: string
  theme: SeasonId
  code?: string
  until?: string
}

/** Tarjeta de la invitación: la misma pieza en la vista previa, la página del regalo y la administración. */
export function GiftCard({ data, item, biz, compact = false, className }: { data: GiftCardData; item?: MenuItem; biz: BusinessProfile; compact?: boolean; className?: string }) {
  const from = data.fromAlias.trim() || 'Alguien'
  const to = data.toAlias.trim() || '…'
  return (
    <article className={`gift-card ${compact ? 'compact' : ''} ${className ?? ''}`} data-season={data.theme} aria-label={`Tarjeta de invitación de ${from} para ${to}`}>
      <div className="gc-band">
        <SeasonArt id={data.theme} size={compact ? 44 : 64} />
        <div>
          <p className="gc-eyebrow">Invitación · {biz.name}</p>
          <p className="gc-season">{seasonById(data.theme).name}</p>
        </div>
        <span className="gc-demo">DEMO</span>
      </div>
      <div className="gc-body">
        {item && <DishArt item={item} size={compact ? 96 : 148} className="gc-dish" />}
        <p className="gc-to">Para <strong>{to}</strong></p>
        <h3 className="gc-title">
          {from} te invita a comer {item ? <em>{item.name}</em> : 'un plato de la casa'}
        </h3>
        {data.message.trim() ? <blockquote className="gc-msg">“{data.message.trim()}”</blockquote> : <p className="gc-msg empty">Tu mensaje aparece acá.</p>}
      </div>
      <footer className="gc-foot">
        <span>Código <b className="gc-code">{data.code ?? `${biz.id === 'ritual-cafe' ? 'RC' : 'MC'}-····`}</b></span>
        <span>{data.until ? `Válida hasta ${data.until}` : 'Válida 30 días'}</span>
      </footer>
    </article>
  )
}
