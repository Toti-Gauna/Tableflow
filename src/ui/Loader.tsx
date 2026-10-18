import { useLocation } from 'react-router-dom'
import { useSnapshot } from '../store'
import { HouseChar } from './art/characters'

/**
 * Cargador de sección mientras baja su código (carga diferida por ruta). No agrega esperas:
 * aparece recién si la carga tarda más de ~180 ms (retardo solo en CSS) y desaparece al montar la pantalla.
 */
/** P5-L8: el esqueleto toma la forma de lo que viene (carta en grilla, seguimiento con comprobante, tablero en columnas). */
function shapeOf(path: string): 'carta' | 'detalle' | 'tablero' | 'lista' {
  if (/\/carta(\/|$)/.test(path)) return 'carta'
  if (/\/(pedido|reservas)\/[^/]+$/.test(path)) return 'detalle'
  if (/^\/admin\/(cocina|pedidos|salon)/.test(path)) return 'tablero'
  return 'lista'
}

export function RouteLoader({ variant = 'client' }: { variant?: 'client' | 'admin' }) {
  const { state } = useSnapshot()
  const shape = shapeOf(useLocation().pathname)
  return (
    <div className={`route-loader ${variant}`} role="status" aria-live="polite" data-shape={shape}>
      {variant === 'client' && <HouseChar biz={state.session.businessId} mood="pensando" size={72} />}
      <div className="sk" aria-hidden="true">
        <span className="sk-eyebrow" />
        <span className="sk-title" />
        {shape === 'carta' ? (
          <div className="sk-grid">{Array.from({ length: 6 }, (_, i) => <span key={i} />)}</div>
        ) : shape === 'detalle' ? (
          <div className="sk-detail"><span className="sk-hero" /><span className="sk-ticket" /></div>
        ) : shape === 'tablero' ? (
          <div className="sk-cols">{Array.from({ length: 3 }, (_, i) => <span key={i} />)}</div>
        ) : (
          <>
            <span className="sk-line" />
            <span className="sk-line short" />
            <div className="sk-rows">
              <span />
              <span />
              <span />
            </div>
          </>
        )}
      </div>
      <span className="sr-only">Cargando la sección…</span>
    </div>
  )
}
