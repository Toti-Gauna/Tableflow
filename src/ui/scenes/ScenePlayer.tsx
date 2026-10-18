import { useEffect, useRef, type KeyboardEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useApp } from '../../store'
import { PhoneFrame } from '../art/families/mockups'
import { QrImage, qrUrl } from '../Qr'
import { StatusBadge } from '../kit'
import { ORDER_LABEL, RES_LABEL } from '../format'
import { checkCode, STATUS_LABEL } from '../../domain/qr'
import { orderPayment } from '../../domain/sessions'
import { fmtARS } from '../../domain/money'
import { hhmm, fmtDateShort } from '../../domain/time'
import type { PhoneView } from '../../domain/scenes'
import { exitScene, nextStep, repeatStep, setSpeed, togglePlay, useSceneRun } from './runtime'
import '../art/families/mockups.css'
import './scenes.css'

const SPEEDS = [0.75, 1, 1.5]

/** Lo que ve el cliente en su teléfono, con datos reales del store (nada pregrabado). */
function PhoneContent({ view, vars }: { view: PhoneView; vars: Record<string, string> }) {
  const s = useApp()
  if (view.kind === 'chat') {
    const msgs = s.messages.filter((m) => m.conversationId === vars[view.convVar]).slice(-7)
    return (
      <div className="ph-chat" data-testid="phone-chat">
        <p className="ph-app">WhatsApp <span>(simulado)</span></p>
        {msgs.length === 0 && <p className="ph-empty">Escribiendo…</p>}
        {msgs.map((m) => (
          <p key={m.id} className={`ph-msg ${m.from}`}>{m.text}</p>
        ))}
      </div>
    )
  }
  if (view.kind === 'call') {
    const call = s.callSessions.find((c) => c.id === vars[view.callVar])
    return (
      <div className="ph-call" data-testid="phone-call">
        <p className="ph-app">Llamada <span>(simulada, sin micrófono)</span></p>
        <ul className="ph-transcript">
          {(call?.transcript ?? []).slice(-5).map((t, i) => <li key={i} className={t.who}><b>{t.who === 'cliente' ? 'Cliente' : t.who === 'asistente' ? 'Asistente' : 'Demo'}:</b> {t.text}</li>)}
        </ul>
      </div>
    )
  }
  if (view.kind === 'qr') {
    const path = vars[view.pathVar]
    if (!path) return <p className="ph-empty">Preparando el QR…</p>
    const biz = path.split('/')[1] as never
    const check = checkCode(s, { businessId: biz, locationId: s.session.locationByBusiness[biz], side: 'cliente' }, `#${path}`)
    return (
      <div className="ph-qr" data-testid="phone-qr">
        <p className="ph-app">{view.label}</p>
        <QrImage text={qrUrl(path)} size={150} label={view.label} />
        <p className="ph-note"><b>{STATUS_LABEL[check.status]}:</b> {check.title}</p>
      </div>
    )
  }
  if (view.kind === 'order') {
    const o = s.orders.find((x) => x.id === vars[view.orderVar])
    if (!o) return <p className="ph-empty">Armando el pedido…</p>
    const pay = orderPayment(s, o)
    return (
      <div className="ph-order" data-testid="phone-order">
        <p className="ph-app">Tu pedido</p>
        <p className="ph-folio">{o.id}</p>
        <StatusBadge s={ORDER_LABEL[o.status]} />
        <p className="ph-note">{o.kind === 'retiro' ? `Retiro ${o.pickup ? hhmm(o.pickup.startMin) : ''} · N.º ${o.pickupCode}` : 'En la mesa'}</p>
        <ul className="ph-lines">{o.lines.slice(0, 3).map((l) => <li key={l.id}>{l.qty}× {l.name}</li>)}</ul>
        <p className="ph-note"><b>{fmtARS(o.totalCents)}</b>{pay.state === 'pendiente-local' ? ' · pago en el local pendiente' : pay.state === 'pagado' ? ' · pagado' : ''}</p>
      </div>
    )
  }
  if (view.kind === 'reservation') {
    const r = s.reservations.find((x) => x.id === vars[view.resVar])
    if (!r) return <p className="ph-empty">Esperando la solicitud…</p>
    return (
      <div className="ph-order" data-testid="phone-reservation">
        <p className="ph-app">Tu reserva</p>
        <p className="ph-folio">{r.id}</p>
        <StatusBadge s={RES_LABEL[r.status]} />
        <p className="ph-note">{r.party} personas · {fmtDateShort(r.dateKey)} {hhmm(r.startMin)}</p>
      </div>
    )
  }
  const b = s.benefits.find((x) => x.code === vars[view.codeVar])
  const camp = b && s.campaigns.find((c) => c.id === b.campaignId)
  return (
    <div className="ph-order" data-testid="phone-benefit">
      <p className="ph-app">Mis beneficios</p>
      {b ? <><p className="ph-folio">{b.code}</p><p className="ph-note">{camp?.name} · {b.status}</p><p className="ph-note">Llega por WhatsApp (simulado) solo a quien aceptó promociones.</p></> : <p className="ph-empty">Activando la campaña…</p>}
    </div>
  )
}

