import { test, expect, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { fresh, state } from './helpers'

// P5-L8 · Animaciones transaccionales, temporadas y carga. Las piezas solo reproducen lo persistido.
type Case = { loc?: string; lines: [string, number, Record<string, string[]>][]; kind: 'retiro' | 'mesa'; advance?: number }
const CASES: Record<string, Case> = {
  'ritual-cafe': { loc: 'L-RC-centro', lines: [['RC-11', 2, {}], ['RC-03', 1, { 'MG-leche': ['le-entera'] }]], kind: 'retiro' },
  copo: { lines: [['CO-02', 1, { 'MG-CO-gustos-2': ['hg-pistacho', 'hg-frutilla'], 'MG-CO-bano': ['hb-chocolate'] }]], kind: 'retiro' },
  brasa: { lines: [['BR-01', 1, { 'MG-BR-combo': ['bc-mediano'], 'MG-BR-acomp': ['ba-papas'], 'MG-BR-bebida': ['bb-cola'], 'MG-BR-sin': ['bs-pepino'] }]], kind: 'retiro' },
  'mesa-clara': { lines: [['MC-12', 1, { 'MG-guarnicion': ['gu-papas-fritas'] }], ['MC-28', 1, { 'MG-vino': ['vi-tinto'] }]], kind: 'mesa', advance: 150 },
  compas: { lines: [['TC-01', 1, { 'MG-TC-racion': ['tr-tapa'] }], ['TC-02', 1, {}], ['TC-13', 1, { 'MG-TC-vermut': ['tv-soda'] }], ['TC-09', 1, {}]], kind: 'mesa', advance: 1860 },
}
const MOTION: Record<string, string> = { 'ritual-cafe': 'MO-CAF', copo: 'MO-HEL', brasa: 'MO-FR', 'mesa-clara': 'MO-RES', compas: 'MO-BAR' }

/** Pedido real enviado como cliente (comandos del store, igual que la UI). */
async function placeOrder(page: Page, biz: string): Promise<string> {
  const id = await page.evaluate(({ biz, c }) => {
    const t = (window as any).__tableflow
    t.dispatch({ type: 'session/setBusiness', businessId: biz })
    if (c.advance) t.dispatch({ type: 'clock/advance', minutes: c.advance })
    t.dispatch({ type: 'session/setRole', role: 'cliente-recurrente' })
    const s0 = t.getState()
    const loc = c.loc ?? s0.session.locationByBusiness[biz]
    for (const [itemId, qty, selections] of c.lines) {
      const o = t.dispatch({ type: 'cart/add', businessId: biz, locationId: loc, itemId, qty, selections })
      if (!o.ok) return `add ${itemId}: ${o.message}`
    }
    const cartId = `CART-${loc}`
    const tries = c.kind === 'mesa' ? [null] : Array.from({ length: 40 }, (_, i) => 10 * 60 + 30 + i * 15)
    let last = ''
    for (const sm of tries) {
      const f = c.kind === 'mesa' ? { kind: 'mesa', tableId: s0.tables.find((x: any) => x.locationId === loc).id } : { kind: 'retiro', startMin: sm }
      t.dispatch({ type: 'cart/setFulfillment', cartId, fulfillment: f, alias: 'Prueba' })
      const op = t.dispatch({ type: 'cart/begin', cartId }).data?.operationId
      const o = t.dispatch({ type: 'order/submit', cartId, operationId: op })
      if (o.ok) return o.data.orderId
      last = o.message
    }
    return `submit: ${last}`
  }, { biz, c: CASES[biz] })
  expect(id, id).toMatch(/^O-/)
  return id
}
/** Abre el seguimiento y espera a verlo "enviado": la regla de visto necesita que esta pestaña lo haya visto antes. */
async function openOrder(page: Page, biz: string, id: string) {
  await page.goto(`/#/${biz}/pedido/${id}`)
  await expect(page.getByTestId('sent-tick')).toBeVisible()
}
const accept = (page: Page, id: string) => page.evaluate((x) => (window as any).__tableflow.dispatch({ type: 'order/accept', orderId: x, actor: 'encargado' }), id)
const motion = (page: Page) => page.evaluate(() => (window as any).__tableflowMotion ?? { active: 0, played: 0 })
const moment = (page: Page) => page.getByTestId('order-moment')
/** Lo que el negocio guarda (sin auditoría de navegación): la animación no puede cambiarlo. */
const business = (page: Page) => page.evaluate(() => {
  const s = (window as any).__tableflow.getState()
  return JSON.stringify([s.orders, s.payments, s.tableSessions, s.benefits, s.gifts, s.reservations, s.cashSessions])
})

test('MO-CAF/HEL/FR/RES/BAR: cada negocio reproduce su pieza al aceptarse el pedido, termina en su comprobante y no cambia nada', async ({ page }) => {
  test.setTimeout(120_000)
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(String(e)))
  await fresh(page, '/#/ritual-cafe')
  for (const biz of Object.keys(CASES)) {
    const id = await placeOrder(page, biz)
    await page.goto(`/#/${biz}/pedido/${id}`)
    await expect(page.getByTestId('sent-tick')).toBeVisible() // envío simulado ≠ aceptación
    await expect(moment(page)).toHaveCount(0)
    const before = await business(page)
    const t0 = Date.now()
    await accept(page, id)
    await expect(moment(page)).toHaveAttribute('data-phase', 'playing')
    await expect(moment(page)).toHaveAttribute('data-motion-id', MOTION[biz])
    await expect(moment(page)).toHaveAttribute('data-phase', 'done', { timeout: 4000 })
    const took = Date.now() - t0
    expect(took, `${biz}: ${took} ms`).toBeLessThan(3600)
    const o = (await state(page)).orders.find((x: any) => x.id === id)
    if (o.kind === 'retiro') await expect(page.getByTestId('moment-number')).toHaveText(o.pickupCode)
    else await expect(page.getByTestId('moment-number')).toContainText('Mesa')
    // la pieza no toca el negocio (solo el accept, que ya pasó)
    const after = await business(page)
    await page.getByTestId('moment-replay').click()
    await expect(moment(page)).toHaveAttribute('data-phase', 'done', { timeout: 4000 })
    expect(await business(page)).toBe(after)
    expect(before).not.toBe(after) // el cambio lo hizo el comando de aceptar, no la animación
  }
  // café: el ticket recuerda el pago en el local; bar y restaurante no dibujan el alcohol
  expect(errors).toEqual([])
})

