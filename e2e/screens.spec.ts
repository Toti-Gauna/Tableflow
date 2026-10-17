import { test } from '@playwright/test'
import { fresh, jump, setRole, ensureConsole } from './helpers'

// Genera las capturas citadas en docs/tableflow/checkpoint.md (viewport y estado en el nombre).
// P1 quedó en screens/p1; las "después" (mismo estado, viewport y nombre) van a screens/p2.
const OUT = process.env.OUT ?? 'docs/tableflow/screens/p2'
// espera fuentes y un cuadro de render antes de cada captura (evita fotos a medio pintar)
const settle = async (page: import('@playwright/test').Page) => {
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(150)
}
test('capturas de ambas experiencias y del admin', async ({ page }) => {
  test.skip(!process.env.CAPTURE, 'Solo con CAPTURE=1 (npm run screens)')
  await page.setViewportSize({ width: 1280, height: 900 })
  await fresh(page, '/#/')
  await settle(page); await page.screenshot({ path: `${OUT}/01-landing-1280x900-seed-servicio.png` })
  await page.goto('/#/mesa-clara/carta')
  await settle(page); await page.screenshot({ path: `${OUT}/02-mesa-clara-carta-1280x900-lun19-10h.png` })
  await jump(page, 'Ir a las 12:00 (almuerzo)')
  await page.getByTestId('open-MC-12').click()
  await page.getByLabel('Papas fritas').check()
  await settle(page); await page.screenshot({ path: `${OUT}/03-mesa-clara-detalle-1280x900-lun19-12h.png` })
  await page.keyboard.press('Escape')
  await page.goto('/#/mesa-clara/reservar')
  await settle(page); await page.screenshot({ path: `${OUT}/04-mesa-clara-reservar-1280x900.png` })
  await page.goto('/#/mesa-clara/simulador')
  await page.getByTestId('chat-input').fill('Mesa para 4 el lunes a las 20')
  await page.getByTestId('chat-send').click()
  await settle(page); await page.screenshot({ path: `${OUT}/05-mesa-clara-simulador-1280x900.png` })
  await setRole(page, /Recepción/)
  await settle(page); await page.screenshot({ path: `${OUT}/06-admin-reservas-1280x900.png` })
  await page.goto('/#/admin/salon')
  await settle(page); await page.screenshot({ path: `${OUT}/07-admin-salon-1280x900.png` })
  await setRole(page, /Encargado/)
  await ensureConsole(page)
  await page.getByTestId('biz-select').selectOption('ritual-cafe')
  await page.goto('/#/admin/cocina')
  await settle(page); await page.screenshot({ path: `${OUT}/08-admin-cocina-cafe-1280x900.png` })
  await page.goto('/#/admin/resumen')
  await settle(page); await page.screenshot({ path: `${OUT}/09-admin-resumen-cafe-1280x900.png` })
  await page.goto('/#/admin/caja')
  await settle(page); await page.screenshot({ path: `${OUT}/10-admin-caja-cafe-1280x900.png` })
  await page.goto('/#/admin/automatizaciones')
  await settle(page); await page.screenshot({ path: `${OUT}/11-admin-automatizaciones-1280x900.png` })
  await setRole(page, /invitado/)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/#/ritual-cafe/carta')
  await settle(page); await page.screenshot({ path: `${OUT}/12-ritual-cafe-carta-390x844.png` })
  await page.getByTestId('open-RC-04').click()
  await page.getByLabel('Mediano').check()
  await page.getByLabel('Entera').check()
  await settle(page); await page.screenshot({ path: `${OUT}/13-ritual-cafe-detalle-390x844.png` })
  await page.getByTestId('add-to-cart').click()
  await settle(page); await page.screenshot({ path: `${OUT}/14-ritual-cafe-carrito-fijo-390x844.png` })
  await page.setViewportSize({ width: 320, height: 640 })
  await page.goto('/#/ritual-cafe/pedido')
  await settle(page); await page.screenshot({ path: `${OUT}/15-ritual-cafe-pedido-320x640.png` })
})

