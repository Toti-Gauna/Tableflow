import type { AppState, GiftStatus, OrderStatus, ReservationStatus, Role, Station } from '../domain/types'

export type Tone = 'ok' | 'warn' | 'err' | 'info' | 'neutral' | 'review'
export interface Label {
  label: string
  tone: Tone
  icon: string
}

export const GIFT_LABEL: Record<GiftStatus, Label> = {
  enviado: { label: 'Sin abrir', tone: 'info', icon: '✉' },
  abierto: { label: 'Abierta · sin canjear', tone: 'warn', icon: '◔' },
  canjeado: { label: 'Canjeada', tone: 'ok', icon: '✓' },
  cancelado: { label: 'Cancelada', tone: 'err', icon: '✕' },
  vencido: { label: 'Vencida', tone: 'neutral', icon: '⌛' },
}

export const RES_LABEL: Record<ReservationStatus, Label> = {
  borrador: { label: 'Borrador', tone: 'neutral', icon: '✎' },
  solicitada: { label: 'Solicitada', tone: 'warn', icon: '◔' },
  confirmada: { label: 'Confirmada', tone: 'ok', icon: '✓' },
  alternativa_ofrecida: { label: 'Alternativa ofrecida', tone: 'info', icon: '⇄' },
  revision_humana: { label: 'Revisión humana', tone: 'review', icon: '⚑' },
  llegada: { label: 'Llegó', tone: 'info', icon: '➜' },
  sentada: { label: 'Sentada', tone: 'ok', icon: '◉' },
  completada: { label: 'Completada', tone: 'neutral', icon: '✔' },
  cancelada: { label: 'Cancelada', tone: 'err', icon: '✕' },
  no_show: { label: 'No-show', tone: 'err', icon: '∅' },
}
export const ORDER_LABEL: Record<OrderStatus, Label> = {
  enviado: { label: 'Enviado', tone: 'warn', icon: '◔' },
  aceptado: { label: 'Aceptado', tone: 'info', icon: '✓' },
  en_preparacion: { label: 'En preparación', tone: 'info', icon: '♨' },
  listo: { label: 'Listo', tone: 'ok', icon: '★' },
  servido: { label: 'Servido', tone: 'ok', icon: '✔' },
  retirado: { label: 'Retirado', tone: 'ok', icon: '✔' },
  cerrado: { label: 'Cerrado', tone: 'neutral', icon: '■' },
  rechazado: { label: 'Rechazado', tone: 'err', icon: '✕' },
  cancelado: { label: 'Cancelado', tone: 'err', icon: '✕' },
}

export const ROLE_LABEL: Record<Role, string> = {
  'cliente-invitado': 'Cliente invitado',
  'cliente-recurrente': 'Cliente recurrente (Ana)',
  recepcion: 'Recepción / anfitrión',
  mozo: 'Mozo',
  cocina: 'Cocina / barra',
  caja: 'Caja',
  encargado: 'Encargado',
}
/** Qué muestra cada rol (selector de bienvenida y dock). Son vistas de la demo, no permisos. */
export const ROLE_DESC: Record<Role, string> = {
  'cliente-invitado': 'Mirá la carta, armá un pedido o reservá como alguien que entra por primera vez.',
  'cliente-recurrente': 'Volvé como Ana: pasaporte con sellos, historial y selección guardada.',
  recepcion: 'Confirmá reservas, ubicá mesas en el salón y atendé la lista de espera.',
  mozo: 'El salón mesa por mesa: pedidos, cuentas y platos listos para llevar.',
  cocina: 'Las comandas en tablero: aceptar, preparar y marcar listo.',
  caja: 'Abrí la caja, dividí cuentas y registrá pagos de demostración.',
  encargado: 'El día completo: resumen, stock, reportes y automatizaciones.',
}
export const isClientRole = (r: Role) => r === 'cliente-invitado' || r === 'cliente-recurrente'

