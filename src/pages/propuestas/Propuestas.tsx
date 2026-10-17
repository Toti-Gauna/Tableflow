import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import './fonts'
import './propuestas.css'
import { BizArt } from './art'
import { BIZ_LABEL, BIZ_ORDER, CONCEPTS, conceptById, conceptsOf, contrast, contrastPairs, paletteFor, type Concept } from './concepts'
import { CONTENT } from './content'

// P5-L2 · Estudio de propuestas visuales: quince conceptos comparables sobre las mismas piezas
// (pantalla pública, móvil, operación, paleta, tipografía, arte y motion). Ruta aislada: no altera la app.

type Mode = 'light' | 'dark'
const FRAME_W = 1120

function vars(c: Concept, mode: Mode): CSSProperties {
  const p = paletteFor(c, mode)
  return {
    '--bg': p.bg, '--surface': p.surface, '--ink': p.ink, '--muted': p.muted, '--line': p.line, '--accent': p.accent, '--on-accent': p.onAccent, '--accent2': p.accent2,
    '--display': c.fonts.display, '--text': c.fonts.text, '--dw': c.fonts.displayWeight, '--dst': c.fonts.displayItalic ? 'italic' : 'normal',
    '--dtt': c.fonts.upper ? 'uppercase' : 'none', '--dtr': c.fonts.tracking ?? 'normal', '--r': `${c.radius}px`, '--rb': `${Math.min(c.radius, 28)}px`, '--bw': `${c.border}px`,
    '--ease': c.motion.ease, '--ms': `${c.motion.ms}ms`, '--stagger': `${c.motion.stagger}ms`,
  } as CSSProperties
}
const frameClass = (c: Concept) => `pz-frame pz-a-${c.archetype} pz-d-${c.deco} pz-sh-${c.shadow} pz-st-${c.art} pz-b-${c.biz}`

/** Dibuja un lienzo de ancho fijo escalado al contenedor (comparación justa entre conceptos). */
function Scaled({ width = FRAME_W, children, max = 1 }: { width?: number; children: ReactNode; max?: number }) {
  const outer = useRef<HTMLDivElement>(null)
  const inner = useRef<HTMLDivElement>(null)
  const [box, setBox] = useState({ s: 1, h: 0 })
  useLayoutEffect(() => {
    const o = outer.current
    const i = inner.current
    if (!o || !i) return
    const measure = () => {
      const s = Math.min(max, o.clientWidth / width)
      setBox({ s, h: i.offsetHeight * s })
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(o)
    ro.observe(i)
    return () => ro.disconnect()
  }, [width, max])
  return (
    <div ref={outer} className="pz-scaled" style={{ height: box.h || undefined }}>
      <div ref={inner} style={{ width, transform: `scale(${box.s})`, transformOrigin: '0 0' }}>{children}</div>
    </div>
  )
}

function Deco({ c }: { c: Concept }) {
  if (c.deco === 'blobs') {
    return (
      <svg className="pz-blobs" viewBox="0 0 400 300" aria-hidden="true">
        <path d="M70 60c50-40 140-30 190 10s90 120 40 170-170 50-220 10S20 100 70 60z" fill="var(--accent2)" opacity=".18" />
        <path d="M250 30c40-10 100 20 110 70s-30 90-80 80-70-60-60-100 0-45 30-50z" fill="var(--accent)" opacity=".14" />
      </svg>
    )
  }
  if (c.deco === 'staff') {
    return (
      <svg className="pz-staff" viewBox="0 0 400 60" preserveAspectRatio="none" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((i) => <line key={i} x1="0" x2="400" y1={10 + i * 10} y2={10 + i * 10} stroke="var(--line)" strokeWidth="1.2" />)}
      </svg>
    )
  }
  return null
}

