import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { identityOf, vars, type Mode, type PzBiz } from './identities'

/** Lienzo de ancho fijo escalado al contenedor: compara las identidades a la misma medida. */
export function Scaled({ width = 1200, max = 1.2, children }: { width?: number; max?: number; children: ReactNode }) {
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
    <div ref={outer} className="pzx-scaled" style={{ height: box.h || undefined }}>
      <div ref={inner} style={{ width, transform: `scale(${box.s})`, transformOrigin: '0 0' }}>{children}</div>
    </div>
  )
}

/** Raíz de una identidad: tokens por variable CSS y modo. */
export function IdRoot({ biz, mode, className = '', children, style }: { biz: PzBiz; mode: Mode; className?: string; children: ReactNode; style?: CSSProperties }) {
  const id = identityOf(biz)!
  return (
    <div className={`pzx-root id-${biz} ${className}`} data-mode={mode} style={{ ...(vars(id, mode) as CSSProperties), ...style }}>
      {children}
    </div>
  )
}

/** Marco de teléfono: el contenido es la composición móvil propia de la identidad (no una versión achicada). */
export function Phone({ children }: { children: ReactNode }) {
  return (
    <div className="pzx-phone">
      <div className="pzx-phone-in">{children}</div>
    </div>
  )
}

export interface PieceProps { mode: Mode }
export interface SignatureProps { mode: Mode; play: number }
