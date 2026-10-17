import { useMemo, useState } from 'react'
import { useApp } from '../../store'
import { useOperation } from '../../ui/hooks'
import { PageHead } from '../../ui/Shell'
import { act, Callout, Field } from '../../ui/kit'
import { isClientRole } from '../../ui/format'
import { QrCard, qrUrl } from '../../ui/Qr'
import { Scanner } from '../../ui/Scanner'
import { CodeResultCard } from '../../ui/CodeResult'
import { checkCode, ORDER_STATUS_ES, RES_STATUS_ES, KIND_LABEL, qrPath, referralCode, type CodeKind } from '../../domain/qr'
import type { ScanVia } from '../../domain/cmd-codes'
import { getBrowserStorage, STORAGE_HINT_CHARS, storageUsage } from '../../domain/persistence'
import { dateKeyOf, fmtDateTime } from '../../domain/time'
import type { AppState, BusinessId } from '../../domain/types'
import './../../ui/qr.css'

const GEN_KINDS: CodeKind[] = ['negocio', 'sede', 'mesa', 'campana', 'referido']

/** Códigos de ejemplo para probar sin cámara: lo que un QR real traería, más dos casos de rechazo. */
function samples(s: AppState, biz: BusinessId, loc: string) {
  const out: { label: string; path: string }[] = []
  const today = dateKeyOf(s.clock.nowMs)
  const orders = s.orders.filter((o) => o.businessId === biz).slice(-40)
  const rank = (st: string) => (st === 'listo' ? 0 : st === 'enviado' ? 2 : ['retirado', 'servido', 'cerrado'].includes(st) ? 3 : st === 'cancelado' || st === 'rechazado' ? 4 : 1)
  for (const o of [...orders].sort((a, b) => rank(a.status) - rank(b.status)).slice(0, 6)) out.push({ label: `Pedido ${o.id} · ${ORDER_STATUS_ES[o.status]}`, path: qrPath(biz, 'pedido', o.id) })
  for (const r of s.reservations.filter((x) => x.businessId === biz && ['confirmada', 'llegada', 'cancelada'].includes(x.status)).sort((a, b) => Number(b.dateKey === today) - Number(a.dateKey === today)).slice(0, 3)) {
    out.push({ label: `Reserva ${r.id} · ${RES_STATUS_ES[r.status]}`, path: qrPath(biz, 'reserva', r.id) })
  }
  for (const b of s.benefits.filter((x) => x.businessId === biz).slice(0, 3)) out.push({ label: `Beneficio ${b.code} · ${b.status}`, path: qrPath(biz, 'beneficio', b.code) })
  for (const t of s.tables.filter((x) => x.businessId === biz && x.locationId === loc).slice(0, 2)) out.push({ label: `Mesa ${t.label}`, path: qrPath(biz, 'mesa', t.id, loc) })
  const other = s.businesses.find((b) => b.id !== biz)!
  out.push({ label: `Código de otro negocio (${other.name})`, path: qrPath(other.id, 'negocio', other.id) })
  out.push({ label: 'Código que no existe', path: qrPath(biz, 'pedido', 'O-99999') })
  return out
}

