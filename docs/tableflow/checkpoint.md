# Checkpoint P4 · TableFlow — análisis por fases y mejora de SVGs, estructura y UX/UI

> Pedido del operador: menos "relleno genérico", más oficio en ilustraciones, estructura por página y UX/UI. Diagnóstico y resultado por fase en `p4-analisis.md`.

## Identificación
- Fecha real: 17/10/2026. Reloj simulado sin cambios (lun 19/10/2026 10:00 ART). Rama `claude/tableflow-demo` (PR #2). Commits P4: `c29acbb` (A/B), `6fa3474` (C/D) y el commit que contiene este archivo (E/F).
- `schemaVersion`: 2 (sin cambios en P4: todo es presentación). Sin cambios de dominio.

## Comandos y resultados (corrida final de P4)
| Comando | Exit | Resultado |
|---|---|---|
| `npm run typecheck` | 0 | sin errores |
| `npm test` | 0 | 12 archivos, 193 pruebas OK |
| `npm run build` | 0 | OK |
| `npx playwright test` | 0 | 70 OK (63 previas + 5 de `p4.spec.ts` + 2 de `movimiento-reducido`), 4 omitidas (capturas) |
| `CAPTURE=1 npx playwright test e2e/screens.spec.ts -g "capturas P4"` | 0 | 13 capturas en `screens/p4/` |

## Defectos encontrados y corregidos en P4
`.filters` sin `display:flex` (los filtros se apilaban a ancho completo); hora y folio partidos en Reservas ("12:3 / 0"); botón "Quitar" partido en la lista de espera; el aviso fallido del pedido se mostraba como mensaje del producto; la ilustración del personaje se ensuciaba con el acabado de tinta (se excluye); dos textos del seguimiento con el mismo código confundían a la prueba (se unificaron en un párrafo).

## Siguiente acción exacta
Revisión del PR #2 por el operador (capturas `p1`→`p2`→`p3`→`p4`). Merge y deploy a Pages: decisión del equipo.

---

# Checkpoint P3 · TableFlow — ilustración propia, regalos, temporadas, sección infantil y plataforma (P3-A…F)

> Checkpoint de trabajo de P3, no un cierre de demo. Lo que sigue es lo construido y medido en esta construcción. A continuación se encara P4 (auditoría por fases pedida por el operador: SVGs, estructura por página y UX/UI).

## Identificación
- Fecha real: 17/10/2026. Reloj simulado: lunes 19/10/2026 10:00 ART (sin cambios).
- Rama `claude/tableflow-demo` (PR #2 a `main`, abierto). Commits P3: `5d54b6d` (A/B), `a9f43c2` (C/D en curso) y el commit que contiene este archivo.
- `schemaVersion`: **2** con migración explícita desde 1 (agrega `gifts` y `settings.seasonByBusiness`; ningún registro existente cambia). Persistencia `tableflow.demo.v1` (+ `.prefs`, que suma `uiSounds` y `kdsChime`, apagados por defecto).
- Modelo/versión/esfuerzo: registrados en la conversación (no se versionan identificadores de modelo en el repo).

## Especificado → construido → probado → pendiente
| | |
|---|---|
| **Construido** | A: análisis completo (`p3-analisis.md`). B: kit de ilustración y 42 SVG propios (uno por ítem), personajes Ñoqui/Granito/Tomatito con 7 expresiones, integrados en carta, pizarra, vitrina, configurador, inicio, pedido, vacíos y 404; galería `#/arte`. C: pantalla de carga sin JS, carga diferida por ruta con cargador de marca, barra inferior cliente/admin con hoja de secciones, sonidos de interfaz opcionales, motor de temporadas con override. D: invitar a comer (crear, compartir, mensaje simulado, sobre, abrir, canjear con extras, cubrir en pedido/caja, cancelar con motivo, vencer) y sección Regalos. E: sección para chicos (menú, memotest sin temporizadores, "Armá tu plato"), aviso sonoro opcional del KDS y pendientes de P2 del lado profesional. |
| **Probado** | 193 Vitest (12 archivos; nuevos `gifts`, `season`, migración) y 65 Playwright (+3 omitidas de capturas): 63 en `chromium` (55 previas + 8 de `p3.spec.ts`) y 2 en `movimiento-reducido`. axe sin violaciones serias/críticas en 25 pantallas. |
| **Pendiente / no ejecutado** | lector de pantalla real, dispositivos físicos, revisión con usuarios (incluidos chicos), varias pestañas reales; auditoría P4. |

## Comandos y resultados (cwd `/home/user/tableflow`, corrida final de P3)
| Comando | Exit | Resultado |
|---|---|---|
| `npm run typecheck` | 0 | sin errores |
| `npm test` | 0 | 12 archivos, 193 pruebas OK |
| `npm run build` | 0 | bundle inicial JS 307 KB / 93 KB gzip (antes 676 KB sin dividir) + 30 fragmentos por ruta; CSS 108 KB / 25 KB gzip |
| `npx playwright test` | 0 | 65 OK, 3 omitidas (capturas, solo con `CAPTURE=1`) |
| `CAPTURE=1 npx playwright test e2e/screens.spec.ts -g "capturas P3"` | 0 | 17 capturas en `screens/p3/` |

## Escenarios
- **Nuevos (P3):** invitación de punta a punta, cancelación con motivo, vencimiento, temporada automática/forzada, memotest con teclado, barra inferior móvil, carga diferida con foco, sonidos apagados por defecto, migración v1 → v2. **Regresión:** S01–S46 y AU01–AU10 en la misma corrida.
- **Defectos encontrados y corregidos en P3:** consola partida en dos filas a 1280 px al sumar el botón de sonidos; el aviso de regalo del configurador se partía en columnas; IDs de prueba duplicados entre tabla y tarjetas móviles de Regalos; contraste insuficiente en etiquetas de temporada, chips infantiles y el acento de la tarjeta; dos esperas de pruebas que suponían tiempos (hoja del configurador, perfil antes del KDS) y fallaban con la carga diferida.

## Decisiones (reversibles)
- El regalo cubre el **precio base** del plato al regalar; los extras los paga quien canjea. Una invitación = una unidad, en su propia línea; se libera si el pedido se rechaza o cancela antes de preparar.
- Sin teléfonos ni correos en regalos (se rechazan): la demo no envía nada. El "WhatsApp simulado" crea un hilo sin cliente ni contacto.
- Personajes quietos en pantallas de tarea; movimiento solo en celebraciones y con modo reducido apagado.
- El menú para chicos usa platos existentes (S01 sigue en 42 ítems); la media porción se coordina con el equipo, sin precios inventados.

## Bloqueos con impacto
Ninguno. Pendiente del operador fuera del repo: borrar la rama `claude/tableflow-demo` de `DentalOS`.

## Siguiente acción exacta
P4 por fases (pedido del operador): auditoría de SVGs, estructura por página y UX/UI con capturas, luego mejoras por fase, QA y actualización del PR #2.

---

# Checkpoint P2 · TableFlow — diseño premium "carta de casa" (lotes P2-L1…L4)

> Checkpoint de trabajo de P2, **no** un cierre de demo ni una declaración de "premium listo": lo que sigue es lo construido y lo medido en esta construcción. El cierre en Notion corresponde a P4.

## Identificación
- Fecha real: 17/10/2026. Reloj simulado de la demo: lunes 19/10/2026 10:00 ART (sin cambios).
- Repo `Toti-Gauna/Tableflow` · rama `claude/tableflow-demo`, reiniciada desde `main` = `cb30249` (merge del PR #1 de P1). Commits P2: `5addee5` L1 · `054b0dc` L2 · `afa1747` L2 pruebas · `28f1a21` L3 · `8164173` L4 · más el commit de documentación que contiene este archivo (HEAD). Diff P2 sobre `cb30249`: ~60 archivos, +3.1k/−0.8k líneas antes de docs. Cambios ajenos: ninguno.
- `fixtureId`: `servicio` / `vacio` (sin cambios) · `schemaVersion`: 1 (el estado no cambió de forma; solo se agregó el campo opcional `source` al comando `cart/add`) · persistencia `tableflow.demo.v1` (+ `.prefs`).
- Modelo/versión/esfuerzo: registrados en la conversación (no se versionan identificadores de modelo en el repo).

## Especificado → construido → probado → pendiente
| | |
|---|---|
| **Construido** | L1: crítica con capturas, tokens por marca, Fraunces con ejes, glifos propios, muestra carta + configurador + KDS criticada y corregida (11 correcciones, ver `design-system.md` §1). L2: sistema extendido a los 15 módulos, consola, admin y responsive (plano/lista con mismas acciones, KDS ≥ 18 px sin arrastre, caja con partes/saldo/centavo, estados diferenciados, política sin reservas). L3: pasaporte con estados visibles, revalidación y uso de la selección, sellos solo por personal, insignia a la quinta, reversión y pausa. L4: movimiento por tokens (transform/opacity), reducido por sistema/consola, sonido con todos los controles y limpieza, callbacks tardíos. |
| **Probado** | 182 Vitest (contraste: 61 pares) y 57 Playwright: 55 en `chromium` (35 de P1 + 9 `design` + 4 `passport` + 7 `motion`) y los 2 recorridos protagonistas repetidos en el proyecto `movimiento-reducido`. Detalle por S en `coverage.md`. |
| **Pendiente / no ejecutado** | lector de pantalla real, dispositivos físicos, revisión con usuarios, recorrido KDS solo teclado grabado, varias pestañas reales, división del bundle. |

## Comandos y resultados (cwd `/home/user/tableflow`, corrida final de P2)
| Comando | Exit | Resultado |
|---|---|---|
| `npm run typecheck` | 0 | sin errores |
| `npm test` | 0 | 10 archivos, 182 pruebas OK |
| `npm run build` | 0 | `dist/` 1,4 MB en disco (JS 676 KB / 195 KB gzip sin dividir; CSS 82 KB / 19 KB gzip; fuentes: se descarga solo el subconjunto latino por `unicode-range`, ~312 KB entre Fraunces redonda+itálica y Manrope) |
| `npx playwright test` | 0 | 57 OK, 2 omitidas (capturas, solo con `CAPTURE=1`) |
| `CAPTURE=1 npx playwright test e2e/screens.spec.ts --project chromium` | 0 | 25 capturas en `screens/p2/` |

Lint: **ausente** (sin cambios respecto de P1).

## Escenarios
- **Pasaron (E2E P2 nuevos o ampliados):** S03, S09, S31, S33, S34, S37, S38, S39, S40, S41, S43, S44 · **regresión pasada:** S01–S46 según `coverage.md`, incluidos S06, S11–S13, S19, S23–S25, S35. AU01–AU10: dominio sin cambios, todo verde.
- **Fallaron:** ninguno en la corrida final. Durante el trabajo, las pruebas y la revisión de capturas encontraron cinco defectos reales, corregidos: foco con teclado tapado por el carrito fijo (S43), 1 px de desborde de la hoja inferior, una carrera en la que el título de página robaba el foco si la persona elegía algo en los primeros 30 ms, la SPA conservaba la posición de scroll de la pantalla anterior, y a 320 px el importe de una línea del ticket se partía y se cortaba (ahora cubierto por S43).
- **No ejecutados:** ver "Pendiente".

## Capturas antes/después (mismo estado, viewport y nombre)
`screens/p1/01…15` (antes) ↔ `screens/p2/01…15` (después): landing 1280, carta MC 10:00, detalle 12:00, reservar, simulador, admin reservas/salón/cocina café/resumen/caja/automatizaciones, Ritual Café 390 (carta, detalle, carrito fijo) y pedido 320. Nuevas P2: `16` inicio MC · `17` inicio RC · `18` pizarra RC · `19` seguimiento O-008 · `20` pasaporte en curso · `21` llamada simulada · `22` salón plano con M5 · `23` KDS café 390 · `24` reservar 390 · `25` carta a zoom 200 % (640×400). Revisadas visualmente en esta fase: todas las de carta, configurador, KDS, salón, caja, inicio, reservas, seguimiento y pasaporte a 1440/1280/768/390/320.

## Decisiones (reversibles)
- Consola en una fila desde 1280 px; plegable por debajo (medido: a 1180 px se partía en dos filas).
- Precios de carta sin ",00" (como una carta impresa); totales, tickets y caja con formato completo.
- La métrica "uso" del pasaporte cuenta solo lo agregado desde "Pedir mi selección" (antes contaba cualquier alta del mismo plato).
- Sellos: rechazo explícito si los intenta acreditar un rol cliente (`solo-personal`), además del criterio diario conservador de P1.
- Revisión humana con tono violeta propio, distinto de "solicitada" (ámbar).
- Fuentes con ejes completos servidas desde el build (sin CDN), a cambio de peso de descarga.

## Bloqueos con impacto
Ninguno para P2. Pendiente del operador fuera de este repo: borrar la rama `claude/tableflow-demo` de `DentalOS` (el proxy de la sesión cortó el borrado).

## Pase a P3
- **Build / HEAD:** rama `claude/tableflow-demo` sobre `cb30249`; HEAD = commit de docs de P2. `npm ci && npm run build` → `dist/` (HashRouter, `base: './'`, sirve bajo `/Tableflow/`).
- **Esquema / fixture:** `schemaVersion` 1, seed `servicio` y `vacio` deterministas; reloj inicial lun 19/10/2026 10:00 ART.
- **Comandos:** `npm run typecheck` · `npm test` · `npm run build` · `npx playwright test` (incluye `movimiento-reducido`) · `npm run screens` (escribe en `screens/p2`; `OUT=` para otra carpeta).
- **Defectos y deudas conocidas:** bundle JS sin dividir (aviso > 500 KB); el aviso visual efímero (eco de la región viva, 3,2 s, sin puntero) puede tapar unos segundos el borde inferior en móvil; salir de la llamada en pleno procesamiento deja el turno pendiente hasta volver (no responde fuera de pantalla); ilustraciones de platos esquemáticas (placeholder deliberado, sin fotos); sin prueba con lector de pantalla ni dispositivos físicos; clases CSS heredadas de P1 aún presentes (`.timeline`, `.floor`).

## Siguiente acción exacta
1. Operador: revisar el PR de `claude/tableflow-demo` → `main` (capturas p1/p2 lado a lado) y, si se aprueba, mergear para publicar en Pages.
2. P3: prueba con lector de pantalla y teléfono real sobre los dos recorridos; dividir el bundle.

## Texto consolidado listo para registrar en Notion (sin acceso a Notion en esta fase)
“P2 TableFlow: sistema visual "carta de casa" aplicado a los 15 módulos (Mesa Clara: carta impresa; Ritual Café: pizarra de barra y vitrina; admin sobrio; KDS oscuro ≥ 18 px), pasaporte y sellos funcionales con revalidación, movimiento por tokens con modo reducido y sonido voluntario con controles completos. 182 pruebas de dominio y 57 E2E pasan (incluye 320/390/768, zoom 200 %, foco no tapado, recorridos con movimiento reducido); contraste de 61 pares medido. No certifica accesibilidad: pendiente lector de pantalla y dispositivos reales. Sin backend ni envíos reales; roles son vistas. Cierre formal: P4.”

---

# Checkpoint P1 · TableFlow — scaffold y funcionalidad FE (lotes L1–L6)

> Checkpoint de trabajo, **no** un cierre de demo ni prueba de producción. El cierre en Notion corresponde una sola vez al completar P4: no aplica todavía (ver “Texto consolidado listo para registrar”).

## Identificación
- Fecha de trabajo: 16/10/2026 (real). Reloj simulado de la demo: lunes 19/10/2026 10:00 ART (no se mezclan).
- Repo: `Toti-Gauna/Tableflow` (vacío al iniciar; `main` = commit inicial con README) · rama de trabajo `claude/tableflow-demo` con un único commit de la demo. Cambios ajenos: ninguno. (Primer intento erróneo en `DentalOS`, PR #3 obsoleto.)
- `fixtureId`: `servicio` (por defecto) y `vacio` · `schemaVersion`: 1 · persistencia `tableflow.demo.v1`.
- Modelo/versión/esfuerzo: registrados en la conversación de la sesión (el entorno no permite versionar identificadores de modelo en el repo). No se afirma que el prompt los haya seleccionado.

## Especificado → construido → probado → pendiente
| | |
|---|---|
| **Construido** | L1 shell, rutas, selector de rol/perfil/sede, banner DEMO, tokens, seed v1 (servicio/vacío), validación, persistencia con recuperación · L2 carta → detalle/modificadores → carrito → envío → folio en recepción · L3 reservas/espera/salón · L4 operación (aceptar→preparar→listo→servido/retirado), stock, caja · L5 clientes, chat determinista, llamada simulada, AU01–AU10 · L6 catas, pasaporte, sellos, reportes, configuración, diagnóstico, matriz de cobertura. |
| **Probado** | 144 pruebas Vitest (dominio, persistencia, invariantes, contraste) y 35 Playwright (dos recorridos completos, S01–S46 por UI donde se indica en `coverage.md`, red, móvil 320/390, reduced motion, axe). Detalle en `coverage.md`. |
| **Pendiente / no ejecutado** | zoom 200 %, lector de pantalla real, foco oculto por el carrito en móvil (solo se midió el desborde horizontal), repetir todos los recorridos con reduced motion, varias pestañas reales, CI de GitHub para E2E, lint (ausente), revalidar tarifario en la fuente, modo prospecto, fotos reales. |

## Comandos y resultados (cwd `/home/user/tableflow`)
| Comando | Exit | Resultado |
|---|---|---|
| `npm ci`/`npm i` (deps) | 0 | 0 vulnerabilidades reportadas |
| `npm run typecheck` | 0 | sin errores |
| `npm test` | 0 | 10 archivos, 144 pruebas OK |
| `npm run build` | 0 | `dist/` 828 KB (JS 636 KB sin dividir; aviso de chunk > 500 KB) |
| `npx playwright test` | 0 | 35 OK, 1 omitida (capturas, solo con `CAPTURE=1`) |
| subruta `/Tableflow/` servida con `python3 -m http.server` | 0 | sin 4xx, fuentes locales cargadas (verificación manual con script de Playwright) |

Lint: **ausente** (declarado, no simulado).

## Archivos relevantes
`src/domain/*` (dominio), `src/domain/fixtures/*`, `src/store.ts`, `src/pages/client/*`, `src/pages/admin/*`, `src/pages/coverage.ts`, `tests/*`, `e2e/*`, `docs/tableflow/*`, `.github/workflows/deploy.yml`, `vite.config.ts`, `playwright.config.ts`.

## Capturas (`docs/tableflow/screens/`, generadas con `npm run screens`)
`01` landing 1280×900 · `02` Mesa Clara carta 1280×900 (lun 19 10:00) · `03` detalle de milanesa 1280×900 (12:00) · `04` reservar · `05` simulador (chat) · `06` admin reservas · `07` admin salón · `08` admin cocina (Ritual Café, reloj 12:00 tras saltar) · `09` resumen · `10` caja · `11` automatizaciones · `12`–`14` Ritual Café móvil 390×844 (carta, detalle, carrito fijo) · `15` pedido 320×640. Revisadas visualmente: carta, caja, cocina y detalle móvil.

## Decisiones y supuestos (reversibles)
Ver `inspection.md`: destino = repo existente; base Vite/React/HashRouter; Ritual Café sin reservas por defecto; con el reloj inicial las mesas del restaurante piden avanzar a las 12:00; excepción de cierre con saldo solo por rol “encargado” (regla didáctica); criterio conservador de sellos: **un sello por persona y fecha en todo el negocio** (la unicidad cliente+fecha+sede se registra y se respeta, y se evita el acopio entre sedes); consentimiento de servicio por defecto verdadero para clientes creados desde un chat/web (supuesto de demo); combinar mesas solo con la regla de muestra (M1+M2, M3+M4).

## Bloqueos con impacto
- El repo estaba vacío, sin workflow de deploy ni Pages verificable: se agregó `deploy.yml`; falta que el operador confirme **Pages → Source: GitHub Actions**.

## Estimación humana por lote (tras inspección; es una estimación, no un compromiso)
Tiempo de agente en background no incluido ni prometido. Horas humanas equivalentes para construir y probar a este nivel: L1 ≈ 10 h · L2 ≈ 10 h · L3 ≈ 14 h · L4 ≈ 16 h · L5 ≈ 18 h · L6 ≈ 12 h · documentación y E2E transversal ≈ 10 h. Sin fechas prometidas.

## Pase a P2 (Sales/UX/branding)
- Rutas reales: ver `coverage.md`. Esquema/seed: `fixtures.md`. Versión: `schemaVersion` 1, seed `seed-v1`.
- Defectos/deudas conocidas: bundle sin dividir; accesibilidad solo automatizada; los íconos de estado son caracteres Unicode; no hay fotos (placeholders); el KDS no tiene arrastre (acciones por botón, accesibles por teclado); S43/S44 parciales.
- Capturas de ambas experiencias y del admin: carpeta `screens/`.

## Siguiente acción exacta
1. Operador: habilitar Pages (Source: GitHub Actions) y mergear el PR de `claude/tableflow-demo` a `main`; verificar `https://toti-gauna.github.io/Tableflow/`.
2. P2-L2: revisar copy/UX con las capturas y repetir S43/S44 completos con dispositivos reales.
3. Validar el job E2E de CI y, si pasa, volverlo bloqueante.

## Texto consolidado listo para registrar en Notion (sin acceso a Notion en esta fase)
“P1 TableFlow: demo frontend local construida (15 módulos, 2 perfiles ficticios, 46 escenarios S y 10 automatizaciones AU cubiertos según matriz). 144 pruebas de dominio/persistencia/invariantes y 35 E2E pasan; typecheck y build OK. Pendiente: accesibilidad manual, zoom 200 %, CI E2E, tarifario por revalidar. Sin backend, sin envíos reales; roles son vistas. Cierre formal de demo en Notion: al completar P4.”
