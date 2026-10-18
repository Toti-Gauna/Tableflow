/**
 * P5-L8 · Qué se anima cuando un pedido es aceptado (o una reserva confirmada).
 *
 * Función pura: lee el pedido persistido y arma la composición a partir de su contenido real (ítems, gustos, ingredientes
 * que se sacaron, extras). La vista solo la reproduce. Reproducirla no crea, cobra ni canjea nada, y si el comando de
 * aceptación falló no hay plan: el estado sigue "enviado".
 *
 * Reglas de la coreografía (docs/tableflow/motion.md, sección P5-L8):
 * - a lo sumo MAX_LAYERS capas: lo que no entra se nombra en el cierre, no se anima;
 * - una bebida con alcohol nunca se anima (aparece solo como texto de la comanda);
 * - sin pieza de arte propia → glifo de su categoría (taza, plato, vaso, bolsa); nunca una pieza inventada.
 */
import { orderPayment } from './sessions'
import { hhmm, fmtDateShort } from './time'
import type { AppState, BusinessId, MenuItem, Order, OrderLine, Reservation } from './types'

export type MotionId = 'MO-CAF' | 'MO-HEL' | 'MO-RES' | 'MO-BAR' | 'MO-FR'
export const MOTION_OF: Record<BusinessId, MotionId> = { 'ritual-cafe': 'MO-CAF', copo: 'MO-HEL', 'mesa-clara': 'MO-RES', compas: 'MO-BAR', brasa: 'MO-FR' }

/** Glifos de respaldo cuando un ítem no tiene pieza propia. */
export type FallbackGlyph = 'cup' | 'plate' | 'glass' | 'bag'

export interface MotionLayer {
  /** Clave de pieza de arte (`pieceFor`) o `glyph:<FallbackGlyph>`. */
  key: string
  role: 'contenedor' | 'item' | 'ingrediente' | 'bocha' | 'bebida' | 'acompanamiento' | 'cubierto' | 'acabado'
  label: string
}
export type MotionMotif = 'dorado-y-vapor' | 'vapor' | 'apilar' | 'componer' | 'preparar-mesa' | 'armar-tabla' | 'llenar-vaso' | 'ensamblar' | 'ninguno'

export interface MotionTimeline {
  /** Entrada del escenario. */
  enterMs: number
  /** Desfase entre capas. */
  staggerMs: number
  /** Duración de cada capa. */
  layerMs: number
  /** Gesto propio del negocio (dorado, vapor, llenado, prensado…). */
  motifMs: number
  /** La composición se corre y entra el comprobante. */
  endingMs: number
  totalMs: number
}

export interface MotionPlan {
  id: MotionId
  businessId: BusinessId
  entity: { type: 'pedido' | 'reserva'; id: string }
  container: 'bandeja' | 'cucurucho' | 'vasito' | 'pote' | 'loza' | 'mantel' | 'tabla' | 'barra' | 'bolsa'
  layers: MotionLayer[]
  motif: MotionMotif
  ending: { kind: 'ticket' | 'comprobante' | 'comanda' | 'folio' | 'numero'; title: string; number: string; lines: string[]; payNote: string | null }
  /** Lo que está en el pedido pero no se anima, con el motivo (alcohol, sin lugar, sin pieza). */
  omitted: string[]
  /** Descripción para lectores de pantalla (la animación es decorativa; el comprobante es texto real). */
  label: string
  timeline: MotionTimeline
}

export const MAX_LAYERS = 10
export const TIMING = { enterMs: 200, staggerMs: 140, layerMs: 320, motifMs: 400, endingMs: 500 } as const
/** Cota de la pieza completa: entre 1 y 3 segundos, como pide el lote. */
export const MOTION_BOUNDS = { minMs: 1000, maxMs: 3000 } as const

export function timelineFor(nLayers: number, motif: MotionMotif): MotionTimeline {
  const n = Math.max(1, Math.min(MAX_LAYERS, nLayers))
  const motifMs = motif === 'ninguno' ? 0 : TIMING.motifMs
  const totalMs = TIMING.enterMs + (n - 1) * TIMING.staggerMs + TIMING.layerMs + motifMs + TIMING.endingMs
  return { ...TIMING, motifMs, totalMs }
}

/** El pedido llegó a la aceptación (o más allá) sin caerse: solo entonces hay animación transaccional. */
export const ACCEPTED: Order['status'][] = ['aceptado', 'en_preparacion', 'listo', 'servido', 'retirado', 'cerrado']

