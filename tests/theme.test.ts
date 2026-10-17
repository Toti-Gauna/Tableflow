import { describe, expect, it } from 'vitest'
import { DEFAULT_PREFS, KEY_PREFS, loadPrefs, type StorageLike } from '../src/domain/persistence'
import { resolveTheme } from '../src/ui/theme'

// P5-L3 · preferencia de tema y bienvenida por rol
const mem = (init: Record<string, string> = {}): StorageLike => {
  const m = new Map(Object.entries(init))
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v), removeItem: (k) => void m.delete(k), key: (i) => [...m.keys()][i] ?? null, get length() { return m.size } }
}

describe('tema claro/oscuro', () => {
  it('por defecto sigue al sistema y la bienvenida no se vio', () => {
    expect(DEFAULT_PREFS.theme).toBe('system')
    expect(DEFAULT_PREFS.roleIntroSeen).toBe(false)
  })
  it('"sistema" resuelve según prefers-color-scheme; la elección manual manda', () => {
    expect(resolveTheme('system', true)).toBe('dark')
    expect(resolveTheme('system', false)).toBe('light')
    expect(resolveTheme('light', true)).toBe('light')
    expect(resolveTheme('dark', false)).toBe('dark')
  })
  it('preferencias viejas (sin tema) o con un valor desconocido vuelven a "sistema" sin perder lo demás', () => {
    const old = loadPrefs(mem({ [KEY_PREFS]: JSON.stringify({ uiSounds: true }) }))
    expect(old.theme).toBe('system')
    expect(old.uiSounds).toBe(true)
    expect(loadPrefs(mem({ [KEY_PREFS]: JSON.stringify({ theme: 'sepia' }) })).theme).toBe('system')
    expect(loadPrefs(mem({ [KEY_PREFS]: JSON.stringify({ theme: 'dark', roleIntroSeen: true }) }))).toMatchObject({ theme: 'dark', roleIntroSeen: true })
  })
})
