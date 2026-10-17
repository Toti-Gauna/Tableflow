// Sonidos de interfaz sintéticos (Web Audio), apagados por defecto y siempre tras un gesto del usuario.
// Son señales cortas de estado (agregado, enviado, regalo, listo), nunca habla ni grabaciones.
import { getSnapshot, onCommand } from '../store'

export type Sfx = 'add' | 'success' | 'gift' | 'ready' | 'chime' | 'stamp' | 'flip' | 'match' | 'tap'
type Note = { f: number; at: number; d: number; type?: OscillatorType; g?: number; to?: number }

const SOUNDS: Record<Sfx, Note[]> = {
  add: [{ f: 659, at: 0, d: 0.08, type: 'triangle' }, { f: 988, at: 0.06, d: 0.12, type: 'triangle' }],
  success: [{ f: 523, at: 0, d: 0.12 }, { f: 659, at: 0.08, d: 0.12 }, { f: 784, at: 0.16, d: 0.22 }, { f: 1047, at: 0.16, d: 0.22, g: 0.25 }],
  gift: [{ f: 1047, at: 0, d: 0.1, type: 'triangle', g: 0.6 }, { f: 1319, at: 0.07, d: 0.1, type: 'triangle', g: 0.6 }, { f: 1568, at: 0.14, d: 0.1, type: 'triangle', g: 0.6 }, { f: 2093, at: 0.21, d: 0.32, type: 'sine', g: 0.5 }],
  ready: [{ f: 880, at: 0, d: 0.6 }, { f: 1760, at: 0, d: 0.32, g: 0.25 }, { f: 1320, at: 0.02, d: 0.4, g: 0.15 }],
  chime: [{ f: 659, at: 0, d: 0.36 }, { f: 523, at: 0.28, d: 0.55 }],
  stamp: [{ f: 220, at: 0, d: 0.14, to: 110 }, { f: 880, at: 0, d: 0.03, type: 'square', g: 0.08 }],
  flip: [{ f: 520, at: 0, d: 0.08, type: 'triangle', to: 780, g: 0.6 }],
  match: [{ f: 784, at: 0, d: 0.1, type: 'triangle' }, { f: 1175, at: 0.07, d: 0.16, type: 'triangle' }],
  tap: [{ f: 1200, at: 0, d: 0.03, g: 0.4 }],
}

let ctx: AudioContext | null = null

/** Reproduce un sonido si la persona los activó. Devuelve false si está apagado o el navegador lo bloquea. */
export function sfx(name: Sfx, opts: { force?: boolean } = {}): boolean {
  const { prefs } = getSnapshot()
  if (!opts.force && !prefs.uiSounds) return false
  try {
    const AC = typeof window !== 'undefined' ? window.AudioContext || (window as any).webkitAudioContext : null
    if (!AC) return false
    ctx ??= new AC()
    if (ctx.state === 'suspended') void ctx.resume()
    const t0 = ctx.currentTime + 0.01
    const master = ctx.createGain()
    master.gain.value = Math.max(0, Math.min(0.35, (prefs.volume ?? 0.2) * 0.45))
    master.connect(ctx.destination)
    for (const n of SOUNDS[name]) {
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.type = n.type ?? 'sine'
      o.frequency.setValueAtTime(n.f, t0 + n.at)
      if (n.to) o.frequency.exponentialRampToValueAtTime(n.to, t0 + n.at + n.d)
      g.gain.setValueAtTime(0.0001, t0 + n.at)
      g.gain.linearRampToValueAtTime(n.g ?? 1, t0 + n.at + 0.012)
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + n.at + n.d)
      o.connect(g)
      g.connect(master)
      o.start(t0 + n.at)
      o.stop(t0 + n.at + n.d + 0.02)
    }
    return true
  } catch {
    return false
  }
}

const BY_COMMAND: Record<string, Sfx> = {
  'cart/add': 'add',
  'order/submit': 'success',
  'res/request': 'success',
  'event/enroll': 'success',
  'gift/create': 'gift',
  'gift/open': 'gift',
  'gift/redeem': 'success',
  'visit/credit': 'stamp',
  'pass/save': 'stamp',
  'order/ready': 'ready',
}

/** Conecta los sonidos a los comandos exitosos (solo los de interacción directa de la persona). */
export function initSfx() {
  onCommand((cmd, outcome) => {
    if (!outcome.ok || outcome.duplicate) return
    const s = BY_COMMAND[cmd.type]
    if (s) sfx(s)
  })
}
