import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { checkSavedPick } from '../domain/cmd-engage'
import { fmtARS } from '../domain/money'
import type { AppState, BusinessId, Passport } from '../domain/types'
import { Callout } from './kit'
import { Glyph } from './glyphs'

export const BADGE_LABEL: Record<Passport['badge'], string> = {
  'sin-empezar': 'Sin empezar',
  'en-curso': 'En curso',
  disponible: 'Insignia disponible',
  guardada: 'Selección guardada',
  reiniciada: 'Reiniciado',
}

/** Sin empezar → 1/3 → 2/3 → 3/3 → insignia → selección guardada; los pasos se leen como lista con estado. */
export function PassportSteps({ pass }: { pass?: Passport }) {
  const done = pass ? Object.values(pass.cards).filter((c) => c.done).length : 0
  const badge = pass?.badge ?? 'sin-empezar'
  const steps = [
    { label: 'Tarjeta 1', on: done >= 1 },
    { label: 'Tarjeta 2', on: done >= 2 },
    { label: 'Tarjeta 3', on: done >= 3 },
    { label: 'Insignia', on: badge === 'disponible' || badge === 'guardada' },
    { label: 'Selección guardada', on: badge === 'guardada' },
  ]
  const current = steps.findIndex((s) => !s.on)
  return (
    <ol className="pp-steps" aria-label="Progreso del pasaporte">
      {steps.map((s, i) => (
        <li key={s.label} data-on={s.on} aria-current={i === current ? 'step' : undefined}>
          <span className="sr-only">{s.on ? 'Hecho: ' : i === current ? 'Siguiente: ' : 'Pendiente: '}</span>
          {s.label}
        </li>
      ))}
    </ol>
  )
}

/** "Pedir mi selección": revalida contra la carta actual y abre el configurador con las opciones vigentes. */
export function SavedPick({ state, biz, locationId, compact }: { state: AppState; biz: BusinessId; locationId: string; compact?: boolean }) {
  const nav = useNavigate()
  const [problem, setProblem] = useState<Extract<ReturnType<typeof checkSavedPick>, { ok: false }> | null>(null)
  const pass = state.passports.find((p) => p.businessId === biz && p.customerId === (state.session.customerByBusiness[biz] ?? null))
  const item = pass?.savedPreference ? state.menuItems.find((m) => m.id === pass.savedPreference) : undefined
  if (!pass || pass.badge !== 'guardada' || !item) return null
  const use = () => {
    const r = checkSavedPick(state, biz, locationId)
    if (r.ok) {
      setProblem(null)
      nav(`/${biz}/carta/${r.itemId}?origen=pasaporte`)
    } else setProblem(r)
  }
  return (
    <div className={compact ? 'saved-pick' : 'saved-pick big'} data-testid="saved-pick">
      <span className="row" style={{ gap: 10 }}>
        <Glyph name="star" size={20} />
        <span>
          <span className="eyebrow" style={{ display: 'block', margin: 0 }}>Tu selección del pasaporte</span>
          <strong>{item.name}</strong> <span className="muted small">· desde {fmtARS(item.priceCents)} (precio actual)</span>
        </span>
      </span>
      <button type="button" className="btn small" onClick={use} data-testid="use-saved">Pedir mi selección</button>
      {problem && (
        <div style={{ flexBasis: '100%' }}>
          <Callout tone="warn" role="alert">
            {problem.text} No se agregó nada al pedido.{' '}
            {problem.alternatives.length > 0 && (
              <>
                Alternativas disponibles:{' '}
                {problem.alternatives.map((a, i) => (
                  <span key={a.id}>
                    {i > 0 && ', '}
                    <Link to={`/${biz}/carta/${a.id}`}>{a.name}</Link>
                  </span>
                ))}
                .
              </>
            )}
          </Callout>
        </div>
      )}
    </div>
  )
}
