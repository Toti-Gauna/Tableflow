/**
 * P5-L9 · Escenas autoguiadas: guiones que recorren el producto con los MISMOS comandos que usa la interfaz.
 *
 * Cada paso tiene un brief corto (5–10 s de referencia), la pantalla del comercio que queda de fondo, lo que muestra el
 * teléfono del cliente y una verificación sobre el store. Correr un paso dos veces no duplica nada: los ids que crea se
 * guardan en `vars` y las operaciones repetidas son idempotentes. No hay sonido ni animación obligatorios.
 */
import type { Command } from './reducer'
import type { Outcome } from './core'
import { checkCode, qrPath } from './qr'
import { orderPayment } from './sessions'
import { pickupSlots } from './pickup'
import { locationOpenNow, windowsFor } from './availability'
import { callOptions } from './call'
import { campaignResults } from './growth'
import { addDays, atLocal, dateKeyOf, minutesOfDay } from './time'
import type { AppState, BusinessId, Role } from './types'

export type SceneId = 'whatsapp' | 'llamada' | 'qr-mesa' | 'retiro' | 'campana'
export const SCENE_IDS: SceneId[] = ['whatsapp', 'llamada', 'qr-mesa', 'retiro', 'campana']

export interface SceneApi {
  state: () => AppState
  run: (cmd: Command) => Outcome
  vars: Record<string, string>
}

/** Lo que muestra el teléfono del cliente en ese paso (se dibuja con datos reales del store). */
export type PhoneView =
  | { kind: 'chat'; convVar: string }
  | { kind: 'call'; callVar: string }
  | { kind: 'qr'; pathVar: string; label: string }
  | { kind: 'order'; orderVar: string }
  | { kind: 'reservation'; resVar: string }
  | { kind: 'benefit'; codeVar: string }

export interface SceneStep {
  id: string
  title: string
  brief: string
  /** Duración de referencia del brief (5–10 s), a velocidad 1×. */
  seconds: number
  /** Rol con el que se mira la pantalla de fondo (el teléfono es siempre del cliente). */
  role: Role
  screen: (s: AppState, v: Record<string, string>) => string
  phone: PhoneView
  run?: (api: SceneApi) => string | null
  verify: (s: AppState, v: Record<string, string>) => string | null
}

export interface Scene {
  id: SceneId
  businessId: BusinessId
  title: string
  summary: string
  steps: SceneStep[]
}

export const SCENE_TITLE: Record<SceneId, string> = {
  whatsapp: 'Un pedido por WhatsApp',
  llamada: 'Una reserva por teléfono',
  'qr-mesa': 'El QR de la mesa',
  retiro: 'Retiro con pago en el local',
  campana: 'Una campaña que trae de vuelta',
}

// ------------------------------------------------------------------ utilidades de los guiones
const ok = (o: Outcome, what: string) => (o.ok ? null : `${what}: ${o.message}`)
const loc = (s: AppState, biz: BusinessId) => s.session.locationByBusiness[biz]
const mesaLoc = (s: AppState, biz: BusinessId) => s.locations.find((l) => l.businessId === biz && l.hasTables)?.id ?? loc(s, biz)
const orderOf = (s: AppState, v: Record<string, string>) => s.orders.find((o) => o.id === v.orderId)

/**
 * Lleva el reloj hasta que el local abra (el reloj de la demo solo avanza). Devuelve null si ya está abierto o si pudo
 * avanzarlo; un mensaje si en una semana no abre.
 */
function ensureOpen(api: SceneApi, locationId: string, minLeft = 60): string | null {
  const s = api.state()
  const now = s.clock.nowMs
  const today = dateKeyOf(now)
  const nowMin = minutesOfDay(now)
  if (locationOpenNow(s, locationId) && windowsFor(s, locationId, today).some((w) => nowMin + minLeft <= w.endMin)) return null
  for (let d = 0; d < 8; d++) {
    const key = addDays(today, d)
    for (const w of windowsFor(s, locationId, key).sort((a, b) => a.startMin - b.startMin)) {
      const start = atLocal(key, w.startMin + 5)
      if (start > now && w.endMin - w.startMin > minLeft) {
        const minutes = Math.round((start - now) / 60000)
        return ok(api.run({ type: 'clock/advance', minutes }), 'Avanzar el reloj')
      }
    }
  }
  return 'El local no abre en los próximos siete días del reloj simulado.'
}

