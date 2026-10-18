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
**Alcance.** `e2e/p5-l10a.spec.ts` recorre, para cada una de las cinco identidades, las 15 rutas del cliente y las 17 secciones de administración (con el rol de encargado, que las ve todas), más las 5 pantallas compartidas (portada, comercial, escenas, guía y arte). Son 165 pantallas por combinación, en **cuatro combinaciones** de tema y ancho: claro y oscuro, a 1280 y a 390 px. Total: **660 análisis**. En CI corre una diagonal (claro 1280 y oscuro 390); con `A11Y_FULL=1`, las cuatro.

**Criterio.** Reglas WCAG 2.0, 2.1 y 2.2, niveles A y AA. Falla la prueba ante cualquier violación seria o crítica. Las moderadas y menores se adjuntan como anotación de la prueba; **no se revisaron una por una**.

**Primera corrida: 16 de 20 combinaciones fallaban.** Tres causas, las tres reales:

| Hallazgo | Dónde | Causa | Arreglo |
|---|---|---|---|
| Pestaña que apunta a un panel que no existe (`aria-valid-attr-value`) | Ayuda de Copo, Compás y Brasa | Sin hilos de conversación no se dibuja el panel, pero las pestañas seguían apuntando a él | `aria-controls` apunta solo al panel que existe |
| Contraste del horario (`color-contrast`, razón entre 1,01 y 1,3) | Catas de Ritual Café y Mesa Clara, a 390 px | `.ev-date` estaba definida dos veces: la del recuadro de fecha del inicio pisaba la de las catas, con fondo de marca, un recuadro de 72 px y el "24" partido en dos líneas | Las reglas del inicio se acotan a `.event-card`. La tarjeta del inicio quedó idéntica píxel por píxel |
| Región desplazable sin acceso por teclado (`scrollable-region-focusable`) | Tabla de `/comercial`, a 390 px | El contenedor de la tabla no recibía foco | Pasa a ser una región con nombre, alcanzable con teclado |

**Resultado final: 20 de 20 combinaciones pasan** sin violaciones serias ni críticas.

**Qué no cubre:** rutas con parámetro (detalle de pedido y de reserva, ítem de carta, regalo, `/q`), diálogos abiertos y estados intermedios. Algunos tienen su propia prueba de axe (escenas con el reproductor abierto en `p5-l9`, cierre Eclipse, estados de L8); el resto no.

## 3. Lighthouse local
**Método.** Lighthouse 13.5.0 contra la app construida y servida en 127.0.0.1, con el Chromium del entorno y el perfil con la bienvenida ya omitida. Móvil es la emulación por defecto de Lighthouse (CPU 4× más lenta y red 4G simulada); escritorio, el preset de escritorio. Una medición por pantalla, sin mediana; el contenedor no tiene GPU, así que los números **no equivalen a los de un teléfono real**.

**Resultado final (build de L10a):**

| Pantalla | Rend. | Accesib. | Buenas prácticas | SEO | FCP | LCP | TBT | CLS |
|---|---|---|---|---|---|---|---|---|
| Portada · escritorio | 100 | 100 | 100 | 54 | 0,3 s | 0,3 s | 0 ms | 0,005 |
| Portada · móvil | **51** | 100 | 100 | 54 | 2,5 s | 2,5 s | 1.940 ms | **0,297** |
| Mesa Clara inicio · escritorio | 100 | 100 | 100 | 54 | 0,3 s | 0,4 s | 0 ms | 0,001 |
| Mesa Clara inicio · móvil | 96 | 100 | 100 | 54 | 1,1 s | 2,0 s | 190 ms | 0 |
| Mesa Clara carta · escritorio | 100 | 100 | 100 | 54 | 0,3 s | 0,3 s | 0 ms | 0,002 |
| Mesa Clara carta · móvil | 99 | 100 | 100 | 54 | 1,1 s | 1,1 s | 120 ms | 0,007 |
| Brasa carta · escritorio | 100 | 100 | 100 | 54 | 0,3 s | 0,4 s | 0 ms | 0,007 |
| Brasa carta · móvil | 98 | 100 | 100 | 54 | 1,1 s | 1,1 s | 160 ms | 0,005 |
| Administración resumen · escritorio | 100 | 100 | 100 | 54 | 0,3 s | 0,3 s | 0 ms | 0,001 |
| Administración resumen · móvil | 100 | 100 | 100 | 54 | 1,1 s | 1,3 s | 0 ms | 0 |
| Escenas · escritorio | 100 | 100 | 100 | 54 | 0,3 s | 0,3 s | 0 ms | 0 |
| Escenas · móvil | 100 | 100 | 100 | 54 | 1,1 s | 1,4 s | 0 ms | 0 |
| Guía · escritorio | 100 | 100 | 100 | 54 | 0,3 s | 0,3 s | 0 ms | 0 |
| Guía · móvil | 100 | 100 | 100 | 54 | 1,1 s | 1,4 s | 30 ms | 0 |

**Qué encontró y se arregló** (antes → después, medido con el mismo método):

| Hallazgo | Antes | Después |
|---|---|---|
| El pie de página saltaba cuando llegaba el contenido de una pantalla de carga diferida (CLS) | Escenas y guía móvil 0,256; administración móvil 0,23; escenas y guía escritorio 0,199 | 0 en todas; rendimiento de 87–91 a 100 |
| Administración sin un `main` (`landmark-one-main`) | falla | pasa |
| Nombre accesible sin el texto visible, WCAG 2.5.3 (botón del dock y logo del negocio) | falla en 10 de 14 | pasa; accesibilidad 100 en las 14 |

Arreglo del pie: mientras haya un cargador en pantalla, el contenedor reserva el alto de la ventana (`#contenido:has(.route-loader)`), así el pie arranca debajo del pliegue y no salta; apenas llega el contenido, la reserva desaparece.

**Qué queda abierto (no se arregló en este lote):**
- **Portada en móvil.** Es la única pantalla floja. En la medición final dio 51 y en la primera 33, siempre como **primera carga del navegador** (en frío). Repetida con el navegador ya abierto dio 79, 93 y 81. Dos causas:
  1. *Tiempo de bloqueo:* el JS inicial (~833 kB) tarda ~2 s en evaluarse con la CPU emulada 4× más lenta. La portada, el inicio y la carta del cliente se descargan junto con ese paquete; el resto de las pantallas móviles, con el mismo paquete pero ya caliente, tienen 0–190 ms.
  2. *Cambio de diseño (CLS 0,297, intermitente):* al cargar las tipografías web (Fraunces, Archivo, Fredoka) el texto de la portada se reacomoda y empuja la sección "Probalo sin la consola". En una de tres repeticiones dio 0,07.
  - **Propuesta, para consultar:** dividir el paquete inicial (portada, inicio y carta del cliente pasan a carga diferida) y declarar tipografías de reserva con métricas equivalentes, o precargarlas. Toca la estructura de carga de toda la app y las tipografías de las cinco identidades, por eso no se hizo dentro de un lote de QA.
- **SEO 54 en todas las pantallas: por diseño.** `index.html` declara `noindex` (es una demo con datos ficticios que no debe indexarse) y no hay `robots.txt`. Lighthouse lo marca como "no rastreable"; no es un defecto.
- Buenas prácticas: 100 en las 14.

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
