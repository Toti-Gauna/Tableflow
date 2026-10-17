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
