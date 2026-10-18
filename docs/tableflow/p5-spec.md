# P5 · Cinco negocios TableFlow: especificación (L1)

> Fase única P5, diez lotes internos L1–L10. Este documento es la especificación de L1 y la matriz que se actualiza en cada lote. Lo marcado como **construido** o **probado** solo vale con la evidencia citada; el resto es especificación.

## L1.1 Estado de entrada (verificado el 17/10/2026)
| Dato | Valor |
|---|---|
| Repo / ruta | `github.com/Toti-Gauna/Tableflow` · `/home/user/tableflow` |
| Rama / HEAD | `claude/tableflow-demo` @ `3088fdc`, árbol limpio al empezar, igual a `origin/claude/tableflow-demo` |
| main | `cb30249` (merge del PR #1, solo P1). El PR #2 (P2–P4) sigue abierto |
| Instrucciones del repo | No hay `CLAUDE.md`, `AGENTS.md` ni `.claude/` en el repo. Rigen el prompt P5 y las restricciones de la sesión |
| Esquema | `SCHEMA_VERSION = 2` (`src/domain/types.ts:3`), clave `tableflow.demo.v1`, migración explícita 1→2 |
| Verificado hoy | typecheck exit 0; Vitest 193/193; build OK. E2E: 70 en verde en el CI de `3088fdc` (sin volver a correr hoy) |

Riesgos y trabajo ajeno: no hay trabajo ajeno sin commitear. Riesgos técnicos:
- `BusinessId = 'mesa-clara' | 'ritual-cafe'` y `kind: 'bodegon' | 'cafe'` son uniones cerradas, y hay **69 ramas** que comparan el id del negocio a mano en 14 archivos fuera de los fixtures (`Shell`, `hooks`, `format`, `characters`, `season`, `cmd-system`, `content`, `gifts`, `persistence`, `Landing`, `Carta`, `NotFound`…). Si se agregan tres negocios sin sacar esas ramas, aparecerán defaults equivocados (por ejemplo, `NotFound` asume Mesa Clara si la ruta no empieza con `/ritual-cafe`).
- Las pruebas E2E dependen de textos y testids de los dos perfiles actuales. Cambiar la identidad visual (L3) o el header romperá selectores: se actualizan con justificación, nunca se borran.
- El contenedor de la sesión es efímero y el prompt prohíbe commit/push sin autorización explícita: hasta autorizarlo, el trabajo de P5 vive solo en el árbol local.

## L1.2 Inventario actual (construido y probado)
- **Rutas cliente** (`#/:biz/…`): inicio, carta, carta/:itemId, pedido, pedido/:id, reservar, reservas/:id, explorar, pasaporte, catas, regalar, regalo/:code, chicos, ayuda, simulador. **Comercio** (`#/admin/…`): resumen, reservas, salón, pedidos, cocina, caja, carta, stock, clientes, regalos, automatizaciones, reportes, configuración. **Globales**: `#/` portada, `#/simulador`, `#/comercial`, `#/arte`.
- **Dominio** (34 módulos, 6.342 líneas): reducer puro `applyCommand` con comandos por área (`cmd-booking`, `cmd-cash`, `cmd-commerce`, `cmd-engage`, `cmd-system`), disponibilidad, chat/NLU determinista, llamada, mensajería, automatizaciones AU01–AU10, stock, pickup, regalos, temporadas, reportes, validación de invariantes y persistencia.
- **Fixtures**: Mesa Clara (28 ítems, 12 mesas, reservas) y Ritual Café (14 ítems, 6 mesas, retiro por franja); seed `servicio` y `vacio`; reloj lun 19/10/2026 10:00 ART.
- **Arte**: 42 SVG de platos, ilustraciones firma, personajes, ornamentos de temporada y elementos del juego infantil (`src/ui/art/*`), con un único acabado de tinta y grano.
- **Juego infantil**: uno compartido (memotest + "Armá tu plato") en `client/Chicos.tsx`.
- **Pruebas**: 12 archivos Vitest (193) y 12 specs Playwright (70 + 4 de capturas).
- **Cobertura conocida**: 15/15 módulos, S01–S46 (46 en dominio, 40 también E2E), AU01–AU10 (`docs/tableflow/coverage.md`). **Estos números no cubren nada de P5.**

### Defectos reportados: causa verificada (se corrigen en L3)
| ID | Síntoma | Causa |
|---|---|---|
| FX-01 | `#/heladeria` → "No encontramos esa perfil" | `NotFound` arma `esa ${what}` y `App.tsx:49` pasa `what="perfil"` (masculino) |
| FX-02 | "1 solicitadas · 11 confirmadas" | `Resumen.tsx:37` concatena el número con el plural fijo |
| FX-03 | "Pedidos de hoy 0" con 12 pedidos en el fixture | El criterio es correcto: los 5 pedidos de Mesa Clara son del sáb 17/10 y el reloj está en lun 19/10 10:00, antes de abrir. Los 7 de hoy son de Ritual Café. Lo que falta es contexto: el KPI no dice que el local abre a las 12:00 ni cuál fue el último servicio |

## L1.3 Cinco negocios: recorridos completos
Nombres ficticios. Los dos actuales se conservan; los tres nuevos son propuestos.

| Negocio (id) | Estado | Identidad de partida |
|---|---|---|
| **Ritual Café** · cafetería (`ritual-cafe`) | existe | café de especialidad, barra y vitrina |
| **Mesa Clara** · restaurante/bodegón (`mesa-clara`) | existe | bodegón contemporáneo, salón y terraza |
| **Copo** · heladería (`copo`) | propuesto | helado artesanal, mostrador de bachas, retiro y envío simulado |
| **Taberna Compás** · bar gastronómico (`compas`) | propuesto | tapas, cocina de barra y agenda de música en vivo; sin entradas, listas ni operación de boliche (eso es de EventOS) |
| **Brasa Rápida** · comida rápida (`brasa`) | propuesto | combos de hamburguesa y sándwich al paso, pantalla de números de retiro |

### Recorridos públicos (RP) y operativos (RO)
Cada recorrido va de punta a punta sobre el store compartido. Estados alternativos que se exigen en todos: vacío, carga, error, indisponible, cancelación y recuperación.

| ID | Negocio | Recorrido público | Recorrido operativo conectado |
|---|---|---|---|
| RP-CAF-01 | Café | Carta → café (método, tamaño, leche) + medialunas (cantidad, rellena/simple) → **retiro con pago en local** → ticket con número, "aceptado · pago en local pendiente" | RO-CAF-01: barra recibe → acepta → prepara → listo (aviso) → retirado → **cobro en caja al retirar** → cierre |
| RP-CAF-02 | Café | Consumo en mesa (QR de mesa en L7) → pedido a la mesa → cuenta | RO-CAF-02: mesa abierta → comanda → servido → cuenta → pago DEMO |
| RP-RES-01 | Restaurante | Carta → plato con modificadores → pedido de mesa → cuenta dividida | RO-RES-01: salón/mozo → cocina por estación → servido → caja (división) → cierre (existente) |
| RP-RES-02 | Restaurante | Reserva (fecha, personas, franja, preferencia) → alternativa si no hay cupo → seguimiento | RO-RES-02: recepción confirma → llegada → sentar → mesa (existente) |
| RP-HEL-01 | Heladería | Formato (cucurucho, vasito, ¼, ½, 1 kg) → **cantidad de gustos según formato** → gustos con disponibilidad por bacha → extras (baño, salsa) → retiro o envío simulado | RO-HEL-01: mostrador recibe → acepta → arma → listo → retirado/entregado; **bacha baja/agotada** saca el gusto de la carta y revalida carritos |
| RP-HEL-02 | Heladería | Pedido por peso para llevar con gustos repartidos y anotación de alérgenos derivada al equipo | RO-HEL-02: reposición de bachas, merma, stock por kg |
| RP-BAR-01 | Bar gastronómico | Carta de tapas, platos y bebidas (con y sin alcohol, etiquetadas) → pedido en mesa o en barra → cuenta del grupo | RO-BAR-01: cocina de barra y barra por estación → servido → cuenta dividida por persona/ítem |
| RP-BAR-02 | Bar gastronómico | Agenda de música/gastronomía (noche de jazz, cata de vermut) → **reserva de mesa** para esa noche (sin entradas) | RO-BAR-02: reservas por noche de agenda, capacidad por sector, lista de espera |
| RP-FR-01 | Comida rápida | Combo (principal + guarnición + bebida) → tamaño → **sustituciones** (sin cebolla, cambio de pan) y extras → retiro → **número de retiro** en pantalla | RO-FR-01: cola por estación (plancha, freidora, armado) → listo → pantalla de números → entregado |
| RP-FR-02 | Comida rápida | Repetir pedido anterior con revalidación de precio/stock | RO-FR-02: capacidad por franja y pausa de un ítem agotado |

### Módulos: compartido vs variable
| Capacidad | Compartida (motor) | Varía por negocio |
|---|---|---|
| Catálogo y configurador | Ítem, grupo de modificadores, reglas mín/máx, precio en centavos | **Tipo de configurador**: método/leche (café), modificadores de plato (restaurante), formato→cupo de gustos (heladería), tapa/ración y bebida etiquetada (bar), combo con slots y sustituciones (rápida) |
| Pedido, cocina, stock | Estados del pedido, comanda, reserva/consumo de insumos | Estaciones (barra; cocina/parrilla; mostrador; cocina de barra/barra; plancha/freidora/armado), unidad de stock (unidades, kg de bacha) |
| Pago | Pago DEMO, caja, arqueo | Modalidad por defecto: **pago en local al retirar** (café, heladería, rápida), cuenta de mesa (restaurante, bar) |
| Reservas | Motor de disponibilidad | Solo restaurante y bar (bar por noche de agenda); café, heladería y rápida sin reservas (se explica, no se esconde sin aviso) |
| Agenda | Eventos con cupo (catas actuales) | Catas (café), noches de música/gastronomía (bar), nada en rápida |
| Fidelización y growth | Clientes, segmentos, campañas, reglas, costos, asistentes (L6) | Mecánica: pasaporte de sabores (café), visitas (restaurante), tarjeta de gustos probados (heladería), noches de agenda (bar, sin incentivar alcohol), sellos por combo (rápida) |
| QR y códigos | Generador, estados de validación (L7) | Mesa (restaurante, bar, café), retiro (café, heladería, rápida), beneficio (todos) |
| Juego infantil | Marco de juego con inicio, pausa, salida y reintento (L5) | **Un juego distinto por negocio** (L1.5) |
| Animación transaccional | Disparada por el evento del store, interrumpible y omitible (L8) | Composición propia por negocio (L1.6) |
| Identidad visual | Tokens semánticos y familias de componentes (L3) | Tipografía, color, superficies, grilla, iconografía, arte y motion (L2) |

## L1.4 Requisitos nuevos con ID (todos los lotes)
Prefijo por área. Cada lote amplía el detalle de su área antes de construir.

| ID | Requisito | Lote |
|---|---|---|
| ID-01…05 | Tres direcciones visuales por negocio (15 conceptos) y elección registrada | L2 |
| SH-01 | Header de marca limpio; DEMO discreto pero visible | L3 |
| SH-02 | Selector de rol opcional después de la carga real; se puede omitir y cambiar | L3 |
| SH-03 | Botonera flotante: rol, negocio, casos, guía, trailer (si existe), sonido, reinicio confirmado | L3 |
| SH-04 | Modo claro/oscuro en todas las superficies, manual persistente + preferencia del sistema | L3 |
| SH-05 | Cambiar rol conserva negocio y registros; cambiar negocio no mezcla datos | L3 |
| FX-01…03 | Correcciones de copy y del contexto del KPI | L3 |
| AR-01…05 | Familia SVG propia por identidad, buen render claro/oscuro, galería | L4 |
| NG-HEL/BAR/FR | Tres negocios nuevos completos con fixtures, configurador y operación | L5 |
| NG-CAF-PAGO | Retiro con pago en local: aceptado ≠ pagado | L5 |
| MG-01 | Esquema siguiente al detectado (hoy 2 → 3) con migración explícita y aislamiento por businessId | L5 |
| JG-CAF/RES/HEL/BAR/FR | Cinco juegos infantiles distintos | L5 |
| GR-A…G | Historial, campañas, reglas, costos, asistentes, UI conversacional | L6 |
| GR-CALC | Fórmulas de contribución y equilibrio con los casos del manual | L6 |
| QR-01…06 | Generación, código+QR, estados, escaneo opcional, URL sin datos personales, límite de localStorage | L7 |
| MO-CAF/RES/HEL/BAR/FR | Cinco animaciones transaccionales disparadas por eventos reales | L8 |
| MO-LOAD, TE-01 | Carga y skeletons; temporadas con inicio/fin y vista previa por identidad | L8 |
| SC-01…05 | Cinco escenas sobre el store con teléfono en overlay | L9 |
| GU-01, EC-01 | Guía completa por rol/tarea; cierre Eclipse fullscreen | L9 |
| QA-01, KIT-01…03 | Matriz de QA; trailer; HTML de email; bloqueos de publicación | L10 |

## L1.5 Juegos infantiles (uno distinto por negocio)
Zona familiar opcional, sin datos de menores, chat, compras, apuestas, presión comercial ni premios por comprar. Todos tienen inicio, instrucciones, interacción real, progreso, éxito, reintento, pausa y salida; teclado y táctil; sin límite de tiempo; movimiento reducido.

| ID | Negocio | Juego | Mecánica |
|---|---|---|---|
| JG-CAF | Café | Memoria de la merienda | Pares de medialunas, frutas y tazas; 3 niveles de tablero |
| JG-RES | Restaurante | Poner la mesa | Arrastrar o elegir con teclado cubiertos, plato y vaso hasta su lugar; después componer un plato |
| JG-HEL | Heladería | Copiá el helado | Mirar una combinación de bochas y reproducirla en orden (memoria de secuencia, sin tiempo) |
| JG-FR | Comida rápida | Armá la hamburguesa | Ordenar los ingredientes según el ticket (pan, carne, queso…) |
| JG-BAR | Bar gastronómico | ¿Dónde está? | Encontrar objetos en una escena de comida y música (instrumentos, tapas, jarra de limonada); sin alcohol |

## L1.6 Animaciones transaccionales
Se disparan solo con el evento persistido (pedido aceptado/enviado), duran 1–3 s, se pueden omitir, respetan movimiento reducido y nunca crean ni cobran nada.

| ID | Negocio | Composición | Termina en |
|---|---|---|---|
| MO-CAF | Café | Capas de medialuna que se doran y vapor sobre el café pedido | Ticket con número y "pago en local pendiente" |
| MO-HEL | Heladería | Las bochas de los gustos elegidos se apilan en el formato | Comprobante con los gustos |
| MO-RES | Restaurante | El plato se compone (o la mesa se prepara si es una reserva) | Comanda o folio de reserva |
| MO-BAR | Bar | Tabla de tapas o bebida sin alcohol que se arma | Comanda de mesa o barra |
| MO-FR | Rápida | Los ingredientes del combo se ensamblan | Número de retiro |
Para ítems sin pieza específica: fallback por categoría (taza, plato, vaso, bolsa).

## L1.7 Matriz por negocio y requisito
Leyenda: E especificado · C construido · P probado · — pendiente · B bloqueado.

| Requisito | Café | Restaurante | Heladería | Bar | Rápida |
|---|---|---|---|---|---|
| Recorridos RP/RO | C P (base existente) | C P (existente) | C P (L5) | C P (L5) | C P (L5) |
| Retiro con pago en local | C P (L5) | n/a | C P (L5) | n/a | C P (L5) |
| Propuestas visuales (L2, 1.ª ronda) | rechazada por genérica | rechazada | rechazada | rechazada | rechazada |
| Identidad propia (L2b) | C P · confitería notable | C P · bodegón de pizarra | C P · la vitrina es el menú | C P · club de jazz | C P · brasa a la vista |
| Aprobación de la identidad | aprobada | aprobada | aprobada | aprobada | aprobada |
| Shell, header, modo oscuro (L3) | C P | C P | C P (tokens en L5) | C P (tokens en L5) | C P (tokens en L5) |
| Arte propio (L4) | C P · 23 piezas | C P · 38 piezas | C P · 26 piezas (negocio en L5) | C P · 19 piezas (negocio en L5) | C P · 21 piezas (negocio en L5) |
| Juego infantil propio (L5) | C P · memoria | C P · poner la mesa | C P · copiá el helado | C P · ¿dónde está? | C P · armá la hamburguesa |
| Growth y asistentes (L6) | C P | C P | C P | C P | C P |
| QR y códigos (L7) | C P | C P | C P (sin mesas: sede, campaña, pedido y beneficio) | C P | C P (sin mesas: igual que Copo) |
| Animación transaccional (L8) | C P · bandeja: medialunas, dorado y vapor | C P · plato con cubiertos; mesa en la reserva | C P · bochas de los gustos elegidos | C P · tabla y bebida sin alcohol | C P · hamburguesa con los ingredientes reales |
| Temporada propia (L8) | C P · merienda de invierno | C P · mesa de celebración | C P · verano en el mostrador | C P · noche de música | C P · bolsa familiar |
| Escenas y guía (L9) | E | E | E | E | E |
| QA y kit (L10) | E | E | E | E | E |

**Aceptación de L1**: cada requisito nuevo tiene ID y lote; ningún negocio queda reducido a una portada o a una escena (cada uno tiene al menos un RP y un RO de punta a punta).

## Registro de elección visual (L2)
- **1.ª ronda (17/10/2026):** 15 conceptos, tres por negocio, sobre una misma plantilla de pantalla. Ignacio los rechazó todos: "demasiado AI slop", sin diferencia real entre negocios. Se conserva solo como historial: el código se reemplazó y esa versión quedó en `main` con el PR #3.
- **2.ª ronda, L2b (17/10/2026):** una identidad propia por negocio, rehecha desde cero (composición, SVG, animación y tipografía propias, sin plantilla compartida). Pedido de Ignacio: el café inspirado en confiterías notables porteñas (cita La Fonte d'Oro y "El Cóndor"); la comida rápida, en McDonald's, Burger King y "Atilos". "El Cóndor" y "Atilos" no se encontraron en la búsqueda; se interpretaron como confitería o bar notable porteño y como cadena de comida rápida.

| Negocio | Identidad L2b | Aprobación de Ignacio |
|---|---|---|
| Cafetería · Ritual Café | Confitería notable porteña | aprobada (17/10/2026) |
| Heladería · Copo | La vitrina es el menú | aprobada (17/10/2026) |
| Restaurante · Mesa Clara | Bodegón de pizarra y pingüino | aprobada (17/10/2026) |
| Bar gastronómico · Taberna Compás | Club de jazz y tapas | aprobada (17/10/2026) |
| Comida rápida · Brasa Rápida | Brasa a la vista | aprobada (17/10/2026) |
Ignacio aprobó las cinco el 17/10/2026: "Apruebo todos los diseños, vos seguí, de última luego reemplazamos algo". Cualquier identidad se puede reemplazar más adelante sin rehacer el sistema de tokens de L3.

Detalle y evidencia: `p5-l2-propuestas.md`.


## L3 · Shell, identidad aplicada y modo oscuro (SDD)
Construido el 17/10/2026 sobre `main` (`2ee3dda`). Cubre los dos negocios que hoy existen en la app y la portada de TableFlow. Heladería, bar y comida rápida todavía no existen como negocio: entran en L5 y reutilizan este sistema de tokens con las paletas ya medidas en L2b.

### Requisito → escenario → estados → componentes → aceptación → prueba
| ID | Escenario | Estados | Componentes | Aceptación | Prueba |
|---|---|---|---|---|---|
| SH-01 | Entrar a un negocio en escritorio o móvil | franja DEMO siempre visible; cabecera de marca sin controles de demo | `DemoBanner` (fina, ≤ 32 px), `ClientLayout` (marca por identidad) | la marca arranca debajo de la franja; ningún control de la demo en la página | `p5-l3.spec.ts` SH-01 |
| SH-02 | Primera visita a la portada | sin ver → visible después del evento `load` → elegido u omitido (no vuelve) | `RoleIntro`, `prefs.roleIntroSeen`, `ROLE_DESC` | 7 roles con descripción; "Omitir por ahora"; un enlace directo no la muestra; el rol se cambia después desde el dock | SH-02 (3 casos, con almacenamiento vacío) |
| SH-03 | Presentar: cambiar rol, negocio, sede, hora o caso; abrir guía, tráiler, sonidos, movimiento, reinicio | cerrado → abierto → se cierra con Escape, clic afuera o al cambiar rol, negocio, sede o caso | `DemoDock` (abajo a la derecha en escritorio; en la franja DEMO cuando hay barra inferior, < 1000 px), `CASES` | el botón no tapa controles ni el resumen del pedido; el foco vuelve al botón; el tráiler dice que todavía no existe (sin video) | SH-03 (2 pruebas) |
| SH-04 | Cambiar entre claro y oscuro | sistema (en vivo) · claro · oscuro; se guarda y sobrevive al reinicio | `ui/theme.ts`, `html[data-theme]`, tokens `:root[data-theme='dark']` y por negocio | todas las superficies con tokens (campos, avisos, estados, salón, caja, regalos, juegos, gráficos); los objetos impresos (comanda, tarjeta de regalo, ticket) siguen claros a propósito | SH-04 (tema), SH-04 (axe en oscuro: 9 pantallas × 2 anchos + 6 de administración + dock), `contrast.test.ts` |
| SH-05 | Cambiar de rol o de negocio con datos cargados | el rol cambia la vista; el negocio cambia los datos | `useRoleNav`, `switchBiz` | el negocio, los pedidos y el carrito siguen iguales al cambiar de rol; al cambiar de negocio, cada comanda en cocina pertenece al negocio elegido y el carrito del otro queda aparte | SH-05 |
| FX-01 | `#/heladeria` | — | `NotFound` recibe la frase con su artículo | "No encontramos ese perfil" | FX-01..03 |
| FX-02 | Resumen con 1 reserva solicitada | — | `Resumen` (`nRes`) | singular y plural según el número | FX-01..03 |
| FX-03 | Resumen de Mesa Clara a las 10:00 del lunes | sin pedidos hoy → cerrado / abierto sin pedidos / sin más servicio | `Resumen` (`ordersNote`) | "Abre a las 12:00 · último servicio: sábado 17/10 (5 pedidos)" | FX-01..03 |

### Identidad aplicada a la app
- **Tokens:** `styles.css` define el claro de TableFlow, su oscuro y un bloque claro y otro oscuro por negocio, con el mismo juego de nombres semánticos: papel, tinta, campos, avisos con su borde y texto, estados suaves, sello DEMO, administración y lateral. Fuera de la franja DEMO y de los controles de la demo, las apariciones de color fijo en componentes bajaron de 229 a 142: se pasaron a tokens las de campos, avisos, estados, salón, caja, regalos, juegos y chat. Las que quedan son, a propósito, de cosas que no cambian con el tema: el tablero de cocina, la comanda impresa, la tarjeta de regalo, la pizarra, el lateral oscuro, las temporadas y el arte.
- **Mesa Clara (bodegón):** el nombre es un cartel enlozado en Ultra; Bitter en títulos y carta; Caveat Brush para la bajada y el énfasis del titular; rojo de cartel y azul de sifón; el oscuro es la pizarra.
- **Ritual Café (confitería notable):** Bodoni Moda en marca y títulos; EB Garamond en la carta; Pinyon Script en el énfasis; bordó, oro viejo y doble filete dorado bajo la cabecera; tarjetas con marco doble; el oscuro es el salón de caoba.
- **Contraste medido:** `tests/contrast.test.ts` lee los bloques de `styles.css` y mide 40 pares por tema en 6 temas (TableFlow, Mesa Clara y Ritual Café, en claro y oscuro), más la pizarra. También verifica que el oscuro de cada negocio redefina todo lo que redefine su claro.

### Límites declarados de L3
- Las ilustraciones son las de P4: en oscuro se atenúan un poco, pero el arte propio por modo es de L4.
- La "barra de botones" es un botón que abre un panel con todo agrupado; no son siete botones sueltos, para no tapar contenido.
- Sin revisión con lector de pantalla ni en dispositivo físico. axe no certifica conformidad.
- Las ramas de dominio por negocio (`b.kind === 'bodegon'`, etc.) siguen en el código: se ordenan en L5, cuando haya cinco negocios.


## L4 · Arte SVG, mockups y activos (SDD)
Construido el 17/10/2026 sobre la rama de L3 (PR #5), porque usa sus tokens. Hay una familia por identidad en `src/ui/art/families/` y la galería está en `#/arte` y `#/arte/<cafe|resto|hela|bar|rapida>`.

### Requisito → escenario → estados → componentes → aceptación → prueba
| ID | Escenario | Estados | Componentes | Aceptación | Prueba |
|---|---|---|---|---|---|
| AR-01 | Antes de producir la familia, revisar una muestra por negocio a tamaño real | muestra → revisión ampliada (40, 64, 96, 160 y 320 px, en claro y oscuro) → correcciones → familia | `Piece`, bloque "Muestra a tamaño real" de la galería | proporción, curvas, materiales y legibilidad revisados uno por uno (detalle abajo) | `p5-l4.spec.ts` AR-01/02 (10 tamaños por identidad) |
| AR-02 | Ver la familia completa de cada identidad | carta · juego infantil · objetos de la casa | `cafe.tsx`, `bodegon.tsx`, `copo.tsx`, `compas.tsx`, `brasa.tsx` | 127 piezas en total: café 23, bodegón 38, heladería 26, bar 19 y rápida 21. Cada identidad tiene al menos 12 de carta y 5 de juego. Sin placeholders | `tests/art.test.ts`; AR-01/02 (conteo por identidad) |
| AR-03 | Las piezas de la familia no comparten el acabado de P4 | — | marco `Piece` propio, sin el filtro de tinta y grano ni gradientes heredados | ninguna pieza de familia tiene `<filter>`; la carta y el inicio de los dos negocios usan las piezas y escenas nuevas | AR-03 |
| AR-04 | SVG sanos en claro y oscuro | — | `viewBox` de 160, ids únicos por instancia, `role="img"` con nombre o `aria-hidden` | las 127 piezas renderizadas dos veces en el mismo documento: sin ids repetidos, toda referencia `url(#…)` resuelve, sin NaN y sin enlaces externos. axe sin violaciones serias en la galería, en claro y en oscuro, a 1440 y 390 px | `tests/art.test.ts` (una prueba por pieza); AR-04 |
| AR-05 | Mockups con acabado final | — | `Ticket`, `Loyalty`, `PhoneFrame` y `PhoneScreen` (HTML con texto real) | un comprobante, una tarjeta de fidelidad y una pantalla en teléfono por identidad, con datos ficticios | AR-01/02, `tests/art.test.ts` |

### Lenguaje de cada familia
| Identidad | Punto de vista y material | Qué la distingue |
|---|---|---|
| Ritual Café | vajilla de porcelana blanca con filete dorado, a tres cuartos, sobre su plato | sin contorno: el volumen lo dan la porcelana, el oro y la luz; vidrio fino para latte, cold brew, lágrima y submarino; medialunas en gajos |
| Mesa Clara | loza blanca con filete rojo, a tres cuartos, en tablas o en hierro | contorno de pincel marrón y colores planos con una sombra y un brillo, como un cartel de bodegón |
| Copo | bochas de costado con cuello festoneado; bachas de acero vistas desde arriba | sin contorno, colores de gusto, trocitos y brillo de mostrador; formatos reales (cucurucho, vasito y potes) |
| Taberna Compás | gráfica de tapa de disco | dos tintas (azul y mostaza) más el trazo, semitono de puntos; el trazo y el papel cambian con el tema |
| Brasa Rápida | foto de producto dibujada, de frente | volúmenes grandes, brillo fuerte, marcas de parrilla y queso que se derrite; envases rojos con la llama |

### Revisión de la muestra (AR-01) y correcciones
Se dibujó una pieza por negocio: cortado y medialuna, napolitana, cucurucho de dos gustos, bravas y hamburguesa doble. Se revisó a 40, 96, 160 y 320 px, en claro y en oscuro, y después se corrigió:
- el cortado ocupaba un tercio del cuadro: se agrandó para que se lea a 40 px;
- la medialuna era un arco simétrico: se rehizo con gajos;
- la napolitana, con capas concéntricas, se leía como huevo o pizza: se rehízo con la salsa irregular, la muzzarella corrida y el jamón asomando;
- en las bravas, las papas parecían papelitos y el semitono se salía de la cazuela: se rehicieron como cubos con cantos y se recortó el semitono.

En la familia, después de revisar cada pieza, se rehicieron:
- el tostado (no se entendía el corte);
- el submarino (la barra flotaba fuera del vaso);
- la medialuna de grasa (era igual a la de manteca);
- el panqueque (parecía un omelette);
- los potes de helado (el recorte fallaba por un id con espacios);
- el cuadriculado del cucurucho grande;
- el disco en oscuro (quedaba crema).

### Integración en la app
- `DishArt` usa la familia de cada identidad. Los 42 ítems de Mesa Clara y Ritual Café tienen pieza propia, así que cambiaron la carta, el pedido, los regalos, la administración y el memotest.
- Las escenas firma de L2b (`scenes/salon.tsx` y `scenes/bodegon.tsx`) reemplazan la "mesa vista desde arriba" de P4 en el inicio, las portadas y reservas. El estudio de identidades importa las mismas escenas.
- Se borraron `art/hero.tsx`, `art/mesa-clara.tsx` y `art/ritual-cafe.tsx`, que no tienen más usos y quedan en el historial de git. Siguen los personajes, las temporadas y "Armá tu plato", que se reemplaza en L5.

### Límites declarados de L4
- **Fotografía:** no hay fotos con derechos adecuados, así que no se reemplazó ninguna foto pertinente. Todo es ilustración propia.
- **QR:** se genera en L7 (hecho: `qr.ts`, `Qr.tsx`). Los mockups no muestran un QR falso.
- **Contenido provisional:** Copo, Taberna Compás y Brasa Rápida tienen claves de arte, pero sus negocios, fixtures y juegos se arman en L5.
- **Revisión:** sin lector de pantalla ni dispositivo físico. La revisión visual fue por capturas a tamaño real.

## L5 · Producto completo y juegos infantiles (SDD)
Construido el 17/10/2026 sobre `main` (con L3 y L4 ya integrados). La versión de esquema detectada al entrar era **2** (`SCHEMA_VERSION` en `src/domain/types.ts` y los migradores de `persistence.ts`); L5 la sube a **3**.

### Requisito → escenario → estados → componentes → aceptación → prueba
| ID | Escenario | Estados | Componentes | Aceptación | Prueba |
|---|---|---|---|---|---|
| NEG-01 | Cinco negocios con fixtures estables | semilla determinista con actividad en curso | `fixtures/nuevos.ts`, `base.ts`, `seed.ts`, `domain/business.ts` | Copo (8 ítems, 8 gustos con bacha), Taberna Compás (14 ítems, 8 mesas, agenda) y Brasa Rápida (10 ítems, combos); Ritual suma café con leche, lágrima, submarino y medialuna de grasa. Semilla válida y determinista | `tests/l5.test.ts` NEG-01 |
| NEG-01b | Catálogo → selección → pedido/reserva → recepción → preparación → entrega | enviado → aceptado → en preparación → listo → retirado/servido → cerrado | carta, `MiPedido`, `PedidoDetalle`, `AdminPedidos`, `AdminCocina` (estaciones de cada negocio: plancha, freidora, armado, mostrador…), `Numeros` | lo que pide el cliente aparece en el comercio de su negocio y en ningún otro | `e2e/p5-l5.spec.ts` NEG-BR, NEG-02 |
| NEG-02 | Café + medialunas para retirar y pagar en el local | aceptado con pago pendiente → pagado solo al registrar el cobro en caja | `orderPayment` (`sessions.ts`), `PayAtCounter`, `PayRow`, chip en la comanda, `Caja?cuenta=` | el estado de pago sale del saldo de la cuenta; aceptar, preparar o marcar listo no lo cambia; un rechazado no queda como deuda | `l5.test.ts` NEG-02; e2e NEG-02 |
| NEG-03 | Reglas de cada negocio | cupo de gustos por formato, bacha agotada, combos con tamaño/acompañamiento/bebida obligatorios, mesa grande a revisión humana | grupos de modificadores; la carta desactiva opciones sin stock o con el cupo completo | no se puede elegir un gusto agotado ni pasar el cupo; el combo incompleto no entra | `l5.test.ts` NEG-03; e2e NEG-CO |
| NEG-04 | Aislamiento por `businessId` | — | `validateState`, numeración propia de los negocios nuevos (`O-BR-001`, `R-TC-001`…) | cada pedido, comanda, pago y movimiento de stock referencia solo entidades de su negocio; los folios de Mesa Clara y Ritual Café no se corrieron (R-019 y O-013 siguen siendo los próximos) | `l5.test.ts` NEG-04; e2e NEG-BR |
| NEG-05 | Migración explícita desde la versión detectada | v1 → v2 → v3 en cadena | `MIGRATIONS[2]`, `migrate()` | v2 → v3 solo agrega (negocios, sedes, franjas, mesas, carta, insumos, recetas, agenda, reglas, claves de sesión y temporada) y es idempotente; lo guardado no cambia | `l5.test.ts` NEG-05; `persistence.test.ts` |
| NEG-06 | Alcohol fuera de regalos y de la zona familiar | — | `gift/create` rechaza ítems `+18`; `Regalar` y `Chicos` los filtran | ninguna temporada sugiere alcohol; la escena del bar no tiene bebidas con alcohol | `l5.test.ts` NEG-06; `games.test.ts`; e2e JG-06 |
| NEG-UI | Cada negocio se ve y navega como el suyo | claro/oscuro, 1280 y 390 px | tokens `[data-biz]` de Copo, Compás y Brasa (Fraunces+Nunito, Archivo+Instrument Serif, Fredoka); `HomeNuevo` con vitrina, agenda o tablero; portada con cinco tapas; secciones según el tipo de negocio (`ui/features.ts`) | contraste AA medido en los seis tokens de texto de cada modo; axe sin violaciones serias; sin scroll lateral; lo que un negocio no usa responde como página inexistente | `contrast.test.ts`; e2e NEG-UI, NEG-TC |
| JG-FRAME | Marco común de juego | inicio (instrucciones y nivel) → jugando (progreso) ⇄ pausa (botón o Escape) → éxito → siguiente nivel / otra vez; salir en cualquier momento | `games/GameFrame.tsx` | sin tiempo límite, sin puntajes públicos, sin premios ni campos de datos; foco al título de cada fase; "Sin animaciones" además de la preferencia del sistema | e2e JG-01…05 |
| JG-CAF | Ritual Café · memoria de la merienda | 3 / 4 / 6 parejas | `MemoriaBoard` | dos cartas distintas quedan a la vista hasta el próximo toque | `games.test.ts` JG-CAF; e2e |
| JG-RES | Mesa Clara · poner la mesa | 3 / 5 / 6 piezas | `MesaBoard` (elegir y tocar el lugar) | un lugar equivocado explica dónde va y no cambia nada | `games.test.ts` JG-RES; e2e |
| JG-HEL | Copo · copiá el helado | 2 / 3 / 4 bochas | `HeladoBoard` | el modelo está siempre a la vista (alternativa sin memoria); esconderlo es opcional; se marcan las bochas distintas | `games.test.ts` JG-HEL; e2e |
| JG-FR | Brasa · armá la hamburguesa | 4 / 6 / 8 capas | `HamburguesaBoard` | solo entra la capa que sigue en la comanda; si no, dice cuál va | `games.test.ts` JG-FR; e2e |
| JG-BAR | Taberna Compás · ¿dónde está? | 3 / 5 / 7 cosas entre 6 / 9 / 11 | `DondeBoard` (patio con música en familia) | cada objeto es un botón con nombre (Tab + Enter); tocar otra cosa no penaliza; sin alcohol | `games.test.ts` JG-BAR; e2e |

### Qué cambió en lo que ya existía (con motivo)
- **Numeración:** los negocios nuevos numeran con prefijo propio para no correr los folios del bodegón y el café. Los conteos globales de la semilla subieron (21 reservas, 17 pedidos, 14 clientes); los tests que contaban colecciones completas se actualizaron a esos valores o pasaron a medir los dos negocios originales, con el motivo anotado en cada uno.
- **Pago en el local en Ritual Café:** sus retiros ahora muestran "pago en el local pendiente" hasta el cobro en caja, en lugar de "pago simulado: no se cobró nada".
- **Juego infantil:** el memotest genérico de P3 (el mismo para los dos negocios) se reemplazó por un juego por negocio. El test de P3 que lo jugaba ahora juega la memoria de Ritual Café con teclado hasta ganar; "Armá tu plato" sigue en Mesa Clara como juego libre y cubre "componer un plato".
- **Selección con cupo:** con el cupo de un grupo completo (p. ej. dos gustos), la carta desactiva el resto en vez de dejar marcar de más y fallar al agregar.

### Límites declarados de L5
- **Fidelización:** el pasaporte, explorar sabores y el simulador de canales siguen siendo de Mesa Clara y Ritual Café; los negocios nuevos los suman en L6. Esas rutas responden "no encontramos esa sección en este perfil".
- **Arrastre:** los juegos se juegan tocando o con teclado (elegir y después el lugar); no hay arrastrar y soltar.
- **Ilustraciones firma:** el inicio de los negocios nuevos importa las de L2b desde el estudio de propuestas (`pages/propuestas/*`, estilos con prefijo propio) en un chunk diferido; no se duplicaron.
- **Revisión:** sin lector de pantalla ni dispositivo físico; teclado y axe probados con Playwright.

## L6 · Fidelización, campañas y asistentes (SDD)
Construido el 17/10/2026 sobre `main` (con L5 integrado). Esquema detectado al entrar: **3**; L6 lo sube a **4** con un migrador explícito v3 → v4 que solo agrega (costos de muestra donde no hay campo, historial sintético y colecciones vacías). Todo es simulado: ningún envío, cobro ni IA real.

### Fórmulas (GR-CALC)
- Contribución = ingreso neto de descuentos y devoluciones − costo del producto − otros costos variables.
- Porcentaje = contribución / ingreso neto. Se rotula "no es utilidad neta" en Costos, la proyección y el asistente.
- Equilibrio = ceil(costo fijo de la campaña / contribución positiva por pedido); el fijo no se reparte en la unitaria. Contribución ≤ 0 → "sin equilibrio por volumen".
- Casos del manual probados: 100 / 60 / 5 → 35; descuento 10 → ingreso 90, contribución 25, 27,8 %; fijo 100 → 4 pedidos (`tests/growth.test.ts` GR-CALC y `tests/assistants.test.ts`).

### Requisito → escenario → estados → componentes → aceptación → prueba
| ID | Escenario | Estados | Componentes | Aceptación | Prueba |
|---|---|---|---|---|---|
| GR-A | Cliente e historial | recencia, frecuencia y gasto en 90 días, afinidad, beneficios, sellos (Copo y Brasa), referidos, segmentos | `customerStats`, `customerHistory` (sintético, rotulado), `AdminClientes` → "Historial y fidelización", `Mis beneficios` | los segmentos (frecuentes, a reactivar, nuevos, con beneficio sin usar) salen de datos; el premio de los sellos no se entrega sin aprobación del negocio | `growth.test.ts` GR-A; e2e GR-A/C |
| GR-B | Campañas individuales, por segmento y masivas; manuales, programadas y por evento; calendario | borrador → aprobada → activa / programada ⇄ pausada → finalizada · cancelada | `cmd-growth.ts`, `benefits.ts`, `AdminCampanas` (listado, editor, calendario semana/mes/bimestre/estación/festividades) | activar emite beneficios solo con consentimiento promocional y registra el envío simulado o el omitido con su motivo; "Martes de tapas" emite el martes cuando el reloj llega; "Bienvenida" emite con el primer pedido entregado; "Traé a alguien" con el referido cumplido | `growth.test.ts` GR-B; e2e GR-B/C/D y calendario |
| GR-C | Reglas | elegibilidad, vencimiento, mínimo, tope por pedido, tope por cliente, cupo, presupuesto, no acumulación, canje, reversión | `applyBenefit`, `redeemBenefit`, `restoreBenefit`, `benefit/void`, `cart/setBenefit`, `BenefitBox` en Mi pedido | el descuento se valida al enviar; rechazar o cancelar el pedido devuelve el beneficio; editarlo lo recalcula o lo libera; nadie usa un beneficio ajeno ni lo suma a una invitación | `growth.test.ts` GR-C; e2e GR-A/C |
| GR-D | Costos por ítem, variante, extra y combo; proyección antes de activar | costo cargado · ND | `fixtures/costs.ts`, `unitCost`, `projectCampaign`, `AdminCostos`, panel "Proyección" | antes de activar se ven audiencia, descuento, costo máximo, contribución y equilibrio; con un ND (pote de 1 kg, rabas, tabla, pan sin TACC) la campaña queda en borrador y no se puede aprobar | `growth.test.ts` GR-D/B; e2e GR-B/C/D |
| GR-SIM | Proyección, simulación y resultado observado separados | — | tres paneles en el editor | la simulación ("si canjeara el X %") no se guarda ni es pronóstico; el resultado observado rotula "ventas atribuidas: no prueban incremento causal" | e2e GR-B/C/D |
| GR-E | Asistente del comercio determinista | consulta → respuesta; datos faltantes → pregunta; borrador → aprobación humana | `assistant-biz.ts`, `AdminAsistente`, `ChatPane` | consulta ventas, contribución, costos ND, segmentos, stock y campañas; pide los datos que faltan uno por vez; explica supuestos; si no sabe, no inventa; el borrador queda marcado "preparado por el asistente" y lo aprueba el encargado | `assistants.test.ts` GR-E; e2e GR-E |
| GR-F | Asistente del cliente | — | `assistant-client.ts`, `AsistenteCliente` | carta, precios, alérgenos con aviso, gustos de Copo, horarios, el último pedido propio y los beneficios propios; rechaza preguntas por datos de otras personas | `assistants.test.ts` GR-F; e2e GR-F |
| GR-G | UI conversacional cuidada | escribiendo (< 0,5 s) → respuesta; Detener | `ChatPane` | rotulado "simulado, sin IA"; la respuesta ya está calculada y la espera es breve e interrumpible; con movimiento reducido es casi inmediata | e2e GR-E |
| MG-02 | Migración v3 → v4 | — | `MIGRATIONS[3]` | un costo ya cargado no se pisa; validación de referencias de campañas, beneficios, envíos y referidos | `growth.test.ts` MG-02 |

### Qué cambió en lo existente (con motivo)
- `lineDue` descuenta también el beneficio: la caja y el pago en el local cobran el saldo real.
- La versión de esquema vigente pasa a 4: los tests que la fijaban en 3 (persistencia, L5 y la migración e2e de P3) se actualizaron con ese motivo.
- Clientes muestra recencia, pedidos en 90 días, segmento y beneficios en lugar de sellos, reservas y pedidos totales (los sellos del pasaporte siguen en la ficha).
- Nuevo comando de demo `session/setCustomer` para ver la app como un cliente ficticio puntual (vista, no autenticación).

### Límites declarados de L6
- No hay envíos reales: el "envío" de una campaña es un registro simulado por cliente.
- El historial previo a la demo es sintético (la semilla solo tiene pedidos del lunes 19) y se rotula como tal.
- La proyección usa un pedido de referencia de un ítem; un pedido real puede tener más cosas.
- El premio de los sellos no se entrega: requiere aprobación y cotización del negocio, como en P2.

## L7 · QR, códigos y continuidad cliente–comercio (SDD)
Construido el 17/10/2026 sobre `main` (con L6 integrado). **No cambia el esquema (sigue en 4):** los escaneos y canjes se registran en la auditoría existente y no hay colecciones nuevas.

### Dependencias nuevas (justificadas)
- `qrcode-generator` 2.0.4 (MIT, sin dependencias, ~15 kB): codifica el QR con corrección de errores. Escribir a mano un codificador Reed-Solomon es riesgo sin valor para la demo.
- `jsqr` 1.4.0 (Apache-2.0, sin dependencias): lee el QR de la cámara o de una foto, en el navegador. Se importa de forma diferida (chunk propio de ~130 kB, 47 kB comprimido), así que no pesa en la carga inicial.
- Ningún servicio externo: nada se envía y la imagen leída no sale del dispositivo.

### Qué lleva un QR
- Solo una ruta de la app: `#/<negocio>/q/<tipo>/<referencia>` (y `?s=<sede>` para mesas y sedes). Tipos: negocio, sede, mesa, campaña, referido, pedido, reserva, beneficio e invitación.
- **Nunca** nombres, contactos, precios ni secretos. Todo parámetro de más (`precio`, `descuento`, `estado`…) se descarta al leer.
- El estado, el vencimiento y los importes se leen siempre del store. Un código no acredita un pago ni es seguridad productiva: lo dice cada pantalla y el resultado de un pedido.
- El código de recomendación se deriva del cliente (hash estable y único por negocio) y no revela su nombre.

### Requisito → escenario → estados → componentes → aceptación → prueba
| ID | Escenario | Estados | Componentes | Aceptación | Prueba |
|---|---|---|---|---|---|
| QR-01 | Generar QR/enlace de negocio, sede, mesa, campaña y referido; vista previa e impresión | — | `Codigos` (pestaña "Generar e imprimir"), `QrCard`, `qr-render.ts` | el QR generado se **lee** con un decodificador independiente y devuelve la URL exacta; "Imprimir" deja visible solo la tarjeta elegida | `qr.test.ts` QR-01; e2e QR-01/05/06 (vista previa en medio impreso) |
| QR-02 | El cliente obtiene código + QR de pedido, reserva y beneficio; el comercio los consulta y canjea | pedido listo → retirado/servido · reserva confirmada de hoy → llegada | `MisCodigos`, `QrDisclosure` en pedido, reserva y beneficios, `code/redeem` | el canje reusa `order/deliver` y `res/arrive`; repetir la operación (doble clic) o volver a escanear no repite el efecto ni agrega otro registro de canje | `qr.test.ts` QR-02; e2e QR-02 |
| QR-03 | Estados | válido, desconocido, vencido, cancelado, usado, duplicado, negocio incorrecto, sede incorrecta, cupo agotado, no elegible, revertido | `checkCode` (función pura), `CodeResultCard`, landing `/:biz/q/:tipo/:ref` | cada estado sale del store; lo de otro negocio no muestra nada; un cliente solo ve lo suyo (lo ajeno es "desconocido"); reclamar la campaña respeta audiencia, cupo y tope por cliente | `qr.test.ts` QR-03 (23 pruebas en total); e2e QR-03 |
| QR-04 | Escaneo por acción explícita, alternativa manual y flujo sin cámara | cámara apagada → pidiendo permiso → activa → apagada al leer | `Scanner`: botón de cámara, foto del QR, texto a mano; "simular" en Códigos | abrir la pantalla no pide la cámara (`getUserMedia` = 0 llamadas hasta el clic); se apaga al leer, al detener y al salir; errores de permiso con alternativa | e2e QR-02 (foto), QR-04 (cámara falsa), QR-03 (simulado) |
| QR-05 | Sin datos personales ni secretos en la URL | — | `qrPath`, `parseScan` | la ruta solo trae negocio, tipo y referencia pública; lo que el QR diga de precios o estados se ignora | `qr.test.ts` QR-05; e2e QR-01/05/06 |
| QR-06 | Límite de localStorage | — | panel "Qué puede y qué no puede esta demo", `storageUsage` | se explica que dos dispositivos no se sincronizan solos, que cliente y comercio se prueban en el mismo navegador cambiando de rol y que el almacenamiento tiene tope (con el uso aproximado medido) | e2e QR-01/05/06 |

### Verificación de lectura (qué se comprobó de verdad)
- **Lectura real de la imagen:** el QR de un pedido se captura como imagen y se sube al lector, que lo decodifica y valida contra el store (e2e QR-02). Además, `qr.test.ts` decodifica con `jsqr` los módulos generados.
- **Lectura por cámara:** se comprobó con el dispositivo de video **falso** de Chromium, alimentado con un archivo que muestra el QR. Eso prueba el camino completo (permiso, flujo de video, decodificación, apagado), pero **no** se probó con una cámara física ni con un teléfono.
- **Simulación:** el selector de casos de ejemplo lee exactamente la URL que traería un QR, sin cámara.

### Qué cambió en lo existente (con motivo)
- `makeBenefit` se extrajo de `issueBenefits` para que el reclamo por QR emita un beneficio con el mismo código y vencimiento, sin registrar un envío que no ocurrió.
- Mi pedido recuerda por pestaña la mesa leída con el QR (`sessionStorage`) y la elige si el pedido todavía no tiene mesa.
- Nueva sección de administración "Códigos" (recepción, mozo, caja y encargado) y "Mis códigos" en la navegación del cliente.

### Límites declarados de L7
- **Sin sincronización entre dispositivos:** un QR leído en otro teléfono no ve los datos de este navegador. La demo lo muestra con roles en el mismo contexto local.
- **Un código no es seguridad:** cualquiera con el enlace puede abrir la landing; por eso la landing solo muestra datos al dueño del código.
- **Cámara física no verificada:** solo con dispositivo falso de Chromium; los errores de permiso se probaron por reglas, no con un teléfono real.
- **Beneficios:** el comercio verifica el código pero no lo consume: se canjea al enviar el pedido (L6).
- **Hash de rutas:** los QR apuntan a `#/…` porque la app se aloja en una ruta de GitHub Pages sin servidor de rutas.

## L8 · Motion graphics, animaciones transaccionales y temporadas (SDD)
Construido el 18/10/2026 sobre `main` (con L7 integrado). La coreografía completa (principios, línea de tiempo, piezas, interrupción y aceptación) está en `motion.md`, sección "P5-L8". **Esquema 4 → 5:** se agrega `settings.seasonWindowByBusiness`, con migrador explícito.

### Requisito → escenario → estados → componentes → aceptación → prueba
| ID | Escenario | Estados | Componentes | Aceptación | Prueba |
|---|---|---|---|---|---|
| MO-CAF/HEL/RES/BAR/FR | Al aceptarse el pedido, la composición de su contenido real termina en su comprobante | enviado (tilde "Enviado (simulado)") → aceptado: se reproduce → cierre quieto | `motion-plan.ts` (puro), `OrderMoment`, `Moments` en el seguimiento | entre 1,4 y 2,7 s; capas del pedido real (gustos elegidos, ingredientes sin lo sacado, medialunas y tazas del pedido); alcohol nunca dibujado; sin pieza → glifo de su categoría | `motion-plan.test.ts` (13); e2e: las cinco piezas y el pago en el local |
| MO-RES (reserva) | Al confirmarse la reserva de Mesa Clara, la mesa se prepara para la cantidad de personas | solicitada → confirmada | `ReservationMomentFor` en el detalle de la reserva | hasta 6 lugares y panera; termina en el folio | e2e MO-RES con reserva |
| MO-REGLAS | Reproducir no crea, cobra ni canjea; se persiste el evento, no la animación | se reproduce una vez por pestaña; abierto ya aceptado → quieto | regla de visto (`sessionStorage`), `plan` sin efectos | "Ver de nuevo" no toca el store; un rechazado o un comando fallido no muestra aceptación | e2e: error, doble clic, navegación |
| MO-INT | Interrupción y accesibilidad | reproduciendo → (Omitir / Escape) → quieto | botón "Omitir" aparte de "Ver de nuevo" (deshabilitado mientras corre) | sin animaciones vivas ni temporizadores después de omitir, terminar o salir; escenario decorativo con rótulo y comprobante en texto | e2e interrupción; axe a 1280 y 390 px |
| MO-RM, MO-SND | Movimiento reducido y sonido | reducido → cierre directo | `prefersReducedMotion`, `sfx` | por sistema y por consola: sin animaciones ni "Ver de nuevo"; sonido apagado: 0 `AudioContext` | e2e (dos variantes de movimiento reducido, sonido) |
| MO-PERF | Rendimiento medido | — | solo transform/opacity; `PerformanceObserver('longtask')` y `requestAnimationFrame` en la prueba | MO-FR medido: 60 cuadros/s y ninguna tarea larga, con 0 animaciones vivas al terminar | e2e rendimiento |
| MO-LOAD | Carga técnica | carga del chunk → esqueleto con forma (carta, seguimiento, tablero) | `RouteLoader` (`data-shape`) | aparece solo si tarda (retardo de 180 ms en CSS), sin duración mínima | e2e carga (chunk demorado a propósito) |
| TE-01 | Temporadas independientes del modo claro u oscuro | automática · manual sin fin · manual con inicio y fin (fuera de rango rige la automática) | `config/season` con `window`, `activeSeason`, `SeasonSettings`, `SeasonScene` | vista previa sin activar; cada identidad tiene su escena (composición, arte y movimiento ambiental de dos ciclos); nunca crea campañas ni beneficios | `season-window.test.ts` (6); e2e TE-01 |
| TE-KIDS | Juegos con variante de temporada | — | `GameFrame` con `season` | el marco muestra el acento de la temporada; el juego del bar sigue sin alcohol | e2e TE-01 |

### Clips y capturas
- Clips WebM reales de las cinco piezas en `screens/p5-l8/clips/`, con un cuadro de mitad de pieza cada uno.
- **Cómo se grabaron:** cuadros del screencast de Chromium (CDP) codificados con el ffmpeg que ya trae el entorno de Playwright. El grabador de video de Playwright pedía otra versión de ffmpeg y no se descargó nada.
- Capturas del cierre de cada pieza y de la reserva, escenas de temporada por identidad (claro y algunas en oscuro), Configuración con modo manual y vista previa, y el juego con el acento.

### Qué cambió en lo existente (con motivo)
- `SCHEMA_VERSION` 4 → 5. Los tests que fijaban la 4 (persistencia, L5, growth y la migración e2e de P3) se actualizaron con ese motivo.
- La banda de temporada del inicio muestra la escena de la identidad en lugar del ornamento solo.
- Configuración reemplaza el selector único por modo automático o manual (con fechas) más una vista previa.
- El vino de Mesa Clara no tiene la etiqueta `+18`, así que el plan lo reconoce también por su descripción.

### Límites declarados de L8
- La regla de "se reproduce una vez" es por pestaña: otra pestaña o un recargo con almacenamiento bloqueado muestran el cierre quieto.
- El ritmo de los clips depende de los cuadros que entrega el screencast (entre 100 y 170 en 3 s). Para llegar a 25 cuadros/s se repite el último recibido; no se interpola.
- Las escenas de temporada fuera de la característica de cada identidad usan su composición base con el acento de la época.
