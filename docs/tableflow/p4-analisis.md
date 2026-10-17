# Análisis por fases · P4 "menos relleno, más oficio"

> Fecha real 17/10/2026 · base: `9bfc3d5` (P3 cerrado). Pedido del operador: *"siento que hay mucho AI slop… análisis por fases para hacerlo mejor, sobre todo SVGs, estructura por página y UX/UI; que se sienta premium y de miles de dólares"*. Método: 64 capturas de página completa (32 rutas × 1440 y 390 px, movimiento reducido), revisión pantalla por pantalla y lectura del código de cada vista. Este documento es el diagnóstico; las fases P4-B…F lo ejecutan.

## 1. Qué es "relleno genérico" en esta demo (patrones encontrados)
| # | Patrón | Dónde | Por qué resta |
|---|---|---|---|
| S1 | **Aviso de demo repetido** en cada pantalla además del banner: "Negocio FICTICIO de la demo", "no se cobra nada en la demo", "(simulado)", "de muestra", "Sin datos inventados", el callout azul "Todo lo que ves acá se deriva del mismo estado local…" al pie de **cada** sección admin, y el pie del sitio | Inicio, carta, pedido, pasaporte, reportes, todo admin | El banner DEMO ya es permanente: la repetición suena defensiva y tapa la propuesta. Un producto premium dice una vez lo importante y etiqueta solo lo que es simulación en el lugar donde ocurre (pagos, canales, regalos) |
| S2 | **Instrucciones de la demo dentro del producto** ("Recorrido guiado 01–05" en el inicio del cliente, "Verme como Ana (cliente recurrente)" en pasaporte y reservas) | Inicio MC/RC, Pasaporte, Reservar | Rompe la inmersión: la guía es de quien muestra la demo, no del comensal. Debe vivir en la capa de demo (consola) |
| S3 | **Copy de ingeniería en la vista cliente**: "Canal: web · operación OP-0009 · hilo COR-0117. Importe informativo", "Aviso local (fallido): …", "Derivado de pedidos; no es caja ni beneficio" | Seguimiento, Resumen | Es metadato técnico; para el cliente es ruido, para el equipo va plegado |
| S4 | **Callouts azules como contenido** (reglas del pasaporte, política del café, explicación de tarjetas) | Explorar, Pasaporte, Inicio RC, Reportes | El bloque azul es el recurso por defecto de la UI generada: no jerarquiza, solo "avisa" |
| S5 | **Rejillas de tarjetas iguales** (ícono + título + 2 líneas) y eyebrow + H2 en cada sección | Landing (roles), pasaporte, catas, kids, admin | Todo pesa lo mismo; no hay protagonista por pantalla |
| S6 | **Mezcla de glifos de línea con ilustraciones** | Landing (tapas de marca), encabezados de categorías, vitrina | Dos sistemas visuales compitiendo; los glifos se ven de plantilla junto a las ilustraciones |
| S7 | **Héroes sin imagen** | Landing, inicio MC/RC | La ilustración existe pero no es protagonista; un restaurante premium abre con su comida |
| S8 | **Tablas que se parten**: hora "12:3 / 0", folio "R- / 002", 3–4 botones de contorno por fila en dos renglones | Reservas admin, Pedidos, Clientes | Sensación de borrador; el equipo no escanea |
| S9 | **Filtros apilados a ancho completo** (falta `display:flex` en `.filters`: regresión de estilo) | Reportes, Reservas, Pedidos | Ocupan media pantalla antes del dato |
| S10 | **Gráficos de mentira**: barras sin eje ni escala, todas casi iguales | Reportes | Un dato sin escala no informa |
| S11 | **Ícono duplicado**: "Resumen" y "Secciones" usan el mismo glifo en la barra inferior admin | Admin móvil | Ambigüedad |
| S12 | **Ornamentos de temporada y personajes estilo clip-art** (destellos de 4 puntas, ojos con doble brillo) y platos 100 % vectoriales planos | Arte, banda de temporada, regalos | Leen como banco de íconos; falta "mano" editorial (línea de tinta, grano, imperfección controlada) |

## 2. SVGs: evaluación y dirección
**Lo que funciona**: luz única, vajilla por marca, salsas orgánicas, latte art, una pieza por plato, ids por instancia, peso liviano.
**Lo que delata generación**: contornos inexistentes (todo es mancha), sin textura, sombras uniformes, platos con composición idéntica (todo centrado en un disco), guarniciones repetidas, destellos genéricos en ornamentos.

