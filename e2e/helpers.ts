import { expect, type Page } from '@playwright/test'

/** P5-L3: los controles viven en el dock, cerrado por defecto: se abre antes de usarlos. */
export async function ensureConsole(page: Page) {
  if (!(await page.getByTestId('role-select').isVisible())) await page.getByRole('button', { name: 'Controles de la demo' }).click()
  await expect(page.getByTestId('dock-panel')).toBeVisible()
}
/** Cierra el dock si quedó abierto (Escape devuelve el foco al botón). */
export async function closeDock(page: Page) {
  if (await page.getByTestId('dock-panel').isVisible()) await page.keyboard.press('Escape')
  await expect(page.getByTestId('dock-panel')).toBeHidden()
}
/** Preferencia que el selector de rol de bienvenida guarda al elegir u omitir (ver playwright.config.ts). */
export const INTRO_SEEN = JSON.stringify({ roleIntroSeen: true })
export async function setRole(page: Page, label: RegExp) {
  await ensureConsole(page)
  const opts = await page.getByTestId('role-select').locator('option').allTextContents()
  const m = opts.find((o) => label.test(o))
  if (!m) throw new Error(`rol no encontrado: ${label}`)
  await page.getByTestId('role-select').selectOption({ label: m })
  await closeDock(page)
}
export async function state(page: Page) {
  return page.evaluate(() => (window as any).__tableflow.getState())
}
export async function fresh(page: Page, path = '/') {
  await page.goto('/')
  // la bienvenida se prueba aparte (p5-l3.spec.ts): acá se arranca como alguien que ya la omitió
  await page.evaluate((prefs) => { localStorage.clear(); localStorage.setItem('tableflow.demo.v1.prefs', prefs) }, INTRO_SEEN)
  await page.goto(path)
  await page.reload()
  await expect(page.getByText('Datos ficticios').first()).toBeVisible()
}
export async function jump(page: Page, label: string) {
  await ensureConsole(page)
  await page.getByTestId('clock-jump').selectOption({ label })
  await closeDock(page)
}