test('MO-CAF: termina en ticket con "pago en el local pendiente"; MO-BAR y MO-RES nunca dibujan alcohol', async ({ page }) => {
  await fresh(page, '/#/ritual-cafe')
  const id = await placeOrder(page, 'ritual-cafe')
  await openOrder(page, 'ritual-cafe', id)
  await accept(page, id)
  await expect(page.getByTestId('moment-pay')).toHaveText('Pago en el local pendiente')
  await expect(moment(page).locator('[role="img"]')).toHaveAttribute('aria-label', /Medialuna de manteca.*Cortado.*pago en el local pendiente/)
  for (const biz of ['mesa-clara', 'compas']) { // en este orden: el reloj avanza hasta que abre cada uno
    const oid = await placeOrder(page, biz)
    await openOrder(page, biz, oid)
    await accept(page, oid)
    await page.getByTestId('moment-skip').click()
    const label = await moment(page).locator('[role="img"]').getAttribute('aria-label')
    expect(label).not.toMatch(/Vermut|Vino|Cerveza/)
    await expect(moment(page)).toContainText('con alcohol, no se anima')
    await expect(page.getByTestId('moment-ticket')).toContainText(biz === 'compas' ? 'Vermut' : 'Vino')
  }
})

test('interrupción: "Omitir" y Escape van al cierre al instante y no queda nada corriendo', async ({ page }) => {
  await fresh(page, '/#/brasa')
  const id = await placeOrder(page, 'brasa')
  await openOrder(page, 'brasa', id)
  await accept(page, id)
  await expect(moment(page)).toHaveAttribute('data-phase', 'playing')
  await page.getByTestId('moment-skip').click()
  await expect(moment(page)).toHaveAttribute('data-phase', 'done')
  expect(await page.evaluate(() => document.querySelector('[data-testid="order-moment"]')!.getAnimations({ subtree: true }).length)).toBe(0)
  expect((await motion(page)).active).toBe(0)
  await expect(page.getByTestId('moment-number')).toBeVisible()
  // Escape con el foco dentro de la pieza
  await page.getByTestId('moment-replay').click()
  await expect(moment(page)).toHaveAttribute('data-phase', 'playing')
  await page.getByTestId('moment-skip').focus()
  await page.keyboard.press('Escape')
  await expect(moment(page)).toHaveAttribute('data-phase', 'done')
  // los controles del pedido nunca esperaron a la pieza
  await expect(page.getByRole('button', { name: /cancelar/i }).first()).toBeEnabled()
})

