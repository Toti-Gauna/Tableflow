import { test, expect } from '@playwright/test'
import { fresh, jump, setRole, state } from './helpers'

// P3: invitar a comer, temporadas, sección infantil, barras inferiores, carga diferida, sonidos y migración v1 → v2.

test('invitar a comer: validar → crear → abrir el sobre → canjear con extras → enviar → caja y Regalos', async ({ page }) => {
  await fresh(page, '/#/mesa-clara/regalar')
  // sin mensaje ni nombres: errores junto a cada campo y foco en el primero
  await page.getByTestId('gift-submit').click()
  await expect(page.locator('#g-fromAlias-err')).toContainText('Poné tu nombre')
  await expect(page.locator('#g-fromAlias')).toBeFocused()
  await expect(page.locator('#g-message-err')).toContainText('Escribí un mensaje')
  expect((await state(page)).gifts).toHaveLength(0)
  await page.getByRole('button', { name: /Ver toda la carta/ }).click()
  await page.getByTestId('gift-item-MC-12').click()
  await page.getByTestId('gift-from').fill('Lu')
  await page.getByTestId('gift-to').fill('Mamá')
  await page.getByRole('button', { name: /Feliz día, ma/ }).click() // mensaje sugerido de la temporada
  await expect(page.getByRole('article', { name: /Tarjeta de invitación de Lu para Mamá/ })).toContainText('Milanesa de ternera')
  await page.locator('label', { hasText: 'WhatsApp simulado' }).click()
  await page.getByTestId('gift-submit').dblclick() // doble envío: una sola invitación
  await expect(page.getByRole('heading', { name: 'Tu invitación está lista' })).toBeVisible()
  const s1 = await state(page)
  expect(s1.gifts).toHaveLength(1)
  const code: string = s1.gifts[0].code
  await expect(page.getByTestId('gift-code')).toHaveText(code)
  // mensaje de regalo simulado en el simulador de canales
  await page.getByRole('link', { name: 'Ver el mensaje en el simulador' }).click()
  await expect(page.getByTestId('chat-log')).toContainText('te invita a comer')
  await expect(page.getByTestId('chat-log')).toContainText('SIMULADO')
  // quien recibe: sobre cerrado → abrir
  await page.goto(`/#/mesa-clara/regalo/${code}`)
  await expect(page.getByTestId('gift-envelope')).toBeVisible()
  await page.getByTestId('gift-open').click()
  await expect(page.getByRole('article', { name: /Tarjeta de invitación/ })).toContainText('Feliz día, ma')
  expect((await state(page)).gifts[0].status).toBe('abierto')
  // canje: el plato base queda cubierto; el extra se paga
  await jump(page, 'Ir a las 12:00 (almuerzo)')
  await page.getByTestId('gift-redeem').click()
  await expect(page.getByTestId('gift-note')).toContainText(`Invitación de Lu (${code})`)
  await page.locator('label', { hasText: 'Papas al horno' }).click()
  await expect(page.getByTestId('subtotal')).toHaveText('$ 1.500,00')
  await page.getByTestId('add-to-cart').click()
  await page.goto('/#/mesa-clara/pedido')
  await expect(page.locator('[data-testid^="gift-line-"]')).toContainText(`Invitación ${code} de Lu`)
  await expect(page.getByTestId('cart-total')).toHaveText('$ 1.500,00')
  await page.getByTestId('mesa-select').selectOption('T-MC-02')
  await page.getByTestId('send-order').click()
  await expect(page).toHaveURL(/pedido\/O-013/)
  await expect(page.getByTestId('order-due')).toHaveText('$ 1.500,00')
  // la misma invitación no se canjea dos veces
  await page.goto(`/#/mesa-clara/regalo/${code}`)
  await expect(page.getByText('Se usó en el pedido')).toBeVisible()
  await expect(page.getByTestId('gift-redeem')).toHaveCount(0)
  // profesional: Regalos muestra la invitación canjeada con su pedido
  await setRole(page, /Encargado/)
  await page.goto('/#/admin/regalos')
  await expect(page.getByTestId(`gift-row-${code}`)).toContainText('Canjeada')
  await expect(page.getByTestId(`gift-row-${code}`).getByRole('link', { name: 'O-013' })).toBeVisible()
})