test('capturas nuevas de P2 (módulos rediseñados)', async ({ page }) => {
  test.skip(!process.env.CAPTURE, 'Solo con CAPTURE=1 (npm run screens)')
  await page.setViewportSize({ width: 1280, height: 900 })
  await fresh(page, '/#/mesa-clara')
  await settle(page); await page.screenshot({ path: `${OUT}/16-mesa-clara-inicio-1280x900-lun19-10h.png` })
  await page.goto('/#/ritual-cafe')
  await settle(page); await page.screenshot({ path: `${OUT}/17-ritual-cafe-inicio-1280x900-lun19-10h.png` })
  await page.goto('/#/ritual-cafe/carta')
  await settle(page); await page.screenshot({ path: `${OUT}/18-ritual-cafe-carta-pizarra-1280x900.png` })
  await page.goto('/#/ritual-cafe/pedido/O-008')
  await settle(page); await page.screenshot({ path: `${OUT}/19-ritual-cafe-seguimiento-O-008-1280x900.png` })
  await page.goto('/#/ritual-cafe/explorar')
  await page.getByTestId('pcard-PC-metodo').getByRole('button', { name: /Agrega cuerpo/ }).click()
  await page.getByTestId('pcard-PC-origen').getByRole('button', { name: /Florales y de fruta/ }).click()
  await settle(page); await page.screenshot({ path: `${OUT}/20-ritual-cafe-pasaporte-en-curso-1280x900.png` })
  await page.goto('/#/mesa-clara/simulador')
  await page.getByTestId('tab-voz').click()
  await page.getByTestId('call-start').click()
  await page.waitForTimeout(400)
  await settle(page); await page.screenshot({ path: `${OUT}/21-mesa-clara-llamada-simulada-1280x900.png` })
  await page.getByTestId('call-stop').click()
  await setRole(page, /Mozo/)
  await page.getByTestId('table-T-MC-05').click()
  await settle(page); await page.screenshot({ path: `${OUT}/22-admin-salon-plano-mesa-M5-1280x900.png` })
  await page.setViewportSize({ width: 390, height: 844 })
  await setRole(page, /Cocina/)
  await ensureConsole(page)
  await page.getByTestId('biz-select').selectOption('ritual-cafe')
  await page.goto('/#/admin/cocina')
  await settle(page); await page.screenshot({ path: `${OUT}/23-admin-kds-cafe-390x844.png` })
  await setRole(page, /invitado/)
  await page.goto('/#/mesa-clara/reservar')
  await settle(page); await page.screenshot({ path: `${OUT}/24-mesa-clara-reservar-390x844.png` })
  await page.setViewportSize({ width: 640, height: 400 })
  await page.goto('/#/mesa-clara/carta')
  await settle(page); await page.screenshot({ path: `${OUT}/25-mesa-clara-carta-zoom200-640x400.png` })
})

// P3: capturas de ilustraciones, regalos, temporada, sección infantil, barras inferiores y carga.
test('capturas P3', async ({ page }) => {
  test.skip(!process.env.CAPTURE, 'Solo con CAPTURE=1 (npm run screens)')
  const P3 = process.env.OUT3 ?? 'docs/tableflow/screens/p3'
  const shot = async (name: string) => {
    await page.locator('#page-h1').first().waitFor({ state: 'visible', timeout: 5000 }).catch(() => undefined)
    await settle(page)
    await page.screenshot({ path: `${P3}/${name}.png` })
  }
  await page.setViewportSize({ width: 1280, height: 900 })
  await fresh(page, '/#/mesa-clara')
  await page.evaluate(() => window.scrollTo(0, 560)); await shot('01-inicio-temporada-1280x900-dia-de-la-madre')
  await page.goto('/#/mesa-clara/carta'); await page.evaluate(() => window.scrollTo(0, 380)); await shot('02-mesa-clara-carta-ilustrada-1280x900')
  await page.goto('/#/ritual-cafe/carta'); await page.evaluate(() => window.scrollTo(0, 380)); await shot('03-ritual-cafe-pizarra-ilustrada-1280x900')
  await page.goto('/#/arte'); await shot('04-galeria-personajes-1280x900')
  await page.goto('/#/mesa-clara/regalar')
  await page.getByRole('button', { name: /Ver toda la carta/ }).click()
  await page.getByTestId('gift-item-MC-12').click()
  await page.getByTestId('gift-from').fill('Lu'); await page.getByTestId('gift-to').fill('Mamá')
  await page.getByRole('button', { name: /Feliz día, ma/ }).click()
  await page.evaluate(() => window.scrollTo(0, 0)); await shot('05-regalar-formulario-y-tarjeta-1280x900')
  await page.getByTestId('gift-submit').click(); await shot('06-regalo-listo-para-compartir-1280x900')
  await page.getByTestId('gift-view-as').click(); await shot('07-regalo-sobre-cerrado-1280x900')
  await page.getByTestId('gift-open').click(); await shot('08-regalo-tarjeta-abierta-1280x900')
  await jump(page, 'Ir a las 12:00 (almuerzo)')
  await page.getByTestId('gift-redeem').click()
  await page.locator('label', { hasText: 'Papas al horno' }).click(); await shot('09-canje-en-configurador-1280x900')
  await page.goto('/#/mesa-clara/chicos'); await shot('10-para-chicos-1280x900')
  await setRole(page, /Encargado/)
  await page.goto('/#/admin/regalos'); await shot('11-admin-regalos-1280x900')
  await page.goto('/#/admin/configuracion'); await page.locator('#exp-h').scrollIntoViewIfNeeded(); await shot('12-admin-experiencia-temporada-sonidos-1280x900')
  await page.goto('/#/admin/stock'); await page.locator('#movs').scrollIntoViewIfNeeded(); await shot('13-admin-stock-log-legible-1280x900')
  await setRole(page, /invitado/)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/#/ritual-cafe/carta')
  await page.getByTestId('open-RC-11').click(); await page.getByTestId('add-to-cart').click()
  await shot('14-movil-carta-pedido-flotante-y-barra-390x844')
  await page.getByRole('button', { name: 'Secciones' }).click(); await shot('15-movil-hoja-secciones-390x844')
  await page.keyboard.press('Escape')
  await page.goto('/#/ritual-cafe/regalo/no-existe'); await shot('16-movil-regalo-inexistente-personaje-390x844')
  await setRole(page, /Cocina/)
  await page.goto('/#/admin/cocina')
  await shot('17-movil-admin-barra-inferior-390x844')
})

