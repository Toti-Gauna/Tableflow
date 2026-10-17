import { makeSeed } from './fixtures'
import { newConfig } from './fixtures/nuevos'
import { rulesFor, DEFAULT_LOCATION } from './fixtures/base'
import { BIZ_IDS } from './business'
import { SCHEMA_VERSION, STORAGE_NS, type AppState, type FixtureId } from './types'
import { validateState } from './validate'

/** Subconjunto de Storage que usamos; permite inyectar un fake en tests y en modo memoria. */
export interface StorageLike {
  getItem(k: string): string | null
  setItem(k: string, v: string): void
  removeItem(k: string): void
  key(i: number): string | null
  readonly length: number
}

export const KEY_STATE = STORAGE_NS
export const KEY_PREFS = `${STORAGE_NS}.prefs`
export const KEY_BACKUP = `${STORAGE_NS}.corrupt-backup`

export interface Envelope {
  schemaVersion: number
  savedAt: number
  state: AppState
}

export type LoadResult =
  | { kind: 'ok'; state: AppState }
  | { kind: 'fresh'; state: AppState }
  | { kind: 'corrupt'; errors: string[]; raw: string; byteLength: number }
  | { kind: 'future'; version: number; raw: string; byteLength: number }
  | { kind: 'needs-migration'; version: number; raw: string; byteLength: number }

/**
 * Migraciones explícitas entre versiones de esquema (clave = versión de origen); se encadenan hasta la actual.
 * v1 → v2: agrega las invitaciones (regalos) y los ajustes de temporada; no toca ningún registro existente.
 * v2 → v3 (P5-L5): agrega Copo, Taberna Compás y Brasa Rápida con su configuración (sin actividad), los clásicos
 *   de Ritual Café y el pago en el local. Solo agrega: ningún registro existente cambia de id, negocio ni datos.
 */
export const MIGRATIONS: Record<number, (old: unknown) => unknown> = {
  1: (old) => {
    const s = old as Record<string, unknown>
    return {
      ...s,
      schemaVersion: 2,
      gifts: Array.isArray(s.gifts) ? s.gifts : [],
      settings: { seasonByBusiness: { 'mesa-clara': 'auto', 'ritual-cafe': 'auto' } },
    }
  },
  2: (old) => {
    const s = old as Record<string, any>
    const t0 = typeof s.clock?.nowMs === 'number' ? s.clock.nowMs : 0
    const nc = newConfig(t0)
    /** Agrega por id lo que falte; lo existente queda intacto. */
    const add = <T extends { id: string }>(cur: T[] | undefined, extra: T[]): T[] => {
      const list = Array.isArray(cur) ? cur : []
      const have = new Set(list.map((x) => x.id))
      return [...list, ...extra.filter((x) => !have.has(x.id))]
    }
    const businesses = (Array.isArray(s.businesses) ? s.businesses : []).map((b: any) => ('paysAtCounter' in b ? b : { ...b, paysAtCounter: b.id === 'ritual-cafe' }))
    const session = s.session ?? {}
    const loc = { ...(session.locationByBusiness ?? {}) }
    const cust = { ...(session.customerByBusiness ?? {}) }
    const season = { ...(s.settings?.seasonByBusiness ?? {}) }
    for (const b of BIZ_IDS) {
      if (!(b in loc)) loc[b] = DEFAULT_LOCATION[b]
      if (!(b in cust)) cust[b] = null
      if (!(b in season)) season[b] = 'auto'
    }
    return {
      ...s,
      schemaVersion: 3,
      businesses: add(businesses, nc.businesses),
      locations: add(s.locations, nc.locations),
      serviceWindows: add(s.serviceWindows, nc.serviceWindows),
      tables: add(s.tables, nc.tables),
      modifierGroups: add(s.modifierGroups, nc.modifierGroups),
      menuItems: add(s.menuItems, nc.menuItems),
      ingredients: add(s.ingredients, nc.ingredients),
      recipes: add(s.recipes, nc.recipes),
      tastingEvents: add(s.tastingEvents, nc.tastingEvents),
      rules: add(s.rules, ['copo', 'compas', 'brasa'].flatMap((b) => rulesFor(b as any))),
      session: { ...session, locationByBusiness: loc, customerByBusiness: cust },
      settings: { ...(s.settings ?? {}), seasonByBusiness: season },
    }
  },
}

/** Aplica las migraciones en cadena desde la versión guardada hasta la actual. */
export function migrate(state: unknown, from: number): { ok: true; state: unknown } | { ok: false; at: number } {
  let cur = state
  for (let v = from; v < SCHEMA_VERSION; v++) {
    const mig = MIGRATIONS[v]
    if (!mig) return { ok: false, at: v }
    cur = mig(cur)
  }
  return { ok: true, state: cur }
}

export function getBrowserStorage(): StorageLike | null {
  try {
    const st = globalThis.localStorage
    if (!st) return null
    // sonda: algunos navegadores lanzan recién al escribir
    const probe = `${STORAGE_NS}.probe`
    st.setItem(probe, '1')
    st.removeItem(probe)
    return st
  } catch {
    return null
  }
}

