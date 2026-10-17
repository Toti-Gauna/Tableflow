# Sistema visual P2 · "carta de casa"

> Dirección de diseño de TableFlow para la demo de Mesa Clara y Ritual Café (negocios ficticios). Este documento describe tokens, tipografía, componentes, estados, assets y licencias, y deja registrada la crítica que motivó cada decisión. **No certifica accesibilidad**: las verificaciones automáticas y medidas se listan en `coverage.md`.

Fuente única de los tokens: `src/styles.css` (sección `:root` y `[data-biz='ritual-cafe']`). Glifos: `src/ui/glyphs.tsx`. Pares de contraste medidos: `tests/contrast.test.ts`.

## 1. Crítica de partida (P1, capturas en `screens/p1/`)
| Problema observado en P1 | Consecuencia | Decisión P2 |
|---|---|---|
| Barra de controles de demo de ~130 px en cada pantalla; en móvil 3–4 líneas | El producto quedaba por debajo de la herramienta | Banner DEMO fijo de una línea + consola oscura en una fila (≥1280 px) y plegable ("Controles") en pantallas menores, con el reloj siempre visible |
| Portada con dos tarjetas genéricas | Sin identidad ni jerarquía | Tapas por marca (pizarra verde / espresso), titular editorial y accesos de personal con tarea |
| Carta con avatar de inicial, píldoras de alérgenos por plato y botón verde "Elegir" en cada fila | Ruido de CTA; aspecto de plantilla | Mesa Clara: carta impresa (secciones centradas, líneas de puntos, precio tabular, descripción en itálica, códigos de alérgenos con leyenda y texto completo para lectores) |
| Ambas marcas idénticas salvo el nombre | Identidad = paleta | Ritual Café cambia la **composición**: pizarra de barra con columnas Chico/Mediano derivadas del modificador real, vitrina de pastelería con ilustración propia, ritmo de retiros por franja |
| Detalle del plato con el CTA debajo del pliegue a 900 px y subtotal chico | Riesgo de no ver el error ni el total | Configurador con cabecera ilustrada, requisitos por grupo ("Obligatorio · elegí 1" → "Listo"), pie fijo con cantidad y total dentro del botón; hoja inferior en móvil |
| Navegación cliente en 3 filas en móvil; cabecera de ~360 px | Contenido al fondo | Masthead compacto y navegación de una fila con desplazamiento horizontal propio (el activo se centra solo) |
| KPIs del admin como tarjetas vacías; botones "Resolver" altos | Densidad baja | Franja de KPIs, listas de revisión/alertas con ícono y conteo |
| KDS con tiempos partidos ("130 / min") y demora solo por borde rojo | Información por color | Tablero oscuro, tickets en papel a 18 px, demora con ícono + "Tarde · N min", espera de retiro y cancelación pendiente diferenciadas |

### Ronda de crítica sobre la primera muestra (carta + configurador + KDS) y correcciones
Se aplicó primero la muestra, se capturó a 1440/1280/390/320 y se corrigió antes de extender:
1. **Consola en dos filas a 1440 px** (el botón "Controles" seguía visible por especificidad CSS) → selector corregido, movimiento reducido como botón compacto con texto accesible, sedes sin el prefijo de marca, punto de quiebre movido a 1280 px tras medir que a 1180 no entra en una fila.
2. **Pie del configurador a 320 px partía "Agre-gar" y el precio** → en ≤440 px el botón apila rótulo pequeño y total grande; la ilustración del plato se oculta para dar lugar al título.
3. **ID de comanda roto letra por letra junto al chip "Esperando retiro"** → cabecera del ticket con `flex-wrap` y ID sin corte.
4. **KDS en 3 columnas + "Listos" en segunda fila a 1440 px** → 4 columnas fijas desde 1100 px.
5. **"Listos" medía tiempo de preparación (90 min "tarde")** → un pedido listo mide la espera de su retiro; la demora de preparación solo aplica a "Preparando".
6. **Filas de la pizarra en móvil con descripción en 3 líneas** → nombre a ancho completo y códigos + precios en la segunda fila, alineados a sus columnas.
7. **Panel de la mesa elegida debajo de 12 llegadas en móvil** → grilla por áreas: plano, panel, llegadas; al elegir una mesa el foco va al panel.
8. **Foco de teclado detrás del carrito fijo** (detectado por la prueba S43) → `scroll-padding-bottom` del alto del carrito en pantallas sin columna lateral.
9. **"En mi mesa / Retiro en barra" partido dentro de la píldora a 320 px** → opciones apiladas a ancho completo en ≤480 px.
10. **Al cambiar de pantalla se heredaba el scroll de la anterior** (una captura salió en blanco) → cada navegación empieza arriba.
11. **Importe del ticket partido y cortado a 320 px** ("$ 6.600,0") → los importes no se parten nunca; S43 lo verifica.

