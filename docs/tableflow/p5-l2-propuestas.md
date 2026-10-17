# P5-L2 · Propuestas visuales: 15 conceptos para elegir

> Estado: **construido y probado; la elección de Ignacio está pendiente.** Hasta que elija, no se extiende ninguna identidad a la app (L3–L10 esperan). No es investigación de mercado ni valida qué dirección vende más.

## Cómo verlas
- Índice: `#/propuestas` (ruta aislada, fuera del chrome de la demo; no toca las pantallas actuales).
- Estudio por concepto: `#/propuestas/<id>`, con modo por URL: `?modo=claro` o `?modo=oscuro`.
- Capturas: `docs/tableflow/screens/p5-l2/` (índice, pantalla pública en claro y oscuro, y móvil, por concepto) y hojas comparativas por negocio en `screens/p5-l2/hojas/L2-<negocio>.jpg`, que se regeneran con `make_sheets.py`.

Cada estudio muestra las mismas piezas: pantalla pública de escritorio, móvil de 316 px de contenido, comanda y lista del comercio, tipografía, arte con boceto de la animación de confirmación, paleta claro/oscuro con contraste medido y decisiones con pertinencia, legibilidad, viabilidad y riesgo.

**Contenido**: café y restaurante usan ítems y precios del fixture real (`buildMenu()`; precios de modificadores verificados contra el catálogo). Heladería, bar y comida rápida usan contenido **provisional y ficticio** (`src/pages/propuestas/content.ts`) que L5 convierte en fixtures.

## Los quince conceptos y la recomendación
| Negocio | 1 | 2 | 3 | Recomendada y por qué |
|---|---|---|---|---|
| Cafetería · Ritual Café | Barra editorial (Young Serif + Instrument Sans) | **Kissaten** (Shippori Mincho + Albert Sans) | Merienda retro (Gloock + Space Grotesk) | **2 Kissaten**: pone el método y el origen en primer plano y es la que más se separa del restaurante editorial |
| Restaurante · Mesa Clara | Cocina de autor (Cormorant + Karla) | **Bodegón contemporáneo** (Fraunces + Manrope) | Materia sobria (Instrument Serif + Inter) | **2 Bodegón**: es la "carta de casa" del brief, conserva las 42 ilustraciones y las pruebas de P2–P4, y suma modo oscuro. En el estudio se usa la escena común para comparar; la carta real sigue usando sus ilustraciones |
| Heladería · Copo | **Escultórica lúdica** (Bagel Fat One + Nunito) | Pop geométrico (Unbounded + Outfit) | Pastel sereno (Lexend) | **1 Escultórica**: el brief pide frescura, color y producto protagonista; el helado es la interfaz |
| Bar gastronómico · Taberna Compás | Nocturno sofisticado (Italiana + Jost) | Neo-brutal (Archivo Black + Space Mono) | **Compás musical** (Syne + Work Sans) | **3 Compás**: hace de la agenda parte del producto sin estética de boliche (eso es de EventOS) ni glamour del alcohol |
| Comida rápida · Brasa Rápida | **Energía brutal** (Anton + Archivo) | Retro dinámico (Bowlby One + Rubik) | Contraste mínimo (Inter Tight) | **1 Energía brutal**: composición directa y de alto contraste, con el número de retiro como marca |

Con las cinco recomendadas, cada negocio queda en una familia distinta: serif japonesa y aire (café), serif editorial y papel (restaurante), volumen redondo (heladería), grotesca expresiva y pentagrama (bar) y condensada sobre amarillo (comida rápida). Se pueden combinar decisiones: por ejemplo, la paleta de un concepto con la tipografía de otro.

## Evidencia
| Verificación | Resultado |
|---|---|
| `tests/propuestas.test.ts` | 3 conceptos y 1 recomendado por negocio; 15 ids únicos; **30 paletas × 7 pares** (texto, secundario, botón y acento usado como texto, contra fondo y superficie) ≥ 4,5:1 |
| `e2e/p5.spec.ts` (4) | índice con 15 tarjetas, 0 solicitudes externas y 0 errores de consola; modo por URL con color de fondo verificado; navegación entre conceptos; boceto que solo se anima al pedirlo y se apaga con movimiento reducido; 404 propio; 390 px sin scroll horizontal; **axe sin violaciones serias o críticas en las 30 páginas (15 × claro/oscuro)** y en el índice a 390 px |
| Regresión | typecheck 0; Vitest 224/224 (193 previas + 31); Playwright 74 pasadas (70 previas + 4) y 4 omitidas (capturas) |

