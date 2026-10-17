import type { BusinessId, BusinessProfile, FoodNote, Ingredient, Location, MenuItem, ModifierGroup, ModifierOption, Recipe, ServiceWindow, Station, Table, TastingEvent } from '../types'

// P5-L5 · Configuración de los tres negocios nuevos (Copo, Taberna Compás, Brasa Rápida) y los clásicos de
// confitería que se suman a Ritual Café. Datos FICTICIOS; precios ARS de muestra.
// Se usa en el seed (estado nuevo) y en la migración 2 → 3 (estado guardado): por eso todo tiene ID fijo.

const ARS = (n: number) => n * 100
const ok = (allergens: string[], note = 'Anotación de muestra aportada por el negocio ficticio.'): FoodNote => ({ status: 'completa', allergens, note })
const e = (businessId: BusinessId, createdAt: number) => ({ businessId, createdAt, version: 1 })

export interface NewConfig {
  businesses: BusinessProfile[]
  locations: Location[]
  serviceWindows: ServiceWindow[]
  tables: Table[]
  modifierGroups: ModifierGroup[]
  menuItems: MenuItem[]
  ingredients: Ingredient[]
  recipes: Recipe[]
  tastingEvents: TastingEvent[]
}

export const NEW_BUSINESSES: BusinessId[] = ['copo', 'compas', 'brasa']
export const NEW_LOCATION: Record<'copo' | 'compas' | 'brasa', string> = { copo: 'L-CO-mostrador', compas: 'L-TC-salon', brasa: 'L-BR-centro' }

// ---------------------------------------------------------------- Copo · gustos y bachas
export const GUSTOS: [id: string, name: string, ingredientId: string][] = [
  ['hg-frutilla', 'Frutilla a la crema', 'I-CO-01'],
  ['hg-ddl', 'Dulce de leche granizado', 'I-CO-02'],
  ['hg-choco', 'Chocolate amargo', 'I-CO-03'],
  ['hg-pistacho', 'Pistacho', 'I-CO-04'],
  ['hg-limon', 'Limón', 'I-CO-05'],
  ['hg-menta', 'Menta granizada', 'I-CO-06'],
  ['hg-crema', 'Crema americana', 'I-CO-07'],
  ['hg-sambayon', 'Sambayón', 'I-CO-08'],
]
/** Clave de arte de la bacha de cada gusto (familia de Copo, P5-L4). */
export const GUSTO_ART: Record<string, string> = Object.fromEntries(GUSTOS.map(([id]) => [id, `H-bacha-${id.slice(3)}`]))

/** Grupo de gustos de un formato: el cupo depende del formato y cada gusto consume su parte de la bacha. */
function gustos(id: string, name: string, max: number, gramsPerGusto: number): ModifierGroup {
  const options: ModifierOption[] = GUSTOS.map(([oid, oname, ing]) => ({ id: oid, name: oname, deltaCents: 0, consumes: { ingredientId: ing, qty: gramsPerGusto, unit: 'g' } }))
  return { id, businessId: 'copo', name, required: true, min: 1, max, options }
}

