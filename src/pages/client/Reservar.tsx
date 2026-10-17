import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useBiz, useOperation } from '../../ui/hooks'
import { PageHead } from '../../ui/Shell'
import { act, Callout, ErrorText, Field, StatusBadge, Empty } from '../../ui/kit'
import { RES_LABEL } from '../../ui/format'
import { slotStarts, slotAvailable, windowsFor } from '../../domain/availability'
import { addDays, dateKeyOf, dayName, fmtDateShort, hhmm, monthName } from '../../domain/time'
import { Glyph } from '../../ui/glyphs'
import { sedeShort } from '../../ui/format'
import { numberWord } from '../../domain/nlu'
import { dispatch } from '../../store'
import type { Outcome } from '../../domain/core'

export function Reservar() {
  const { state, biz, locationId } = useBiz()
  const nav = useNavigate()
  const customer = state.customers.find((c) => c.id === state.session.customerByBusiness[biz.id])
  const today = dateKeyOf(state.clock.nowMs)
  const days = useMemo(() => {
    const out: string[] = []
    let d = today
    for (let i = 0; i < 14 && out.length < 8; i++, d = addDays(d, 1)) if (windowsFor(state, locationId, d).length) out.push(d)
    return out
  }, [state, locationId, today])
  const [dateKey, setDateKey] = useState(days[0])
  const [party, setParty] = useState(2)
  const [startMin, setStartMin] = useState<number | null>(null)
  const [sector, setSector] = useState<'cualquiera' | 'salon' | 'terraza'>('cualquiera')
  const [alias, setAlias] = useState(customer?.alias ?? '')
  const [diet, setDiet] = useState('')
  const [res, setRes] = useState<Outcome | null>(null)
  const [fieldErr, setFieldErr] = useState<Record<string, string>>({})
  const fp = JSON.stringify([biz.id, locationId, dateKey, startMin, party, sector, alias.trim(), diet.trim()])
  const getOp = useOperation(fp)
  const myReservations = state.reservations.filter((r) => r.businessId === biz.id && ((customer && r.customerId === customer.id) || (!customer && state.session.customerByBusiness[biz.id] && r.customerId === state.session.customerByBusiness[biz.id])))

  if (!biz.reservationsEnabled) {
    return (
      <main>
        <PageHead title="Reservas" />
        <Empty title="En este perfil atendemos por orden de llegada" action={<Link className="btn" to={`/${biz.id}/carta`}>Ver la carta</Link>}>
          {biz.name} no toma reservas: venís cuando quieras y te sentamos por orden de llegada. La carta está disponible para consultar, y desde el chat podés hablar con el equipo. No hay botón para confirmar una mesa.
        </Empty>
      </main>
    )
  }
  const big = party > biz.maxPartyAuto
  const starts = slotStarts(state, biz.id, locationId, dateKey)
  const groups = windowsFor(state, locationId, dateKey)
    .sort((a, b) => a.startMin - b.startMin)
    .map((w) => ({ w, list: starts.filter((m) => m >= w.startMin && m < w.endMin) }))
    .filter((g) => g.list.length)
  const loc = state.locations.find((l) => l.id === locationId)
  const q = (m: number) => ({ businessId: biz.id, locationId, dateKey, startMin: m, party: Math.min(party, biz.maxPartyAuto), sectorPref: sector })
  const submit = () => {
    const errs: Record<string, string> = {}
    if (!alias.trim()) errs.alias = 'Poné un nombre para la reserva (alias de muestra).'
    if (!Number.isInteger(party) || party < 1) errs.party = 'Indicá cuántas personas serán (al menos 1).'
    if (startMin === null) errs.slot = 'Elegí una franja.'
    setFieldErr(errs)
    setRes(null)
    if (Object.keys(errs).length) {
      document.getElementById(errs.alias ? 'alias' : errs.party ? 'party' : 'slots')?.focus()
      return
    }
    const o = act({
      type: 'res/request',
      businessId: biz.id,
      locationId,
      dateKey,
      startMin,
      party,
      sectorPref: sector,
      alias: alias.trim(),
      dietaryNote: diet.trim() || null,
      channel: 'web',
      operationId: getOp(),
    })
    if (o.ok) {
      nav(`/${biz.id}/reservas/${(o.data as { reservationId: string }).reservationId}`)
      return
    }
    setRes(o)
  }
  const alts = (res && !res.ok ? ((res.data as { alternatives?: number[] } | undefined)?.alternatives ?? []) : []) as number[]
  const joinWait = () => {
    if (startMin === null) return
    const o = act({ type: 'wait/add', businessId: biz.id, locationId, dateKey, startMin, party, alias: alias.trim(), operationId: `${getOp()}-W` }, 'Te anotamos en la lista de espera (no es una reserva)')
    if (!o.ok) setRes(o)
    else setRes({ ok: false, code: 'espera', message: 'Quedaste en la lista de espera. Si se libera un lugar, el equipo valida la oferta: no se confirma sola.' })
  }
  return (
    <main>
      <PageHead
        title="Reservar una mesa"
        eyebrow={`Reservas · ${loc ? sedeShort(loc.name) : biz.name}`}
        sub={`Servicio de ${biz.serviceMinutes} min + ${biz.bufferMinutes} de margen · cada solicitud la confirma el equipo`}
      />
      <div className="res-layout">
        <form className="card res-form" onSubmit={(e) => { e.preventDefault(); submit() }} noValidate aria-labelledby="form-h">
          <h2 id="form-h" className="sr-only">Tu solicitud</h2>
          <fieldset className="plain">
            <legend><span className="step-n">1</span> Día</legend>
            <div className="date-chips" data-testid="res-date">
              {days.map((d) => {
                const [, mm, dd] = d.split('-')
                return (
                  <button type="button" key={d} aria-pressed={dateKey === d} onClick={() => { setDateKey(d); setStartMin(null); setRes(null) }} aria-label={`${fmtDateShort(d)}${d === today ? ' (hoy)' : ''}`}>
                    <span className="d">{d === today ? 'Hoy' : dayName(d).slice(0, 3)}</span>
                    <span className="n">{Number(dd)}</span>
                    <span className="m">{monthName(Number(mm)).slice(0, 3)}</span>
                  </button>
                )
              })}
            </div>
          </fieldset>
          <div className="field">
            <label htmlFor="party"><span className="step-n">2</span> Personas</label>
            <div className="party">
              <button type="button" className="icon-btn bordered" aria-label="Una persona menos" onClick={() => { setParty((p) => Math.max(1, (Number.isInteger(p) ? p : 1) - 1)); setRes(null) }}><Glyph name="minus" size={18} /></button>
              <input id="party" type="number" min={1} max={40} value={Number.isNaN(party) ? '' : party} onChange={(e) => { setParty(Number(e.target.value)); setRes(null) }} aria-invalid={!!fieldErr.party} aria-describedby={[big ? 'party-hint' : '', fieldErr.party ? 'party-err' : ''].join(' ').trim() || undefined} data-testid="res-party" />
              <button type="button" className="icon-btn bordered" aria-label="Una persona más" onClick={() => { setParty((p) => Math.min(40, (Number.isInteger(p) ? p : 0) + 1)); setRes(null) }}><Glyph name="plus" size={18} /></button>
            </div>
            {big && <span className="hint" id="party-hint">Más de {biz.maxPartyAuto}: el equipo revisa el caso, no se asigna mesa sola.</span>}
            <ErrorText id="party-err">{fieldErr.party}</ErrorText>
          </div>
          <fieldset aria-describedby={['slots-hint', fieldErr.slot ? 'slots-err' : ''].join(' ').trim()} className={`plain ${fieldErr.slot ? 'invalid' : ''}`}>
            <legend><span className="step-n">3</span> Horario</legend>
            <div id="slots" tabIndex={-1}>
              {groups.map(({ w, list }) => (
                <div className="slot-group" key={w.id}>
                  <h3 className="slot-h"><Glyph name={w.startMin >= 18 * 60 ? 'moon' : 'sun'} size={16} /> {w.label} <span className="muted">{hhmm(w.startMin)}–{hhmm(w.endMin)}</span></h3>
                  <div className="slot-grid">
                    {list.map((m) => {
                      const okSlot = big ? true : slotAvailable(state, q(m))
                      return (
                        <button type="button" key={m} disabled={!okSlot} aria-pressed={startMin === m} onClick={() => { setStartMin(m); setRes(null); setFieldErr({}) }} title={okSlot ? 'Con cupo' : 'Sin cupo para este grupo'} data-testid={`slot-${m}`}>
                          {hhmm(m)}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
            <p className="hint muted small" id="slots-hint">Los horarios tachados no tienen mesa libre para {numberWord(Math.min(party || 1, biz.maxPartyAuto))} {party === 1 ? 'persona' : 'personas'}. Cupos según los datos de muestra.</p>
            <ErrorText id="slots-err">{fieldErr.slot}</ErrorText>
          </fieldset>
          <p className="step-title"><span className="step-n">4</span> Tus datos</p>
          <Field label="Nombre para la reserva (alias de muestra)" htmlFor="alias" error={fieldErr.alias}>
            <input id="alias" type="text" value={alias} onChange={(e) => setAlias(e.target.value)} aria-invalid={!!fieldErr.alias} aria-describedby={fieldErr.alias ? 'alias-err' : undefined} data-testid="res-alias" />
          </Field>
          <Field label="Sector preferido" htmlFor="sector" hint="Preferencia de terraza, sujeta a confirmación: no garantiza sector.">
            <select id="sector" value={sector} onChange={(e) => setSector(e.target.value as typeof sector)}>
              <option value="cualquiera">Sin preferencia</option>
              <option value="salon">Salón</option>
              <option value="terraza">Terraza</option>
            </select>
          </Field>
          <Field label="Alergia o restricción alimentaria (opcional)" htmlFor="diet" hint="Se deriva al equipo para revisión humana. Esta demo no puede garantizar ausencia de alérgenos.">
            <textarea id="diet" value={diet} onChange={(e) => setDiet(e.target.value)} data-testid="res-diet" />
          </Field>
          <button className="btn accent lg" style={{ width: '100%' }} type="submit" data-testid="res-submit">
            Solicitar reserva{startMin !== null ? ` · ${fmtDateShort(dateKey)} ${hhmm(startMin)}` : ''}
          </button>
          <p className="small muted">Enviar crea una <strong>solicitud</strong>: el equipo todavía debe confirmarla.</p>
        </form>

        <div className="stack">
          {res && !res.ok && (
            <div data-testid="res-result">
              <Callout tone={res.code === 'espera' ? 'ok' : 'warn'} role="alert">
                <strong>{res.code === 'sin-cupo' ? 'Sin cupo para ese horario.' : res.code === 'espera' ? 'Lista de espera' : 'No pudimos enviar la solicitud.'}</strong> {res.message}
                {res.code === 'sin-cupo' && (
                  <div className="stack tight" style={{ marginTop: 8 }}>
                    {alts.length > 0 && (
                      <div className="slot-grid">
                        {alts.map((m) => <button key={m} type="button" onClick={() => { setStartMin(m); setRes(null) }}>{hhmm(m)}</button>)}
                      </div>
                    )}
                    <button className="btn secondary small" type="button" onClick={joinWait} data-testid="join-wait">Anotarme en la lista de espera</button>
                  </div>
                )}
              </Callout>
            </div>
          )}
          <section className="card" aria-labelledby="mias">
            <p className="eyebrow">Historial local de la demo</p>
            <h2 id="mias">Mis reservas</h2>
            {myReservations.length === 0 ? (
              <p className="muted">Todavía no tenés reservas en esta demo. Si te identificás como cliente recurrente (Ana) vas a ver las tuyas.</p>
            ) : (
              <ul className="order-list">
                {myReservations.map((r) => (
                  <li key={r.id}>
                    <Link to={`/${biz.id}/reservas/${r.id}`} className="folio-link">{r.id}</Link>
                    <span className="muted">{r.party} pers. · {fmtDateShort(r.dateKey)} {hhmm(r.startMin)}</span>
                    <span />
                    <StatusBadge s={RES_LABEL[r.status]} />
                  </li>
                ))}
              </ul>
            )}
            <button className="btn ghost small" type="button" onClick={() => { dispatch({ type: 'session/setRole', role: 'cliente-recurrente' }) }}>Verme como Ana (cliente recurrente)</button>
          </section>
        </div>
      </div>
    </main>
  )
}