/**
 * P5-L9 · Reproductor de escenas: un teléfono flotante sobre la app, que sigue visible y sin oscurecer. No es un
 * diálogo modal: no atrapa el foco ni bloquea la página. Pausa, siguiente, repetir, velocidad y salir; Escape sale.
 */
export function ScenePlayer() {
  const run = useSceneRun()
  const nav = useNavigate()
  const { pathname } = useLocation()
  const head = useRef<HTMLHeadingElement>(null)
  const startedFor = useRef<string | null>(null)
  // foco al título una sola vez, al empezar (los cambios de paso se anuncian en una región viva)
  useEffect(() => {
    const key = run ? `${run.scene.businessId}/${run.scene.id}` : null
    if (key && startedFor.current !== key) {
      startedFor.current = key
      head.current?.focus()
    }
    if (!key) startedFor.current = null
  }, [run])
  // avance automático: el brief dura sus segundos de referencia a la velocidad elegida
  useEffect(() => {
    if (!run || !run.playing || run.error || run.done) return
    const st = run.scene.steps[run.step]
    const t = window.setTimeout(() => {
      const to = nextStep()
      if (to) nav(to)
    }, (st.seconds * 1000) / run.speed)
    return () => window.clearTimeout(t)
  }, [run?.tick, run?.playing, run?.speed, run?.error, run?.done])
  if (!run) return null
  const st = run.scene.steps[run.step]
  const last = run.step + 1 >= run.scene.steps.length
  const go = (to: string | null) => {
    if (to && to !== pathname) nav(to)
  }
  const exit = () => {
    const to = exitScene()
    if (to) nav(to)
  }
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation()
      exit()
    }
  }
  return (
    <section className="scene-player" data-scene-player data-testid="scene-player" data-step={st.id} data-playing={run.playing || undefined} aria-labelledby="scene-h" onKeyDown={onKey}>
      <div className="sp-phone">
        <PhoneFrame label={`Teléfono del cliente · ${run.scene.title}`}>
          <PhoneContent view={st.phone} vars={run.vars} />
        </PhoneFrame>
      </div>
      <div className="sp-brief">
        <p className="eyebrow" style={{ margin: 0 }}>Escena guiada · paso {run.step + 1} de {run.scene.steps.length}</p>
        <h2 id="scene-h" ref={head} tabIndex={-1}>{run.scene.title}</h2>
        <div className="sp-mini" aria-label="Teléfono del cliente"><PhoneContent view={st.phone} vars={run.vars} /></div>
        <div aria-live="polite" data-testid="scene-brief">
          <h3>{st.title}</h3>
          <p>{st.brief}</p>
          {run.error ? (
            <p className="sp-error" role="alert" data-testid="scene-error">No se pudo: {run.error}</p>
          ) : run.done ? (
            <p className="sp-ok" data-testid="scene-done">Escena terminada. Todo lo que viste quedó hecho en la demo (podés revisarlo o reiniciar la demo).</p>
          ) : (
            <p className="sp-ok" data-testid="scene-verified">✓ Comprobado en la demo</p>
          )}
        </div>
        <div className="sp-bar" aria-hidden="true"><span key={run.tick} style={{ animationDuration: `${(st.seconds * 1000) / run.speed}ms`, animationPlayState: run.playing && !run.done && !run.error ? 'running' : 'paused' }} /></div>
        <ol className="sp-steps" aria-label="Pasos">
          {run.scene.steps.map((x, i) => <li key={x.id} aria-current={i === run.step ? 'step' : undefined} className={i < run.step || (i === run.step && run.done) ? 'done' : ''}>{x.title}</li>)}
        </ol>
        <div className="sp-ctrls">
          <button type="button" className="btn small secondary" onClick={togglePlay} disabled={run.done || !!run.error} data-testid="scene-play">{run.playing ? 'Pausa' : 'Seguir'}</button>
          <button type="button" className="btn small secondary" onClick={repeatStep} data-testid="scene-repeat">Repetir</button>
          <button type="button" className="btn small" onClick={() => go(nextStep())} disabled={run.done} data-testid="scene-next">{run.error ? 'Reintentar' : last ? 'Terminar' : 'Siguiente'}</button>
          <label className="sp-speed">
            <span className="sr-only">Velocidad</span>
            <select value={run.speed} onChange={(e) => setSpeed(Number(e.target.value))} data-testid="scene-speed">
              {SPEEDS.map((v) => <option key={v} value={v}>{String(v).replace('.', ',')}×</option>)}
            </select>
          </label>
          <button type="button" className="btn small secondary" onClick={exit} data-testid="scene-exit">Salir</button>
        </div>
        <p className="small muted" style={{ margin: 0 }}>Sin sonido ni animaciones obligatorias. Referencia: {st.seconds} s por paso a 1×. Escape también sale.</p>
      </div>
    </section>
  )
}
