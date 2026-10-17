import { test, expect, type Page } from '@playwright/test'
import { fresh, jump, setRole, state } from './helpers'

// P2-L2: el rediseño mantiene el contrato funcional en todos los anchos (S09, S41–S43) y diferencia los estados.

const noOverflow = async (page: Page, label: string) => {
  const o = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }))
  expect(o.sw, `scroll horizontal en ${label}`).toBeLessThanOrEqual(o.cw)
}

/** El elemento con foco no queda tapado por el banner fijo, las categorías fijas ni el carrito (WCAG 2.4.11). */
const focusNotObscured = async (page: Page) =>
  page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null
    if (!el || el === document.body) return 'sin foco'
    if (el.closest('.demo-banner, .cart-bar, .cat-nav, .console, dialog')) return 'ok'
    const r = el.getBoundingClientRect()
    const x = Math.min(window.innerWidth - 1, Math.max(0, r.left + Math.min(r.width / 2, 12)))
    const y = Math.min(window.innerHeight - 1, Math.max(0, r.top + r.height / 2))
    const hit = document.elementFromPoint(x, y)
    return hit && (hit === el || el.contains(hit) || hit.contains(el)) ? 'ok' : `tapado: ${el.outerHTML.slice(0, 80)} por ${hit?.outerHTML.slice(0, 80)}`
  })

for (const vp of [{ w: 390, h: 844 }, { w: 768, h: 1024 }]) {
  test(`S09 a ${vp.w}px: búsqueda sin resultados, limpiar filtros y lista original intacta`, async ({ page }) => {
    await page.setViewportSize({ width: vp.w, height: vp.h })
    await fresh(page, '/#/mesa-clara/carta')
    const before = await page.locator('[data-testid^="dish-"]').count()
    await page.getByRole('button', { name: 'Vegetarianos' }).click()
    await page.getByTestId('menu-search').fill('zzz123')
    await expect(page.getByText('No encontramos platos con esos filtros')).toBeVisible()
    await expect(page.locator('[data-testid^="dish-"]')).toHaveCount(0)
    await noOverflow(page, 'carta vacía')
    await page.getByTestId('clear-filters').click()
    await expect(page.locator('[data-testid^="dish-"]')).toHaveCount(before)
    await expect(page.getByRole('button', { name: 'Vegetarianos' })).toHaveAttribute('aria-pressed', 'false')
    await expect(page.getByTestId('menu-search')).toHaveValue('')
  })
}

test('S41 en móvil: filtro sin actividad → vacío explicativo sin cifras inventadas → restablecer', async ({ page }) => {
  await fresh(page, '/#/admin/reportes')
  await setRole(page, /Encargado/)
  await page.goto('/#/admin/reportes')
  await page.setViewportSize({ width: 390, height: 844 })
  await page.getByTestId('rep-from').fill('2026-11-02')
  await page.getByTestId('rep-to').fill('2026-11-03')
  await expect(page.getByText('Sin actividad para estos filtros')).toBeVisible()
  await expect(page.getByTestId('report')).toHaveCount(0)
  await noOverflow(page, 'reportes vacíos')
  await page.getByTestId('rep-reset').click()
  await expect(page.getByTestId('report')).toBeVisible()
})

for (const w of [320, 390]) {
  test(`S43 a ${w}px: el carrito fijo no tapa el último plato, el error ni el foco`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: 700 })
    await fresh(page, '/#/ritual-cafe/carta')
    await page.getByTestId('open-RC-04').click()
    // pie del configurador visible y sin cortar el total (medido al terminar la entrada de la hoja)
    await page.waitForFunction(() => document.querySelector('dialog.item')?.getAnimations().length === 0)
    const foot = await page.locator('.item-foot').boundingBox()
    expect(foot && foot.y + foot.height).toBeLessThanOrEqual(700 + 1)
    await page.getByTestId('add-to-cart').click()
    await expect(page.getByText('Elegí tamaño').or(page.locator('.opt-group.invalid')).first()).toBeVisible()
    await page.getByLabel('Mediano').check()
    await page.getByLabel('Entera').check()
    await expect(page.getByTestId('subtotal')).toHaveText('$ 6.600,00')
    await page.getByTestId('add-to-cart').click()
    const bar = page.getByRole('region', { name: 'Resumen del pedido' })
    await expect(bar).toBeVisible()
    // al final de la carta, la última pieza queda por encima del carrito fijo
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
    const last = await page.locator('[data-testid^="dish-"]').last().boundingBox()
    const barBox = await bar.boundingBox()
    expect(last!.y + last!.height).toBeLessThanOrEqual(barBox!.y + 1)
    // recorrido con teclado: ningún foco queda tapado por banner, categorías o carrito
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.getByTestId('menu-search').focus()
    for (let i = 0; i < 18; i++) {
      await page.keyboard.press('Tab')
      expect(await focusNotObscured(page)).toBe('ok')
    }
    // en Mi pedido el error queda a la vista junto al campo
    await page.getByRole('link', { name: 'Revisar y enviar' }).click()
    await page.getByTestId('pickup-time').fill('10:15')
    await page.getByTestId('send-order').click()
    const err = page.locator('#alias-err')
    await expect(err).toBeVisible()
    await err.scrollIntoViewIfNeeded()
    const eb = await err.boundingBox()
    expect(eb!.y + eb!.height).toBeLessThanOrEqual(700)
    await noOverflow(page, 'pedido con error')
  })
}

