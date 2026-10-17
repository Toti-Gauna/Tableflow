import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

// P5-L2 · Estudio de propuestas visuales (#/propuestas): ruta aislada, quince conceptos comparables.
const ORIGIN = 'http://127.0.0.1:4173'

test('L2: índice con 15 conceptos (3 por negocio, 1 recomendado en cada uno), sin red externa ni errores', async ({ page }) => {
  const external: string[] = []
  const errors: string[] = []
  page.on('request', (r) => { if (!r.url().startsWith(ORIGIN)) external.push(r.url()) })
  page.on('pageerror', (e) => errors.push(String(e)))
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
  await page.goto('/#/propuestas')
  await expect(page.getByRole('heading', { level: 1, name: 'Quince direcciones, tres por negocio' })).toBeVisible()
  await expect(page.locator('[data-testid^="pz-card-"]')).toHaveCount(15)
  for (const b of ['cafe', 'resto', 'hela', 'bar', 'rapida']) {
    await expect(page.locator(`[data-testid^="pz-card-${b}-"]`)).toHaveCount(3)
  }
  await expect(page.locator('.pz-card .pz-rec')).toHaveCount(5)
  // Café y restaurante muestran la carta del fixture; los nuevos se rotulan provisionales.
  await expect(page.getByTestId('pz-card-resto-2')).toContainText('Bodegón contemporáneo')
  await expect(page.getByRole('heading', { level: 2, name: /Heladería.*contenido provisional/ })).toBeVisible()
  expect(external).toEqual([])
  expect(errors).toEqual([])
})

test('L2: estudio con modo claro/oscuro por URL, recorrido entre conceptos y boceto de motion', async ({ page }) => {
  await page.goto('/#/propuestas/cafe-2')
  await expect(page.getByRole('heading', { level: 1, name: /Kissaten/ })).toBeVisible()
  // Precio real del fixture (Flat white RC-04) en la pantalla pública.
  await expect(page.locator('.pz-fig')).toContainText('$ 5.800')
  const frame = page.locator('.pz-fig .pz-frame').first()
  await expect(frame).toHaveAttribute('data-mode', 'light')
  await page.getByRole('radio', { name: 'Oscuro' }).click()
  await expect(frame).toHaveAttribute('data-mode', 'dark')
  await expect(page).toHaveURL(/modo=oscuro/)
  const bg = await frame.evaluate((el) => getComputedStyle(el).backgroundColor)
  expect(bg).toBe('rgb(18, 19, 17)')
  await page.getByRole('link', { name: '3. Merienda retro' }).click()
  await expect(page.getByRole('heading', { level: 1, name: /Merienda retro/ })).toBeVisible()
  // El boceto solo se anima al pedirlo; con movimiento reducido no hay animación.
  const art = page.locator('.pz-motion .pz-art')
  await expect(art).not.toHaveAttribute('data-play', /.+/)
  await page.getByRole('button', { name: 'Reproducir confirmación' }).click()
  await expect(page.locator('.pz-motion .pz-art')).toHaveAttribute('data-play', '1')
  await page.getByLabel('Movimiento reducido').check()
  const anim = await page.locator('.pz-motion [data-step]').first().evaluate((el) => getComputedStyle(el).animationName)
  expect(anim).toBe('none')
  await page.goto('/#/propuestas/no-existe')
  await expect(page.getByRole('heading', { name: 'No encontramos esa propuesta' })).toBeVisible()
})

test('L2: 390 px sin scroll horizontal y axe sin violaciones serias en índice y estudio', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  const bad: string[] = []
  for (const p of ['/#/propuestas', '/#/propuestas/hela-1', '/#/propuestas/bar-1?modo=oscuro']) {
    await page.goto(p)
    await expect(page.locator('h1')).toBeVisible()
    await page.waitForTimeout(300)
    const sw = await page.evaluate(() => document.documentElement.scrollWidth)
    expect(sw, p).toBeLessThanOrEqual(390)
    const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()
    for (const v of r.violations.filter((x) => ['serious', 'critical'].includes(x.impact ?? ''))) bad.push(`${p}: ${v.id} (${v.nodes.length}) ${v.nodes[0]?.html.slice(0, 120)}`)
  }
  expect(bad).toEqual([])
})

test('L2: los 15 conceptos en claro y oscuro sin violaciones serias de axe (30 páginas)', async ({ page }) => {
  test.setTimeout(240_000)
  const ids = ['cafe', 'resto', 'hela', 'bar', 'rapida'].flatMap((b) => [1, 2, 3].map((n) => `${b}-${n}`))
  const bad: string[] = []
  for (const id of ids) {
    for (const modo of ['claro', 'oscuro']) {
      await page.goto(`/#/propuestas/${id}?modo=${modo}`)
      await expect(page.locator('h1')).toBeVisible()
      const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()
      for (const v of r.violations.filter((x) => ['serious', 'critical'].includes(x.impact ?? ''))) bad.push(`${id} ${modo}: ${v.id} (${v.nodes.length}) ${v.nodes[0]?.html.slice(0, 100)}`)
    }
  }
  expect(bad).toEqual([])
})
