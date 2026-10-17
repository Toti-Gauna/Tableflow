import { test, expect, chromium, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { qrModules, qrPathData } from '../src/domain/qr-render'
import { qrPath } from '../src/domain/qr'
import { fresh, state } from './helpers'

// P5-L7 · QR y códigos. Lectura real del QR (foto y cámara con dispositivo falso), validación contra el store,
// canje idempotente y ninguna salida externa.
async function asRole(page: Page, role: string) {
  await page.evaluate((r) => (window as any).__tableflow.dispatch({ type: 'session/setRole', role: r }), role)
}
const dispatch = (page: Page, cmd: Record<string, unknown>) => page.evaluate((c) => (window as any).__tableflow.dispatch(c), cmd)
/** El QR de una tarjeta, ampliado, como imagen (lo que vería una cámara o una captura). */
async function qrImage(page: Page, testId: string, type: 'png' | 'jpeg' = 'png') {
  const img = page.getByTestId(testId).getByTestId('qr-img')
  await img.evaluate((el) => { el.setAttribute('width', '480'); el.setAttribute('height', '480') })
  return img.screenshot({ type })
}
const result = (page: Page) => page.getByTestId('code-result')

test('QR-02: el QR de un pedido listo se LEE de verdad desde una imagen y se canjea una sola vez', async ({ page }) => {
  const external: string[] = []
  page.on('request', (r) => { if (!r.url().startsWith('http://127.0.0.1:4173')) external.push(r.url()) })
  await fresh(page, '/#/ritual-cafe/codigos')
  await asRole(page, 'cliente-recurrente')
  const png = await qrImage(page, 'qr-card-pedido-O-008')
  await asRole(page, 'caja')
  await page.goto('/#/admin/codigos')
  await page.getByTestId('scan-file').setInputFiles({ name: 'qr-pedido.png', mimeType: 'image/png', buffer: png })
  await expect(result(page)).toHaveAttribute('data-status', 'valido')
  await expect(result(page)).toContainText('Pedido O-008')
  await expect(result(page)).toContainText('no acredita el pago')
  await expect(page.getByText('Lectura: foto del QR')).toBeVisible()
  // el importe sale del store, no del QR
  const s0 = await state(page)
  expect(s0.orders.find((o: any) => o.id === 'O-008').status).toBe('listo')
  // doble clic: un solo canje
  await page.getByTestId('code-action').dblclick()
  await expect(result(page)).toHaveAttribute('data-status', 'usado')
  const s1 = await state(page)
  expect(s1.orders.find((o: any) => o.id === 'O-008').status).toBe('retirado')
  expect(s1.audit.filter((a: any) => a.type === 'code.redeemed')).toHaveLength(1)
  // el mismo QR otra vez: ya usado, sin botón y sin segundo efecto
  await page.getByTestId('scan-file').setInputFiles({ name: 'qr-pedido.png', mimeType: 'image/png', buffer: png })
  await expect(result(page)).toHaveAttribute('data-status', 'usado')
  await expect(page.getByTestId('code-action')).toHaveCount(0)
  expect((await state(page)).audit.filter((a: any) => a.type === 'code.redeemed')).toHaveLength(1)
  await expect(page.getByTestId('scan-log')).toContainText('Escaneo (imagen)')
  // una imagen sin QR no inventa nada
  await page.getByTestId('scan-file').setInputFiles({ name: 'vacio.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64') })
  await expect(page.getByTestId('scan-msg')).toContainText('No encontramos un QR')
  expect(external).toEqual([])
})

/** Video y4m (YUV 4:2:0) de 640×480 con el QR centrado: lo que "ve" la cámara falsa de Chromium. */
function qrVideo(text: string, frames = 30) {
  const W = 640
  const H = 480
  const m = qrModules(text)
  const { size } = qrPathData(m)
  const k = Math.floor(H / size)
  const off = (n: number, total: number) => Math.floor((n - total * k) / 2)
  const y = Buffer.alloc(W * H, 235)
  const x0 = off(W, size)
  const y0 = off(H, size)
  for (let r = 0; r < m.length; r++) for (let c = 0; c < m.length; c++) {
    if (!m[r][c]) continue
    for (let j = 0; j < k; j++) for (let i = 0; i < k; i++) y[(y0 + (r + 4) * k + j) * W + x0 + (c + 4) * k + i] = 16
  }
  const chroma = Buffer.alloc((W / 2) * (H / 2), 128)
  const frame = Buffer.concat([Buffer.from('FRAME\n'), y, chroma, chroma])
  return Buffer.concat([Buffer.from(`YUV4MPEG2 W${W} H${H} F10:1 Ip A1:1 C420jpeg\n`), ...Array.from({ length: frames }, () => frame)])
}

