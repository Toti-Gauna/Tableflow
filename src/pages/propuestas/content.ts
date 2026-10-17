import { buildMenu } from '../../domain/fixtures/catalog'
import { fmtARS } from '../../domain/money'
import type { PzBiz } from './concepts'

// Contenido que muestran las propuestas. Café y restaurante salen del fixture real (buildMenu);
// heladería, bar y comida rápida son contenido PROVISIONAL de L2, ficticio, que L5 convierte en fixtures.

export interface PzItem { name: string; desc: string; price: string; tag?: string; state?: 'pocas' | 'agotado' }
export interface PzOption { label: string; extra?: string; on?: boolean; off?: boolean }
export interface PzContent {
  rubro: string
  name: string
  tagline: string
  nav: string[]
  hero: { eyebrow: string; title: string; sub: string; cta: string; cta2: string }
  section: string
  items: PzItem[]
  config: { title: string; groups: { label: string; options: PzOption[] }[]; total: string; add: string }
  agenda?: { day: string; title: string; time: string }[]
  ticket: { code: string; title: string; lines: string[]; station: string; status: string; note: string }
  rows: [string, string, string, string][]
  tabs: string[]
  provisional: boolean
}

const menu = buildMenu()
const item = (id: string): PzItem => {
  const m = menu.find((x) => x.id === id)
  if (!m) throw new Error(`Ítem ${id} no existe en el fixture`)
  return { name: m.name, desc: m.description, price: menuPrice(m.priceCents) }
}
/** Precio de carta sin ",00", igual que fmtMenu de la app; los totales usan fmtARS completo. */
const menuPrice = (cents: number) => fmtARS(cents).replace(/,00$/, '')
const ars = (n: number) => menuPrice(n * 100)

