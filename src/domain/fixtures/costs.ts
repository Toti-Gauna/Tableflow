import type { MenuItem, ModifierGroup } from '../types'

/**
 * P5-L6 · Costos de muestra que "cargó" cada negocio ficticio, en pesos por unidad:
 * [costo del producto (insumos), otros costos variables (envase, comisión de tarjeta, delivery propio)].
 * `null` = el negocio todavía no lo cargó (ND): las campañas que dependen de ese ítem quedan en borrador.
 * No se completan con promedios ni estimaciones: un faltante se muestra como ND.
 */
const ITEM: Record<string, [number | null, number | null]> = {
  // Mesa Clara (salón: comisión de tarjeta de muestra como variable)
  'MC-01': [4300, 380], 'MC-02': [2900, 250], 'MC-03': [3100, 290], 'MC-04': [3000, 280], 'MC-05': [7100, 510],
  'MC-06': [5200, 500], 'MC-07': [3900, 440], 'MC-08': [4700, 460], 'MC-09': [3600, 420], 'MC-10': [6000, 520],
  'MC-11': [5300, 480], 'MC-12': [6900, 560], 'MC-13': [7900, 610], 'MC-14': [6100, 520], 'MC-15': [11800, 750],
  'MC-16': [10900, 700], 'MC-17': [6400, 570], 'MC-18': [8600, 640], 'MC-19': [4900, 460], 'MC-20': [7200, 560],
  'MC-21': [13100, 800], 'MC-22': [1900, 240], 'MC-23': [2700, 260], 'MC-24': [2300, 220], 'MC-25': [1800, 230],
  'MC-26': [1100, 100], 'MC-27': [1300, 120], 'MC-28': [1700, 160],
  // Ritual Café (retiro: vaso y tapa como variable)
  'RC-01': [900, 250], 'RC-02': [1300, 250], 'RC-03': [1200, 300], 'RC-04': [1500, 300], 'RC-05': [1600, 300],
  'RC-06': [1600, 300], 'RC-07': [2100, 320], 'RC-08': [3200, 400], 'RC-09': [1800, 380], 'RC-10': [1900, 180],
  'RC-11': [600, 90], 'RC-12': [1700, 160], 'RC-13': [3600, 300], 'RC-14': [1400, 150], 'RC-15': [1600, 300],
  'RC-16': [1200, 300], 'RC-17': [2000, 300], 'RC-18': [500, 90],
  // Copo (cucurucho, vasito y pote como variable; el kilo todavía sin costo cargado)
  'CO-01': [1300, 150], 'CO-02': [1900, 150], 'CO-03': [1900, 260], 'CO-04': [2600, 420], 'CO-05': [4700, 520],
  'CO-06': [null, 700], 'CO-07': [1100, 300], 'CO-08': [1800, 320],
  // Taberna Compás (rabas y la tabla todavía sin costo cargado)
  'TC-01': [2300, 240], 'TC-02': [2900, 250], 'TC-03': [1900, 200], 'TC-04': [1300, 160], 'TC-05': [null, 360],
  'TC-06': [null, 510], 'TC-07': [1200, 120], 'TC-08': [2800, 220], 'TC-09': [1100, 140], 'TC-10': [2300, 270],
  'TC-11': [1200, 130], 'TC-12': [1100, 100], 'TC-13': [1900, 180], 'TC-14': [1700, 160],
  // Brasa Rápida (bolsa y envases como variable; los combos suman sus partes)
  'BR-01': [6200, 900], 'BR-02': [5600, 900], 'BR-03': [3400, 450], 'BR-04': [4800, 450], 'BR-05': [4100, 450],
  'BR-06': [1100, 250], 'BR-07': [2100, 250], 'BR-08': [700, 200], 'BR-09': [900, 100], 'BR-10': [600, 120],
}

/** Costo propio de extras y variantes con recargo, en pesos. `null` = ND. */
const OPTION: Record<string, number | null> = {
  'gu-papas-horno': 500, 'se-chimichurri': 150, 'se-criolla': 150, 'se-mayo': 120, 'sp-bolognesa': 450, 'sp-4quesos': 700,
  'sp-crema': 600, 'ep-queso': 250, 'ep-aceite': 120, 'ep-pan': 150,
  'ta-mediano': 250, 'le-vegetal': 300, 'ec-shot': 450, 'ec-vainilla': 150, 'ec-crema': 160, 'or-guji': 400, 're-jyq': 600,
  'hb-chocolate': 350, 'hs-chocolate': 200, 'hs-ddl': 200, 'hs-frutilla': 200,
  'tr-racion': 1400,
  'bc-grande': 600, 'bb-limonada': 300, 'bp-sintacc': null, 'be-cheddar': 450, 'be-panceta': 650, 'bt-mediano': 300, 'bt-grande': 550,
}

const cents = (v: number | null) => (v === null ? null : v * 100)

/** Aplica los costos de muestra (los ítems sin entrada quedan en ND). */
export function withItemCosts(items: MenuItem[]): MenuItem[] {
  return items.map((m) => {
    const c = ITEM[m.id]
    return c ? { ...m, costCents: cents(c[0]), variableCents: cents(c[1]) } : m
  })
}
export function withOptionCosts(groups: ModifierGroup[]): ModifierGroup[] {
  return groups.map((g) => ({ ...g, options: g.options.map((o) => (o.id in OPTION ? { ...o, costCents: cents(OPTION[o.id]) } : o)) }))
}
export const COST_ITEM_IDS = Object.keys(ITEM)