/** Pedido real desde la carta (los mismos comandos que la pantalla de pedido). */
function placeOrder(api: SceneApi, biz: BusinessId, locationId: string, lines: [string, number, Record<string, string[]>][], fulfillment: 'mesa' | 'retiro', alias: string, actor: Role = 'cliente-invitado'): string | null {
  if (api.vars.orderId) return null
  const s0 = api.state()
  for (const [itemId, qty, selections] of lines) {
    const e = ok(api.run({ type: 'cart/add', businessId: biz, locationId, itemId, qty, selections, actor }), `Agregar ${itemId}`)
    if (e) return e
  }
  const cartId = `CART-${locationId}`
  const f = fulfillment === 'mesa'
    ? { kind: 'mesa' as const, tableId: api.vars.tableId ?? s0.tables.find((t) => t.locationId === locationId)!.id }
    : { kind: 'retiro' as const, startMin: pickupSlots(api.state(), biz, locationId, 1)[0] ?? null }
  if (f.kind === 'retiro' && f.startMin === null) return 'No quedan franjas de retiro hoy.'
  api.run({ type: 'cart/setFulfillment', cartId, fulfillment: f, alias, actor })
  if (api.vars.benefitCode) {
    const e = ok(api.run({ type: 'cart/setBenefit', cartId, code: api.vars.benefitCode, actor }), 'Elegir el beneficio')
    if (e) return e
  }
  const op = (api.run({ type: 'cart/begin', cartId, actor }).data as { operationId: string } | undefined)?.operationId
  const o = api.run({ type: 'order/submit', cartId, operationId: op, actor })
  if (!o.ok) return `Enviar el pedido: ${o.message}`
  api.vars.orderId = (o.data as { orderId: string }).orderId
  return null
}

/** Avanza un pedido por los estados del comercio hasta `to`, con el rol que corresponde a cada paso. */
function advanceOrder(api: SceneApi, to: 'aceptado' | 'en_preparacion' | 'listo' | 'entregado'): string | null {
  const order = [['aceptado', 'order/accept', 'recepcion'], ['en_preparacion', 'order/prepare', 'cocina'], ['listo', 'order/ready', 'cocina'], ['entregado', 'order/deliver', 'mozo']] as const
  for (const [st, type, actor] of order) {
    const o = orderOf(api.state(), api.vars)
    if (!o) return 'No hay pedido.'
    const done = ['aceptado', 'en_preparacion', 'listo', 'servido', 'retirado', 'cerrado']
    const idx = done.indexOf(o.status)
    const need = done.indexOf(st === 'entregado' ? 'servido' : st)
    if (!(idx >= need || (st === 'entregado' && ['retirado', 'servido', 'cerrado'].includes(o.status)))) {
      const e = ok(api.run({ type, orderId: o.id, actor }), `Pedido ${o.id}`)
      if (e) return e
    }
    if (st === to) return null
  }
  return null
}

/** Conversación de WhatsApp manejada como lo haría una persona: responde con la opción preferida o la primera. */
function chatAutopilot(api: SceneApi, prefer: RegExp[], alias: string, stopAtConfirm: boolean): string | null {
  for (let i = 0; i < 10; i++) {
    const s = api.state()
    const conv = s.conversations.find((c) => c.id === api.vars.convId)!
    if (conv.orderIds.length) {
      api.vars.orderId = conv.orderIds[conv.orderIds.length - 1]
      return null
    }
    const flow = conv.flow
    if (!flow) return 'La conversación terminó sin pedido.'
    if (stopAtConfirm && flow.step === 'confirm') return null
    const last = [...s.messages].reverse().find((m) => m.conversationId === conv.id && m.from === 'asistente')
    if (flow.step === 'alias' || !last?.actions.length) {
      api.run({ type: 'chat/send', conversationId: conv.id, text: alias, actor: 'cliente-invitado' })
      continue
    }
    const pick = prefer.map((p) => last.actions.find((a) => p.test(a.label))).find(Boolean) ?? last.actions[0]
    api.run({ type: 'chat/send', conversationId: conv.id, text: pick.label, payload: pick.payload, actor: 'cliente-invitado' })
  }
  return 'La conversación no llegó a un pedido.'
}

