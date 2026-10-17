import type { BusinessId } from './types'

// P5-L5 · Registro de los cinco negocios ficticios. Todo lo que recorre "cada negocio" sale de acá:
// mapas de sesión, ajustes, reglas, rutas y selectores. Nunca se asume que hay dos.
export const BIZ_IDS = ['mesa-clara', 'ritual-cafe', 'copo', 'compas', 'brasa'] as const satisfies readonly BusinessId[]

export const isBizId = (v: unknown): v is BusinessId => typeof v === 'string' && (BIZ_IDS as readonly string[]).includes(v)

/** Un registro con una entrada por negocio. */
export function bizRecord<T>(f: (b: BusinessId) => T): Record<BusinessId, T> {
  return Object.fromEntries(BIZ_IDS.map((b) => [b, f(b)])) as Record<BusinessId, T>
}

/** Prefijo corto por negocio (códigos de invitación, etiquetas). */
export const BIZ_PREFIX: Record<BusinessId, string> = { 'mesa-clara': 'MC', 'ritual-cafe': 'RC', copo: 'CO', compas: 'TC', brasa: 'BR' }

/** Expresión para rutas cliente: /:biz y /:biz/... */
export const BIZ_ROUTE_RE = new RegExp(`^/(${BIZ_IDS.join('|')})(/.*)?$`)