## 2. Tokens
### Color (texto: AA 4,5:1; componentes: 3:1 — medidos en `tests/contrast.test.ts`, 61 pares)
| Token | Mesa Clara | Ritual Café | Uso | Contraste medido |
|---|---|---|---|---|
| `--paper` | `#f7f3ea` | `#f5efe6` | fondo con grano | — |
| `--ink` | `#1f271e` | `#241a14` | texto | 13,87 / 14,90 sobre papel |
| `--muted` | `#566052` | `#5e5247` | texto secundario | 5,94 / 6,62 sobre papel |
| `--brand` | `#355443` | `#2b1d15` | botón primario, selección | blanco/crema sobre marca 8,40 / 14,13 |
| `--accent` | `#a44431` | `#8a4b26` | detalle editorial, numerales, activo | 5,50 / 5,90 sobre papel |
| `--board` / `--chalk` | `#233528` / `#f3ebd9` | `#2b1d15` / `#f6eedf` | pizarras, tapas, llamada | 10,98 / 14,13 |
| `--chalk-dim` | `#c9d2c3` | `#d8c8b1` | texto secundario sobre pizarra | 8,37 / 9,94 |
| `--review` / `--review-bg` | `#5b3a7a` / `#efe7f6` | igual | revisión humana (tono propio) | 7,48 |
| `--ok` `--warn` `--err` `--info` | `#276a3b` `#7a4b00` `#9c2316` `#1e4f7a` | igual | estados (siempre con ícono + texto) | ≥ 4,5 sobre su fondo |
| Consola | `#1f281e` fondo, `#f3f6ef` texto, `#7d8a7a` borde | igual | instrumento de demo | 11,87 texto · 4,19 borde |
| Admin lateral | `#141b13` / `#e8ece4` | igual | navegación de personal | 14,67 |
| KDS | `#101510` / `#1a221a`, tickets `#fbf9f4` | igual | tablero de cocina | 13,63 / 14,60 |
| Foco | `#0b57d0` (claro) · `#8ab4f8` (oscuro) | igual | contorno de 3 px | ≥ 3:1 en todos los fondos medidos |

Decorativos sin información (líneas de puntos, filetes `--rule`, guiones de tamaño ausente marcados `aria-hidden`) no entran en la medición.

### Tipografía
- **Fraunces Variable** (títulos, nombres de platos, numerales): ejes `opsz` (automático), `wght` 440–620, `SOFT` y `WONK`. Mesa Clara: `'SOFT' 100, 'WONK' 1` (cálida, de carta de bodegón). Ritual Café: `'SOFT' 0, 'WONK' 0` y nombre en itálica (pizarra de barra). Respaldo: Georgia, Times New Roman.
- **Manrope Variable** (interfaz, admin, KDS): 600–800; cifras `tabular-nums lining-nums` en precios, horas y contadores. Respaldo: system-ui.
- Escala: h1 `clamp(2rem, 4.6vw, 3rem)` (inicio/portada hasta 4,5 rem), h2 `clamp(1.3rem, 2.8vw, 1.7rem)`, texto 16 px, KDS ≥ 18 px (ítems 19 px).
- Admin y KDS usan solo Manrope: sobriedad operativa.

