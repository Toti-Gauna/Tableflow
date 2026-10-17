# Cobertura: módulos, escenarios S01–S46 y automatizaciones AU01–AU10

Leyenda: **D** = probado en Vitest (dominio/persistencia), **E** = probado en Playwright sobre la app construida, **—** = no ejecutado. “Probado” significa que la aserción existe y pasó en esta construcción; no certifica nada fuera de lo descrito.

## Módulos M01–M15 → ruta real → acción → entidad → admin → S/AU
Fuente única: `src/pages/coverage.ts` (se muestra también en `/#/comercial`).

| Módulo | Ruta real (HashRouter) | Acción | Entidad | Admin | S | AU |
|---|---|---|---|---|---|---|
| M01 Carta | `/:perfil/carta` | buscar, filtrar, favoritas, detalle, sede | MenuItem, Location | `/admin/carta` | S01, S09 | — |
| M02 Config. y carrito | `/:perfil/carta/:itemId`, `/:perfil/pedido` | modificadores, cantidad, nota, precio cambiado | Cart, CartLine, ModifierGroup | `/admin/pedidos` | S02–S05, S08 | — |
| M03 Reservas y espera | `/:perfil/reservar`, `/:perfil/reservas/:id` | solicitar, reprogramar, cancelar, alternativas, espera | Reservation, WaitlistEntry, Table, ServiceWindow | `/admin/reservas`, `/admin/configuracion` | S10–S16, S30, S34 | AU01–AU04 |
| M04 Salón | `/admin/salon` | plano/lista, sentar, abrir, mover, combinar | TableSession | `/admin/salon` | S17, S18 | — |
| M05 Pedidos | `/:perfil/pedido/:id` | enviar, aceptar/rechazar, editar, cancelar, duplicar | Order, KitchenTicket | `/admin/pedidos` | S05, S06, S10, S42 | AU05 |
| M06 Cocina/barra | `/admin/cocina` | cola, aceptar, preparar, listo, entregar, incidencia | KitchenTicket | `/admin/cocina` | S19, S20 | AU05 |
| M07 Caja | `/admin/caja` | apertura, movimientos, división, pagos DEMO, arqueo, cierre | CashSession, PaymentSimulation | `/admin/caja` | S23–S26 | — |
| M08 Carta admin | `/admin/carta` | precio, agotado, nota alimentaria, categorías, historial | MenuItem | `/admin/carta` | S07, S08 | — |
| M09 Inventario | `/admin/stock` | reservar/consumir/liberar, reponer, ajustar, merma | Ingredient, Recipe, StockMovement | `/admin/stock` | S07, S21, S22 | AU06 |
| M10 Clientes | `/admin/clientes/:id` | ficha, consentimientos, unir duplicados | CustomerDemo | `/admin/clientes` | S34, S37 | AU10 |
| M11 WhatsApp y voz | `/:perfil/simulador`, `/:perfil/ayuda` | chat determinista, llamada por botones | Conversation, Message, CallSession, HumanReviewTask | `/admin/resumen` | S27–S35 | AU07 |
| M12 Automatizaciones | `/admin/automatizaciones` | activar/pausar, vista previa, reintentar, fallo inyectado | AutomationRule/Run | `/admin/automatizaciones` | S36, S37 | AU01–AU10 |
| M13 Pasaporte | `/:perfil/explorar`, `/:perfil/pasaporte` | tarjetas, insignia, sellos | Passport, Visit, Redemption | `/admin/clientes/:id` | S38, S39 | AU08 |
| M14 Catas | `/:perfil/catas` | inscribir, espera, cancelar | TastingEvent, EventBooking | `/admin/reportes` | S40 | AU09 |
| M15 Resumen/reportes/config | `/admin/resumen`, `/admin/reportes`, `/admin/configuracion` | indicadores, filtros, reglas, reinicio, diagnóstico | selectores | `/admin/reportes` | S41, S45, S46 | — |

Cada módulo tiene acción, consecuencia local persistida, excepción y recuperación visibles (ver “Excepción y resultado” de cada S). Ningún éxito existe solo como toast: toda confirmación tiene un cambio de estado visible en la página (los toasts son un refuerzo, con región viva).

## Escenarios S01–S46