test('QR-04: la cámara solo se enciende con una acción explícita y lee un QR (dispositivo de video falso de Chromium)', async ({ page }) => {
  test.setTimeout(90_000)
  await fresh(page, '/#/ritual-cafe/codigos')
  const dir = mkdtempSync(join(tmpdir(), 'tf-qr-'))
  const video = join(dir, 'qr.y4m')
  writeFileSync(video, qrVideo(`http://127.0.0.1:4173/#${qrPath('ritual-cafe', 'pedido', 'O-008')}`))
  const candidates = ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome', '/opt/pw-browsers/chromium/chrome-linux/chrome']
  const executablePath = process.env.PW_CHROMIUM ?? candidates.find((p) => existsSync(p))
  const browser = await chromium.launch({ executablePath, args: ['--no-sandbox', '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', `--use-file-for-fake-video-capture=${video}`] })
  try {
    const ctx = await browser.newContext({ baseURL: 'http://127.0.0.1:4173/', permissions: ['camera'], storageState: { cookies: [], origins: [{ origin: 'http://127.0.0.1:4173', localStorage: [{ name: 'tableflow.demo.v1.prefs', value: '{"roleIntroSeen":true}' }] }] } })
    const p = await ctx.newPage()
    let asked = 0
    await p.addInitScript(() => {
      const md = navigator.mediaDevices
      const orig = md.getUserMedia.bind(md)
      ;(window as any).__cam = 0
      md.getUserMedia = (c) => { (window as any).__cam++; return orig(c) }
    })
    await p.goto('/#/admin/codigos')
    await p.evaluate(() => { const t = (window as any).__tableflow; t.dispatch({ type: 'session/setBusiness', businessId: 'ritual-cafe' }); t.dispatch({ type: 'session/setRole', role: 'caja' }) })
    await p.waitForTimeout(500)
    // abrir la pantalla no enciende la cámara
    asked = await p.evaluate(() => (window as any).__cam)
    expect(asked).toBe(0)
    await p.getByTestId('scan-camera').click()
    await expect(p.getByTestId('scan-video')).toBeVisible()
    await expect(result(p)).toHaveAttribute('data-status', 'valido', { timeout: 20_000 })
    await expect(result(p)).toContainText('Pedido O-008')
    await expect(p.getByText('Lectura: cámara')).toBeVisible()
    // al leer, se apaga sola
    await expect(p.getByTestId('scan-video')).toHaveCount(0)
    await expect(p.getByTestId('scan-camera')).toBeVisible()
    expect(await p.evaluate(() => (window as any).__cam)).toBe(1)
  } finally {
    await browser.close()
  }
})

test('QR-03: estados contra el store con escaneo simulado (sin cámara)', async ({ page }) => {
  await fresh(page, '/#/ritual-cafe')
  await asRole(page, 'caja')
  await page.goto('/#/admin/codigos')
  const sim = async (label: RegExp) => {
    const opt = page.getByTestId('sim-select').locator('option').filter({ hasText: label }).first()
    await page.getByTestId('sim-select').selectOption({ label: (await opt.textContent())! })
  }
  await sim(/Pedido O-008 · listo/)
  await expect(result(page)).toHaveAttribute('data-status', 'valido')
  await sim(/Pedido O-011 · enviado/)
  await expect(result(page)).toHaveAttribute('data-status', 'no-elegible')
  await expect(result(page)).toContainText('todavía no fue aceptado')
  await sim(/Pedido O-006 · retirado/)
  await expect(result(page)).toHaveAttribute('data-status', 'usado')
  await sim(/Beneficio .* · disponible/)
  await expect(result(page)).toHaveAttribute('data-status', 'valido')
  await expect(result(page)).toContainText('Se canjea al enviar el pedido')
  await sim(/Mesa C1/)
  await expect(result(page)).toHaveAttribute('data-status', 'valido')
  // el mismo QR de mesa leído en la otra sede
  const mesa = await page.getByTestId('scan-log').locator('li').count()
  expect(mesa).toBeGreaterThan(0)
  await dispatch(page, { type: 'session/setLocation', locationId: 'L-RC-norte' })
  await page.getByTestId('scan-manual').fill('#/ritual-cafe/q/mesa/T-RC-01?s=L-RC-centro')
  await page.getByTestId('scan-submit').click()
  await expect(result(page)).toHaveAttribute('data-status', 'sede-incorrecta')
  await expect(result(page)).toContainText('es de la sede')
  await dispatch(page, { type: 'session/setLocation', locationId: 'L-RC-centro' })
  await sim(/otro negocio/)
  await expect(result(page)).toHaveAttribute('data-status', 'negocio-incorrecto')
  await expect(result(page).locator('.code-facts')).toHaveCount(0) // de otro negocio no se muestra nada
  await sim(/no existe/)
  await expect(result(page)).toHaveAttribute('data-status', 'desconocido')
  // escrito a mano, con el enlace completo y con precios inventados: el store manda
  await page.getByTestId('scan-manual').fill('http://x.test/#/ritual-cafe/q/pedido/O-008?precio=1&estado=retirado')
  await page.getByTestId('scan-submit').click()
  await expect(result(page)).toHaveAttribute('data-status', 'valido')
  await expect(result(page)).toContainText('$ 11.800,00') // el total sale del pedido guardado, no del enlace
  await expect(page.getByText('Lectura: escrita a mano')).toBeVisible()
  // un cliente (aunque mire esta pantalla) ve su código, pero no lo canjea
  await asRole(page, 'cliente-recurrente')
  await expect(result(page)).toBeVisible()
  await expect(page.getByTestId('code-action')).toHaveCount(0)
  const before = (await state(page)).orders.find((o: any) => o.id === 'O-008').status
  await dispatch(page, { type: 'code/redeem', businessId: 'ritual-cafe', locationId: 'L-RC-centro', text: 'O-008', operationId: 'OP-test-cliente' })
  expect((await state(page)).orders.find((o: any) => o.id === 'O-008').status).toBe(before)
})

