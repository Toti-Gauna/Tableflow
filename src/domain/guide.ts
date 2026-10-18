/**
 * P5-L9 · Guía completa por rol, módulo y tarea. Cada tarea dice por qué importa en ESE tipo de negocio, cómo se hace y
 * cuándo quedó hecha: se detecta en la auditoría del store (lo que pasó de verdad en la demo), nunca por un clic en "listo".
 */
import type { AppState, BusinessId, BusinessProfile, Role } from './types'

export type GuideRole = 'cliente' | 'recepcion' | 'cocina' | 'caja' | 'encargado'
export const GUIDE_ROLE_LABEL: Record<GuideRole, string> = { cliente: 'Cliente', recepcion: 'Recepción', cocina: 'Cocina y barra', caja: 'Caja', encargado: 'Encargado' }
export const ROLE_FOR: Record<GuideRole, Role> = { cliente: 'cliente-recurrente', recepcion: 'recepcion', cocina: 'cocina', caja: 'caja', encargado: 'encargado' }

export interface GuideTask {
  id: string
  role: GuideRole
  module: string
  title: string
  /** Por qué importa, adaptado al tipo de negocio. */
  why: (b: BusinessProfile) => string
  steps: (b: BusinessProfile) => string[]
  /** Dónde se practica. */
  to: (b: BusinessProfile) => string
  /** Cuándo cuenta como hecha: un evento de auditoría de este negocio posterior al inicio de la práctica. */
  doneOn: string[]
  /** Solo para los negocios donde la tarea existe. */
  applies?: (b: BusinessProfile) => boolean
}

const KIND_NOUN: Record<BusinessProfile['kind'], string> = { bodegon: 'el salón', cafe: 'la barra', heladeria: 'el mostrador', bar: 'la barra y las mesas', rapida: 'el mostrador' }
const pickup = (b: BusinessProfile) => b.kind !== 'bodegon'
const reservas = (b: BusinessProfile) => b.reservationsEnabled