test('cancelar una invitación con motivo desde Regalos: deja de poder canjearse', async ({ page }) => {
  await fresh(page, '/#/ritual-cafe/regalar')
  await page.getByTestId('gift-item-RC-04').click()
  await page.getByTestId('gift-from').fill('Sofi')
  await page.getByTestId('gift-to').fill('Juli')
  await page.getByTestId('gift-message').fill('¡Gracias por todo!')
  await page.getByTestId('gift-submit').click()
  const code: string = (await state(page)).gifts[0].code
  await setRole(page, /Encargado/)
  await page.getByTestId('biz-select').selectOption('ritual-cafe')
  await page.goto('/#/admin/regalos')
  await page.getByTestId(`gift-cancel-${code}`).click()
  await page.locator('#reason-input').fill('Se equivocó de sede')
  await page.getByTestId('dialog-confirm').click()
  await expect(page.getByTestId(`gift-row-${code}`)).toContainText('Cancelada')
  await setRole(page, /invitado/)
  await page.goto(`/#/ritual-cafe/regalo/${code}`)
  await expect(page.getByRole('heading', { name: 'La invitación fue cancelada' })).toBeVisible()
  await expect(page.getByText('Se equivocó de sede')).toBeVisible()
})

test('temporada: automática por el reloj simulado (Día de la Madre) y forzada desde Configuración', async ({ page }) => {
  await fresh(page, '/#/mesa-clara')
  await expect(page.getByTestId('season-band')).toContainText('Día de la Madre')
  await expect(page.getByTestId('season-band')).toContainText('Fue ayer')
  await setRole(page, /Encargado/)
  await page.goto('/#/admin/configuracion')
  await page.getByTestId('cfg-season').selectOption('fiestas')
  await setRole(page, /invitado/)
  await page.goto('/#/mesa-clara')
  await expect(page.getByTestId('season-band')).toContainText('Fiestas en Mesa Clara')
  await expect(page.locator('.client')).toHaveAttribute('data-season', 'fiestas')
  await page.getByTestId('season-gift').click()
  await expect(page).toHaveURL(/regalar/)
  const s = await state(page)
  expect(s.settings.seasonByBusiness['mesa-clara']).toBe('fiestas')
  expect(s.audit.some((a: { type: string }) => a.type === 'config.season')).toBe(true)
})

test('para chicos: memotest con teclado hasta ganar y "Armá tu plato"', async ({ page }) => {
  await fresh(page, '/#/mesa-clara/chicos')
  const card = (i: number) => page.getByTestId(`memo-${i}`)
  const names: string[] = []
  // primera pasada de a dos (con teclado): aprende cada carta
  for (let i = 0; i < 12; i += 2) {
    await card(i).focus(); await page.keyboard.press('Enter')
    await card(i + 1).focus(); await page.keyboard.press('Enter')
    for (const j of [i, i + 1]) names[j] = ((await card(j).getAttribute('aria-label')) ?? '').replace(/^Carta \d+: /, '').replace(', encontrada', '')
  }
  await expect(page.getByTestId('memo-moves')).toHaveText('6')
  // segunda pasada: completa las parejas que falten
  for (let a = 0; a < 12; a++) {
    if (await page.getByTestId('memo-win').isVisible()) break
    if ((await card(a).getAttribute('aria-label'))?.includes('encontrada')) continue
    const b = names.findIndex((n, j) => j !== a && n === names[a])
    await card(a).click(); await card(b).click()
  }
  await expect(page.getByTestId('memo-win')).toContainText('Encontraste todas las parejas')
  // armá tu plato: cada elección cambia el nombre del plato (juego, no pedido)
  await page.locator('label', { hasText: 'Huevo frito' }).click()
  await page.locator('label', { hasText: 'Choclo' }).click()
  await expect(page.getByTestId('arma-name')).toHaveText('Huevito dorado')
  expect((await state(page)).carts).toHaveLength(0)
})