export const CONTENT: Record<PzBiz, PzContent> = {
  cafe: {
    rubro: 'Café de especialidad', name: 'Ritual Café', tagline: 'Barra y vitrina',
    nav: ['Carta', 'Métodos', 'Catas', 'Mi pedido'],
    hero: { eyebrow: 'Hoy en la barra · Etiopía Guji', title: 'Café de origen, mañanas lentas.', sub: 'Elegí método, tamaño y leche. Lo pedís para retirar y pagás en el local.', cta: 'Pedir para retirar', cta2: 'Ver métodos' },
    section: 'Café y pastelería',
    items: [{ ...item('RC-04'), tag: 'Más pedido' }, { ...item('RC-11'), tag: 'Del día' }, item('RC-07'), { ...item('RC-10'), state: 'pocas' }],
    config: {
      title: 'Flat white',
      groups: [
        { label: 'Tamaño', options: [{ label: 'Chico' }, { label: 'Mediano', extra: '+ $ 800', on: true }] },
        { label: 'Leche', options: [{ label: 'Entera' }, { label: 'Descremada' }, { label: 'Vegetal (avena)', extra: '+ $ 700', on: true }] },
        { label: 'Acompañar', options: [{ label: '2 medialunas de manteca', extra: '+ $ 4.400', on: true }] },
      ],
      total: fmtARS(580000 + 80000 + 70000 + 2 * 220000), add: 'Agregar · retiro y pago en local',
    },
    ticket: { code: 'R-014', title: 'Retiro 10:30', lines: ['1× Flat white mediano · avena', '2× Medialuna de manteca'], station: 'Barra', status: 'Aceptado', note: 'Pago en local pendiente' },
    rows: [['R-014', 'Flat white + 2 medialunas', 'Aceptado', '10:30'], ['R-013', 'V60 filtrado', 'En preparación', '10:15'], ['R-012', 'Cortado', 'Listo', '10:05']],
    tabs: ['Inicio', 'Carta', 'Pedido', 'Catas'], provisional: false,
  },
  resto: {
    rubro: 'Bodegón contemporáneo', name: 'Mesa Clara', tagline: 'Cocina de casa',
    nav: ['Carta', 'Reservar', 'Pizarra', 'Mi pedido'],
    hero: { eyebrow: 'Salón y terraza · desde las 12:00', title: 'Comida de casa, mesa larga.', sub: 'Pastas amasadas cada mañana, minutas y parrilla. Reservá o pedí desde la mesa.', cta: 'Ver la carta', cta2: 'Reservar mesa' },
    section: 'Pizarra del día',
    items: [{ ...item('MC-06'), tag: 'Casera' }, item('MC-12'), item('MC-01'), { ...item('MC-22'), tag: 'Postre' }],
    config: {
      title: 'Sorrentinos de jamón y queso',
      groups: [
        { label: 'Salsa (obligatoria)', options: [{ label: 'Fileto', on: true }, { label: 'Bolognesa' }, { label: 'Cuatro quesos' }, { label: 'Crema y champiñones' }] },
        { label: 'Extras', options: [{ label: 'Queso rallado extra' }, { label: 'Pan de campo', extra: '+ $ 500', on: true }] },
      ],
      total: fmtARS(1650000 + 50000), add: 'Agregar al pedido de la mesa',
    },
    ticket: { code: 'C-0123', title: 'Mesa 4 · 3 personas', lines: ['1× Sorrentinos · fileto', '1× Milanesa de ternera · papas fritas', '1× Provoleta a la parrilla'], station: 'Cocina', status: 'En preparación', note: 'Una nota: sin orégano en la provoleta' },
    rows: [['Mesa 4', 'Sorrentinos, milanesa, provoleta', 'En preparación', '13:10'], ['Mesa 7', 'Bife de chorizo', 'Servido', '12:55'], ['R-019', 'Reserva · 4 personas', 'Confirmada', '21:45']],
    tabs: ['Inicio', 'Carta', 'Reservar', 'Pedido'], provisional: false,
  },
  hela: {
    rubro: 'Heladería artesanal', name: 'Copo', tagline: 'Helado del día',
    nav: ['Gustos', 'Formatos', 'Para llevar', 'Mi pedido'],
    hero: { eyebrow: 'Gustos del día · 24 en la vitrina', title: 'Elegí tus gustos, armamos tu helado.', sub: 'Cucurucho, vasito o por kilo. Retirás en el mostrador o te lo enviamos (simulado).', cta: 'Armar mi helado', cta2: 'Ver gustos' },
    section: 'Gustos de hoy',
    items: [
      { name: 'Dulce de leche granizado', desc: 'Con chocolate amargo en hebras.', price: 'Clásico', tag: 'Más pedido' },
      { name: 'Pistacho', desc: 'Pasta pura, sin colorantes.', price: 'Premium', state: 'pocas' },
      { name: 'Frutilla al agua', desc: 'Sin lácteos.', price: 'Al agua' },
      { name: 'Maracuyá', desc: 'Ácido y fresco.', price: 'Al agua', state: 'agotado' },
    ],
    config: {
      title: '¼ kg · hasta 3 gustos',
      groups: [
        { label: 'Formato', options: [{ label: 'Cucurucho · 2 gustos' }, { label: '¼ kg · 3 gustos', on: true }, { label: '½ kg · 4 gustos' }, { label: '1 kg · 4 gustos' }] },
        { label: 'Gustos (3 de 3)', options: [{ label: 'Dulce de leche granizado', on: true }, { label: 'Pistacho', on: true }, { label: 'Frutilla al agua', on: true }, { label: 'Maracuyá · agotado', off: true }] },
        { label: 'Extras', options: [{ label: 'Salsa de frutos rojos', extra: '+ $ 700' }] },
      ],
      total: fmtARS(680000), add: 'Agregar · retiro en mostrador',
    },
    ticket: { code: 'H-007', title: 'Retiro 16:20', lines: ['¼ kg: dulce de leche granizado, pistacho, frutilla al agua'], station: 'Mostrador', status: 'Aceptado', note: 'Pago en local pendiente' },
    rows: [['H-007', '¼ kg · 3 gustos', 'Aceptado', '16:20'], ['H-006', 'Cucurucho · 2 gustos', 'Listo', '16:10'], ['Bacha', 'Pistacho · queda poco', 'Reponer', '—']],
    tabs: ['Inicio', 'Gustos', 'Pedido', 'Familia'], provisional: true,
  },
  bar: {
    rubro: 'Bar gastronómico', name: 'Taberna Compás', tagline: 'Tapas y música en vivo',
    nav: ['Carta', 'Agenda', 'Reservar', 'Mi pedido'],
    hero: { eyebrow: 'Esta semana · tres noches en vivo', title: 'Tapas para compartir, música para quedarse.', sub: 'Reservá mesa para tu grupo y pedí desde la mesa o la barra. Sin entradas: la música viene con la cena.', cta: 'Reservar para el jueves', cta2: 'Ver la carta' },
    section: 'Para compartir',
    items: [
      { name: 'Patatas bravas', desc: 'Salsa picante de la casa y alioli.', price: ars(7800), tag: 'Para el centro' },
      { name: 'Croquetas de jamón (4)', desc: 'Bechamel cremosa, rebozado fino.', price: ars(8900) },
      { name: 'Tortilla española', desc: 'Jugosa, con cebolla.', price: ars(9500) },
      { name: 'Limonada de jengibre', desc: 'Sin alcohol, para la jarra del grupo.', price: ars(4900), tag: 'Sin alcohol' },
    ],
    agenda: [{ day: 'Jue 22', title: 'Trío de jazz', time: '21:30' }, { day: 'Vie 23', title: 'Bossa y vinilos', time: '22:00' }, { day: 'Sáb 24', title: 'Tango de cámara', time: '21:00' }],
    config: {
      title: 'Mesa para el jueves · Trío de jazz',
      groups: [
        { label: 'Personas', options: [{ label: '2' }, { label: '4' }, { label: '6', on: true }, { label: '8 o más · lo revisa el equipo' }] },
        { label: 'Sector', options: [{ label: 'Frente al escenario', on: true }, { label: 'Barra' }, { label: 'Patio' }] },
      ],
      total: 'Sin cargo de reserva', add: 'Solicitar reserva',
    },
    ticket: { code: 'C-0441', title: 'Mesa 9 · 6 personas', lines: ['1× Patatas bravas', '2× Croquetas de jamón', '1× Jarra de limonada de jengibre'], station: 'Cocina de barra · Barra', status: 'Aceptado', note: 'Cuenta del grupo abierta' },
    rows: [['Mesa 9', 'Bravas, croquetas ×2, limonada', 'Aceptado', '21:40'], ['R-031', 'Jue 22 · 6 personas · escenario', 'Solicitada', '21:30'], ['Barra', 'Tortilla española', 'Listo', '21:35']],
    tabs: ['Inicio', 'Carta', 'Agenda', 'Pedido'], provisional: true,
  },
  rapida: {
    rubro: 'Comida rápida', name: 'Brasa Rápida', tagline: 'Combos al paso',
    nav: ['Combos', 'Sándwiches', 'Papas', 'Mi pedido'],
    hero: { eyebrow: 'Retiro en 12 minutos', title: 'Tu combo, a tu manera.', sub: 'Elegí tamaño, sacá lo que no va y retirá con tu número.', cta: 'Armar combo', cta2: 'Repetir mi último pedido' },
    section: 'Combos',
    items: [
      { name: 'Combo Brasa', desc: 'Doble cheddar, papas y bebida.', price: ars(14900), tag: 'Nº 1' },
      { name: 'Combo Pollo crispy', desc: 'Pollo rebozado, papas y bebida.', price: ars(13200), tag: 'Nº 2' },
      { name: 'Combo Verde', desc: 'Medallón de garbanzos, ensalada y bebida.', price: ars(12400), tag: 'Nº 3' },
      { name: 'Papas cheddar y panceta', desc: 'Porción grande para compartir.', price: ars(6900), state: 'pocas' },
    ],
    config: {
      title: 'Combo Brasa',
      groups: [
        { label: 'Tamaño', options: [{ label: 'Simple' }, { label: 'Doble', on: true }, { label: 'Triple', extra: '+ $ 3.000' }] },
        { label: 'Sacar', options: [{ label: 'Sin cebolla', on: true }, { label: 'Sin pepinos' }, { label: 'Sin salsa' }] },
        { label: 'Cambiar', options: [{ label: 'Papas → ensalada' }, { label: 'Bebida sin azúcar', on: true }] },
      ],
      total: fmtARS(1490000), add: 'Agregar · retiro con número',
    },
    ticket: { code: '#047', title: 'Retiro', lines: ['1× Combo Brasa doble · sin cebolla', 'Bebida sin azúcar'], station: 'Plancha · Freidora · Armado', status: 'En preparación', note: 'Pago en local pendiente' },
    rows: [['#047', 'Combo Brasa doble', 'En preparación', '12:41'], ['#046', 'Combo Verde', 'Listo', '12:39'], ['#045', 'Papas cheddar', 'Entregado', '12:36']],
    tabs: ['Inicio', 'Combos', 'Pedido', 'Familia'], provisional: true,
  },
}
