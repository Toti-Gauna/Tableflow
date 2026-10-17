import { useState } from 'react'
import { useApp } from '../../store'
import { PageHead } from '../../ui/Shell'
import { act, Callout } from '../../ui/kit'
import { fmtARS } from '../../domain/money'
import { itemContribution, missingCosts } from '../../domain/growth'
import type { MenuItem } from '../../domain/types'
import './growth.css'

/** Pesos escritos como en Argentina ("15.000", "2.500,50", "$ 300") → centavos; vacío = ND (null); inválido = undefined. */
export function parsePesos(v: string): number | null | undefined {
  const t = v.trim().replace(/\$/g, '').replace(/\s/g, '')
  if (!t) return null
  const norm = t.replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.')
  if (!/^\d+(\.\d{1,2})?$/.test(norm)) return undefined
  return Math.round(Number(norm) * 100)
}
const pesos = (c: number | null | undefined) => (c === null || c === undefined ? '' : (c / 100).toLocaleString('es-AR', { maximumFractionDigits: 2 }))
const PCT = (p: number | null) => (p === null ? 'ND' : `${(Math.round(p * 1000) / 10).toLocaleString('es-AR')} %`)

function CostRow({ m, canEdit }: { m: MenuItem; canEdit: boolean }) {
  const state = useApp()
  const [cost, setCost] = useState(pesos(m.costCents))
  const [vari, setVari] = useState(pesos(m.variableCents))
  const [err, setErr] = useState('')
  const c = itemContribution(state, m)
  const save = () => {
    const a = parsePesos(cost)
    const b = parsePesos(vari)
    if (a === undefined || b === undefined) return setErr('Escribí un importe en pesos (por ejemplo, 2.500) o dejalo vacío si todavía no lo sabés.')
    setErr('')
    const o = act({ type: 'cost/set', itemId: m.id, costCents: a, variableCents: b }, `Costo de ${m.name} guardado`)
    if (!o.ok) setErr(o.message)
  }
  const dirty = parsePesos(cost) !== m.costCents || parsePesos(vari) !== m.variableCents
  return (
    <tr data-testid={`cost-${m.id}`} data-nd={m.costCents === null || m.variableCents === null || undefined}>
      <th scope="row">{m.name}<span className="muted small"> · {m.category}</span>{m.tags.includes('+18') && <span className="muted small"> · +18</span>}</th>
      <td className="money">{fmtARS(m.priceCents)}</td>
      <td>
        <label className="sr-only" htmlFor={`c-${m.id}`}>Costo del producto de {m.name} (pesos)</label>
        <input id={`c-${m.id}`} className="cost-in" inputMode="decimal" value={cost} placeholder="ND" onChange={(e) => setCost(e.target.value)} disabled={!canEdit} aria-describedby={err ? `e-${m.id}` : undefined} />
      </td>
      <td>
        <label className="sr-only" htmlFor={`v-${m.id}`}>Otros costos variables de {m.name} (pesos)</label>
        <input id={`v-${m.id}`} className="cost-in" inputMode="decimal" value={vari} placeholder="ND" onChange={(e) => setVari(e.target.value)} disabled={!canEdit} />
      </td>
      <td className="money">{c ? fmtARS(c.contributionCents) : <span className="nd">ND</span>}</td>
      <td className="num">{c ? PCT(c.pct) : <span className="nd">ND</span>}</td>
      <td>
        {canEdit && <button className="btn small secondary" type="button" onClick={save} disabled={!dirty} data-testid={`cost-save-${m.id}`}>Guardar</button>}
        {err && <span className="err-text small" id={`e-${m.id}`} role="alert">{err}</span>}
      </td>
    </tr>
  )
}

/** GR-D · Costos por ítem, variante y extra. Lo que no está cargado se ve como ND y deja las campañas en borrador. */
export function AdminCostos() {
  const state = useApp()
  const bizId = state.session.businessId
  const canEdit = state.session.role === 'encargado'
  const items = state.menuItems.filter((m) => m.businessId === bizId)
  const groups = state.modifierGroups.filter((g) => g.businessId === bizId && g.options.some((o) => o.deltaCents > 0 || o.costCents !== undefined))
  const miss = missingCosts(state, bizId)
  return (
    <>
      <PageHead title="Costos" sub="Costos de muestra que cargó el negocio ficticio · lo que falta es ND" />
      {!canEdit && <Callout>Solo el encargado edita costos (es una vista de la demo, no un permiso real).</Callout>}
      <Callout tone={miss.items.length || miss.options.length ? 'warn' : 'ok'}>
        {miss.items.length || miss.options.length
          ? <>Faltan {miss.items.length} costo(s) de carta y {miss.options.length} de extras. Mientras falten, las campañas que los usan quedan en borrador: no se completan con promedios.</>
          : <>Están todos los costos cargados.</>}
      </Callout>
      <p className="small muted">Contribución = precio − costo del producto − otros costos variables (envase, comisión). El porcentaje es contribución / precio y no es utilidad neta: no descuenta fijos del local.</p>
      <div className="table-wrap">
        <table className="cost-table">
          <caption className="sr-only">Costos por ítem</caption>
          <thead><tr><th scope="col">Ítem</th><th scope="col">Precio</th><th scope="col">Costo del producto</th><th scope="col">Otros variables</th><th scope="col">Contribución</th><th scope="col">%</th><th scope="col"><span className="sr-only">Acción</span></th></tr></thead>
          <tbody>{items.map((m) => <CostRow key={`${m.id}-${m.version}`} m={m} canEdit={canEdit} />)}</tbody>
        </table>
      </div>
      <h2 style={{ marginTop: 24 }}>Extras y variantes</h2>
      <div className="table-wrap">
        <table>
          <caption className="sr-only">Costos de extras y variantes</caption>
          <thead><tr><th scope="col">Grupo</th><th scope="col">Opción</th><th scope="col">Recargo</th><th scope="col">Costo propio</th></tr></thead>
          <tbody>
            {groups.flatMap((g) => g.options.filter((o) => o.deltaCents > 0 || o.costCents !== undefined).map((o) => (
              <tr key={o.id}>
                <td>{g.name}</td><th scope="row">{o.name}</th><td className="money">{o.deltaCents ? `+ ${fmtARS(o.deltaCents)}` : '—'}</td>
                <td>{o.costCents === null ? <span className="nd">ND</span> : o.costCents === undefined ? <span className="muted">incluido en el plato</span> : fmtARS(o.costCents)}</td>
              </tr>
            )))}
          </tbody>
        </table>
      </div>
    </>
  )
}
