import { Badge } from './kit'
import { STATUS_LABEL, type CodeCheck, type CodeStatus } from '../domain/qr'

const TONE: Record<CodeStatus, 'ok' | 'warn' | 'err' | 'neutral'> = {
  valido: 'ok',
  revertido: 'ok',
  usado: 'warn',
  duplicado: 'warn',
  'no-elegible': 'warn',
  'cupo-agotado': 'warn',
  desconocido: 'err',
  vencido: 'err',
  cancelado: 'err',
  'negocio-incorrecto': 'err',
  'sede-incorrecta': 'err',
}

/** Lo que dice el store de un código: estado, por qué y, si corresponde, la acción. Nunca importes ni personas ajenas. */
export function CodeResultCard({ check, action, busy }: { check: CodeCheck; action?: { label: string; onClick: () => void; disabledReason?: string }; busy?: boolean }) {
  return (
    <section className="code-result" data-status={check.status} data-testid="code-result" aria-live="polite" aria-label={`Resultado: ${check.title}`}>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h3>{check.title}</h3>
        <Badge tone={TONE[check.status]} label={STATUS_LABEL[check.status]} />
      </div>
      <p style={{ margin: 0 }} data-testid="code-detail">{check.detail}</p>
      {check.facts.length > 0 && (
        <dl className="code-facts">
          {check.facts.map((f) => (
            <div key={f.label}><dt>{f.label}</dt><dd>{f.value}</dd></div>
          ))}
        </dl>
      )}
      {action && (
        <div>
          <button className="btn" type="button" onClick={action.onClick} disabled={busy || !!action.disabledReason} data-testid="code-action">{action.label}</button>
          {action.disabledReason && <p className="small muted" style={{ margin: '6px 0 0' }}>{action.disabledReason}</p>}
        </div>
      )}
    </section>
  )
}
