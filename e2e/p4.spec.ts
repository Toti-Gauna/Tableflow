import { test, expect } from '@playwright/test'
import { fresh, setRole, state } from './helpers'

// P4: capa de demo separada del producto, estructura nueva y acciones agrupadas del lado profesional.

test('la guía de la demo vive en la consola y lleva a los recorridos', async ({ page }) => {
  await fresh(page, '/#/mesa-clara')
  // el inicio del cliente ya no trae instrucciones de la demo
  await expect(page.getByRole('heading', { name: 'Recorrido guiado' })).toHaveCount(0)
  await page.getByTestId('guide-open').click()
  const guide = page.getByTestId('guide')
  await expect(guide.getByRole('heading', { name: 'Mesa Clara · del pedido al cierre' })).toBeVisible()
  await guide.getByRole('button', { name: 'Invitar a alguien a comer' }).click()
  await expect(page).toHaveURL(/mesa-clara\/regalar/)
  await expect(guide).toBeHidden()
})

test('reservar: el resumen tipo ticket refleja día, personas y hora elegidos', async ({ page }) => {
  await fresh(page, '/#/mesa-clara/reservar')
  const summary = page.getByRole('complementary', { name: 'Resumen de tu solicitud' })
  await expect(summary).toContainText('elegí un horario')
  await page.getByRole('button', { name: 'Una persona más' }).click()
  await page.getByTestId('slot-780').click()
  await expect(summary).toContainText('3')
  await expect(summary).toContainText('13:00')
})

test('seguimiento: el estado es el protagonista y el detalle técnico queda plegado', async ({ page }) => {
  await fresh(page, '/#/ritual-cafe/pedido/O-008')
  await expect(page.getByRole('heading', { name: '¡Listo!' })).toBeVisible()
  await expect(page.getByText(/operación OP-/)).toBeHidden()
  await page.getByText('Detalle técnico').click()
  await expect(page.getByText(/operación OP-/)).toBeVisible()
})

test('reservas admin: una acción principal por fila y el resto en el menú (cancelar con motivo)', async ({ page }) => {
  await fresh(page, '/#/mesa-clara')
  await setRole(page, /Recepción/)
  await page.goto('/#/admin/reservas')
  const row = page.getByTestId('res-row-R-001')
  await expect(row.getByRole('button', { name: 'Marcar llegada' })).toBeVisible()
  await expect(row.getByRole('button', { name: 'Cancelar reserva' })).toHaveCount(0)
  await row.getByRole('button', { name: 'Otras acciones para R-001' }).click()
  await page.getByRole('button', { name: 'Cancelar reserva' }).click()
  await page.locator('#reason-input').fill('Pidió cambiar de día')
  await page.getByTestId('dialog-confirm').click()
  await expect(row).toContainText('Cancelada')
  // Escape cierra el menú y devuelve el foco al botón
  const r2 = page.getByTestId('res-row-R-002')
  await r2.getByRole('button', { name: 'Otras acciones para R-002' }).click()
  await page.keyboard.press('Escape')
  await expect(r2.getByRole('button', { name: 'Otras acciones para R-002' })).toBeFocused()
  expect((await state(page)).reservations.find((r: { id: string }) => r.id === 'R-002').status).toBe('confirmada')
})

test('reportes: gráfico con eje, valores y vista de tabla', async ({ page }) => {
  await fresh(page, '/#/ritual-cafe')
  await setRole(page, /Encargado/)
  await page.goto('/#/admin/reportes')
  const chart = page.getByTestId('chart-orders')
  await expect(chart.getByRole('listitem', { name: /Enviado: \d+ pedidos?/ })).toBeVisible()
  await chart.getByText('Ver como tabla').click()
  await expect(chart.getByRole('table')).toContainText('Total')
})