### Espacio, radios, capas
Base 4/8 (`--s1`…`--s8`), márgenes laterales 16/24/40 px. Radios 14 px (tarjetas), 18–22 px (pizarras y tapas), 999 px (píldoras). Sin sombras pesadas ni vidrio: el relieve sale del papel con grano (SVG `feTurbulence` local en `--grain`) y de los filetes.

## 3. Componentes (dónde viven)
| Componente | Clase / archivo | Notas |
|---|---|---|
| Banner DEMO + consola | `.demo-banner`, `.console` · `ui/Shell.tsx` | banner fijo que mide su altura (`--banner-h`) para los sticky; consola en una fila ≥1280 px |
| Masthead de marca | `.masthead`, `.wordmark`, `.service-chip` · `client/ClientLayout.tsx` | estado del servicio según el reloj simulado |
| Carta impresa (MC) | `.menu-cat`, `.dish` · `client/Carta.tsx` | líneas de puntos, códigos de alérgenos (`ui/food.tsx`) |
| Pizarra de barra (RC) | `.barboard`, `.drink` | precios por tamaño desde `MG-tamano`; lector: "Chico: $ 5.800" |
| Vitrina (RC) | `.vitrina`, `.pastry`, `Plate` | ilustración propia con `aria-label` "Ilustración de muestra… (sin foto)" |
| Configurador | `dialog.item`, `.opt-group`, `.item-foot` | requisitos por grupo, error junto al grupo, total en el botón |
| Ticket de pedido | `.ticket-paper`, `.receipt` | borde dentado por máscara, sin imágenes |
| Seguimiento | `.track`, `.folio`, `.pickup-code` | progreso horizontal; vertical en móvil |
| Reservas | `.date-chips`, `.party`, `.slot-group` | horarios agrupados por servicio |
| KDS | `.kds-board`, `.kds-col`, `.ticket` · `admin/Cocina.tsx` | avance por botón, sin arrastre |
| Plano del salón | `.floorplan`, `.zone`, `.table-chip[data-seats]` | 2 = redonda, 4 = cuadrada, 6/8 = rectangular; plano y lista con las mismas acciones |
| Caja | `.ledger`, `.accounts`, `.split` | partes, saldo y ajuste de centavo explícitos |
| Pasaporte | `.pp-steps`, `.pcard`, `.medal`, `.stamps` · `ui/passport.tsx` | estados visibles y "Pedir mi selección" con revalidación |

## 4. Estados (nunca solo color)
| Estado | Señal | Texto |
|---|---|---|
| Reserva solicitada | badge aviso `◔` + filete ámbar | "Solicitada" · "el equipo todavía debe confirmarla" |
| Reserva confirmada | badge ok `✓` | "Confirmada en mesa M5 (salón)" |
| Revisión humana | badge **violeta** `⚑` (tono propio) | "Revisión humana" · "no se acepta automáticamente" |
| Alternativa ofrecida | badge info `⇄` | "El equipo ofrece 21:45" |
| Agotado / fuera de franja | sello "AGOTADO" + nombre tachado | "Este plato se agotó… Alternativas de la misma categoría: …" |
| En preparación / tarde | temporizador `⏱ N min` → rojo `⚠ Tarde · N min` | umbral de muestra 10 min |
| Listo / espera de retiro | `✓ Esperando retiro` → ámbar `⚠ Retiro demorado · N min` | |
| Cancelación pendiente | caja violeta en ticket y badge en pedidos | "Cancelación pendiente: … hasta que el encargado decida" |
| Retirado / servido | badge ok `✔` | |
| Promoción bloqueada | vista previa "Omitidos (sin consentimiento promocional)" | servicio y promoción por separado |
| Pasaporte | pasos con punto lleno + texto | Sin empezar · En curso · Insignia disponible · Selección guardada · Reiniciado |