Durante la revisión, axe y las capturas encontraron defectos que se corrigieron antes de cerrar:
- acentos usados como texto chico con contraste de 3:1, cuando corresponde 4,5:1 (la regla de la prueba se endureció);
- ítems agotados y precios de chips atenuados con opacidad, que bajaba el contraste;
- contenido del teléfono recortado fuera de vista que se medía contra el marco negro (ahora el teléfono muestra solo la primera pantalla);
- titulares que partían palabras ("ARMAMO S");
- radio de 999 px que deformaba las tarjetas;
- grilla que desbordaba a 390 px;
- total con texto en lugar de importe;
- precios con ",00" en la carta.

La prueba de axe de 25 pantallas de la app (`quality.spec.ts`) pasaba sin violaciones, pero tardaba unos 50 s en este contenedor contra el límite global de 45 s. Se le dio `test.setTimeout(150_000)` sin cambiar lo que verifica.

## Referencias consultadas (17/10/2026, mediante búsqueda web)
Se leyeron los resúmenes de búsqueda, no cada sitio en profundidad. Sirven para orientar y no se copia ningún asset, texto ni marca.
- Heladería: [Kōri Ice Cream, Best Identity Design 2023](https://eat-drink-design.com/gallery/2023/best-identity-design/ZPQ6TQL3260) (cotidiano con borde elevado); [Sweet Cheeks / Bravo](https://www.designboom.com/design/bravo-identity-gelato-brand-ai-generated-landscapes-sweet-cheeks-03-06-2024/) (menús lúdicos).
- Bar: [Bar Pez](https://www.100archive.com/projects/bar-pez-identity-website) (minimalismo y tipografía de inspiración vasca); [Smith Hill Tavern](https://contra.com/p/66kkQrR3-smith-hill-tavern-framer-website) (sección propia de música en vivo junto a la reserva); [Álamo](https://www.designandpaper.com/?p=10049) (grabado y serigrafía en menús).
- Comida rápida: [BURGER, de Freytag Anderson](https://www.creativeboom.com/inspiration/freytag-andersons-bold-confident-and-minimalist-identity-for-a-no-nonsense-burger) (gótica de bloque apilada, monocromo); [Burger King: interior y kioscos](https://www.designweek.co.uk/burger-king-launches-subtle-new-interior-design-introduces-self-ordering-kiosks/); [It's Nice That sobre diseño de fast food](https://www.itsnicethat.com/articles/fast-food).
- Café: [Café Ki](https://minimalissimo.com/articles/cafe-ki) (pictograma y aire); [Gambaru, Bariloche](https://contra.com/p/ULkgmsmr-gambaru-specialty-coffee-brand-identity) (el contrapunto: gráfica urbana japonesa expresiva).
- Restaurante: [ejemplos de sitios de restaurante de Framer](https://framer.com/blog/restaurant-website-design-examples/) (tipografía editorial y carta a la vista). Se mantienen las referencias del brief (ALPA, Anna Bistró, Paila·Co, Woki, Square, Bistrosoft).
- Retiro y estado: [Pickfood](https://fasterthanlight.me/projects/pickfood) (resumen del pedido siempre visible y estado después del checkout).

## Límites declarados
- **Arte**: las escenas son de muestra (una por negocio, seis tratamientos). La familia completa y su revisión a tamaño real son de L4, después de la elección.
- **Motion**: es un boceto (las piezas entran en orden y aparece el ticket). La animación transaccional real, conectada al evento del pedido aceptado, es de L8.
- **Tipografías**: 26 paquetes OFL locales que solo carga la ruta `#/propuestas`. Después de la elección se eliminan las que no se usen.
- Sin revisión con lector de pantalla ni en dispositivo físico.

## Decisión pendiente (Ignacio)
Una dirección por negocio. Se pueden combinar decisiones de varios conceptos o pedir cambios; la elección queda registrada en `p5-spec.md` antes de empezar L3.
