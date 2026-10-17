import type { FamilyPiece, IdentityKey } from './kit'
import { CAFE_FAMILY } from './cafe'
import { BODEGON_FAMILY } from './bodegon'
import { COPO_FAMILY } from './copo'
import { COMPAS_FAMILY } from './compas'
import { BRASA_FAMILY } from './brasa'

export type { FamilyPiece, IdentityKey } from './kit'
export { Piece } from './kit'

/** P5-L4 · Familias de arte por identidad (galería en #/arte). */
export const FAMILIES: Record<IdentityKey, { name: string; business: string; pieces: FamilyPiece[] }> = {
  cafe: { name: 'Ritual Café', business: 'ritual-cafe', pieces: CAFE_FAMILY },
  resto: { name: 'Mesa Clara', business: 'mesa-clara', pieces: BODEGON_FAMILY },
  hela: { name: 'Copo', business: 'copo', pieces: COPO_FAMILY },
  bar: { name: 'Taberna Compás', business: 'compas', pieces: COMPAS_FAMILY },
  rapida: { name: 'Brasa Rápida', business: 'brasa', pieces: BRASA_FAMILY },
}

const BY_KEY = new Map(Object.values(FAMILIES).flatMap((f) => f.pieces.map((p) => [p.key, p] as const)))
/** Pieza de arte por clave (id del ítem del fixture o clave propia). */
export const pieceFor = (key: string) => BY_KEY.get(key)
export const ALL_PIECES = [...BY_KEY.values()]