const glyph = (g: FallbackGlyph) => `glyph:${g}`
// el vino de Mesa Clara no tiene la etiqueta +18 (es del catálogo de P2): se reconoce también por su descripción
const isAlcohol = (m: MenuItem | undefined) => !!m && (m.tags.includes('+18') || /alcohol · \+18/i.test(m.category) || /mayores de 18/i.test(m.description))
const qtyName = (l: OrderLine) => `${l.qty}× ${l.name}`
const sel = (l: OrderLine, optionId: string) => l.selections.some((x) => x.optionId === optionId)
const expand = <T,>(l: OrderLine, f: () => T, cap = 2): T[] => Array.from({ length: Math.min(l.qty, cap) }, f)

function finish(
  base: Omit<MotionPlan, 'timeline' | 'label' | 'omitted' | 'layers'> & { layers: MotionLayer[]; omitted?: string[] },
): MotionPlan {
  const omitted = [...(base.omitted ?? [])]
  let layers = base.layers
  if (layers.length > MAX_LAYERS) {
    const rest = layers.slice(MAX_LAYERS)
    omitted.push(`sin lugar en la animación: ${rest.map((x) => x.label).join(', ')} (figura en el comprobante)`)
    layers = layers.slice(0, MAX_LAYERS)
  }
  const motif = layers.length ? base.motif : 'ninguno'
  if (!layers.length) layers = [{ key: glyph(base.container === 'bolsa' ? 'bag' : 'plate'), role: 'item', label: 'Tu pedido' }]
  const shown = layers.filter((x) => x.role !== 'contenedor' && x.role !== 'cubierto' && x.role !== 'acabado').map((x) => x.label)
  const label = `Animación: ${shown.length ? shown.join(', ') : 'tu pedido'} → ${base.ending.title} ${base.ending.number}${base.ending.payNote ? `, ${base.ending.payNote.toLowerCase()}` : ''}.`
  return { ...base, layers, motif, omitted, label, timeline: timelineFor(layers.length, motif) }
}

function payNote(s: AppState, o: Order): string | null {
  const p = orderPayment(s, o)
  return p.state === 'pendiente-local' ? 'Pago en el local pendiente' : null
}
function placeOf(s: AppState, o: Order): string {
  if (o.kind === 'retiro') return o.pickupCode
  const ses = s.tableSessions.find((x) => x.id === o.sessionId)
  const labels = ses?.tableIds.map((t) => s.tables.find((x) => x.id === t)?.label).filter(Boolean) ?? []
  return labels.length ? `Mesa ${labels.join('+')}` : 'Mesa'
}

// ------------------------------------------------------------------ café: taza + medialunas, dorado y vapor
const CAFE_CUP = new Set(['Café de barra', 'Métodos'])
const CAFE_BAKE = new Set(['Pastelería', 'Salado'])
const MEDIALUNAS = new Set(['RC-11', 'RC-18'])
const COLD = new Set(['RC-09'])
function cafePlan(s: AppState, o: Order, item: (id: string) => MenuItem | undefined): Omit<MotionPlan, 'timeline' | 'label'> {
  const cups: MotionLayer[] = []
  const bakes: MotionLayer[] = []
  const other: MotionLayer[] = []
  for (const l of o.lines) {
    const m = item(l.itemId)
    if (m && CAFE_CUP.has(m.category)) cups.push(...expand(l, () => ({ key: l.itemId, role: 'bebida' as const, label: l.name })))
    else if (m && CAFE_BAKE.has(m.category)) bakes.push(...expand(l, () => ({ key: l.itemId, role: 'item' as const, label: l.name })))
    else other.push({ key: glyph('cup'), role: 'item', label: l.name })
  }
  const hot = cups.some((c) => !COLD.has(c.key))
  const hasMedialuna = bakes.some((b) => MEDIALUNAS.has(b.key))
  const finishLayer: MotionLayer[] = hasMedialuna ? [{ key: 'acabado:dorado', role: 'acabado', label: 'dorado de la medialuna' }] : []
  return {
    id: 'MO-CAF',
    businessId: o.businessId,
    entity: { type: 'pedido', id: o.id },
    container: 'bandeja',
    layers: [...bakes.slice(0, 3), ...finishLayer, ...cups.slice(0, 3), ...other],
    motif: hasMedialuna && hot ? 'dorado-y-vapor' : hot ? 'vapor' : hasMedialuna ? 'dorado-y-vapor' : 'ninguno',
    ending: { kind: 'ticket', title: o.kind === 'retiro' ? 'Ticket N.º' : 'Pedido en', number: placeOf(s, o), lines: o.lines.map(qtyName), payNote: payNote(s, o) },
    omitted: [...(cups.length > 3 ? [`${cups.length - 3} bebida(s) más (figuran en el ticket)`] : []), ...(bakes.length > 3 ? [`${bakes.length - 3} de pastelería más (figuran en el ticket)`] : [])],
  }
}

