import { useState } from 'react'
import { useApp, resetDemo, setPrefs, useSnapshot } from '../../store'
import { activeSeason, SEASON_IDS, SEASON_NAME } from '../../domain/season'
import { SeasonArt } from '../../ui/art/season'
import { SeasonScene, SIGNATURE, SIGNATURE_LABEL } from '../../ui/motion/SeasonScene'
import { sfx } from '../../ui/sfx'
import { PageHead } from '../../ui/Shell'
import { act, Callout, ConfirmDialog, ErrorText } from '../../ui/kit'
import { hhmm, parseHHMM } from '../../domain/time'
import { validateState } from '../../domain/validate'
import type { FixtureId, SeasonId } from '../../domain/types'

export function AdminConfig() {
  const state = useApp()
  const bizId = state.session.businessId
  const biz = state.businesses.find((b) => b.id === bizId)!
  const wins = state.serviceWindows.filter((w) => w.businessId === bizId)
  const [f, setF] = useState({ serviceMinutes: String(biz.serviceMinutes), bufferMinutes: String(biz.bufferMinutes), maxPartyAuto: String(biz.maxPartyAuto), pickupPerSlot: String(biz.pickupPerSlot) })
  const [errs, setErrs] = useState<Record<string, string>>({})
  const [msg, setMsg] = useState('')
  const [reset, setReset] = useState(false)
  const [fx, setFx] = useState<FixtureId>('servicio')
  const [times, setTimes] = useState<Record<string, { s: string; e: string }>>({})
  const { prefs } = useSnapshot()
  const season = activeSeason(state, bizId)

  const save = () => {
    const o = act({ type: 'config/set', businessId: bizId, patch: { serviceMinutes: Number(f.serviceMinutes), bufferMinutes: Number(f.bufferMinutes), maxPartyAuto: Number(f.maxPartyAuto), pickupPerSlot: Number(f.pickupPerSlot) } }, 'Configuración guardada')
    if (!o.ok) setErrs(((o.data as { errors?: Record<string, string> } | undefined)?.errors) ?? {})
    else { setErrs({}); setMsg(o.duplicate ? 'No hubo cambios.' : 'Configuración guardada: el motor de reservas y retiros usa los valores nuevos.') }
  }
  const diagnostic = () => {
    const d = {
      app: 'TableFlow demo', namespace: 'tableflow.demo.v1', schemaVersion: state.schemaVersion, fixtureId: state.fixtureId, clockNowMs: state.clock.nowMs,
      counts: Object.fromEntries(Object.entries(state).filter(([, v]) => Array.isArray(v)).map(([k, v]) => [k, (v as unknown[]).length])),
      counters: state.counters, validationErrors: validateState(state), nota: 'Diagnóstico sintético. Datos de demostración ficticios.',
    }
    const url = URL.createObjectURL(new Blob([JSON.stringify(d, null, 2)], { type: 'application/json' }))
    const a = document.createElement('a')
    a.href = url
    a.download = 'tableflow-diagnostico-sintetico.json'
    a.click()
    URL.revokeObjectURL(url)
    setMsg('Diagnóstico sintético exportado (solo conteos y validación).')
  }
  return (
    <>
      <PageHead title="Configuración" sub={`${biz.name} · reglas de reserva, horarios, consentimientos, reinicio y diagnóstico`} />
      {msg && <Callout tone="ok" role="status">{msg}</Callout>}
      <div className="admin-grid">
        <section className="card" aria-labelledby="res-h">
          <h2 id="res-h">Reglas de reserva y retiro</h2>
          <label className="choice"><input type="checkbox" checked={biz.reservationsEnabled} onChange={(e) => act({ type: 'config/set', businessId: bizId, patch: { reservationsEnabled: e.target.checked } }, e.target.checked ? 'Reservas activadas' : 'Reservas desactivadas: atención por orden de llegada')} data-testid="cfg-reservations" /> Tomar reservas (si está apagado: atención por orden de llegada, sin acción de reservar en UI, chat ni URL directa)</label>
          <label className="choice"><input type="checkbox" checked={biz.autoConfirmReservations} onChange={(e) => act({ type: 'config/set', businessId: bizId, patch: { autoConfirmReservations: e.target.checked } }, 'Confirmación automática actualizada')} /> Confirmación automática (los casos con alergia o grupo grande siempre pasan a revisión humana)</label>
          <form onSubmit={(e) => { e.preventDefault(); save() }} noValidate style={{ marginTop: 10 }}>
            {([['serviceMinutes', 'Duración del servicio (min)'], ['bufferMinutes', 'Margen entre reservas (min)'], ['maxPartyAuto', 'Máximo de personas sin revisión humana'], ['pickupPerSlot', 'Retiros por franja de 15 min']] as const).map(([k, label]) => (
              <div className="field" key={k}>
                <label htmlFor={`cfg-${k}`}>{label}</label>
                <input id={`cfg-${k}`} type="number" value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} aria-invalid={!!errs[k]} aria-describedby={errs[k] ? `cfg-${k}-err` : undefined} data-testid={`cfg-${k}`} />
                <ErrorText id={`cfg-${k}-err`}>{errs[k]}</ErrorText>
              </div>
            ))}
            <button className="btn" type="submit" data-testid="cfg-save">Guardar</button>
          </form>
        </section>
        <section className="card" aria-labelledby="hor-h">
          <h2 id="hor-h">Horarios de atención</h2>
          {wins.map((w) => {
            const t = times[w.id] ?? { s: hhmm(w.startMin), e: hhmm(w.endMin) }
            const loc = state.locations.find((l) => l.id === w.locationId)
            return (
              <form key={w.id} className="row" style={{ marginBottom: 8 }} onSubmit={(e) => { e.preventDefault(); const s = parseHHMM(t.s); const en = parseHHMM(t.e); const o = act({ type: 'config/window', windowId: w.id, startMin: s ?? -1, endMin: en ?? -1 }, 'Franja actualizada'); if (!o.ok) setMsg('') }}>
                <span style={{ minWidth: 170 }}>{loc?.name.replace('Ritual Café · ', '').replace('Mesa Clara · ', '')} · {w.label} (lun–sáb)</span>
                <input className="time-input" aria-label={`Inicio ${w.label} ${loc?.name}`} type="time" step={900} value={t.s} onChange={(e) => setTimes({ ...times, [w.id]: { ...t, s: e.target.value } })} />
                <input className="time-input" aria-label={`Fin ${w.label} ${loc?.name}`} type="time" step={900} value={t.e} onChange={(e) => setTimes({ ...times, [w.id]: { ...t, e: e.target.value } })} />
                <button className="btn secondary small" type="submit">Guardar</button>
              </form>
            )
          })}
          <h3>Pasaporte y sellos</h3>
          <label className="choice"><input type="checkbox" checked={biz.passportPaused} onChange={(e) => act({ type: 'pass/pause', businessId: bizId, paused: e.target.checked }, e.target.checked ? 'Mecánica pausada' : 'Mecánica activa')} /> Pausar la mecánica de pasaporte y sellos</label>
          <p className="small muted">Premios reales: <strong>deshabilitados</strong> hasta aprobación del negocio y cotización de campaña. Costo de premio cero.</p>
          <h3>Consentimientos</h3>
          <p className="small">Los consentimientos de servicio y de promoción se tratan por separado y se editan en cada ficha de cliente.</p>
        </section>
        <section className="card" aria-labelledby="exp-h" data-season={season.id}>
          <h2 id="exp-h">Experiencia del cliente</h2>
          <SeasonSettings />
          <h3>Sonidos (apagados por defecto)</h3>
          <label className="choice"><input type="checkbox" checked={prefs.uiSounds} onChange={(e) => setPrefs({ uiSounds: e.target.checked })} data-testid="cfg-sfx" /> Sonidos de interfaz en este navegador (agregar, enviar, regalo, sello)</label>
          <label className="choice"><input type="checkbox" checked={prefs.kdsChime} onChange={(e) => setPrefs({ kdsChime: e.target.checked })} data-testid="cfg-kds-chime" /> Aviso sonoro de comandas nuevas en Cocina / barra</label>
          <div className="row" style={{ alignItems: 'center' }}>
            <label htmlFor="cfg-vol" className="small">Volumen</label>
            <input id="cfg-vol" type="range" min={0} max={1} step={0.05} value={prefs.volume} onChange={(e) => setPrefs({ volume: Number(e.target.value) })} style={{ flex: '1 1 160px' }} />
            <button className="btn secondary small" type="button" onClick={() => sfx('success', { force: true })}>Probar</button>
          </div>
          <p className="hint">Tonos sintéticos generados en el navegador; nunca voz ni micrófono. Se guardan como preferencia local, no en los datos de la demo.</p>
        </section>
        <section className="card" aria-labelledby="demo-h">
          <h2 id="demo-h">Datos de la demo</h2>
          <p>Estado: seed <strong>{state.fixtureId}</strong>, almacenamiento <code>tableflow.demo.v1</code> en este navegador. Varias pestañas no equivalen a concurrencia productiva (último guardado gana).</p>
          <div className="row">
            <button className="btn secondary" type="button" onClick={diagnostic} data-testid="export-diagnostic">Exportar diagnóstico sintético</button>
            <button className="btn danger" type="button" onClick={() => setReset(true)} data-testid="cfg-reset">Reiniciar la demo…</button>
          </div>
        </section>
        <section className="card" aria-labelledby="perf-h">
          <h2 id="perf-h">Perfiles y servicios</h2>
          <ul>{state.businesses.map((b) => <li key={b.id}><strong>{b.name}</strong> ({b.kind}) · sedes: {state.locations.filter((l) => l.businessId === b.id).map((l) => l.name).join(', ')} · {b.reservationsEnabled ? 'con reservas' : 'orden de llegada'}</li>)}</ul>
          <p className="small muted">El modo prospecto (contenido y reglas específicas por negocio) queda para una fase posterior.</p>
        </section>
      </div>
      <ConfirmDialog open={reset} title="Reiniciar la demo" confirmLabel="Reiniciar" danger onCancel={() => setReset(false)} onConfirm={() => { resetDemo(fx); setReset(false) }}
        body={<p>Borra solo las claves <code>tableflow.demo.v1*</code> y restaura el seed y el reloj. Si cancelás, se conserva el estado.</p>}>
        <fieldset><legend>Seed</legend>
          <label className="choice"><input type="radio" name="fx2" checked={fx === 'servicio'} onChange={() => setFx('servicio')} /> Servicio cargado</label>
          <label className="choice"><input type="radio" name="fx2" checked={fx === 'vacio'} onChange={() => setFx('vacio')} /> Vacío</label>
        </fieldset>
      </ConfirmDialog>
    </>
  )
}