// ------------------------------------------------------------------ guiones
const WA: Partial<Record<BusinessId, { text: string; prefer: RegExp[]; alias: string; item: string }>> = {
  'ritual-cafe': { text: 'Quiero pedir un cortado para retirar', prefer: [/entera/i, /centro/i], alias: 'Marta', item: 'un cortado' },
  copo: { text: 'Quiero pedir un Cucurucho · 1 gusto para retirar', prefer: [/dulce de leche/i, /mostrador/i], alias: 'Marta', item: 'un cucurucho' },
  brasa: { text: 'Quiero pedir una hamburguesa clásica para retirar', prefer: [/papa/i], alias: 'Marta', item: 'una hamburguesa clásica' },
}

function whatsapp(biz: BusinessId): Scene | null {
  const w = WA[biz]
  if (!w) return null
  return {
    id: 'whatsapp',
    businessId: biz,
    title: SCENE_TITLE.whatsapp,
    summary: `Alguien pide ${w.item} por WhatsApp (simulado), el asistente arma el pedido y recepción lo acepta.`,
    steps: [
      {
        id: 'llega', title: 'Llega un mensaje', seconds: 7, role: 'recepcion',
        brief: `Un cliente escribe por WhatsApp: «${w.text}». Es una simulación: no sale ni entra ningún mensaje real.`,
        screen: () => '/admin/pedidos', phone: { kind: 'chat', convVar: 'convId' },
        run: (api) => {
          const e = ensureOpen(api, loc(api.state(), biz))
          if (e) return e
          if (!api.vars.convId) {
            const o = api.run({ type: 'chat/new', businessId: biz, channel: 'whatsapp', customerId: null, actor: 'cliente-invitado' })
            if (!o.ok) return o.message
            api.vars.convId = (o.data as { conversationId: string }).conversationId
            api.run({ type: 'chat/send', conversationId: api.vars.convId, text: w.text, actor: 'cliente-invitado' })
          }
          return null
        },
        verify: (s, v) => (s.messages.some((m) => m.conversationId === v.convId && m.from === 'cliente') ? null : 'No llegó el mensaje.'),
      },
      {
        id: 'pregunta', title: 'El asistente pregunta lo que falta', seconds: 8, role: 'recepcion',
        brief: 'Pide solo lo necesario: las opciones obligatorias, la hora de retiro y un nombre. Sin IA: reglas fijas del negocio.',
        screen: () => '/admin/pedidos', phone: { kind: 'chat', convVar: 'convId' },
        run: (api) => chatAutopilot(api, w.prefer, w.alias, true),
        verify: (s, v) => (s.conversations.find((c) => c.id === v.convId)?.flow?.step === 'confirm' || v.orderId ? null : 'Todavía no llegó a la confirmación.'),
      },
      {
        id: 'confirma', title: 'Confirma y se crea el pedido', seconds: 7, role: 'recepcion',
        brief: 'El cliente confirma: el pedido entra con su folio, marcado como llegado por WhatsApp.',
        screen: () => '/admin/pedidos', phone: { kind: 'chat', convVar: 'convId' },
        run: (api) => chatAutopilot(api, [/confirmar/i], w.alias, false),
        verify: (s, v) => (orderOf(s, v)?.channel === 'whatsapp' ? null : 'No se creó el pedido por WhatsApp.'),
      },
      {
        id: 'acepta', title: 'Recepción lo acepta', seconds: 7, role: 'recepcion',
        brief: 'En la lista de pedidos aparece con el canal. Recepción lo acepta y pasa a la cola de preparación.',
        screen: (_s, v) => `/admin/pedidos/${v.orderId}`, phone: { kind: 'order', orderVar: 'orderId' },
        run: (api) => advanceOrder(api, 'aceptado'),
        verify: (s, v) => (orderOf(s, v)?.status === 'aceptado' ? null : 'El pedido no quedó aceptado.'),
      },
    ],
  }
}

