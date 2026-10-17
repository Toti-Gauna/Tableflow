/**
 * P5-L6 · Comandos de fidelización: costos, ciclo de campaña (borrador → aprobada → activa/programada → pausada →
 * finalizada/cancelada), anulación de beneficios, referidos y beneficio en el carrito. Todo simulado: no sale nada real.
 */
import { audit, byId, dup, fail, nextId, ok, type Ctx, type DomainEvent } from './core'
import type { Handler } from './cmd-commerce'
import { benefitProblem, expireBenefits, findBenefit, issueBenefits } from './benefits'
import { campaignDays, projectCampaign } from './growth'
import { activeCustomers, ensureCustomer } from './customers'
import { dateKeyOf, isValidDateKey } from './time'
import { SEASON_IDS } from './season'
import type { AppState, Campaign, Role } from './types'

const STAFF_EDIT: (Role | 'sistema')[] = ['encargado', 'sistema']
const isInt = (v: unknown) => typeof v === 'number' && Number.isInteger(v)

// ---------------------------------------------------------------- costos
const costSet: Handler = (s, c, ctx) => {
  if (!STAFF_EDIT.includes(ctx.actor)) return fail('rol-sin-permiso', 'Los costos los carga el encargado (vista de demostración, no es seguridad).')
  const okVal = (v: unknown) => v === null || (isInt(v) && (v as number) >= 0)
  if (c.itemId) {
    const item = byId(s.menuItems, c.itemId)
    if (!item) return fail('item-inexistente', 'Ítem inexistente.')
    if (!okVal(c.costCents) || !okVal(c.variableCents)) return fail('valor-invalido', 'El costo debe ser un importe en centavos mayor o igual a 0, o vacío (ND).')
    if (item.costCents === c.costCents && item.variableCents === c.variableCents) return dup()
    item.costCents = c.costCents
    item.variableCents = c.variableCents
    item.version++
    audit(s, ctx, item.businessId, 'cost.updated', 'MenuItem', item.id, `Costo de ${item.name}: producto ${c.costCents === null ? 'ND' : c.costCents / 100}, variables ${c.variableCents === null ? 'ND' : c.variableCents / 100}`)
    return ok()
  }
  const g = s.modifierGroups.find((x) => x.options.some((o) => o.id === c.optionId))
  const o = g?.options.find((x) => x.id === c.optionId)
  if (!g || !o) return fail('opcion-inexistente', 'Opción inexistente.')
  if (!okVal(c.costCents)) return fail('valor-invalido', 'El costo debe ser un importe en centavos mayor o igual a 0, o vacío (ND).')
  if (o.costCents === c.costCents) return dup()
  o.costCents = c.costCents
  audit(s, ctx, g.businessId, 'cost.updated', 'ModifierOption', o.id, `Costo del extra ${o.name}: ${c.costCents === null ? 'ND' : c.costCents / 100}`)
  return ok()
}