// P4: pantallas reestructuradas (portada, inicio, reservar, seguimiento, pasaporte, reservas y reportes del equipo).
test('capturas P4', async ({ page }) => {
  test.skip(!process.env.CAPTURE, 'Solo con CAPTURE=1 (npm run screens)')
  const P4 = process.env.OUT4 ?? 'docs/tableflow/screens/p4'
  const shot = async (name: string, full = false) => {
    await page.locator('#page-h1').first().waitFor({ state: 'visible', timeout: 5000 }).catch(() => undefined)
    await settle(page)
    await page.screenshot({ path: `${P4}/${name}.png`, fullPage: full })
  }
  await page.setViewportSize({ width: 1440, height: 900 })
  await fresh(page, '/#/')
  await shot('01-portada-1440', true)
  await page.goto('/#/mesa-clara'); await shot('02-inicio-mesa-clara-1440')
  await page.goto('/#/ritual-cafe'); await shot('03-inicio-ritual-cafe-1440')
  await page.goto('/#/mesa-clara/carta'); await page.evaluate(() => window.scrollTo(0, 380)); await shot('04-carta-con-acabado-de-grabado-1440')
  await page.goto('/#/mesa-clara/reservar'); await page.getByTestId('slot-780').click(); await shot('05-reservar-resumen-vivo-1440')
  await page.goto('/#/ritual-cafe/pedido/O-008'); await shot('06-seguimiento-estado-protagonista-1440')
  await ensureConsole(page)
  await page.getByTestId('guide-open').click(); await shot('07-guia-de-la-demo-en-la-consola-1440')
  await page.keyboard.press('Escape')
  await page.goto('/#/arte'); await page.locator('#g-hero').scrollIntoViewIfNeeded(); await shot('08-ilustraciones-firma-1440')
  await setRole(page, /recurrente/)
  await page.goto('/#/ritual-cafe/pasaporte'); await shot('09-pasaporte-libreta-con-sellos-1440')
  await page.goto('/#/mesa-clara'); await page.locator('[data-biz="mesa-clara"]').first().waitFor()
  await setRole(page, /Recepción/)
  await page.goto('/#/admin/reservas'); await page.getByRole('button', { name: 'Otras acciones para R-001' }).click(); await shot('10-admin-reservas-acciones-agrupadas-1440')
  await page.keyboard.press('Escape')
  await ensureConsole(page)
  await page.getByTestId('biz-select').selectOption('ritual-cafe')
  await setRole(page, /Encargado/)
  await page.goto('/#/admin/reportes'); await shot('11-admin-reportes-grafico-con-eje-1440')
  await page.setViewportSize({ width: 390, height: 844 })
  await setRole(page, /invitado/)
  await page.goto('/#/mesa-clara'); await shot('12-movil-inicio-390')
  await page.goto('/#/mesa-clara/reservar'); await shot('13-movil-reservar-390', true)
})

