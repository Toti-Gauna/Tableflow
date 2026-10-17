/**
 * P5-L7 · Comandos de códigos: registrar un escaneo, canjear (entregar un pedido, registrar la llegada) y reclamar el
 * beneficio de una campaña. Todo se vuelve a leer del store: lo que diga el QR o el lector no tiene autoridad sobre
 * estados ni importes, y repetir la misma operación no repite el efecto.
 */
import { audit, byId, dup, fail, ok, type Outcome } from './core'
import { makeBenefit } from './benefits'
import { bookingHandlers } from './cmd-booking'
import { commerceHandlers, type Handler } from './cmd-commerce'
import { checkCode, STATUS_LABEL, type ScanContext } from './qr'
import type { AppState, Role } from './types'

const STAFF: (Role | 'sistema')[] = ['recepcion', 'mozo', 'cocina', 'caja', 'encargado', 'sistema']
export type ScanVia = 'camara' | 'imagen' | 'manual' | 'simulado'
const VIAS: ScanVia[] = ['camara', 'imagen', 'manual', 'simulado']

const scanCtx = (s: AppState, c: any, ctx: { actor: Role | 'sistema' }): ScanContext | Outcome => {
  const biz = byId(s.businesses, c.businessId)
  if (!biz) return fail('negocio-inexistente', 'Negocio inexistente.')
  const loc = s.locations.find((l) => l.businessId === biz.id && l.id === c.locationId)
  if (!loc) return fail('sede-inexistente', 'Sede inexistente.')
  const side = STAFF.includes(ctx.actor) ? 'comercio' : 'cliente'
  return { businessId: biz.id, locationId: loc.id, side, customerId: side === 'cliente' ? (c.customerId ?? null) : null }
}
const isOutcome = (x: ScanContext | Outcome): x is Outcome => 'ok' in x

const priorOp = (s: AppState, operationId: string, type: string) => s.audit.find((a) => a.operationId === operationId && a.type === type)
const clip = (text: string) => String(text ?? '').slice(0, 200)

/** Registra el escaneo (quién, cómo y qué estado tenía) sin cambiar el código. Repetir la misma operación no lo duplica. */
const codeScan: Handler = (s, c, ctx) => {
  if (!c.operationId) return fail('sin-operacion', 'Falta el identificador de la operación.')
  const sc = scanCtx(s, c, ctx)
  if (isOutcome(sc)) return sc
  const via: ScanVia = VIAS.includes(c.via) ? c.via : 'manual'
  const prev = priorOp(s, c.operationId, 'code.scanned')
  const check = checkCode(s, sc, clip(c.text))
  if (prev) return dup({ check }, 'Ese escaneo ya estaba registrado: no se contó dos veces.')
  audit(s, ctx, sc.businessId, 'code.scanned', 'Code', check.ref || '—', `Escaneo (${via}) · ${check.kind ?? 'sin tipo'} ${check.ref || '—'} → ${STATUS_LABEL[check.status]}`, c.operationId)
  return ok({ check })
}

/** Canjea el código en el comercio: entrega el pedido o registra la llegada de la reserva. Una sola vez. */
const codeRedeem: Handler = (s, c, ctx) => {
  if (!c.operationId) return fail('sin-operacion', 'Falta el identificador de la operación.')
  if (!STAFF.includes(ctx.actor)) return fail('rol-sin-permiso', 'Los códigos se canjean desde el comercio (vista de demostración, no es seguridad).')
  const sc = scanCtx(s, c, ctx)
  if (isOutcome(sc)) return sc
  if (priorOp(s, c.operationId, 'code.redeemed')) return dup({ check: checkCode(s, sc, clip(c.text)) }, 'Ese canje ya estaba registrado: no se repitió.')
  const check = checkCode(s, sc, clip(c.text))
  if (check.status === 'usado') return dup({ check }, `${check.title}: ya estaba canjeado. No se registró otra vez.`)
  if (!check.usable || !check.action || check.action.type === 'reclamar') {
    return fail('codigo-no-canjeable', check.action ? check.detail : `${check.title}: ${check.detail}`, { check })
  }
  let out: Outcome
  if (check.action.type === 'entregar') out = commerceHandlers['order/deliver'](s, { orderId: check.ref }, ctx)
  else out = bookingHandlers['res/arrive'](s, { id: check.ref }, ctx)
  if (!out.ok) return out
  audit(s, ctx, sc.businessId, 'code.redeemed', 'Code', check.ref, `Canje por código: ${check.title} (${check.action.label.toLowerCase()})`, c.operationId)
  return ok({ check: checkCode(s, sc, clip(c.text)) }, `${check.title}: ${check.action.label.toLowerCase()} registrado.`)
}

/** El cliente reclama el beneficio de una campaña activa desde su QR. Respeta cupo, audiencia y tope por cliente. */
const campaignClaim: Handler = (s, c, ctx) => {
  if (!c.operationId) return fail('sin-operacion', 'Falta el identificador de la operación.')
  if (STAFF.includes(ctx.actor)) return fail('rol-sin-permiso', 'El beneficio lo reclama el cliente desde su QR.')
  const sc = scanCtx(s, c, ctx)
  if (isOutcome(sc)) return sc
  if (!sc.customerId) return fail('cliente-requerido', 'Para reclamar tu beneficio tenés que estar identificado como cliente.')
  const prev = priorOp(s, c.operationId, 'campaign.claimed')
  if (prev) return dup({ entityId: prev.entityId }, 'Ya reclamaste ese beneficio: no se emitió otro.')
  const camp = s.campaigns.find((x) => x.businessId === sc.businessId && x.id === c.campaignId)
  if (!camp) return fail('campana-inexistente', 'Campaña inexistente.')
  const check = checkCode(s, sc, `/${sc.businessId}/q/campana/${camp.id}`)
  if (check.status === 'duplicado') return dup({ check }, check.detail)
  if (!check.usable || check.action?.type !== 'reclamar') return fail('codigo-no-canjeable', `${check.title}: ${check.detail}`, { check })
  const b = makeBenefit(s, ctx, camp, sc.customerId)
  s.benefits.push(b)
  audit(s, ctx, sc.businessId, 'campaign.claimed', 'CustomerBenefit', b.id, `${camp.name}: beneficio ${b.code} reclamado con el QR de la campaña (sin envío).`, c.operationId)
  return ok({ benefitId: b.id, code: b.code }, `Listo: tu beneficio ${b.code} ya está en Mis beneficios.`)
}

export const codeHandlers: Record<string, Handler> = {
  'code/scan': codeScan,
  'code/redeem': codeRedeem,
  'campaign/claim': campaignClaim,
}