test('QR-01/05/06: el comercio genera e imprime QR; no llevan personas ni precios; se explica el límite de localStorage', async ({ page }) => {
  await fresh(page, '/#/ritual-cafe')
  await asRole(page, 'encargado')
  await page.goto('/#/admin/codigos')
  await expect(page.getByTestId('limits')).toContainText('no se sincronizan solos')
  await expect(page.getByTestId('limits')).toContainText('No acredita un pago')
  expect(Number((await page.getByTestId('storage-used').textContent())!.replace(/\D/g, ''))).toBeGreaterThan(1000)
  await page.getByTestId('tab-generar').click()
  const urls: string[] = []
  for (const kind of ['negocio', 'sede', 'mesa', 'campana', 'referido']) {
    await page.getByTestId('gen-kind').selectOption(kind)
    await expect(page.getByTestId('gen-preview').getByTestId('qr-url')).toContainText(`/ritual-cafe/q/${kind}/`)
    urls.push((await page.getByTestId('gen-preview').getByTestId('qr-url').textContent())!)
    expect(await page.getByTestId('qr-img').getAttribute('data-payload')).toBe(urls.at(-1))
  }
  const s = await state(page)
  for (const u of urls) {
    for (const c of s.customers) expect(u).not.toMatch(new RegExp(`\\b${c.alias}\\b`, 'i'))
    expect(u).not.toMatch(/precio|total|descuento|\d{6,}/i)
  }
  // lo que se genera se lee y valida (la mesa generada abre su landing)
  await page.getByTestId('gen-kind').selectOption('mesa')
  const mesaUrl = (await page.getByTestId('gen-preview').getByTestId('qr-url').textContent())!
  await page.goto(mesaUrl.slice(mesaUrl.indexOf('#') ))
  await expect(page.getByTestId('code-result')).toHaveAttribute('data-status', 'valido')
  // impresión: solo se imprime la tarjeta elegida
  await page.goto('/#/admin/codigos')
  await page.getByTestId('tab-generar').click()
  await page.evaluate(() => { window.print = () => undefined })
  await page.getByTestId('qr-print').click()
  await expect(page.locator('body[data-print-qr="on"]')).toHaveCount(1)
  await expect(page.locator('.qr-card[data-printing="true"]')).toHaveCount(1)
  await page.emulateMedia({ media: 'print' })
  await expect(page.getByTestId('qr-img')).toBeVisible()
  await expect(page.getByTestId('qr-print')).toBeHidden()
  await expect(page.locator('.page-title h1')).toBeHidden()
  await page.emulateMedia({ media: 'screen' })
})