export const GUIDE_TASKS: GuideTask[] = [
  {
    id: 'cliente-pedido', role: 'cliente', module: 'Carta y pedido', title: 'Hacer un pedido',
    why: (b) => (pickup(b) ? `En ${b.name} se pide para retirar: el pedido entra con su número y, si se paga en el local, queda pendiente hasta caja.` : `En ${b.name} se pide desde la mesa: la comanda va directo a cocina y la cuenta queda abierta.`),
    steps: (b) => ['Abrí la carta y elegí un plato con sus opciones.', pickup(b) ? 'En Mi pedido elegí la hora de retiro y un nombre.' : 'En Mi pedido elegí tu mesa (el salón abre al mediodía).', 'Enviá: vas a ver el seguimiento con su folio.'],
    to: (b) => `/${b.id}/carta`, doneOn: ['order.submitted'],
  },
  {
    id: 'cliente-reserva', role: 'cliente', module: 'Reservas', title: 'Pedir una reserva',
    why: (b) => `${b.name} confirma según su regla: ${b.autoConfirmReservations ? 'las que entran en una mesa se confirman solas' : 'el equipo confirma cada solicitud'}; los grupos grandes siempre los revisa una persona.`,
    steps: () => ['Abrí Reservar y elegí día, hora y personas.', 'Mirá la respuesta: confirmada, alternativa o en revisión.'],
    to: (b) => `/${b.id}/reservar`, doneOn: ['reservation.requested', 'reservation.confirmed'], applies: reservas,
  },
  {
    id: 'cliente-codigos', role: 'cliente', module: 'Códigos y QR', title: 'Mostrar el QR de un pedido',
    why: () => 'El QR solo lleva un identificador: no tiene tu nombre ni importes y no acredita un pago. El local lo valida contra la demo.',
    steps: () => ['Abrí Mis códigos.', 'Mostrá el QR o compartí el enlace; el local lo lee en Códigos.'],
    to: (b) => `/${b.id}/codigos`, doneOn: ['code.scanned'],
  },
  {
    id: 'cliente-beneficio', role: 'cliente', module: 'Beneficios', title: 'Usar un beneficio de campaña',
    why: () => 'Los beneficios son personales: se canjean al enviar el pedido y, si el pedido se cae, vuelven a estar disponibles.',
    steps: () => ['Abrí Mis beneficios.', 'Tocá "Usar en mi pedido" con algo en el carrito y enviá.'],
    to: (b) => `/${b.id}/beneficios`, doneOn: ['benefit.redeemed'],
  },
  {
    id: 'recepcion-pedidos', role: 'recepcion', module: 'Pedidos', title: 'Aceptar un pedido entrante',
    why: (b) => `Todo pedido nuevo espera a que alguien de ${KIND_NOUN[b.kind]} lo acepte o lo rechace con un motivo: nada pasa solo a preparación.`,
    steps: () => ['En Pedidos abrí uno "enviado".', 'Aceptalo (o rechazalo con un motivo visible para el cliente).'],
    to: () => '/admin/pedidos', doneOn: ['order.accepted', 'order.rejected'],
  },
  {
    id: 'recepcion-reservas', role: 'recepcion', module: 'Reservas', title: 'Confirmar una solicitud de reserva',
    why: () => 'Las solicitudes llegan por web, WhatsApp o llamada con su canal. Al confirmar se asigna una mesa libre; si hay una revisión pendiente, primero se resuelve.',
    steps: () => ['En Reservas abrí una "solicitada".', 'Confirmala u ofrecé otra hora.'],
    to: () => '/admin/reservas', doneOn: ['reservation.confirmed', 'reservation.alternativeOffered'], applies: reservas,
  },
  {
    id: 'recepcion-codigos', role: 'recepcion', module: 'Códigos', title: 'Validar el código de un cliente',
    why: () => 'Se valida contra los datos de la demo: un código de otro negocio, vencido o ya usado se rechaza con su motivo, y un canje no se repite.',
    steps: () => ['En Códigos elegí un caso de ejemplo o escribí un código.', 'Mirá el estado y, si corresponde, registrá el retiro o la llegada.'],
    to: () => '/admin/codigos', doneOn: ['code.scanned'],
  },
  {
    id: 'cocina-tablero', role: 'cocina', module: 'Cocina y barra', title: 'Llevar una comanda hasta "listo"',
    why: (b) => `Cada línea va a su estación (${b.kind === 'rapida' ? 'plancha, freidora y armado' : b.kind === 'cafe' ? 'barra y cocina' : b.kind === 'heladeria' ? 'mostrador' : 'cocina y barra'}). "Listo" avisa al cliente, pero no lo da por pagado.`,
    steps: () => ['En el tablero aceptá una comanda nueva.', 'Pasala a preparación y marcala lista.'],
    to: () => '/admin/cocina', doneOn: ['order.ready'],
  },
  {
    id: 'caja-cobro', role: 'caja', module: 'Caja', title: 'Cobrar una cuenta',
    why: (b) => (b.paysAtCounter ? `En ${b.name} el retiro se paga en el mostrador: el pedido figura pagado recién cuando caja registra el pago de demostración.` : `En ${b.name} se cobra la cuenta de la mesa: se puede dividir por partes o por ítems.`),
    steps: () => ['Abrí la caja de la sede.', 'Elegí una cuenta con saldo y registrá un pago de demostración.'],
    to: () => '/admin/caja', doneOn: ['payment.registered'],
  },
  {
    id: 'encargado-costos', role: 'encargado', module: 'Costos', title: 'Cargar un costo que falta',
    why: () => 'Sin costo no hay contribución ni equilibrio: lo que falta queda en ND y la campaña que lo usa no se puede aprobar.',
    steps: () => ['En Costos buscá un ítem en ND.', 'Cargá el costo de muestra y guardá.'],
    to: () => '/admin/costos', doneOn: ['cost.updated'],
  },
  {
    id: 'encargado-campana', role: 'encargado', module: 'Campañas', title: 'Aprobar o activar una campaña',
    why: () => 'Antes de activar se ven audiencia, descuento, costo máximo, contribución y equilibrio. Solo reciben quienes aceptaron promociones; los envíos son simulados.',
    steps: () => ['En Campañas abrí una en borrador o aprobada.', 'Revisá la proyección y aprobala o activala.'],
    to: () => '/admin/campanas', doneOn: ['campaign.approved', 'campaign.activated', 'campaign.scheduled'],
  },
  {
    id: 'encargado-temporada', role: 'encargado', module: 'Configuración', title: 'Programar una temporada',
    why: (b) => `Cambia la escena, el arte y el movimiento de ${b.name} sin tocar precios ni crear promociones.`,
    steps: () => ['En Configuración elegí "Manual, con inicio y fin".', 'Probá la vista previa y guardá.'],
    to: () => '/admin/configuracion', doneOn: ['config.season'],
  },
  {
    id: 'encargado-asistente', role: 'encargado', module: 'Asistente', title: 'Preguntarle al asistente del comercio',
    why: () => 'Responde con datos de la demo y cálculos reales; si falta un dato, lo pide; los borradores que arma necesitan tu aprobación.',
    steps: () => ['Abrí el Asistente.', 'Pedile que arme una campaña y respondé lo que pregunte.'],
    to: () => '/admin/asistente', doneOn: ['campaign.drafted'],
  },
]

export function tasksFor(b: BusinessProfile): GuideTask[] {
  return GUIDE_TASKS.filter((t) => !t.applies || t.applies(b))
}

/** ¿Se hizo la tarea en este negocio después de `sinceAudit` (largo de la auditoría al empezar la práctica)? */
export function taskDone(s: AppState, businessId: BusinessId, task: GuideTask, sinceAudit: number): boolean {
  return s.audit.slice(sinceAudit).some((a) => a.businessId === businessId && task.doneOn.includes(a.type))
}