| S | Dominio (D) | UI (E) | Observación |
|---|---|---|---|
| S01 | seed: 42 ítems, 28+14 | smoke, recorridos | imagen ausente = placeholder con texto |
| S02 | persistence | quality: recarga conserva carrito y sede; almacenamiento denegado → memoria + aviso | |
| S03 | commerce | recorrido restaurante (error de guarnición); P2: design S43 (error de tamaño en la hoja móvil) | |
| S04 | commerce (máx. 1 salsa; incompatibilidad) | — | solo dominio |
| S05 | commerce | extra | |
| S06 | commerce (1 orden y 1 comanda) | recorrido restaurante (doble clic) | |
| S07 | commerce | admin | |
| S08 | commerce | admin | |
| S09 | commerce | extra; P2: design a 390 y 768 px (filtro + búsqueda sin resultados → limpiar → lista original intacta) | |
| S10 | commerce (retiro 03:00) | extra | |
| S11 | booking | quality (franja 20:00 deshabilitada; 21:45 habilitada) | |
| S12 | booking, comms | quality, chat | |
| S13 | booking (original conservado) | — | solo dominio |
| S14 | booking | quality | |
| S15 | booking, comms | quality | |
| S16 | booking | quality | |
| S17 | booking | admin | |
| S18 | booking | admin | |
| S19 | commerce | ambos recorridos | |
| S20 | commerce | admin | |
| S21 | commerce | — | solo dominio |
| S22 | commerce | admin | |
| S23 | cash (10.000/3) | recorrido restaurante (37.000/3) | |
| S24 | cash | extra | |
| S25 | cash | admin | |
| S26 | cash | admin | |
| S27 | comms | chat | |
| S28 | comms | chat (botón deshabilitado) | |
| S29 | comms | — | solo dominio |
| S30 | comms | — | solo dominio |
| S31 | comms | quality (sin autoplay ni micrófono); P2: motion (contexto de audio solo tras gesto) | |
| S32 | comms | quality | |
| S33 | comms | quality; P2: motion (callback tardío con token viejo ignorado; salir en pleno procesamiento no responde fuera de pantalla) | |
| S34 | comms | P2: motion (reserva web → WhatsApp → llamada: un folio, una conversación) | antes solo dominio |
| S35 | comms, booking | quality (formulario web) | |
| S36 | automations | — | solo dominio |
| S37 | automations (AU10) | admin (vista previa); P2: passport (baja promocional persistente, servicio intacto, omitido en la vista previa) | |
| S38 | engage | admin; P2: passport (estados completos, recarga, reintento sin penalizar, guardar, usar con revalidación, sede sin el plato, reinicio con confirmación) | |
| S39 | engage (+ solo personal, pausa) | P2: passport (sello por personal, duplicado no suma, insignia a la quinta, reversión con motivo auditada, pausa) | antes solo dominio |
| S40 | engage | admin; P2: passport (recarga, cupo 0 → espera, cancelar una sola vez) | |
| S41 | engage (reports) | admin; P2: design en móvil (vacío explicativo sin cifras y restablecer) | |
| S42 | — | quality | |
| S43 | — | quality (320/390 sin scroll horizontal); P2: design (pie del configurador visible, último plato sobre el carrito fijo, foco con teclado no tapado por banner/categorías/carrito, error de Mi pedido a la vista; zoom 200 % y 768 px en todos los módulos) | dispositivos reales: no |
| S44 | — | quality (llamada); P2: motion (café hasta el retiro) + proyecto `movimiento-reducido` (restaurante hasta el cierre y café hasta el retiro) | |
| S45 | persistence | quality | |
| S46 | persistence | quality | |

## Automatizaciones AU01–AU10 (`tests/automations.test.ts`)
Cada una probada en dominio con éxito, error/sin cupo, reintento, pausa y consentimiento según aplica, y con log accesible: AU01 (doble clic no duplica; pausa), AU02 (fallo inyectado + reintento misma ejecución; teléfono desconocido deriva; sin consentimiento omite; una confirmación por versión), AU03 (reloj dos veces = una entrega; fallo+reintento; versión nueva anula el recordatorio viejo; baja/cancelación suprimen), AU04 (primer candidato, vencimiento por reloj, retiro de oferta), AU05 (sin canal muestra código; fallo conserva “listo”), AU06 (alerta única por cruce; unidad incorrecta → incidencia), AU07 (tarea humana ligada al hilo), AU08 (sello único; insignia a la quinta), AU09 (lugar liberado ofrecido al siguiente; vencimiento), AU10 (solo vista previa; omisión auditada). En UI: reintento de ejecuciones (M12) y vista previa de campaña.

## Pruebas de invariantes
4 semillas × 250 comandos aleatorios reproducibles + idempotencia: `validateState` válido, stock ≥ 0 y reservas ≤ existencias, comanda coherente con el estado del pedido, sin solapes de reservas por mesa, fallos transaccionales (estado idéntico).

## P2 · pruebas agregadas
- `e2e/design.spec.ts` (P2-L2): S09 a 390/768, S41 en móvil, S43 a 320/390 con foco no tapado y carrito fijo, zoom 200 % (640 px) y 768 px sin scroll horizontal en 26 rutas, estados diferenciados (revisión, cancelación pendiente, tarde, espera de retiro, agotado), política sin reservas en navegación/ruta/chat, foco en diálogos y panel de mesa.
- `e2e/passport.spec.ts` (P2-L3): S37–S40 con recarga, repetición, cancelación y reversión.
- `e2e/motion.spec.ts` (P2-L4): tokens de movimiento y propiedades animadas, totales instantáneos, movimiento reducido por sistema y consola, S33 callback tardío, S34, sonido con limpieza, S44.
- Proyecto Playwright `movimiento-reducido`: repite `journeys.spec.ts` con `reducedMotion: 'reduce'`.
- `tests/contrast.test.ts`: 61 pares de los tokens P2 (antes 23). `tests/engage.test.ts`: uso del pasaporte solo desde el pasaporte, revalidación por sede, sello solo por personal y pausa.
- Regresión P1 completa (S03, S06, S11–S13, S19, S23–S25, S34, S35 y el resto) en la misma corrida.

## No ejecutado / pendiente
- Lector de pantalla real (NVDA/VoiceOver), revisión manual con usuarios, dispositivos móviles físicos (las pruebas emulan 320/390/768 y zoom 200 % por ancho CSS).
- Contraste: medido sobre tokens (61 pares) y por axe en 21 pantallas renderizadas; no se midió cada combinación renderizada de forma exhaustiva. Esto **no certifica** accesibilidad.
- Navegación del KDS solo con teclado de punta a punta (las acciones son botones; no se grabó un recorrido completo).
- Varias pestañas reales y evento `storage`.
- Rendimiento (bundle sin dividir: aviso de chunk > 500 KB).
