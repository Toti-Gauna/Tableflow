import { createContext, useCallback, useContext, useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { dispatch } from '../store'
import type { Outcome } from '../domain/core'
import type { Command } from '../domain/reducer'
import type { Label, Tone } from './format'

// ---------- anuncios (región viva discreta) y avisos visibles -------------------
type Listener = (msg: string, tone: 'ok' | 'err') => void
const listeners = new Set<Listener>()
export function announce(msg: string, tone: 'ok' | 'err' = 'ok') {
  for (const l of listeners) l(msg, tone)
}
/** Ejecuta un comando, anuncia el resultado y devuelve el Outcome para que la pantalla muestre el estado real. */
export function act(cmd: Command, okMsg?: string): Outcome {
  const o = dispatch(cmd)
  if (o.ok) {
    const m = o.message ?? okMsg
    if (m) announce(m, 'ok')
  } else announce(o.message, 'err')
  return o
}

export function LiveRegion() {
  const [msg, setMsg] = useState('')
  const [toasts, setToasts] = useState<{ id: number; msg: string; tone: string }[]>([])
  const id = useRef(0)
  useEffect(() => {
    const l: Listener = (m, tone) => {
      setMsg('')
      setTimeout(() => setMsg(m), 20)
      const n = ++id.current
      // un solo aviso visible a la vez: discreto, no tapa el contenido ni se apila
      setToasts([{ id: n, msg: m, tone }])
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== n)), 3200)
    }
    listeners.add(l)
    return () => {
      listeners.delete(l)
    }
  }, [])
  return (
    <>
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true" data-testid="live-region">
        {msg}
      </div>
      <div className="toast-region" aria-hidden="true">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.tone === 'err' ? 'err' : ''}`}>
            {t.msg}
          </div>
        ))}
      </div>
    </>
  )
}

// ---------- piezas visuales -------------------------------------------------------
export function Badge({ label, tone = 'neutral', icon }: { label: string; tone?: Tone; icon?: string }) {
  return (
    <span className={`badge ${tone}`}>
      {icon && <span aria-hidden="true">{icon}</span>}
      {label}
    </span>
  )
}
export function StatusBadge({ s }: { s: Label }) {
  return <Badge label={s.label} tone={s.tone} icon={s.icon} />
}
export function DemoTag({ children = 'DEMO' }: { children?: ReactNode }) {
  return <span className="badge demo">{children}</span>
}

export function Empty({ title, children, action, art }: { title: string; children?: ReactNode; action?: ReactNode; art?: ReactNode }) {
  return (
    <div className={`empty ${art ? 'has-art' : ''}`} role="group" aria-label={title}>
      {art && <div className="empty-art">{art}</div>}
      <h3>{title}</h3>
      {children && <p className="muted">{children}</p>}
      {action}
    </div>
  )
}
/** Nota de la capa de demo (no del producto): sello DEMO y borde punteado, siempre distinguible del contenido. */
export function DemoHint({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={`demo-hint ${className ?? ''}`}>
      <span className="seal" aria-hidden="true">DEMO</span>
      <span>{children}</span>
    </p>
  )
}
export function Callout({ tone = 'info', children, role }: { tone?: 'info' | 'warn' | 'err' | 'ok' | 'review'; children: ReactNode; role?: string }) {
  return (
    <div className={`callout ${tone === 'info' ? '' : tone}`} role={role ?? (tone === 'err' ? 'alert' : undefined)}>
      {children}
    </div>
  )
}
export function ErrorText({ id, children }: { id?: string; children?: ReactNode }) {
  if (!children) return null
  return (
    <p className="error-text" id={id} role="alert">
      {children}
    </p>
  )
}

export function Field({
  label,
  hint,
  error,
  children,
  htmlFor,
}: {
  label: string
  hint?: string
  error?: string
  htmlFor: string
  children: ReactNode
}) {
  return (
    <div className="field">
      <label htmlFor={htmlFor}>{label}</label>
      {children}
      {hint && (
        <span className="hint" id={`${htmlFor}-hint`}>
          {hint}
        </span>
      )}
      <ErrorText id={`${htmlFor}-err`}>{error}</ErrorText>
    </div>
  )
}

// ---------- diálogo nativo accesible (foco atrapado y restaurado por el navegador) ----
export function Dialog({
  open,
  onClose,
  title,
  children,
  testId,
  titleId: ownTitleId,
  className,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  testId?: string
  /** Si el contenido ya trae su propio título visible (con este id), el diálogo no agrega otro. */
  titleId?: string
  className?: string
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const autoId = useId()
  const titleId = ownTitleId ?? autoId
  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])
  return (
    <dialog
      ref={ref}
      className={className}
      aria-labelledby={titleId}
      data-testid={testId}
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose()
      }}
    >
      {open && (
        <div className="dialog-body">
          {!ownTitleId && <h2 id={titleId}>{title}</h2>}
          {children}
        </div>
      )}
    </dialog>
  )
}

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  cancelLabel = 'Cancelar',
  danger,
  onConfirm,
  onCancel,
  children,
  confirmDisabled,
}: {
  open: boolean
  title: string
  body?: ReactNode
  confirmLabel: string
  cancelLabel?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
  children?: ReactNode
  confirmDisabled?: boolean
}) {
  return (
    <Dialog open={open} onClose={onCancel} title={title} testId="confirm-dialog">
      {body && <div className="stack tight">{body}</div>}
      {children}
      <div className="dialog-actions">
        <button className="btn secondary" type="button" onClick={onCancel} data-testid="dialog-cancel">
          {cancelLabel}
        </button>
        <button className={`btn ${danger ? 'danger' : ''}`} type="button" onClick={onConfirm} disabled={confirmDisabled} data-testid="dialog-confirm">
          {confirmLabel}
        </button>
      </div>
    </Dialog>
  )
}

/** Diálogo con motivo obligatorio (cancelaciones, reversiones, excepciones). */
export function ReasonDialog({
  open,
  title,
  body,
  confirmLabel,
  placeholder = 'Motivo',
  danger = true,
  onConfirm,
  onCancel,
}: {
  open: boolean
  title: string
  body?: ReactNode
  confirmLabel: string
  placeholder?: string
  danger?: boolean
  onConfirm: (reason: string) => void
  onCancel: () => void
}) {
  const [reason, setReason] = useState('')
  const [touched, setTouched] = useState(false)
  useEffect(() => {
    if (open) {
      setReason('')
      setTouched(false)
    }
  }, [open])
  const bad = touched && !reason.trim()
  return (
    <ConfirmDialog
      open={open}
      title={title}
      body={body}
      confirmLabel={confirmLabel}
      danger={danger}
      onCancel={onCancel}
      onConfirm={() => {
        setTouched(true)
        if (reason.trim()) onConfirm(reason.trim())
      }}
    >
      <div className="field" style={{ marginTop: 12 }}>
        <label htmlFor="reason-input">{placeholder}</label>
        <textarea id="reason-input" value={reason} onChange={(e) => setReason(e.target.value)} aria-invalid={bad} aria-describedby={bad ? 'reason-err' : undefined} />
        <ErrorText id="reason-err">{bad ? 'Completá el motivo para continuar.' : ''}</ErrorText>
      </div>
    </ConfirmDialog>
  )
}

// ---------- varios ----------------------------------------------------------------
export function useToggle(initial = false): [boolean, () => void, () => void] {
  const [v, set] = useState(initial)
  return [v, useCallback(() => set(true), []), useCallback(() => set(false), [])]
}

const ctx = createContext<null>(null)
export const KitContext = ctx
export function useKit() {
  return useContext(ctx)
}

export function Section({ title, actions, children }: { title: string; actions?: ReactNode; children: ReactNode }) {
  return (
    <section className="card" aria-label={title}>
      <div className="row between">
        <h2>{title}</h2>
        {actions}
      </div>
      {children}
    </section>
  )
}
