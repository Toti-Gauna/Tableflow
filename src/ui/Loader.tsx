import { useSnapshot } from '../store'
import { HouseChar } from './art/characters'

/**
 * Cargador de sección mientras baja su código (carga diferida por ruta). No agrega esperas:
 * aparece recién si la carga tarda más de ~180 ms (retardo solo en CSS) y desaparece al montar la pantalla.
 */
export function RouteLoader({ variant = 'client' }: { variant?: 'client' | 'admin' }) {
  const { state } = useSnapshot()
  return (
    <div className={`route-loader ${variant}`} role="status" aria-live="polite">
      {variant === 'client' && <HouseChar biz={state.session.businessId} mood="pensando" size={72} />}
      <div className="sk" aria-hidden="true">
        <span className="sk-eyebrow" />
        <span className="sk-title" />
        <span className="sk-line" />
        <span className="sk-line short" />
        <div className="sk-rows">
          <span />
          <span />
          <span />
        </div>
      </div>
      <span className="sr-only">Cargando la sección…</span>
    </div>
  )
}
