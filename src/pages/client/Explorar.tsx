import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useBiz } from '../../ui/hooks'
import { PageHead } from '../../ui/Shell'
import { act, Badge, Callout, ConfirmDialog } from '../../ui/kit'
import { Glyph } from '../../ui/glyphs'
import { BADGE_LABEL, PassportSteps, SavedPick } from '../../ui/passport'
import { PASSPORT_CARDS, PASSPORT_PICKS } from '../../domain/content'
import { getPassport } from '../../domain/cmd-engage'

const AXIS_ICON: Record<string, string> = { Método: 'dripper', Origen: 'bean', Perfil: 'sliders', Ingrediente: 'leaf', Preparación: 'pasta', 'Historia (ficticia)': 'book' }

export function Explorar() {
  const { state, biz, locationId } = useBiz()
  const cards = PASSPORT_CARDS.filter((c) => c.businessId === biz.id)
  const pass = getPassport(state, biz.id, state.session.customerByBusiness[biz.id] ?? null)
  const done = pass ? Object.values(pass.cards).filter((c) => c.done).length : 0
  const [feedback, setFeedback] = useState<Record<string, { correct: boolean; text: string }>>({})
  const [resetOpen, setResetOpen] = useState(false)
  const picks = PASSPORT_PICKS[biz.id]
  const label = biz.kind === 'cafe' ? 'método, origen y perfil' : 'ingrediente, preparación e historia'
  const badgeName = biz.kind === 'cafe' ? 'catador curioso' : 'comensal curioso'
  return (
    <main>
      <PageHead title="Explorar sabores" eyebrow="Pasaporte de sabores" sub={`Tres tarjetas de 20–30 segundos · ${label}`} />
      <PassportSteps pass={pass} />
      <p className="pp-status" aria-live="polite">
        <strong data-testid="passport-progress">{done} de {cards.length}</strong> tarjetas completadas · <Badge tone={pass?.badge === 'guardada' ? 'ok' : pass?.badge === 'disponible' ? 'info' : 'neutral'} label={BADGE_LABEL[pass?.badge ?? 'sin-empezar']} />
      </p>
      <Callout>
        Cada tarjeta trae una pregunta opcional: podés equivocarte y reintentar sin penalización, o seguir sin responder. <strong>El logro no se compra ni da descuentos</strong>: sirve para descubrir y recordar lo que te gusta. También podés pedir sin jugar.
      </Callout>
      {biz.passportPaused && <Callout tone="warn" role="alert">La mecánica de pasaporte está pausada por el encargado. Podés leer las tarjetas pero no suman; tu progreso guardado se conserva.</Callout>}
      <div className="pcards">
        {cards.map((c, idx) => {
          const prog = pass?.cards[c.id]
          const fb = feedback[c.id]
          return (
            <article key={c.id} className="pcard fx-scene" data-done={!!prog?.done} data-testid={`pcard-${c.id}`} aria-labelledby={`pc-${c.id}`}>
              <p className="axis"><Glyph name={AXIS_ICON[c.axis] ?? 'star'} size={16} /> {String(idx + 1).padStart(2, '0')} · {c.axis}</p>
              <h2 id={`pc-${c.id}`}>{c.title}</h2>
              <p>{c.body}</p>
              {prog?.done ? (
                <p className="ok-text done-note"><Glyph name="check" size={16} /> Tarjeta completada. {c.explanation}</p>
              ) : (
                <fieldset className="quiz">
                  <legend>{c.question} <span className="muted">(opcional)</span></legend>
                  {c.options.map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      className="btn secondary answer"
                      onClick={() => {
                        const r = act({ type: 'pass/answer', businessId: biz.id, cardId: c.id, optionId: o.id })
                        if (r.ok) setFeedback((f) => ({ ...f, [c.id]: { correct: (r.data as { correct: boolean }).correct, text: (r.data as { explanation: string }).explanation } }))
                        else setFeedback((f) => ({ ...f, [c.id]: { correct: false, text: r.message } }))
                      }}
                    >
                      {o.text}
                    </button>
                  ))}
                  {fb && (
                    <p className={fb.correct ? 'ok-text' : 'retry-text'} role="status" data-testid={`fb-${c.id}`}>
                      {fb.correct ? '✓ ¡Correcto! ' : 'Casi. Sin penalización, podés reintentar. '}
                      {fb.text}
                    </p>
                  )}
                  {prog && prog.attempts > 0 && !fb && <p className="small muted">Intento {prog.attempts} · sin penalización</p>}
                  <button className="btn ghost small" type="button" onClick={() => act({ type: 'pass/read', businessId: biz.id, cardId: c.id }, 'Tarjeta marcada como leída')}>Ya la leí, seguir sin responder</button>
                </fieldset>
              )}
            </article>
          )
        })}
      </div>
      {pass && (pass.badge === 'disponible' || pass.badge === 'guardada') && (
        <section className="medal fx-scene" aria-labelledby="badge">
          <span className="seal" aria-hidden="true"><Glyph name="stamp" size={44} /></span>
          <div>
            <p className="eyebrow">Insignia sin compra ni premio real</p>
            <h2 id="badge">Insignia de {badgeName}</h2>
            <p>Completaste las tres tarjetas. Guardá una selección para encontrarla marcada en la carta y pedirla con las opciones vigentes.</p>
            <div className="row" role="group" aria-label="Tu selección">
              {picks.map((p) => (
                <button key={p.id} type="button" className="btn secondary" aria-pressed={pass.savedPreference === p.id} onClick={() => act({ type: 'pass/save', businessId: biz.id, itemId: p.id }, `Guardaste ${p.label}`)}>
                  {pass.savedPreference === p.id && <Glyph name="star" size={16} />}
                  {p.label}
                </button>
              ))}
            </div>
            {pass.badge === 'guardada' && <p className="ok-text" role="status" style={{ marginTop: 10 }}>Selección guardada. Aparece marcada en la carta.</p>}
          </div>
        </section>
      )}
      <SavedPick state={state} biz={biz.id} locationId={locationId} />
      <div className="row" style={{ marginTop: 20 }}>
        <Link className="btn" to={`/${biz.id}/pasaporte`}>Ver mi pasaporte</Link>
        <button className="btn ghost" type="button" onClick={() => setResetOpen(true)} disabled={!pass || pass.badge === 'sin-empezar' || pass.badge === 'reiniciada'} data-testid="pass-reset">Reiniciar mis tarjetas</button>
      </div>
      <ConfirmDialog
        open={resetOpen}
        title="Reiniciar el pasaporte de sabores"
        confirmLabel="Reiniciar tarjetas"
        onCancel={() => setResetOpen(false)}
        onConfirm={() => { act({ type: 'pass/reset', businessId: biz.id }, 'Pasaporte reiniciado'); setFeedback({}); setResetOpen(false) }}
        body={<p>Se borran tus respuestas y la selección guardada de este perfil. Las métricas locales y los sellos de visita no cambian. Podés volver a empezar cuando quieras.</p>}
      />
    </main>
  )
}
