import { useEffect, useState, type ComponentType, type ReactNode } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import './fonts'
import './studio.css'
import { IDENTITIES, contrast, contrastPairs, identityOf, paletteOf, type Identity, type Mode, type PzBiz } from './identities'
import { Phone, Scaled, type PieceProps, type SignatureProps } from './shared'
import * as cafe from './cafe'
import * as hela from './helado'
import * as resto from './bodegon'
import * as bar from './bar'
import * as rapida from './rapida'

// P5-L2b · Estudio de identidades: una dirección propia por negocio, cada una con su composición,
// su arte y su animación. El estudio es neutro; cada lienzo es la identidad completa.

interface Pieces {
  Store: ComponentType<PieceProps>
  StoreMobile: ComponentType<PieceProps>
  Ops: ComponentType<PieceProps>
  Signature: ComponentType<SignatureProps>
  Gallery: ComponentType<PieceProps>
}
const PIECES: Record<PzBiz, Pieces> = { cafe, hela, resto, bar, rapida }

function StudioChrome({ title, children }: { title: string; children: ReactNode }) {
  useEffect(() => {
    const prev = document.title
    document.title = `${title} · Identidades · TableFlow`
    return () => { document.title = prev }
  }, [title])
  return (
    <div className="pzx-studio">
      <header className="pzx-top">
        <span className="pzx-demo">DEMO</span>
        <Link to="/propuestas" className="pzx-top-t">TableFlow · Identidades por negocio (L2)</Link>
        <span className="pzx-muted">Uso interno para elegir dirección. No es la app final.</span>
        <Link to="/" className="pzx-back">Volver a la demo</Link>
      </header>
      <main id="contenido" className="pzx-main">{children}</main>
    </div>
  )
}

export function PropuestasIndex() {
  return (
    <StudioChrome title="Índice">
      <h1 className="pzx-h1">Cinco negocios, cinco identidades</h1>
      <p className="pzx-lead">Cada negocio tiene su propia composición, su arte, su tipografía y su animación de confirmación; no comparten una plantilla. Ritual Café y Mesa Clara usan la carta del fixture (con algunos clásicos provisionales); Copo, Taberna Compás y Brasa Rápida, contenido ficticio provisional.</p>
      <div className="pzx-grid">
        {IDENTITIES.map((i) => {
          const P = PIECES[i.biz]
          return (
            <Link key={i.biz} to={`/propuestas/${i.biz}`} className="pzx-card" data-testid={`pzx-card-${i.biz}`}>
              <div className="pzx-card-prev" aria-hidden="true"><Scaled><P.Store mode={i.primaryMode} /></Scaled></div>
              <div className="pzx-card-body">
                <p className="pzx-card-k">{i.rubro} · {i.name}</p>
                <p className="pzx-card-t">{i.concept}</p>
                <p className="pzx-card-d">{i.differs}</p>
              </div>
            </Link>
          )
        })}
      </div>
    </StudioChrome>
  )
}

function Ratios({ i, mode }: { i: Identity; mode: Mode }) {
  const p = paletteOf(i, mode)
  return (
    <div className="pzx-pal">
      <p className="pzx-pal-t">{i.modeNames[mode]}{i.primaryMode === mode ? ' · modo principal' : ''}</p>
      <div className="pzx-sw">
        {(['bg', 'surface', 'ink', 'muted', 'accent'] as const).map((k) => <span key={k}><i style={{ background: p[k] }} /><code>{p[k]}</code></span>)}
        {Object.entries(p.deco).slice(0, 5).map(([k, v]) => <span key={k}><i style={{ background: v }} /><code>{k}</code></span>)}
      </div>
      <table className="pzx-ratio"><tbody>
        {contrastPairs(p).map((x) => {
          const r = contrast(x.fg, x.bg)
          return <tr key={x.label}><td>{x.label}</td><td><span className="pzx-chip" style={{ color: x.fg, background: x.bg }}>Aa</span></td><td className="num">{r.toFixed(2)}:1</td><td>{r >= 4.5 ? 'cumple 4,5:1' : 'no cumple'}</td></tr>
        })}
      </tbody></table>
    </div>
  )
}