## 5. Assets y licencias
| Asset | Origen | Licencia / derechos |
|---|---|---|
| Fraunces Variable | `@fontsource-variable/fraunces` (archivos `full` y `full-italic`) servidos desde el build | SIL Open Font License 1.1 |
| Manrope Variable | `@fontsource-variable/manrope` | SIL Open Font License 1.1 |
| Glifos de platos e interfaz | dibujados para esta demo (`src/ui/glyphs.tsx`, trazo de 1,5 px en grilla de 24) | propios del proyecto |
| Grano de papel | SVG generado en CSS (`feTurbulence`), sin archivo externo | propio |
| Fotos | **ninguna**. No se usan fotos de terceros ni de prospectos; cada pieza muestra una ilustración con texto "sin foto de muestra" | — |

No hay CDN, Google Fonts ni imágenes remotas (lo verifica la prueba de red de `quality.spec.ts`).

## 6. Accesibilidad aplicada (medida, no certificada)
Formularios con `label` asociado y ayudas/errores por `aria-describedby`; errores con `role="alert"` junto al campo o grupo; región viva discreta para confirmaciones (los avisos visuales son eco, un solo aviso a la vez); objetivos ≥ 44 px; foco visible de 3 px y restaurado al cerrar diálogos nativos; foco que no queda tapado por banner, categorías ni carrito (prueba S43); sin scroll horizontal a 320/390/768/640 (zoom 200 %)/1440 px; contraste de tokens medido. axe-core sin violaciones serias/críticas en 21 pantallas. Pendiente: lector de pantalla real y revisión manual con usuarios.

---

# P3 · ilustración, personajes, temporadas y plataforma

> Análisis previo con hallazgos y prioridades: `p3-analisis.md`. Capturas: `screens/p3/`.

## Sistema de ilustración (`src/ui/art/`)
- **Una sola mano**: grilla de 160 × 160 (platos) y 120 × 120 (personajes y temporadas), luz cenital desde arriba a la izquierda, sombra abajo a la derecha, gradientes por material (porcelana con filete verde de Mesa Clara, gres moteado de Ritual Café, hierro, madera, vidrio) y brillos especulares suaves. `kit.tsx` concentra vajilla y guarniciones (salsas orgánicas, papas, limón, albahaca, tomates, romero, migas y salpicados deterministas con `mulberry32`).
- **42 piezas**, una por ítem (`mesa-clara.tsx`, `ritual-cafe.tsx`): platos vistos desde arriba; métodos de filtrado de perfil; tazas con *latte art* (corazón, tulipán, roseta). Sin fotos, marcas ni assets de terceros. Cada SVG lleva su propio prefijo de ids (`useId`), así dos ilustraciones iguales no comparten gradientes.
- Uso: renglón de carta (84 px, 64 px en móvil), pizarra de barra (56 px), vitrina (120 px), configurador (168 px; 136 px como protagonista de la hoja móvil), pizarra del inicio, métodos, pedido, regalo, sección infantil y carta admin. En listas es decorativa (`aria-hidden`); en el configurador se anuncia como "Ilustración de muestra de … (sin foto)".
- Galería de revisión: `#/arte` (platos, personajes con sus 7 expresiones y ornamentos de temporada).

## Personajes (`characters.tsx`)
**Ñoqui** (Mesa Clara, con gorro de cocina), **Granito** (Ritual Café, grano con brote) y **Tomatito** (sección para chicos). Expresiones: feliz, guiño, pensando, festejo, dormido, triste, sorpresa, armadas con piezas compartidas de cara y brazos. Aparecen en estados vacíos (carta sin resultados, pedido vacío), 404 y folios inexistentes, sobre de regalo, sección para chicos y cargador de sección. Decorativos salvo cuando la expresión aporta información (memotest ganado).

## Temporadas (`src/domain/season.ts`, `src/ui/art/season.tsx`)
- Automáticas por **día simulado** (hemisferio sur): primavera 21/9–20/12, verano, otoño, invierno; fechas especiales con prioridad: Fiestas (1/12–6/1), San Valentín (7–15/2), Día del Padre y de la Madre (tercer domingo de junio/octubre, ventana previa y unos días después), Día del Amigo (13–22/7). El seed (lun 19/10/2026) cae en la ventana del Día de la Madre ("fue ayer: todavía estás a tiempo").
- Cada temporada define acento (`--season-a/b/ink/tint` por `[data-season]`), ornamento ilustrado, titular y texto por negocio, tres platos sugeridos que existen en la carta (lo verifica `tests/season.test.ts`) y un mensaje sugerido de regalo.
- Se ve en el distintivo del encabezado, la banda del inicio, el formulario y la tarjeta de regalo, y la vista previa de Configuración. **Configuración → Experiencia del cliente** permite forzar una temporada por negocio (auditado como `config.season`) o volver a automática. No cambia precios ni carta.

