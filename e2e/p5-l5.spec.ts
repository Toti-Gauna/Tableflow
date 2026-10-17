import { test, expect, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { fresh, setRole, state } from './helpers'

// P5-L5 · cinco productos completos (cliente → comercio sin datos cruzados), pago en el local y cinco juegos.

async function playToWin(page: Page, game: string) {
  const g = page.getByTestId(`game-${game}`)
  if (game === 'memoria') {
    const cards = g.locator('[data-card]')
    const n = await cards.count()
    const keys = await cards.evaluateAll((els) => els.map((e) => e.getAttribute('data-card')))
    const done = new Set<number>()
    for (let a = 0; a < n; a++) {
      if (done.has(a)) continue
      const b = keys.findIndex((k, j) => j !== a && k === keys[a])
      await page.getByTestId(`memoria-${a}`).click(); await page.getByTestId(`memoria-${b}`).click()
      done.add(a); done.add(b)
    }
  } else if (game === 'mesa') {
    for (;;) {
      const pick = g.locator('[data-testid^="mesa-pick-"]').first()
      if (!(await pick.count())) break
      const id = (await pick.getAttribute('data-testid'))!.replace('mesa-pick-', '')
      await pick.click(); await page.getByTestId(`mesa-slot-${id}`).click()
    }
  } else if (game === 'helado') {
    const model = (await g.locator('.g-model').getAttribute('data-model'))!.split(' ')
    for (const s of model) await page.getByTestId(`helado-${s}`).click()
  } else if (game === 'hamburguesa') {
    while (await g.locator('[data-next]').count()) await g.locator('[data-next]').click()
  } else if (game === 'donde') {
    while (await page.getByTestId('donde-target').isVisible().catch(() => false)) {
      const name = (await page.getByTestId('donde-target').textContent())!.trim()
      const obj = g.getByRole('button', { name: new RegExp(`^${name}$`, 'i') })
      if (!(await obj.count())) break
      await obj.click()
    }
  }
  await expect(page.getByTestId(`${game}-win`)).toBeVisible()
}

const GAMES: [string, string, RegExp][] = [
  ['ritual-cafe', 'memoria', /Memoria de la merienda/],
  ['mesa-clara', 'mesa', /Poner la mesa/],
  ['copo', 'helado', /Copiá el helado/],
  ['brasa', 'hamburguesa', /Armá la hamburguesa/],
  ['compas', 'donde', /¿Dónde está\?/],
]

test('JG-01…05: cinco juegos distintos con inicio, instrucciones, pausa, reintento, salida y éxito; sin datos ni compras', async ({ page }) => {
  test.setTimeout(120_000)
  await fresh(page, '/')
  for (const [biz, game, title] of GAMES) {
    await page.goto(`/#/${biz}/chicos`)
    const g = page.getByTestId(`game-${game}`)
    await expect(g.getByRole('heading', { level: 2 })).toHaveText(title)
    // inicio con instrucciones y nivel; sin campos de texto (no se piden datos), sin enlaces a comprar dentro del juego
    await expect(g.locator('.game-how li')).toHaveCount(3)
    expect(await g.locator('input[type="text"], input[type="email"], input[type="tel"], textarea').count()).toBe(0)
    expect(await g.locator('a[href*="carta"], a[href*="pedido"]').count()).toBe(0)
    await page.getByTestId(`${game}-start`).click()
    await expect(page.getByTestId(`${game}-progress`)).toHaveText(/^0 de \d+$/)
    // pausa con botón y con Escape: la partida queda inerte y se puede seguir
    await page.getByTestId(`${game}-pause`).click()
    await expect(g.getByRole('heading', { name: 'En pausa' })).toBeFocused()
    expect(await g.locator('.game-board').getAttribute('inert')).not.toBeNull()
    await page.getByTestId(`${game}-resume`).click()
    await page.keyboard.press('Escape')
    await expect(g.getByRole('heading', { name: 'En pausa' })).toBeVisible()
    await page.getByTestId(`${game}-resume`).click()
    // reintento y salida
    await page.getByTestId(`${game}-retry`).click()
    await expect(page.getByTestId(`${game}-progress`)).toHaveText(/^0 de \d+$/)
    await page.getByTestId(`${game}-exit`).click()
    await expect(page.getByTestId(`${game}-start`)).toBeVisible()
    // jugar hasta ganar, pasar de nivel y volver a ganar
    await page.getByTestId(`${game}-start`).click()
    await playToWin(page, game)
    await page.getByTestId(`${game}-next`).click()
    await expect(g.locator('.game-level')).toHaveText('Nivel medio')
    await playToWin(page, game)
    await expect(page.getByTestId(`${game}-win`)).toContainText('Sin premios ni puntajes')
  }
  // jugar no tocó ningún pedido ni dato
  const s = await state(page)
  expect(s.carts).toHaveLength(0)
  expect(s.orders).toHaveLength(17)
})

test('JG-06: el bar mantiene el juego como sección familiar aparte, sin alcohol a la vista', async ({ page }) => {
  await fresh(page, '/#/compas/chicos')
  await expect(page.getByText(/Sección familiar aparte de la barra/)).toBeVisible()
  await expect(page.locator('main')).not.toContainText(/vermut|cerveza/i)
  await page.goto('/#/compas/regalar')
  await expect(page.locator('main')).not.toContainText(/Vermut|Cerveza/)
})

test('NEG-02: café con leche + medialuna para retirar: aceptado sigue con pago pendiente; solo la caja lo marca pagado', async ({ page }) => {
  await fresh(page, '/#/ritual-cafe/carta')
  await page.getByTestId('open-RC-15').click()
  await page.getByLabel('Entera').check()
  await page.getByTestId('add-to-cart').click()
  await page.getByTestId('open-RC-18').click()
  await page.getByLabel('Jamón y queso').check()
  await page.getByTestId('add-to-cart').click()
  await page.getByRole('link', { name: /Mi pedido/ }).first().click()
  await page.getByTestId('pickup-time').fill('10:30')
  await page.getByLabel(/Nombre para el retiro/).fill('Marta')
  await page.getByTestId('send-order').click()
  await expect(page).toHaveURL(/pedido\/O-013/)
  await expect(page.getByTestId('payment-state')).toHaveAttribute('data-state', 'pendiente')
  // el comercio lo ve y lo acepta: el pago sigue pendiente
  await setRole(page, /Cocina/)
  await page.getByTestId('nav-cocina').click()
  await expect(page.getByTestId('k-pay-O-013')).toHaveText(/pendiente/)
  await page.getByTestId('k-accept-O-013').click()
  await page.goto('/#/ritual-cafe/pedido/O-013')
  await expect(page.getByText('Pedido aceptado')).toBeVisible()
  await expect(page.getByTestId('payment-state')).toHaveAttribute('data-state', 'pendiente')
  // caja: desde el pedido, "Cobrar en caja" abre la cuenta del retiro
  await setRole(page, /Caja/)
  await page.goto('/#/admin/pedidos/O-013')
  await expect(page.getByTestId('admin-payment')).toHaveAttribute('data-state', 'pendiente')
  await page.getByRole('link', { name: 'Cobrar en caja' }).click()
  const o = (await state(page)).orders.find((x: { id: string }) => x.id === 'O-013')
  await page.getByLabel('Monto parcial (ARS)').fill(String(o.totalCents / 100))
  await page.getByTestId('pay-btn').click()
  await expect(page.getByTestId('balance')).toHaveText('$ 0,00')
  await page.goto('/#/ritual-cafe/pedido/O-013')
  await expect(page.getByTestId('payment-state')).toHaveAttribute('data-state', 'pagado')
})

test('NEG-BR: combo en Brasa → plancha/freidora → número listo en la pantalla del mostrador; nada cruza a otro negocio', async ({ page }) => {
  await fresh(page, '/#/brasa/carta/BR-01')
  await page.getByRole('radio', { name: 'Mediano' }).check()
  await page.getByRole('radio', { name: 'Papas', exact: true }).check()
  await page.getByRole('radio', { name: 'Agua mineral' }).check()
  await page.getByTestId('add-to-cart').click()
  await page.getByRole('link', { name: /Mi pedido/ }).first().click()
  await page.getByTestId('pickup-time').fill('10:30')
  await page.getByLabel(/Nombre para el retiro/).fill('Juli')
  await page.getByTestId('send-order').click()
  await expect(page).toHaveURL(/pedido\/O-BR-004/)
  const code = (await state(page)).orders.find((x: { id: string }) => x.id === 'O-BR-004').pickupCode
  await page.goto('/#/brasa/numeros')
  await expect(page.getByTestId(`prep-${code}`)).toBeVisible()
  await setRole(page, /Cocina/)
  await page.getByTestId('nav-cocina').click()
  await expect(page.getByRole('heading', { name: 'Cocina · plancha y freidora' })).toBeVisible()
  await page.getByTestId('station-plancha').click()
  await expect(page.getByTestId('ticket-O-BR-004')).toBeVisible()
  for (const a of ['accept', 'prepare', 'ready']) await page.getByTestId(`k-${a}-O-BR-004`).click()
  await page.goto('/#/brasa/numeros')
  await expect(page.getByTestId(`ready-${code}`)).toBeVisible()
  // aislamiento: en el comercio de los otros negocios no aparece
  for (const b of ['copo', 'compas', 'mesa-clara', 'ritual-cafe']) {
    await page.goto(`/#/${b}`)
    await page.goto('/#/admin/pedidos')
    await expect(page.getByRole('link', { name: 'O-BR-004' })).toHaveCount(0)
  }
})

test('NEG-CO: la vitrina y el selector de gustos muestran el estado real de cada bacha', async ({ page }) => {
  await fresh(page, '/#/copo')
  await expect(page.getByTestId('gusto-hg-sambayon')).toContainText('Volvemos pronto')
  await expect(page.getByTestId('gusto-hg-menta')).toContainText('Queda poco')
  await expect(page.getByTestId('pay-at-counter')).toContainText('pagás en el local')
  await page.goto('/#/copo/carta/CO-02')
  await expect(page.getByLabel('Sambayón')).toBeDisabled()
  await page.getByLabel('Frutilla a la crema').check()
  await page.getByLabel('Dulce de leche granizado').check()
  await expect(page.getByLabel('Pistacho')).toBeDisabled() // cupo de 2 gustos completo
})

test('NEG-TC: Compás es agenda + reserva (sin entradas) y oculta lo que no usa', async ({ page }) => {
  await fresh(page, '/#/compas')
  await page.getByRole('navigation', { name: 'Navegación de Taberna Compás' }).getByRole('link', { name: 'Agenda' }).click()
  await expect(page.getByRole('heading', { name: 'Agenda de la semana', level: 1 })).toBeVisible()
  await expect(page.locator('[data-testid^="enroll-"]')).toHaveCount(0)
  await page.getByRole('link', { name: 'Reservar mesa para esa noche' }).first().click()
  await expect(page).toHaveURL(/compas\/reservar/)
  for (const r of ['pasaporte', 'explorar', 'simulador', 'numeros']) {
    await page.goto(`/#/compas/${r}`)
    await expect(page.getByRole('heading', { name: 'No encontramos esa sección en este perfil' })).toBeVisible()
  }
})

test('NEG-UI: inicio, carta, números, agenda y juego de los negocios nuevos sin violaciones serias, claro/oscuro, 390 sin scroll lateral', async ({ page }) => {
  test.setTimeout(150_000)
  const routes = ['/#/', '/#/copo', '/#/copo/carta', '/#/copo/chicos', '/#/compas', '/#/compas/catas', '/#/compas/chicos', '/#/brasa', '/#/brasa/numeros', '/#/brasa/chicos', '/#/ritual-cafe/chicos', '/#/mesa-clara/chicos']
  await fresh(page, '/')
  for (const scheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' })
    for (const w of [1280, 390]) {
      await page.setViewportSize({ width: w, height: w > 800 ? 900 : 844 })
      for (const r of routes) {
        await page.goto(r)
        await page.locator('#page-h1').waitFor()
        const start = page.locator('[data-testid$="-start"]')
        if (r.endsWith('/chicos')) await start.click()
        if (w === 390) expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `${scheme} ${w} ${r}`).toBe(true)
        if (w === 1280 || r.endsWith('/chicos')) {
          const res = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()
          const bad = res.violations.filter((v) => ['serious', 'critical'].includes(v.impact ?? ''))
          expect(bad.map((v) => `${scheme} ${w} ${r} ${v.id}: ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}`)).toEqual([])
        }
      }
    }
  }
})
