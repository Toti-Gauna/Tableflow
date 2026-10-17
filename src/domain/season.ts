import { dateKeyOf } from './time'
import type { AppState, BusinessId, SeasonId } from './types'

// Temática por época según el día simulado (hemisferio sur, calendario argentino).
// Las fechas especiales tienen prioridad sobre la estación mientras dura su ventana.

export interface Season {
  id: SeasonId
  kind: 'estacion' | 'fecha'
  name: string
  /** Rango legible, p. ej. "21/9 al 20/12" o "domingo 18/10". */
  when: string
  headline: Record<BusinessId, string>
  body: Record<BusinessId, string>
  /** Platos sugeridos para la temporada (ids existentes de la carta). */
  picks: Record<BusinessId, string[]>
  /** Mensaje sugerido para una invitación. */
  giftLine: string
}

const pad = (n: number) => String(n).padStart(2, '0')
const md = (m: number, d: number) => m * 100 + d
const parts = (key: string) => key.split('-').map(Number) as [number, number, number]
const keyOf = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`
const shift = (key: string, days: number) => {
  const [y, m, d] = parts(key)
  const t = new Date(Date.UTC(y, m - 1, d + days))
  return keyOf(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate())
}
/** n-ésimo domingo del mes (1 = primero). */
export function nthSunday(year: number, month: number, n: number): string {
  const first = new Date(Date.UTC(year, month - 1, 1)).getUTCDay() // 0 = domingo
  const day = 1 + ((7 - first) % 7) + (n - 1) * 7
  return keyOf(year, month, day)
}
const dm = (key: string) => {
  const [, m, d] = parts(key)
  return `${d}/${m}`
}

const S: Record<SeasonId, Omit<Season, 'when'>> = {
  primavera: {
    id: 'primavera', kind: 'estacion', name: 'Primavera',
    headline: { 'mesa-clara': 'Mesa larga al sol de primavera', 'ritual-cafe': 'Primavera en la barra' },
    body: {
      'mesa-clara': 'Vuelve la terraza: ensaladas de estación, pastas livianas y postres para compartir.',
      'ritual-cafe': 'Filtrados florales y frutados para las mañanas largas. Probá el V60 del día.',
    },
    picks: { 'mesa-clara': ['MC-04', 'MC-08', 'MC-22'], 'ritual-cafe': ['RC-07', 'RC-09', 'RC-14'] },
    giftLine: 'Que esta primavera arranque con algo rico. ¡Te invito!',
  },
  verano: {
    id: 'verano', kind: 'estacion', name: 'Verano',
    headline: { 'mesa-clara': 'Noches de verano en la vereda', 'ritual-cafe': 'Verano: cold brew y vitrina fresca' },
    body: {
      'mesa-clara': 'Cenas largas, platos frescos y algo frío para la sobremesa.',
      'ritual-cafe': 'Cold brew de 18 horas, budín de limón y café para llevar.',
    },
    picks: { 'mesa-clara': ['MC-04', 'MC-20', 'MC-28'], 'ritual-cafe': ['RC-09', 'RC-14', 'RC-12'] },
    giftLine: 'Para que el verano tenga sabor: este va por mi cuenta.',
  },
  otono: {
    id: 'otono', kind: 'estacion', name: 'Otoño',
    headline: { 'mesa-clara': 'Otoño de horno y cuchara', 'ritual-cafe': 'Otoño: tazas que abrigan' },
    body: {
      'mesa-clara': 'Lasaña, canelones y tiramisú para las primeras tardes frías.',
      'ritual-cafe': 'Cappuccino, roll de canela y la mesa junto a la ventana.',
    },
    picks: { 'mesa-clara': ['MC-10', 'MC-11', 'MC-23'], 'ritual-cafe': ['RC-05', 'RC-10', 'RC-11'] },
    giftLine: 'Un plato calentito para este otoño. ¡Disfrutalo!',
  },
  invierno: {
    id: 'invierno', kind: 'estacion', name: 'Invierno',
    headline: { 'mesa-clara': 'Invierno de bodegón', 'ritual-cafe': 'Invierno: lattes y medialunas' },
    body: {
      'mesa-clara': 'Ñoquis, milanesas y flan casero para las noches largas.',
      'ritual-cafe': 'Lattes cremosos y pastelería recién horneada para el frío.',
    },
    picks: { 'mesa-clara': ['MC-12', 'MC-07', 'MC-22'], 'ritual-cafe': ['RC-06', 'RC-11', 'RC-13'] },
    giftLine: 'Para combatir el frío: te invito a comer algo rico.',
  },
  madre: {
    id: 'madre', kind: 'fecha', name: 'Día de la Madre',
    headline: { 'mesa-clara': 'Invitala a comer', 'ritual-cafe': 'Un café para mamá' },
    body: {
      'mesa-clara': 'Regalale su plato preferido con un mensaje: lo canjea cuando quiera venir.',
      'ritual-cafe': 'Su taza y una medialuna, con tu mensaje. La invitación llega como tarjeta.',
    },
    picks: { 'mesa-clara': ['MC-06', 'MC-21', 'MC-25'], 'ritual-cafe': ['RC-04', 'RC-11', 'RC-14'] },
    giftLine: 'Feliz día, ma. Esta vez invito yo. Te quiero mucho.',
  },
  padre: {
    id: 'padre', kind: 'fecha', name: 'Día del Padre',
    headline: { 'mesa-clara': 'Asado para papá', 'ritual-cafe': 'Un doble para papá' },
    body: {
      'mesa-clara': 'Regalale un bife o un asado de tira con tu mensaje.',
      'ritual-cafe': 'Doble espresso y tostado: invitalo a la barra.',
    },
    picks: { 'mesa-clara': ['MC-15', 'MC-16', 'MC-01'], 'ritual-cafe': ['RC-02', 'RC-13', 'RC-08'] },
    giftLine: 'Feliz día, pa. Este corre por mi cuenta.',
  },
  amigo: {
    id: 'amigo', kind: 'fecha', name: 'Día del Amigo',
    headline: { 'mesa-clara': 'Mesa para los de siempre', 'ritual-cafe': 'Un café con tu amigo' },
    body: {
      'mesa-clara': 'Invitá a tu amigo a comer: elegí el plato y escribile algo.',
      'ritual-cafe': 'Regalale un café de especialidad con tu mensaje.',
    },
    picks: { 'mesa-clara': ['MC-02', 'MC-01', 'MC-24'], 'ritual-cafe': ['RC-05', 'RC-10', 'RC-07'] },
    giftLine: '¡Feliz Día del Amigo! Gracias por estar siempre.',
  },
  fiestas: {
    id: 'fiestas', kind: 'fecha', name: 'Fiestas',
    headline: { 'mesa-clara': 'Fiestas en Mesa Clara', 'ritual-cafe': 'Fiestas en la barra' },
    body: {
      'mesa-clara': 'Regalá una cena de fin de año o un postre para brindar.',
      'ritual-cafe': 'Un regalo con aroma a café: tarjeta y taza para quien quieras.',
    },
    picks: { 'mesa-clara': ['MC-28', 'MC-22', 'MC-18'], 'ritual-cafe': ['RC-08', 'RC-10', 'RC-14'] },
    giftLine: '¡Felices fiestas! Que el año que viene nos encuentre en la mesa.',
  },
  enamorados: {
    id: 'enamorados', kind: 'fecha', name: 'San Valentín',
    headline: { 'mesa-clara': 'Mesa para dos', 'ritual-cafe': 'Dos tazas, un corazón' },
    body: {
      'mesa-clara': 'Invitá a tu persona favorita a cenar: el postre va con mensaje.',
      'ritual-cafe': 'Un cappuccino con corazón y una nota tuya.',
    },
    picks: { 'mesa-clara': ['MC-08', 'MC-23', 'MC-28'], 'ritual-cafe': ['RC-05', 'RC-03', 'RC-10'] },
    giftLine: 'Para vos, con todo mi cariño.',
  },
}

export const SEASON_IDS = Object.keys(S) as SeasonId[]
export const SEASON_NAME: Record<SeasonId, string> = Object.fromEntries(SEASON_IDS.map((k) => [k, S[k].name])) as Record<SeasonId, string>

/** Ventanas de fechas especiales del año del día dado: [desde, hasta, rótulo]. */
function specialWindows(year: number): { id: SeasonId; from: string; to: string; when: string }[] {
  const madre = nthSunday(year, 10, 3)
  const padre = nthSunday(year, 6, 3)
  return [
    { id: 'fiestas', from: keyOf(year, 1, 1), to: keyOf(year, 1, 6), when: '24/12 al 6/1' },
    { id: 'enamorados', from: keyOf(year, 2, 7), to: keyOf(year, 2, 15), when: '14/2' },
    { id: 'padre', from: shift(padre, -10), to: shift(padre, 2), when: `domingo ${dm(padre)}` },
    { id: 'amigo', from: keyOf(year, 7, 13), to: keyOf(year, 7, 22), when: '20/7' },
    { id: 'madre', from: shift(madre, -14), to: shift(madre, 3), when: `domingo ${dm(madre)}` },
    { id: 'fiestas', from: keyOf(year, 12, 1), to: keyOf(year, 12, 31), when: '24/12 al 6/1' },
  ]
}

/** Temporada automática para un día `YYYY-MM-DD`. */
export function seasonForDate(key: string): Season {
  const [y, m, d] = parts(key)
  for (const w of specialWindows(y)) if (key >= w.from && key <= w.to) return { ...S[w.id], when: w.when }
  const v = md(m, d)
  if (v >= md(9, 21) && v <= md(12, 20)) return { ...S.primavera, when: '21/9 al 20/12' }
  if (v >= md(6, 21) && v <= md(9, 20)) return { ...S.invierno, when: '21/6 al 20/9' }
  if (v >= md(3, 21) && v <= md(6, 20)) return { ...S.otono, when: '21/3 al 20/6' }
  return { ...S.verano, when: '21/12 al 20/3' }
}

/** Fecha de la próxima (o reciente) fecha especial, para el texto "fue ayer" / "es el domingo". */
export function specialDay(id: SeasonId, key: string): string | null {
  const [y] = parts(key)
  if (id === 'madre') return nthSunday(y, 10, 3)
  if (id === 'padre') return nthSunday(y, 6, 3)
  if (id === 'amigo') return keyOf(y, 7, 20)
  if (id === 'enamorados') return keyOf(y, 2, 14)
  return null
}

/** Temporada vigente para un negocio: la forzada en Configuración o la automática del día simulado. */
export function activeSeason(s: AppState, businessId: BusinessId): Season & { forced: boolean } {
  const forced = s.settings.seasonByBusiness[businessId]
  const key = dateKeyOf(s.clock.nowMs)
  if (forced && forced !== 'auto') {
    const auto = seasonForDate(key)
    return { ...S[forced], when: auto.id === forced ? auto.when : 'forzada desde Configuración', forced: true }
  }
  return { ...seasonForDate(key), forced: false }
}

export function seasonById(id: SeasonId): Omit<Season, 'when'> {
  return S[id]
}