function copo(T0: number): NewConfig {
  const b = 'copo' as const
  return {
    businesses: [{
      id: b, ...e(b, T0), name: 'Copo', kind: 'heladeria',
      tagline: 'Heladería artesanal · la vitrina es el menú',
      story: 'Helado artesanal hecho cada mañana: bachas a la vista, gustos de estación y potes para llevar. Pedís, retirás en el mostrador y pagás ahí.',
      reservationsEnabled: false, autoConfirmReservations: false, serviceMinutes: 30, bufferMinutes: 0, maxPartyAuto: 0, combineRules: [],
      passportPaused: false, rewardsEnabled: false, pickupPerSlot: 8,
      categoryOrder: ['Cucuruchos y vasitos', 'Potes para llevar', 'Extras', 'Bebidas'],
      paysAtCounter: true,
    }],
    locations: [{ id: 'L-CO-mostrador', ...e(b, T0), name: 'Copo · Mostrador', hasTables: false, pickupEnabled: true }],
    serviceWindows: [{ id: 'SW-CO-dia', ...e(b, T0), locationId: 'L-CO-mostrador', label: 'Mostrador', days: [0, 1, 2, 3, 4, 5, 6], startMin: 10 * 60, endMin: 23 * 60 + 30 }],
    tables: [],
    modifierGroups: [
      gustos('MG-CO-gustos-1', 'Gusto', 1, 130),
      gustos('MG-CO-gustos-2', 'Gustos (hasta 2)', 2, 90),
      gustos('MG-CO-gustos-q', 'Gustos (hasta 3)', 3, 85),
      gustos('MG-CO-gustos-m', 'Gustos (hasta 3)', 3, 170),
      gustos('MG-CO-gustos-k', 'Gustos (hasta 4)', 4, 250),
      { id: 'MG-CO-bano', businessId: b, name: 'Baño', required: false, min: 0, max: 1, options: [{ id: 'hb-chocolate', name: 'Baño de chocolate', deltaCents: ARS(900) }] },
      { id: 'MG-CO-salsa', businessId: b, name: 'Salsa (máximo 1)', required: false, min: 0, max: 1, options: [
        { id: 'hs-chocolate', name: 'Salsa de chocolate', deltaCents: ARS(600) },
        { id: 'hs-ddl', name: 'Dulce de leche', deltaCents: ARS(600) },
        { id: 'hs-frutilla', name: 'Salsa de frutilla', deltaCents: ARS(600) },
      ] },
    ],
    menuItems: items(b, T0, 'mostrador', [
      { id: 'CO-01', name: 'Cucurucho · 1 gusto', description: 'Oblea crocante y una bocha generosa.', category: 'Cucuruchos y vasitos', priceCents: ARS(4200), modifierGroupIds: ['MG-CO-gustos-1', 'MG-CO-bano', 'MG-CO-salsa'], foodNote: ok(['gluten', 'lácteos (según gusto)']) },
      { id: 'CO-02', name: 'Cucurucho · 2 gustos', description: 'Dos bochas, una arriba de la otra.', category: 'Cucuruchos y vasitos', priceCents: ARS(5400), modifierGroupIds: ['MG-CO-gustos-2', 'MG-CO-bano', 'MG-CO-salsa'], foodNote: ok(['gluten', 'lácteos (según gusto)']), tags: ['favorito-casa'] },
      { id: 'CO-03', name: 'Vasito · 2 gustos', description: 'En vasito con cucharita.', category: 'Cucuruchos y vasitos', priceCents: ARS(5200), modifierGroupIds: ['MG-CO-gustos-2', 'MG-CO-salsa'], foodNote: ok(['lácteos (según gusto)']) },
      { id: 'CO-04', name: 'Pote de ¼ kg', description: 'Hasta 3 gustos, para llevar.', category: 'Potes para llevar', priceCents: ARS(7900), modifierGroupIds: ['MG-CO-gustos-q'], foodNote: ok(['lácteos (según gusto)']) },
      { id: 'CO-05', name: 'Pote de ½ kg', description: 'Hasta 3 gustos, para llevar.', category: 'Potes para llevar', priceCents: ARS(12800), modifierGroupIds: ['MG-CO-gustos-m'], foodNote: ok(['lácteos (según gusto)']) },
      { id: 'CO-06', name: 'Pote de 1 kg', description: 'Hasta 4 gustos, para la familia.', category: 'Potes para llevar', priceCents: ARS(21900), modifierGroupIds: ['MG-CO-gustos-k'], foodNote: ok(['lácteos (según gusto)']) },
      { id: 'CO-07', name: 'Salsa de chocolate para llevar', description: 'Frasquito para el pote de casa.', category: 'Extras', priceCents: ARS(3500), modifierGroupIds: [], foodNote: ok(['lácteos']) },
      { id: 'CO-08', name: 'Licuado de frutilla (sin alcohol)', description: 'Con leche y frutillas.', category: 'Bebidas', priceCents: ARS(5600), modifierGroupIds: [], foodNote: ok(['lácteos']), tags: ['sin-alcohol'] },
    ]),
    ingredients: ings(b, T0, [
      ['I-CO-01', 'Bacha de frutilla', 'g', 5200, 1200],
      ['I-CO-02', 'Bacha de dulce de leche', 'g', 6000, 1200],
      ['I-CO-03', 'Bacha de chocolate amargo', 'g', 5400, 1200],
      ['I-CO-04', 'Bacha de pistacho', 'g', 4200, 1200],
      ['I-CO-05', 'Bacha de limón', 'g', 4800, 1200],
      ['I-CO-06', 'Bacha de menta', 'g', 900, 1200], // baja
      ['I-CO-07', 'Bacha de crema americana', 'g', 5000, 1200],
      ['I-CO-08', 'Bacha de sambayón', 'g', 0, 1200], // agotada: el gusto sale de la carta
      ['I-CO-09', 'Cucuruchos (unidad)', 'u', 180, 40],
    ]),
    recipes: [
      rcp('CO-01', b, T0, [['I-CO-09', 1, 'u']]),
      rcp('CO-02', b, T0, [['I-CO-09', 1, 'u']]),
    ],
    tastingEvents: [],
  }
}