test('doble clic en "Ver de nuevo": una sola repetición y ningún cambio en el store', async ({ page }) => {
  await fresh(page, '/#/copo')
  const id = await placeOrder(page, 'copo')
  await openOrder(page, 'copo', id)
  await accept(page, id)
  await page.getByTestId('moment-skip').click()
  const m0 = await motion(page)
  const b0 = await business(page)
  await page.getByTestId('moment-replay').dblclick()
  await expect(moment(page)).toHaveAttribute('data-phase', 'playing')
  await expect(page.getByTestId('moment-replay')).toBeDisabled()
  await expect(moment(page)).toHaveAttribute('data-phase', 'done', { timeout: 4000 })
  expect((await motion(page)).played).toBe(m0.played + 1)
  expect(await business(page)).toBe(b0)
})

test('error: un pedido rechazado no muestra la aceptación; uno ya aceptado al abrirlo se ve quieto (no se repite solo)', async ({ page }) => {
  await fresh(page, '/#/ritual-cafe')
  const id = await placeOrder(page, 'ritual-cafe')
  await page.goto(`/#/ritual-cafe/pedido/${id}`)
  await page.evaluate((x) => (window as any).__tableflow.dispatch({ type: 'order/reject', orderId: x, reason: 'Sin medialunas (prueba)', actor: 'encargado' }), id)
  await expect(page.getByText('Sin medialunas (prueba)').first()).toBeVisible()
  await expect(moment(page)).toHaveCount(0)
  const failed = await accept(page, id) // aceptar un rechazado falla: no hay animación
  expect(failed.ok).toBe(false)
  await expect(moment(page)).toHaveCount(0)
  // otro pedido aceptado sin haberlo visto antes en esta pestaña: cierre quieto
  const id2 = await placeOrder(page, 'ritual-cafe')
  await accept(page, id2)
  const m0 = await motion(page)
  await page.goto(`/#/ritual-cafe/pedido/${id2}`)
  await expect(moment(page)).toHaveAttribute('data-phase', 'done')
  expect((await motion(page)).played).toBe(m0.played)
})

test('navegación a mitad: se limpia al salir, sin errores, y al volver se ve el cierre (no se retoma)', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(String(e)))
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
  await fresh(page, '/#/mesa-clara')
  const id = await placeOrder(page, 'mesa-clara')
  await openOrder(page, 'mesa-clara', id)
  await accept(page, id)
  await expect(moment(page)).toHaveAttribute('data-phase', 'playing')
  await page.waitForTimeout(300)
  await page.goto('/#/mesa-clara/carta')
  await page.waitForTimeout(3000) // pasa el tiempo en que habría terminado: ningún temporizador huérfano
  expect((await motion(page)).active).toBe(0)
  const played = (await motion(page)).played
  await page.goto(`/#/mesa-clara/pedido/${id}`)
  await expect(moment(page)).toHaveAttribute('data-phase', 'done')
  expect((await motion(page)).played).toBe(played)
  expect(errors).toEqual([])
})

