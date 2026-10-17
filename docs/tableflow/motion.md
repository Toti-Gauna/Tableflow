# Movimiento y sonido · P2-L4

El movimiento en TableFlow **comunica un cambio de estado**; nunca decora ni retrasa una tarea. Todo lo que se mueve tiene un equivalente instantáneo y textual.

## Duraciones y curva (tokens en `src/styles.css`)
| Token | Valor | Rango pedido | Dónde |
|---|---|---|---|
| `--dur-cart` | 160 ms | 120–180 ms | línea nueva del pedido (`tf-pop`), aparición del carrito fijo, presión de botones |
| `--dur-state` | 220 ms | 180–240 ms | ticket que cambia de columna en el KDS, paso actual del seguimiento, subrayado de la navegación, diálogos de escritorio, aviso efímero |
| `--dur-scene` | 400 ms | 300–450 ms | entrada de pizarras/tapas del inicio, tarjetas del pasaporte, hoja inferior del configurador en móvil |
| `--ease` | `cubic-bezier(0.2, 0.7, 0.2, 1)` | — | salida suave, sin rebote |

## Reglas
- Solo se animan **`transform` y `opacity`** (keyframes `tf-pop`, `tf-rise`, `tf-sheet`, `tf-state`, `tf-wave`). Los cambios de color son instantáneos. Lo verifica `e2e/motion.spec.ts` leyendo todas las reglas de las hojas de estilo.
- **Los totales se actualizan en el mismo instante** que la acción; ninguna cifra se anima (prueba "totales sin animar").
- Sin scroll secuestrado, parallax, destellos, confeti ni reproducción automática; `scroll-behavior` queda en `auto`.
- La ola de la llamada (`tf-wave`) solo se mueve mientras la llamada está activa y no procesando.

## Movimiento reducido
- `@media (prefers-reduced-motion: reduce)` y el botón **"Reducir movimiento"** de la consola (`:root[data-motion='reduced']`, preferencia guardada en `tableflow.demo.v1.prefs`) llevan animaciones y transiciones a 0,001 ms con una sola iteración y **eliminan los desplazamientos** de hover/presión (`.btn:active`, `.table-chip:hover`).
- Ninguna tarea depende del movimiento: los dos recorridos protagonistas (restaurante hasta el cierre, café hasta el retiro) corren completos con movimiento reducido en el proyecto Playwright `movimiento-reducido`.

## Sonido (llamada simulada)
- Motivos sintéticos de 150–350 ms con Web Audio (`src/ui/audio.ts`): no es voz, no hay TTS, micrófono ni reconocimiento.
- **Voluntario**: apagado por defecto; el contexto de audio se crea solo tras un gesto (prueba: 0 contextos al abrir la pestaña).
- Controles: **silencio** (casilla; desmarcada = silencio), **volumen** (recordado al recargar), **detener sonido**, **reiniciar** la llamada, **continuar sin audio**. Si el navegador bloquea el audio, la casilla se apaga sola y la transcripción conserva todo.
- **Limpieza**: al detener, al silenciar y al salir de la pantalla se cortan los osciladores y se cierra el contexto.

## Temporizadores y callbacks tardíos (S33)
- Los turnos de la llamada usan temporizadores ligados al estado y a un **token** de sesión; detener o salir los cancela.
- Si un callback llega tarde con un token viejo, el dominio lo ignora (`Callback tardío ignorado.`): no crea reservas ni agrega líneas a la transcripción. Si se sale de la pantalla en pleno procesamiento, nadie responde fuera de pantalla; al volver, la llamada retoma su turno.

## Pruebas
`e2e/motion.spec.ts` (tokens en rango y propiedades animadas, totales instantáneos, movimiento reducido por sistema y por consola, S33 con callback tardío, S34, sonido con limpieza, S44 café) · `e2e/quality.spec.ts` (S31–S33) · proyecto `movimiento-reducido` (S44, ambos recorridos).

## P3 · momentos de marca, carga y sonidos de interfaz
- **Pantalla de carga** (`index.html`): estática, sin JS; un punto que gira y una barra que se desplaza (transform). Con movimiento reducido queda quieta. React la reemplaza al montar.
- **Cargador de sección** (`src/ui/Loader.tsx`, carga diferida por ruta): aparece recién a los 180 ms (retardo en CSS, sin espera agregada) con un brillo que se desplaza (`tf-shimmer`, transform). Sin movimiento con la preferencia reducida.
- **Personajes**: vaivén de 2,5 px (`tf-char-bob`) y confeti (`tf-char-pop`) **solo en momentos de celebración** (sección para chicos, memotest ganado, galería). En estados vacíos y 404 el personaje está quieto. Todo se apaga con movimiento reducido.
- **Regalo**: la solapa del sobre "respira" (`tf-flap`, scale) y la tarjeta entra al abrirse (`tf-gift-reveal`, translate/scale/opacity, `--dur-scene`). **Memotest**: giro de carta en 3D (`rotateY`, `--dur-scene`); con movimiento reducido el giro es instantáneo. **Barra inferior**: la píldora del ítem activo crece con transform.
- **Sonidos de interfaz** (`src/ui/sfx.ts`): tonos sintéticos de 30–600 ms (agregar, enviado, regalo, sello, listo, comanda nueva, giro y pareja del memotest). **Apagados por defecto**; se activan con "Sonidos de interfaz" en la consola o en Configuración, que también tiene volumen y "Probar". El aviso de comanda nueva de Cocina/barra es una opción aparte. Sin preferencia activada no se crea ningún `AudioContext` (prueba en `e2e/p3.spec.ts`). Nunca voz ni micrófono.
- Sin temporizadores en los juegos: el memotest deja a la vista dos cartas que no son pareja hasta el próximo toque (WCAG 2.2.1).