// ---------------------------------------------------------------- Taberna Compás
function compas(T0: number): NewConfig {
  const b = 'compas' as const
  const seats: [number, 'salon' | 'terraza'][] = [[2, 'salon'], [2, 'salon'], [2, 'salon'], [4, 'salon'], [4, 'salon'], [4, 'salon'], [6, 'terraza'], [8, 'terraza']]
  return {
    businesses: [{
      id: b, ...e(b, T0), name: 'Taberna Compás', kind: 'bar',
      tagline: 'Bar gastronómico · tapas y jazz en vivo',
      story: 'Tapas para compartir, cocina de barra y una agenda de música en vivo. Se reserva la mesa para la noche; no hay entradas. Las bebidas con alcohol son solo para mayores de 18.',
      reservationsEnabled: true, autoConfirmReservations: false, serviceMinutes: 120, bufferMinutes: 15, maxPartyAuto: 8, combineRules: [],
      passportPaused: false, rewardsEnabled: false, pickupPerSlot: 0,
      categoryOrder: ['Lado A · para compartir', 'Lado B · de la cocina', 'Bonus · sin alcohol', 'Con alcohol · +18'],
      paysAtCounter: false,
    }],
    locations: [{ id: 'L-TC-salon', ...e(b, T0), name: 'Taberna Compás · Salón y patio', hasTables: true, pickupEnabled: false }],
    serviceWindows: [{ id: 'SW-TC-noche', ...e(b, T0), locationId: 'L-TC-salon', label: 'Noche', days: [0, 2, 3, 4, 5, 6], startMin: 19 * 60, endMin: 23 * 60 + 59 }],
    tables: seats.map(([n, sector], i) => ({ id: `T-TC-${String(i + 1).padStart(2, '0')}`, ...e(b, T0), locationId: 'L-TC-salon', label: `T${i + 1}`, seats: n, sector, col: i % 4, row: Math.floor(i / 4) })),
    modifierGroups: [
      { id: 'MG-TC-racion', businessId: b, name: 'Porción', required: true, min: 1, max: 1, options: [{ id: 'tr-tapa', name: 'Tapa', deltaCents: 0 }, { id: 'tr-racion', name: 'Ración para compartir', deltaCents: ARS(3500) }] },
      { id: 'MG-TC-vermut', businessId: b, name: 'Presentación', required: true, min: 1, max: 1, options: [{ id: 'tv-soda', name: 'Con soda y naranja', deltaCents: 0 }, { id: 'tv-solo', name: 'Solo, con hielo', deltaCents: 0 }] },
    ],
    menuItems: [
      ...items(b, T0, 'cocina', [
        { id: 'TC-01', name: 'Patatas bravas', description: 'Salsa brava picante y alioli.', category: 'Lado A · para compartir', priceCents: ARS(7900), modifierGroupIds: ['MG-TC-racion'], foodNote: ok(['huevo']) },
        { id: 'TC-02', name: 'Croquetas de jamón (4)', description: 'Bechamel cremosa, rebozado fino.', category: 'Lado A · para compartir', priceCents: ARS(8400), modifierGroupIds: [], foodNote: ok(['gluten', 'lácteos', 'huevo']) },
        { id: 'TC-03', name: 'Pincho de tortilla', description: 'Jugosa, sobre pan.', category: 'Lado A · para compartir', priceCents: ARS(6800), modifierGroupIds: [], foodNote: ok(['huevo', 'gluten']) },
        { id: 'TC-04', name: 'Pan con tomate', description: 'Tostado, tomate rallado y aceite de oliva.', category: 'Lado A · para compartir', priceCents: ARS(5200), modifierGroupIds: [], foodNote: ok(['gluten']), tags: ['vegetariano'] },
        { id: 'TC-07', name: 'Aceitunas de la casa', description: 'Verdes y negras, con hierbas.', category: 'Lado A · para compartir', priceCents: ARS(3900), modifierGroupIds: [], foodNote: ok([]), tags: ['vegetariano'] },
        { id: 'TC-05', name: 'Rabas', description: 'Con limón.', category: 'Lado B · de la cocina', priceCents: ARS(11900), modifierGroupIds: [], foodNote: ok(['gluten', 'moluscos']) },
        { id: 'TC-06', name: 'Tabla de quesos y fiambres', description: 'Para tres o cuatro personas.', category: 'Lado B · de la cocina', priceCents: ARS(16900), modifierGroupIds: [], foodNote: ok(['lácteos']) },
        { id: 'TC-08', name: 'Montaditos de jamón (2)', description: 'Pan tostado y jamón crudo.', category: 'Lado B · de la cocina', priceCents: ARS(7400), modifierGroupIds: [], foodNote: ok(['gluten']) },
      ]),
      ...items(b, T0, 'barra', [
        { id: 'TC-09', name: 'Limonada con menta (sin alcohol)', description: 'Exprimida en el momento.', category: 'Bonus · sin alcohol', priceCents: ARS(4800), modifierGroupIds: [], foodNote: ok([]), tags: ['sin-alcohol'] },
        { id: 'TC-10', name: 'Jarra de limonada (sin alcohol)', description: 'Para la mesa, cuatro vasos.', category: 'Bonus · sin alcohol', priceCents: ARS(9000), modifierGroupIds: [], foodNote: ok([]), tags: ['sin-alcohol'] },
        { id: 'TC-11', name: 'Soda de pomelo (sin alcohol)', description: 'Pomelo rosado y soda.', category: 'Bonus · sin alcohol', priceCents: ARS(4200), modifierGroupIds: [], foodNote: ok([]), tags: ['sin-alcohol'] },
        { id: 'TC-12', name: 'Agua con gas (sin alcohol)', description: 'Botella individual.', category: 'Bonus · sin alcohol', priceCents: ARS(3200), modifierGroupIds: [], foodNote: ok([]), tags: ['sin-alcohol'] },
        { id: 'TC-13', name: 'Vermut de la casa', description: 'Etiqueta ficticia de muestra. Solo mayores de 18.', category: 'Con alcohol · +18', priceCents: ARS(5900), modifierGroupIds: ['MG-TC-vermut'], foodNote: ok(['sulfitos']), tags: ['+18'] },
        { id: 'TC-14', name: 'Cerveza tirada', description: 'Rubia, pinta. Solo mayores de 18.', category: 'Con alcohol · +18', priceCents: ARS(5200), modifierGroupIds: [], foodNote: ok(['gluten']), tags: ['+18'] },
      ]),
    ],
    ingredients: ings(b, T0, [
      ['I-TC-01', 'Papas', 'g', 12000, 3000],
      ['I-TC-02', 'Croquetas (unidad)', 'u', 64, 16],
      ['I-TC-03', 'Limones', 'u', 10, 12], // bajo
      ['I-TC-04', 'Pan de campo', 'u', 30, 8],
    ]),
    recipes: [
      rcp('TC-01', b, T0, [['I-TC-01', 250, 'g']]),
      rcp('TC-02', b, T0, [['I-TC-02', 4, 'u']]),
      rcp('TC-09', b, T0, [['I-TC-03', 1, 'u']]),
      rcp('TC-10', b, T0, [['I-TC-03', 3, 'u']]),
    ],
    tastingEvents: [
      { id: 'E-TC-1', ...e(b, T0), locationId: 'L-TC-salon', title: 'Noche de jazz: Trío Compás', description: 'Contrabajo, piano y saxo desde las 21:00. Se reserva la mesa; no hay entradas ni consumo mínimo.', dateKey: '2026-10-22', startMin: 21 * 60, capacity: 40, status: 'abierta', priceNote: 'Sin cobro de entrada' },
      { id: 'E-TC-2', ...e(b, T0), locationId: 'L-TC-salon', title: 'Sábado de bossa nova', description: 'Voz y guitarra en el patio. Se reserva la mesa; no hay entradas.', dateKey: '2026-10-24', startMin: 21 * 60 + 30, capacity: 40, status: 'abierta', priceNote: 'Sin cobro de entrada' },
      { id: 'E-TC-3', ...e(b, T0), locationId: 'L-TC-salon', title: 'Domingo de tapas y swing', description: 'Cuarteto de swing temprano, para ir en familia. Se reserva la mesa; no hay entradas.', dateKey: '2026-10-25', startMin: 19 * 60 + 30, capacity: 40, status: 'abierta', priceNote: 'Sin cobro de entrada' },
    ],
  }
}