## Invitar a comer
- Tarjeta (`src/ui/gift.tsx`): banda de temporada con ornamento, plato ilustrado, "Para …", titular serif con el plato en el acento de la temporada, mensaje en itálica y pie con código (`MC-7KQ4`, sin 0/O ni 1/I/L) y vencimiento. Siempre con sello DEMO.
- Flujo en cuatro pasos numerados con vista previa en vivo (columna fija en escritorio); sobre que se abre para quien recibe; sello "Canjeada / Vencida / Cancelada" sobre la tarjeta; línea "Invitación … · cubre $" en el configurador, Mi pedido, seguimiento, Pedidos y Caja.

## Plataforma
- **Barra inferior**: cliente ≤ 760 px (Inicio, Carta, Pedido con contador, Regalar, Secciones) y administración ≤ 999 px (hasta 4 secciones del rol + Secciones con el resto agrupado). Con *safe area*, fondo translúcido con desenfoque y píldora del activo. Arriba queda el encabezado compacto; el pedido flota como píldora encima de la barra y los avisos suben por encima de ambos.
- **Hoja "Secciones"**: diálogo modal (hoja inferior en móvil) con ícono, nombre y una línea de ayuda por sección.
- **Carga**: pantalla estática en `index.html` y carga diferida por ruta (bundle inicial 307 KB / 93 KB gzip, antes 676 KB); cargador con esqueleto y personaje.
- **Lado profesional**: entidades con nombre humano ("Reserva R-012 · Ana, 4 personas", "Insumo I-07 · Leche de avena"), tipo de tarea en español, detalle técnico plegable (IDs, hilo, claves de idempotencia), disponibilidad corta en la carta admin ("Agotado · sin insumos") con miniatura, filtros compactos, KPIs 2 × 2 en móvil, horas de 24 h sin cortes.


---

# P4 · oficio sobre relleno

> Diagnóstico: `p4-analisis.md`. Capturas: `screens/p4/`.

- **Capa de demo vs. producto.** El banner DEMO es el aviso general; dentro del producto solo se etiqueta lo simulado donde ocurre (pagos, canales, regalos). Lo que es de la demo (verme como Ana, avisos fallidos simulados, rol cliente en admin) usa `DemoHint`: sello DEMO + borde punteado, visualmente distinto de cualquier contenido. La guía de recorridos vive en la consola (*Guía de la demo*).
- **Acabado de grabado** (`Finish` en `kit.tsx`): filtro SVG por pieza con línea de tinta (detección de bordes sobre la luminancia, color tinta 56 %) y grano de papel (ruido fractal al 30 %), activo desde 64 px (tinta) y 96 px (grano). Los personajes no lo usan.
- **Ilustraciones firma** (`hero.tsx`): *la mesa larga* (mantel con guarda verde, milanesa, sorrentinos, provoleta, ensalada, copas, cubiertos, servilleta, panera) y *la barra* (mostrador de tablas, granos, tazas con latte art, medialuna, tostado, roll). Se usan en portada, inicio y Reservar, recortadas con `slice` según el contenedor.
- **Viñetas de sección** (`CategoryMark`): cada sección de la carta abre con la miniatura de su plato representativo, no con un glifo de línea.
- **Una acción principal por fila** en tablas del equipo; el resto en `RowMenu` (posición fija para no cortarse dentro del contenedor con scroll; Escape devuelve el foco).
- **Gráficos** (`chart.tsx`): una serie en barras horizontales con eje y escala, grilla recesiva, valor al final de cada barra, detalle al pasar o enfocar y "Ver como tabla". Color de marca para la serie; el texto usa tinta, nunca el color de la serie.
