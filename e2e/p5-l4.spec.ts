import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { fresh } from './helpers'

// P5-L4 · arte por identidad, mockups y galería.
const COUNTS: Record<string, number> = { cafe: 23, resto: 38, hela: 26, bar: 19, rapida: 21 }

test('AR-01/02: galería con cinco identidades; cada una muestra su familia completa, la muestra a tamaño real y los mockups', async ({ page }) => {
  const external: string[] = []
  const errors: string[] = []
  page.on('request', (r) => { if (!r.url().startsWith('http://127.0.0.1:4173')) external.push(r.url()) })
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
  page.on('pageerror', (e) => errors.push(String(e)))
  await fresh(page, '/#/arte')
  await expect(page.locator('.gx-card')).toHaveCount(5)
  for (const [id, n] of Object.entries(COUNTS)) {
    await page.goto(`/#/arte/${id}`)
    await expect(page.locator('[data-testid^="piece-"]')).toHaveCount(n)
    await expect(page.locator('.gx-sizes figure')).toHaveCount(10) // 5 tamaños × claro y oscuro
    await expect(page.locator('.mk-ticket')).toHaveCount(2) // suelto y dentro del teléfono
    await expect(page.locator('.mk-loyal')).toHaveCount(1)
    await expect(page.locator('.mk-phone')).toHaveCount(1)
    // ninguna pieza deformada: todas cuadradas con su viewBox
    const bad = await page.locator('svg.fam').evaluateAll((els) => els.filter((e) => e.getAttribute('viewBox') !== '0 0 160 160' || Math.abs(e.getBoundingClientRect().width - e.getBoundingClientRect().height) > 1).length)
    expect(bad, id).toBe(0)
  }
  expect(external).toEqual([])
  expect(errors).toEqual([])
  await page.goto('/#/arte/heladeria')
  await expect(page.getByRole('heading', { name: 'No encontramos esa identidad' })).toBeVisible()
})

test('AR-03: la app usa la familia nueva en la carta y la escena firma en el inicio', async ({ page }) => {
  await fresh(page, '/#/mesa-clara/carta')
  await expect(page.locator('svg.fam').first()).toBeVisible()
  expect(await page.locator('.dish svg.fam, .menu-layout svg.fam').count()).toBeGreaterThan(10)
  await page.goto('/#/mesa-clara')
  await expect(page.getByRole('img', { name: /pingüino de vino, sifón/ })).toBeVisible()
  await page.goto('/#/ritual-cafe')
  await expect(page.getByRole('img', { name: /salón bajo el vitral/ })).toBeVisible()
  // sin restos del acabado de grabado de P4 en las piezas de las familias
  expect(await page.locator('svg.fam filter').count()).toBe(0)
})

test('AR-04: axe sin violaciones serias y sin scroll horizontal, en claro y oscuro, escritorio y 390 px', async ({ page }) => {
  test.setTimeout(150_000)
  await fresh(page, '/#/arte')
  for (const scheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' })
    for (const w of [1440, 390]) {
      await page.setViewportSize({ width: w, height: w > 800 ? 900 : 844 })
      for (const r of ['/#/arte', ...Object.keys(COUNTS).map((k) => `/#/arte/${k}`)]) {
        await page.goto(r)
        await page.locator('#page-h1').waitFor()
        if (w === 390) expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `${scheme} ${w} ${r}`).toBe(true)
        if (w === 1440 || r !== '/#/arte') {
          const res = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()
          const badv = res.violations.filter((v) => ['serious', 'critical'].includes(v.impact ?? ''))
          expect(badv.map((v) => `${scheme} ${w} ${r} ${v.id}: ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}`)).toEqual([])
        }
      }
    }
  }
})