// ---------------------------------------------------------------- campañas
type Draft = Omit<Campaign, 'id' | 'businessId' | 'createdAt' | 'version' | 'status' | 'approvedBy' | 'activatedAt' | 'lastIssuedKey' | 'reason' | 'operationId'>
export function validateCampaign(s: AppState, businessId: string, d: Partial<Draft>): Record<string, string> {
  const e: Record<string, string> = {}
  if (!d.name || !String(d.name).trim()) e.name = 'Poné un nombre a la campaña.'
  if (!['individual', 'segmento', 'masiva'].includes(String(d.scope))) e.scope = 'Elegí a quién va: clientes puntuales, un segmento o todos.'
  if (!['manual', 'programada', 'evento'].includes(String(d.trigger))) e.trigger = 'Elegí cómo se dispara.'
  if (d.trigger === 'evento' && !['primer-pedido', 'referido'].includes(String(d.event))) e.event = 'Elegí el evento que la dispara.'
  if (!d.startKey || !isValidDateKey(d.startKey) || !d.endKey || !isValidDateKey(d.endKey) || d.endKey < d.startKey) e.dates = 'Las fechas deben ser válidas y el fin no puede ser anterior al inicio.'
  if (['estacional', 'festividad'].includes(String(d.cadence)) && !SEASON_IDS.includes(d.seasonId as never)) e.seasonId = 'Elegí la estación o festividad.'
  if (d.scope === 'individual') {
    const ids = d.audience?.customerIds ?? []
    if (!ids.length) e.audience = 'Elegí al menos un cliente.'
    else if (ids.some((id) => !activeCustomers(s, businessId as never).some((x) => x.id === id))) e.audience = 'Hay clientes que no son de este negocio.'
  }
  if (d.scope === 'segmento' && !d.audience?.segment) e.audience = 'Elegí el segmento.'
  const b = d.benefit
  if (!b || !['porcentaje', 'monto'].includes(b.type) || !isInt(b.value) || b.value <= 0) e.benefit = 'El beneficio debe ser un porcentaje o un monto mayor a 0.'
  else if (b.type === 'porcentaje' && b.value > 90) e.benefit = 'Un porcentaje mayor a 90 no tiene sentido como beneficio de muestra.'
  if (b?.itemIds?.some((id) => !s.menuItems.some((m) => m.id === id && m.businessId === businessId))) e.benefit = 'Hay ítems del beneficio que no son de esta carta.'
  if (b?.itemIds?.some((id) => s.menuItems.find((m) => m.id === id)?.tags.includes('+18'))) e.benefit = 'No se hacen beneficios sobre bebidas con alcohol.'
  const r = d.rules
  if (!r || ![r.minOrderCents, r.maxDiscountCents, r.budgetCents].every((v) => isInt(v) && v >= 0) || !isInt(r.validDays) || r.validDays < 1 || r.validDays > 90 || !isInt(r.maxPerCustomer) || r.maxPerCustomer < 1 || !isInt(r.totalCap) || r.totalCap < 1) e.rules = 'Revisá las reglas: vigencia de 1 a 90 días, tope por cliente y cupo de al menos 1, importes no negativos.'
  else if (r.budgetCents <= 0) e.rules = 'Poné un presupuesto mayor a 0: sin presupuesto no hay campaña.'
  if (d.fixedCostCents !== null && d.fixedCostCents !== undefined && (!isInt(d.fixedCostCents) || d.fixedCostCents < 0)) e.fixedCostCents = 'El costo fijo debe ser 0 o más (o vacío si todavía no lo sabés).'
  if (d.assumedRedemptionPct !== null && d.assumedRedemptionPct !== undefined && (!isInt(d.assumedRedemptionPct) || d.assumedRedemptionPct < 0 || d.assumedRedemptionPct > 100)) e.assumedRedemptionPct = 'El supuesto de canje va de 0 a 100 %.'
  if (d.refItemId && !s.menuItems.some((m) => m.id === d.refItemId && m.businessId === businessId)) e.refItemId = 'El ítem de referencia no es de esta carta.'
  return e
}

