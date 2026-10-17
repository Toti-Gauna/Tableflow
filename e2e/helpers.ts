import { expect, type Page } from '@playwright/test'

/** En pantallas angostas la consola de la demo está plegada: se abre antes de usar sus controles. */
export async function ensureConsole(page: Page) {
  if (!(await page.getByTestId('role-select').isVisible())) await page.getByRole('button', { name: 'Controles de la demo' }).click()
}
export async function setRole(page: Page, label: RegExp) {
  await ensureConsole(page)
  const opts = await page.getByTestId('role-select').locator('option').allTextContents()
  const m = opts.find((o) => label.test(o))
  if (!m) throw new Error(`rol no encontrado: ${label}`)
  await page.getByTestId('role-select').selectOption({ label: m })
}
export async function state(page: Page) {
  return page.evaluate(() => (window as any).__tableflow.getState())
}
export async function fresh(page: Page, path = '/') {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.goto(path)
  await page.reload()
  await expect(page.getByText('Datos ficticios').first()).toBeVisible()
}
export async function jump(page: Page, label: string) {
  await ensureConsole(page)
  await page.getByTestId('clock-jump').selectOption({ label })
}