export function loadState(storage: StorageLike | null): LoadResult {
  let raw: string | null = null
  try {
    raw = storage ? storage.getItem(KEY_STATE) : null
  } catch {
    raw = null
  }
  if (raw === null) return { kind: 'fresh', state: makeSeed('servicio') }
  const byteLength = raw.length
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch (e) {
    return { kind: 'corrupt', errors: [`JSON inválido: ${(e as Error).message}`], raw, byteLength }
  }
  const env = parsed as Partial<Envelope> | null
  if (!env || typeof env !== 'object' || typeof env.schemaVersion !== 'number' || !env.state) {
    return { kind: 'corrupt', errors: ['El contenido no tiene la forma esperada (schemaVersion/state).'], raw, byteLength }
  }
  if (env.schemaVersion > SCHEMA_VERSION) return { kind: 'future', version: env.schemaVersion, raw, byteLength }
  if (env.schemaVersion < SCHEMA_VERSION) {
    const m = migrate(env.state, env.schemaVersion)
    if (!m.ok) return { kind: 'needs-migration', version: env.schemaVersion, raw, byteLength }
    const migrated = m.state
    const errs = validateState(migrated)
    if (errs.length) return { kind: 'corrupt', errors: errs, raw, byteLength }
    return { kind: 'ok', state: migrated as AppState }
  }
  const errors = validateState(env.state)
  if (errors.length) return { kind: 'corrupt', errors, raw, byteLength }
  return { kind: 'ok', state: env.state }
}

export type SaveResult = { ok: true } | { ok: false; reason: string }

export function saveState(storage: StorageLike | null, state: AppState, savedAt: number): SaveResult {
  if (!storage) return { ok: false, reason: 'El almacenamiento del navegador no está disponible.' }
  try {
    const env: Envelope = { schemaVersion: SCHEMA_VERSION, savedAt, state }
    storage.setItem(KEY_STATE, JSON.stringify(env))
    return { ok: true }
  } catch (e) {
    return { ok: false, reason: `No se pudo guardar (${(e as Error).name || 'error'}): cuota agotada o permiso denegado.` }
  }
}

/** Claves que pertenecen a TableFlow. Nunca se usa localStorage.clear(). */
export function tableflowKeys(storage: StorageLike): string[] {
  const out: string[] = []
  for (let i = 0; i < storage.length; i++) {
    const k = storage.key(i)
    if (k && (k === STORAGE_NS || k.startsWith(`${STORAGE_NS}.`))) out.push(k)
  }
  return out
}

/** Reinicio explícito: borra solo las claves TableFlow y deja el fixture elegido. */
export function resetProduct(storage: StorageLike | null, fixtureId: FixtureId, savedAt: number): { state: AppState; persisted: boolean; reason?: string } {
  const state = makeSeed(fixtureId)
  if (!storage) return { state, persisted: false, reason: 'Sin almacenamiento: la demo sigue en memoria.' }
  try {
    for (const k of tableflowKeys(storage)) storage.removeItem(k)
  } catch {
    /* sigue */
  }
  const r = saveState(storage, state, savedAt)
  return { state, persisted: r.ok, reason: r.ok ? undefined : r.reason }
}

/** Antes de reemplazar un estado corrupto se resguarda el texto original (no hay borrado silencioso). */
export function backupRaw(storage: StorageLike | null, raw: string): boolean {
  if (!storage) return false
  try {
    storage.setItem(KEY_BACKUP, raw)
    return true
  } catch {
    return false
  }
}

export function loadPrefs(storage: StorageLike | null): Prefs {
  try {
    const raw = storage?.getItem(KEY_PREFS)
    if (raw) {
      const p = { ...DEFAULT_PREFS, ...JSON.parse(raw) } as Prefs
      if (!['system', 'light', 'dark'].includes(p.theme)) p.theme = 'system'
      return p
    }
  } catch {
    /* ignora */
  }
  return { ...DEFAULT_PREFS }
}
export function savePrefs(storage: StorageLike | null, prefs: Prefs) {
  try {
    storage?.setItem(KEY_PREFS, JSON.stringify(prefs))
  } catch {
    /* preferencias no críticas */
  }
}
export interface Prefs {
  reducedMotion: 'auto' | 'on'
  audio: boolean
  volume: number
  favorites: string[]
  /** Sonidos de interfaz (agregar, enviar, regalo, listo). Apagados por defecto. */
  uiSounds: boolean
  /** Aviso sonoro de comandas nuevas en la pantalla de cocina/barra. Apagado por defecto. */
  kdsChime: boolean
  /** Tema de color: sigue al sistema hasta que la persona elige claro u oscuro (P5-L3). */
  theme: ThemePref
  /** El selector de rol de bienvenida ya se mostró (se elige o se omite una sola vez). */
  roleIntroSeen: boolean
}
export type ThemePref = 'system' | 'light' | 'dark'
export const DEFAULT_PREFS: Prefs = { reducedMotion: 'auto', audio: false, volume: 0.2, favorites: [], uiSounds: false, kdsChime: false, theme: 'system', roleIntroSeen: false }

/** Diagnóstico exportable: errores y conteos, sin contenido operable. */
export function buildDiagnostic(result: Extract<LoadResult, { kind: 'corrupt' | 'future' | 'needs-migration' }>, app: string) {
  return {
    app,
    namespace: STORAGE_NS,
    kind: result.kind,
    schemaVersionEsperada: SCHEMA_VERSION,
    bytes: result.byteLength,
    errores: result.kind === 'corrupt' ? result.errors : [],
    version: 'version' in result ? result.version : null,
    nota: 'Diagnóstico sintético: datos de demostración ficticios, sin información real.',
  }
}