/** Mesa Clara: una mesa para cuatro. Compás: un grupo grande, que nunca se acepta solo (revisión humana). */
const CALL: Partial<Record<BusinessId, { option: 'reserveA' | 'group16'; ask: string; confirm: string; reception: string }>> = {
  'mesa-clara': {
    option: 'reserveA',
    ask: '«Somos cuatro para el lunes a las ocho.» El asistente revisa la disponibilidad real del salón.',
    confirm: 'Si a esa hora no hay lugar, ofrece una alternativa. Al confirmar se crea la solicitud de reserva.',
    reception: 'La solicitud llega con su canal y la transcripción. Recepción la confirma y se asigna una mesa.',
  },
  compas: {
    option: 'group16',
    ask: '«Somos dieciséis el sábado a las nueve.» Un grupo así no se acepta solo: el asistente lo dice y no promete mesa.',
    confirm: 'Al confirmar queda una solicitud en revisión humana, con la transcripción para el equipo.',
    reception: 'Recepción la ve en revisión, con la transcripción. Un grupo que supera la mesa más grande se coordina a mano: el sistema no lo acepta solo.',
  },
}

function llamada(biz: BusinessId): Scene | null {
  const cfg = CALL[biz]
  if (!cfg) return null
  const respond = (api: SceneApi) => {
    const call = api.state().callSessions.find((c) => c.id === api.vars.callId)!
    if (call.status === 'procesando') api.run({ type: 'call/respond', callId: call.id, token: call.token, actor: 'sistema' })
  }
  return {
    id: 'llamada',
    businessId: biz,
    title: SCENE_TITLE.llamada,
    summary: 'Alguien llama para reservar; el asistente de voz simulado toma los datos y la solicitud llega a recepción. Se entiende sin sonido: todo queda transcripto.',
    steps: [
      {
        id: 'suena', title: 'Entra una llamada (simulada)', seconds: 6, role: 'recepcion',
        brief: 'No hay llamada real ni micrófono: la persona elige qué decir con botones y todo queda en la transcripción.',
        screen: () => '/admin/reservas', phone: { kind: 'call', callVar: 'callId' },
        run: (api) => {
          if (api.vars.callId) return null
          const o = api.run({ type: 'chat/new', businessId: biz, channel: 'voz', customerId: null, actor: 'cliente-invitado' })
          if (!o.ok) return o.message
          api.vars.convId = (o.data as { conversationId: string }).conversationId
          const c = api.run({ type: 'call/start', conversationId: api.vars.convId, actor: 'cliente-invitado' })
          if (!c.ok) return c.message
          api.vars.callId = (c.data as { callId: string }).callId
          return ok(api.run({ type: 'call/ready', callId: api.vars.callId, token: 1, actor: 'sistema' }), 'Atender')
        },
        verify: (s, v) => (s.callSessions.find((c) => c.id === v.callId)?.transcript.some((t) => t.who === 'asistente') ? null : 'La llamada no empezó.'),
      },
      {
        id: 'pide', title: 'Pide una mesa', seconds: 8, role: 'recepcion',
        brief: cfg.ask,
        screen: () => '/admin/reservas', phone: { kind: 'call', callVar: 'callId' },
        run: (api) => {
          const call = api.state().callSessions.find((c) => c.id === api.vars.callId)!
          if (callOptions(call).some((o) => o.id === cfg.option)) {
            const e = ok(api.run({ type: 'call/say', callId: call.id, optionId: cfg.option, actor: 'cliente-invitado' }), 'Hablar')
            if (e) return e
          }
          respond(api)
          return null
        },
        verify: (s, v) => {
          const c = s.callSessions.find((x) => x.id === v.callId)
          return c && c.transcript.filter((x) => x.who === 'asistente').length >= 2 ? null : 'El asistente no respondió.'
        },
      },
      {
        id: 'confirma', title: 'Confirma la solicitud', seconds: 7, role: 'recepcion',
        brief: cfg.confirm,
        screen: () => '/admin/reservas', phone: { kind: 'call', callVar: 'callId' },
        run: (api) => {
          const created = () => {
            const s = api.state()
            const call = s.callSessions.find((c) => c.id === api.vars.callId)!
            return call.reservationId ?? s.reservations.find((r) => r.conversationId === api.vars.convId)?.id ?? null
          }
          for (let i = 0; i < 4; i++) {
            const call = api.state().callSessions.find((c) => c.id === api.vars.callId)!
            const id = created()
            if (id) {
              api.vars.resId = id
              return null
            }
            const opt = callOptions(call).find((o) => o.id === 'accept') ?? callOptions(call).find((o) => o.id === 'confirm')
            if (!opt) return call.status === 'derivada' ? 'La llamada pasó a recepción.' : 'No hay cómo confirmar.'
            api.run({ type: 'call/say', callId: call.id, optionId: opt.id, actor: 'cliente-invitado' })
            respond(api)
          }
          const id = created()
          if (id) api.vars.resId = id
          return api.vars.resId ? null : 'No se creó la solicitud.'
        },
        verify: (s, v) => (s.reservations.some((r) => r.id === v.resId && r.channel === 'voz') ? null : 'No hay reserva creada por la llamada.'),
      },
      {
        id: 'recepcion', title: cfg.option === 'group16' ? 'Recepción la revisa' : 'Recepción la confirma', seconds: 8, role: 'recepcion',
        brief: cfg.reception,
        screen: (_s, v) => `/admin/reservas/${v.resId}`, phone: { kind: 'reservation', resVar: 'resId' },
        run: (api) => {
          const r = api.state().reservations.find((x) => x.id === api.vars.resId)
          // un grupo grande queda en revisión humana: la escena muestra que no se acepta solo
          if (!r || r.status === 'confirmada' || r.status === 'revision_humana') return null
          return ok(api.run({ type: 'res/accept', id: r.id, actor: 'recepcion' }), 'Confirmar')
        },
        verify: (s, v) => {
          const r = s.reservations.find((x) => x.id === v.resId)
          if (cfg.option === 'group16') return r?.status === 'revision_humana' && s.tasks.some((x) => x.status === 'pendiente' && x.businessId === biz) ? null : 'El grupo no quedó en revisión humana.'
          return r?.status === 'confirmada' ? null : 'La reserva no quedó confirmada.'
        },
      },
    ],
  }
}

