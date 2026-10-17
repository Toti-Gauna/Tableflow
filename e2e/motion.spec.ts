import { test, expect } from '@playwright/test'
import { fresh, setRole, state } from './helpers'

// P2-L4: movimiento funcional medido (duraciones, propiedades), movimiento reducido, sonido voluntario y callbacks tardíos.

test('tokens de movimiento dentro de rango y solo transform/opacity en animaciones y transiciones', async ({ page }) => {
  await fresh(page, '/#/mesa-clara/carta')
  const r = await page.evaluate(() => {
    const cs = getComputedStyle(document.documentElement)
    const ms = (v: string) => (/ms\s*$/.test(v.trim()) ? parseFloat(v) : parseFloat(v) * 1000)
    const props = new Set<string>()
    const trans = new Set<string>()
    for (const sheet of [...document.styleSheets]) {
      let rules: CSSRuleList
      try { rules = sheet.cssRules } catch { continue }
      const walk = (list: CSSRuleList) => {
        for (const rule of [...list]) {
          if (rule instanceof CSSKeyframesRule) for (const k of [...rule.cssRules] as CSSKeyframeRule[]) for (const p of [...k.style]) props.add(p)
          else if (rule instanceof CSSStyleRule) { const t = rule.style.transitionProperty; if (t) t.split(',').forEach((x) => trans.add(x.trim())) }
          else if ('cssRules' in rule) walk((rule as CSSGroupingRule).cssRules)
        }
      }
      walk(rules)
    }
    return { cart: ms(cs.getPropertyValue('--dur-cart')), state: ms(cs.getPropertyValue('--dur-state')), scene: ms(cs.getPropertyValue('--dur-scene')), props: [...props], trans: [...trans] }
  })
  expect(r.cart).toBeGreaterThanOrEqual(120)
  expect(r.cart).toBeLessThanOrEqual(180)
  expect(r.state).toBeGreaterThanOrEqual(180)
  expect(r.state).toBeLessThanOrEqual(240)
  expect(r.scene).toBeGreaterThanOrEqual(300)
  expect(r.scene).toBeLessThanOrEqual(450)
  expect(r.props.filter((p) => !['transform', 'opacity'].includes(p))).toEqual([])
  expect(r.trans.filter((p) => !['transform', 'opacity', 'all'].includes(p) && p !== '')).toEqual([])
  expect(r.trans).not.toContain('all')
  // sin scroll suave forzado
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe('auto')
})

test('los totales cambian en el mismo instante (sin animar cifras)', async ({ page }) => {
  await fresh(page, '/#/ritual-cafe/carta')
  await page.getByTestId('open-RC-04').click()
  await page.getByLabel('Mediano').check()
  await page.getByLabel('Entera').check()
  const sub = page.getByTestId('subtotal')
  expect(await sub.textContent()).toBe('$ 6.600,00')
  await page.getByRole('button', { name: 'Más' }).click()
  expect(await sub.textContent()).toBe('$ 13.200,00') // lectura inmediata tras el clic, sin esperas
  expect(await sub.evaluate((el) => getComputedStyle(el).animationName)).toBe('none')
})

test('movimiento reducido: por preferencia del sistema y por el control de la consola, sin desplazamientos', async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: 'reduce' })
  const page = await ctx.newPage()
  await page.goto('/#/ritual-cafe')
  await page.goto('/#/admin/cocina')
  const dur = () => page.locator('.ticket').first().evaluate((el) => parseFloat(getComputedStyle(el).animationDuration))
  expect(await dur()).toBeLessThan(0.01)
  await ctx.close()
  // sin preferencia del sistema, el control de la consola produce el mismo efecto y se recuerda
  const page2 = await browser.newPage()
  await page2.goto('/#/ritual-cafe')
  await page2.goto('/#/admin/cocina')
  const dur2 = () => page2.locator('.ticket').first().evaluate((el) => parseFloat(getComputedStyle(el).animationDuration))
  expect(await dur2()).toBeGreaterThan(0.1)
  await page2.getByRole('button', { name: 'Reducir movimiento' }).click()
  await expect(page2.locator('html')).toHaveAttribute('data-motion', 'reduced')
  expect(await dur2()).toBeLessThan(0.01)
  await page2.goto('/#/admin/salon')
  const chip = page2.locator('.table-chip').first()
  await chip.hover()
  expect(await chip.evaluate((el) => getComputedStyle(el).transform)).toBe('none')
  await page2.reload()
  await expect(page2.locator('html')).toHaveAttribute('data-motion', 'reduced')
  await page2.getByRole('button', { name: 'Reducir movimiento' }).click()
  await expect(page2.locator('html')).not.toHaveAttribute('data-motion', 'reduced')
  await page2.close()
})

test('S33: detener durante el procesamiento cancela el turno; un callback tardío se ignora sin reserva fantasma', async ({ page }) => {
  await fresh(page, '/#/mesa-clara/simulador')
  await page.getByTestId('tab-voz').click()
  await page.getByTestId('call-start').click()
  await expect(page.getByTestId('call-status')).toContainText('turno_cliente')
  await page.getByTestId('opt-reserveA').click()
  const call = (await state(page)).callSessions.at(-1)
  expect(call.status).toBe('procesando')
  await page.getByTestId('call-stop').click()
  // el callback que estaba en vuelo llega tarde con el token viejo
  const late = await page.evaluate((c) => (window as any).__tableflow.dispatch({ type: 'call/respond', callId: c.id, token: c.token }), call)
  expect(late.duplicate).toBe(true)
  await page.waitForTimeout(900)
  const s = await state(page)
  expect(s.reservations).toHaveLength(18)
  expect(s.callSessions.at(-1).status).toBe('finalizada')
  await expect(page.getByTestId('transcript')).not.toContainText('no hay mesa de cuatro a las 20:00')
  // salir de la pantalla en pleno procesamiento también corta el temporizador
  await page.getByTestId('call-start').click()
  await expect(page.getByTestId('call-status')).toContainText('turno_cliente')
  await page.getByTestId('opt-reserveA').click()
  await page.goto('/#/mesa-clara/carta')
  await page.waitForTimeout(900)
  expect((await state(page)).callSessions.at(-1).status).toBe('procesando') // nadie respondió fuera de pantalla
  expect((await state(page)).reservations).toHaveLength(18)
})