test('sonido apagado: la pieza no crea ningún AudioContext; con los sonidos activados, uno solo', async ({ page }) => {
  await page.addInitScript(() => {
    ;(window as any).__ac = 0
    const Orig = window.AudioContext
    ;(window as any).AudioContext = class extends Orig { constructor(...a: any[]) { super(...(a as [])); (window as any).__ac++ } }
  })
  await fresh(page, '/#/brasa')
  const id = await placeOrder(page, 'brasa')
  await openOrder(page, 'brasa', id)
  await accept(page, id)
  await expect(moment(page)).toHaveAttribute('data-phase', 'done', { timeout: 4000 })
  expect(await page.evaluate(() => (window as any).__ac)).toBe(0)
  await page.evaluate(() => { const k = 'tableflow.demo.v1.prefs'; localStorage.setItem(k, JSON.stringify({ ...JSON.parse(localStorage.getItem(k) ?? '{}'), uiSounds: true })) })
  await page.reload()
  await page.getByTestId('moment-replay').click()
  await expect(moment(page)).toHaveAttribute('data-phase', 'done', { timeout: 4000 })
  expect(await page.evaluate(() => (window as any).__ac)).toBe(1)
})

for (const how of ['sistema', 'consola'] as const) {
  test(`movimiento reducido (${how}): se monta el cierre directo, sin animaciones ni "Ver de nuevo"`, async ({ page }) => {
    if (how === 'sistema') await page.emulateMedia({ reducedMotion: 'reduce' })
    await fresh(page, '/#/ritual-cafe')
    if (how === 'consola') {
      await page.evaluate(() => { const k = 'tableflow.demo.v1.prefs'; localStorage.setItem(k, JSON.stringify({ ...JSON.parse(localStorage.getItem(k) ?? '{}'), reducedMotion: 'on' })) })
      await page.reload()
      await expect(page.locator('html[data-motion="reduced"]')).toHaveCount(1)
    }
    const id = await placeOrder(page, 'ritual-cafe')
    await openOrder(page, 'ritual-cafe', id)
    await accept(page, id)
    await expect(moment(page)).toHaveAttribute('data-phase', 'done')
    await expect(page.getByTestId('moment-replay')).toHaveCount(0)
    await expect(page.getByTestId('moment-ticket')).toBeVisible()
    expect(await page.evaluate(() => document.querySelector('[data-testid="order-moment"]')!.getAnimations({ subtree: true }).length)).toBe(0)
    expect((await motion(page)).played).toBe(0)
  })
}

