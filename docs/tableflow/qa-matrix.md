# QA final de P5 (L10a) · matriz, accesibilidad y rendimiento

Construido el 18/10/2026. **QA-01.** Todo lo que dice "probado" tiene una aserción que existe y pasó en esta construcción; lo que no se pudo probar está en "No verificado" y no se da por bueno.

## Cómo se midió
- **Pruebas unitarias** (Vitest) sobre el dominio; **e2e** (Playwright, Chromium sin interfaz) sobre la app construida con `vite preview`.
- **Accesibilidad automática:** axe-core con las reglas WCAG 2.0/2.1/2.2 A y AA. Detecta lo medible; **no certifica conformidad**.
- **Lighthouse local:** `lighthouse` 13.5.0 instalado fuera del repo (no se agregó como dependencia), contra la app construida y servida en 127.0.0.1, con el Chromium del entorno. Sin servicios externos.

## 1. Matriz de requisitos
Leyenda: **C** construido · **P** probado · — pendiente.

| ID | Requisito | Estado | Evidencia | Observaciones |
|---|---|---|---|---|
| ID-01…05 | Tres direcciones por negocio y elección registrada | C P | `p5-l2-propuestas.md`, `e2e/p5.spec.ts` | Las 15 primeras se rechazaron por genéricas; se rehicieron en L2b (una identidad propia por negocio) y se aprobaron |
| SH-01…05 | Header, selector de rol, dock, modo claro/oscuro, rol y negocio sin mezclar datos | C P | `e2e/p5-l3.spec.ts` | SH-03 se actualizó en L9: ya no hay botón de tráiler (no existe la pieza) |
| FX-01…03 | Correcciones de copy y del contexto del KPI | C P | `e2e/p5-l3.spec.ts` | |
| AR-01…05 | Familia SVG propia por identidad, claro/oscuro, galería | C P | `e2e/p5-l4.spec.ts`, `tests/art.test.ts` | |
| NG-HEL / NG-BAR / NG-FR | Tres negocios nuevos completos | C P | `e2e/p5-l5.spec.ts` (NEG-BR, NEG-CO, NEG-TC, NEG-UI), `tests/l5.test.ts` | |
| NG-CAF-PAGO | Retiro con pago en local: aceptado no es pagado | C P | `e2e/p5-l5.spec.ts` (NEG-02) | |
| MG-01 | Migración explícita y aislamiento por negocio | C P | `tests/l5.test.ts` (migración v2→v3, idempotente), `tests/season-window.test.ts` (v4→v5) | Esquema actual: 5 |
| JG-CAF/RES/HEL/BAR/FR | Cinco juegos infantiles distintos | C P | `e2e/p5-l5.spec.ts` (JG-01…06), `tests/games.test.ts` | |
| GR-A…G, GR-CALC | Historial, campañas, reglas, costos, asistentes, fórmulas | C P | `tests/growth.test.ts`, `tests/assistants.test.ts`, `e2e/p5-l6.spec.ts` | Asistentes deterministas: no hay IA real |
| QR-01…06 | Generación, estados, escaneo opcional, URL sin datos personales, límite de almacenamiento | C P | `tests/qr.test.ts`, `e2e/p5-l7.spec.ts` | Lectura probada con cámara simulada y con foto; no con una cámara física |
| MO-CAF/RES/HEL/BAR/FR | Cinco animaciones transaccionales por evento real | C P | `tests/motion-plan.test.ts`, `e2e/p5-l8.spec.ts` | Rendimiento medido en el contenedor (ver `checkpoint.md`) |
| MO-LOAD | Carga con esqueleto con forma | C P | `e2e/p5-l8.spec.ts` (carga) | |
| TE-01 | Temporadas con inicio, fin y vista previa | C P | `tests/season-window.test.ts`, `e2e/p5-l8.spec.ts` | |
| SC-01…05 | Cinco escenas autoguiadas sobre el store | C P | `tests/scenes.test.ts`, `e2e/p5-l9.spec.ts` | 13 variantes por negocio |
| GU-01 | Guía completa por rol y tarea | C P | `tests/scenes.test.ts`, `e2e/p5-l9.spec.ts` | |
| EC-01 | Cierre Eclipse fullscreen cerrable | C P | `e2e/p5-l9.spec.ts` | Link, tiempos y vigencia: "a confirmar" |
| QA-01 | Matriz de QA | C | este documento | |
| KIT-01…03 | Tráiler, HTML de email, bloqueos de publicación | — | — | L10b y L10c |

La matriz por negocio (qué tiene cada identidad) está en `p5-spec.md`, sección L1.7.

## 2. Accesibilidad automática (axe)
RESULTADO_AXE

## 3. Lighthouse local
RESULTADO_LIGHTHOUSE

## 4. Suite completa
RESULTADO_SUITE

## 5. No verificado y límites
- **Navegadores:** solo Chromium. Safari y Firefox no se probaron.
- **Dispositivos y lectores de pantalla:** no se probó en teléfonos reales ni con lectores de pantalla; el móvil se emula a 390 px. axe y las pruebas de foco y teclado no reemplazan esa revisión.
- **QR con cámara física:** no probado; se usó cámara simulada y subida de foto.
- **Rendimiento:** medido en un contenedor sin GPU, con emulación; los números cambian con el equipo y no equivalen a los de un teléfono real.
- **Eclipse:** el link verificado, los plazos de implementación y la vigencia del tarifario siguen "a confirmar" (no hay fuente en el proyecto).
- **Tráiler:** no existe una pieza reproducible (L10b); por eso no hay botón.
- **"Premium":** no se afirma. La revisión visual crítica con capturas es el trabajo de L10b.
- **Datos:** viven en el navegador (localStorage); dos dispositivos no se sincronizan.
