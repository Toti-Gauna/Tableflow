# Checkpoint P5-L9 · TableFlow: escenas autoguiadas, guía completa y cierre Eclipse

> L8 (PR #10) está en `main`. El SDD, las variantes, los cambios y los límites están en `p5-spec.md` (sección L9).

## Identificación
- Fecha real: 18/10/2026. Rama `claude/tableflow-p5-l9`, creada desde `main` (`fe1fb77`).
- **Esquema:** sigue en **5**. El progreso de la guía y el rechazo del cierre van en las preferencias del navegador.
- **Dependencias nuevas:** ninguna.

## Qué se hizo
- **Motor de escenas** (`domain/scenes.ts`, puro): cinco guiones armados con comandos reales del store, con 13 variantes según lo que tiene cada negocio.
  - WhatsApp → pedido → recepción del comercio.
  - Llamada → reserva. En Compás, un grupo de 16 pasa a revisión humana.
  - QR de mesa.
  - Retiro con pago en el local.
  - Campaña → reactivación → canje.
  - Cada paso corre sus comandos una sola vez y se comprueba contra el estado.
- **Reproductor:** un teléfono en overlay, no modal, con la app visible detrás y sin oscurecer.
  - Brief de 5 a 10 s por paso, con pausa, siguiente, repetir, velocidad y salir. Escape también sale.
  - El foco va al título al empezar; los cambios de paso se anuncian en una región viva.
  - En móvil, el teléfono pasa a una vista compacta y la botonera queda fija a la vista.
  - Salir restaura negocio, rol y pantalla.
- **Guía completa:** 13 tareas por rol y módulo (las de reservas solo donde hay reservas).
  - Cada tarea explica por qué importa en ese negocio.
  - Se marca hecha solo por un evento real de la auditoría.
  - Se puede practicar, omitir, pausar, retomar y rechazar; la ayuda contextual acompaña mientras se practica.
- **Cierre Eclipse:** pantalla completa y cerrable, con las condiciones del tarifario aprobado del 16/10/2026.
  - Se abre por botón o una sola vez al terminar la guía.
  - Nunca se abre solo en pedido, regalo o reserva, ni después de cerrarlo.
  - Tiempos, link de Eclipse y vigencia dicen "a confirmar".
- **Tráiler honesto:** no hay una pieza reproducible, así que no hay botón; un texto lo dice y ofrece las escenas.
- **Portada:** sección "Probalo sin la consola", con escenas, guía y "Adaptarlo a mi negocio".

## Pruebas
- **Nuevas:**
  - `tests/scenes.test.ts` (19): mapa de variantes, briefs de 5 a 10 s, las 13 escenas completas, idempotencia, tareas de la guía y `taskDone`.
  - `e2e/p5-l9.spec.ts` (8): SC-01 de punta a punta, las 13 variantes, teclado con movimiento reducido, GU-01, dos de EC-01 (por botón y al terminar la guía, sin interrumpir un pedido ni insistir) y axe a 1280 y 390 px.
- **Actualizadas, con el motivo anotado:** `p5-l3.spec.ts` (SH-03). Ya no hay botón de tráiler; se verifica el estado honesto y el acceso a las escenas.
- No se quitó ningún test.
- **Hallazgos de las pruebas:**
  - Un clic rápido en la guía podía pisar una tarea recién hecha. Ahora todo se escribe sobre el progreso más reciente.
  - El cierre tenía contraste insuficiente en "Cerrar".
  - En móvil, el teléfono era ilegible y la botonera quedaba fuera de la vista.

## Comandos y resultados
| Comando | Exit | Resultado |
|---|---|---|
| `npx tsc --noEmit` | 0 | sin errores |
| `npx vitest run` | 0 | 23 archivos, 971 pruebas (19 nuevas) |
| `npm run build` | 0 | OK. JS inicial ~833 kB (L8: ~830 kB). Escenas, guía, reproductor y cierre van en chunks diferidos; montados siempre sumaban ~75 kB |
| `npx playwright test` | 0 | 130 pasadas (122 + 8 de L9), 12 omitidas (capturas, solo con CAPTURE=1) |
| `CAPTURE=1 npx playwright test e2e/screens.spec.ts -g "P5-L9"` | 0 | 13 capturas en `screens/p5-l9/`: 1,16 MB |

## Siguiente tarea exacta
PR de L9 a `main`, seguimiento hasta verde y espera del ok de Ignacio. Después, **L10**: QA, pulido y kit comercial (matriz, Lighthouse, revisión visual, storyboard y render del tráiler, plantillas de email), sin enviar ni publicar nada.

---

# Checkpoint P5-L8 · TableFlow: motion graphics, animaciones transaccionales y temporadas

> L7 (PR #9) está en `main`. La coreografía está en `motion.md` (sección P5-L8); el SDD, los cambios y los límites, en `p5-spec.md` (sección L8).

## Identificación
- Fecha real: 18/10/2026. Rama `claude/tableflow-p5-l8`, creada desde `main` (`8a67d9a`).
- **Esquema:** 4 → **5**, con el migrador `MIGRATIONS[4]`. Solo agrega `settings.seasonWindowByBusiness`, en null.
- **Dependencias nuevas:** ninguna.

## Qué se hizo
- **Coreografía primero:** para cada pieza se definieron propósito, disparador, estados, duración, curva, interrupción, movimiento reducido y respaldo.
- **Plan puro** (`motion-plan.ts`): arma la composición desde el pedido real.
  - Café: las medialunas y tazas del pedido, con dorado y vapor (el cold brew no humea).
  - Heladería: los gustos elegidos, en orden, sobre su formato.
  - Restaurante: plato con cubiertos; en las reservas, la mesa para N personas.
  - Bar: tapas y bebida sin alcohol.
  - Rápida: los ingredientes reales, sin lo que se sacó y con el cheddar extra.
  - El alcohol nunca se dibuja; sin pieza propia se usa el glifo de su categoría.
- **Pieza** (`OrderMoment`):
  - se reproduce una sola vez por pestaña cuando el pedido pasa a aceptado;
  - "Omitir" y Escape van al cierre; "Ver de nuevo" no toca el store;
  - con movimiento reducido se monta directo el cierre;
  - el sonido es opcional.
- **Momentos diferenciados:** esqueletos con la forma de la carta, del seguimiento o del tablero; "Enviado (simulado)"; aceptación; preparación y listo (ya existían).
- **Temporadas:**
  - automática, o manual con inicio y fin (fuera del rango rige la automática);
  - vista previa sin activar;
  - escena propia por identidad, con movimiento ambiental de dos ciclos;
  - acento de temporada en el juego infantil;
  - no crean promociones y no tocan el modo claro u oscuro.

## Pruebas
- **Nuevas:**
  - `tests/motion-plan.test.ts` (13);
  - `tests/season-window.test.ts` (6): fechas, validación, duplicado, sin promociones y migración v4 → v5;
  - `e2e/p5-l8.spec.ts` (15): las cinco piezas, alcohol, interrupción, doble clic, error, navegación a mitad, sonido, movimiento reducido por sistema y por consola, rendimiento, reserva, temporadas, carga y axe a 1280 y 390 px.
- **Actualizadas, con el motivo anotado:**
  - versión de esquema 4 → 5 en persistencia, L5, growth y la migración e2e de P3;
  - `p3.spec.ts`: la temporada forzada ahora se elige en modo manual y se guarda con un botón.
- No se quitó ningún test.
- **Hallazgo de las pruebas:** el vino de Mesa Clara no tenía la etiqueta `+18` y se iba a animar. Ahora se reconoce también por su descripción.

## Rendimiento medido (e2e, Chromium headless)
- MO-FR completa: 2,8 s, **60 cuadros/s**, **ninguna tarea larga** (> 50 ms).
- Cero animaciones vivas y cero piezas activas al terminar, al omitir y al salir de la pantalla.

## Comandos y resultados
| Comando | Exit | Resultado |
|---|---|---|
| `npx tsc --noEmit` | 0 | sin errores |
| `npx vitest run` | 0 | 22 archivos, 952 pruebas (19 nuevas) |
| `npm run build` | 0 | OK. JS inicial ~830 kB (L7: ~820 kB). La pieza transaccional (22 kB + 5 kB de CSS) va en un chunk diferido |
| `npx playwright test` | 0 | 122 pasadas (107 + 15 de L8), 11 omitidas (capturas, solo con CAPTURE=1). Una corrida anterior tuvo 1 fallo en `p3.spec.ts` (temporada): usaba el selector viejo; se adaptó al modo manual y la corrida completa limpia pasó entera |
| `CAPTURE=1 npx playwright test e2e/screens.spec.ts -g "P5-L8"` | 0 | 18 capturas y 5 clips WebM reales (con su cuadro de mitad de pieza) en `screens/p5-l8/`: 1,7 MB |

## Siguiente tarea exacta
PR de L8 a `main`, seguimiento hasta verde y espera del ok de Ignacio. Después, **L9**: escenas autoguiadas, guía completa y cierre Eclipse.

---

# Checkpoint P5-L7 · TableFlow: QR, códigos y continuidad cliente–comercio

> L6 (PR #8) está en `main`. Especificación SDD, qué lleva un QR, verificación de lectura y límites: `p5-spec.md`, sección "L7".

## Identificación
- Fecha real: 17/10/2026. Rama `claude/tableflow-p5-l7`, creada desde `main` (`d935b62`).
- **Esquema:** sin cambios (4). Los escaneos y canjes van a la auditoría existente.
- **Dependencias nuevas (locales, sin servicios):** `qrcode-generator` 2.0.4 (generar) y `jsqr` 1.4.0 (leer, en un chunk diferido de 130 kB que solo baja al leer un QR).

## Qué se hizo
- **Generar:** QR y enlace de negocio, sede, mesa, campaña y referido, con vista previa e impresión (solo se imprime la tarjeta elegida).
- **Cliente:** "Mis códigos" con el QR de sus pedidos, reservas y beneficios disponibles y su código de recomendación; el mismo QR a un toque en el seguimiento del pedido, la reserva y cada beneficio.
- **Comercio:** sección "Códigos" para validar (cámara, foto del QR, a mano o simulado sin cámara) y canjear: entrega el pedido o registra la llegada de la reserva, una sola vez. Historial de lecturas y canjes.
- **Estados:** válido, desconocido, vencido, cancelado, usado, duplicado, negocio incorrecto, sede incorrecta, cupo agotado, no elegible y revertido, todos leídos del store.
- **Landing del QR** (`#/<negocio>/q/<tipo>/<ref>`): mesa ("Pedir desde esta mesa" la deja elegida en Mi pedido), sede, campaña (reclamar el beneficio), referido (con solo un nombre), y pedido, reserva, beneficio e invitación solo para su dueño.
- **Privacidad y límites:** la URL no lleva personas, precios ni secretos; un código no acredita pago. Un panel explica que dos dispositivos no se sincronizan solos (localStorage) y mide cuánto ocupa la demo.

## Verificación de lectura (qué se comprobó y qué no)
- **Comprobado:** el QR generado se decodifica con `jsqr` en los tests (módulos) y en el navegador (foto del QR subida al lector, validada contra el store y canjeada una vez).
- **Comprobado con dispositivo falso:** la cámara en Chromium con un archivo de video que muestra el QR: no se pide la cámara al abrir la pantalla, se enciende con el botón, lee y se apaga sola.
- **No verificado:** cámara física o teléfono real. Eso queda declarado como límite.

## Pruebas
- **Nuevas:**
  - `tests/qr.test.ts` (23): lectura real del QR, URL sin datos, estados, canje idempotente (doble operación y re-escaneo), reserva de hoy, reclamo de campaña con cupo y duplicado, referidos y privacidad entre clientes.
  - `e2e/p5-l7.spec.ts` (8): lectura desde imagen y canje, cámara con dispositivo falso, estados simulados, generar e imprimir, Mis códigos y landings, referido, axe en 1280 y 390 px.
- **Actualizadas:** ninguna. No se quitó ningún test.
- Un hallazgo de las pruebas: en la semilla de Ritual Café todos los clientes que aceptan promociones ya tienen su beneficio, así que el camino feliz de "reclamar" se probó con una clienta nueva agregada en el test.

## Comandos y resultados
| Comando | Exit | Resultado |
|---|---|---|
| `npx tsc --noEmit` | 0 | sin errores |
| `npx vitest run` | 0 | 20 archivos, 933 pruebas (23 nuevas) |
| `npm run build` | 0 | OK. JS inicial ~820 kB (L6: ~804 kB, +16 kB del dominio de códigos). Códigos (13 kB y 6 kB) y la tarjeta de QR (24 kB) van en chunks diferidos; `jsqr` (130 kB) solo al leer |
| `npx playwright test` | 0 | 107 pasadas (99 + 8 de L7), 10 omitidas (capturas, solo con CAPTURE=1) |
| `CAPTURE=1 npx playwright test e2e/screens.spec.ts -g "P5-L7"` | 0 | 12 capturas en `screens/p5-l7/`, cuantizadas: 1,0 MB |

## Siguiente tarea exacta
PR de L7 a `main`, seguimiento hasta verde y espera del ok de Ignacio. Después, **L8**: motion graphics, animaciones transaccionales y temporadas (Opus·high para la coreografía y Sonnet·medium para implementarla).

---

# Checkpoint P5-L6 · TableFlow: fidelización, campañas, costos y asistentes

> L5 (PR #7) está en `main`. Especificación SDD, fórmulas, cambios en lo existente y límites: `p5-spec.md`, sección "L6".

## Identificación
- Fecha real: 17/10/2026. Rama `claude/tableflow-p5-l6`, creada desde `main` (`ee48bd1`).
- **Esquema:** detectado 3 → **4**, con el migrador explícito `MIGRATIONS[3]`. Solo agrega; un costo ya cargado no se pisa.

## Qué se hizo
- **A · Clientes:**
  - recencia, frecuencia y gasto en 90 días, afinidad, beneficios, sellos (Copo y Brasa), referidos y segmentos;
  - historial sintético previo a la demo, rotulado.
- **B · Campañas:**
  - alcance individual, por segmento o masiva; disparo manual, programado o por evento (primer pedido, referido);
  - ciclo completo: borrador, aprobada, activa o programada, pausada, finalizada y cancelada;
  - envíos simulados por cliente, con los omitidos y su motivo;
  - calendario semanal, mensual, bimestral, por estación y por festividad.
- **C · Reglas:** consentimiento, vencimiento, mínimo, topes por pedido y por cliente, cupo, presupuesto, no acumulación, canje en el pedido y reversión al rechazar, cancelar o editar.
- **D · Costos:**
  - por ítem, variante, extra y combo; lo no cargado queda en ND y deja la campaña en borrador;
  - proyección, simulación y resultado observado en paneles separados.
- **E · Asistente del comercio:** determinista; consulta datos reales, pide lo que falta, explica supuestos y crea borradores que aprueba el encargado.
- **F · Asistente del cliente:** carta, horarios, sus pedidos y sus beneficios; rechaza datos ajenos.
- **G · Conversación:** escritura breve e interrumpible, rotulada como simulada.

## Pruebas
- **Nuevas:**
  - `tests/growth.test.ts` (29): fórmulas del manual, costos con ND, historial y segmentos, ciclo de campaña, reglas, reversión, disparadores, resultados, calendario y migración v3 → v4.
  - `tests/assistants.test.ts` (13).
  - `e2e/p5-l6.spec.ts` (6): ciclo completo con ND → aprobación → canje → resultado → cancelación, sin red externa; calendario; asistentes (incluido "Detener"); canje y reversión de Ana; axe en claro y oscuro, a 1280 y 390 px.
- **Actualizadas, con el motivo anotado:** la versión de esquema (3 → 4) en persistencia, L5 y la migración e2e de P3.
- No se quitó ningún test.

## Comandos y resultados
| Comando | Exit | Resultado |
|---|---|---|
| `npx tsc --noEmit` | 0 | sin errores |
| `npx vitest run` | 0 | 19 archivos, 910 pruebas |
| `npm run build` | 0 | OK. JS inicial ~804 kB (L5: 763 kB): el dominio de campañas va con el store. Campañas (28 kB), asistente (16 kB), costos, beneficios y asistente del cliente van en chunks diferidos |
| `npx playwright test` | 0 | 99 pasadas (93 + 6 de L6), 9 omitidas (capturas, solo con CAPTURE=1). Una corrida anterior tuvo 1 fallo en `motion.spec.ts:52` ("locator.hover: Test ended") mientras se recompilaba `dist` en paralelo; ese archivo pasó 2 veces seguidas (7/7) y la corrida completa limpia pasó entera |
| `CAPTURE=1 npx playwright test e2e/screens.spec.ts -g "P5-L6"` | 0 | 16 capturas en `screens/p5-l6/`, cuantizadas: 1,4 MB |

## Siguiente tarea exacta
PR de L6 a `main`, seguimiento hasta verde y espera del ok de Ignacio. Después, **L7**: QR y códigos.

---

# Checkpoint P5-L5 · TableFlow: cinco negocios completos, pago en el local y cinco juegos

> L3 (PR #5) y L4 (PR #6) están en `main`, con CI verde (run 39064515482). Especificación SDD, cambios en lo existente y límites: `p5-spec.md`, sección "L5".

## Identificación
- Fecha real: 17/10/2026. Rama `claude/tableflow-p5-l5`, creada desde `main` (`c66c6bd`).
- **Esquema:** la versión detectada al entrar era 2. Sube a **3** con el migrador explícito `MIGRATIONS[2]` (v2 → v3). Solo agrega registros por id y es idempotente; `migrate()` encadena desde cualquier versión guardada.

## Qué se hizo
- **Dominio:**
  - `domain/business.ts` define los cinco negocios (`BIZ_IDS`, prefijos y la regex de rutas).
  - `fixtures/nuevos.ts` arma Copo, Taberna Compás y Brasa Rápida con sedes, franjas, carta, modificadores, insumos, recetas y agenda.
  - Ritual suma cuatro clásicos. La semilla agrega actividad en curso para los tres negocios nuevos.
- **Numeración por negocio:** los negocios nuevos usan prefijo propio (`O-BR-001`, `R-TC-001`, `P-BR-001`…). Los folios de Mesa Clara y Ritual Café no cambian.
- **Pago en el local:** `orderPayment` deriva pendiente o pagado del saldo de caja. Se ve en:
  - el seguimiento del cliente;
  - el detalle del pedido en el comercio, con «Cobrar en caja», que abre la cuenta;
  - la comanda.
- **UI de los cinco negocios:**
  - tokens claro/oscuro y tipografías propias;
  - inicio propio con la ilustración firma de L2b: vitrina de bachas, agenda de música o tablero de números;
  - portada con cinco tapas;
  - secciones según el tipo de negocio;
  - estaciones de cocina tomadas de la carta;
  - pantalla de números de retiro;
  - casos y guía del dock;
  - regalos sin alcohol, bloqueados también en el dominio.
- **Juegos:**
  - un juego distinto por negocio, todos dentro del mismo `GameFrame`: inicio, instrucciones, nivel, progreso, pausa, éxito, reintento y salida;
  - lógica pura en `domain/games.ts`;
  - teclado y táctil, sin tiempo, "Sin animaciones" además de la preferencia del sistema.

## Pruebas
- **Nuevas:**
  - `tests/l5.test.ts` (18): negocios, folios, pago en el local, reglas por negocio, aislamiento, migración v2 → v3 idempotente y alcohol.
  - `tests/games.test.ts` (9): los cinco juegos y que sus piezas existan.
  - `e2e/p5-l5.spec.ts` (7): los cinco juegos jugados hasta ganar dos niveles, con pausa (botón y Escape), reintento y salida. También cubre:
    - café con medialuna, aceptado pero con pago pendiente hasta la caja;
    - combo de Brasa hasta "listo" en la pantalla de números, sin que aparezca en los otros cuatro negocios;
    - vitrina y cupo de gustos de Copo;
    - agenda de Compás;
    - axe en claro y oscuro, a 1280 y 390 px.
- **Actualizadas, con el motivo anotado en cada una:**
  - conteos globales de la semilla (más reservas, pedidos y pagos por la actividad de los negocios nuevos), en unitarios y e2e;
  - la migración v1, que ahora llega a la v3;
  - el memotest de P3, reemplazado por la memoria de Ritual Café;
  - la cobertura de arte, que ahora abarca los cinco negocios;
  - el contraste, extendido a las tres identidades nuevas.
- No se quitó ningún test.

## Comandos y resultados
| Comando | Exit | Resultado |
|---|---|---|
| `npx tsc --noEmit` | 0 | sin errores |
| `npx vitest run` | 0 | 17 archivos, 868 pruebas |
| `npm run build` | 0 | OK. JS inicial 763 kB (main: 728 kB): suman los datos de los tres negocios. El inicio de los negocios nuevos (7 kB) y los juegos (30 kB) van en chunks diferidos |
| `npx playwright test` | 0 | 93 pasadas (86 + 7 de L5), 8 omitidas (capturas, solo con CAPTURE=1) |
| `CAPTURE=1 npx playwright test e2e/screens.spec.ts -g "P5-L5"` | 0 | 35 capturas en `screens/p5-l5/`, cuantizadas a 256 colores: 2,9 MB |

## Siguiente tarea exacta
PR de L5 a `main`, seguimiento hasta verde y espera del ok de Ignacio. Después, **L6**: growth y asistentes, incluida la fidelización de los tres negocios nuevos.

---

# Checkpoint P5-L4 · TableFlow: arte SVG por identidad, mockups y galería

> L4 se construyó sobre la rama de L3 (PR #5, todavía abierto) porque usa sus tokens. Especificación SDD, revisión de la muestra y límites: `p5-spec.md`, sección "L4".

## Identificación
- Fecha real: 17/10/2026. Rama `claude/tableflow-p5-l4`, creada desde `claude/tableflow-p5-l3` (`009e443`). `SCHEMA_VERSION` sigue en 2: no hay cambios de dominio.

## Qué se hizo
- **Familias** en `src/ui/art/families/`, con 127 piezas: café 23, bodegón 38, heladería 26, bar 19 y rápida 21. Cada una tiene su material y punto de vista y su marco `Piece` (sin el filtro de P4). Cubren carta, juego infantil y objetos de la casa.
- **Muestra a tamaño real** antes de producir cada familia: cinco piezas revisadas a 40–320 px en claro y oscuro, cuatro rehechas. En la familia se corrigieron siete piezas más.
- **Mockups** (`mockups.tsx` y `.css`): comprobante, tarjeta de fidelidad y teléfono con pantalla por identidad, en HTML con texto real.
- **Galería** `#/arte` (índice) y `#/arte/<id>`: muestra a tamaño real, familia por grupo y mockups; sigue el tema.
- **App:** `DishArt` usa las familias. Las escenas firma de L2b pasan a `src/ui/art/scenes/` y reemplazan la "mesa desde arriba" en el inicio, las portadas y reservas. Se borró el arte de platos de P4, que ya no se usaba.

## Pruebas nuevas
- `tests/art.test.ts` (132):
  - cobertura de los 42 ítems;
  - claves únicas;
  - bebidas marcadas "sin alcohol";
  - una prueba por pieza: `viewBox`, ids únicos entre dos instancias, referencias resueltas, sin NaN ni enlaces externos, nombre accesible;
  - mockups.
- `e2e/p5-l4.spec.ts` (3):
  - galería completa sin red externa ni errores de consola;
  - piezas sin deformar;
  - la app usa las familias y las escenas;
  - axe en claro y oscuro, a 1440 y 390 px, sin scroll horizontal.
- No cambió ninguna prueba existente; en `screens.spec.ts` solo se agregó el bloque de capturas de L4.

## Comandos y resultados
| Comando | Exit | Resultado |
|---|---|---|
| `npx tsc --noEmit` | 0 | sin errores |
| `npx vitest run` | 0 | 15 archivos, 574 pruebas (442 + 132) |
| `npm run build` | 0 | OK. Chunk inicial: 348 kB JS (antes 326; suman las familias de los cinco negocios). Galería: chunk diferido de 15 kB |
| `npx playwright test` | 0 | 86 pasadas (83 + 3), 6 omitidas (capturas) |
| `CAPTURE=1 npx playwright test e2e/screens.spec.ts -g "P5-L4"` | 0 | 43 capturas en `screens/p5-l4/`, cuantizadas: 3,0 MB |

## Siguiente tarea exacta
PR de L4 (encadenado a L3), seguimiento hasta verde y espera del ok de Ignacio. Después, **L5**: los tres negocios nuevos con fixtures, migración a esquema 3, retiro con pago en local y los cinco juegos infantiles, usando estas familias.

---

# Checkpoint P5-L3 · TableFlow: shell, identidad aplicada y modo oscuro

> L1 (PR #3) y L2b (PR #4) están en `main`. Ignacio aprobó las cinco identidades de L2b el 17/10/2026. L3 las aplica a los dos negocios que hoy existen (Ritual Café y Mesa Clara), agrega el modo oscuro, reemplaza la consola superior por un dock y suma la bienvenida por rol. Especificación SDD y límites: `p5-spec.md`, sección "L3".

## Identificación
- Fecha real: 17/10/2026. HEAD de entrada: `2ee3dda` (merge del PR #4). Rama `claude/tableflow-p5-l3`, creada desde `main`.
- `SCHEMA_VERSION` sigue en 2: el estado del dominio no cambia. Las preferencias suman `theme` (`system` | `light` | `dark`) y `roleIntroSeen`. Si las preferencias guardadas son viejas o tienen un valor desconocido, se completan con los valores por defecto sin perder el resto.

## Qué se hizo
- **Tema:** `src/ui/theme.ts` aplica `html[data-theme]` antes del primer render y sigue a `prefers-color-scheme` en vivo mientras la preferencia sea "sistema". El reinicio de la demo conserva el tema y la bienvenida.
- **Tokens:** `styles.css` tiene seis temas (TableFlow, Mesa Clara y Ritual Café, en claro y oscuro) con nombres semánticos. `html[data-biz]` lo fija `Chrome` según la ruta. Los colores fijos de campos, avisos, estados, salón, caja, regalos, juegos y chat pasaron a tokens.
- **Identidad:** Mesa Clara usa el cartel enlozado en Ultra, Bitter y Caveat Brush. Ritual Café usa Bodoni Moda, EB Garamond, Pinyon Script, bordó y oro, y un doble filete. Las tipografías se cargan desde el build (OFL), sin CDN.
- **Shell:** franja DEMO fina (≤ 32 px, medido en SH-01) y en una sola línea en móvil. `DemoDock` reemplaza a `DemoBar`:
  - rol con descripción, negocio, sede, reloj, cinco casos, tema, sonidos, movimiento, guía, tráiler con estado honesto y reinicio confirmado;
  - abajo a la derecha en escritorio, dentro de la franja DEMO cuando hay barra inferior;
  - se cierra con Escape o con un clic afuera.
- **Bienvenida:** `RoleIntro` aparece una vez en la portada, después de la carga. Se puede omitir.
- **FX-01…03:** artículo del 404, plural del resumen y contexto de "Pedidos de hoy".
- **Accesibilidad:**
  - los `input` sin `type` (regalos) no tomaban el estilo de campo; ya lo toman;
  - la tabla de turnos de Caja con desplazamiento ahora se puede enfocar con teclado (axe a 390 px).

## Pruebas cambiadas, y por qué
- `e2e/*.spec.ts`: los controles que antes estaban siempre visibles ahora están dentro del dock, así que antes de usarlos se llama a `ensureConsole`. `setRole` y `jump` cierran el dock. No se quitó ninguna aserción.
- `playwright.config.ts` y `fresh()`: arrancan con la bienvenida ya omitida. La bienvenida se prueba aparte, con almacenamiento vacío (`p5-l3.spec.ts`, SH-02).
- `design.spec.ts`: la excepción de superposición pasa de `.console` a `.dock`.
- `motion.spec.ts`: abre el dock antes de usar "Reducir movimiento".
- `tests/contrast.test.ts`:
  - los pares literales de Mesa Clara y Ritual Café usaban la paleta vieja; se reemplazaron por pares leídos de `styles.css` (40 pares por tema en 6 temas, más la pizarra), así ya no pueden quedar desfasados;
  - los pares de la consola, que ya no existe, se reemplazaron por los del dock.

## Comandos y resultados
| Comando | Exit | Resultado |
|---|---|---|
| `npx tsc --noEmit` | 0 | sin errores |
| `npx vitest run` | 0 | 14 archivos, 442 pruebas. Antes: 205. Se suman los pares de contraste por tema y `theme.test.ts` (3) |
| `npm run build` | 0 | OK |
| `npx playwright test` | 0 | 83 pasadas (73 + 10 de `p5-l3.spec.ts`), 6 omitidas (capturas) |
| `CAPTURE=1 npx playwright test e2e/screens.spec.ts -g "P5-L3"` | 0 | 22 capturas en `screens/p5-l3/`, cuantizadas a 256 colores: 3,6 MB |

## Siguiente tarea exacta
PR de L3 a `main`, seguimiento hasta verde y espera del ok de Ignacio. Después, **L4**: familia SVG propia por identidad con buen render en claro y oscuro (AR-01…05). Los tres negocios nuevos (heladería, bar, comida rápida) entran en L5 con este mismo sistema de tokens.

---

# Checkpoint P5 · TableFlow: cinco negocios (L1 hecho, L2 rehecho como L2b; puerta de aprobación visual)

> Prompt P5: una fase en diez lotes. L1 (especificación) se mergeó con el PR #3. La primera ronda de L2 (15 conceptos) también entró con ese PR, pero Ignacio la rechazó por genérica. **L2b la reemplaza con una identidad propia por negocio.** L3–L10 esperan su aprobación.

## Identificación
- Fecha real: 17/10/2026. HEAD de entrada: `def55b5` (merge del PR #3 en `main`). Rama `claude/tableflow-p5-l2b`, creada desde `main`.
- `SCHEMA_VERSION` sigue en 2: L2b no toca el dominio.

## Archivos
- Reemplazados: `src/pages/propuestas/*`. Se borraron `concepts.ts`, `content.ts`, `art.tsx` y `propuestas.css`. Se agregaron `identities.ts`, `shared.tsx`, `studio.css` y, por identidad, `cafe`, `helado`, `bodegon`, `bar` y `rapida` (`.tsx` y `.css`). Se reescribieron `Propuestas.tsx` y `fonts.ts`.
- `package.json` y `package-lock.json`: se sacaron 23 tipografías de la primera ronda; se sumaron Bodoni Moda, EB Garamond, Pinyon Script, Ultra, Caveat Brush, Bitter y Fredoka (OFL, locales).
- Pruebas: `tests/propuestas.test.ts` y `e2e/p5.spec.ts` reescritas; bloque de capturas "P5-L2b" en `e2e/screens.spec.ts`.
- Capturas: `docs/tableflow/screens/p5-l2/` regeneradas (26 capturas y 5 hojas `L2b-*.jpg`).

## Comandos y resultados
| Comando | Exit | Resultado |
|---|---|---|
| `npx tsc --noEmit` | 0 | sin errores |
| `npx vitest run` | 0 | 13 archivos, 205 pruebas (193 + 12) |
| `npm run build` | 0 | OK (chunk diferido `Propuestas`: 120 kB JS y 67 kB CSS) |
| `npx playwright test` | 0 | 73 pasadas (70 + 3), 5 omitidas (capturas) |
| `CAPTURE=1 npx playwright test e2e/screens.spec.ts -g "P5-L2b"` | 0 | 26 capturas |

## Siguiente tarea exacta
Ignacio revisa `#/propuestas` o las hojas `screens/p5-l2/hojas/L2b-*.jpg` y aprueba, combina o pide cambios por negocio. También confirma la grafía de "Atilos". Con la aprobación registrada en `p5-spec.md` empieza **L3**: tokens por identidad aplicados a la app, modo oscuro, header limpio, botonera flotante, selector de rol después de la carga y FX-01…03.

---

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