test('S34 por la UI: la reserva web sigue por WhatsApp y por llamada con el mismo folio, sin duplicar', async ({ page }) => {
  await fresh(page, '/#/mesa-clara/reservar')
  await page.getByTestId('res-alias').fill('Mora')
  await page.getByTestId('slot-1290').click() // 21:30
  await page.getByTestId('res-submit').click()
  await expect(page).toHaveURL(/reservas\/R-019/)
  await page.getByTestId('continue-wa').click()
  await expect(page.getByTestId('chat-log')).toContainText('Seguimos tu solicitud R-019 por WhatsApp')
  await page.getByTestId('chat-log').getByRole('button', { name: 'Confirmar solicitud' }).last().click()
  await expect(page.getByTestId('chat-log')).toContainText('R-019')
  expect((await state(page)).reservations).toHaveLength(19)
  await page.goto('/#/mesa-clara/reservas/R-019')
  await page.getByTestId('continue-voice').click()
  await expect(page.getByTestId('tab-voz')).toHaveAttribute('aria-selected', 'true')
  const s = await state(page)
  expect(s.reservations).toHaveLength(19)
  expect(s.reservations.filter((r: { alias: string }) => r.alias === 'Mora')).toHaveLength(1)
  expect(s.conversations.filter((c: { reservationIds: string[] }) => c.reservationIds.includes('R-019'))).toHaveLength(1)
})

test('sonido voluntario: activar tras un gesto, volumen recordado, detener, continuar sin audio y limpieza al salir', async ({ page }) => {
  await page.addInitScript(() => {
    ;(window as any).__audio = { created: 0, closed: 0 }
    const Orig = window.AudioContext
    if (Orig) {
      ;(window as any).AudioContext = function (...a: any[]) { (window as any).__audio.created++; return new (Orig as any)(...a) }
      const close = Orig.prototype.close
      Orig.prototype.close = function () { (window as any).__audio.closed++; return close.call(this) }
    }
  })
  await fresh(page, '/#/mesa-clara/simulador')
  await page.getByTestId('tab-voz').click()
  expect((await page.evaluate(() => (window as any).__audio)).created).toBe(0) // sin autoplay
  await page.getByTestId('audio-toggle').check()
  await expect(page.locator('.audio-box legend')).toContainText('activado')
  await page.locator('#vol').fill('0.5')
  await expect(page.locator('label[for="vol"]')).toContainText('50%')
  await page.reload()
  await page.getByTestId('tab-voz').click()
  await expect(page.locator('label[for="vol"]')).toContainText('50%')
  await expect(page.getByTestId('audio-toggle')).toBeChecked()
  await page.getByTestId('call-start').click()
  await page.getByTestId('audio-stop').click()
  await page.getByTestId('audio-off').click()
  await expect(page.getByTestId('audio-toggle')).not.toBeChecked()
  await expect(page.locator('.audio-box legend')).toContainText('silenciado')
  // la llamada sigue entera por transcripción
  await page.getByTestId('opt-reserveA').click()
  await expect(page.getByTestId('transcript')).toContainText('no hay mesa de cuatro a las 20:00', { timeout: 4000 })
  await page.getByTestId('call-stop').click()
  await page.goto('/#/mesa-clara/carta')
  const a = await page.evaluate(() => (window as any).__audio)
  expect(a.closed).toBeGreaterThanOrEqual(a.created > 0 ? 1 : 0) // se libera el contexto de audio
})

test('S44: con movimiento reducido y sin audio, el café llega hasta el retiro con estados instantáneos', async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: 'reduce' })
  const page = await ctx.newPage()
  await fresh(page, '/#/ritual-cafe/carta')
  await page.getByTestId('open-RC-04').click()
  await page.getByLabel('Mediano').check()
  await page.getByLabel('Entera').check()
  await page.getByTestId('add-to-cart').click()
  await page.getByRole('link', { name: /Mi pedido \(1\)/ }).click()
  await page.getByLabel(/Nombre para el retiro/).fill('Bruno')
  await page.getByTestId('pickup-time').fill('10:30')
  await page.getByTestId('send-order').click()
  await expect(page).toHaveURL(/pedido\/O-013/)
  await setRole(page, /Cocina/)
  await page.goto('/#/admin/cocina')
  await page.getByTestId('k-accept-O-013').click()
  await page.getByTestId('k-prepare-O-013').click()
  await page.getByTestId('k-ready-O-013').click()
  await expect(page.getByTestId('ticket-O-013')).toContainText('Esperando retiro')
  expect(await page.getByTestId('ticket-O-013').evaluate((el) => parseFloat(getComputedStyle(el).animationDuration))).toBeLessThan(0.01)
  await page.getByTestId('k-deliver-O-013').click()
  expect((await state(page)).orders.find((o: { id: string }) => o.id === 'O-013').status).toBe('retirado')
  expect(await page.evaluate(() => (window as any).__tableflow.snapshot().prefs.audio)).toBe(false)
  await ctx.close()
})