const campaignSave: Handler = (s, c, ctx) => {
  if (!STAFF_EDIT.includes(ctx.actor)) return fail('rol-sin-permiso', 'Las campañas las arma el encargado (vista de demostración).')
  const biz = byId(s.businesses, c.businessId)
  if (!biz) return fail('negocio-inexistente', 'Negocio inexistente.')
  const d = c.draft as Draft
  const errors = validateCampaign(s, biz.id, d)
  if (Object.keys(errors).length) return fail('validacion', 'Revisá los datos de la campaña.', { errors })
  const fields = {
    name: String(d.name).trim(), scope: d.scope, trigger: d.trigger, event: d.trigger === 'evento' ? d.event : null, cadence: d.cadence ?? 'unica',
    seasonId: d.seasonId ?? null, startKey: d.startKey, endKey: d.endKey,
    audience: { customerIds: d.scope === 'individual' ? [...d.audience.customerIds] : [], segment: d.scope === 'segmento' ? d.audience.segment : null },
    benefit: { type: d.benefit.type, value: d.benefit.value, itemIds: [...(d.benefit.itemIds ?? [])] }, rules: { ...d.rules },
    refItemId: d.refItemId ?? null, fixedCostCents: d.fixedCostCents ?? null, assumedRedemptionPct: d.assumedRedemptionPct ?? null,
  }
  if (c.campaignId) {
    const cur = byId(s.campaigns, c.campaignId)
    if (!cur || cur.businessId !== biz.id) return fail('campana-inexistente', 'Campaña inexistente.')
    if (!['borrador', 'aprobada'].includes(cur.status)) return fail('estado-invalido', 'Solo se editan borradores o campañas aprobadas que todavía no salieron.')
    const was = cur.status
    Object.assign(cur, fields)
    cur.status = 'borrador'
    cur.approvedBy = null
    cur.version++
    audit(s, ctx, biz.id, 'campaign.updated', 'Campaign', cur.id, `${cur.name}: editada${was === 'aprobada' ? '; vuelve a borrador y pide una nueva aprobación' : ''}`)
    return ok({ campaignId: cur.id })
  }
  if (!c.operationId) return fail('sin-operacion', 'Falta el identificador de la operación.')
  const existing = s.campaigns.find((x) => x.operationId === c.operationId)
  if (existing) return dup({ campaignId: existing.id }, 'Esa campaña ya estaba creada.')
  const camp: Campaign = {
    id: nextId(s, 'CMP', 3, biz.id), businessId: biz.id, createdAt: ctx.now, version: 1, ...fields,
    status: 'borrador', createdBy: c.createdBy === 'asistente' ? 'asistente' : (ctx.actor as Role), approvedBy: null, activatedAt: null, lastIssuedKey: null, reason: null, operationId: c.operationId,
  } as Campaign
  s.campaigns.push(camp)
  audit(s, ctx, biz.id, 'campaign.drafted', 'Campaign', camp.id, `Borrador ${camp.id} “${camp.name}”${camp.createdBy === 'asistente' ? ' creado por el asistente: requiere aprobación' : ''}`)
  return ok({ campaignId: camp.id }, `Borrador ${camp.id} guardado. Necesita aprobación antes de salir.`)
}

const getCampaign = (s: AppState, id: string) => byId(s.campaigns, id)

const campaignApprove: Handler = (s, c, ctx) => {
  if (!STAFF_EDIT.includes(ctx.actor)) return fail('rol-sin-permiso', 'Solo el encargado aprueba campañas (vista de demostración).')
  const camp = getCampaign(s, c.campaignId)
  if (!camp) return fail('campana-inexistente', 'Campaña inexistente.')
  if (camp.status === 'aprobada') return dup()
  if (camp.status !== 'borrador') return fail('estado-invalido', 'Solo se aprueba un borrador.')
  const p = projectCampaign(s, camp)
  if (!p.complete) return fail('datos-faltantes', `Faltan datos para aprobar: ${p.missing.join('; ')}. Queda en borrador.`, { missing: p.missing })
  camp.status = 'aprobada'
  camp.approvedBy = ctx.actor as Role
  camp.version++
  audit(s, ctx, camp.businessId, 'campaign.approved', 'Campaign', camp.id, `${camp.name}: aprobada con proyección completa (equilibrio ${p.breakEvenOrders ?? 'sin equilibrio por volumen'})`)
  return ok()
}