## P5-L8 · Coreografía de las animaciones transaccionales
Definida antes de implementar. La composición la decide `src/domain/motion-plan.ts`, una función pura que lee el pedido persistido y está probada en `tests/motion-plan.test.ts`. La vista solo reproduce ese plan.

### Principios (valen para las cinco piezas)
- **Disparador = estado persistido, nunca el clic.** La pieza corre cuando el pedido pasa a `aceptado`, o cuando la reserva de Mesa Clara pasa a `confirmada`. Si el comando falló, no hay plan (`orderMotionPlan` devuelve `null`) y no se muestra nada aceptado.
- **Reproducir no crea, cobra ni canjea.** "Ver de nuevo" solo vuelve a montar la vista; el plan se calcula sin tocar el estado (test).
- **Se persiste el evento, no la animación.** Si salís a mitad, al volver se ve el cierre estático: no se retoma ni se repite sola.
- **Regla de visto (por pestaña):** `sessionStorage` guarda `tableflow.motion.<id>` con `visto-previo` o `reproducida`.
  - Se reproduce una sola vez, cuando el pedido se vio antes de aceptarse en esta pestaña y ahora está aceptado o más adelante. Cubre la vista en vivo y el cambio de rol dentro del mismo navegador.
  - Un pedido que se abre ya aceptado, sin haberlo visto antes, muestra directo el cierre.
  - Es una comodidad de la vista: si el almacenamiento falla, se muestra el cierre.
- **No bloquea:** la pieza vive dentro del seguimiento, no en un modal. Los controles del pedido (cancelar, ver detalle, pagar) siguen usables desde el primer cuadro.
- **Solo `transform` y `opacity`** en keyframes y transiciones; lo controla `e2e/motion.spec.ts`. En SVG: `transform-box: fill-box` y `transform-origin` en la regla, nunca en el keyframe. Nada de `stroke-dashoffset`, colores ni filtros animados.
- **Accesibilidad:**
  - el escenario es decorativo (`aria-hidden`) y lo acompaña un rótulo (`plan.label`, p. ej. "Animación: Medialuna de manteca, Cortado → Ticket N.º 008, pago en el local pendiente");
  - el comprobante final es texto real;
  - el anuncio del cambio de estado sigue siendo el `role=status` del seguimiento: la animación no anuncia nada aparte ni roba el foco.
- **Sonido:** solo si "Sonidos de interfaz" está activado, el tono `enviado` existente al entrar el comprobante. Apagado, no se crea ningún `AudioContext`.

### Línea de tiempo común (`timelineFor`)
| Fase | Duración | Qué se mueve | Curva |
|---|---|---|---|
| Entrada | 200 ms | el escenario: opacity 0→1 y translateY 6→0 px | `--ease` |
| Capas | 320 ms cada una, desfase 140 ms (máx. 8 capas) | cada capa entra desde su dirección natural (cae, se apoya o crece desde la base) | `cubic-bezier(.25,.8,.25,1)`, sin rebote |
| Gesto del negocio | 400 ms (0 si no aplica) | dorado, vapor, apilado, llenado o prensado | `--ease` |
| Cierre | 500 ms | la composición se achica al 72 % y se corre; entra el comprobante (translateY 12→0, opacity) | `--ease` |
| **Total** | **1,4 s (1 capa) a 2,4 s (8 capas)** | probado entre 1 y 3 s | — |

