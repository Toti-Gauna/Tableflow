import { useSyncExternalStore } from 'react'
import { dispatch, getSnapshot } from '../../store'
import { runStep, sceneFor, type Scene, type SceneApi, type SceneId } from '../../domain/scenes'
import type { BusinessId, Role } from '../../domain/types'

/**
 * P5-L9 · Estado del reproductor de escenas (fuera del store del negocio: es la capa de presentación de la demo).
 * Al salir se restauran el negocio, el rol y la pantalla de antes; lo que la escena creó queda en la demo.
 */
export interface SceneRun {
  scene: Scene
  step: number
  playing: boolean
  speed: number
  /** Cambia en cada (re)inicio del paso: reinicia el temporizador del brief. */
  tick: number
  vars: Record<string, string>
  /** Resultado del paso actual: null = verificado. */
  error: string | null
  done: boolean
  before: { role: Role; businessId: BusinessId; path: string }
}

let current: SceneRun | null = null
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())
const set = (next: SceneRun | null) => {
  current = next
  emit()
}
export function useSceneRun(): SceneRun | null {
  return useSyncExternalStore((l) => (listeners.add(l), () => listeners.delete(l)), () => current, () => current)
}
export const getSceneRun = () => current

const api = (r: SceneRun): SceneApi => ({ state: () => getSnapshot().state, run: (cmd) => dispatch(cmd), vars: r.vars })

/** Corre el paso `i` (una sola vez) y deja la vista en su rol. Devuelve la pantalla de fondo. */
function enter(r: SceneRun, i: number): string {
  const st = r.scene.steps[i]
  const res = runStep(api(r), st)
  const s = getSnapshot().state
  if (s.session.role !== st.role) dispatch({ type: 'session/setRole', role: st.role })
  set({ ...r, step: i, tick: r.tick + 1, error: res.message, playing: res.ok ? r.playing : false, done: false })
  return st.screen(getSnapshot().state, r.vars)
}

export function startScene(biz: BusinessId, id: SceneId, path: string): string | null {
  const scene = sceneFor(biz, id)
  if (!scene) return null
  const s = getSnapshot().state
  const before = { role: s.session.role, businessId: s.session.businessId, path }
  if (s.session.businessId !== biz) dispatch({ type: 'session/setBusiness', businessId: biz })
  const r: SceneRun = { scene, step: 0, playing: true, speed: 1, tick: 0, vars: {}, error: null, done: false, before }
  return enter(r, 0)
}

/** Siguiente paso; en el último, marca la escena como terminada (sin salir: se puede revisar lo que quedó). */
export function nextStep(): string | null {
  const r = current
  if (!r) return null
  if (r.error) {
    // reintento del paso que falló
    return enter(r, r.step)
  }
  if (r.step + 1 >= r.scene.steps.length) {
    set({ ...r, done: true, playing: false })
    return null
  }
  return enter(r, r.step + 1)
}
/** Repetir el brief del paso: no vuelve a correr los comandos (ya hechos), reinicia el tiempo de lectura. */
export function repeatStep() {
  if (current) set({ ...current, tick: current.tick + 1, done: false, playing: true })
}
export function togglePlay() {
  if (current) set({ ...current, playing: !current.playing })
}
export function setSpeed(speed: number) {
  if (current) set({ ...current, speed, tick: current.tick + 1 })
}
/** Sale y devuelve a dónde volver. Restaura negocio y rol; no deja nada abierto ni bloqueado. */
export function exitScene(): string | null {
  const r = current
  if (!r) return null
  const s = getSnapshot().state
  if (s.session.businessId !== r.before.businessId) dispatch({ type: 'session/setBusiness', businessId: r.before.businessId })
  if (getSnapshot().state.session.role !== r.before.role) dispatch({ type: 'session/setRole', role: r.before.role })
  set(null)
  return r.before.path
}