/** fold: solo lo que entra en la primera pantalla del teléfono (sin contenido recortado fuera de vista). */
export function PublicScreen({ c, mode, play = 0, fold = false }: { c: Concept; mode: Mode; play?: number; fold?: boolean }) {
  const t = CONTENT[c.biz]
  const p = paletteFor(c, mode)
  return (
    <div className={frameClass(c)} style={vars(c, mode)} data-mode={mode}>
      <div className="pz-cq">
        <div className="pz-screen">
          <header className="pz-h">
            <div className="pz-brand"><span className="pz-logo">{t.name}</span><small>{t.tagline}</small></div>
            <nav>{t.nav.map((n, i) => <span key={n} data-on={i === 0 || undefined}>{n}</span>)}</nav>
            <span className="pz-demo">DEMO</span>
            <span className="pz-cart">Pedido · 2</span>
          </header>
          <section className="pz-hero">
            <div className="pz-copy">
              <p className="pz-eyebrow">{t.hero.eyebrow}</p>
              <p className="pz-title">{t.hero.title}</p>
              <p className="pz-sub">{t.hero.sub}</p>
              <div className="pz-ctas"><span className="pz-btn">{t.hero.cta}</span><span className="pz-btn ghost">{t.hero.cta2}</span></div>
            </div>
            <div className="pz-visual">
              <Deco c={c} />
              <BizArt biz={c.biz} style={c.art} palette={p} size={420} play={play} />
            </div>
          </section>
          {!fold && t.agenda && (
            <section className="pz-agenda">
              {c.deco === 'staff' && <Deco c={c} />}
              {t.agenda.map((a) => <div key={a.day} className="pz-night"><span className="pz-day">{a.day}</span><span className="pz-ntitle">{a.title}</span><span className="pz-ntime">{a.time}</span></div>)}
            </section>
          )}
          {!fold && <section className="pz-body">
            <div className="pz-menu">
              <p className="pz-h3">{t.section}</p>
              <ul>
                {t.items.map((it, i) => (
                  <li key={it.name} data-state={it.state}>
                    {(c.archetype === 'board' || c.archetype === 'sculpt') && <span className="pz-mark">{c.archetype === 'board' ? String(i + 1).padStart(2, '0') : null}</span>}
                    <span className="pz-iname">{it.name}</span>
                    <span className="pz-lead" />
                    <span className="pz-price">{it.price}</span>
                    <span className="pz-idesc">{it.desc}{it.state === 'pocas' && <em> · quedan pocas</em>}{it.state === 'agotado' && <em> · agotado hoy</em>}</span>
                    {it.tag && <span className="pz-tag">{it.tag}</span>}
                  </li>
                ))}
              </ul>
            </div>
            <aside className="pz-config">
              <p className="pz-h3">{t.config.title}</p>
              {t.config.groups.map((g) => (
                <div key={g.label} className="pz-group">
                  <span className="pz-glabel">{g.label}</span>
                  <div className="pz-chips">{g.options.map((o) => <span key={o.label} className="pz-chip" data-on={o.on || undefined} data-off={o.off || undefined}>{o.label}{o.extra && <small>{o.extra}</small>}</span>)}</div>
                </div>
              ))}
              <div className="pz-total">{t.config.total.startsWith('$') ? <><span>Total</span><strong>{t.config.total}</strong></> : <span className="pz-total-note">{t.config.total}</span>}</div>
              <span className="pz-btn block">{t.config.add}</span>
            </aside>
          </section>}
        </div>
      </div>
    </div>
  )
}

function MobileScreen({ c, mode }: { c: Concept; mode: Mode }) {
  const t = CONTENT[c.biz]
  return (
    <div className="pz-phone">
      <div className="pz-phone-in">
        <PublicScreen c={c} mode={mode} fold />
        <div className={`${frameClass(c)} pz-tabs-wrap`} style={vars(c, mode)}>
          <span className="pz-fab">{t.config.total.startsWith('$') ? `Pedido · ${t.config.total}` : `Mi reserva · ${t.agenda?.[0]?.day ?? ''}`}</span>
          <nav className="pz-tabs">{t.tabs.map((x, i) => <span key={x} data-on={i === 0 || undefined}>{x}</span>)}</nav>
        </div>
      </div>
    </div>
  )
}

