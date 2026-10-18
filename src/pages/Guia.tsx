import { useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { getSnapshot, setPrefs, useSnapshot, dispatch } from '../store'
import { PageHead } from '../ui/Shell'
import { Callout } from '../ui/kit'
import { GUIDE_ROLE_LABEL, ROLE_FOR, taskDone, tasksFor, type GuideRole, type GuideTask } from '../domain/guide'
import { EMPTY_GUIDE, type GuideProgress } from '../domain/persistence'
import { openEclipse } from '../ui/eclipseHost'
import type { BusinessProfile } from '../domain/types'
import '../ui/scenes/guide.css'

const key = (taskId: string, biz: string) => `${taskId}@${biz}`
const ROLES: GuideRole[] = ['cliente', 'recepcion', 'cocina', 'caja', 'encargado']
// siempre sobre el progreso más reciente (no sobre el del render): un clic rápido no pisa una tarea recién hecha
const update = (f: (g: GuideProgress) => Partial<GuideProgress>) => {
  const g = getSnapshot().prefs.guide ?? EMPTY_GUIDE
  setPrefs({ guide: { ...g, ...f(g) } })
}
const patch = (_g: GuideProgress, p: Partial<GuideProgress>) => update(() => p)

/** Empezar a practicar una tarea: rol de la vista, punto de partida de la auditoría y navegación. */
function usePractice() {
  const { state, prefs } = useSnapshot()
  const nav = useNavigate()
  return (b: BusinessProfile, t: GuideTask) => {
    if (state.session.businessId !== b.id) dispatch({ type: 'session/setBusiness', businessId: b.id })
    if (state.session.role !== ROLE_FOR[t.role]) dispatch({ type: 'session/setRole', role: ROLE_FOR[t.role] })
    update(() => ({ active: { taskId: t.id, businessId: b.id, since: getSnapshot().state.audit.length }, paused: false, declined: false }))
    nav(t.to(b))
  }
}

/** P5-L9 · Guía completa por rol, módulo y tarea, con progreso, práctica, omitir, pausar, retomar y rechazar. */
export function Guia() {
  const { state, prefs } = useSnapshot()
  const g = prefs.guide ?? EMPTY_GUIDE
  const biz = state.businesses.find((b) => b.id === state.session.businessId)!
  const tasks = tasksFor(biz)
  const practice = usePractice()
  const isDone = (t: GuideTask) => g.done.includes(key(t.id, biz.id))
  const isSkipped = (t: GuideTask) => g.skipped.includes(key(t.id, biz.id))
  const count = tasks.filter((t) => isDone(t) || isSkipped(t)).length
  const active = g.active && tasks.find((t) => t.id === g.active!.taskId && g.active!.businessId === biz.id)
  return (
    <main className="wrap guide-page">
      <PageHead title="Guía de TableFlow" eyebrow={biz.name} sub="Por rol y por tarea, adaptada a este negocio. Practicás en la demo y la tarea se marca sola cuando la hacés de verdad." />
      {g.declined ? (
        <Callout>
          Elegiste no seguir la guía. <button type="button" className="linklike" onClick={() => patch(g, { declined: false })} data-testid="guide-undecline">Volver a mostrarla</button>
        </Callout>
      ) : (
        <>
          <div className="guide-progress" aria-label="Progreso de la guía">
            <p><strong data-testid="guide-count">{count} de {tasks.length}</strong> tareas · {biz.name}</p>
            <div className="gp-bar" role="progressbar" aria-valuemin={0} aria-valuemax={tasks.length} aria-valuenow={count} aria-label="Tareas hechas u omitidas"><span style={{ width: `${(count / tasks.length) * 100}%` }} /></div>
            <div className="row">
              {active && g.paused && <button type="button" className="btn small" onClick={() => practice(biz, active)} data-testid="guide-resume">Retomar «{active.title}»</button>}
              {active && !g.paused && <button type="button" className="btn small secondary" onClick={() => patch(g, { paused: true })} data-testid="guide-pause">Pausar la guía</button>}
              <button type="button" className="btn small secondary" onClick={() => patch(g, { declined: true, active: null })} data-testid="guide-decline">No me interesa la guía</button>
              <Link className="btn small secondary" to="/escenas">Ver escenas guiadas</Link>
              <button type="button" className="btn small secondary" onClick={() => openEclipse('boton')} data-testid="adapt-open">Adaptarlo a mi negocio</button>
            </div>
          </div>
          {ROLES.map((r) => {
            const list = tasks.filter((t) => t.role === r)
            if (!list.length) return null
            return (
              <section key={r} className="guide-role" aria-labelledby={`gr-${r}`}>
                <h2 id={`gr-${r}`}>{GUIDE_ROLE_LABEL[r]}</h2>
                <ol className="guide-tasks">
                  {list.map((t) => (
                    <li key={t.id} className="card guide-task" data-testid={`gtask-${t.id}`} data-state={isDone(t) ? 'hecha' : isSkipped(t) ? 'omitida' : 'pendiente'}>
                      <p className="eyebrow" style={{ margin: 0 }}>{t.module}</p>
                      <h3>{t.title} {isDone(t) && <span className="gt-badge ok">Hecha</span>}{isSkipped(t) && <span className="gt-badge">Omitida</span>}</h3>
                      <p className="small">{t.why(biz)}</p>
                      <ol className="small gt-steps">{t.steps(biz).map((s) => <li key={s}>{s}</li>)}</ol>
                      <div className="row">
                        <button type="button" className="btn small" onClick={() => practice(biz, t)} data-testid={`gpractice-${t.id}`}>{isDone(t) ? 'Practicar de nuevo' : 'Practicar'}</button>
                        {!isDone(t) && !isSkipped(t) && <button type="button" className="btn small secondary" onClick={() => update((cur) => ({ skipped: [...cur.skipped, key(t.id, biz.id)], active: cur.active?.taskId === t.id ? null : cur.active }))} data-testid={`gskip-${t.id}`}>Omitir</button>}
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            )
          })}
        </>
      )}
    </main>
  )
}

/**
 * Ayuda contextual mientras se practica: la tarea, sus pasos y un aviso cuando se hizo de verdad (en la auditoría).
 * Pausar la oculta; omitir la descarta; se retoma desde la guía. Al completar la guía se ofrece una sola vez el cierre.
 */
export function GuideCoach() {
  const { state, prefs } = useSnapshot()
  const nav = useNavigate()
  const { pathname } = useLocation()
  const g = prefs.guide ?? EMPTY_GUIDE
  const biz = g.active ? state.businesses.find((b) => b.id === g.active!.businessId) : undefined
  const task = biz && tasksFor(biz).find((t) => t.id === g.active!.taskId)
  const done = !!(task && biz && taskDone(state, biz.id, task, g.active!.since))
  useEffect(() => {
    if (!done || !task || !biz) return
    const k = key(task.id, biz.id)
    const cur = getSnapshot().prefs.guide ?? EMPTY_GUIDE
    if (cur.done.includes(k)) return
    const doneList = [...cur.done, k]
    update(() => ({ done: doneList }))
    const all = tasksFor(biz).every((t) => doneList.includes(key(t.id, biz.id)) || cur.skipped.includes(key(t.id, biz.id)))
    if (all) openEclipse('auto', pathname)
  }, [done])
  if (!task || !biz || g.paused || g.declined || pathname === '/guia') return null
  const close = () => update(() => ({ active: null }))
  return (
    <aside className="guide-coach" aria-label="Ayuda de la guía" data-testid="guide-coach" data-done={done || undefined}>
      <p className="eyebrow" style={{ margin: 0 }}>Guía · {GUIDE_ROLE_LABEL[task.role]} · {task.module}</p>
      <h2>{task.title}</h2>
      {done ? (
        <p className="gc-ok" role="status" data-testid="guide-done">¡Hecho! Quedó registrado en la demo.</p>
      ) : (
        <ol className="small">{task.steps(biz).map((s) => <li key={s}>{s}</li>)}</ol>
      )}
      <div className="row">
        {done ? (
          <button type="button" className="btn small" onClick={() => { close(); nav('/guia') }} data-testid="guide-back">Seguir con la guía</button>
        ) : (
          <>
            <button type="button" className="btn small secondary" onClick={() => update(() => ({ paused: true }))} data-testid="coach-pause">Pausar</button>
            <button type="button" className="btn small secondary" onClick={() => update((cur) => ({ active: null, skipped: [...cur.skipped, key(task.id, biz.id)] }))} data-testid="coach-skip">Omitir</button>
          </>
        )}
        <Link className="small" to="/guia">Ver la guía</Link>
      </div>
    </aside>
  )
}