// ---------------------------------------------------------------- Brasa Rápida
function brasa(T0: number): NewConfig {
  const b = 'brasa' as const
  const combo = ['MG-BR-combo', 'MG-BR-acomp', 'MG-BR-bebida', 'MG-BR-sin', 'MG-BR-pan', 'MG-BR-extras']
  const burger = ['MG-BR-sin', 'MG-BR-pan', 'MG-BR-extras']
  return {
    businesses: [{
      id: b, ...e(b, T0), name: 'Brasa Rápida', kind: 'rapida',
      tagline: 'Comida rápida · brasa a la vista',
      story: 'Hamburguesas a la parrilla, papas recién fritas y combos que se arman en tres pasos. Pedís, pagás en el mostrador y retirás con tu número.',
      reservationsEnabled: false, autoConfirmReservations: false, serviceMinutes: 20, bufferMinutes: 0, maxPartyAuto: 0, combineRules: [],
      passportPaused: false, rewardsEnabled: false, pickupPerSlot: 10,
      categoryOrder: ['Combos', 'Hamburguesas', 'Acompañamientos', 'Bebidas', 'Postres'],
      paysAtCounter: true,
    }],
    locations: [{ id: 'L-BR-centro', ...e(b, T0), name: 'Brasa Rápida · Centro', hasTables: false, pickupEnabled: true }],
    serviceWindows: [{ id: 'SW-BR-dia', ...e(b, T0), locationId: 'L-BR-centro', label: 'Mostrador', days: [0, 1, 2, 3, 4, 5, 6], startMin: 8 * 60, endMin: 23 * 60 + 30 }],
    tables: [],
    modifierGroups: [
      { id: 'MG-BR-combo', businessId: b, name: 'Tamaño del combo', required: true, min: 1, max: 1, options: [{ id: 'bc-mediano', name: 'Mediano', deltaCents: 0 }, { id: 'bc-grande', name: 'Grande', deltaCents: ARS(1800) }] },
      { id: 'MG-BR-acomp', businessId: b, name: 'Acompañamiento', required: true, min: 1, max: 1, options: [{ id: 'ba-papas', name: 'Papas', deltaCents: 0, consumes: { ingredientId: 'I-BR-04', qty: 180, unit: 'g' } }, { id: 'ba-ensalada', name: 'Ensalada', deltaCents: 0 }] },
      { id: 'MG-BR-bebida', businessId: b, name: 'Bebida (sin alcohol)', required: true, min: 1, max: 1, options: [{ id: 'bb-cola', name: 'Gaseosa línea cola', deltaCents: 0 }, { id: 'bb-agua', name: 'Agua mineral', deltaCents: 0 }, { id: 'bb-limonada', name: 'Limonada', deltaCents: ARS(600) }] },
      { id: 'MG-BR-sin', businessId: b, name: 'Sacar ingredientes (sin cargo)', required: false, min: 0, max: 4, options: [
        { id: 'bs-cebolla', name: 'Sin cebolla', deltaCents: 0 },
        { id: 'bs-pepino', name: 'Sin pepino', deltaCents: 0 },
        { id: 'bs-tomate', name: 'Sin tomate', deltaCents: 0 },
        { id: 'bs-lechuga', name: 'Sin lechuga', deltaCents: 0 },
      ] },
      { id: 'MG-BR-pan', businessId: b, name: 'Pan', required: false, min: 0, max: 1, options: [{ id: 'bp-papa', name: 'Pan de papa', deltaCents: 0 }, { id: 'bp-sintacc', name: 'Pan sin TACC (cocina compartida)', deltaCents: ARS(900) }] },
      { id: 'MG-BR-extras', businessId: b, name: 'Extras (hasta 2)', required: false, min: 0, max: 2, options: [{ id: 'be-cheddar', name: 'Doble cheddar', deltaCents: ARS(1200) }, { id: 'be-panceta', name: 'Panceta', deltaCents: ARS(1500) }] },
      { id: 'MG-BR-tamano', businessId: b, name: 'Tamaño', required: true, min: 1, max: 1, options: [{ id: 'bt-chico', name: 'Chico', deltaCents: 0 }, { id: 'bt-mediano', name: 'Mediano', deltaCents: ARS(900) }, { id: 'bt-grande', name: 'Grande', deltaCents: ARS(1700) }] },
    ],
    menuItems: [
      ...items(b, T0, 'plancha', [
        { id: 'BR-01', name: 'Combo Doble con cheddar', description: 'Doble, acompañamiento y bebida.', category: 'Combos', priceCents: ARS(15900), modifierGroupIds: combo, foodNote: ok(['gluten', 'lácteos', 'sésamo']), tags: ['favorito-casa'] },
        { id: 'BR-02', name: 'Combo Pollo crocante', description: 'Sándwich de pollo, acompañamiento y bebida.', category: 'Combos', priceCents: ARS(14400), modifierGroupIds: combo, foodNote: ok(['gluten', 'huevo', 'sésamo']) },
        { id: 'BR-03', name: 'Hamburguesa clásica', description: 'Medallón a la parrilla, cheddar, lechuga y tomate.', category: 'Hamburguesas', priceCents: ARS(8900), modifierGroupIds: burger, foodNote: ok(['gluten', 'lácteos', 'sésamo']) },
        { id: 'BR-04', name: 'Doble con cheddar', description: 'Dos medallones y cheddar derretido.', category: 'Hamburguesas', priceCents: ARS(11900), modifierGroupIds: burger, foodNote: ok(['gluten', 'lácteos', 'sésamo']) },
        { id: 'BR-05', name: 'Sándwich de pollo crocante', description: 'Pechuga rebozada, lechuga y mayonesa.', category: 'Hamburguesas', priceCents: ARS(10400), modifierGroupIds: ['MG-BR-pan', 'MG-BR-sin'], foodNote: ok(['gluten', 'huevo', 'sésamo']) },
      ]),
      ...items(b, T0, 'freidora', [
        { id: 'BR-06', name: 'Papas', description: 'Recién fritas, con sal.', category: 'Acompañamientos', priceCents: ARS(3900), modifierGroupIds: ['MG-BR-tamano'], foodNote: ok([]), tags: ['vegetariano'] },
        { id: 'BR-07', name: 'Nuggets de pollo (6)', description: 'Con salsa a elección en el mostrador.', category: 'Acompañamientos', priceCents: ARS(6200), modifierGroupIds: [], foodNote: ok(['gluten', 'huevo']) },
      ]),
      ...items(b, T0, 'armado', [
        { id: 'BR-08', name: 'Gaseosa (sin alcohol)', description: 'Línea cola, de máquina.', category: 'Bebidas', priceCents: ARS(3200), modifierGroupIds: ['MG-BR-tamano'], foodNote: ok([]), tags: ['sin-alcohol'] },
        { id: 'BR-09', name: 'Agua mineral', description: 'Botella individual.', category: 'Bebidas', priceCents: ARS(2600), modifierGroupIds: [], foodNote: ok([]), tags: ['sin-alcohol'] },
        { id: 'BR-10', name: 'Cono de helado', description: 'Crema de máquina.', category: 'Postres', priceCents: ARS(2400), modifierGroupIds: [], foodNote: ok(['lácteos', 'gluten']) },
      ]),
    ],
    ingredients: ings(b, T0, [
      ['I-BR-01', 'Medallones de carne', 'u', 96, 20],
      ['I-BR-02', 'Pan de papa', 'u', 80, 20],
      ['I-BR-03', 'Fetas de cheddar', 'u', 160, 30],
      ['I-BR-04', 'Papas', 'g', 22000, 4000],
      ['I-BR-05', 'Pechugas rebozadas', 'u', 6, 10], // baja
      ['I-BR-06', 'Nuggets (unidad)', 'u', 144, 30],
    ]),
    recipes: [
      rcp('BR-01', b, T0, [['I-BR-01', 2, 'u'], ['I-BR-02', 1, 'u'], ['I-BR-03', 2, 'u']]),
      rcp('BR-02', b, T0, [['I-BR-05', 1, 'u'], ['I-BR-02', 1, 'u']]),
      rcp('BR-03', b, T0, [['I-BR-01', 1, 'u'], ['I-BR-02', 1, 'u'], ['I-BR-03', 1, 'u']]),
      rcp('BR-04', b, T0, [['I-BR-01', 2, 'u'], ['I-BR-02', 1, 'u'], ['I-BR-03', 2, 'u']]),
      rcp('BR-05', b, T0, [['I-BR-05', 1, 'u'], ['I-BR-02', 1, 'u']]),
      rcp('BR-06', b, T0, [['I-BR-04', 180, 'g']]),
      rcp('BR-07', b, T0, [['I-BR-06', 6, 'u']]),
    ],
    tastingEvents: [],
  }
}