function OpsSample({ c, mode }: { c: Concept; mode: Mode }) {
  const t = CONTENT[c.biz]
  return (
    <div className={`${frameClass(c)} pz-ops`} style={vars(c, mode)} data-mode={mode}>
      <div className="pz-ticket">
        <div className="pz-tk-head"><span className="pz-tk-code">{t.ticket.code}</span><span className="pz-tk-status">{t.ticket.status}</span></div>
        <p className="pz-tk-title">{t.ticket.title} · {t.ticket.station}</p>
        <ul>{t.ticket.lines.map((l) => <li key={l}>{l}</li>)}</ul>
        <p className="pz-tk-note">{t.ticket.note}</p>
        <div className="pz-tk-actions"><span className="pz-btn">Marcar listo</span><span className="pz-btn ghost">Incidencia</span></div>
      </div>
      <table className="pz-table">
        <thead><tr><th>Folio</th><th>Detalle</th><th>Estado</th><th>Hora</th></tr></thead>
        <tbody>{t.rows.map((r) => <tr key={r[0] + r[1]}>{r.map((x, i) => <td key={i}>{i === 2 ? <span className="pz-badge">{x}</span> : x}</td>)}</tr>)}</tbody>
      </table>
    </div>
  )
}

function Swatches({ c, mode }: { c: Concept; mode: Mode }) {
  const p = paletteFor(c, mode)
  const keys: [keyof typeof p, string][] = [['bg', 'Fondo'], ['surface', 'Superficie'], ['ink', 'Texto'], ['muted', 'Secundario'], ['line', 'Línea'], ['accent', 'Acento'], ['accent2', 'Acento 2']]
  return (
    <div className="pz-pal">
      <p className="pz-pal-title">{mode === 'light' ? 'Claro' : 'Oscuro'}{c.primaryMode === mode ? ' · modo principal' : ''}</p>
      <div className="pz-sw-row">{keys.map(([k, l]) => <span key={k} className="pz-sw"><i style={{ background: p[k] }} /><b>{l}</b><code>{p[k]}</code></span>)}</div>
      <table className="pz-ratio">
        <tbody>
          {contrastPairs(p).map((x) => {
            const r = contrast(x.fg, x.bg)
            return <tr key={x.label}><td>{x.label}</td><td><span className="pz-ratio-chip" style={{ color: x.fg, background: x.bg }}>Aa</span></td><td className="num">{r.toFixed(2)}:1</td><td>{r >= x.min ? `cumple ${x.min}:1` : `no cumple ${x.min}:1`}</td></tr>
          })}
        </tbody>
      </table>
    </div>
  )
}

function TypeSpecimen({ c, mode }: { c: Concept; mode: Mode }) {
  const t = CONTENT[c.biz]
  return (
    <div className={`${frameClass(c)} pz-type`} style={vars(c, mode)} data-mode={mode}>
      <p className="pz-aa">Aa</p>
      <div>
        <p className="pz-title sm">{t.hero.title}</p>
        <p className="pz-sub">{t.hero.sub}</p>
        <p className="pz-nums">{(t.items.map((i) => i.price).filter((x) => x.startsWith('$')).slice(0, 3).length ? t.items.map((i) => i.price).filter((x) => x.startsWith('$')).slice(0, 3) : ['$ 6.800', '$ 12.500', '$ 22.000']).map((x) => <span key={x}>{x}</span>)}</p>
        <p className="pz-fontnames">Display: {c.fonts.display.split(',')[0].replace(/'/g, '')} · Texto: {c.fonts.text.split(',')[0].replace(/'/g, '')}</p>
      </div>
    </div>
  )
}

function MotionSample({ c, mode }: { c: Concept; mode: Mode }) {
  const t = CONTENT[c.biz]
  const [play, setPlay] = useState(0)
  const [reduced, setReduced] = useState(false)
  const steps = c.biz === 'rapida' ? 7 : 5
  return (
    <div className={`${frameClass(c)} pz-motion`} style={{ ...vars(c, mode), ['--steps' as string]: steps }} data-mode={mode} data-reduced={reduced || undefined}>
      <div className="pz-motion-stage">
        <BizArt biz={c.biz} style={c.art} palette={paletteFor(c, mode)} size={320} play={play} label={`Boceto de la confirmación de ${t.name}`} />
        <div className="pz-motion-ticket" key={play} data-play={play > 0 || undefined}>
          <span className="pz-tk-code">{t.ticket.code}</span>
          <span>{t.ticket.status}</span>
          <small>{t.ticket.note}</small>
        </div>
      </div>
      <div className="pz-motion-ctrl">
        <button type="button" className="pz-ui-btn" onClick={() => setPlay((n) => n + 1)}>Reproducir confirmación</button>
        <label className="pz-ui-check"><input type="checkbox" checked={reduced} onChange={(e) => setReduced(e.target.checked)} /> Movimiento reducido</label>
        <span className="pz-ui-muted">{c.motion.label} · {c.motion.ms} ms por pieza, {c.motion.stagger} ms entre piezas. Boceto: la animación real (L8) se dispara con el evento del pedido aceptado.</span>
      </div>
    </div>
  )
}

