import type { MenuItem } from '../../domain/types'
import { Art } from './kit'
import { MC_ART } from './mesa-clara'
import { RC_ART } from './ritual-cafe'

const ALL = { ...MC_ART, ...RC_ART }

/** Ilustración propia del plato (sin foto). Texto accesible: "Ilustración de muestra de …". */
export function DishArt({ item, size = 96, decorative = false, className }: { item: Pick<MenuItem, 'id' | 'name'>; size?: number; decorative?: boolean; className?: string }) {
  const Comp = ALL[item.id]
  if (!Comp) return null
  return (
    <Art size={size} label={decorative ? undefined : `Ilustración de muestra de ${item.name} (sin foto)`} className={className}>
      <Comp />
    </Art>
  )
}

export const hasArt = (id: string) => id in ALL
export const ART_IDS = Object.keys(ALL)