// ---------------------------------------------------------------- Ritual Café · clásicos de confitería
/** Café con leche, lágrima, submarino y medialuna de grasa (rellena o simple), para la merienda y el retiro con pago en el local. */
function ritualClasicos(T0: number): Pick<NewConfig, 'modifierGroups' | 'menuItems'> {
  const b = 'ritual-cafe' as const
  return {
    modifierGroups: [
      { id: 'MG-relleno', businessId: b, name: 'Relleno', required: false, min: 0, max: 1, options: [{ id: 're-simple', name: 'Simple', deltaCents: 0 }, { id: 're-jyq', name: 'Jamón y queso', deltaCents: ARS(1400) }] },
    ],
    menuItems: items(b, T0, 'barra', [
      { id: 'RC-15', name: 'Café con leche', description: 'En taza grande, como siempre.', category: 'Café de barra', priceCents: ARS(5900), modifierGroupIds: ['MG-leche'], foodNote: ok(['lácteos (según leche elegida)']) },
      { id: 'RC-16', name: 'Lágrima', description: 'Leche caliente con una gota de café.', category: 'Café de barra', priceCents: ARS(5400), modifierGroupIds: ['MG-leche'], foodNote: ok(['lácteos (según leche elegida)']) },
      { id: 'RC-17', name: 'Submarino', description: 'Leche caliente y una barra de chocolate.', category: 'Café de barra', priceCents: ARS(6300), modifierGroupIds: [], foodNote: ok(['lácteos']) },
      { id: 'RC-18', name: 'Medialuna de grasa', description: 'Salada y crocante; simple o rellena.', category: 'Pastelería', priceCents: ARS(2000), modifierGroupIds: ['MG-relleno', 'MG-calentar'], foodNote: ok(['gluten', 'lácteos (si es rellena)']) },
    ]),
  }
}