test('rendimiento medido durante la pieza: sin tareas largas apreciables, cuadros fluidos y efectos limpios al terminar', async ({ page }) => {
  await fresh(page, '/#/brasa')
  const id = await placeOrder(page, 'brasa')
  await openOrder(page, 'brasa', id)
  await page.evaluate(() => {
    const w = window as any
    w.__perf = { long: [] as number[], frames: 0 }
    try { new PerformanceObserver((l) => { for (const e of l.getEntries()) w.__perf.long.push(Math.round(e.duration)) }).observe({ type: 'longtask', buffered: false }) } catch { /* sin soporte */ }
    const tick = () => { w.__perf.frames++; if (!w.__perf.stop) requestAnimationFrame(tick) }
    requestAnimationFrame(tick)
  })
  const t0 = await page.evaluate(() => performance.now())
  await accept(page, id)
  await expect(moment(page)).toHaveAttribute('data-phase', 'playing')
  await expect(moment(page)).toHaveAttribute('data-phase', 'done', { timeout: 4000 })
  const r = await page.evaluate((t) => { const w = window as any; w.__perf.stop = true; return { ...w.__perf, ms: performance.now() - t } }, t0)
  const fps = Math.round((r.frames / r.ms) * 1000)
  test.info().annotations.push({ type: 'rendimiento', description: `${Math.round(r.ms)} ms · ${fps} cuadros/s · tareas largas: ${r.long.length ? r.long.join(', ') + ' ms' : 'ninguna'}` })
  console.log(`P5-L8 rendimiento MO-FR: ${Math.round(r.ms)} ms, ${fps} fps, tareas largas ${JSON.stringify(r.long)}`)
  expect(fps).toBeGreaterThan(20)
  expect(r.long.filter((d: number) => d > 200)).toEqual([])
  expect(await page.evaluate(() => document.querySelector('[data-testid="order-moment"]')!.getAnimations({ subtree: true }).length)).toBe(0)
  expect((await motion(page)).active).toBe(0)
  // las reglas de la pieza también son solo transform/opacity
  const props = await page.evaluate(() => {
    const out = new Set<string>()
    const walk = (rules: CSSRuleList) => { for (const r of [...rules]) { if (r instanceof CSSKeyframesRule && /^(mo|ss)-/.test(r.name)) for (const k of [...r.cssRules] as CSSKeyframeRule[]) for (const p of [...k.style]) out.add(p); else if ('cssRules' in r) walk((r as CSSGroupingRule).cssRules) } }
    for (const s of [...document.styleSheets]) { try { walk(s.cssRules) } catch { /* otra hoja */ } }
    return [...out]
  })
  expect(props.length).toBeGreaterThan(0)
  expect(props.filter((p) => !['transform', 'opacity'].includes(p))).toEqual([])
})

test('MO-RES con reserva: la mesa se prepara cuando el equipo la confirma y termina en el folio', async ({ page }) => {
  await fresh(page, '/#/mesa-clara')
  const s = await state(page)
  const r = s.reservations.find((x: any) => x.businessId === 'mesa-clara' && x.status === 'solicitada')
  expect(r, 'la semilla tiene una solicitud de Mesa Clara').toBeTruthy()
  await page.goto(`/#/mesa-clara/reservas/${r.id}`)
  await expect(page.locator('h1')).toContainText(r.id)
  await expect(moment(page)).toHaveCount(0)
  const o = await page.evaluate((id) => (window as any).__tableflow.dispatch({ type: 'res/accept', id, actor: 'recepcion' }), r.id)
  expect(o.ok, o.message).toBe(true)
  await expect(moment(page)).toHaveAttribute('data-phase', 'playing')
  await expect(page.getByTestId('moment-number')).toHaveText(r.id)
  await expect(moment(page).locator('[role="img"]')).toHaveAttribute('data-motif', 'preparar-mesa')
  await expect(moment(page)).toHaveAttribute('data-phase', 'done', { timeout: 4000 })
})