const campaignActivate: Handler = (s, c, ctx) => {
  if (!STAFF_EDIT.includes(ctx.actor)) return fail('rol-sin-permiso', 'Solo el encargado activa campañas (vista de demostración).')
  const camp = getCampaign(s, c.campaignId)
  if (!camp) return fail('campana-inexistente', 'Campaña inexistente.')
  if (['activa', 'programada'].includes(camp.status)) return dup()
  if (camp.status !== 'aprobada') return fail('requiere-aprobacion', 'La campaña tiene que estar aprobada antes de salir.')
  const today = dateKeyOf(ctx.now)
  if (today > camp.endKey) return fail('campana-vencida', 'La fecha de fin ya pasó: editá las fechas.')
  camp.activatedAt = ctx.now
  if (camp.trigger === 'manual') {
    camp.status = 'activa'
    const n = issueBenefits(s, ctx, camp)
    audit(s, ctx, camp.businessId, 'campaign.activated', 'Campaign', camp.id, `${camp.name}: activa (manual)`)
    return ok({ issued: n }, `Campaña activa: ${n} beneficio(s) emitido(s). Los envíos son simulados.`)
  }
  if (camp.trigger === 'evento') {
    camp.status = 'activa'
    camp.version++
    audit(s, ctx, camp.businessId, 'campaign.activated', 'Campaign', camp.id, `${camp.name}: activa por evento (${camp.event})`)
    return ok({ issued: 0 }, 'Campaña activa: emite beneficios cuando ocurre el evento.')
  }
  camp.status = 'programada'
  camp.version++
  audit(s, ctx, camp.businessId, 'campaign.scheduled', 'Campaign', camp.id, `${camp.name}: programada (${camp.cadence}) del ${camp.startKey} al ${camp.endKey}`)
  const n = scheduledTick(s, ctx, camp)
  return ok({ issued: n }, n ? `Campaña programada: hoy le toca y emitió ${n} beneficio(s).` : 'Campaña programada: emite en su próxima fecha según el reloj simulado.')
}

const campaignPause: Handler = (s, c, ctx) => {
  const camp = getCampaign(s, c.campaignId)
  if (!camp) return fail('campana-inexistente', 'Campaña inexistente.')
  if (camp.status === 'pausada') return dup()
  if (!['activa', 'programada'].includes(camp.status)) return fail('estado-invalido', 'Solo se pausa una campaña activa o programada.')
  camp.reason = camp.status // recuerda a qué estado volver
  camp.status = 'pausada'
  camp.version++
  audit(s, ctx, camp.businessId, 'campaign.paused', 'Campaign', camp.id, `${camp.name}: pausada (no emite; los beneficios ya emitidos siguen valiendo)`)
  return ok()
}
const campaignResume: Handler = (s, c, ctx) => {
  const camp = getCampaign(s, c.campaignId)
  if (!camp) return fail('campana-inexistente', 'Campaña inexistente.')
  if (camp.status !== 'pausada') return fail('estado-invalido', 'Solo se reanuda una campaña pausada.')
  camp.status = camp.reason === 'programada' ? 'programada' : 'activa'
  camp.reason = null
  camp.version++
  audit(s, ctx, camp.businessId, 'campaign.resumed', 'Campaign', camp.id, `${camp.name}: reanudada`)
  return ok()
}
const campaignFinish: Handler = (s, c, ctx) => {
  const camp = getCampaign(s, c.campaignId)
  if (!camp) return fail('campana-inexistente', 'Campaña inexistente.')
  if (camp.status === 'finalizada') return dup()
  if (!['activa', 'programada', 'pausada'].includes(camp.status)) return fail('estado-invalido', 'Solo se finaliza una campaña que salió.')
  camp.status = 'finalizada'
  camp.reason = null
  camp.version++
  audit(s, ctx, camp.businessId, 'campaign.finished', 'Campaign', camp.id, `${camp.name}: finalizada (no emite más; lo ya emitido vale hasta su vencimiento)`)
  return ok()
}
const campaignCancel: Handler = (s, c, ctx) => {
  const camp = getCampaign(s, c.campaignId)
  if (!camp) return fail('campana-inexistente', 'Campaña inexistente.')
  if (camp.status === 'cancelada') return dup()
  if (camp.status === 'finalizada') return fail('estado-invalido', 'Una campaña finalizada no se cancela.')
  const reason = String(c.reason ?? '').trim()
  if (!reason) return fail('motivo-requerido', 'Indicá el motivo de la cancelación.')
  let voided = 0
  for (const b of s.benefits) {
    if (b.campaignId === camp.id && b.status === 'disponible') {
      b.status = 'anulado'
      b.reason = `Campaña cancelada: ${reason}`
      b.version++
      voided++
    }
  }
  camp.status = 'cancelada'
  camp.reason = reason
  camp.version++
  audit(s, ctx, camp.businessId, 'campaign.cancelled', 'Campaign', camp.id, `${camp.name}: cancelada (${reason}); ${voided} beneficio(s) sin usar anulado(s), los canjeados no cambian`)
  return ok({ voided })
}

