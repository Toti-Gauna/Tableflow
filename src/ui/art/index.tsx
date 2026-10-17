import type { MenuItem } from '../../domain/types'
import { Piece, pieceFor } from './families'

/** Ilustración propia del plato (sin foto), de la familia de arte de su identidad (P5-L4). */
export function DishArt({ item, size = 96, decorative = false, className }: { item: Pick<MenuItem, 'id' | 'name'>; size?: number; decorative?: boolean; className?: string }) {
  const p = pieceFor(item.id)
  if (!p) return null
  return (
    <Piece size={size} label={decorative ? undefined : `Ilustración de muestra de ${item.name} (sin foto)`} className={className}>
      <p.Comp />
    </Piece>
  )
}

export const hasArt = (id: string) => !!pieceFor(id)
