import { test, expect, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { closeDock, ensureConsole, fresh, setRole, state } from './helpers'

// P5-L3 · tema claro/oscuro, cabecera limpia, dock de la demo, bienvenida por rol y correcciones de copy.

const box = async (page: Page, sel: string) => (await page.locator(sel).first().boundingBox())!
const overlap = (a: { x: number; y: number; width: number; height: number }, b: typeof a) =>
  a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height

test('SH-01: cabecera de marca sin consola arriba; la franja DEMO es fina y sigue visible', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await fresh(page, '/#/mesa-clara')
  await expect(page.getByText('Datos ficticios').first()).toBeVisible()
  expect((await box(page, '.demo-banner')).height).toBeLessThanOrEqual(32)
  // los controles no están en la página: viven en el dock, cerrado
  await expect(page.getByTestId('role-select')).toBeHidden()
  const t = await box(page, '[data-testid="dock-toggle"]')
  expect(t.x + t.width).toBeGreaterThan(1440 - 40)
  expect(t.y + t.height).toBeGreaterThan(900 - 40)
  // la cabecera del negocio arranca inmediatamente debajo de la franja
  const head = await box(page, '.client-head')
  expect(head.y).toBeLessThanOrEqual((await box(page, '.demo-banner')).height + 1)
})

test('SH-03: el dock se abre, se cierra con Escape y clic afuera, devuelve el foco y no tapa controles', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await fresh(page, '/#/mesa-clara/carta')
  const toggle = page.getByRole('button', { name: 'Controles de la demo' })
  await toggle.click()
  await expect(toggle).toHaveAttribute('aria-expanded', 'true')
  await expect(page.getByTestId('role-desc')).toContainText('primera vez')
  await page.keyboard.press('Escape')
  await expect(page.getByTestId('dock-panel')).toBeHidden()
  await expect(toggle).toBeFocused()
  await toggle.click()
  await page.locator('#page-h1').click()
  await expect(page.getByTestId('dock-panel')).toBeHidden()
  // al fondo de la página, el botón no queda encima de ningún control
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  const t = await box(page, '[data-testid="dock-toggle"]')
  const controls = await page.locator('main a, main button, main input, main select, footer a').evaluateAll((els) =>
    els.map((e) => e.getBoundingClientRect()).filter((r) => r.width > 0).map((r) => ({ x: r.x, y: r.y, width: r.width, height: r.height })),
  )
  expect(controls.filter((c) => overlap(c, t))).toEqual([])
  // en móvil el botón vive en la franja DEMO, lejos de la barra inferior y del resumen del pedido
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/#/ritual-cafe/carta')
  await page.getByTestId('open-RC-11').click()
  await page.getByTestId('add-to-cart').click()
  await expect(page.locator('.cart-bar')).toBeVisible()
  const m = await box(page, '[data-testid="dock-toggle"]')
  expect(m.y + m.height).toBeLessThanOrEqual((await box(page, '.demo-banner')).height + 1)
  expect(overlap(m, await box(page, '.cart-bar'))).toBe(false)
  expect(overlap(m, await box(page, '.client-tabs'))).toBe(false)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})

test('SH-04: tema por sistema en vivo, control manual que se conserva al recargar y al reiniciar', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' })
  await fresh(page, '/#/ritual-cafe')
  const html = page.locator('html')
  await expect(html).toHaveAttribute('data-theme', 'dark')
  await expect(html).toHaveAttribute('data-biz', 'ritual-cafe')
  const bg = () => page.evaluate(() => getComputedStyle(document.body).backgroundColor)
  expect(await bg()).toBe('rgb(26, 15, 12)') // salón de caoba
  await page.emulateMedia({ colorScheme: 'light' })
  await expect(html).toHaveAttribute('data-theme', 'light')
  expect(await bg()).toBe('rgb(243, 236, 223)') // mañana de mármol
  await ensureConsole(page)
  await page.getByTestId('theme-dark').check()
  await expect(html).toHaveAttribute('data-theme', 'dark')
  await page.reload()
  await expect(html).toHaveAttribute('data-theme', 'dark')
  expect((await state(page)).session.businessId).toBe('ritual-cafe')
  // el reinicio de la demo conserva el tema de quien presenta
  await ensureConsole(page)
  await page.getByTestId('reset-open').click()
  await page.getByRole('button', { name: 'Reiniciar demo' }).last().click()
  await expect(html).toHaveAttribute('data-theme', 'dark')
  await ensureConsole(page)
  await page.getByTestId('theme-system').check()
  await expect(html).toHaveAttribute('data-theme', 'light')
})