const benefitVoid: Handler = (s, c, ctx) => {
  if (!['encargado', 'caja', 'sistema'].includes(ctx.actor)) return fail('rol-sin-permiso', 'Anular un beneficio es tarea de caja o del encargado (vista de demostración).')
  const b = byId(s.benefits, c.benefitId)
  if (!b) return fail('beneficio-inexistente', 'Beneficio inexistente.')
  if (b.status === 'anulado') return dup()
  if (b.status !== 'disponible') return fail('estado-invalido', 'Solo se anula un beneficio disponible. Uno canjeado se revierte cancelando o rechazando su pedido.')
  const reason = String(c.reason ?? '').trim()
  if (!reason) return fail('motivo-requerido', 'Indicá el motivo.')
  b.status = 'anulado'
  b.reason = reason
  b.version++
  audit(s, ctx, b.businessId, 'benefit.voided', 'CustomerBenefit', b.id, `Beneficio ${b.code} anulado: ${reason}`)
  return ok()
}

// ---------------------------------------------------------------- referidos
const referralCreate: Handler = (s, c, ctx) => {
  const biz = byId(s.businesses, c.businessId)
  if (!biz) return fail('negocio-inexistente', 'Negocio inexistente.')
  if (!c.operationId) return fail('sin-operacion', 'Falta el identificador de la operación.')
  const prev = s.referrals.find((r) => r.operationId === c.operationId)
  if (prev) return dup({ referralId: prev.id })
  const referrer = activeCustomers(s, biz.id).find((x) => x.id === c.referrerId)
  if (!referrer) return fail('cliente-inexistente', 'Quien recomienda tiene que ser cliente de este negocio.')
  const alias = String(c.referredAlias ?? '').trim()
  if (!alias) return fail('alias-requerido', 'Poné el nombre (alias de muestra) de la persona recomendada.')
  if (/\d{6,}|@\w+\.\w+/.test(alias.replace(/[\s.-]/g, ''))) return fail('sin-contacto', 'Solo un nombre: la demo no guarda teléfonos ni correos.')
  const referred = ensureCustomer(s, ctx, biz.id, alias)
  if (referred.id === referrer.id) return fail('referido-invalido', 'Una persona no se puede recomendar a sí misma.')
  if (s.referrals.some((r) => r.referredId === referred.id)) return fail('referido-duplicado', `${referred.alias} ya figura como recomendada.`)
  if (s.orders.some((o) => o.customerId === referred.id && !['rechazado', 'cancelado'].includes(o.status))) return fail('referido-existente', `${referred.alias} ya es cliente: el referido es para alguien nuevo.`)
  const r = { id: nextId(s, 'REF', 3, biz.id), businessId: biz.id, createdAt: ctx.now, version: 1, referrerId: referrer.id, referredId: referred.id, status: 'pendiente' as const, operationId: c.operationId }
  s.referrals.push(r)
  audit(s, ctx, biz.id, 'referral.created', 'Referral', r.id, `${referrer.alias} recomendó a ${referred.alias} (se cumple con su primer pedido entregado)`)
  return ok({ referralId: r.id })
}