// ------------------------------------------------------------------ heladería: las bochas elegidas se apilan en su formato
const FORMAT: Record<string, MotionPlan['container']> = { 'CO-01': 'cucurucho', 'CO-02': 'cucurucho', 'CO-03': 'vasito', 'CO-04': 'pote', 'CO-05': 'pote', 'CO-06': 'pote' }
function heladoPlan(s: AppState, o: Order): Omit<MotionPlan, 'timeline' | 'label'> {
  const main = o.lines.find((l) => FORMAT[l.itemId])
  const container = main ? FORMAT[main.itemId] : 'pote'
  const scoops: MotionLayer[] = (main?.selections ?? [])
    .filter((x) => x.optionId.startsWith('hg-'))
    .map((x) => ({ key: `H-bacha-${x.optionId.slice(3)}`, role: 'bocha' as const, label: x.optionName }))
  const toppings: MotionLayer[] = (main?.selections ?? [])
    .filter((x) => x.groupId === 'MG-CO-bano' || x.groupId === 'MG-CO-salsa')
    .map((x) => ({ key: `acabado:${x.optionId}`, role: 'acabado' as const, label: x.optionName }))
  const extras: MotionLayer[] = o.lines.filter((l) => l !== main).map((l) => ({ key: l.itemId === 'CO-08' ? glyph('glass') : glyph('cup'), role: l.itemId === 'CO-08' ? 'bebida' : 'item', label: l.name }))
  const flavors = scoops.map((x) => x.label)
  return {
    id: 'MO-HEL',
    businessId: o.businessId,
    entity: { type: 'pedido', id: o.id },
    container,
    layers: [{ key: `contenedor:${container}`, role: 'contenedor', label: container }, ...scoops.slice(0, 4), ...toppings, ...extras],
    motif: scoops.length ? 'apilar' : 'ninguno',
    ending: {
      kind: 'comprobante',
      title: 'Comprobante N.º',
      number: placeOf(s, o),
      lines: o.lines.map((l) => (l === main && flavors.length ? `${qtyName(l)}: ${flavors.join(', ')}` : qtyName(l))),
      payNote: payNote(s, o),
    },
    omitted: o.lines.filter((l) => FORMAT[l.itemId] && l !== main).map((l) => `${l.name}: se arma el primer formato; los demás figuran en el comprobante`),
  }
}

// ------------------------------------------------------------------ restaurante: el plato se compone (o la mesa se prepara)
const MAIN_CATS = ['Minutas y carnes', 'Pastas', 'Pescados', 'Entradas']
function restoPlan(s: AppState, o: Order, item: (id: string) => MenuItem | undefined, has: (k: string) => boolean): Omit<MotionPlan, 'timeline' | 'label'> {
  const omitted: string[] = []
  const lines = o.lines.filter((l) => {
    if (isAlcohol(item(l.itemId))) {
      omitted.push(`${l.name}: con alcohol, no se anima (figura en la comanda)`)
      return false
    }
    return true
  })
  const main = [...lines].sort((a, b) => rank(item(a.itemId)) - rank(item(b.itemId)))[0]
  const rest = lines.filter((l) => l !== main)
  const pieceOr = (l: OrderLine, g: FallbackGlyph) => (has(l.itemId) ? l.itemId : glyph(g))
  return {
    id: 'MO-RES',
    businessId: o.businessId,
    entity: { type: 'pedido', id: o.id },
    container: 'loza',
    layers: [
      { key: 'contenedor:loza', role: 'contenedor', label: 'plato' },
      ...(main ? [{ key: pieceOr(main, 'plate'), role: 'item' as const, label: main.name }] : []),
      ...rest.slice(0, 3).map((l) => ({ key: pieceOr(l, item(l.itemId)?.category === 'Bebidas' ? 'glass' : 'plate'), role: item(l.itemId)?.category === 'Bebidas' ? ('bebida' as const) : ('item' as const), label: l.name })),
      { key: 'cubierto:tenedor-cuchillo', role: 'cubierto', label: 'cubiertos' },
    ],
    motif: 'componer',
    ending: { kind: 'comanda', title: `Comanda ${o.ticketId} ·`, number: placeOf(s, o), lines: o.lines.map(qtyName), payNote: payNote(s, o) },
    omitted: [...omitted, ...(rest.length > 3 ? [`${rest.length - 3} plato(s) más (figuran en la comanda)`] : [])],
  }
  function rank(m: MenuItem | undefined) {
    const i = m ? MAIN_CATS.indexOf(m.category) : -1
    return i < 0 ? 99 : i
  }
}

