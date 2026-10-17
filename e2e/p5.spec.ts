import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

// P5-L2b · Estudio de identidades (#/propuestas): una identidad propia por negocio, ruta aislada.
const ORIGIN = 'http://127.0.0.1:4173'
const BIZ = ['cafe', 'hela', 'resto', 'bar', 'rapida']

test('L2b: índice con cinco identidades, sin red externa ni errores de consola', async ({ page }) => {
  const external: string[] = []
  const errors: string[] = []
  page.on('request', (r) => { if (!r.url().startsWith(ORIGIN)) external.push(r.url()) })
  page.on('pageerror', (e) => errors.push(String(e)))
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
  await page.goto('/#/propuestas')
  await expect(page.getByRole('heading', { level: 1, name: 'Cinco negocios, cinco identidades' })).toBeVisible()
  await expect(page.locator('[data-testid^="pzx-card-"]')).toHaveCount(5)
  await expect(page.getByTestId('pzx-card-cafe')).toContainText('Confitería notable porteña')
  await expect(page.getByTestId('pzx-card-rapida')).toContainText('Brasa a la vista')
  for (const b of BIZ) {
    await page.goto(`/#/propuestas/${b}`)
    await expect(page.locator('h1')).toBeVisible()
    await expect(page.locator('.pzx-fig .pzx-root')).toHaveClass(new RegExp(`id-${b}`))
  }
  expect(external).toEqual([])
  expect(errors).toEqual([])
})

test('L2b: modo por URL, contenido del fixture, animación a pedido y movimiento reducido', async ({ page }) => {
  await page.goto('/#/propuestas/cafe')
  // Ritual Café nace en modo oscuro (salón); el claro es la mañana de mármol.
  const root = page.locator('.pzx-fig .pzx-root').first()
  await expect(root).toHaveAttribute('data-mode', 'dark')
  await expect(page.locator('.pzx-fig')).toContainText('$ 4.500') // Espresso RC-01 del fixture
  await page.getByRole('radio', { name: 'Mañana de mármol' }).click()
  await expect(root).toHaveAttribute('data-mode', 'light')
  await expect(page).toHaveURL(/modo=claro/)
  expect(await root.evaluate((el) => getComputedStyle(el).getPropertyValue('--bg').trim().toLowerCase())).toBe('#f3ecdf')
  await page.goto('/#/propuestas/resto')
  await expect(page.locator('.pzx-fig')).toContainText('$ 20.200') // Milanesa napolitana MC-13
  // La animación solo corre al pedirla y se apaga con movimiento reducido.
  const stage = page.locator('.bd-sig-stage')
  await expect(stage).not.toHaveAttribute('data-play', /.+/)
  await page.getByRole('button', { name: 'Reproducir confirmación' }).click()
  await expect(page.locator('.bd-sig-stage')).toHaveAttribute('data-play', 'true')
  await page.getByLabel('Movimiento reducido').check()
  expect(await page.locator('.bd-sig-stage .bd-sig-plate').evaluate((el) => getComputedStyle(el).animationName)).toBe('none')
  await page.goto('/#/propuestas/no-existe')
  await expect(page.getByRole('heading', { name: 'No encontramos esa identidad' })).toBeVisible()
})

test('L2b: 390 px sin scroll horizontal y axe sin violaciones serias en las 10 páginas (5 × claro/oscuro)', async ({ page }) => {
  test.setTimeout(180_000)
  await page.setViewportSize({ width: 390, height: 844 })
  const bad: string[] = []
  await page.goto('/#/propuestas')
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
  for (const b of BIZ) {
    for (const modo of ['claro', 'oscuro']) {
      await page.goto(`/#/propuestas/${b}?modo=${modo}`)
      await expect(page.locator('h1')).toBeVisible()
      await page.waitForTimeout(200)
      expect(await page.evaluate(() => document.documentElement.scrollWidth), `${b} ${modo}`).toBeLessThanOrEqual(390)
      const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()
      for (const v of r.violations.filter((x) => ['serious', 'critical'].includes(x.impact ?? ''))) bad.push(`${b} ${modo}: ${v.id} (${v.nodes.length}) ${v.nodes[0]?.html.slice(0, 120)}`)
    }
  }
  expect(bad).toEqual([])
})
