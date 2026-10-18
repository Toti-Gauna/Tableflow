import { test, expect, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { fresh, state } from './helpers'

// P5-L9 · Escenas autoguiadas sobre el store, guía por rol y tarea, cierre Eclipse. Se entiende sin la consola.
const player = (page: Page) => page.getByTestId('scene-player')
const prefs = (page: Page) => page.evaluate(() => JSON.parse(localStorage.getItem('tableflow.demo.v1.prefs') ?? '{}'))
const SCENES: [string, string][] = [
  ['mesa-clara', 'llamada'], ['mesa-clara', 'qr-mesa'], ['mesa-clara', 'campana'],
  ['ritual-cafe', 'whatsapp'], ['ritual-cafe', 'qr-mesa'], ['ritual-cafe', 'retiro'], ['ritual-cafe', 'campana'],
  ['copo', 'whatsapp'], ['copo', 'retiro'], ['compas', 'llamada'], ['compas', 'qr-mesa'], ['brasa', 'whatsapp'], ['brasa', 'retiro'],
]

test('SC-01: desde la portada, sin la consola: escena de WhatsApp con efectos reales, controles y salida limpia', async ({ page }) => {
  test.setTimeout(90_000)
  await fresh(page, '/')
  await page.getByTestId('discover-scenes').click()
  await expect(page).toHaveURL(/#\/escenas/)
  const before = await state(page)
  await page.getByTestId('scene-ritual-cafe-whatsapp').click()
  await expect(player(page)).toBeVisible()
  await expect(page.locator('#scene-h')).toBeFocused()
  await expect(page).toHaveURL(/#\/admin\/pedidos/) // el fondo es la pantalla del comercio
  await expect(page.locator('.sp-phone [data-testid="phone-chat"]')).toContainText('Quiero pedir un cortado')
  await expect(page.getByTestId('scene-verified')).toBeVisible()
  // el fondo se ve sin oscurecer: no hay velo ni modal
  expect(await page.evaluate(() => document.querySelectorAll('dialog[open], [inert], .backdrop').length)).toBe(0)
  // avance automático a 1,5×
  await page.getByTestId('scene-speed').selectOption('1.5')
  await expect(player(page)).toHaveAttribute('data-step', 'pregunta', { timeout: 8000 })
  // pausa: no avanza
  await page.getByTestId('scene-play').click()
  await page.waitForTimeout(6000)
  await expect(player(page)).toHaveAttribute('data-step', 'pregunta')
  // repetir no duplica, siguiente avanza
  await page.getByTestId('scene-repeat').click()
  const n = (await state(page)).orders.length
  await page.getByTestId('scene-play').click() // la repetición reanuda; se pausa de nuevo para controlar a mano
  await page.getByTestId('scene-play').click()
  await page.getByTestId('scene-next').click()
  await expect(player(page)).toHaveAttribute('data-step', 'confirma')
  await page.getByTestId('scene-next').click()
  await expect(player(page)).toHaveAttribute('data-step', 'acepta')
  await page.getByTestId('scene-next').click()
  await expect(page.getByTestId('scene-done')).toBeVisible()
  const s = await state(page)
  expect(s.orders.length).toBe(n + 1)
  const wa = s.orders.at(-1)
  expect(wa.channel).toBe('whatsapp')
  expect(wa.status).toBe('aceptado')
  // salir: se restaura la vista y nada queda bloqueado
  await page.getByTestId('scene-exit').click()
  await expect(player(page)).toHaveCount(0)
  await expect(page).toHaveURL(/#\/escenas/)
  const after = await state(page)
  expect(after.session.role).toBe(before.session.role)
  expect(after.session.businessId).toBe(before.session.businessId)
  expect(await page.evaluate(() => document.querySelectorAll('[inert], [aria-hidden="true"]#root, dialog[open]').length)).toBe(0)
  await page.getByTestId('scene-copo-retiro').focus()
  await expect(page.getByTestId('scene-copo-retiro')).toBeFocused()
})

test('SC-01..05: las trece variantes por negocio se completan sin sonido, con su verificación en cada paso', async ({ page }) => {
  test.setTimeout(240_000)
  await fresh(page, '/#/escenas')
  for (const [biz, id] of SCENES) {
    await page.goto('/#/escenas')
    await page.getByTestId(`scene-${biz}-${id}`).click()
    await expect(player(page)).toBeVisible()
    await page.getByTestId('scene-play').click() // a mano
    for (let i = 0; i < 6; i++) {
      await expect(page.getByTestId('scene-error'), `${biz}/${id}`).toHaveCount(0)
      if (await page.getByTestId('scene-done').count()) break
      await page.getByTestId('scene-next').click()
    }
    await expect(page.getByTestId('scene-done'), `${biz}/${id}`).toBeVisible()
    await page.getByTestId('scene-exit').click()
    await expect(player(page)).toHaveCount(0)
  }
  const s = await state(page)
  expect(s.orders.filter((o: any) => o.channel === 'whatsapp').length).toBeGreaterThanOrEqual(3)
  expect(s.reservations.filter((r: any) => r.channel === 'voz').length).toBeGreaterThanOrEqual(2)
  expect(s.audit.filter((a: any) => a.type === 'code.redeemed').length).toBeGreaterThanOrEqual(3)
  expect(s.benefits.filter((b: any) => b.status === 'canjeado').length).toBeGreaterThanOrEqual(2)
})

test('teclado y movimiento reducido: Escape sale, la barra de tiempo no se anima y el foco vuelve a la página', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await fresh(page, '/#/escenas')
  await page.getByTestId('scene-brasa-retiro').click()
  await expect(page.locator('#scene-h')).toBeFocused()
  expect(await page.evaluate(() => document.querySelector('.sp-bar')!.getAnimations({ subtree: true }).length)).toBe(0)
  await page.keyboard.press('Tab')
  await expect(page.getByTestId('scene-play')).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(player(page)).toHaveCount(0)
  await expect(page).toHaveURL(/#\/escenas/)
})

test('GU-01: guía por rol y tarea: practicar, detección real, pausar, retomar, omitir, rechazar y progreso persistente', async ({ page }) => {
  await fresh(page, '/')
  await page.getByTestId('discover-guide').click()
  await expect(page).toHaveURL(/#\/guia/)
  await expect(page.getByTestId('guide-count')).toHaveText(/^0 de \d+/)
  await expect(page.getByRole('heading', { name: 'Recepción' })).toBeVisible()
  // practicar "validar un código": ayuda contextual hasta hacerlo de verdad
  await page.getByTestId('gpractice-recepcion-codigos').click()
  await expect(page).toHaveURL(/#\/admin\/codigos/)
  await expect(page.getByTestId('guide-coach')).toContainText('Validar el código de un cliente')
  await expect(page.getByTestId('guide-done')).toHaveCount(0)
  // pausar y retomar
  await page.getByTestId('coach-pause').click()
  await expect(page.getByTestId('guide-coach')).toHaveCount(0)
  await page.goto('/#/guia')
  await page.getByTestId('guide-resume').click()
  await expect(page.getByTestId('guide-coach')).toBeVisible()
  // hacerlo
  await expect(page.getByTestId('sim-select').locator('option').nth(2)).toBeAttached() // la pantalla se carga diferida
  const opt = (await page.getByTestId('sim-select').locator('option').allTextContents()).find((x) => x.startsWith('Pedido'))!
  await page.getByTestId('sim-select').selectOption({ label: opt })
  await expect(page.getByTestId('guide-done')).toBeVisible()
  await page.getByTestId('guide-back').click()
  await expect(page.getByTestId('gtask-recepcion-codigos')).toHaveAttribute('data-state', 'hecha')
  // omitir otra
  await page.getByTestId('gskip-encargado-costos').click()
  await expect(page.getByTestId('gtask-encargado-costos')).toHaveAttribute('data-state', 'omitida')
  await expect(page.getByTestId('guide-count')).toHaveText(/^2 de/)
  // persiste al recargar
  await page.reload()
  await expect(page.getByTestId('guide-count')).toHaveText(/^2 de/)
  // rechazar la guía y volver a mostrarla
  await page.getByTestId('guide-decline').click()
  await expect(page.getByTestId('guide-undecline')).toBeVisible()
  expect((await prefs(page)).guide.declined).toBe(true)
  await page.getByTestId('guide-undecline').click()
  await expect(page.getByTestId('guide-count')).toBeVisible()
})

test('EC-01: el cierre Eclipse abre con "Adaptarlo a mi negocio", muestra el tarifario y "a confirmar" sin link inventado, y se cierra', async ({ page }) => {
  await fresh(page, '/')
  await page.getByTestId('discover-adapt').click()
  const ec = page.getByTestId('eclipse')
  await expect(ec).toBeVisible()
  await expect(ec).toContainText('desde USD 500')
  await expect(ec).toContainText('USD 30/mes')
  await expect(ec).toContainText('No incluye')
  await expect(page.getByTestId('eclipse-times')).toContainText('a confirmar')
  await expect(page.getByTestId('eclipse-link')).toContainText('a confirmar')
  expect(await ec.locator('a[href^="http"]').count()).toBe(0)
  const box = await ec.boundingBox()
  const vp = page.viewportSize()!
  expect(Math.round(box!.width)).toBe(vp.width) // pantalla completa
  const r = await new AxeBuilder({ page }).include('[data-testid="eclipse"]').withTags(['wcag2a', 'wcag2aa']).analyze()
  expect(r.violations.map((v) => `${v.id}: ${v.nodes[0].html.slice(0, 120)}`)).toEqual([])
  await page.keyboard.press('Escape')
  await expect(ec).toBeHidden()
  expect((await prefs(page)).eclipseDismissed).toBe(true)
  // el botón sigue funcionando a pedido, aunque ya se haya cerrado
  await page.getByTestId('discover-adapt').click()
  await expect(ec).toBeVisible()
  await page.getByTestId('eclipse-close').click()
  await expect(ec).toBeHidden()
})

test('EC-01: al terminar la guía se ofrece una sola vez, nunca en medio de un pedido y no insiste después de cerrarlo', async ({ page }) => {
  await fresh(page, '/#/guia')
  await expect(page.getByTestId('guide-count')).toBeVisible() // la guía se carga diferida: esperar sus tareas
  // todas las tareas de Mesa Clara omitidas menos dos
  const s = await state(page)
  const ids: string[] = await page.locator('[data-testid^="gtask-"]').evaluateAll((els) => els.map((e) => e.getAttribute('data-testid')!.replace('gtask-', '')))
  const keep = ['recepcion-codigos', 'cliente-pedido']
  await page.evaluate(({ ids, keep, biz }) => {
    const k = 'tableflow.demo.v1.prefs'
    const p = JSON.parse(localStorage.getItem(k) ?? '{}')
    p.guide = { done: [], skipped: ids.filter((i: string) => !keep.includes(i)).map((i: string) => `${i}@${biz}`), active: null, paused: false, declined: false }
    localStorage.setItem(k, JSON.stringify(p))
  }, { ids, keep, biz: s.session.businessId })
  await page.reload()
  // la penúltima se termina en un pedido (checkout): no se abre nada
  await page.getByTestId('gpractice-cliente-pedido').click()
  await page.evaluate(() => {
    const t = (window as any).__tableflow
    t.dispatch({ type: 'clock/advance', minutes: 150 })
  })
  await page.goto('/#/mesa-clara/carta/MC-26')
  await page.getByTestId('add-to-cart').click()
  await page.goto('/#/mesa-clara/pedido')
  await page.getByTestId('mesa-select').selectOption({ index: 1 })
  await page.getByTestId('send-order').click()
  await expect(page).toHaveURL(/pedido\/O-/)
  await expect(page.getByTestId('guide-done')).toBeVisible()
  await expect(page.getByTestId('eclipse')).toBeHidden()
  // la última se termina fuera de un pedido: se ofrece el cierre una vez
  await page.getByTestId('guide-back').click()
  await page.getByTestId('gpractice-recepcion-codigos').click()
  await expect(page.getByTestId('sim-select').locator('option').nth(2)).toBeAttached() // la pantalla se carga diferida
  const opt = (await page.getByTestId('sim-select').locator('option').allTextContents()).find((x) => x.startsWith('Mesa'))!
  await page.getByTestId('sim-select').selectOption({ label: opt })
  await expect(page.getByTestId('eclipse')).toBeVisible()
  await page.getByTestId('eclipse-later').click()
  await expect(page.getByTestId('eclipse')).toBeHidden()
  // practicar de nuevo y terminar otra vez: no insiste
  await page.goto('/#/guia')
  await page.getByTestId('gpractice-recepcion-codigos').click()
  await page.getByTestId('sim-select').selectOption({ label: opt })
  await expect(page.getByTestId('guide-done')).toBeVisible()
  await page.waitForTimeout(500)
  await expect(page.getByTestId('eclipse')).toBeHidden()
})

for (const w of [1280, 390]) {
  test(`accesibilidad: escenas con el reproductor abierto y guía a ${w}px`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: 900 })
    await fresh(page, '/#/escenas')
    let r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
    expect(r.violations.map((v) => `${v.id}: ${v.nodes[0].html.slice(0, 120)}`)).toEqual([])
    await page.getByTestId('scene-compas-llamada').click()
    await page.getByTestId('scene-play').click()
    r = await new AxeBuilder({ page }).include('[data-testid="scene-player"]').withTags(['wcag2a', 'wcag2aa']).analyze()
    expect(r.violations.map((v) => `${v.id}: ${v.nodes[0].html.slice(0, 120)}`)).toEqual([])
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    await page.getByTestId('scene-exit').click()
    await page.goto('/#/guia')
    r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
    expect(r.violations.map((v) => `${v.id}: ${v.nodes[0].html.slice(0, 120)}`)).toEqual([])
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  })
}