test('capturas P5-L2b (identidades por negocio)', async ({ page }) => {
  test.skip(!process.env.CAPTURE, 'Solo con CAPTURE=1 (npm run screens)')
  test.setTimeout(240_000)
  const OUT = process.env.OUT5 ?? 'docs/tableflow/screens/p5-l2'
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/#/propuestas'); await settle(page)
  await page.screenshot({ path: `${OUT}/00-indice-1440.png`, fullPage: true })
  for (const b of ['cafe', 'hela', 'resto', 'bar', 'rapida']) {
    for (const modo of ['claro', 'oscuro']) {
      await page.goto(`/#/propuestas/${b}?modo=${modo}`); await settle(page)
      await page.locator('.pzx-fig').screenshot({ path: `${OUT}/${b}-publica-${modo}.png` })
    }
    await page.goto(`/#/propuestas/${b}`); await settle(page)
    await page.locator('.pzx-phone').screenshot({ path: `${OUT}/${b}-movil.png` })
    await page.locator('.pzx-two .pzx-frame').first().screenshot({ path: `${OUT}/${b}-comercio.png` })
    await page.locator('.pzx-motion').screenshot({ path: `${OUT}/${b}-confirmacion.png` })
  }
})

test.describe('capturas P5-L3', () => {
  test.use({ storageState: { cookies: [], origins: [] } })
  test('tema, identidad, dock y bienvenida', async ({ page }) => {
    test.skip(!process.env.CAPTURE, 'Solo con CAPTURE=1 (npm run screens)')
    test.setTimeout(240_000)
    const OUT = process.env.OUT6 ?? 'docs/tableflow/screens/p5-l3'
    const shot = async (name: string) => { await settle(page); await page.screenshot({ path: `${OUT}/${name}.png` }) }
    await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'light' })
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/#/'); await page.getByTestId('role-intro').waitFor(); await shot('00-bienvenida-por-rol-1440')
    await page.getByTestId('role-intro-skip').click()
    for (const mode of ['light', 'dark'] as const) {
      await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: mode })
      const m = mode === 'light' ? 'claro' : 'oscuro'
      await page.setViewportSize({ width: 1440, height: 900 })
      await page.goto('/#/'); await shot(`01-portada-${m}-1440`)
      for (const b of ['mesa-clara', 'ritual-cafe']) {
        await page.goto(`/#/${b}`); await shot(`02-${b}-inicio-${m}-1440`)
        await page.goto(`/#/${b}/carta`); await page.evaluate(() => window.scrollTo(0, 300)); await shot(`03-${b}-carta-${m}-1440`)
      }
      await setRole(page, /Encargado/)
      await page.goto('/#/admin/resumen'); await shot(`04-admin-resumen-${m}-1440`)
      await page.goto('/#/admin/cocina'); await shot(`05-admin-cocina-${m}-1440`)
      await setRole(page, /invitado/)
      await page.setViewportSize({ width: 390, height: 844 })
      for (const b of ['mesa-clara', 'ritual-cafe']) {
        await page.goto(`/#/${b}`); await shot(`06-${b}-inicio-${m}-390`)
      }
    }
    await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'dark' })
    await page.goto('/#/ritual-cafe/carta'); await ensureConsole(page); await shot('07-dock-abierto-movil-oscuro-390')
    await page.keyboard.press('Escape')
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/#/mesa-clara'); await ensureConsole(page); await shot('08-dock-abierto-oscuro-1440')
    await page.getByTestId('trailer-open').click(); await shot('09-trailer-estado-honesto-1440')
  })
})

