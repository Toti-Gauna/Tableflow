import { useLocation, useNavigate } from 'react-router-dom'
import { useApp } from '../store'
import { PageHead } from '../ui/Shell'
import { Callout } from '../ui/kit'
import { scenesFor } from '../domain/scenes'
import { startScene } from '../ui/scenes/runtime'
import { openEclipse } from '../ui/eclipseHost'
import type { BusinessId } from '../domain/types'

/** P5-L9 · Escenas guiadas por negocio: cada una recorre el producto real, con su teléfono, en dos o tres minutos. */
export function Escenas() {
  const state = useApp()
  const nav = useNavigate()
  const { pathname } = useLocation()
  const play = (biz: BusinessId, id: Parameters<typeof startScene>[1]) => {
    const to = startScene(biz, id, pathname)
    if (to) nav(to)
  }
  return (
    <main className="wrap">
      <PageHead title="Escenas guiadas" sub="El producto real, paso a paso: un teléfono flotante muestra al cliente y de fondo queda la pantalla del comercio." />
      <Callout>Cada escena usa los mismos comandos que la interfaz: lo que hace queda en la demo. Se puede pausar, repetir, cambiar la velocidad y salir en cualquier momento; no necesita sonido.</Callout>
      <div className="scene-grid">
        {state.businesses.map((b) => (
          <section key={b.id} className="card" aria-labelledby={`sc-${b.id}`} data-testid={`scenes-${b.id}`}>
            <h2 id={`sc-${b.id}`}>{b.name}</h2>
            <ul className="scene-list">
              {scenesFor(b.id).map((sc) => (
                <li key={sc.id}>
                  <div>
                    <strong>{sc.title}</strong>
                    <p className="small muted">{sc.summary}</p>
                  </div>
                  <button type="button" className="btn small" onClick={() => play(b.id, sc.id)} data-testid={`scene-${b.id}-${sc.id}`}>Ver la escena</button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <p style={{ marginTop: 16 }}>
        <button type="button" className="btn secondary" onClick={() => openEclipse('boton')} data-testid="adapt-open">Adaptarlo a mi negocio</button>
      </p>
    </main>
  )
}