### Las cinco piezas
| ID | Propósito | Disparador | Capas (según el pedido real) | Gesto | Cierre | Respaldo |
|---|---|---|---|---|---|---|
| MO-CAF | Confirmar el retiro y recordar que se paga en el local | pedido de Ritual Café → `aceptado` | pastelería del pedido (hasta 3), "dorado" si hay medialuna, tazas del pedido (hasta 3) | **dorado y vapor**: el acabado dorado se funde (opacity) y 3 volutas suben 10 px con desfase de 120 ms. El cold brew no humea | ticket N.º de retiro + "Pago en el local pendiente" (de `orderPayment`, nunca de la animación) | glifo taza |
| MO-HEL | Mostrar que armaron *tus* gustos | pedido de Copo → `aceptado` | formato (cucurucho, vasito o pote) y una bocha por gusto elegido, en el orden elegido (hasta 4), más baño o salsa | **apilar**: cada bocha cae 14 px y se asienta con un scaleY de 0,94→1 | comprobante con el formato y los gustos | glifo vaso |
| MO-RES | Dar el plato por tomado, o la mesa por lista | pedido de Mesa Clara → `aceptado`; reserva → `confirmada` | loza, plato principal, hasta 3 acompañamientos y cubiertos. En reservas: mantel, hasta 6 lugares y panera | **componer** o **preparar la mesa** (los lugares aparecen en orden horario) | comanda con mesa, o folio de reserva | glifo plato |
| MO-BAR | La tabla para compartir, sin glorificar el alcohol | pedido de Compás → `aceptado` | tabla, tapas (hasta 5) y bebidas **sin alcohol** (hasta 2). Vermut, cerveza o vino no se dibujan nunca: van como texto en la comanda | **armar la tabla**; si es solo bebida, **llenar el vaso** (scaleY desde la base) | comanda de mesa o de barra | glifo plato o vaso |
| MO-FR | Ver tu combo armado y quedarte con el número | pedido de Brasa → `aceptado` | ingredientes reales de la hamburguesa (sin lo que se sacó y con el cheddar extra), acompañamiento y bebida del combo | **ensamblar**: las capas caen y la tapa "prensa" (scaleY 0,96→1) | número de retiro grande | glifo bolsa |

- **Sin pieza propia** (ensalada, limonada de Brasa, pan sin TACC): glifo de su categoría, nunca una pieza inventada.
- **Lo que no entra en 8 capas** se nombra en el comprobante y en `plan.omitted`.

### Interrupción, repetición y errores
| Caso | Comportamiento |
|---|---|
| "Omitir" (botón visible desde el primer cuadro) o Escape con el foco en la pieza | salta al cierre estático y cancela temporizadores y animaciones |
| Salir de la pantalla a mitad | se limpia todo al desmontar (sin temporizadores huérfanos ni errores en consola); al volver se ve el cierre |
| "Ver de nuevo" con doble clic | una sola repetición: el botón queda deshabilitado mientras corre y no toca el store |
| Pedido rechazado o cancelado | no hay animación de aceptación: se ve el estado de rechazo |
| Envío fallido (validación, sin pedido) | no hay folio ni animación |
| Movimiento reducido (sistema o consola) | se monta el cierre directamente, sin desplazamientos ni "Ver de nuevo" |
| Sonido apagado | ningún `AudioContext` |

### Momentos que se diferencian (no se mezclan)
| Momento | Señal | Duración |
|---|---|---|
| Carga técnica | pantalla de carga estática (`index.html`) y esqueletos por ruta con la forma del contenido (carta en grilla, seguimiento, tablero). Aparecen a los 180 ms, sin duración mínima | lo que tarde de verdad |
| Envío simulado | en el seguimiento recién creado, "Enviado (simulado)" con un tilde que se dibuja por escala | 400 ms |
| Aceptación | la pieza transaccional del negocio | 1,4–2,4 s |
| Preparación | el paso actual de la línea de tiempo (ya existe `tf-state`) | 220 ms |
| Entrega / listo | el personaje en "festejo" (ya existe) | — |

### Temporadas (independientes del modo claro u oscuro)
- **Modo automático:** el calendario de siempre.
- **Modo manual:** temporada elegida + fecha de **inicio y fin**. Fuera de ese rango vuelve a la automática. Va en el campo nuevo `settings.seasonWindowByBusiness` (esquema 4 → 5 con migrador).
- **Vista previa:** en Configuración, la escena de la identidad con su arte y su movimiento, sin activarla.
- **Cada identidad adapta composición, arte y movimiento:**
  - Ritual Café en invierno y otoño: merienda con vapor;
  - Copo en verano: bochas con brillo de sol;
  - Mesa Clara en fiestas y fechas de familia: mesa larga de celebración;
  - Compás en primavera y Día del Amigo: noche de música y tapas;
  - Brasa en Día de la Madre, del Padre y del Amigo: bolsa familiar.
  - Las demás combinaciones usan la escena base de la identidad con el acento de la temporada.
- **Movimiento ambiental:** como mucho dos ciclos y se detiene; nada con movimiento reducido.
- **Cambiar la temporada nunca crea campañas, beneficios ni descuentos** (test).
- **Zona para chicos:** el marco del juego toma el acento de la temporada de su identidad. El juego del bar sigue sin alcohol.

### Cómo se acepta
- **Capturas y clips reales:** clips WebM grabados con Playwright, uno por pieza.
- **Pruebas e2e:**
  - interrupción;
  - doble clic;
  - error;
  - navegación a mitad;
  - sonido apagado;
  - movimiento reducido por sistema y por consola.
- **Rendimiento medido durante la pieza:**
  - tareas largas (> 50 ms) con `PerformanceObserver('longtask')`;
  - cuadros por segundo con `requestAnimationFrame`;
  - `document.getAnimations()` en 0 después del cierre y al desmontar.