test('capturas P5-L4 (arte por identidad)', async ({ page }) => {
  test.skip(!process.env.CAPTURE, 'Solo con CAPTURE=1 (npm run screens)')
  test.setTimeout(300_000)
  const OUT = process.env.OUT7 ?? 'docs/tableflow/screens/p5-l4'
  const ids = ['cafe', 'resto', 'hela', 'bar', 'rapida']
  await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'light' })
  await page.setViewportSize({ width: 1440, height: 900 })
  await fresh(page, '/#/arte'); await settle(page)
  await page.screenshot({ path: `${OUT}/00-galeria-indice-1440.png` })
  for (const [i, id] of ids.entries()) {
    await page.goto(`/#/arte/${id}`); await settle(page)
    await page.locator('#gx-sample').locator('..').screenshot({ path: `${OUT}/${i + 1}${id}-a-muestra-tamano-real.png` })
    await page.locator('#gx-carta').locator('..').screenshot({ path: `${OUT}/${i + 1}${id}-b-carta.png` })
    await page.locator('#gx-juego').locator('..').screenshot({ path: `${OUT}/${i + 1}${id}-c-juego.png` })
    await page.locator('.gx-mocks').screenshot({ path: `${OUT}/${i + 1}${id}-d-mockups-claro.png` })
  }
  await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'dark' })
  for (const [i, id] of ids.entries()) {
    await page.goto(`/#/arte/${id}`); await settle(page)
    await page.locator('#gx-carta').locator('..').screenshot({ path: `${OUT}/${i + 1}${id}-e-carta-oscuro.png` })
    await page.locator('.gx-mocks').screenshot({ path: `${OUT}/${i + 1}${id}-f-mockups-oscuro.png` })
  }
  for (const mode of ['light', 'dark'] as const) {
    await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: mode })
    const m = mode === 'light' ? 'claro' : 'oscuro'
    await page.setViewportSize({ width: 1440, height: 900 })
    for (const b of ['mesa-clara', 'ritual-cafe']) {
      await page.goto(`/#/${b}`); await settle(page); await page.screenshot({ path: `${OUT}/6-${b}-inicio-escena-${m}-1440.png` })
      await page.goto(`/#/${b}/carta`); await settle(page); await page.evaluate(() => window.scrollTo(0, 360)); await page.screenshot({ path: `${OUT}/7-${b}-carta-${m}-1440.png` })
    }
    await page.setViewportSize({ width: 390, height: 844 })
    for (const b of ['mesa-clara', 'ritual-cafe']) {
      await page.goto(`/#/${b}/carta`); await settle(page); await page.evaluate(() => window.scrollTo(0, 420)); await page.screenshot({ path: `${OUT}/8-${b}-carta-${m}-390.png` })
    }
  }
})

test('capturas P5-L5 (cinco negocios, pago en el local y juegos)', async ({ page }) => {
  test.skip(!process.env.CAPTURE, 'Solo con CAPTURE=1 (npm run screens)')
  test.setTimeout(300_000)
  const OUT = process.env.OUT8 ?? 'docs/tableflow/screens/p5-l5'
  const nuevos = ['copo', 'compas', 'brasa']
  await fresh(page, '/')
  for (const mode of ['light', 'dark'] as const) {
    const m = mode === 'light' ? 'claro' : 'oscuro'
    await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: mode })
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/#/'); await settle(page); await page.evaluate(() => window.scrollTo(0, 380)); await page.screenshot({ path: `${OUT}/0-portada-cinco-negocios-${m}-1440.png` })
    for (const b of nuevos) {
      await page.goto(`/#/${b}`); await settle(page); await page.screenshot({ path: `${OUT}/1-${b}-inicio-${m}-1440.png` })
      await page.goto(`/#/${b}/carta`); await settle(page); await page.screenshot({ path: `${OUT}/2-${b}-carta-${m}-1440.png` })
    }
    await page.setViewportSize({ width: 390, height: 844 })
    for (const b of nuevos) { await page.goto(`/#/${b}`); await settle(page); await page.screenshot({ path: `${OUT}/3-${b}-inicio-${m}-390.png` }) }
  }
  await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'light' })
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/#/copo/carta/CO-02'); await settle(page)
  await page.getByLabel('Frutilla a la crema').check(); await page.getByLabel('Dulce de leche granizado').check()
  await page.getByRole('dialog').screenshot({ path: `${OUT}/4-copo-gustos-cupo-y-agotado.png` })
  await page.goto('/#/compas/catas'); await settle(page); await page.screenshot({ path: `${OUT}/4-compas-agenda.png` })
  await page.goto('/#/brasa/numeros'); await settle(page); await page.screenshot({ path: `${OUT}/4-brasa-numeros.png` })
  await page.goto('/#/brasa'); await settle(page)
  await page.goto('/#/admin/cocina'); await settle(page); await page.screenshot({ path: `${OUT}/5-brasa-cocina-estaciones-pago-pendiente.png` })
  await page.goto('/#/admin/pedidos/O-BR-002'); await settle(page); await page.screenshot({ path: `${OUT}/5-brasa-pedido-pago-pendiente.png` })
  const games: [string, string][] = [['ritual-cafe', 'memoria'], ['mesa-clara', 'mesa'], ['copo', 'helado'], ['brasa', 'hamburguesa'], ['compas', 'donde']]
  for (const [i, [b, g]] of games.entries()) {
    await page.goto(`/#/${b}/chicos`); await settle(page)
    await page.getByTestId(`game-${g}`).screenshot({ path: `${OUT}/6${i}-${g}-a-inicio.png` })
    await page.getByTestId(`${g}-start`).click(); await settle(page)
    await page.getByTestId(`game-${g}`).screenshot({ path: `${OUT}/6${i}-${g}-b-jugando.png` })
  }
})

