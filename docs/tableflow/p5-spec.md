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
| Recorridos RP/RO | C P (base existente) | C P (existente) | E | E | E |
| Retiro con pago en local | E (hoy: pago DEMO en caja) | n/a | E | n/a | E |
| Propuestas visuales (L2) | C P · 3 conceptos | C P · 3 conceptos | C P · 3 conceptos | C P · 3 conceptos | C P · 3 conceptos |
| Identidad visual elegida (L2) | B · espera a Ignacio | B · espera a Ignacio | B · espera a Ignacio | B · espera a Ignacio | B · espera a Ignacio |
| Shell, header, modo oscuro (L3) | E | E | E | E | E |
| Arte propio (L4) | C (estilo actual) | C (estilo actual) | E | E | E |
| Juego infantil propio (L5) | C compartido → E | C compartido → E | E | E | E |
| Growth y asistentes (L6) | E | E | E | E | E |
| QR y códigos (L7) | parcial (códigos) | parcial | E | E | E |
| Animación transaccional (L8) | E | E | E | E | E |
| Escenas y guía (L9) | E | E | E | E | E |
| QA y kit (L10) | E | E | E | E | E |

**Aceptación de L1**: cada requisito nuevo tiene ID y lote; ningún negocio queda reducido a una portada o a una escena (cada uno tiene al menos un RP y un RO de punta a punta).

## Registro de elección visual (L2)
| Negocio | Recomendada | Elección de Ignacio |
|---|---|---|
| Cafetería | cafe-2 Kissaten | pendiente |
| Restaurante | resto-2 Bodegón contemporáneo | pendiente |
| Heladería | hela-1 Escultórica lúdica | pendiente |
| Bar gastronómico | bar-3 Compás musical | pendiente |
| Comida rápida | rapida-1 Energía brutal | pendiente |
Detalle y evidencia: `p5-l2-propuestas.md`.