test('TE-01: temporada manual con inicio y fin, vista previa sin activar, independiente del modo oscuro y sin promociones', async ({ page }) => {
  await fresh(page, '/#/ritual-cafe')
  await page.evaluate(() => (window as any).__tableflow.dispatch({ type: 'session/setRole', role: 'encargado' }))
  await page.goto('/#/admin/configuracion')
  const theme0 = await page.evaluate(() => document.documentElement.getAttribute('data-theme'))
  const promo0 = await page.evaluate(() => JSON.stringify([(window as any).__tableflow.getState().campaigns, (window as any).__tableflow.getState().benefits]))
  // vista previa: cambia la escena, no la configuración
  await page.getByTestId('season-preview-select').selectOption('invierno')
  await expect(page.locator('.season-preview-box [data-testid="season-scene"]')).toHaveAttribute('data-season', 'invierno')
  await expect(page.locator('.season-preview-box [data-testid="season-scene"]')).toHaveAttribute('data-signature', 'true')
  expect((await state(page)).settings.seasonByBusiness['ritual-cafe']).toBe('auto')
  // manual con fechas futuras: queda programada y hoy rige la automática
  await page.getByTestId('season-manual').check()
  await page.getByTestId('cfg-season').selectOption('invierno')
  await page.getByTestId('season-dated').check()
  await page.getByTestId('season-from').fill('2026-10-25')
  await page.getByTestId('season-to').fill('2026-10-20')
  await page.getByTestId('season-save').click()
  await expect(page.locator('#season-err')).toHaveText('La fecha de fin no puede ser anterior al inicio.')
  await page.getByTestId('season-to').fill('2026-10-30')
  await page.getByTestId('season-save').click()
  await expect(page.getByTestId('season-scheduled')).toContainText('del 2026-10-25 al 2026-10-30')
  const s = await state(page)
  expect(s.settings.seasonWindowByBusiness['ritual-cafe']).toEqual({ from: '2026-10-25', to: '2026-10-30' })
  // dentro del rango, el inicio del café cambia de composición
  await page.evaluate(() => (window as any).__tableflow.dispatch({ type: 'clock/advance', minutes: 6 * 24 * 60 }))
  await page.goto('/#/ritual-cafe')
  await expect(page.getByTestId('season-band').getByTestId('season-scene')).toHaveAttribute('data-season', 'invierno')
  await expect(page.getByTestId('season-band').getByTestId('season-scene')).toHaveAttribute('data-signature', 'true')
  expect(await page.evaluate(() => document.documentElement.getAttribute('data-theme'))).toBe(theme0)
  expect(await page.evaluate(() => JSON.stringify([(window as any).__tableflow.getState().campaigns, (window as any).__tableflow.getState().benefits]))).toBe(promo0)
  // los juegos toman el acento (el del bar sigue sin alcohol)
  await page.goto('/#/ritual-cafe/chicos')
  await expect(page.getByTestId('game-season')).toContainText('invierno')
})

test('carga: el esqueleto toma la forma del seguimiento y aparece solo si la carga tarda (sin espera agregada)', async ({ page }) => {
  await fresh(page, '/#/ritual-cafe')
  const id = (await state(page)).orders.find((o: any) => o.businessId === 'ritual-cafe').id
  await page.route(/assets\/PedidoDetalle-.*\.js$/, async (r) => { await new Promise((ok) => setTimeout(ok, 900)); await r.continue() })
  await page.goto(`/#/ritual-cafe/pedido/${id}`)
  await expect(page.locator('.route-loader[data-shape="detalle"]')).toBeVisible()
  await expect(page.locator('.route-loader .sk-ticket')).toHaveCount(1)
  await expect(page.locator('.route-loader')).toHaveCount(0, { timeout: 8000 })
  await expect(page.locator('h1')).toContainText(id)
})

for (const w of [1280, 390]) {
  test(`accesibilidad de la pieza y de la configuración de temporada a ${w}px`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: 900 })
    await fresh(page, '/#/ritual-cafe')
    const id = await placeOrder(page, 'ritual-cafe')
    await openOrder(page, 'ritual-cafe', id)
    await accept(page, id)
    await page.getByTestId('moment-skip').click()
    let r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
    expect(r.violations.map((v) => `${v.id}: ${v.nodes[0].html.slice(0, 120)}`)).toEqual([])
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    await page.evaluate(() => (window as any).__tableflow.dispatch({ type: 'session/setRole', role: 'encargado' }))
    await page.goto('/#/admin/configuracion')
    await page.getByTestId('season-manual').check()
    await page.getByTestId('season-dated').check()
    r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
    expect(r.violations.map((v) => `${v.id}: ${v.nodes[0].html.slice(0, 120)}`)).toEqual([])
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  })
}