/** Pestaña "Validar": leer (cámara, foto o a mano), simular sin cámara, ver qué dice el store y canjear una sola vez. */
function Validar() {
  const state = useApp()
  const bizId = state.session.businessId
  const loc = state.session.locationByBusiness[bizId]
  const client = isClientRole(state.session.role)
  const [text, setText] = useState('')
  const [via, setVia] = useState<ScanVia | null>(null)
  const ctx = { businessId: bizId, locationId: loc, side: client ? ('cliente' as const) : ('comercio' as const), customerId: state.session.customerByBusiness[bizId] }
  const check = useMemo(() => (text ? checkCode(state, ctx, text) : null), [state, text, loc, bizId, client])
  const getRedeemOp = useOperation(`redeem|${bizId}|${loc}|${check?.ref ?? ''}`)
  const list = samples(state, bizId, loc)
  const log = state.audit.filter((a) => a.businessId === bizId && (a.type === 'code.scanned' || a.type === 'code.redeemed')).slice(-8).reverse()

  const scan = (t: string, v: ScanVia) => {
    setText(t)
    setVia(v)
    const op = (act({ type: 'op/alloc' }).data as { operationId: string }).operationId
    act({ type: 'code/scan', businessId: bizId, locationId: loc, customerId: ctx.customerId, text: t, via: v, operationId: op })
  }
  const redeem = () => {
    if (!check) return
    act({ type: 'code/redeem', businessId: bizId, locationId: loc, text, operationId: getRedeemOp() }, `${check.title}: canje registrado`)
  }
  return (
    <div className="code-grid">
      <section className="card" aria-labelledby="val-h">
        <h2 id="val-h">Leer un código</h2>
        <Scanner onText={scan} label="Código del cliente" />
        <div style={{ marginTop: 14 }}>
          <Field label="O probalo sin cámara (simulado)" htmlFor="sim-sel" hint="Elige un código de ejemplo: se lee igual que un QR real.">
            <select id="sim-sel" value="" onChange={(e) => e.target.value && scan(qrUrl(e.target.value), 'simulado')} data-testid="sim-select">
              <option value="">Elegí un caso…</option>
              {list.map((x) => <option key={x.path} value={x.path}>{x.label}</option>)}
            </select>
          </Field>
        </div>
        {check && (
          <>
            <p className="small muted" style={{ margin: '12px 0 0' }}>Lectura: {via === 'camara' ? 'cámara' : via === 'imagen' ? 'foto del QR' : via === 'simulado' ? 'simulada (sin cámara)' : 'escrita a mano'}</p>
            <CodeResultCard
              check={check}
              action={check.action && check.action.type !== 'reclamar' ? { label: check.action.label, onClick: redeem } : undefined}
            />
          </>
        )}
      </section>
      <section className="card" aria-labelledby="log-h">
        <h2 id="log-h">Últimas lecturas y canjes</h2>
        {log.length === 0 ? <p className="small muted">Todavía no se leyó ningún código.</p> : (
          <ul className="scan-log" data-testid="scan-log">
            {log.map((a) => <li key={a.id}><span className="muted">{fmtDateTime(a.at)}</span> · {a.summary}</li>)}
          </ul>
        )}
        <Limits />
      </section>
    </div>
  )
}

/** QR-06 · Lo que esta demo NO hace: sincronizar dos dispositivos. */
function Limits() {
  const u = storageUsage(getBrowserStorage())
  const pct = Math.min(100, Math.round((u.chars / STORAGE_HINT_CHARS) * 100))
  return (
    <aside className="limit-box" aria-labelledby="lim-h" data-testid="limits">
      <h3 id="lim-h">Qué puede y qué no puede esta demo</h3>
      <ul className="small">
        <li><strong>Todo vive en este navegador.</strong> La demo guarda los datos en el almacenamiento local: dos dispositivos <em>no se sincronizan solos</em>. Un QR leído con otro teléfono no ve tus pedidos de acá.</li>
        <li>Por eso el cliente y el comercio se prueban en <strong>el mismo navegador</strong>: cambiá de rol con la botonera y el código se valida contra el mismo estado.</li>
        <li>El QR lleva solo una ruta con identificadores públicos. <strong>No acredita un pago</strong> ni es seguridad real, y los importes se leen siempre del estado, nunca del QR.</li>
        <li>El almacenamiento del navegador tiene tope (suele rondar los 5 millones de caracteres por sitio; varía).{' '}
          {u.available ? <>Esta demo usa unos <strong data-testid="storage-used">{u.chars.toLocaleString('es-AR')}</strong> caracteres (≈ {pct} % de esa referencia).</> : <>Acá no está disponible: la demo sigue en memoria y se pierde al recargar.</>}
        </li>
      </ul>
      {u.available && <div className="storage-meter" role="img" aria-label={`Uso aproximado: ${pct} %`}><span style={{ width: `${pct}%` }} /></div>}
    </aside>
  )
}

