# Análisis UX/UI completo · antes de P3

> Fecha real 17/10/2026 · base: rama `claude/tableflow-demo` en `0d223dc` (P2 terminado, PR #2 abierto). Método: 26 rutas capturadas a 1440, 768, 390 y 320 px (52 capturas de recorrido + 25 de `screens/p2`), revisión heurística (Nielsen + WCAG 2.2 como guía, no certificación), lectura del código de cada pantalla y de las pruebas existentes. Las capturas de esta auditoría se generan con `npm run screens`; los hallazgos citan la pantalla.

## 1. Resumen ejecutivo
P2 dejó una base sólida: identidad por composición (carta impresa / pizarra de barra), estados con ícono + texto, KDS legible, foco y anchos verificados. Lo que todavía separa a la demo de un producto "de miles de dólares" es:

1. **Las ilustraciones son íconos de línea dentro de un plato**: correctas como placeholder, pero no generan apetito ni cuentan el plato. Es el déficit de mayor impacto visual en el lado cliente.
2. **No hay momentos de marca**: ni carga, ni celebración, ni personajes, ni temporada. Todo es informativo; nada es memorable.
3. **La navegación móvil es de escritorio comprimida**: la barra superior con desplazamiento horizontal esconde secciones ("Explorar sab…", "Salón…") y el carrito fijo convive con un aviso efímero que tapa contenido.
4. **El lado profesional sigue mostrando costuras técnicas**: nombres de entidad en inglés ("Reservation R-012", "Ingredient I-07"), mensajes de cliente en tablas de admin ("Este plato se agotó. Quitalo o elegí otra opción"), claves de idempotencia en el log de stock, filtros de Reportes a ancho completo, horarios con AM/PM cortado.
5. **Falta una capa social/afectiva**: no se puede invitar a alguien, regalar ni compartir; no hay propuesta para familias con chicos.

## 2. Hallazgos por pantalla (prioridad: P0 bloquea la percepción premium · P1 importante · P2 pulido)

### Lado cliente
| # | Pantalla | Hallazgo | Prioridad | Propuesta |
|---|---|---|---|---|
| C1 | Carta MC / RC, configurador, inicio | Ilustración = glifo de línea de 1,5 px en un disco; varios platos comparten el mismo dibujo (todas las pastas, todas las carnes) | **P0** | Set de 42 ilustraciones SVG propias, una por plato/bebida: vajilla con luz cenital, gradientes, brillos, salsas, vapor; café con *latte art* visto desde arriba |
| C2 | Toda la web | Sin pantalla de carga: el JS (676 KB) se descarga sin feedback; con red lenta la página queda en blanco | **P0** | Splash estático en `index.html` (marca + personaje, sin JS), carga diferida por ruta y cargadores/esqueletos con la marca |
| C3 | Móvil (390/320) | Navegación superior con scroll horizontal: 3 de 8 secciones quedan fuera de vista; el pulgar no llega arriba | **P0** | Barra inferior de pestañas (Inicio, Carta, Pedido con contador, Regalar/Pasaporte, Más) con *safe area* y el resumen del pedido integrado encima |
| C4 | Carta, Mi pedido (móvil) | El aviso efímero ("Flat white agregado…") tapa el borde inferior y el último campo durante 3 s | P1 | Avisos sobre la barra inferior, más compactos; el carrito ya confirma con su contador |
| C5 | Inicio | Correcto pero sin "momento": no hay personaje, temporada ni propuesta emocional | P1 | Banda de temporada (según el reloj simulado), personaje de la casa, invitación a regalar |
| C6 | 404 / vacíos | Recuadro punteado genérico; el 404 dentro del cliente pierde márgenes | P1 | Personaje con expresión y una salida clara; vacíos ilustrados |
| C7 | Pasaporte / catas | Bien resueltos; falta celebración visual al lograr la insignia | P2 | Sello animado (transform/opacity) + sonido opcional |
| C8 | — | No existe forma de invitar o regalar un plato a otra persona | **P0** (pedido explícito) | Flujo "Invitar a comer": elegir plato, escribir mensaje, tarjeta temática, mensaje de regalo simulado, página del regalo y canje en el pedido |
| C9 | — | No hay propuesta para chicos | P1 (pedido explícito) | Sección infantil: menú para chicos con media porción, memotest con personajes y "Armá tu plato" |
| C10 | Configurador | Muy bueno; la ilustración chica no luce el plato | P1 | Ilustración grande (hasta 200 px) como protagonista de la cabecera |
| C11 | Toda la web | Sonido solo en la llamada simulada | P2 | Sonidos de interfaz sintéticos, apagados por defecto, con silencio y volumen |

### Lado profesional
| # | Pantalla | Hallazgo | Prioridad | Propuesta |
|---|---|---|---|---|
| P1 | Resumen / tareas | "Reservation R-012", "Ingredient I-07", "Conversation C-004": nombres técnicos en inglés | **P0** | Etiquetas humanas: "Reserva R-012", "Insumo I-07 · Leche de avena", "Conversación C-004" |
| P2 | Carta admin | La disponibilidad usa el texto para el cliente ("Este plato se agotó. Quitalo o elegí otra opción") en una píldora roja larga; sin miniaturas | **P0** | Estado corto ("Agotado · sin insumos"), miniatura ilustrada, acciones agrupadas |
| P3 | Reportes | Filtros apilados a ancho completo; barras sin escala ni contexto | P1 | Barra de filtros compacta y gráficos con escala, leyenda y valor |
| P4 | Configuración | Horas con AM/PM cortado ("08:00 AI"); números a ancho completo | P1 | Campos de hora de 24 h con ancho fijo; tema de temporada configurable |
| P5 | Stock | Log con claves de idempotencia y "Reintentar este evento" en cada línea; selects de unidad sin rótulo visible | P1 | Log legible (fecha, tipo, insumo, cantidad) con detalle técnico plegable; rótulos de unidad |
| P6 | Resumen (móvil) | KPIs en 4 filas altas; rótulo de rol de 4 líneas | P1 | KPIs 2×2 en móvil; rótulo de rol compacto |
| P7 | Admin móvil | Navegación lateral convertida en tira horizontal con scroll; secciones fuera de vista | **P0** | Barra inferior con las secciones del rol + "Más" |
| P8 | KDS | Excelente legibilidad; sin aviso de comanda nueva | P2 | Aviso sonoro opcional para comandas nuevas (apagado por defecto) |
| P9 | — | No hay gestión de regalos | P1 (deriva del pedido) | Sección "Regalos": estado, canje, cancelación con motivo, vencimiento |
| P10 | Comercial | Título pegado a la consola | P2 | Márgenes de página |

### Transversales
| # | Hallazgo | Prioridad | Propuesta |
|---|---|---|---|
| T1 | JS en un solo archivo (676 KB) | P1 | División por ruta (cliente, admin, simulador, infantil) |
| T2 | Sin temática por época | P1 (pedido explícito) | Motor de temporada por fecha simulada: primavera, verano, otoño, invierno y fechas especiales (Día de la Madre, Fiestas, Día del Amigo) con paleta de acento, ornamentos y propuestas; automático o forzado desde Configuración |
| T3 | Clases CSS heredadas de P1 sin uso | P2 | Limpieza |
| T4 | Salir de la llamada en pleno turno deja el turno pendiente | P2 | Documentado; se mantiene (no responde fuera de pantalla) |

## 3. Principios para P3
- **Apetito primero**: la ilustración es protagonista en carta, configurador, regalo y vitrina; la tipografía editorial se mantiene.
- **Una sola mano**: todas las ilustraciones y personajes comparten luz (cenital, 10 h), paleta por material (porcelana, hierro, madera, vidrio), trazo y grano.
- **Momentos, no adornos**: carga, celebración y temporada transmiten estado; nunca bloquean ni retrasan una tarea (sin esperas falsas).
- **Profesional = denso y humano**: etiquetas en español claro, detalle técnico plegable, acciones agrupadas.
- **Mismos límites**: todo local y simulado; regalos sin cobro real ni envío real; sonido apagado por defecto; movimiento reducido respetado; datos ficticios.

## 4. Plan de implementación (lotes)
1. **P3-B Ilustraciones y personajes**: kit de vajilla y materiales, 42 platos/bebidas, personajes por marca (Ñoqui para Mesa Clara, Granito para Ritual Café) con expresiones.
2. **P3-C Plataforma**: splash + carga diferida + cargadores; barra inferior cliente/admin; sonidos de interfaz con controles; motor de temporada; `schemaVersion` 2 con migración desde 1.
3. **P3-D Invitar a comer**: entidad de regalo, flujo, mensaje simulado, página del regalo, canje con revalidación, admin y caja.
4. **P3-E Infantil + pendientes**: menú para chicos, juegos accesibles, P1–P6 y C4/C6.
5. **P3-F QA**: pruebas nuevas y regresión, capturas `screens/p3`, documentación y PR.