function StudioChrome({ children, title }: { children: ReactNode; title: string }) {
  useEffect(() => {
    const prev = document.title
    document.title = `${title} · Propuestas visuales · TableFlow`
    return () => { document.title = prev }
  }, [title])
  return (
    <div className="pz-studio">
      <header className="pz-topbar">
        <span className="pz-demo-ui">DEMO</span>
        <Link to="/propuestas" className="pz-top-title">TableFlow · Propuestas visuales (L2)</Link>
        <span className="pz-ui-muted">Uso interno para elegir dirección. No es la app final.</span>
        <Link to="/" className="pz-top-back">Volver a la demo</Link>
      </header>
      <main id="contenido" className="pz-main">{children}</main>
    </div>
  )
}

export function PropuestasIndex() {
  return (
    <StudioChrome title="Índice">
      <h1 className="pz-h1">Quince direcciones, tres por negocio</h1>
      <p className="pz-lead-p">Cada concepto se muestra con el mismo conjunto de piezas: pantalla pública, móvil, operación del comercio, paleta claro/oscuro con contraste medido, tipografía, arte y un boceto de la animación de confirmación. Café y restaurante usan la carta real del fixture; heladería, bar y comida rápida usan contenido provisional ficticio que L5 convierte en fixtures. Elegí una por negocio; se pueden combinar decisiones o pedir cambios.</p>
      {BIZ_ORDER.map((b) => (
        <section key={b} className="pz-bizrow" aria-labelledby={`h-${b}`}>
          <h2 id={`h-${b}`} className="pz-h2">{BIZ_LABEL[b].rubro} <span className="pz-ui-muted">· {BIZ_LABEL[b].name}{BIZ_LABEL[b].provisional ? ' · contenido provisional' : ' · carta del fixture'}</span></h2>
          <div className="pz-cards">
            {conceptsOf(b).map((c) => (
              <Link key={c.id} to={`/propuestas/${c.id}`} className="pz-card" data-testid={`pz-card-${c.id}`}>
                <div className="pz-card-prev" aria-hidden="true"><Scaled><PublicScreen c={c} mode={c.primaryMode} /></Scaled></div>
                <div className="pz-card-body">
                  <p className="pz-card-title">{c.n}. {c.name}{c.recommended && <span className="pz-rec">Recomendada</span>}</p>
                  <p className="pz-card-thesis">{c.thesis}</p>
                  <p className="pz-ui-muted small">{c.fonts.display.split(',')[0].replace(/'/g, '')} + {c.fonts.text.split(',')[0].replace(/'/g, '')}</p>
                  <span className="pz-mini-pal" aria-hidden="true">{(['bg', 'ink', 'accent', 'accent2'] as const).map((k) => <i key={k} style={{ background: paletteFor(c, c.primaryMode)[k] }} />)}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </StudioChrome>
  )
}

export function PropuestaStudio() {
  const { id } = useParams()
  const [params, setParams] = useSearchParams()
  const c = id ? conceptById(id) : undefined
  if (!c) {
    return (
      <StudioChrome title="No encontrada">
        <h1 className="pz-h1">No encontramos esa propuesta</h1>
        <p><Link to="/propuestas">Volver al índice de propuestas</Link></p>
      </StudioChrome>
    )
  }
  const mode: Mode = params.get('modo') === 'oscuro' ? 'dark' : params.get('modo') === 'claro' ? 'light' : c.primaryMode
  const sibs = conceptsOf(c.biz)
  const idx = CONCEPTS.indexOf(c)
  const prev = CONCEPTS[(idx + CONCEPTS.length - 1) % CONCEPTS.length]
  const next = CONCEPTS[(idx + 1) % CONCEPTS.length]
  return (
    <StudioChrome title={c.name}>
      <div className="pz-studio-head">
        <div>
          <p className="pz-ui-muted">{BIZ_LABEL[c.biz].rubro} · {BIZ_LABEL[c.biz].name} · concepto {c.n} de 3{BIZ_LABEL[c.biz].provisional ? ' · contenido provisional' : ''}</p>
          <h1 className="pz-h1">{c.name}{c.recommended && <span className="pz-rec">Recomendada</span>}</h1>
          <p className="pz-lead-p">{c.thesis}</p>
        </div>
        <div className="pz-studio-ctrl">
          <div role="radiogroup" aria-label="Modo de color" className="pz-seg">
            {(['light', 'dark'] as const).map((m) => (
              <button key={m} type="button" role="radio" aria-checked={mode === m} onClick={() => setParams({ modo: m === 'dark' ? 'oscuro' : 'claro' }, { replace: true })}>{m === 'light' ? 'Claro' : 'Oscuro'}</button>
            ))}
          </div>
          <nav aria-label="Otras propuestas del negocio" className="pz-sibs">{sibs.map((s) => <Link key={s.id} to={`/propuestas/${s.id}`} aria-current={s.id === c.id ? 'page' : undefined}>{s.n}. {s.name}</Link>)}</nav>
        </div>
      </div>

      <section aria-labelledby="s-pub" className="pz-sec">
        <h2 id="s-pub" className="pz-h2">Pantalla pública · escritorio</h2>
        <figure className="pz-fig" aria-label={`Muestra visual de la pantalla pública de ${BIZ_LABEL[c.biz].name} en ${c.name}`}>
          <div aria-hidden="true"><Scaled max={1.25}><PublicScreen c={c} mode={mode} /></Scaled></div>
        </figure>
      </section>

      <div className="pz-two">
        <section aria-labelledby="s-mob" className="pz-sec">
          <h2 id="s-mob" className="pz-h2">Móvil · 360 px</h2>
          <div aria-hidden="true"><MobileScreen c={c} mode={mode} /></div>
        </section>
        <section aria-labelledby="s-ops" className="pz-sec">
          <h2 id="s-ops" className="pz-h2">Operación del comercio</h2>
          <div aria-hidden="true"><Scaled width={720} max={1.25}><OpsSample c={c} mode={mode} /></Scaled></div>
          <h2 className="pz-h2 sp">Tipografía</h2>
          <div aria-hidden="true"><Scaled width={720} max={1.25}><TypeSpecimen c={c} mode={mode} /></Scaled></div>
        </section>
      </div>

      <section aria-labelledby="s-mo" className="pz-sec">
        <h2 id="s-mo" className="pz-h2">Arte y boceto de la confirmación</h2>
        <MotionSample c={c} mode={mode} />
      </section>

      <section aria-labelledby="s-pal" className="pz-sec">
        <h2 id="s-pal" className="pz-h2">Paleta y contraste medido</h2>
        <div className="pz-pals"><Swatches c={c} mode="light" /><Swatches c={c} mode="dark" /></div>
      </section>

      <section aria-labelledby="s-dec" className="pz-sec">
        <h2 id="s-dec" className="pz-h2">Decisiones y evaluación</h2>
        <div className="pz-eval">
          <ul className="pz-dec">{c.decisions.map((d) => <li key={d}>{d}</li>)}</ul>
          <dl className="pz-dl">
            <div><dt>Pertinencia</dt><dd>{c.pertinence}</dd></div>
            <div><dt>Legibilidad</dt><dd>{c.legibility}</dd></div>
            <div><dt>Viabilidad</dt><dd>{c.viability}</dd></div>
            <div><dt>Riesgo</dt><dd>{c.risk}</dd></div>
          </dl>
        </div>
      </section>

      <nav className="pz-pager" aria-label="Recorrer propuestas">
        <Link to={`/propuestas/${prev.id}`}>← {BIZ_LABEL[prev.biz].rubro}: {prev.name}</Link>
        <Link to={`/propuestas/${next.id}`}>{BIZ_LABEL[next.biz].rubro}: {next.name} →</Link>
      </nav>
    </StudioChrome>
  )
}
