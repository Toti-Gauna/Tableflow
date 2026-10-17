import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useApp } from '../../store'
import { PageHead } from '../../ui/Shell'
import { act, Badge, Callout, Empty, ReasonDialog } from '../../ui/kit'
import { fmtARS } from '../../domain/money'
import { activeCustomers } from '../../domain/customers'
import { CADENCE_LABEL, SEGMENT_LABEL, campaignDays, campaignResults, projectCampaign, todayKey } from '../../domain/growth'
import { SEASON_IDS, SEASON_NAME, specialWindows } from '../../domain/season'
import { addDays, dayName, fmtDateShort, monthName, weekdayOf } from '../../domain/time'
import type { CampaignDraft } from '../../domain/assistant-biz'
import type { AppState, Campaign, CampaignStatus, SegmentId } from '../../domain/types'
import { parsePesos } from './Costos'
import '../../ui/chatpane.css'
import './growth.css'

const STATUS: Record<CampaignStatus, { label: string; tone: 'neutral' | 'info' | 'ok' | 'warn' | 'err' | 'review' }> = {
  borrador: { label: 'Borrador', tone: 'neutral' }, aprobada: { label: 'Aprobada', tone: 'info' }, programada: { label: 'Programada', tone: 'review' },
  activa: { label: 'Activa', tone: 'ok' }, pausada: { label: 'Pausada', tone: 'warn' }, finalizada: { label: 'Finalizada', tone: 'neutral' }, cancelada: { label: 'Cancelada', tone: 'err' },
}
const SCOPE = { individual: 'Clientes elegidos', segmento: 'Segmento', masiva: 'Masiva (todos con consentimiento)' }
const TRIGGER = { manual: 'Manual', programada: 'Programada', evento: 'Por evento' }
const EVENT = { 'primer-pedido': 'Primer pedido entregado', referido: 'Referido cumplido' }
const ARS = (c: number | null) => (c === null ? 'ND' : fmtARS(c))
const PCT = (p: number | null) => (p === null ? 'ND' : `${(Math.round(p * 1000) / 10).toLocaleString('es-AR')} %`)
const pesos = (c: number | null) => (c === null ? '' : String(c / 100))

function blank(s: AppState): CampaignDraft {
  const t = todayKey(s)
  return {
    name: '', scope: 'segmento', trigger: 'manual', event: null, cadence: 'unica', seasonId: null, startKey: t, endKey: addDays(t, 30),
    audience: { customerIds: [], segment: 'frecuentes' }, benefit: { type: 'porcentaje', value: 10, itemIds: [] },
    rules: { minOrderCents: 0, validDays: 14, maxDiscountCents: 0, maxPerCustomer: 1, totalCap: 50, budgetCents: 0 }, refItemId: null, fixedCostCents: null, assumedRedemptionPct: null,
  }
}
const asCampaign = (s: AppState, d: CampaignDraft, base?: Campaign): Campaign => ({ id: base?.id ?? 'CMP-nueva', businessId: s.session.businessId, createdAt: s.clock.nowMs, version: 1, status: base?.status ?? 'borrador', createdBy: base?.createdBy ?? 'encargado', approvedBy: null, activatedAt: null, lastIssuedKey: null, reason: null, operationId: '', ...d })

