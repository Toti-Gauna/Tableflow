import { defineConfig } from '@playwright/test'
import { existsSync } from 'node:fs'

// Usa el Chromium ya instalado en el entorno si existe (no se descarga nada).
const candidates = ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome', '/opt/pw-browsers/chromium/chrome-linux/chrome']
const executablePath = process.env.PW_CHROMIUM ?? candidates.find((p) => existsSync(p))

export default defineConfig({
  testDir: 'e2e',
  timeout: 45_000,
  expect: { timeout: 8_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:4173/',
    trace: 'off',
    // P5-L3: el selector de rol de bienvenida ya omitido (se prueba aparte, con almacenamiento vacío)
    storageState: { cookies: [], origins: [{ origin: 'http://127.0.0.1:4173', localStorage: [{ name: 'tableflow.demo.v1.prefs', value: '{"roleIntroSeen":true}' }] }] },
    launchOptions: { executablePath, args: ['--no-sandbox'] },
  },
  projects: [
    { name: 'chromium' },
    // S44: los dos recorridos protagonistas se repiten con movimiento reducido y sin audio (preferencia por defecto)
    { name: 'movimiento-reducido', testMatch: /journeys\.spec\.ts/, use: { reducedMotion: 'reduce' } },
  ],
  webServer: {
    command: 'npx vite preview --port 4173 --strictPort --host 127.0.0.1',
    url: 'http://127.0.0.1:4173/',
    reuseExistingServer: true,
    timeout: 60_000,
  },
})
