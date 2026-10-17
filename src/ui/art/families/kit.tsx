import { useId, type ComponentType, type ReactNode } from 'react'
import { ArtIdProvider } from '../kit'

// P5-L4 · Familias de arte por identidad. Cada identidad tiene su propio material, punto de vista y luz;
// no comparten el acabado de tinta y grano de P4 (prompt L4.3). Lo único común es el marco: viewBox 160,
// ids únicos por instancia (useArtId) y texto accesible o decorativo.

export type IdentityKey = 'cafe' | 'resto' | 'hela' | 'bar' | 'rapida'

export interface FamilyPiece {
  /** Clave estable: el id del ítem del fixture (RC-04, MC-13) o una clave propia para los negocios de L5. */
  key: string
  name: string
  /** Grupo en la galería: carta, juego (piezas de L5) o vajilla y fondos. */
  group: 'carta' | 'juego' | 'extra'
  Comp: ComponentType
}

/** Marco de una pieza: su propio prefijo de ids, sin filtros ni gradientes heredados de P4. */
export function Piece({ size, label, children, view = 160, className }: { size: number; label?: string; children: ReactNode; view?: number; className?: string }) {
  const raw = useId().replace(/[^a-zA-Z0-9]/g, '')
  const id = (n: string) => `p${raw}-${n}`
  return (
    <svg className={`art fam ${className ?? ''}`} width={size} height={size} viewBox={`0 0 ${view} ${view}`} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true} focusable="false">
      <ArtIdProvider value={id}>{children}</ArtIdProvider>
    </svg>
  )
}

/** Puntos deterministas dentro de una elipse (migas, semillas, trocitos). */
export function scatter(n: number, cx: number, cy: number, rx: number, ry: number, seed = 1): [number, number, number][] {
  let t = seed * 9301 + 49297
  const r = () => ((t = (t * 9301 + 49297) % 233280) / 233280)
  const out: [number, number, number][] = []
  while (out.length < n) {
    const a = r() * Math.PI * 2
    const d = Math.sqrt(r())
    out.push([cx + Math.cos(a) * rx * d, cy + Math.sin(a) * ry * d, r()])
  }
  return out
}