/** Pestaña "Generar": QR del negocio, la sede, una mesa, una campaña o el código de recomendación de un cliente. */
function Generar() {
  const state = useApp()
  const bizId = state.session.businessId
  const loc = state.session.locationByBusiness[bizId]
  const [kind, setKind] = useState<CodeKind>('mesa')
  const biz = state.businesses.find((b) => b.id === bizId)!
  const locs = state.locations.filter((l) => l.businessId === bizId)
  const tables = state.tables.filter((t) => t.businessId === bizId)
  const camps = state.campaigns.filter((c) => c.businessId === bizId && !['cancelada'].includes(c.status))
  const customers = state.customers.filter((c) => c.businessId === bizId && !c.mergedInto)
  const options: { value: string; label: string }[] =
    kind === 'negocio' ? [{ value: bizId, label: biz.name }]
    : kind === 'sede' ? locs.map((l) => ({ value: l.id, label: l.name }))
    : kind === 'mesa' ? tables.map((t) => ({ value: t.id, label: `Mesa ${t.label} · ${locs.find((l) => l.id === t.locationId)?.name ?? ''}` }))
    : kind === 'campana' ? camps.map((c) => ({ value: c.id, label: `${c.name} (${c.status})` }))
    : customers.map((c) => ({ value: referralCode(state, bizId, c.id) ?? '', label: `Código de ${c.alias}` }))
  const [ref, setRef] = useState('')
  const value = options.some((o) => o.value === ref) ? ref : options[0]?.value ?? ''
  const opt = options.find((o) => o.value === value)
  const locId = kind === 'mesa' ? tables.find((t) => t.id === value)?.locationId : kind === 'sede' ? value : loc
  const camp = kind === 'campana' ? camps.find((c) => c.id === value) : null
  return (
    <div className="code-grid">
      <section className="card" aria-labelledby="gen-h">
        <h2 id="gen-h">Qué querés generar</h2>
        <div className="field-row">
          <Field label="Tipo" htmlFor="gen-kind">
            <select id="gen-kind" value={kind} onChange={(e) => { setKind(e.target.value as CodeKind); setRef('') }} data-testid="gen-kind">
              {GEN_KINDS.map((k) => <option key={k} value={k}>{KIND_LABEL[k]}</option>)}
            </select>
          </Field>
          <Field label="Cuál" htmlFor="gen-ref">
            <select id="gen-ref" value={value} onChange={(e) => setRef(e.target.value)} data-testid="gen-ref">
              {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
        </div>
        {kind === 'campana' && camp && camp.status !== 'activa' && <Callout tone="warn">La campaña está {camp.status}: quien escanee el QR verá que todavía no se puede reclamar.</Callout>}
        {kind === 'referido' && <p className="small muted">El código identifica a quien recomienda sin mostrar su nombre ni contacto.</p>}
        <p className="small muted">Los códigos de pedido, reserva y beneficio los genera el cliente desde su cuenta (Mis códigos).</p>
      </section>
      <section aria-label="Vista previa" data-testid="gen-preview">
        {opt && value ? (
          <QrCard businessId={bizId} kind={kind} reference={value} title={opt.label} locationId={kind === 'mesa' || kind === 'sede' ? locId : null} caption="Vista previa · imprimila y pegala donde corresponda" id="gen-card" />
        ) : <p className="muted">No hay nada para generar con este tipo.</p>}
      </section>
    </div>
  )
}

/** P5-L7 · Códigos y QR del comercio. */
export function AdminCodigos() {
  const [tab, setTab] = useState<'validar' | 'generar'>('validar')
  return (
    <>
      <PageHead title="Códigos" sub="Validá lo que trae el cliente y generá los QR del local · todo simulado, en este navegador" />
      <div className="toggle-row" role="group" aria-label="Qué querés hacer" style={{ marginBottom: 14 }}>
        {(['validar', 'generar'] as const).map((t) => (
          <button key={t} type="button" className="chip-toggle" aria-pressed={tab === t} onClick={() => setTab(t)} data-testid={`tab-${t}`}>{t === 'validar' ? 'Validar un código' : 'Generar e imprimir'}</button>
        ))}
      </div>
      {tab === 'validar' ? <Validar /> : <Generar />}
    </>
  )
}