const QR_ORDER: Partial<Record<BusinessId, [string, number, Record<string, string[]>][]>> = {
  'mesa-clara': [['MC-12', 1, { 'MG-guarnicion': ['gu-papas-fritas'] }], ['MC-26', 1, {}]],
  'ritual-cafe': [['RC-11', 2, {}], ['RC-03', 1, { 'MG-leche': ['le-entera'] }]],
  compas: [['TC-01', 1, { 'MG-TC-racion': ['tr-tapa'] }], ['TC-09', 1, {}]],
}
function qrMesa(biz: BusinessId): Scene | null {
  const lines = QR_ORDER[biz]
  if (!lines) return null
  const table = (s: AppState) => s.tables.find((t) => t.locationId === mesaLoc(s, biz))!
  return {
    id: 'qr-mesa',
    businessId: biz,
    title: SCENE_TITLE['qr-mesa'],
    summary: 'El cliente escanea el QR de su mesa, pide desde el teléfono y la comanda llega a cocina o barra hasta servirse.',
    steps: [
      {
        id: 'escanea', title: 'Escanea el QR de la mesa', seconds: 7, role: 'mozo',
        brief: 'El QR solo lleva la mesa y la sede: ni precios ni datos de nadie. La app valida contra la carta y el salón.',
        screen: () => '/admin/salon', phone: { kind: 'qr', pathVar: 'qrPath', label: 'QR de la mesa' },
        run: (api) => {
          const e = ensureOpen(api, mesaLoc(api.state(), biz))
          if (e) return e
          const t = table(api.state())
          api.vars.tableId = t.id
          api.vars.qrPath = qrPath(biz, 'mesa', t.id, t.locationId)
          if (api.state().session.locationByBusiness[biz] !== t.locationId) api.run({ type: 'session/setLocation', locationId: t.locationId })
          return null
        },
        verify: (s, v) => (checkCode(s, { businessId: biz, locationId: mesaLoc(s, biz), side: 'cliente' }, `#${v.qrPath}`).status === 'valido' ? null : 'El QR no es válido.'),
      },
      {
        id: 'pide', title: 'Pide desde la mesa', seconds: 8, role: 'mozo',
        brief: 'Elige de la carta con sus opciones; el pedido entra a la cuenta de esa mesa, sin pasar por la caja.',
        screen: () => '/admin/salon', phone: { kind: 'order', orderVar: 'orderId' },
        run: (api) => placeOrder(api, biz, mesaLoc(api.state(), biz), lines, 'mesa', 'Mesa del QR'),
        verify: (s, v) => (orderOf(s, v)?.kind === 'mesa' ? null : 'No se creó el pedido de mesa.'),
      },
      {
        id: 'cocina', title: 'La comanda llega a cocina', seconds: 7, role: 'cocina',
        brief: 'Cada línea va a su estación. Se acepta y se prepara; el cliente ve el avance en su teléfono.',
        screen: () => '/admin/cocina', phone: { kind: 'order', orderVar: 'orderId' },
        run: (api) => advanceOrder(api, 'en_preparacion'),
        verify: (s, v) => (orderOf(s, v)?.status === 'en_preparacion' ? null : 'La comanda no está en preparación.'),
      },
      {
        id: 'sirve', title: 'Listo y a la mesa', seconds: 6, role: 'mozo',
        brief: 'Se marca listo y el mozo lo sirve. La cuenta de la mesa queda abierta para pagar al final.',
        screen: () => '/admin/salon', phone: { kind: 'order', orderVar: 'orderId' },
        run: (api) => advanceOrder(api, 'entregado'),
        verify: (s, v) => (orderOf(s, v)?.status === 'servido' ? null : 'El pedido no se sirvió.'),
      },
    ],
  }
}