// ---------------------------------------------------------------- beneficio en el carrito
const cartSetBenefit: Handler = (s, c, ctx) => {
  const cart = byId(s.carts, c.cartId)
  if (!cart) return fail('carrito-inexistente', 'Carrito inexistente.')
  if (!c.code) {
    if (!cart.benefitCode) return dup()
    cart.benefitCode = null
    cart.version++
    cart.updatedAt = ctx.now
    return ok({}, 'Quitaste el beneficio del pedido.')
  }
  const b = findBenefit(s, cart.businessId, String(c.code))
  const customerId = s.session.customerByBusiness[cart.businessId] ?? cart.customerId
  if (!b) return fail('beneficio-inexistente', 'No encontramos un beneficio con ese código en este negocio.')
  const problem = benefitProblem(s, b, customerId)
  if (problem) return fail('beneficio-invalido', problem)
  if (cart.lines.some((l) => l.giftId)) return fail('beneficio-no-acumulable', 'Un beneficio no se acumula con una invitación en el mismo pedido.')
  cart.benefitCode = b.code
  cart.version++
  cart.updatedAt = ctx.now
  return ok({ benefitId: b.id }, `Beneficio ${b.code} elegido: el descuento se calcula y valida al enviar.`)
}

// ---------------------------------------------------------------- eventos y reloj
/** Emite en la ocurrencia del día de una campaña programada (una vez por día). */
function scheduledTick(s: AppState, ctx: Ctx, camp: Campaign): number {
  const today = dateKeyOf(ctx.now)
  if (camp.lastIssuedKey === today) return 0
  if (!campaignDays(camp, today, today).length) return 0
  return issueBenefits(s, ctx, camp)
}
export function growthOnEvent(s: AppState, ctx: Ctx, ev: DomainEvent) {
  if (ev.type === 'clock.advanced') {
    expireBenefits(s, ctx)
    const today = dateKeyOf(ctx.now)
    for (const camp of s.campaigns) {
      if (['activa', 'programada', 'pausada'].includes(camp.status) && today > camp.endKey) {
        camp.status = 'finalizada'
        camp.version++
        audit(s, ctx, camp.businessId, 'campaign.finished', 'Campaign', camp.id, `${camp.name}: finalizada por fecha`)
        continue
      }
      if (camp.status === 'programada' && camp.trigger === 'programada') scheduledTick(s, ctx, camp)
    }
    return
  }
  if (ev.type === 'order.delivered') {
    const o = byId(s.orders, ev.entityId)
    if (!o || !o.customerId) return
    const delivered = s.orders.filter((x) => x.customerId === o.customerId && ['retirado', 'servido', 'cerrado'].includes(x.status))
    const history = s.customerHistory.find((h) => h.customerId === o.customerId)
    const first = delivered.length === 1 && !history
    const active = s.campaigns.filter((x) => x.businessId === o.businessId && x.status === 'activa' && x.trigger === 'evento' && dateKeyOf(ctx.now) >= x.startKey)
    if (first) for (const camp of active.filter((x) => x.event === 'primer-pedido')) issueBenefits(s, ctx, camp, [o.customerId])
    const ref = s.referrals.find((r) => r.referredId === o.customerId && r.status === 'pendiente')
    if (ref && first) {
      ref.status = 'cumplido'
      ref.version++
      audit(s, ctx, ref.businessId, 'referral.fulfilled', 'Referral', ref.id, 'Referido cumplido: primer pedido entregado')
      for (const camp of active.filter((x) => x.event === 'referido')) issueBenefits(s, ctx, camp, [ref.referrerId])
    }
  }
}

export const growthHandlers: Record<string, Handler> = {
  'cost/set': costSet,
  'campaign/save': campaignSave,
  'campaign/approve': campaignApprove,
  'campaign/activate': campaignActivate,
  'campaign/pause': campaignPause,
  'campaign/resume': campaignResume,
  'campaign/finish': campaignFinish,
  'campaign/cancel': campaignCancel,
  'benefit/void': benefitVoid,
  'referral/create': referralCreate,
  'cart/setBenefit': cartSetBenefit,
}
