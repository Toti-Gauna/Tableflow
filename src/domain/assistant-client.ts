/**
 * P5-L6 · Asistente del cliente, determinista: carta, horarios, el estado de SUS pedidos y SUS beneficios.
 * Nunca muestra datos de otras personas (pedidos, beneficios, nombres o contactos): esas preguntas se rechazan.
 */
import { normalize } from './core'
import { windowsFor } from './availability'
import { itemUnavailable } from './menu'
import { benefitDaysLeft } from './benefits'
import { GUSTOS } from './fixtures/nuevos'
import { dateKeyOf, hhmm } from './time'
import type { AppState, BusinessId, MenuItem } from './types'

export interface ClientReply { text: string; items?: { id: string; name: string; detail: string }[]; link?: { label: string; to: string } }

const ARS = (c: number) => `$ ${(c / 100).toLocaleString('es-AR')}`
const STATUS: Record<string, string> = { enviado: 'recibido, falta que el equipo lo acepte', aceptado: 'aceptado', en_preparacion: 'en preparación', listo: 'listo para retirar o servir', servido: 'servido', retirado: 'retirado', cerrado: 'cerrado', rechazado: 'rechazado', cancelado: 'cancelado' }
export const CLIENT_SUGGEST = ['¿Tengo beneficios?', '¿Dónde está mi pedido?', '¿Qué hay sin TACC?', '¿Hasta qué hora abren?', '¿Qué postres hay?']

/** Ítem nombrado en el texto: primero el nombre completo; si no, el que más palabras significativas comparte. */
export function itemMatch(items: MenuItem[], n: string): MenuItem | undefined {
  let best: { m: MenuItem; score: number } | undefined
  for (const m of items) {
    const name = normalize(m.name).replace(/\(.*?\)/g, '').trim()
    const words = name.split(' ').filter((w) => w.length > 4)
    const hits = words.filter((w) => n.includes(w)).length
    const score = n.includes(name) ? 100 + name.length : hits ? hits * 10 - (words.length - hits) : 0
    if (score > 0 && (!best || score > best.score)) best = { m, score }
  }
  return best?.m
}