test.describe('SH-02: bienvenida por rol', () => {
  test.use({ storageState: { cookies: [], origins: [] } })
  test('aparece una vez tras la carga, se omite y no vuelve; el rol se cambia después desde el dock', async ({ page }) => {
    await page.goto('/#/')
    const intro = page.getByTestId('role-intro')
    await expect(intro).toBeVisible()
    await expect(intro.getByRole('button')).toHaveCount(8) // 7 roles + omitir
    await expect(intro).toContainText('no permisos')
    await page.getByTestId('role-intro-skip').click()
    await expect(intro).toBeHidden()
    await page.reload()
    await page.waitForTimeout(600)
    await expect(intro).toBeHidden()
    await setRole(page, /Caja/)
    await expect(page).toHaveURL(/#\/admin\/caja/)
  })
  test('elegir un rol del equipo lleva a su pantalla', async ({ page }) => {
    await page.goto('/#/')
    await page.getByTestId('role-intro-cocina').click()
    await expect(page).toHaveURL(/#\/admin\/cocina/)
    expect((await state(page)).session.role).toBe('cocina')
  })
  test('un enlace directo no muestra la bienvenida', async ({ page }) => {
    await page.goto('/#/mesa-clara/carta')
    await page.waitForTimeout(800)
    await expect(page.getByTestId('role-intro')).toBeHidden()
  })
})

test('SH-05: cambiar de rol conserva negocio y registros; cambiar de negocio no mezcla datos', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await fresh(page, '/#/ritual-cafe/carta')
  await page.getByTestId('open-RC-11').click()
  await page.getByTestId('add-to-cart').click()
  const before = await state(page)
  await setRole(page, /Cocina/)
  await expect(page).toHaveURL(/#\/admin\/cocina/)
  const after = await state(page)
  expect(after.session.businessId).toBe('ritual-cafe')
  expect(after.orders.length).toBe(before.orders.length)
  expect(JSON.stringify(after.carts)).toBe(JSON.stringify(before.carts))
  await expect(page.locator('.admin-brand .biz')).toHaveText('Ritual Café')
  const ids = async () => (await page.locator('.ticket').evaluateAll((els) => els.map((e) => e.getAttribute('data-testid')!.replace('ticket-', ''))))
  const owner = (s: any, id: string) => s.orders.find((o: any) => o.id === id).businessId
  for (const id of await ids()) expect(owner(after, id)).toBe('ritual-cafe')
  await ensureConsole(page)
  await page.getByTestId('biz-select').selectOption('mesa-clara')
  await expect(page.getByTestId('dock-panel')).toBeHidden()
  await expect(page.locator('.admin-brand .biz')).toHaveText('Mesa Clara')
  await expect(page.locator('html')).toHaveAttribute('data-biz', 'mesa-clara')
  const s2 = await state(page)
  for (const id of await ids()) expect(owner(s2, id)).toBe('mesa-clara')
  // el carrito de Ritual sigue ahí, aparte
  expect(JSON.stringify(s2.carts)).toBe(JSON.stringify(before.carts))
})

test('SH-03: casos y tráiler con estado honesto', async ({ page }) => {
  await fresh(page, '/#/')
  await ensureConsole(page)
  await page.getByTestId('case-cocina').click()
  await expect(page).toHaveURL(/#\/admin\/cocina/)
  const s = await state(page)
  expect(s.session.role).toBe('cocina')
  expect(s.session.businessId).toBe('mesa-clara')
  await ensureConsole(page)
  await expect(page.getByTestId('sim-clock')).toContainText('20:00')
  await page.getByTestId('trailer-open').click()
  await expect(page.getByTestId('trailer')).toContainText('Todavía no hay tráiler')
  await expect(page.getByTestId('trailer').locator('video, iframe')).toHaveCount(0)
  await page.keyboard.press('Escape')
  await closeDock(page)
})

test('FX-01..03: artículo del 404, plural del resumen y contexto de "Pedidos de hoy"', async ({ page }) => {
  await fresh(page, '/#/heladeria')
  await expect(page.getByRole('heading', { name: 'No encontramos ese perfil' })).toBeVisible()
  await page.goto('/#/mesa-clara/no-existe')
  await expect(page.getByRole('heading', { name: 'No encontramos esa página' })).toBeVisible()
  await page.goto('/#/mesa-clara')
  await setRole(page, /Encargado/)
  await expect(page.getByTestId('kpi-orders')).toHaveText('0')
  await expect(page.getByTestId('kpi-orders-note')).toHaveText('Abre a las 12:00 · último servicio: sábado 17/10 (5 pedidos)')
  await expect(page.locator('.kpis')).not.toContainText(/\b1 (solicitadas|confirmadas|entregados)\b/)
  await ensureConsole(page)
  await page.getByTestId('biz-select').selectOption('ritual-cafe')
  await expect(page.getByTestId('kpi-orders-note')).toHaveText(/^\d+ entregados?$/)
})

test('SH-04: axe sin violaciones serias en oscuro (escritorio y móvil)', async ({ page }) => {
  test.setTimeout(150_000)
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' })
  await fresh(page, '/#/')
  const routes = ['/#/', '/#/mesa-clara', '/#/mesa-clara/carta', '/#/mesa-clara/reservar', '/#/ritual-cafe', '/#/ritual-cafe/carta', '/#/ritual-cafe/regalar', '/#/mesa-clara/chicos', '/#/mesa-clara/pasaporte']
  for (const w of [1440, 390]) {
    await page.setViewportSize({ width: w, height: w > 800 ? 900 : 844 })
    for (const r of routes) {
      await page.goto(r)
      await page.locator('#page-h1').first().waitFor()
      await page.waitForTimeout(250)
      const res = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()
      const bad = res.violations.filter((v) => ['serious', 'critical'].includes(v.impact ?? ''))
      expect(bad.map((v) => `${w} ${r} ${v.id}: ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}`)).toEqual([])
    }
  }
  await setRole(page, /Encargado/)
  for (const r of ['/#/admin/resumen', '/#/admin/pedidos', '/#/admin/cocina', '/#/admin/caja', '/#/admin/salon', '/#/admin/reportes']) {
    await page.goto(r)
    await page.locator('#page-h1').first().waitFor()
    await page.waitForTimeout(250)
    const res = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()
    const bad = res.violations.filter((v) => ['serious', 'critical'].includes(v.impact ?? ''))
    expect(bad.map((v) => `${r} ${v.id}: ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}`)).toEqual([])
  }
  // con el dock abierto también
  await ensureConsole(page)
  const res = await new AxeBuilder({ page }).include('.dock').analyze()
  expect(res.violations.filter((v) => ['serious', 'critical'].includes(v.impact ?? '')).map((v) => v.id)).toEqual([])
})
