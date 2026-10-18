import { useSyncExternalStore } from 'react'
import type { Scene } from '../../domain/scenes'
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
export const setSceneRun = (next: SceneRun | null) => {
  current = next
  emit()
}
export function useSceneRun(): SceneRun | null {
  return useSyncExternalStore((l) => (listeners.add(l), () => listeners.delete(l)), () => current, () => current)
}
export const getSceneRun = () => current