const PICKUP: Partial<Record<BusinessId, [string, number, Record<string, string[]>][]>> = {
  'ritual-cafe': [['RC-11', 2, {}], ['RC-03', 1, { 'MG-leche': ['le-entera'] }]],
  copo: [['CO-02', 1, { 'MG-CO-gustos-2': ['hg-pistacho', 'hg-frutilla'] }]],
  brasa: [['BR-01', 1, { 'MG-BR-combo': ['bc-mediano'], 'MG-BR-acomp': ['ba-papas'], 'MG-BR-bebida': ['bb-cola'] }]],
}
function retiro(biz: BusinessId): Scene | null {
  const lines = PICKUP[biz]
  if (!lines) return null
  return {
    id: 'retiro',
    businessId: biz,
    title: SCENE_TITLE.retiro,
    summary: 'Pedido para retirar: aceptado no es pagado. Se retira con el código y se cobra en el mostrador.',
    steps: [
      {
        id: 'pide', title: 'Pide para retirar', seconds: 7, role: 'cocina',
        brief: 'Elige la hora de retiro. El pedido queda con "pago en el local pendiente": la app no cobra nada.',
        screen: () => '/admin/cocina', phone: { kind: 'order', orderVar: 'orderId' },
        run: (api) => ensureOpen(api, loc(api.state(), biz)) ?? placeOrder(api, biz, loc(api.state(), biz), lines, 'retiro', 'Retira Julia'),
        verify: (s, v) => {
          const o = orderOf(s, v)
          return o && orderPayment(s, o).state === 'pendiente-local' ? null : 'El retiro no quedó con pago pendiente.'
        },
      },
      {
        id: 'prepara', title: 'Se acepta y se prepara', seconds: 8, role: 'cocina',
        brief: 'El equipo lo acepta y lo marca listo. Que esté listo tampoco lo da por pagado.',
        screen: () => '/admin/cocina', phone: { kind: 'order', orderVar: 'orderId' },
        run: (api) => advanceOrder(api, 'listo'),
        verify: (s, v) => {
          const o = orderOf(s, v)
          return o?.status === 'listo' && orderPayment(s, o).state === 'pendiente-local' ? null : 'No está listo con el pago pendiente.'
        },
      },
      {
        id: 'cobra', title: 'Se cobra en el mostrador', seconds: 7, role: 'caja',
        brief: 'Caja registra el pago de demostración (no hay pasarela). Recién ahí el pedido figura pagado.',
        screen: () => '/admin/caja', phone: { kind: 'order', orderVar: 'orderId' },
        run: (api) => {
          const o = orderOf(api.state(), api.vars)!
          if (orderPayment(api.state(), o).state === 'pagado') return null
          const s = api.state()
          if (!s.cashSessions.some((c) => c.locationId === o.locationId && c.status === 'abierta')) {
            const e = ok(api.run({ type: 'cash/open', businessId: biz, locationId: o.locationId, openingFloatCents: 0, actor: 'caja' }), 'Abrir la caja')
            if (e) return e
          }
          api.vars.payOp ??= (api.run({ type: 'op/alloc' }).data as { operationId: string }).operationId
          const due = orderPayment(api.state(), o).balanceCents
          return ok(api.run({ type: 'pay/register', sessionId: o.sessionId, amountCents: due, method: 'efectivo', operationId: api.vars.payOp, actor: 'caja' }), 'Cobrar')
        },
        verify: (s, v) => {
          const o = orderOf(s, v)
          return o && orderPayment(s, o).state === 'pagado' ? null : 'El pago no quedó registrado.'
        },
      },
      {
        id: 'retira', title: 'Retira con su código', seconds: 6, role: 'caja',
        brief: 'El código del pedido se valida contra la demo y se canjea una sola vez: un segundo escaneo dice "ya usado".',
        screen: () => '/admin/codigos', phone: { kind: 'order', orderVar: 'orderId' },
        run: (api) => {
          const o = orderOf(api.state(), api.vars)!
          if (o.status === 'retirado') return null
          api.vars.redeemOp ??= (api.run({ type: 'op/alloc' }).data as { operationId: string }).operationId
          return ok(api.run({ type: 'code/redeem', businessId: biz, locationId: o.locationId, text: o.id, operationId: api.vars.redeemOp, actor: 'caja' }), 'Canjear')
        },
        verify: (s, v) => (orderOf(s, v)?.status === 'retirado' ? null : 'El pedido no se retiró.'),
      },
    ],
  }
}