test('capturas P5-L6 (fidelización, campañas, costos y asistentes)', async ({ page }) => {
  test.skip(!process.env.CAPTURE, 'Solo con CAPTURE=1 (npm run screens)')
  test.setTimeout(300_000)
  const OUT = process.env.OUT9 ?? 'docs/tableflow/screens/p5-l6'
  const role = (r: string) => page.evaluate((x) => (window as any).__tableflow.dispatch({ type: 'session/setRole', role: x }), r)
  await fresh(page, '/#/mesa-clara')
  for (const mode of ['light', 'dark'] as const) {
    const m = mode === 'light' ? 'claro' : 'oscuro'
    await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: mode })
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/#/mesa-clara'); await role('encargado')
    await page.goto('/#/admin/campanas'); await settle(page); await page.screenshot({ path: `${OUT}/1-campanas-listado-${m}.png` })
    await page.goto('/#/admin/campanas/CMP-002'); await settle(page); await page.screenshot({ path: `${OUT}/2-campana-proyeccion-simulacion-${m}.png`, fullPage: true })
    await page.goto('/#/admin/campanas?vista=calendario'); await settle(page); await page.screenshot({ path: `${OUT}/3-calendario-mes-${m}.png` })
    await page.goto('/#/admin/costos'); await settle(page); await page.screenshot({ path: `${OUT}/4-costos-${m}.png` })
  }
  await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'light' })
  await page.goto('/#/copo'); await role('encargado')
  await page.goto('/#/admin/campanas/CMP-CO-001'); await settle(page); await page.screenshot({ path: `${OUT}/5-copo-borrador-nd.png` })
  await page.goto('/#/compas'); await role('encargado')
  await page.goto('/#/admin/costos'); await settle(page); await page.screenshot({ path: `${OUT}/5-compas-costos-nd.png` })
  await page.goto('/#/mesa-clara'); await role('encargado')
  await page.goto('/#/admin/asistente'); await settle(page)
  for (const q of ['Armá una campaña para clientes a reactivar', '$ 3.000', 'con la milanesa de ternera', 'costo fijo 15.000', 'presupuesto 90.000']) {
    await page.getByTestId('biz-assist-input').fill(q); await page.getByTestId('biz-assist-send').click(); await page.waitForTimeout(200)
  }
  await settle(page); await page.screenshot({ path: `${OUT}/6-asistente-comercio.png`, fullPage: true })
  await page.goto('/#/admin/clientes/CL-001'); await settle(page); await page.screenshot({ path: `${OUT}/7-cliente-historial.png` })
  await page.goto('/#/ritual-cafe'); await role('cliente-recurrente')
  await page.goto('/#/ritual-cafe/beneficios'); await settle(page); await page.screenshot({ path: `${OUT}/8-mis-beneficios.png` })
  await page.goto('/#/ritual-cafe/carta/RC-15'); await page.getByLabel('Entera').check(); await page.getByTestId('add-to-cart').click()
  await page.goto('/#/ritual-cafe/pedido'); await page.locator('[data-testid^="pick-RC-"]').first().click(); await settle(page); await page.screenshot({ path: `${OUT}/9-beneficio-en-el-pedido.png` })
  await page.goto('/#/ritual-cafe/asistente'); await settle(page)
  for (const q of ['¿Tengo beneficios?', '¿Qué pidió Lucía?']) { await page.getByTestId('client-assist-input').fill(q); await page.getByTestId('client-assist-send').click(); await page.waitForTimeout(200) }
  await settle(page); await page.screenshot({ path: `${OUT}/10-asistente-cliente.png` })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/#/copo/beneficios'); await settle(page); await page.screenshot({ path: `${OUT}/11-copo-beneficios-sellos-390.png`, fullPage: true })
})
