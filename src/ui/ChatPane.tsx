import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Glyph } from './glyphs'
import './chatpane.css'

export interface ChatTurn<R> { id: number; from: 'yo' | 'asistente' | 'sistema'; text?: string; reply?: R }

/**
 * P5-L6 · Conversación con un asistente simulado. La respuesta se calcula al instante (reglas fijas); solo se muestra
 * un "escribiendo…" breve (menos de un segundo) que se puede detener. No se finge una IA ni se alarga la espera.
 */
export function ChatPane<R>({ title, note, intro, suggestions, ask, render, testid, onTurn }: {
  title: string
  note: string
  intro: ReactNode
  suggestions: string[]
  /** Respuesta(s) a una pregunta: síncrono y determinista. */
  ask: (text: string) => R[]
  render: (r: R, send: (t: string) => void) => ReactNode
  testid: string
  onTurn?: () => void
}) {
  const [turns, setTurns] = useState<ChatTurn<R>[]>([])
  const [text, setText] = useState('')
  const [typing, setTyping] = useState(false)
  const timer = useRef<number | null>(null)
  const pending = useRef<R[] | null>(null)
  const seq = useRef(0)
  const logRef = useRef<HTMLOListElement>(null)
  const reduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

  useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current) }, [])
  useEffect(() => { logRef.current?.lastElementChild?.scrollIntoView({ block: 'nearest' }) }, [turns, typing])

  const flush = () => {
    const rs = pending.current ?? []
    pending.current = null
    timer.current = null
    setTyping(false)
    setTurns((t) => [...t, ...rs.map((reply) => ({ id: ++seq.current, from: 'asistente' as const, reply }))])
    onTurn?.()
  }
  const send = (raw: string) => {
    const q = raw.trim()
    if (!q || typing) return
    setText('')
    setTurns((t) => [...t, { id: ++seq.current, from: 'yo', text: q }])
    pending.current = ask(q)
    setTyping(true)
    // la respuesta ya está calculada: la pausa es corta y se puede detener; con movimiento reducido es casi inmediata
    timer.current = window.setTimeout(flush, reduced ? 80 : 450)
  }
  const stop = () => {
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = null
    pending.current = null
    setTyping(false)
    setTurns((t) => [...t, { id: ++seq.current, from: 'sistema', text: 'Respuesta detenida. Podés preguntar otra cosa.' }])
  }

  return (
    <section className="chatpane" aria-labelledby={`${testid}-t`} data-testid={testid}>
      <header className="cp-head">
        <h2 id={`${testid}-t`}>{title}</h2>
        <p className="cp-note"><Glyph name="help" size={14} /> {note}</p>
      </header>
      <ol className="cp-log" ref={logRef} aria-live="polite" aria-relevant="additions" aria-label="Conversación">
        <li className="cp-msg asistente">{intro}</li>
        {turns.map((t) => (
          <li key={t.id} className={`cp-msg ${t.from}`} data-from={t.from}>
            {t.from === 'yo' && <span className="sr-only">Vos: </span>}
            {t.text ?? (t.reply !== undefined ? render(t.reply, send) : null)}
          </li>
        ))}
        {typing && (
          <li className="cp-msg asistente cp-typing" aria-label="El asistente está escribiendo">
            <span className="dots" aria-hidden="true"><i /><i /><i /></span>
            <button className="btn ghost small" type="button" onClick={stop} data-testid={`${testid}-stop`}>Detener</button>
          </li>
        )}
      </ol>
      <div className="cp-suggest" role="group" aria-label="Preguntas sugeridas">
        {suggestions.map((sug) => <button key={sug} type="button" className="chip" onClick={() => send(sug)} disabled={typing}>{sug}</button>)}
      </div>
      <form className="cp-form" onSubmit={(e) => { e.preventDefault(); send(text) }}>
        <label htmlFor={`${testid}-in`} className="sr-only">Escribí tu pregunta</label>
        <input id={`${testid}-in`} type="text" value={text} onChange={(e) => setText(e.target.value)} placeholder="Escribí tu pregunta" autoComplete="off" data-testid={`${testid}-input`} />
        <button className="btn" type="submit" disabled={typing || !text.trim()} data-testid={`${testid}-send`}>Enviar</button>
      </form>
    </section>
  )
}