// ------------------------------------------------------------------ bar: tabla de tapas o bebida sin alcohol que se arma
const TAPAS = /^Lado [AB]/
function barPlan(s: AppState, o: Order, item: (id: string) => MenuItem | undefined, has: (k: string) => boolean): Omit<MotionPlan, 'timeline' | 'label'> {
  const omitted: string[] = []
  const tapas: MotionLayer[] = []
  const drinks: MotionLayer[] = []
  for (const l of o.lines) {
    const m = item(l.itemId)
    if (isAlcohol(m)) {
      omitted.push(`${l.name}: con alcohol, no se anima (figura en la comanda)`)
      continue
    }
    if (m && TAPAS.test(m.category)) tapas.push({ key: has(l.itemId) ? l.itemId : glyph('plate'), role: 'item', label: l.name })
    else drinks.push({ key: has(l.itemId) ? l.itemId : glyph('glass'), role: 'bebida', label: l.name })
  }
  const container: MotionPlan['container'] = tapas.length ? 'tabla' : 'barra'
  return {
    id: 'MO-BAR',
    businessId: o.businessId,
    entity: { type: 'pedido', id: o.id },
    container,
    layers: [...(tapas.length ? [{ key: 'contenedor:tabla', role: 'contenedor' as const, label: 'tabla' }] : []), ...tapas.slice(0, 5), ...drinks.slice(0, 2)],
    motif: tapas.length ? 'armar-tabla' : drinks.length ? 'llenar-vaso' : 'ninguno',
    ending: { kind: 'comanda', title: `Comanda ${o.ticketId} ·`, number: o.kind === 'mesa' ? placeOf(s, o) : `Barra ${o.pickupCode}`, lines: o.lines.map(qtyName), payNote: payNote(s, o) },
    omitted: [...omitted, ...(tapas.length > 5 ? [`${tapas.length - 5} tapa(s) más (figuran en la comanda)`] : [])],
  }
}