test('zoom 200 % (1280 px → 640 CSS px) y tablet 768: sin scroll horizontal en todos los módulos', async ({ page }) => {
  const paths = ['/#/', '/#/mesa-clara', '/#/mesa-clara/carta', '/#/mesa-clara/reservar', '/#/mesa-clara/pedido', '/#/mesa-clara/catas', '/#/mesa-clara/explorar', '/#/mesa-clara/pasaporte', '/#/mesa-clara/ayuda', '/#/mesa-clara/simulador', '/#/ritual-cafe', '/#/ritual-cafe/carta', '/#/ritual-cafe/pedido/O-008', '/#/admin/resumen', '/#/admin/reservas', '/#/admin/salon', '/#/admin/pedidos', '/#/admin/cocina', '/#/admin/caja', '/#/admin/carta', '/#/admin/stock', '/#/admin/clientes', '/#/admin/automatizaciones', '/#/admin/reportes', '/#/admin/configuracion', '/#/comercial']
  await fresh(page, '/#/')
  for (const vp of [{ width: 640, height: 400 }, { width: 768, height: 1024 }]) {
    await page.setViewportSize(vp)
    for (const p of paths) {
      await page.goto(p)
      await page.waitForTimeout(60)
      await noOverflow(page, `${p} a ${vp.width}px`)
    }
  }
})

test('estados diferenciados con texto e ícono: revisión, cancelación pendiente, tarde, espera de retiro, agotado', async ({ page }) => {
  await fresh(page, '/#/ritual-cafe/carta')
  // agotado + alternativa: el sello dice "Agotado" y la ficha sugiere alternativas de la misma categoría
  await expect(page.getByTestId('dish-RC-10')).toContainText('Agotado')
  await expect(page.getByTestId('dish-RC-10')).toContainText('Alternativas de la misma categoría')
  await setRole(page, /Encargado/)
  // en el seed, la revisión humana tiene su tono propio y no se confunde con "solicitada"
  await page.goto('/#/admin/reservas')
  await page.getByTestId('biz-select').selectOption('mesa-clara')
  await page.goto('/#/admin/reservas')
  const review = page.locator('.badge.review', { hasText: 'Revisión humana' })
  const requested = page.locator('.badge.warn', { hasText: 'Solicitada' })
  if (await review.count()) await expect(review.first()).toBeVisible()
  await expect(requested.first()).toBeVisible()
  // KDS: preparación tarde con texto "Tarde" y listo con "Esperando retiro"
  await page.getByTestId('biz-select').selectOption('ritual-cafe')
  await page.goto('/#/admin/cocina')
  await expect(page.getByTestId('ticket-O-008')).toContainText('Esperando retiro')
  await page.getByTestId('clock-60').click()
  await expect(page.getByTestId('ticket-O-009')).toContainText(/Tarde · \d+ min/)
  await expect(page.getByTestId('ticket-O-008')).toContainText(/Retiro demorado · \d+ min/)
  // cancelación pendiente: el cliente pide cancelar un pedido en preparación
  await setRole(page, /invitado/)
  await page.goto('/#/ritual-cafe/pedido/O-009')
  await page.getByTestId('cancel-order').click()
  await page.locator('#reason-input').fill('Me tengo que ir')
  await page.getByTestId('dialog-confirm').click()
  await setRole(page, /Encargado/)
  await page.goto('/#/admin/cocina')
  await expect(page.getByTestId('ticket-O-009')).toContainText('Cancelación pendiente')
  await page.goto('/#/admin/pedidos')
  await expect(page.getByTestId('order-row-O-009')).toContainText('Cancelación pendiente')
})

test('política sin reservas también en navegación, ruta directa y chat (Ritual Café)', async ({ page }) => {
  await fresh(page, '/#/ritual-cafe')
  const nav = page.getByRole('navigation', { name: 'Navegación de Ritual Café' })
  await expect(nav.getByRole('link', { name: 'Reservar' })).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'Reservar una mesa' })).toHaveCount(0)
  await page.goto('/#/ritual-cafe/reservar')
  await expect(page.getByText('En este perfil atendemos por orden de llegada').first()).toBeVisible()
  await expect(page.getByTestId('res-submit')).toHaveCount(0)
  await page.goto('/#/ritual-cafe/simulador')
  await page.getByTestId('chat-input').fill('Quiero reservar una mesa para 4')
  await page.getByTestId('chat-send').click()
  await expect(page.getByTestId('chat-log')).toContainText(/orden de llegada/)
  expect((await state(page)).reservations.filter((r: { businessId: string }) => r.businessId === 'ritual-cafe')).toHaveLength(0)
})

test('teclado en móvil: diálogos devuelven el foco y el panel de mesa recibe el foco al elegirla', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await fresh(page, '/#/mesa-clara/carta')
  await jump(page, 'Ir a las 12:00 (almuerzo)')
  const opener = page.getByTestId('open-MC-12')
  await opener.focus()
  await page.keyboard.press('Enter')
  await expect(page.getByTestId('item-dialog')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(opener).toBeFocused()
  await setRole(page, /Mozo/)
  await page.goto('/#/admin/salon')
  await page.getByTestId('table-T-MC-05').click()
  await expect(page.locator('#mesa-h')).toBeFocused()
  await expect(page.locator('#mesa-h')).toHaveText('Mesa M5')
  await page.getByRole('button', { name: 'Lista' }).click()
  await expect(page.getByRole('table', { name: 'Mesas del salón' })).toHaveCount(1)
})