// ------------------------------------------------------------------ proyección, simulación y resultado observado
function Projection({ c }: { c: Campaign }) {
  const state = useApp()
  const p = projectCampaign(state, c)
  const [sim, setSim] = useState<number>(c.assumedRedemptionPct ?? 20)
  const simOrders = Math.min(c.rules.totalCap, Math.round((p.audience.included.length * sim) / 100))
  const simDiscount = p.discountPerOrderCents === null ? null : Math.min(c.rules.budgetCents, simOrders * p.discountPerOrderCents)
  const simContribution = p.withDiscount && c.fixedCostCents !== null ? simOrders * p.withDiscount.contributionCents - c.fixedCostCents : null
  return (
    <div className="proj">
      <section className="proj-box" aria-labelledby="pj-h" data-testid="projection">
        <h3 id="pj-h">Proyección <span className="muted small">· antes de activar, con los costos cargados</span></h3>
        {!p.complete && (
          <div className="cp-missing" role="status" data-testid="projection-missing">
            <strong>Faltan datos (ND): queda en borrador.</strong>
            <ul>{p.missing.map((m) => <li key={m}>{m}</li>)}</ul>
            {p.missing.some((m) => m.startsWith('cost')) && <Link to="/admin/costos">Cargar costos</Link>}
          </div>
        )}
        <dl className="cp-facts">
          <dt>Audiencia</dt><dd data-testid="pj-audience">{p.audience.included.length} cliente(s) · {p.audience.excluded.length} afuera</dd>
          <dt>Descuento por pedido</dt><dd>{ARS(p.discountPerOrderCents)}</dd>
          <dt>Costo máximo</dt><dd data-testid="pj-maxcost">{ARS(p.maxCostCents)}</dd>
          <dt>Contribución sin descuento</dt><dd>{p.withoutDiscount ? `${ARS(p.withoutDiscount.contributionCents)} · ${PCT(p.withoutDiscount.pct)}` : 'ND'}</dd>
          <dt>Contribución con descuento</dt><dd data-testid="pj-contribution">{p.withDiscount ? `${ARS(p.withDiscount.contributionCents)} · ${PCT(p.withDiscount.pct)}` : 'ND'}</dd>
          <dt>Equilibrio</dt><dd data-testid="pj-breakeven">{!p.complete ? 'ND' : p.breakEvenOrders === null ? 'sin equilibrio por volumen' : `${p.breakEvenOrders} pedido(s)`}</dd>
          <dt>Pedidos proyectados</dt><dd>{p.expectedOrders === null ? 'sin supuesto de canje' : p.expectedOrders}</dd>
        </dl>
        {p.audience.excluded.length > 0 && (
          <details><summary className="small">Quiénes quedan afuera y por qué</summary><ul className="small">{p.audience.excluded.map((x) => <li key={x.customer.id}>{x.customer.alias}: {x.reason}</li>)}</ul></details>
        )}
        <div className="cp-assume"><strong>Supuestos</strong><ul>{p.assumptions.map((a) => <li key={a}>{a}</li>)}</ul></div>
      </section>
      <section className="proj-box sim" aria-labelledby="sim-h">
        <h3 id="sim-h">Simulación <span className="muted small">· “¿y si…?”, no es un pronóstico ni se guarda</span></h3>
        <label className="sim-row" htmlFor="sim-pct">Si canjeara el <input id="sim-pct" type="number" min={0} max={100} value={sim} onChange={(e) => setSim(Math.max(0, Math.min(100, Number(e.target.value) || 0)))} /> % de la audiencia</label>
        <dl className="cp-facts">
          <dt>Canjes</dt><dd>{simOrders} (cupo {c.rules.totalCap})</dd>
          <dt>Descuentos</dt><dd>{ARS(simDiscount)}</dd>
          <dt>Contribución menos costo fijo</dt><dd data-testid="sim-result">{ARS(simContribution)}</dd>
        </dl>
      </section>
      <Observed c={c} />
    </div>
  )
}
function Observed({ c }: { c: Campaign }) {
  const state = useApp()
  if (!state.campaigns.some((x) => x.id === c.id) || ['borrador', 'aprobada'].includes(c.status)) return null
  const r = campaignResults(state, c.id)
  return (
    <section className="proj-box observed" aria-labelledby="ob-h" data-testid="observed">
      <h3 id="ob-h">Resultado observado <span className="muted small">· lo que pasó en la demo</span></h3>
      <dl className="cp-facts">
        <dt>Emitidos</dt><dd>{r.issued} · enviados en simulación {r.sent} · omitidos {r.skipped}</dd>
        <dt>Disponibles / canjeados</dt><dd data-testid="ob-redeemed">{r.available} / {r.redeemed}</dd>
        <dt>Vencidos / anulados</dt><dd>{r.expired} / {r.voided}</dd>
        <dt>Pedidos con beneficio</dt><dd>{r.orders}</dd>
        <dt>Ingreso neto</dt><dd>{ARS(r.netCents)} (bruto {ARS(r.grossCents)} − descuentos {ARS(r.discountCents)})</dd>
        <dt>Contribución observada</dt><dd>{ARS(r.contributionCents)}</dd>
        <dt>Presupuesto usado</dt><dd>{ARS(r.budgetUsedCents)} de {ARS(c.rules.budgetCents)}</dd>
      </dl>
      <p className="small muted">Son ventas atribuidas a la campaña: no prueban que sin ella no se hubieran hecho.</p>
    </section>
  )
}