export function PropuestaStudio() {
  const { id } = useParams()
  const [params, setParams] = useSearchParams()
  const [play, setPlay] = useState(0)
  const [reduced, setReduced] = useState(false)
  const i = id ? identityOf(id) : undefined
  if (!i) {
    return (
      <StudioChrome title="No encontrada">
        <h1 className="pzx-h1">No encontramos esa identidad</h1>
        <p><Link to="/propuestas">Volver al índice</Link></p>
      </StudioChrome>
    )
  }
  const P = PIECES[i.biz]
  const mode: Mode = params.get('modo') === 'oscuro' ? 'dark' : params.get('modo') === 'claro' ? 'light' : i.primaryMode
  const idx = IDENTITIES.indexOf(i)
  const next = IDENTITIES[(idx + 1) % IDENTITIES.length]
  const prev = IDENTITIES[(idx + IDENTITIES.length - 1) % IDENTITIES.length]
  return (
    <StudioChrome title={i.name}>
      <div className="pzx-head">
        <div>
          <p className="pzx-muted">{i.rubro} · {i.name}{i.provisional ? ' · contenido provisional' : ''}</p>
          <h1 className="pzx-h1">{i.concept}</h1>
          <p className="pzx-lead">{i.thesis}</p>
        </div>
        <div role="radiogroup" aria-label="Modo de color" className="pzx-seg">
          {(['light', 'dark'] as const).map((m) => <button key={m} type="button" role="radio" aria-checked={mode === m} onClick={() => setParams({ modo: m === 'dark' ? 'oscuro' : 'claro' }, { replace: true })}>{i.modeNames[m]}</button>)}
        </div>
      </div>

      <section className="pzx-sec" aria-labelledby="s1">
        <h2 id="s1" className="pzx-h2">Pantalla pública · escritorio</h2>
        <figure className="pzx-fig" aria-label={`Muestra visual de ${i.name}: ${i.concept}`}><div aria-hidden="true"><Scaled max={1.1}><P.Store mode={mode} /></Scaled></div></figure>
      </section>

      <div className="pzx-two">
        <section className="pzx-sec" aria-labelledby="s2">
          <h2 id="s2" className="pzx-h2">Móvil · composición propia</h2>
          <div aria-hidden="true" className="pzx-phone-wrap"><Phone><P.StoreMobile mode={mode} /></Phone></div>
        </section>
        <section className="pzx-sec" aria-labelledby="s3">
          <h2 id="s3" className="pzx-h2">Operación del comercio</h2>
          <div aria-hidden="true" className="pzx-frame"><Scaled width={760} max={1.2}><P.Ops mode={mode} /></Scaled></div>
          <h2 className="pzx-h2 sp">Arte propio</h2>
          <div aria-hidden="true" className="pzx-frame"><Scaled width={760} max={1.2}><P.Gallery mode={mode} /></Scaled></div>
        </section>
      </div>

      <section className="pzx-sec" aria-labelledby="s4">
        <h2 id="s4" className="pzx-h2">Animación de confirmación</h2>
        <div className="pzx-motion" data-reduced={reduced || undefined}>
          <div aria-hidden="true"><Scaled width={1100} max={1.1}><P.Signature mode={mode} play={play} /></Scaled></div>
          <div className="pzx-motion-ctrl">
            <button type="button" className="pzx-btn" onClick={() => setPlay((n) => n + 1)}>Reproducir confirmación</button>
            <label className="pzx-check"><input type="checkbox" checked={reduced} onChange={(e) => setReduced(e.target.checked)} /> Movimiento reducido</label>
            <span className="pzx-muted">{i.motion}. Boceto: en L8 se dispara con el evento real del pedido aceptado.</span>
          </div>
        </div>
      </section>

      <section className="pzx-sec" aria-labelledby="s5">
        <h2 id="s5" className="pzx-h2">Paleta y contraste medido</h2>
        <div className="pzx-pals"><Ratios i={i} mode="light" /><Ratios i={i} mode="dark" /></div>
      </section>

      <section className="pzx-sec" aria-labelledby="s6">
        <h2 id="s6" className="pzx-h2">Decisiones</h2>
        <div className="pzx-eval">
          <ul>{i.decisions.map((d) => <li key={d}>{d}</li>)}</ul>
          <dl>
            <div><dt>Pieza firma</dt><dd>{i.signature}</dd></div>
            <div><dt>Qué la distingue</dt><dd>{i.differs}</dd></div>
            <div><dt>Inspiración</dt><dd>{i.inspiration.join(' · ')}</dd></div>
          </dl>
        </div>
      </section>

      <nav className="pzx-pager" aria-label="Recorrer identidades">
        <Link to={`/propuestas/${prev.biz}`}>← {prev.rubro}: {prev.name}</Link>
        <Link to={`/propuestas/${next.biz}`}>{next.rubro}: {next.name} →</Link>
      </nav>
    </StudioChrome>
  )
}
