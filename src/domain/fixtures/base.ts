import { RULE_DEFS } from '../automations'
import { SCHEMA_VERSION, type AppState, type AutomationRule, type BusinessId, type BusinessProfile, type CustomerDemo, type FixtureId, type Location, type ServiceWindow, type Table, type TastingEvent } from '../types'
import { SEED_CLOCK_MS } from '../time'
import { buildIngredients, buildMenu, buildModifierGroups, buildRecipes } from './catalog'
import { newConfig } from './nuevos'
import { BIZ_IDS, bizRecord } from '../business'

export const FIXTURE_VERSION = 'seed-v1'

const T0 = SEED_CLOCK_MS
const e = (businessId: BusinessId) => ({ businessId, createdAt: T0, version: 1 })

function businesses(): BusinessProfile[] {
  return [
    {
      id: 'mesa-clara',
      ...e('mesa-clara'),
      name: 'Mesa Clara',
      kind: 'bodegon',
      tagline: 'Bodegón contemporáneo · comida de casa, mesa larga',
      story: 'Cocina casera de bodegón con técnica de hoy: pastas amasadas cada mañana, minutas y parrilla.',
      reservationsEnabled: true,
      autoConfirmReservations: false,
      serviceMinutes: 90,
      bufferMinutes: 15,
      maxPartyAuto: 8,
      combineRules: [
        { id: 'CR-1', tableIds: ['T-MC-01', 'T-MC-02'], seats: 4, label: 'Mesas 1+2 (regla de muestra)' },
        { id: 'CR-2', tableIds: ['T-MC-03', 'T-MC-04'], seats: 4, label: 'Mesas 3+4 (regla de muestra)' },
      ],
      passportPaused: false,
      rewardsEnabled: false,
      pickupPerSlot: 6,
      categoryOrder: ['Entradas', 'Pastas', 'Minutas y carnes', 'Pescados', 'Postres', 'Bebidas'],
      paysAtCounter: false,
    },
    {
      id: 'ritual-cafe',
      ...e('ritual-cafe'),
      name: 'Ritual Café',
      kind: 'cafe',
      tagline: 'Cafetería de especialidad · barra, métodos y mañanas lentas',
      story: 'Café de especialidad con notas de origen, métodos de filtrado y pastelería del día.',
      reservationsEnabled: false,
      autoConfirmReservations: false,
      serviceMinutes: 90,
      bufferMinutes: 15,
      maxPartyAuto: 4,
      combineRules: [],
      passportPaused: false,
      rewardsEnabled: false,
      pickupPerSlot: 6,
      categoryOrder: ['Café de barra', 'Métodos', 'Pastelería', 'Salado'],
      paysAtCounter: true,
    },
  ]
}

function locations(): Location[] {
  return [
    { id: 'L-MC-salon', ...e('mesa-clara'), name: 'Mesa Clara · Salón y terraza', hasTables: true, pickupEnabled: false },
    { id: 'L-RC-centro', ...e('ritual-cafe'), name: 'Ritual Café · Centro', hasTables: true, pickupEnabled: true },
    { id: 'L-RC-norte', ...e('ritual-cafe'), name: 'Ritual Café · Norte', hasTables: false, pickupEnabled: true },
  ]
}

function windows(): ServiceWindow[] {
  const days = [1, 2, 3, 4, 5, 6]
  return [
    { id: 'SW-MC-almuerzo', ...e('mesa-clara'), locationId: 'L-MC-salon', label: 'Almuerzo', days, startMin: 12 * 60, endMin: 15 * 60 + 30 },
    { id: 'SW-MC-cena', ...e('mesa-clara'), locationId: 'L-MC-salon', label: 'Cena', days, startMin: 20 * 60, endMin: 23 * 60 + 30 },
    { id: 'SW-RC-centro', ...e('ritual-cafe'), locationId: 'L-RC-centro', label: 'Día completo', days, startMin: 8 * 60, endMin: 20 * 60 },
    { id: 'SW-RC-norte', ...e('ritual-cafe'), locationId: 'L-RC-norte', label: 'Día completo', days, startMin: 8 * 60, endMin: 20 * 60 },
  ]
}

function tables(): Table[] {
  const out: Table[] = []
  // Mesa Clara: 4×2, 4×4, 2×6, 2×8 = 52 cubiertos
  const mc: [number, 'salon' | 'terraza'][] = [
    [2, 'salon'], [2, 'salon'], [2, 'terraza'], [2, 'terraza'],
    [4, 'salon'], [4, 'salon'], [4, 'terraza'], [4, 'terraza'],
    [6, 'salon'], [6, 'terraza'],
    [8, 'salon'], [8, 'salon'],
  ]
  mc.forEach(([seats, sector], i) => {
    out.push({ id: `T-MC-${String(i + 1).padStart(2, '0')}`, ...e('mesa-clara'), locationId: 'L-MC-salon', label: `M${i + 1}`, seats, sector, col: i % 4, row: Math.floor(i / 4) })
  })
  // Ritual Café: 3×2 + 3×4 = 18 cubiertos
  const rc = [2, 2, 2, 4, 4, 4]
  rc.forEach((seats, i) => {
    out.push({ id: `T-RC-${String(i + 1).padStart(2, '0')}`, ...e('ritual-cafe'), locationId: 'L-RC-centro', label: `C${i + 1}`, seats, sector: 'salon', col: i % 3, row: Math.floor(i / 3) })
  })
  return out
}

function rules(): AutomationRule[] {
  return BIZ_IDS.flatMap(rulesFor)
}