// ------------------------------------------------------------------ editor
function Editor({ base }: { base?: Campaign }) {
  const state = useApp()
  const nav = useNavigate()
  const bizId = state.session.businessId
  const isBoss = state.session.role === 'encargado'
  const editable = isBoss && (!base || ['borrador', 'aprobada'].includes(base.status))
  const [d, setD] = useState<CampaignDraft>(() => (base ? { ...base, audience: { ...base.audience }, benefit: { ...base.benefit }, rules: { ...base.rules } } : blank(state)))
  const [money, setMoney] = useState(() => ({ value: base?.benefit.type === 'monto' ? pesos(base.benefit.value) : '', min: pesos(d.rules.minOrderCents), maxd: pesos(d.rules.maxDiscountCents), budget: pesos(d.rules.budgetCents), fixed: pesos(d.fixedCostCents) }))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [msg, setMsg] = useState<{ tone: 'ok' | 'err'; text: string } | null>(null)
  const [cancel, setCancel] = useState(false)
  const customers = activeCustomers(state, bizId)
  const items = state.menuItems.filter((m) => m.businessId === bizId && !m.tags.includes('+18'))
  const set = (patch: Partial<CampaignDraft>) => setD((x) => ({ ...x, ...patch }))
  // importes en pesos → centavos; un importe mal escrito no entra en la proyección y frena el guardado
  const cents = (k: keyof typeof money) => { const v = parsePesos(money[k]); return typeof v === 'number' ? v : 0 }
  const badMoney = (['value', 'min', 'maxd', 'budget', 'fixed'] as const).filter((k) => (k !== 'value' || d.benefit.type === 'monto') && parsePesos(money[k]) === undefined)
  // borrador en vivo para la proyección
  const live: CampaignDraft = {
    ...d,
    benefit: { ...d.benefit, value: d.benefit.type === 'monto' ? cents('value') : d.benefit.value },
    rules: { ...d.rules, minOrderCents: cents('min'), maxDiscountCents: cents('maxd'), budgetCents: cents('budget') },
    fixedCostCents: typeof parsePesos(money.fixed) === 'number' ? (parsePesos(money.fixed) as number) : null,
  }
  const liveCampaign = asCampaign(state, live, base ? state.campaigns.find((x) => x.id === base.id) : undefined)
  const proj = projectCampaign(state, liveCampaign)
  const say = (o: ReturnType<typeof act>, ok: string) => setMsg(o.ok ? { tone: 'ok', text: o.message ?? ok } : { tone: 'err', text: o.message })

  const save = () => {
    if (badMoney.length) return setErrors({ rules: 'Hay importes mal escritos: usá pesos, por ejemplo 15.000 o 2.500,50.' })
    const op = base ? undefined : (act({ type: 'op/alloc' }).data as { operationId: string }).operationId
    const o = act({ type: 'campaign/save', businessId: bizId, campaignId: base?.id, draft: live, operationId: op }, base ? 'Campaña guardada' : 'Borrador creado')
    setErrors(o.ok ? {} : ((o.data as { errors?: Record<string, string> })?.errors ?? {}))
    say(o, 'Guardado')
    if (o.ok && !base) nav(`/admin/campanas/${(o.data as { campaignId: string }).campaignId}`, { replace: true })
  }
  const cur = base ? state.campaigns.find((x) => x.id === base.id) ?? base : undefined
  const err = (k: string) => errors[k] ? <span className="err-text small" role="alert">{errors[k]}</span> : null

  return (
    <>
      <PageHead title={base ? cur!.name : 'Nueva campaña'} sub={base ? `${base.id} · ${SCOPE[cur!.scope]} · ${TRIGGER[cur!.trigger]}${cur!.createdBy === 'asistente' ? ' · creada por el asistente' : ''}` : 'Borrador: necesita aprobación antes de salir'}>
        {cur && <Badge tone={STATUS[cur.status].tone} label={STATUS[cur.status].label} />}
      </PageHead>
      <p><Link to="/admin/campanas">← Todas las campañas</Link></p>
      {msg && <Callout tone={msg.tone === 'ok' ? 'ok' : 'err'} role="alert">{msg.text}</Callout>}
      {cur?.createdBy === 'asistente' && cur.status === 'borrador' && <Callout tone="review">Este borrador lo preparó el asistente. Revisá los supuestos: aprobarlo es decisión del encargado.</Callout>}
      {!isBoss && <Callout>Solo el encargado crea, aprueba y activa campañas (vista de la demo, no un permiso real).</Callout>}
      <div className="camp-layout">
        <form className="camp-form card" onSubmit={(e) => { e.preventDefault(); save() }} aria-label="Datos de la campaña">
          <fieldset disabled={!editable}>
            <div className="field"><label htmlFor="cf-name">Nombre</label><input id="cf-name" value={d.name} onChange={(e) => set({ name: e.target.value })} data-testid="cf-name" />{err('name')}</div>
            <fieldset className="field-set"><legend>A quién va</legend>
              {(['individual', 'segmento', 'masiva'] as const).map((k) => <label key={k} className="choice"><input type="radio" name="cf-scope" checked={d.scope === k} onChange={() => set({ scope: k })} /> {SCOPE[k]}</label>)}
              {d.scope === 'segmento' && (
                <div className="field"><label htmlFor="cf-seg">Segmento</label><select id="cf-seg" value={d.audience.segment ?? ''} onChange={(e) => set({ audience: { ...d.audience, segment: e.target.value as SegmentId } })}>{(['frecuentes', 'inactivos', 'nuevos', 'con-beneficio-sin-usar'] as SegmentId[]).map((s) => <option key={s} value={s}>{SEGMENT_LABEL[s]}</option>)}</select></div>
              )}
              {d.scope === 'individual' && (
                <div className="check-list">{customers.map((c) => <label key={c.id} className="choice"><input type="checkbox" checked={d.audience.customerIds.includes(c.id)} onChange={(e) => set({ audience: { ...d.audience, customerIds: e.target.checked ? [...d.audience.customerIds, c.id] : d.audience.customerIds.filter((x) => x !== c.id) } })} /> {c.alias}{!c.consent.promo && <span className="muted small"> · sin consentimiento promocional</span>}</label>)}</div>
              )}
              {err('audience')}{err('scope')}
            </fieldset>
            <fieldset className="field-set"><legend>Cuándo sale</legend>
              <div className="field-row">
                <div className="field"><label htmlFor="cf-trig">Disparo</label><select id="cf-trig" value={d.trigger} onChange={(e) => set({ trigger: e.target.value as Campaign['trigger'], event: e.target.value === 'evento' ? 'primer-pedido' : null })}>{(['manual', 'programada', 'evento'] as const).map((k) => <option key={k} value={k}>{TRIGGER[k]}</option>)}</select></div>
                {d.trigger === 'evento' && <div className="field"><label htmlFor="cf-ev">Evento</label><select id="cf-ev" value={d.event ?? ''} onChange={(e) => set({ event: e.target.value as Campaign['event'] })}>{(['primer-pedido', 'referido'] as const).map((k) => <option key={k} value={k}>{EVENT[k]}</option>)}</select></div>}
                <div className="field"><label htmlFor="cf-cad">Cadencia</label><select id="cf-cad" value={d.cadence} onChange={(e) => set({ cadence: e.target.value as Campaign['cadence'] })}>{Object.entries(CADENCE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
                {['estacional', 'festividad'].includes(d.cadence) && <div className="field"><label htmlFor="cf-sea">{d.cadence === 'festividad' ? 'Festividad' : 'Estación'}</label><select id="cf-sea" value={d.seasonId ?? ''} onChange={(e) => set({ seasonId: e.target.value as Campaign['seasonId'] })}><option value="">Elegí…</option>{SEASON_IDS.filter((x) => (d.cadence === 'festividad' ? ['madre', 'padre', 'amigo', 'fiestas', 'enamorados'] : ['primavera', 'verano', 'otono', 'invierno']).includes(x)).map((x) => <option key={x} value={x}>{SEASON_NAME[x]}</option>)}</select>{err('seasonId')}</div>}
              </div>
              <div className="field-row">
                <div className="field"><label htmlFor="cf-from">Desde</label><input id="cf-from" type="date" value={d.startKey} onChange={(e) => set({ startKey: e.target.value })} /></div>
                <div className="field"><label htmlFor="cf-to">Hasta</label><input id="cf-to" type="date" value={d.endKey} onChange={(e) => set({ endKey: e.target.value })} /></div>
              </div>
              {err('dates')}{err('trigger')}{err('event')}
            </fieldset>
            <fieldset className="field-set"><legend>Beneficio</legend>
              <div className="field-row">
                <label className="choice"><input type="radio" name="cf-bt" checked={d.benefit.type === 'porcentaje'} onChange={() => set({ benefit: { ...d.benefit, type: 'porcentaje', value: d.benefit.type === 'porcentaje' ? d.benefit.value : 10 } })} /> Porcentaje</label>
                <label className="choice"><input type="radio" name="cf-bt" checked={d.benefit.type === 'monto'} onChange={() => set({ benefit: { ...d.benefit, type: 'monto' } })} /> Monto fijo</label>
              </div>
              {d.benefit.type === 'porcentaje'
                ? <div className="field"><label htmlFor="cf-pct">Porcentaje</label><input id="cf-pct" type="number" min={1} max={90} value={d.benefit.value} onChange={(e) => set({ benefit: { ...d.benefit, value: Number(e.target.value) } })} data-testid="cf-pct" /></div>
                : <div className="field"><label htmlFor="cf-amt">Monto (pesos)</label><input id="cf-amt" inputMode="decimal" value={money.value} onChange={(e) => setMoney({ ...money, value: e.target.value })} data-testid="cf-amount" /></div>}
              <details><summary className="small">Platos donde aplica ({d.benefit.itemIds.length ? d.benefit.itemIds.length : 'todos'})</summary>
                <div className="check-list">{items.map((m) => <label key={m.id} className="choice"><input type="checkbox" checked={d.benefit.itemIds.includes(m.id)} onChange={(e) => set({ benefit: { ...d.benefit, itemIds: e.target.checked ? [...d.benefit.itemIds, m.id] : d.benefit.itemIds.filter((x) => x !== m.id) } })} /> {m.name}</label>)}</div>
              </details>
              {err('benefit')}
            </fieldset>
            <fieldset className="field-set"><legend>Reglas</legend>
              <div className="field-row">
                <div className="field"><label htmlFor="cf-min">Compra mínima (pesos)</label><input id="cf-min" inputMode="decimal" value={money.min} onChange={(e) => setMoney({ ...money, min: e.target.value })} /></div>
                <div className="field"><label htmlFor="cf-maxd">Tope por pedido (pesos, 0 = sin tope)</label><input id="cf-maxd" inputMode="decimal" value={money.maxd} onChange={(e) => setMoney({ ...money, maxd: e.target.value })} /></div>
              </div>
              <div className="field-row">
                <div className="field"><label htmlFor="cf-days">Vigencia (días)</label><input id="cf-days" type="number" min={1} max={90} value={d.rules.validDays} onChange={(e) => set({ rules: { ...d.rules, validDays: Number(e.target.value) } })} /></div>
                <div className="field"><label htmlFor="cf-per">Por cliente</label><input id="cf-per" type="number" min={1} value={d.rules.maxPerCustomer} onChange={(e) => set({ rules: { ...d.rules, maxPerCustomer: Number(e.target.value) } })} /></div>
                <div className="field"><label htmlFor="cf-cap">Cupo de canjes</label><input id="cf-cap" type="number" min={1} value={d.rules.totalCap} onChange={(e) => set({ rules: { ...d.rules, totalCap: Number(e.target.value) } })} /></div>
              </div>
              <div className="field"><label htmlFor="cf-bud">Presupuesto de descuentos (pesos)</label><input id="cf-bud" inputMode="decimal" value={money.budget} onChange={(e) => setMoney({ ...money, budget: e.target.value })} data-testid="cf-budget" /></div>
              <p className="small muted">No se acumula: un beneficio por pedido y nunca junto a una invitación. Si el pedido se rechaza o cancela, el beneficio vuelve a estar disponible.</p>
              {err('rules')}
            </fieldset>
            <fieldset className="field-set"><legend>Para proyectar</legend>
              <div className="field"><label htmlFor="cf-ref">Ítem de referencia</label><select id="cf-ref" value={d.refItemId ?? ''} onChange={(e) => set({ refItemId: e.target.value || null })} data-testid="cf-ref"><option value="">Elegí un plato…</option>{items.map((m) => <option key={m.id} value={m.id}>{m.name}{m.costCents === null ? ' (costo ND)' : ''}</option>)}</select>{err('refItemId')}</div>
              <div className="field-row">
                <div className="field"><label htmlFor="cf-fix">Costo fijo de la campaña (pesos; vacío = ND)</label><input id="cf-fix" inputMode="decimal" value={money.fixed} onChange={(e) => setMoney({ ...money, fixed: e.target.value })} data-testid="cf-fixed" />{err('fixedCostCents')}</div>
                <div className="field"><label htmlFor="cf-red">Supuesto de canje (%; vacío = sin supuesto)</label><input id="cf-red" type="number" min={0} max={100} value={d.assumedRedemptionPct ?? ''} onChange={(e) => set({ assumedRedemptionPct: e.target.value === '' ? null : Number(e.target.value) })} />{err('assumedRedemptionPct')}</div>
              </div>
            </fieldset>
            <div className="row"><button className="btn" type="submit" data-testid="cf-save">{base ? 'Guardar cambios' : 'Guardar borrador'}</button>{base?.status === 'aprobada' && <span className="small muted">Guardar cambios la devuelve a borrador.</span>}</div>
          </fieldset>
        </form>
        <div className="camp-side">
          {cur && isBoss && (
            <div className="card camp-actions" aria-label="Acciones de la campaña">
              {cur.status === 'borrador' && <button className="btn" type="button" onClick={() => say(act({ type: 'campaign/approve', campaignId: cur.id }), 'Aprobada')} disabled={!proj.complete} data-testid="camp-approve">Aprobar</button>}
              {cur.status === 'borrador' && !proj.complete && <p className="small muted">Para aprobar hacen falta los datos marcados como ND.</p>}
              {cur.status === 'aprobada' && <button className="btn" type="button" onClick={() => say(act({ type: 'campaign/activate', campaignId: cur.id }), 'Activada')} data-testid="camp-activate">{cur.trigger === 'programada' ? 'Programar' : 'Activar'}</button>}
              {['activa', 'programada'].includes(cur.status) && <button className="btn secondary" type="button" onClick={() => say(act({ type: 'campaign/pause', campaignId: cur.id }), 'Pausada')} data-testid="camp-pause">Pausar</button>}
              {cur.status === 'pausada' && <button className="btn" type="button" onClick={() => say(act({ type: 'campaign/resume', campaignId: cur.id }), 'Reanudada')} data-testid="camp-resume">Reanudar</button>}
              {['activa', 'programada', 'pausada'].includes(cur.status) && <button className="btn secondary" type="button" onClick={() => say(act({ type: 'campaign/finish', campaignId: cur.id }), 'Finalizada')} data-testid="camp-finish">Finalizar</button>}
              {!['finalizada', 'cancelada'].includes(cur.status) && <button className="btn danger" type="button" onClick={() => setCancel(true)} data-testid="camp-cancel">Cancelar campaña</button>}
              <p className="small muted">Los envíos son simulados: no sale ningún mensaje real.</p>
            </div>
          )}
          <Projection c={{ ...liveCampaign, status: cur?.status ?? 'borrador' }} />
          {cur && <Benefits c={cur} />}
        </div>
      </div>
      <ReasonDialog open={cancel} title="Cancelar la campaña" confirmLabel="Cancelar campaña" body={<p>Los beneficios sin usar se anulan; los ya canjeados no cambian.</p>} onCancel={() => setCancel(false)} onConfirm={(reason) => { say(act({ type: 'campaign/cancel', campaignId: cur!.id, reason }), 'Cancelada'); setCancel(false) }} />
    </>
  )
}

function Benefits({ c }: { c: Campaign }) {
  const state = useApp()
  const [voiding, setVoiding] = useState<string | null>(null)
  const list = state.benefits.filter((b) => b.campaignId === c.id)
  const sends = state.campaignSends.filter((x) => x.campaignId === c.id)
  if (!list.length && !sends.length) return null
  const name = (id: string) => state.customers.find((x) => x.id === id)?.alias ?? id
  return (
    <section className="card" aria-labelledby="bn-h">
      <h3 id="bn-h">Beneficios y envíos simulados</h3>
      <ul className="bn-list">
        {list.map((b) => (
          <li key={b.id} data-testid={`benefit-${b.code}`}>
            <strong>{name(b.customerId)}</strong> · <code>{b.code}</code> · {b.status}{b.orderId ? ` en ${b.orderId}` : ''}{b.reason ? ` (${b.reason})` : ''}
            {b.status === 'disponible' && ['encargado', 'caja'].includes(state.session.role) && <button className="btn ghost small" type="button" onClick={() => setVoiding(b.id)}>Anular</button>}
          </li>
        ))}
        {sends.filter((x) => x.status === 'omitido').map((x) => <li key={x.id} className="muted">{name(x.customerId)}: omitido ({x.reason})</li>)}
      </ul>
      <ReasonDialog open={!!voiding} title="Anular el beneficio" confirmLabel="Anular" body={<p>El cliente deja de poder usarlo. Queda en el historial.</p>} onCancel={() => setVoiding(null)} onConfirm={(reason) => { act({ type: 'benefit/void', benefitId: voiding, reason }, 'Beneficio anulado'); setVoiding(null) }} />
    </section>
  )
}

// ------------------------------------------------------------------ calendario
type View = 'semana' | 'mes' | 'bimestre' | 'estacion' | 'festividades'
const VIEW_LABEL: Record<View, string> = { semana: 'Semana', mes: 'Mes', bimestre: 'Bimestre', estacion: 'Estación', festividades: 'Festividades' }
function monthStart(k: string) { return `${k.slice(0, 8)}01` }
function addMonths(k: string, n: number) { const y = Number(k.slice(0, 4)); const m = Number(k.slice(5, 7)) - 1 + n; return `${y + Math.floor(m / 12)}-${String(((m % 12) + 12) % 12 + 1).padStart(2, '0')}-01` }
function MonthGrid({ first, camps, today }: { first: string; camps: Campaign[]; today: string }) {
  const last = addDays(addMonths(first, 1), -1)
  const lead = (weekdayOf(first) + 6) % 7 // semana de lunes a domingo
  const days: string[] = []
  for (let d = first; d <= last; d = addDays(d, 1)) days.push(d)
  const on = new Map<string, Campaign[]>()
  for (const c of camps) for (const d of campaignDays(c, first, last)) on.set(d, [...(on.get(d) ?? []), c])
  return (
    <section className="cal-month" aria-label={`${monthName(Number(first.slice(5, 7)))} ${first.slice(0, 4)}`}>
      <h3>{monthName(Number(first.slice(5, 7)))} {first.slice(0, 4)}</h3>
      <div className="cal-grid" role="list">
        {['lu', 'ma', 'mi', 'ju', 'vi', 'sá', 'do'].map((x) => <span key={x} className="cal-dow" aria-hidden="true">{x}</span>)}
        {Array.from({ length: lead }, (_, i) => <span key={`l${i}`} aria-hidden="true" />)}
        {days.map((d) => (
          <div key={d} role="listitem" className={`cal-day ${d === today ? 'today' : ''}`} aria-label={`${dayName(d)} ${fmtDateShort(d)}${on.get(d)?.length ? `: ${on.get(d)!.map((c) => c.name).join(', ')}` : ''}`}>
            <span className="cal-n" aria-hidden="true">{Number(d.slice(8))}</span>
            {on.get(d)?.map((c) => <Link key={c.id} to={`/admin/campanas/${c.id}`} className="cal-chip" data-status={c.status} tabIndex={-1} aria-hidden="true">{c.name}</Link>)}
          </div>
        ))}
      </div>
    </section>
  )
}
function Calendar({ camps }: { camps: Campaign[] }) {
  const state = useApp()
  const today = todayKey(state)
  const [view, setView] = useState<View>('mes')
  const [anchor, setAnchor] = useState(today)
  const shown = camps.filter((c) => c.status !== 'cancelada')
  const step = (n: number) => setAnchor(view === 'semana' ? addDays(anchor, 7 * n) : view === 'mes' ? addMonths(anchor, n) : view === 'bimestre' ? addMonths(anchor, 2 * n) : view === 'estacion' ? addMonths(anchor, 3 * n) : addMonths(anchor, 12 * n))
  const weekStart = addDays(anchor, -((weekdayOf(anchor) + 6) % 7))
  return (
    <section aria-labelledby="cal-h" className="calendar" data-testid="calendar">
      <h2 id="cal-h" className="sr-only">Calendario de campañas</h2>
      <div className="cal-bar">
        <div className="toggle-row" role="group" aria-label="Vista del calendario">
          {(Object.keys(VIEW_LABEL) as View[]).map((v) => <button key={v} className="chip-toggle" type="button" aria-pressed={view === v} onClick={() => setView(v)} data-testid={`cal-${v}`}>{VIEW_LABEL[v]}</button>)}
        </div>
        <div className="row">
          <button className="btn ghost small" type="button" onClick={() => step(-1)}>← Anterior</button>
          <button className="btn ghost small" type="button" onClick={() => setAnchor(today)}>Hoy</button>
          <button className="btn ghost small" type="button" onClick={() => step(1)}>Siguiente →</button>
        </div>
      </div>
      {view === 'semana' && (
        <ol className="cal-week">
          {Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)).map((d) => {
            const list = shown.filter((c) => campaignDays(c, d, d).length)
            return <li key={d} className={d === today ? 'today' : ''}><strong>{dayName(d)} {fmtDateShort(d)}</strong>{list.length ? <ul>{list.map((c) => <li key={c.id}><Link to={`/admin/campanas/${c.id}`}>{c.name}</Link> <span className="muted small">{STATUS[c.status].label}</span></li>)}</ul> : <p className="muted small">Sin campañas.</p>}</li>
          })}
        </ol>
      )}
      {view === 'mes' && <MonthGrid first={monthStart(anchor)} camps={shown} today={today} />}
      {view === 'bimestre' && <div className="cal-months">{[0, 1].map((i) => <MonthGrid key={i} first={addMonths(monthStart(anchor), i)} camps={shown} today={today} />)}</div>}
      {view === 'estacion' && <div className="cal-months">{[0, 1, 2].map((i) => <MonthGrid key={i} first={addMonths(monthStart(anchor), i)} camps={shown} today={today} />)}</div>}
      {view === 'festividades' && (
        <ul className="cal-fest">
          {[Number(anchor.slice(0, 4)), Number(anchor.slice(0, 4)) + 1].flatMap((y) => specialWindows(y)).filter((w, i, a) => a.findIndex((x) => x.from === w.from) === i && w.to >= anchor && w.from <= addDays(anchor, 366)).map((w) => {
            const list = shown.filter((c) => campaignDays(c, w.from, w.to).length)
            return <li key={w.from}><strong>{SEASON_NAME[w.id]}</strong> <span className="muted small">{fmtDateShort(w.from)} al {fmtDateShort(w.to)}</span>{list.length ? <ul>{list.map((c) => <li key={c.id}><Link to={`/admin/campanas/${c.id}`}>{c.name}</Link></li>)}</ul> : <p className="muted small">Sin campañas para esta fecha.</p>}</li>
          })}
        </ul>
      )}
      <p className="small muted">Cada campaña aparece los días en que está en el aire según su cadencia. Las programadas emiten en esos días, cuando el reloj simulado llega.</p>
    </section>
  )
}

