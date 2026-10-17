import { test, expect, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { fresh, setRole, state } from './helpers'

// P5-L6 · fidelización, campañas, costos y asistentes. Ninguna salida externa real.
async function asRole(page: Page, role: string) {
  await page.evaluate((r) => (window as any).__tableflow.dispatch({ type: 'session/setRole', role: r }), role)
}

test('GR-B/C/D: ciclo completo de una campaña: borrador con ND → costo cargado → aprobada → activa → canje → resultado observado → cancelada', async ({ page }) => {
  test.setTimeout(90_000)
  const external: string[] = []
  page.on('request', (r) => { if (!r.url().startsWith('http://127.0.0.1:4173')) external.push(r.url()) })
  await fresh(page, '/#/copo')
  await setRole(page, /Encargado/)
  await page.goto('/#/admin/campanas')
  await page.getByRole('link', { name: 'Kilo para la familia' }).click()
  // ND: falta el costo del pote de 1 kg → no se puede aprobar
  await expect(page.getByTestId('projection-missing')).toContainText('costo de Pote de 1 kg')
  await expect(page.getByTestId('pj-breakeven')).toHaveText('ND')
  await expect(page.getByTestId('camp-approve')).toBeDisabled()
  // se carga el costo y la proyección se completa
  await page.goto('/#/admin/costos')
  await expect(page.getByTestId('cost-CO-06')).toHaveAttribute('data-nd', 'true')
  await page.getByLabel('Costo del producto de Pote de 1 kg (pesos)').fill('8.200')
  await page.getByTestId('cost-save-CO-06').click()
  await expect(page.getByTestId('cost-CO-06')).not.toHaveAttribute('data-nd', 'true')
  await page.goto('/#/admin/campanas')
  await page.getByRole('link', { name: 'Kilo para la familia' }).click()
  await expect(page.getByTestId('pj-breakeven')).toHaveText(/pedido\(s\)|sin equilibrio/)
  await page.getByTestId('camp-approve').click()
  await page.getByTestId('camp-activate').click()
  await expect(page.getByRole('alert').filter({ hasText: 'Campaña activa' })).toBeVisible()
  const s1 = await state(page)
  const camp = s1.campaigns.find((c: any) => c.name === 'Kilo para la familia')
  const sofia = s1.benefits.find((b: any) => b.campaignId === camp.id && b.customerId === 'CL-009')
  expect(sofia.status).toBe('disponible')
  expect(s1.campaignSends.filter((x: any) => x.campaignId === camp.id).map((x: any) => [x.customerId, x.status])).toEqual([['CL-010', 'omitido'], ['CL-009', 'simulado']])
  // Sofía lo usa en su pedido: el descuento baja el saldo y el comercio lo ve
  await page.evaluate(() => (window as any).__tableflow.dispatch({ type: 'session/setCustomer', businessId: 'copo', customerId: 'CL-009' }))
  await page.goto('/#/copo/carta/CO-06')
  for (const g of ['Frutilla a la crema', 'Dulce de leche granizado']) await page.getByLabel(g).check()
  await page.getByTestId('add-to-cart').click()
  await page.goto('/#/copo/pedido')
  await page.getByTestId('benefit-code').fill(sofia.code)
  await page.getByTestId('benefit-apply').click()
  await expect(page.getByTestId('benefit-estimate')).toHaveText('− $ 2.190,00')
  await page.getByTestId('pickup-time').fill('10:45')
  await page.getByLabel(/Nombre para el retiro/).fill('Sofía')
  await page.getByTestId('send-order').click()
  await expect(page).toHaveURL(/pedido\/O-CO-003/)
  await expect(page.getByTestId('order-discount')).toHaveText('− $ 2.190,00')
  await expect(page.getByTestId('payment-state')).toContainText('$ 19.710,00')
  await asRole(page, 'encargado')
  await page.goto(`/#/admin/campanas/${camp.id}`)
  await expect(page.getByTestId('ob-redeemed')).toHaveText('0 / 1')
  await expect(page.getByTestId('observed')).toContainText('no prueban que sin ella')
  // cancelar respeta el canjeado
  await page.getByTestId('camp-cancel').click()
  await page.getByRole('dialog').getByRole('textbox').fill('Cambio de precios')
  await page.getByRole('dialog').getByRole('button', { name: 'Cancelar campaña' }).click()
  const s2 = await state(page)
  expect(s2.benefits.find((b: any) => b.id === sofia.id).status).toBe('canjeado')
  expect(external).toEqual([])
})

test('GR-B: calendario semanal, mensual, bimestral, por estación y por festividad', async ({ page }) => {
  await fresh(page, '/#/mesa-clara')
  await setRole(page, /Encargado/)
  await page.goto('/#/admin/campanas?vista=calendario')
  await expect(page.getByTestId('calendar')).toBeVisible()
  await page.getByTestId('cal-semana').click()
  await expect(page.locator('.cal-week > li')).toHaveCount(7)
  await page.getByTestId('cal-bimestre').click()
  await expect(page.locator('.cal-month')).toHaveCount(2)
  await page.getByTestId('cal-estacion').click()
  await expect(page.locator('.cal-month')).toHaveCount(3)
  await page.getByTestId('cal-festividades').click()
  await expect(page.locator('.cal-fest > li', { hasText: 'Fiestas' }).first()).toContainText('Fiestas en el bodegón')
  await page.getByTestId('cal-mes').click()
  await page.getByRole('button', { name: 'Siguiente →' }).click()
  await page.getByRole('button', { name: 'Siguiente →' }).click()
  await expect(page.getByRole('listitem', { name: /martes 1\/12.*Fiestas en el bodegón/ })).toBeVisible()
})

test('GR-E: asistente del comercio: pide datos, proyecta y crea un borrador que requiere aprobación; "Detener" corta la respuesta', async ({ page }) => {
  await fresh(page, '/#/mesa-clara')
  await setRole(page, /Encargado/)
  await page.goto('/#/admin/asistente')
  const pane = page.getByTestId('biz-assist')
  await expect(pane).toContainText('No usa IA')
  const ask = async (t: string) => { await page.getByTestId('biz-assist-input').fill(t); await page.getByTestId('biz-assist-send').click(); await expect(pane.locator('.cp-typing')).toHaveCount(0) }
  await ask('Armá una campaña para clientes a reactivar')
  await expect(pane.locator('.cp-msg.asistente').last()).toContainText('¿Qué beneficio?')
  await ask('$ 3.000')
  await ask('con la milanesa de ternera')
  await ask('costo fijo 15.000')
  await ask('presupuesto 90.000')
  const last = pane.locator('.cp-msg.asistente').last()
  await expect(last).toContainText('necesita la aprobación')
  await expect(last).toContainText('Supuestos')
  await last.getByTestId('assist-create-draft').click()
  await expect(page).toHaveURL(/admin\/campanas\/CMP-/)
  await expect(page.getByText('Este borrador lo preparó el asistente')).toBeVisible()
  const s = await state(page)
  expect(s.campaigns.filter((c: any) => c.createdBy === 'asistente').map((c: any) => c.status)).toEqual(['borrador'])
  // interrumpir
  await page.goto('/#/admin/asistente')
  await page.getByTestId('biz-assist-input').fill('¿Cuánto vendimos hoy?')
  await page.getByTestId('biz-assist-send').click()
  await page.getByTestId('biz-assist-stop').click()
  await expect(pane).toContainText('Respuesta detenida')
})

test('GR-F: asistente del cliente: sus beneficios y pedidos, nunca datos ajenos', async ({ page }) => {
  await fresh(page, '/#/ritual-cafe/asistente')
  const pane = page.getByTestId('client-assist')
  const ask = async (t: string) => { await page.getByTestId('client-assist-input').fill(t); await page.getByTestId('client-assist-send').click(); await expect(pane.locator('.cp-typing')).toHaveCount(0) }
  await ask('¿Tengo beneficios?')
  await expect(pane.locator('.cp-msg.asistente').last()).toContainText('entrá con tu perfil')
  await setRole(page, /recurrente/)
  await page.goto('/#/ritual-cafe/asistente')
  await ask('¿Tengo beneficios?')
  await expect(pane.locator('.cp-msg.asistente').last()).toContainText('Merienda de la semana')
  await ask('¿Qué pidió Lucía?')
  await expect(pane.locator('.cp-msg.asistente').last()).toContainText('No puedo mostrar datos de otras personas')
  await expect(pane.locator('.cp-msg.asistente').last()).not.toContainText('V60')
})

test('GR-A/C: Ana ve sus beneficios, lo usa en el pedido y si se rechaza vuelve a estar disponible', async ({ page }) => {
  await fresh(page, '/#/ritual-cafe/beneficios')
  await page.getByTestId('as-ana').click()
  const card = page.locator('[data-testid^="mine-RC-"]').first()
  await expect(card).toContainText('15 %')
  await page.goto('/#/ritual-cafe/carta')
  await page.getByTestId('open-RC-11').click()
  await page.getByTestId('add-to-cart').click()
  await page.goto('/#/ritual-cafe/beneficios')
  await page.locator('[data-testid^="use-RC-"]').first().click()
  await expect(page).toHaveURL(/ritual-cafe\/pedido/)
  await expect(page.getByTestId('benefit-estimate')).toHaveText('− $ 330,00')
  await page.getByTestId('pickup-time').fill('10:30')
  await page.getByLabel(/Nombre para el retiro/).fill('Ana')
  await page.getByTestId('send-order').click()
  await expect(page).toHaveURL(/pedido\/O-013/)
  await setRole(page, /Cocina/)
  await page.goto('/#/admin/pedidos/O-013')
  await page.getByRole('button', { name: 'Rechazar' }).click()
  await page.getByRole('dialog').getByRole('textbox').fill('Sin medialunas')
  await page.getByRole('dialog').getByRole('button', { name: /Rechazar/ }).click()
  const s = await state(page)
  const b = s.benefits.find((x: any) => x.customerId === 'CL-006')
  expect(b).toMatchObject({ status: 'disponible', orderId: null })
})

test('GR-UI: campañas, costos, asistentes y beneficios sin violaciones serias en claro y oscuro; 390 sin scroll lateral', async ({ page }) => {
  test.setTimeout(150_000)
  await fresh(page, '/#/ritual-cafe')
  await setRole(page, /Encargado/)
  const admin = ['/#/admin/campanas', '/#/admin/campanas/CMP-001', '/#/admin/campanas?vista=calendario', '/#/admin/costos', '/#/admin/asistente', '/#/admin/clientes/CL-006']
  for (const scheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' })
    for (const w of [1280, 390]) {
      await page.setViewportSize({ width: w, height: w > 800 ? 900 : 844 })
      for (const r of admin) {
        await page.goto(r)
        await page.locator('#page-h1').waitFor()
        if (w === 390) expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `${scheme} ${w} ${r}`).toBe(true)
        const res = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()
        const bad = res.violations.filter((v) => ['serious', 'critical'].includes(v.impact ?? ''))
        expect(bad.map((v) => `${scheme} ${w} ${r} ${v.id}: ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}`)).toEqual([])
      }
    }
  }
  await asRole(page, 'cliente-recurrente')
  for (const scheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' })
    for (const w of [1280, 390]) {
      await page.setViewportSize({ width: w, height: w > 800 ? 900 : 844 })
      for (const r of ['/#/ritual-cafe/beneficios', '/#/copo/beneficios', '/#/brasa/asistente']) {
        await page.goto(r)
        await page.locator('#page-h1').waitFor()
        if (w === 390) expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `${scheme} ${w} ${r}`).toBe(true)
        const res = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()
        const bad = res.violations.filter((v) => ['serious', 'critical'].includes(v.impact ?? ''))
        expect(bad.map((v) => `${scheme} ${w} ${r} ${v.id}: ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}`)).toEqual([])
      }
    }
  }
})