export function clientAssistant(s: AppState, biz: BusinessId, raw: string, customerId: string | null, locationId: string): ClientReply[] {
  const n = normalize(raw)
  const items = s.menuItems.filter((m) => m.businessId === biz && (!m.locationIds || m.locationIds.includes(locationId)))
  const root = `/${biz}`
  // privacidad primero: nada de datos ajenos
  if (/(telefono|celular|mail|correo|direccion|dni) de|pedido de (?!mi\b)|que pidio|quien (pidio|vino|reservo)|datos de (otro|otra|los|las|alguien)|beneficios? de (?!mi\b)|clientes? (que|de)/.test(n)) {
    return [{ text: 'No puedo mostrar datos de otras personas. Sí te ayudo con la carta, tus pedidos y tus beneficios.' }]
  }
  if (/mi pedido|mis pedidos|donde esta|como va|estado del pedido|ya esta listo/.test(n)) {
    if (!customerId) return [{ text: 'Para ver tus pedidos necesito saber quién sos: entrá con tu perfil (en la demo, "Cliente recurrente"). Si pediste como invitado, el seguimiento está en Mi pedido.', link: { label: 'Mi pedido', to: `${root}/pedido` } }]
    const mine = s.orders.filter((o) => o.businessId === biz && o.customerId === customerId).sort((a, b) => b.createdAt - a.createdAt)
    if (!mine.length) return [{ text: 'No tenés pedidos en este negocio todavía.', link: { label: 'Ver la carta', to: `${root}/carta` } }]
    const o = mine[0]
    return [{ text: `Tu último pedido, ${o.id}, está ${STATUS[o.status]}${o.kind === 'retiro' && !['rechazado', 'cancelado'].includes(o.status) ? ` (código de retiro ${o.pickupCode})` : ''}.`, link: { label: 'Ver el seguimiento', to: `${root}/pedido/${o.id}` } }]
  }
  if (/beneficio|descuento|cupon|promo|codigo/.test(n)) {
    if (!customerId) return [{ text: 'Los beneficios son personales: entrá con tu perfil para verlos (en la demo, "Cliente recurrente").' }]
    const mine = s.benefits.filter((b) => b.businessId === biz && b.customerId === customerId && b.status === 'disponible' && b.expiresAt >= s.clock.nowMs)
    if (!mine.length) return [{ text: 'No tenés beneficios disponibles en este negocio. Cuando el local lance uno para vos, aparece en Mis beneficios.', link: { label: 'Mis beneficios', to: `${root}/beneficios` } }]
    return [{
      text: `Tenés ${mine.length} beneficio(s). Se usan escribiendo el código en Mi pedido antes de enviar; el descuento se valida al enviar.`,
      items: mine.map((b) => { const c = s.campaigns.find((x) => x.id === b.campaignId)!; return { id: b.code, name: c.name, detail: `${c.benefit.type === 'porcentaje' ? `${c.benefit.value} %` : ARS(c.benefit.value)} · código ${b.code} · vence en ${benefitDaysLeft(s, b)} día(s)` } }),
      link: { label: 'Mis beneficios', to: `${root}/beneficios` },
    }]
  }
  if (/horario|abren|abierto|cierran|hasta que hora|a que hora/.test(n)) {
    const ws = windowsFor(s, locationId, dateKeyOf(s.clock.nowMs))
    return [{ text: ws.length ? `Hoy: ${ws.map((w) => `${w.label} de ${hhmm(w.startMin)} a ${hhmm(w.endMin)}`).join('; ')} (reloj simulado).` : 'Hoy no hay servicio en esta sede.' }]
  }
  if (/gusto|sabor/.test(n) && biz === 'copo') {
    return [{ text: 'Gustos de hoy en la vitrina:', items: GUSTOS.map(([id, name, ing]) => { const st = s.ingredients.find((i) => i.id === ing)?.alertState; return { id, name, detail: st === 'agotado' ? 'volvemos pronto' : st === 'bajo' ? 'queda poco' : 'hay' } }) }]
  }
  if (/tacc|celiac|gluten|vegetarian|vegan|alergi|lactosa/.test(n)) {
    const glutenFree = /tacc|celiac|gluten/.test(n)
    const list = items.filter((m) => m.foodNote.status === 'completa' && (glutenFree ? !m.foodNote.allergens.some((a) => /gluten/i.test(a)) : /vegetarian|vegan/.test(n) ? m.tags.some((t) => /vegetarian|vegan/i.test(t)) : true))
    return [{
      text: glutenFree ? 'Según la información de muestra del local, estos platos no declaran gluten (consultá siempre al equipo: puede haber contaminación cruzada):' : 'Según la información de muestra del local:',
      items: list.slice(0, 8).map((m) => ({ id: m.id, name: m.name, detail: m.foodNote.allergens.length ? `contiene: ${m.foodNote.allergens.join(', ')}` : 'sin alérgenos declarados' })),
    }]
  }
  const item = itemMatch(items, n)
  if (item && /cuanto|precio|sale|vale|cuesta|tiene|hay/.test(n)) {
    const un = itemUnavailable(s, item, locationId)
    return [{ text: `${item.name}: ${ARS(item.priceCents)}${un ? ' (hoy no disponible)' : ''}. ${item.description}`, link: { label: 'Verlo en la carta', to: `${root}/carta/${item.id}` } }]
  }
  const cats = [...new Set(items.map((m) => m.category))]
  const cat = cats.find((c) => normalize(c).split(' ').some((w) => w.length > 4 && n.includes(w.replace(/s$/, ''))))
  if (cat) return [{ text: `En ${cat}:`, items: items.filter((m) => m.category === cat).map((m) => ({ id: m.id, name: m.name, detail: ARS(m.priceCents) })) }]
  if (/carta|menu|que hay|que tienen|categor/.test(n)) return [{ text: `La carta tiene: ${cats.join(', ')}.`, link: { label: 'Ver la carta', to: `${root}/carta` } }]
  return [{ text: 'No tengo esa respuesta. Soy un asistente simulado con reglas fijas: puedo ayudarte con la carta, horarios, tus pedidos y tus beneficios.' }]
}