// ------------------------------------------------------------------ listado
/** GR-B · Campañas individuales, por segmento y masivas; manuales, programadas y por evento. Todo simulado. */
export function AdminCampanas() {
  const state = useApp()
  const { id } = useParams()
  const [params, setParams] = useSearchParams()
  const bizId = state.session.businessId
  const camps = useMemo(() => state.campaigns.filter((c) => c.businessId === bizId), [state.campaigns, bizId])
  if (id === 'nueva') return <Editor key="nueva" />
  if (id) {
    const c = camps.find((x) => x.id === id)
    if (!c) return (<><PageHead title="Campañas" /><Empty title={`No existe la campaña ${id} en este perfil`} action={<Link className="btn" to="/admin/campanas">Volver al listado</Link>}>Puede ser de otro negocio.</Empty></>)
    return <Editor key={`${c.id}-${c.status}`} base={c} />
  }
  const tab = params.get('vista') === 'calendario' ? 'calendario' : 'lista'
  return (
    <>
      <PageHead title="Campañas" sub="Fidelización simulada: nada se envía ni se cobra de verdad">
        {state.session.role === 'encargado' && <Link className="btn" to="/admin/campanas/nueva" data-testid="camp-new">Nueva campaña</Link>}
      </PageHead>
      <div className="toggle-row" role="group" aria-label="Vista">
        <button className="chip-toggle" type="button" aria-pressed={tab === 'lista'} onClick={() => setParams({})}>Listado</button>
        <button className="chip-toggle" type="button" aria-pressed={tab === 'calendario'} onClick={() => setParams({ vista: 'calendario' })} data-testid="tab-calendar">Calendario</button>
      </div>
      {tab === 'calendario' ? <Calendar camps={camps} /> : camps.length === 0 ? (
        <Empty title="Este negocio no tiene campañas" action={<Link className="btn" to="/admin/campanas/nueva">Crear la primera</Link>}>También podés pedirle al asistente que arme un borrador.</Empty>
      ) : (
        <ul className="camp-list">
          {camps.map((c) => {
            const r = campaignResults(state, c.id)
            return (
              <li key={c.id} className="card camp-card" data-testid={`camp-${c.id}`}>
                <div className="row between"><Link to={`/admin/campanas/${c.id}`}><strong>{c.name}</strong></Link><Badge tone={STATUS[c.status].tone} label={STATUS[c.status].label} /></div>
                <p className="small muted" style={{ margin: '4px 0' }}>{SCOPE[c.scope]}{c.audience.segment ? ` · ${SEGMENT_LABEL[c.audience.segment]}` : ''} · {TRIGGER[c.trigger]}{c.event ? ` (${EVENT[c.event]})` : ''} · {CADENCE_LABEL[c.cadence]}{c.seasonId ? ` · ${SEASON_NAME[c.seasonId]}` : ''}</p>
                <p className="small" style={{ margin: 0 }}>{fmtDateShort(c.startKey)} al {fmtDateShort(c.endKey)} · {c.benefit.type === 'porcentaje' ? `${c.benefit.value} %` : fmtARS(c.benefit.value)} · emitidos {r.issued} · canjeados {r.redeemed}{c.createdBy === 'asistente' ? ' · preparada por el asistente' : ''}</p>
              </li>
            )
          })}
        </ul>
      )}
    </>
  )
}