// ---------------------------------------------------------------- helpers
type ItemSeed = Pick<MenuItem, 'id' | 'name' | 'description' | 'category' | 'priceCents' | 'modifierGroupIds' | 'foodNote'> & { tags?: string[] }
function items(businessId: BusinessId, T0: number, station: Station, list: ItemSeed[]): MenuItem[] {
  return list.map((i) => ({ businessId, createdAt: T0, version: 1, imageUrl: null, soldOut: false, history: [], locationIds: null, hours: null, maxQty: 6, station, tags: i.tags ?? [], costCents: null, variableCents: null, ...i }))
}
function ings(businessId: BusinessId, T0: number, list: [string, string, 'g' | 'ml' | 'u', number, number][]): Ingredient[] {
  return list.map(([id, name, unit, onHand, low]) => ({ id, businessId, createdAt: T0, version: 1, name, unit, onHand, reserved: 0, lowThreshold: low, epoch: 0, alertState: onHand <= 0 ? 'agotado' : onHand <= low ? 'bajo' : 'ok' }))
}
function rcp(itemId: string, businessId: BusinessId, T0: number, lines: [string, number, 'g' | 'ml' | 'u' | 'kg'][]): Recipe {
  return { id: `RCP-${itemId}`, businessId, createdAt: T0, version: 1, itemId, lines: lines.map(([ingredientId, qty, unit]) => ({ ingredientId, qty, unit })) }
}

/** Todo lo nuevo de P5-L5 en un solo paquete (configuración, sin actividad). */
export function newConfig(T0: number): NewConfig {
  const parts = [copo(T0), compas(T0), brasa(T0)]
  const rc = ritualClasicos(T0)
  const cat = <K extends keyof NewConfig>(k: K) => parts.flatMap((p) => p[k] as NewConfig[K][number][]) as NewConfig[K]
  return {
    businesses: cat('businesses'),
    locations: cat('locations'),
    serviceWindows: cat('serviceWindows'),
    tables: cat('tables'),
    modifierGroups: [...rc.modifierGroups, ...cat('modifierGroups')],
    menuItems: [...rc.menuItems, ...cat('menuItems')],
    ingredients: cat('ingredients'),
    recipes: cat('recipes'),
    tastingEvents: cat('tastingEvents'),
  }
}