export interface AdminSection {
  /** Rótulo corto para la barra inferior móvil. */
  short?: string
  key: string
  label: string
  roles: Role[]
}
export const ADMIN_SECTIONS: AdminSection[] = [
  { key: 'resumen', label: 'Resumen', roles: ['encargado', 'recepcion'] },
  { key: 'reservas', label: 'Reservas', roles: ['recepcion', 'encargado'] },
  { key: 'salon', label: 'Salón', roles: ['recepcion', 'mozo', 'encargado'] },
  { key: 'pedidos', label: 'Pedidos', roles: ['recepcion', 'mozo', 'caja', 'encargado'] },
  { key: 'cocina', label: 'Cocina / barra', short: 'Cocina', roles: ['cocina', 'encargado'] },
  { key: 'caja', label: 'Caja', roles: ['caja', 'encargado'] },
  { key: 'carta', label: 'Carta', roles: ['encargado'] },
  { key: 'stock', label: 'Stock', roles: ['cocina', 'encargado'] },
  { key: 'clientes', label: 'Clientes', roles: ['recepcion', 'encargado'] },
  { key: 'regalos', label: 'Regalos', roles: ['recepcion', 'caja', 'encargado'] },
  { key: 'campanas', label: 'Campañas', roles: ['encargado'] },
  { key: 'costos', label: 'Costos', roles: ['encargado'] },
  { key: 'asistente', label: 'Asistente', roles: ['encargado'] },
  { key: 'automatizaciones', label: 'Automatizaciones', short: 'Reglas', roles: ['encargado'] },
  { key: 'reportes', label: 'Reportes', roles: ['encargado'] },
  { key: 'configuracion', label: 'Configuración', short: 'Ajustes', roles: ['encargado'] },
]
export const DEFAULT_ADMIN: Record<Role, string> = {
  'cliente-invitado': 'resumen',
  'cliente-recurrente': 'resumen',
  recepcion: 'reservas',
  mozo: 'salon',
  cocina: 'cocina',
  caja: 'caja',
  encargado: 'resumen',
}

export const CHANNEL_LABEL: Record<string, string> = { web: 'Web', whatsapp: 'WhatsApp (simulado)', voz: 'Llamada (simulada)', recepcion: 'Recepción' }

/** "Ritual Café · Centro" → "Centro": dentro del perfil, la marca ya está a la vista. */
export const sedeShort = (name: string) => name.split(' · ').slice(1).join(' · ') || name

/** Nombres humanos de las entidades para el lado profesional (nunca el tipo técnico en inglés). */
export const ENTITY_LABEL: Record<string, string> = {
  Reservation: 'Reserva', Order: 'Pedido', Ingredient: 'Insumo', Conversation: 'Conversación', CallSession: 'Llamada',
  MenuItem: 'Plato', TableSession: 'Cuenta', EventBooking: 'Inscripción a cata', Visit: 'Visita', GiftInvite: 'Invitación', Clock: 'Reloj',
}
export const TASK_KIND_LABEL: Record<string, string> = {
  alimentaria: 'Consulta alimentaria', 'grupo-grande': 'Grupo grande', 'fuera-de-alcance': 'Fuera de alcance', 'canal-desconocido': 'Canal desconocido',
  'sin-consentimiento': 'Sin consentimiento', 'receta-unidad': 'Unidad de receta', stock: 'Stock', 'cancelacion-preparacion': 'Cancelación en preparación',
  'incidencia-cocina': 'Incidencia de cocina', otro: 'Otro',
}
/** "Reserva R-012 · Ana, 4 personas", "Insumo I-07 · Leche de avena"… con enlace a su pantalla cuando existe. */
export function entityRef(s: AppState, type: string, id: string): { text: string; to: string | null } {
  const kind = ENTITY_LABEL[type] ?? type
  if (type === 'Reservation') {
    const r = s.reservations.find((x) => x.id === id)
    return { text: `${kind} ${id}${r ? ` · ${r.alias}, ${r.party} persona${r.party === 1 ? '' : 's'}` : ''}`, to: `/admin/reservas/${id}` }
  }
  if (type === 'Order') return { text: `${kind} ${id}`, to: `/admin/pedidos/${id}` }
  if (type === 'Ingredient') {
    const i = s.ingredients.find((x) => x.id === id)
    return { text: `${kind} ${id}${i ? ` · ${i.name}` : ''}`, to: '/admin/stock' }
  }
  if (type === 'MenuItem') {
    const m = s.menuItems.find((x) => x.id === id)
    return { text: `${kind} ${id}${m ? ` · ${m.name}` : ''}`, to: '/admin/carta' }
  }
  if (type === 'Conversation') return { text: `${kind} ${id}`, to: null }
  return { text: `${kind} ${id}`, to: null }
}

/** P5-L5 · nombre visible de cada estación; las de cada negocio salen de su carta. */
export const STATION_LABEL: Record<Station, string> = { cocina: 'Cocina', barra: 'Barra', mostrador: 'Mostrador', plancha: 'Plancha', freidora: 'Freidora', armado: 'Armado' }