// ------------------------------------------------------------------ rápida: los ingredientes reales del combo se ensamblan
const STACK: Record<string, string[]> = {
  'BR-03': ['pan-abajo', 'carne', 'lechuga', 'tomate', 'cebolla', 'pepino', 'pan-arriba'],
  'BR-04': ['pan-abajo', 'carne', 'queso', 'carne', 'queso', 'cebolla', 'pepino', 'pan-arriba'],
}
const COMBO_BURGER: Record<string, string> = { 'BR-01': 'BR-04', 'BR-02': 'BR-05' }
const ING_LABEL: Record<string, string> = { 'pan-abajo': 'pan', 'pan-arriba': 'tapa del pan', carne: 'medallón', queso: 'cheddar', lechuga: 'lechuga', tomate: 'tomate', cebolla: 'cebolla', pepino: 'pepino' }
const SIDE: Record<string, { key: string; label: string }> = { 'ba-papas': { key: 'BR-06', label: 'papas' }, 'ba-ensalada': { key: glyph('plate'), label: 'ensalada' } }
const DRINK: Record<string, { key: string; label: string }> = { 'bb-cola': { key: 'BR-08', label: 'gaseosa' }, 'bb-agua': { key: 'BR-09', label: 'agua' }, 'bb-limonada': { key: glyph('glass'), label: 'limonada' } }
function rapidaPlan(s: AppState, o: Order, has: (k: string) => boolean): Omit<MotionPlan, 'timeline' | 'label'> {
  const omitted: string[] = []
  const layers: MotionLayer[] = []
  const burgerLine = o.lines.find((l) => STACK[l.itemId] || STACK[COMBO_BURGER[l.itemId]] || l.itemId === 'BR-05' || l.itemId === 'BR-02')
  if (burgerLine) {
    const burger = COMBO_BURGER[burgerLine.itemId] ?? burgerLine.itemId
    const stack = STACK[burger]
    if (stack) {
      const without = new Set(burgerLine.selections.filter((x) => x.optionId.startsWith('bs-')).map((x) => x.optionId.slice(3)))
      let ing = stack.filter((k) => !without.has(k))
      if (sel(burgerLine, 'be-cheddar')) ing = [...ing.slice(0, -1), 'queso', ing[ing.length - 1]]
      if (sel(burgerLine, 'be-panceta')) omitted.push('panceta: sin pieza de arte, figura en el número')
      if (without.size) omitted.push(`sin ${[...without].join(', ')}: no se dibuja`)
      layers.push(...ing.map((k) => ({ key: `jg-rapida-${k}`, role: 'ingrediente' as const, label: ING_LABEL[k] })))
    } else {
      layers.push({ key: has(burger) ? burger : glyph('bag'), role: 'item', label: burgerLine.name })
    }
    for (const x of burgerLine.selections) {
      if (SIDE[x.optionId]) layers.push({ key: SIDE[x.optionId].key, role: 'acompanamiento', label: SIDE[x.optionId].label })
      if (DRINK[x.optionId]) layers.push({ key: DRINK[x.optionId].key, role: 'bebida', label: DRINK[x.optionId].label })
    }
  }
  for (const l of o.lines) {
    if (l === burgerLine) continue
    layers.push({ key: has(l.itemId) ? l.itemId : glyph('bag'), role: l.itemId === 'BR-08' || l.itemId === 'BR-09' ? 'bebida' : 'acompanamiento', label: l.name })
  }
  return {
    id: 'MO-FR',
    businessId: o.businessId,
    entity: { type: 'pedido', id: o.id },
    container: 'bolsa',
    layers,
    motif: layers.some((x) => x.role === 'ingrediente') ? 'ensamblar' : layers.length ? 'componer' : 'ninguno',
    ending: { kind: 'numero', title: 'Número de retiro', number: o.pickupCode, lines: o.lines.map(qtyName), payNote: payNote(s, o) },
    omitted,
  }
}

/**
 * Plan de la animación de aceptación de un pedido, o null si no corresponde (todavía enviado, rechazado o cancelado).
 * `has` dice si existe una pieza de arte para una clave; se inyecta para que el dominio no dependa de la UI.
 */
export function orderMotionPlan(s: AppState, o: Order, has: (key: string) => boolean): MotionPlan | null {
  if (!ACCEPTED.includes(o.status)) return null
  const item = (id: string) => s.menuItems.find((m) => m.id === id)
  const base =
    o.businessId === 'ritual-cafe' ? cafePlan(s, o, item)
    : o.businessId === 'copo' ? heladoPlan(s, o)
    : o.businessId === 'mesa-clara' ? restoPlan(s, o, item, has)
    : o.businessId === 'compas' ? barPlan(s, o, item, has)
    : rapidaPlan(s, o, has)
  return finish(base)
}

/** MO-RES para una reserva confirmada de Mesa Clara: la mesa se prepara para la cantidad de personas y termina en el folio. */
export function reservationMotionPlan(s: AppState, r: Reservation): MotionPlan | null {
  if (r.businessId !== 'mesa-clara') return null
  if (r.status !== 'confirmada') return null
  const n = Math.min(r.party, 6)
  const table = s.tables.find((t) => t.id === r.tableId)
  const layers: MotionLayer[] = [
    { key: 'contenedor:mantel', role: 'contenedor', label: 'mantel' },
    ...Array.from({ length: n }, () => ({ key: 'mesa:cubierto', role: 'cubierto' as const, label: 'lugar' })),
    { key: 'mesa:panera', role: 'item', label: 'panera' },
  ]
  return finish({
    id: 'MO-RES',
    businessId: r.businessId,
    entity: { type: 'reserva', id: r.id },
    container: 'mantel',
    layers,
    motif: 'preparar-mesa',
    ending: { kind: 'folio', title: 'Reserva', number: r.id, lines: [`${fmtDateShort(r.dateKey)} a las ${hhmm(r.startMin)}`, `${r.party} ${r.party === 1 ? 'persona' : 'personas'}`, ...(table ? [`Mesa ${table.label}`] : [])], payNote: null },
    omitted: r.party > 6 ? [`se preparan 6 lugares de ${r.party} (el resto figura en el folio)`] : [],
  })
}