Dirección v2 ("ilustración editorial de carta"):
1. **Línea de tinta** cálida y de peso variable sobre las formas principales (como grabado de carta de bodegón), y **grano de papel** sutil multiplicado sobre la pieza (filtro único compartido).
2. **Firma por marca**: una ilustración de héroe grande por negocio — *la mesa larga* de Mesa Clara (mantel, platos para compartir, pan, vino, cubiertos) y *la barra* de Ritual Café (tazas, V60, vitrina) — que abre el inicio y la landing.
3. **Ornamentos y personajes**: sin destellos de 4 puntas; ornamentos como viñetas de grabado (hojas, flores, guirnalda) con la misma línea de tinta; personajes con contorno y brillo único.
4. **Íconos de categoría** de la carta como mini viñetas ilustradas del mismo sistema (no glifos de línea).

## 3. Estructura por página (protagonista, secundario, salida)
| Página | Hoy | Propuesta |
|---|---|---|
| Landing | Titular + 2 tapas con glifo + 5 tarjetas de rol + 2 links | Héroe con las dos ilustraciones firma; tapas de marca con su pieza; "qué podés recorrer" en 3 momentos con fragmentos reales (ticket, comanda, tarjeta de regalo); roles como lista compacta |
| Inicio MC / RC | Texto + pizarra; banda; línea del día; catas + recorrido guiado | Héroe con ilustración firma a sangre y pizarra superpuesta; banda de temporada; "hoy" como franja; catas como cartel con fecha grande; sin guía de demo |
| Carta | Muy buena | Leyenda de alérgenos plegable; encabezados de sección con viñeta ilustrada |
| Reservar | Formulario largo + "Mis reservas" vacío | Dos columnas: pasos a la izquierda, **resumen vivo tipo ticket** a la derecha (día, personas, hora, sector) con el botón; "Mis reservas" solo si hay |
| Mi pedido / Seguimiento | Correcto; metadatos técnicos visibles | Seguimiento con estado protagonista (personaje + paso actual + código de retiro como ticket); detalle técnico plegado |
| Explorar / Pasaporte | Tarjetas de texto + callouts de reglas | Pasaporte como **libreta**: sellos ilustrados, progreso, insignia; reglas en "Cómo funciona" plegable; tarjetas con viñeta |
| Catas / Ayuda | Listas | Cartel de evento con fecha grande y cupo visual |
| Regalar / Regalo / Chicos | Nuevos, bien resueltos | Ajustes de ritmo y del sistema de ornamentos v2 |

## 4. Lado profesional
- **Shell**: rótulo de rol compacto (una línea), sin callout repetido al pie; consola con "Guía de la demo".
- **Reservas**: agenda compacta por servicio (hora en una línea, folio sin corte, personas como número fuerte), **una acción primaria** por estado y el resto en "Más" (menú); filtros como barra de herramientas.
- **Reportes**: barra de filtros real (bug), KPIs en tiras, **gráfico de barras con eje, escala y valores** (pedidos por estado) y separación clara ventas ≠ caja.
- **Caja, Pedidos, Clientes, Stock, Automatizaciones**: el mismo sistema de tabla (cabecera fija, cifras tabulares, IDs sin corte, acciones agrupadas).
- **Barra inferior admin**: ícono propio para "Secciones".

## 5. Fases
| Fase | Alcance | Criterio de salida |
|---|---|---|
| **P4-B · Voz y ruido** | S1–S4: avisos centralizados (banner + etiquetas solo donde hay simulación), guía de la demo en la consola, copy de cliente sin metadatos, callouts reducidos a lo imprescindible | Ninguna pantalla repite el aviso general; las etiquetas DEMO siguen en pagos, comprobantes, canales y regalos; pruebas en verde |
| **P4-C · Arte v2** | Línea de tinta + grano, ilustraciones firma por marca, ornamentos y personajes sin clip-art, viñetas de categoría, ícono "Secciones" | Galería `#/arte` revisada a 2× sin defectos; héroes con ilustración |
| **P4-D · Estructura cliente** | Landing, inicio, reservar, seguimiento, pasaporte/explorar, catas según §3 | Cada pantalla con un protagonista claro; capturas 1440/390 sin desbordes |
| **P4-E · Estructura profesional** | Filtros, reservas como agenda con acciones agrupadas, reportes con gráfico real, tablas consistentes | Tablas sin cortes a 1280 y 768; axe limpio |
| **P4-F · QA y cierre** | Pruebas nuevas y de regresión, capturas `screens/p4` antes/después, docs, PR | 193+ unitarias y 65+ E2E en verde; CI verde |

Restricciones que se mantienen: solo frontend local, datos ficticios, banner DEMO y etiquetas de simulación donde corresponda, sin fotos de terceros, movimiento reducido respetado, sonidos apagados por defecto.
