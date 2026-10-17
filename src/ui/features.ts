import type { BusinessProfile } from '../domain/types'

/**
 * P5-L5 · Secciones del perfil cliente según el tipo de negocio. Mesa Clara y Ritual Café conservan todo lo de
 * P2–P4; los negocios nuevos muestran solo lo que su operación usa (la fidelización llega en L6).
 */
export type Feature = 'explorar' | 'pasaporte' | 'catas' | 'simulador' | 'numeros'
const LEGACY: Feature[] = ['explorar', 'pasaporte', 'catas', 'simulador']
const BY_KIND: Record<BusinessProfile['kind'], Feature[]> = {
  bodegon: LEGACY,
  cafe: LEGACY,
  heladeria: [],
  bar: ['catas'],
  rapida: ['numeros'],
}
export const hasFeature = (b: BusinessProfile, f: Feature) => BY_KIND[b.kind].includes(f)
/** Cómo se llama la sección de eventos: catas en el bodegón y el café, agenda de música en el bar. */
export const eventsLabel = (b: BusinessProfile) => (b.kind === 'bar' ? 'Agenda' : 'Catas')
export const KIND_LABEL: Record<BusinessProfile['kind'], string> = {
  bodegon: 'Bodegón · cocina de casa',
  cafe: 'Café de especialidad · barra y vitrina',
  heladeria: 'Heladería artesanal · la vitrina es el menú',
  bar: 'Tapas y jazz en vivo · Lado A, Lado B',
  rapida: 'Comida rápida · pedís, te llaman, retirás',
}