test('móvil 390: barra inferior con pedido, hoja de secciones y pedido flotante sin solaparse', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await fresh(page, '/#/ritual-cafe/carta')
  const tabs = page.getByRole('navigation', { name: 'Accesos rápidos de Ritual Café' })
  await expect(tabs).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Navegación de Ritual Café' })).toBeHidden()
  await page.getByTestId('open-RC-11').click()
  await page.getByTestId('add-to-cart').click()
  await expect(tabs.getByRole('link', { name: 'Mi pedido (1)' })).toBeVisible()
  const bar = await page.getByRole('region', { name: 'Resumen del pedido' }).boundingBox()
  const tb = await tabs.boundingBox()
  expect(bar!.y + bar!.height).toBeLessThanOrEqual(tb!.y)
  await tabs.getByRole('button', { name: 'Secciones' }).click()
  await page.getByRole('dialog', { name: 'Más de Ritual Café' }).getByRole('link', { name: /Para chicos/ }).click()
  await expect(page.getByRole('heading', { name: 'Para chicos', level: 1 })).toBeVisible()
  await expect(page.getByRole('dialog', { name: 'Más de Ritual Café' })).toBeHidden()
  // administración: accesos del rol abajo; el resto en la hoja
  await setRole(page, /Cocina/)
  const admin = page.getByRole('navigation', { name: 'Accesos rápidos de administración' })
  await expect(admin.getByRole('link', { name: /Cocina/ })).toBeVisible()
  const o = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }))
  expect(o.sw).toBeLessThanOrEqual(o.cw)
})

test('carga diferida: una sección de administración por URL directa carga y el foco llega al título al navegar', async ({ page }) => {
  await fresh(page, '/#/mesa-clara')
  await setRole(page, /Encargado/)
  await page.goto('/#/admin/regalos')
  await expect(page.getByRole('heading', { name: 'Regalos', level: 1 })).toBeVisible()
  await page.getByTestId('nav-reportes').click()
  await expect(page.locator('#page-h1')).toHaveText('Reportes')
  await expect(page.locator('#page-h1')).toBeFocused()
})

test('sonidos de interfaz: apagados por defecto (sin AudioContext) y opcionales desde la consola', async ({ browser }) => {
  const ctx = await browser.newContext()
  const page = await ctx.newPage()
  await page.addInitScript(() => {
    ;(window as any).__ac = 0
    const Orig = window.AudioContext
    if (Orig) (window as any).AudioContext = function (...a: any[]) { (window as any).__ac++; return new (Orig as any)(...a) }
  })
  await fresh(page, '/#/ritual-cafe/carta')
  await page.getByTestId('open-RC-11').click()
  await page.getByTestId('add-to-cart').click()
  expect(await page.evaluate(() => (window as any).__ac)).toBe(0)
  await page.getByTestId('sfx-toggle').click()
  await expect(page.getByTestId('sfx-toggle')).toHaveAttribute('aria-pressed', 'true')
  expect(await page.evaluate(() => (window as any).__ac)).toBe(1)
  await ctx.close()
})

test('migración: un guardado v1 (P2) se abre en v2 sin pantalla de recuperación ni pérdida de datos', async ({ page }) => {
  await fresh(page, '/#/ritual-cafe/carta')
  await page.getByTestId('open-RC-11').click()
  await page.getByTestId('add-to-cart').click()
  await page.evaluate(() => {
    const env = JSON.parse(localStorage.getItem('tableflow.demo.v1')!)
    delete env.state.gifts
    delete env.state.settings
    env.state.schemaVersion = 1
    env.schemaVersion = 1
    localStorage.setItem('tableflow.demo.v1', JSON.stringify(env))
  })
  await page.reload()
  await expect(page.getByRole('link', { name: 'Mi pedido (1)' }).first()).toBeAttached()
  const s = await state(page)
  expect(s.schemaVersion).toBe(2)
  expect(s.gifts).toEqual([])
  expect(s.carts[0].lines).toHaveLength(1)
})