const CAMP: Partial<Record<BusinessId, { lines: [string, number, Record<string, string[]>][]; kind: 'mesa' | 'retiro' }>> = {
  'ritual-cafe': { lines: [['RC-11', 3, {}]], kind: 'retiro' },
  'mesa-clara': { lines: [['MC-12', 1, { 'MG-guarnicion': ['gu-papas-fritas'] }], ['MC-26', 1, {}]], kind: 'mesa' },
}
function campana(biz: BusinessId): Scene | null {
  const c = CAMP[biz]
  if (!c) return null
  const campaignOf = (s: AppState) => s.campaigns.find((x) => x.businessId === biz && x.trigger === 'manual' && ['activa', 'aprobada'].includes(x.status))
  return {
    id: 'campana',
    businessId: biz,
    title: SCENE_TITLE.campana,
    summary: 'El encargado activa una campaña con su proyección, el beneficio llega (simulado) a quien dio consentimiento y vuelve a pedir.',
    steps: [
      {
        id: 'activa', title: 'La campaña sale', seconds: 9, role: 'encargado',
        brief: 'Antes de activar se vio audiencia, descuento, contribución y equilibrio. Solo reciben quienes aceptaron promociones.',
        screen: (s) => `/admin/campanas/${campaignOf(s)?.id ?? ''}`, phone: { kind: 'benefit', codeVar: 'benefitCode' },
        run: (api) => {
          const camp = campaignOf(api.state())
          if (!camp) return 'Este negocio no tiene una campaña manual lista para salir.'
          api.vars.campaignId = camp.id
          if (camp.status === 'aprobada') {
            const e = ok(api.run({ type: 'campaign/activate', campaignId: camp.id, actor: 'encargado' }), 'Activar')
            if (e) return e
          }
          const b = api.state().benefits.find((x) => x.campaignId === camp.id && x.status === 'disponible')
          if (!b) return 'La campaña no tiene beneficios disponibles.'
          api.vars.benefitCode = b.code
          api.vars.customerId = b.customerId
          return null
        },
        verify: (s, v) => (s.benefits.some((b) => b.code === v.benefitCode && b.status === 'disponible') || v.orderId ? null : 'No hay beneficio para usar.'),
      },
      {
        id: 'vuelve', title: 'Vuelve y usa su beneficio', seconds: 8, role: 'encargado',
        brief: 'El cliente pide con su código: el descuento se valida al enviar (vencimiento, mínimo, topes y que sea suyo).',
        screen: (s) => `/admin/campanas/${campaignOf(s)?.id ?? ''}`, phone: { kind: 'order', orderVar: 'orderId' },
        run: (api) => {
          if (api.vars.orderId) return null
          const e = ensureOpen(api, c.kind === 'mesa' ? mesaLoc(api.state(), biz) : loc(api.state(), biz))
          if (e) return e
          api.run({ type: 'session/setCustomer', businessId: biz, customerId: api.vars.customerId })
          const where = c.kind === 'mesa' ? mesaLoc(api.state(), biz) : loc(api.state(), biz)
          return placeOrder(api, biz, where, c.lines, c.kind, 'Vuelve', 'cliente-recurrente')
        },
        verify: (s, v) => (s.benefits.find((b) => b.code === v.benefitCode)?.status === 'canjeado' ? null : 'El beneficio no se canjeó.'),
      },
      {
        id: 'resultado', title: 'El resultado, sin exagerar', seconds: 8, role: 'encargado',
        brief: 'El panel separa proyección, simulación y resultado observado. Las ventas atribuidas no prueban que sin la campaña no hubiera venido.',
        screen: (_s, v) => `/admin/campanas/${v.campaignId}`, phone: { kind: 'order', orderVar: 'orderId' },
        verify: (s, v) => {
          const camp = s.campaigns.find((x) => x.id === v.campaignId)
          return camp && campaignResults(s, camp.id).redeemed > 0 ? null : 'No hay canje observado.'
        },
      },
    ],
  }
}

const BUILD: Record<SceneId, (b: BusinessId) => Scene | null> = { whatsapp, llamada, 'qr-mesa': qrMesa, retiro, campana }

/** Las escenas que tienen sentido para el negocio (no todas aplican a todos: Copo no tiene mesas, Mesa Clara no tiene retiro). */
export function scenesFor(biz: BusinessId): Scene[] {
  return SCENE_IDS.map((id) => BUILD[id](biz)).filter((x): x is Scene => !!x)
}
export function sceneFor(biz: BusinessId, id: SceneId): Scene | null {
  return BUILD[id](biz)
}

/** Corre un paso (una sola vez por id) y verifica su efecto. */
export function runStep(api: SceneApi, step: SceneStep): { ok: boolean; message: string | null } {
  const ranKey = `ran:${step.id}`
  if (!api.vars[ranKey]) {
    const e = step.run?.(api) ?? null
    if (e) return { ok: false, message: e }
    api.vars[ranKey] = '1'
  }
  const v = step.verify(api.state(), api.vars)
  return { ok: !v, message: v }
}
