# TableFlow · demo frontend local

Demo de gestión gastronómica con dos negocios **ficticios** — **Mesa Clara** (bodegón) y **Ritual Café** (cafetería) — y los 15 módulos M01–M15: carta, configuración y carrito, reservas y espera, salón, pedidos, cocina/barra, caja, administración de carta, stock y recetas, clientes, WhatsApp y llamada simulados, automatizaciones, pasaporte de sabores, catas y reportes/configuración.

**Diseño P2 "carta de casa":** papel cálido, Fraunces editorial y Manrope de interfaz; Mesa Clara como carta impresa de bodegón y Ritual Café como pizarra de barra con vitrina; admin sobrio y KDS oscuro legible a distancia. Ver `docs/tableflow/design-system.md` y `docs/tableflow/motion.md`.

**P3:** 42 ilustraciones SVG propias (una por plato y bebida) y personajes de la casa (Ñoqui, Granito y Tomatito); **invitar a alguien a comer** con tarjeta y mensaje de regalo (simulado) que se canjea en el pedido; temática por época según el reloj simulado; sección **para chicos** con memotest y "Armá tu plato"; barra inferior móvil para cliente y profesional; pantalla de carga y carga diferida por ruta; sonidos de interfaz opcionales (apagados por defecto). Galería en `#/arte`.

**P4:** análisis por fases (`docs/tableflow/p4-analisis.md`) y mejoras de oficio: acabado de grabado en las ilustraciones, ilustraciones firma por negocio, portada/inicio/Reservar/seguimiento/pasaporte reestructurados, guía de la demo en la consola y tablas del equipo con acciones agrupadas y gráficos con eje.

**Solo frontend local.** Sin backend, base remota, IA real, autenticación, SDK de pagos, mensajes, llamadas, micrófono ni integraciones. Los roles muestran vistas, no seguridad. Banner **DEMO** permanente; pagos “DEMO” sin validez fiscal. Todo el contenido es de muestra.

## Probarla
- Online (tras el deploy): `https://toti-gauna.github.io/Tableflow/`
- Local:

```bash
npm ci
npm run dev        # http://localhost:5173
```

El estado se guarda en `localStorage` (`tableflow.demo.v1`). Reloj simulado inicial: **lunes 19/10/2026 10:00** (America/Argentina/Buenos_Aires); solo avanza con los controles de la barra de la demo. “Reiniciar demo” borra únicamente las claves TableFlow.

### Recorrido de 60–90 s (restaurante)
1. Controles de la demo → *Saltar a… → Ir a las 12:00* (el salón abre al mediodía). En pantallas de menos de 1280 px, los controles se abren con el botón *Controles*.
2. Carta → milanesa → guarnición → *Agregar* → *Mi pedido* → elegí mesa → *Enviar pedido* (folio **O-013**).
3. Rol **Recepción** → aceptar · rol **Cocina / barra** → preparar → listo → servido · rol **Caja** → abrir caja → dividir en 3 → cobrar partes → cerrar cuenta.

Café: perfil *Ritual Café* → flat white (tamaño y leche) → retiro por franja → barra acepta, prepara, marca listo y retirado.

Simulador de WhatsApp/llamada: `#/mesa-clara/simulador` (guion: “Mesa para 4 el lunes a las 20” → 21:45 → confirmar → R-019).

Invitar a comer: `#/mesa-clara/regalar` → elegí plato, nombres y mensaje → *Crear invitación* → *Ver como …* → *Abrir la invitación* → (reloj a las 12:00) *Canjear en mi pedido*. Como **Encargado**, `#/admin/regalos` muestra el estado y permite cancelar con motivo. Para chicos: `#/mesa-clara/chicos`.

## Verificación
```bash
npm run typecheck   # tsc --noEmit
npm test            # Vitest: dominio, persistencia, migración, regalos, temporadas, invariantes, contraste (193 pruebas)
npm run build       # tsc + vite build → dist/
npm run e2e         # build + Playwright (70 pruebas, incluye el proyecto "movimiento-reducido"; usa Chromium instalado)
npm run screens     # regenera docs/tableflow/screens/p2, p3 y p4 (CAPTURE=1; P1 queda en screens/p1)
```
No hay lint (no se instaló ESLint). La documentación de fase está en `docs/tableflow/`: `inspection.md`, `architecture.md`, `fixtures.md`, `design-system.md`, `motion.md`, `coverage.md`, `checkpoint.md`, `p3-analisis.md`, `p4-analisis.md`.

## Deploy
`.github/workflows/deploy.yml`: en cada PR a `main` corre typecheck, pruebas y build (más un job E2E informativo); al integrarse a `main` publica `dist/` en GitHub Pages. Requiere **Settings → Pages → Source: GitHub Actions**. La app usa `HashRouter` y `base: './'`, así que funciona bajo la subruta `/Tableflow/`.

## Límites
Demo comercial pre-venta: no acredita integración con Fudo, Maxirest, Woki, Meitre ni con ningún proveedor; Paila·Co es evidencia de política sin reservas, no cliente. Los valores comerciales de `/#/comercial` provienen del tarifario del 16/10/2026 con vigencia pendiente de revalidar.