export function customersService(): CustomerDemo[] {
  const c = (id: string, businessId: BusinessId, alias: string, whatsapp: boolean, promo: boolean, prefs = '', dup: string | null = null): CustomerDemo => ({
    id,
    ...e(businessId),
    alias,
    displayName: alias,
    channels: { whatsapp, voz: whatsapp },
    consent: { service: true, promo, updatedAt: T0 },
    prefs,
    mergedInto: null,
    possibleDuplicateOf: dup,
  })
  return [
    c('CL-001', 'mesa-clara', 'Ana', true, true, 'Prefiere salón. Cliente recurrente (ficticia).'),
    c('CL-002', 'mesa-clara', 'Bruno', true, false, 'Mesa tranquila.'),
    c('CL-003', 'mesa-clara', 'Equipo de oficina', false, false, 'Grupo de mediodía.'),
    c('CL-004', 'mesa-clara', 'Marcos P.', false, true, ''),
    c('CL-005', 'mesa-clara', 'Marcos Pérez', false, true, '', 'CL-004'),
    c('CL-006', 'ritual-cafe', 'Ana', true, true, 'Flat white con leche de avena (ficticia).'),
    c('CL-007', 'ritual-cafe', 'Lucía', false, true, ''),
    c('CL-008', 'ritual-cafe', 'Tomás', false, false, ''),
    c('CL-009', 'copo', 'Sofía', true, true, 'Siempre frutilla y dulce de leche (ficticia).'),
    c('CL-010', 'copo', 'Mateo', false, false, ''),
    c('CL-011', 'brasa', 'Julián', true, false, 'Sin cebolla (ficticio).'),
    c('CL-012', 'brasa', 'Carla', false, true, ''),
    c('CL-013', 'compas', 'Grupo del taller', true, false, 'Mesa grande para la noche de jazz.'),
    c('CL-014', 'compas', 'Inés', false, true, ''),
  ]
}

export function tastingEvents(): TastingEvent[] {
  return [
    {
      id: 'E-001',
      ...e('mesa-clara'),
      locationId: 'L-MC-salon',
      title: 'Cata de vinos de la casa',
      description: 'Cuatro etiquetas ficticias con maridaje de bodegón. Actividad de muestra: no se venden entradas reales. Solo mayores de 18.',
      dateKey: '2026-10-24',
      startMin: 20 * 60,
      capacity: 5,
      status: 'abierta',
      priceNote: 'Sin cobro real en la demo',
    },
    {
      id: 'E-002',
      ...e('ritual-cafe'),
      locationId: 'L-RC-centro',
      title: 'Cata de origen: Etiopía vs. Colombia',
      description: 'Dos cafés en V60, notas y diferencias de proceso. Actividad de muestra: no se venden entradas reales.',
      dateKey: '2026-10-24',
      startMin: 11 * 60,
      capacity: 6,
      status: 'abierta',
      priceNote: 'Sin cobro real en la demo',
    },
  ]
}

/** Reglas de automatización de un negocio (las mismas definiciones para los cinco). */
export function rulesFor(b: BusinessId): AutomationRule[] {
  return RULE_DEFS.map((d) => ({ id: `RULE-${d.code}-${b}`, ...e(b), ...d, config: { ...d.config }, enabled: true, failNext: false }))
}

/** Sede inicial de cada negocio. */
export const DEFAULT_LOCATION: Record<BusinessId, string> = { 'mesa-clara': 'L-MC-salon', 'ritual-cafe': 'L-RC-centro', copo: 'L-CO-mostrador', compas: 'L-TC-salon', brasa: 'L-BR-centro' }

/** Estado base: configuración + catálogo + reglas, sin datos transaccionales. */
export function baseState(fixtureId: FixtureId): AppState {
  const nc = newConfig(T0)
  return {
    schemaVersion: SCHEMA_VERSION,
    fixtureId,
    clock: { nowMs: SEED_CLOCK_MS },
    counters: {},
    session: {
      role: 'cliente-invitado',
      businessId: 'mesa-clara',
      locationByBusiness: { ...DEFAULT_LOCATION },
      customerByBusiness: bizRecord(() => null),
    },
    businesses: [...businesses(), ...nc.businesses],
    locations: [...locations(), ...nc.locations],
    serviceWindows: [...windows(), ...nc.serviceWindows],
    tables: [...tables(), ...nc.tables],
    reservations: [],
    waitlist: [],
    menuItems: [...buildMenu().map((m) => ({ ...m, createdAt: T0 })), ...nc.menuItems],
    modifierGroups: [...buildModifierGroups(), ...nc.modifierGroups],
    carts: [],
    orders: [],
    tickets: [],
    tableSessions: [],
    payments: [],
    cashSessions: [],
    ingredients: [...buildIngredients().map((i) => ({ ...i, createdAt: T0 })), ...nc.ingredients],
    recipes: [...buildRecipes().map((r) => ({ ...r, createdAt: T0 })), ...nc.recipes],
    stockMovements: [],
    customers: [],
    conversations: [],
    messages: [],
    callSessions: [],
    tasks: [],
    rules: rules(),
    runs: [],
    tastingEvents: [],
    eventBookings: [],
    passports: [],
    visits: [],
    redemptions: [],
    audit: [],
    campaignPreviews: [],
    gifts: [],
    settings: { seasonByBusiness: bizRecord(() => 'auto' as const) },
  }
}

/** Seed vacío: perfiles, carta, stock y reglas; nada de actividad. */
export function emptySeed(): AppState {
  const s = baseState('vacio')
  s.tastingEvents = [...tastingEvents(), ...newConfig(T0).tastingEvents]
  s.counters = { E: 2 }
  return s
}