test('QR-02/03: cliente: Mis códigos solo muestra lo propio; landing de mesa, campaña y referido', async ({ page }) => {
  await fresh(page, '/#/ritual-cafe/codigos')
  // sin identificar: nada personal
  await expect(page.getByText('Los códigos son personales')).toBeVisible()
  await asRole(page, 'cliente-recurrente')
  await expect(page.getByTestId('qr-card-pedido-O-008')).toBeVisible()
  await expect(page.getByTestId('qr-card-beneficio-RC-BRE5')).toBeVisible()
  const s = await state(page)
  const own = s.orders.filter((o: any) => o.customerId === s.session.customerByBusiness['ritual-cafe'] && o.businessId === 'ritual-cafe').map((o: any) => o.id)
  const shown = await page.locator('[data-testid^="qr-card-pedido-"]').evaluateAll((els) => els.map((e) => e.getAttribute('data-testid')!.replace('qr-card-pedido-', '')))
  for (const id of shown) expect(own).toContain(id)
  // un pedido ajeno (por enlace o por código) se ve como desconocido
  const foreign = s.orders.find((o: any) => o.businessId === 'ritual-cafe' && o.customerId !== s.session.customerByBusiness['ritual-cafe'])
  await page.goto(`/#/ritual-cafe/q/pedido/${foreign.id}`)
  await expect(result(page)).toHaveAttribute('data-status', 'desconocido')
  await expect(result(page)).not.toContainText(foreign.alias)
  // campaña: Ana ya tiene su beneficio → duplicado
  const camp = s.campaigns.find((c: any) => c.businessId === 'ritual-cafe' && c.status === 'activa')
  await page.goto(`/#/ritual-cafe/q/campana/${camp.id}`)
  await expect(result(page)).toHaveAttribute('data-status', 'duplicado')
  // mesa: pedir desde esa mesa deja la mesa elegida en Mi pedido
  await page.goto('/#/ritual-cafe/q/mesa/T-RC-02?s=L-RC-centro')
  await expect(result(page)).toHaveAttribute('data-status', 'valido')
  await page.getByTestId('qr-go').click()
  await expect(page).toHaveURL(/ritual-cafe\/carta/)
  await dispatch(page, { type: 'cart/add', businessId: 'ritual-cafe', locationId: 'L-RC-centro', itemId: 'RC-11', qty: 1, selections: {} })
  await page.goto('/#/ritual-cafe/pedido')
  await page.getByText('En mi mesa').click()
  await expect(page.getByTestId('mesa-select')).toHaveValue('T-RC-02')
})

test('QR-03: un código de recomendación lo usa alguien nuevo con solo su nombre (sin contacto en el enlace)', async ({ page }) => {
  await fresh(page, '/#/ritual-cafe/codigos')
  await asRole(page, 'cliente-recurrente')
  const url = (await page.getByTestId('qr-card-referido-RC-FPTA').getByTestId('qr-url').textContent())!
  await expect(page.getByTestId('qr-card-referido-RC-FPTA')).toContainText('Sin tu nombre')
  expect(url).toMatch(/#\/ritual-cafe\/q\/referido\/RC-FPTA$/)
  // la propia persona no puede usarlo
  await page.goto('/#/ritual-cafe/q/referido/RC-FPTA')
  await expect(result(page)).toHaveAttribute('data-status', 'no-elegible')
  // alguien que todavía no es cliente sí
  await asRole(page, 'cliente-invitado')
  await page.goto('/#/ritual-cafe/q/referido/RC-FPTA')
  await expect(result(page)).toHaveAttribute('data-status', 'valido')
  await page.getByTestId('qr-alias').fill('Marina')
  await page.getByTestId('qr-ref-send').click()
  await expect(page.getByRole('alert').filter({ hasText: 'quedaste registrada' })).toBeVisible()
  const s = await state(page)
  expect(s.referrals.filter((r: any) => r.businessId === 'ritual-cafe' && s.customers.find((c: any) => c.id === r.referredId)?.alias === 'Marina')).toHaveLength(1)
})

for (const w of [1280, 390]) {
  test(`QR: accesibilidad y sin desborde horizontal a ${w}px`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: 900 })
    await fresh(page, '/#/ritual-cafe/codigos')
    await asRole(page, 'cliente-recurrente')
    await expect(page.getByTestId('qr-card-pedido-O-008')).toBeVisible()
    let r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
    expect(r.violations.map((v) => `${v.id}: ${v.nodes[0].html.slice(0, 120)}`)).toEqual([])
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    await page.goto('/#/ritual-cafe/q/mesa/T-RC-02')
    await expect(result(page)).toBeVisible()
    r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
    expect(r.violations.map((v) => `${v.id}: ${v.nodes[0].html.slice(0, 120)}`)).toEqual([])
    await asRole(page, 'caja')
    for (const tab of ['validar', 'generar']) {
      await page.goto('/#/admin/codigos')
      await page.getByTestId(`tab-${tab}`).click()
      r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
      expect(r.violations.map((v) => `${v.id}: ${v.nodes[0].html.slice(0, 120)}`), tab).toEqual([])
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), tab).toBe(true)
    }
  })
}