/**
 * P5-L8 · Temporada: automática (calendario) o manual con inicio y fin; vista previa sin activar nada. Independiente del
 * modo claro u oscuro y sin efecto comercial: no crea promociones ni cambia precios.
 */
function SeasonSettings() {
  const state = useApp()
  const bizId = state.session.businessId
  const season = activeSeason(state, bizId)
  const sel = state.settings.seasonByBusiness[bizId]
  const win = state.settings.seasonWindowByBusiness[bizId]
  const [mode, setMode] = useState<'auto' | 'manual'>(sel === 'auto' ? 'auto' : 'manual')
  const [pick, setPick] = useState<SeasonId>(sel === 'auto' ? SIGNATURE[bizId][0] : sel)
  const [dated, setDated] = useState(!!win)
  const [from, setFrom] = useState(win?.from ?? '')
  const [to, setTo] = useState(win?.to ?? '')
  const [err, setErr] = useState('')
  const [preview, setPreview] = useState<SeasonId>(season.id)
  const saveManual = () => {
    const o = act({ type: 'config/season', businessId: bizId, season: pick, window: dated ? { from, to } : null }, `Temporada manual: ${SEASON_NAME[pick]}${dated ? ` del ${from} al ${to}` : ''}`)
    setErr(o.ok ? '' : o.message)
  }
  const toAuto = () => {
    setMode('auto')
    setErr('')
    if (sel !== 'auto') act({ type: 'config/season', businessId: bizId, season: 'auto' }, 'Temporada automática según el reloj simulado')
  }
  return (
    <div className="season-settings">
      <div className="season-preview">
        <SeasonArt id={season.id} size={84} />
        <div>
          <p className="eyebrow" style={{ margin: 0 }}>Rige hoy · {season.forced ? 'manual' : 'automática'}</p>
          <p className="season-name" data-testid="season-now">{season.name}</p>
          <p className="small muted" style={{ margin: 0 }}>{season.when} · {season.headline[bizId]}</p>
          {season.outside && win && <p className="small" style={{ margin: '4px 0 0' }} data-testid="season-scheduled">Programada: {SEASON_NAME[sel as SeasonId]} del {win.from} al {win.to}. Fuera de esas fechas rige la automática.</p>}
        </div>
      </div>
      <fieldset className="season-mode">
        <legend>Temática por época</legend>
        <label className="choice"><input type="radio" name="season-mode" checked={mode === 'auto'} onChange={toAuto} data-testid="season-auto" /> Automática (según el calendario y el reloj simulado)</label>
        <label className="choice"><input type="radio" name="season-mode" checked={mode === 'manual'} onChange={() => setMode('manual')} data-testid="season-manual" /> Manual, con inicio y fin</label>
      </fieldset>
      {mode === 'manual' && (
        <div className="season-manual">
          <div className="field">
            <label htmlFor="cfg-season">Temporada</label>
            <select id="cfg-season" value={pick} onChange={(e) => setPick(e.target.value as SeasonId)} data-testid="cfg-season">
              {SEASON_IDS.map((s) => <option key={s} value={s}>{SEASON_NAME[s]}</option>)}
            </select>
          </div>
          <label className="choice"><input type="checkbox" checked={dated} onChange={(e) => setDated(e.target.checked)} data-testid="season-dated" /> Con fecha de inicio y fin</label>
          {dated && (
            <div className="field-row">
              <div className="field"><label htmlFor="season-from">Inicio</label><input id="season-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} data-testid="season-from" /></div>
              <div className="field"><label htmlFor="season-to">Fin</label><input id="season-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} data-testid="season-to" /></div>
            </div>
          )}
          <button className="btn" type="button" onClick={saveManual} data-testid="season-save">Guardar temporada</button>
          <ErrorText id="season-err">{err}</ErrorText>
        </div>
      )}
      <p className="hint">Cambia la composición, el arte y el movimiento de cada identidad, la propuesta del inicio y las tarjetas de regalo. No cambia precios, la carta ni el modo claro u oscuro, y no crea promociones.</p>
      <div className="season-preview-box">
        <div className="field">
          <label htmlFor="season-prev">Vista previa (no activa nada)</label>
          <select id="season-prev" value={preview} onChange={(e) => setPreview(e.target.value as SeasonId)} data-testid="season-preview-select">
            {SEASON_IDS.map((s) => <option key={s} value={s}>{SEASON_NAME[s]}{SIGNATURE[bizId].includes(s) ? ` · ${SIGNATURE_LABEL[bizId]}` : ''}</option>)}
          </select>
        </div>
        <SeasonScene key={preview} biz={bizId} season={preview} />
      </div>
    </div>
  )
}
