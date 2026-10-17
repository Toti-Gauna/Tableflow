import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../../store'
import { PageHead } from '../../ui/Shell'
import { act, Callout, Empty, ReasonDialog, StatusBadge } from '../../ui/kit'
import { Plate } from '../../ui/glyphs'
import { GIFT_LABEL } from '../../ui/format'
import { giftCart, giftStatus, giftUsable } from '../../domain/gifts'
import { dateKeyOf, fmtDateShort } from '../../domain/time'
import { fmtARS } from '../../domain/money'
import { SEASON_NAME } from '../../domain/season'
import type { GiftInvite, GiftStatus } from '../../domain/types'

type Filter = 'todas' | 'activas' | GiftStatus

/** Regalos (invitaciones a comer): seguimiento para recepción, caja y encargado. */
export function AdminRegalos() {
  const state = useApp()
  const bizId = state.session.businessId
  const now = state.clock.nowMs
  const [filter, setFilter] = useState<Filter>('todas')
  const [cancel, setCancel] = useState<GiftInvite | null>(null)
  const [msg, setMsg] = useState('')
  const all = state.gifts.filter((g) => g.businessId === bizId).sort((a, b) => b.createdAt - a.createdAt || b.id.localeCompare(a.id))
  const st = (g: GiftInvite) => giftStatus(g, now)
  const list = all.filter((g) => filter === 'todas' || (filter === 'activas' ? giftUsable(g, now) : st(g) === filter))
  const active = all.filter((g) => giftUsable(g, now))
  const redeemed = all.filter((g) => st(g) === 'canjeado')
  const coveredCents = state.orders.filter((o) => o.businessId === bizId && !['rechazado', 'cancelado'].includes(o.status)).flatMap((o) => o.lines).reduce((a, l) => a + (l.coveredCents ?? 0), 0)
  const item = (g: GiftInvite) => state.menuItems.find((m) => m.id === g.itemId)
  const day = (ms: number) => fmtDateShort(dateKeyOf(ms))
  const actions = (g: GiftInvite, mobile = false) => (
    <div className="row tight">
      <Link className="btn secondary small" to={`/${g.businessId}/regalo/${g.code}`}>Ver tarjeta<span className="sr-only"> {g.code}</span></Link>
      {giftUsable(g, now) && <button className="btn ghost small" type="button" onClick={() => setCancel(g)} data-testid={`${mobile ? "m-" : ""}gift-cancel-${g.code}`}>Cancelar<span className="sr-only"> {g.code}</span></button>}
    </div>
  )
  return (
    <>
      <PageHead title="Regalos" sub="Invitaciones a comer: quién invita, a quién, qué plato y en qué pedido se canjeó. Sin cobros ni envíos reales." />
      <div className="kpis" role="group" aria-label="Indicadores de regalos">
        <div><p className="k">Activas</p><p className="kpi" data-testid="kpi-gifts-active">{active.length}</p><p className="s">sin canjear y vigentes</p></div>
        <div><p className="k">Canjeadas</p><p className="kpi">{redeemed.length}</p><p className="s">asociadas a un pedido</p></div>
        <div><p className="k">Valor cubierto</p><p className="kpi money">{fmtARS(coveredCents)}</p><p className="s">precio base de lo canjeado (DEMO)</p></div>
        <div><p className="k">Vencidas o canceladas</p><p className="kpi">{all.length - active.length - redeemed.length}</p><p className="s">vencen a los 30 días simulados</p></div>
      </div>
      <div className="chips" role="group" aria-label="Filtrar regalos" style={{ margin: '14px 0' }}>
        {(['todas', 'activas', 'canjeado', 'vencido', 'cancelado'] as Filter[]).map((f) => (
          <button key={f} type="button" className="chip-toggle" aria-pressed={filter === f} onClick={() => setFilter(f)}>
            {f === 'todas' ? 'Todas' : f === 'activas' ? 'Activas' : GIFT_LABEL[f as GiftStatus].label}
          </button>
        ))}
      </div>
      {msg && <Callout tone="ok" role="status">{msg}</Callout>}
      {list.length === 0 ? (
        <Empty title={all.length ? 'No hay regalos con ese filtro' : 'Todavía no hay regalos'} action={<Link className="btn" to={`/${bizId}/regalar`}>Crear una invitación de prueba</Link>}>
          Las invitaciones se crean desde la vista cliente (“Regalar”). Acá se siguen y, si hace falta, se cancelan con motivo.
        </Empty>
      ) : (
        <>
          <div className="table-wrap responsive">
            <table>
              <caption className="sr-only">Regalos</caption>
              <thead><tr><th>Código</th><th>De → para</th><th>Plato</th><th>Estado</th><th>Creada · vence</th><th>Pedido</th><th /></tr></thead>
              <tbody>
                {list.map((g) => {
                  const it = item(g)
                  return (
                    <tr key={g.id} data-testid={`gift-row-${g.code}`}>
                      <td><strong className="mono">{g.code}</strong><div className="small muted">{SEASON_NAME[g.theme]} · {g.delivery === 'whatsapp-simulado' ? 'WhatsApp simulado' : 'enlace'}</div></td>
                      <td>{g.fromAlias} → {g.toAlias}</td>
                      <td><span className="cell-dish">{it && <Plate item={it} size={36} decorative />}{g.itemName}<span className="money small muted"> · {fmtARS(g.coveredCents)}</span></span></td>
                      <td><StatusBadge s={GIFT_LABEL[st(g)]} />{g.reason && <div className="small muted">{g.reason}</div>}{giftCart(state, g.id) && <div className="small muted">En un pedido sin enviar</div>}</td>
                      <td>{day(g.createdAt)} · {day(g.expiresAt)}</td>
                      <td>{g.orderId ? <Link to={`/admin/pedidos/${g.orderId}`}>{g.orderId}</Link> : <span className="muted">—</span>}</td>
                      <td>{actions(g)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="cards-m">
            {list.map((g) => (
              <div className="card mcard" key={g.id}>
                <div className="row between"><strong className="mono">{g.code}</strong><StatusBadge s={GIFT_LABEL[st(g)]} /></div>
                <p style={{ margin: '6px 0' }}>{g.fromAlias} → {g.toAlias} · {g.itemName}</p>
                <p className="small muted" style={{ margin: '0 0 10px' }}>Creada {day(g.createdAt)} · vence {day(g.expiresAt)}{g.orderId ? ` · pedido ${g.orderId}` : ''}</p>
                {actions(g, true)}
              </div>
            ))}
          </div>
        </>
      )}
      <ReasonDialog
        open={!!cancel}
        title={`Cancelar la invitación ${cancel?.code ?? ''}`}
        body={<p>La invitación de {cancel?.fromAlias} para {cancel?.toAlias} deja de poder canjearse. Si estaba en un pedido sin enviar, se quita esa línea. No hay devolución real porque no hubo cobro.</p>}
        confirmLabel="Cancelar invitación"
        placeholder="Motivo (obligatorio)"
        onCancel={() => setCancel(null)}
        onConfirm={(reason) => {
          if (!cancel) return
          const o = act({ type: 'gift/cancel', giftId: cancel.id, reason }, `Invitación ${cancel.code} cancelada`)
          if (o.ok) {
            setMsg(`Invitación ${cancel.code} cancelada: ${reason}.`)
            setCancel(null)
          }
        }}
      />
    </>
  )
}
