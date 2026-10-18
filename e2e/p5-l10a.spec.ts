import { test, expect, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { INTRO_SEEN } from './helpers'

/**
 * P5-L10a · Barrido de accesibilidad automática (axe: detecta lo medible, no certifica conformidad).
 * Cubre las cinco identidades, claro y oscuro, a 1280 y 390 px, con todas las rutas del cliente y de administración.
 * Por defecto corre una diagonal de la matriz (claro 1280 y oscuro 390); con A11Y_FULL=1 corre las cuatro combinaciones.
 */
const BIZ = ['mesa-clara', 'ritual-cafe', 'copo', 'compas', 'brasa'] as const
const CLIENT = ['', '/carta', '/pedido', '/reservar', '/explorar', '/pasaporte', '/catas', '/numeros', '/ayuda', '/beneficios', '/codigos', '/asistente', '/simulador', '/regalar', '/chicos']
const ADMIN = ['resumen', 'reservas', 'salon', 'pedidos', 'cocina', 'caja', 'carta', 'stock', 'clientes', 'regalos', 'automatizaciones', 'reportes', 'configuracion', 'campanas', 'costos', 'codigos', 'asistente']
const SHARED = ['/', '/comercial', '/escenas', '/guia', '/arte']

const CONFIGS = [
  { theme: 'light', w: 1280, h: 800 },
  { theme: 'dark', w: 390, h: 844 },
  ...(process.env.A11Y_FULL ? [{ theme: 'dark', w: 1280, h: 800 }, { theme: 'light', w: 390, h: 844 }] : []),
] as const

async function sweep(page: Page, paths: string[]) {
  const bad: string[] = []
  const soft: string[] = []
  for (const p of paths) {
    await page.goto(`/#${p}`)
    // con carga diferida se analiza la pantalla ya montada (no el cargador)
    await page.locator('#page-h1').first().waitFor({ state: 'visible', timeout: 6000 }).catch(() => undefined)
    await page.waitForTimeout(100)
    const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()
    for (const v of r.violations) {
      const line = `${p}: ${v.id} (${v.nodes.length}) ${v.nodes[0]?.html.slice(0, 110)}`
      ;(['serious', 'critical'].includes(v.impact ?? '') ? bad : soft).push(line)
    }
  }
  return { bad, soft }
}

async function start(page: Page, theme: string) {
  await page.goto('/')
  await page.evaluate((prefs) => { localStorage.clear(); localStorage.setItem('tableflow.demo.v1.prefs', prefs) }, JSON.stringify({ ...JSON.parse(INTRO_SEEN), theme }))
  await page.reload()
  await expect(page.getByText('Datos ficticios').first()).toBeVisible()
  // el encargado ve todas las secciones de administración
  await page.evaluate(() => (window as any).__tableflow.dispatch({ type: 'session/setRole', role: 'encargado' }))
}

for (const c of CONFIGS) {
  test.describe(`axe · ${c.theme} · ${c.w}px`, () => {
    test.use({ viewport: { width: c.w, height: c.h } })
    for (const biz of BIZ) {
      test(`${biz}: cliente y administración sin violaciones serias o críticas`, async ({ page }, info) => {
        test.setTimeout(240_000)
        await start(page, c.theme)
        const paths = [...(biz === 'mesa-clara' ? SHARED : []), ...CLIENT.map((x) => `/${biz}${x}`)]
        const client = await sweep(page, paths)
        await page.evaluate((b) => (window as any).__tableflow.dispatch({ type: 'session/setBusiness', businessId: b }), biz)
        const admin = await sweep(page, ADMIN.map((x) => `/admin/${x}`))
        const soft = [...client.soft, ...admin.soft]
        if (soft.length) info.annotations.push({ type: 'menores (informativo)', description: soft.join('\n') })
        expect([...client.bad, ...admin.bad]).toEqual([])
      })
    }
  })
}
