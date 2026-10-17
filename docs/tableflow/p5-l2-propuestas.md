# P5-L2b · Una identidad propia por negocio

> Estado: **construido y probado; falta la aprobación de Ignacio.** Reemplaza la primera ronda de L2: 15 conceptos que Ignacio rechazó el 17/10/2026 por genéricos, porque todos compartían la misma plantilla de pantalla y solo cambiaban color, tipografía y el dibujo. Hasta que apruebe, no se extiende ninguna identidad a la app (L3–L10 esperan).

## Qué cambió respecto de la primera ronda
- **Sin plantilla compartida:** cada negocio tiene su propio componente, su CSS, su composición de escritorio y su composición móvil (`src/pages/propuestas/{cafe,helado,bodegon,bar,rapida}.tsx` y sus `.css`). Lo único común es el estudio que los muestra.
- **Arte propio y específico:** cada identidad tiene su ilustración firma, su lenguaje gráfico y su pieza operativa. Ninguna reutiliza el dibujo de otra.
- **Animación propia:** cada confirmación cuenta algo del rubro (la bandeja, las bochas, la comanda, el disco, las capas de la hamburguesa).

## Las cinco identidades
| Negocio | Concepto | Lenguaje | Pieza firma | Confirmación |
|---|---|---|---|---|
| Cafetería · Ritual Café | Confitería notable porteña | Bodoni Moda dorada, EB Garamond y Pinyon Script. Filete porteño (volutas, acanto, flor, cinta y toques de luz), vitral en arco, boiserie, mármol y damero. Nace en modo oscuro (salón) | Café con leche y medialunas en bandeja de alpaca bajo el vitral | Entra la bandeja, sube el vapor, se dibuja el filete y se estampa el Nº 014 |
| Heladería · Copo | La vitrina es el menú | Fraunces SOFT/WONK en negra, Nunito. Bachas vistas desde arriba con olas de paleta; bochas con cuello festoneado, brillo, trocitos y baño de chocolate | Cucurucho de tres bochas que gotea | Las bochas saltan de la bacha al cucurucho, se asientan con rebote y aparece H-007 |
| Restaurante · Mesa Clara | Bodegón de pizarra y pingüino | Ultra (cartel enlozado), Bitter, Caveat Brush con textura de tiza real (filtro SVG). Mantel a cuadros, banderines, jamones colgados | Pingüino de vino, sifón, panera y milanesa napolitana | El mozo escribe la comanda, el plato llega al mantel y el sifón llena el vaso |
| Bar gastronómico · Taberna Compás | Club de jazz y tapas | Archivo extracondensada en 900 e Instrument Serif itálica. Dos tintas con semitono SVG; cada noche es una tapa de disco; la carta es un tracklist (Lado A, Lado B y bonus track sin alcohol) | Contrabajo en semitono y disco con etiqueta de reserva | El disco sale de la funda, gira, baja la púa, laten los ecualizadores y aparece MESA 9 |
| Comida rápida · Brasa Rápida | Brasa a la vista | Fredoka 700. Hamburguesa doble con brillo, cheddar derretido y marcas de parrilla; rail de categorías de kiosco; combo en tres pasos con el tamaño visible en las papas; tablero Preparando/Listo | Combo con hamburguesa doble, papas y bebida | Caen las capas, se derrite el cheddar, saltan las papas y el 047 pasa a Listo |

Para cada identidad, el estudio muestra:
- pantalla pública de escritorio;
- móvil con composición propia;
- operación del comercio: barra con comanda, mostrador con kilos por bacha, cocina con comandas colgadas del riel, cocina de barra con mesas de la noche, y estaciones con tablero;
- galería de arte;
- animación con control de movimiento reducido;
- paleta con contraste medido;
- decisiones e inspiración.

**Contenido:**
- **Ritual Café y Mesa Clara** usan precios del fixture (`RC-*`, `MC-*`). En el café se suman clásicos de confitería provisionales: lágrima, café con leche, submarino y medialuna de grasa.
- **Copo, Taberna Compás y Brasa Rápida** usan contenido ficticio provisional. L5 lo convierte en fixtures.

## Cómo verlas
- `#/propuestas` (índice) y `#/propuestas/<cafe|hela|resto|bar|rapida>`, con modo por URL: `?modo=claro` o `?modo=oscuro`.
- Capturas en `docs/tableflow/screens/p5-l2/`: por identidad, pantalla pública en claro y oscuro, móvil, comercio y confirmación.
- Hojas comparativas en `screens/p5-l2/hojas/L2b-<negocio>.jpg`, que se regeneran con `make_sheets.py`.

## Evidencia
| Verificación | Resultado |
|---|---|
| `tests/propuestas.test.ts` (12) | una identidad por negocio; cinco tipografías de display distintas; **10 paletas × 7 pares de texto ≥ 4,5:1** (texto, secundario, botón y acento como texto, contra fondo y superficie) |
| `e2e/p5.spec.ts` (3) | índice con 5 identidades, 0 solicitudes externas y 0 errores de consola; cada estudio carga su identidad; modo por URL con token de fondo verificado; precios del fixture visibles; la animación solo corre al pedirla y se apaga con movimiento reducido; 404 propio; **390 px sin scroll horizontal y axe sin violaciones serias o críticas en las 10 páginas (5 × claro/oscuro)** |
| Animaciones | cuadros a mitad y al final de las cinco confirmaciones, revisados uno por uno |
| Regresión | typecheck 0; Vitest 205/205 (193 + 12); Playwright 73 pasadas (70 + 3) y 5 omitidas (capturas) |

Defectos encontrados en la revisión visual y con axe, ya corregidos:
- la araña del vitral flotaba en el aire;
- la gota del logo de Copo se leía como una coma;
- el baño de chocolate quedaba como una mancha;
- la milanesa se leía como un huevo frito;
- la tinta del contrabajo desaparecía en modo oscuro;
- los títulos de la agenda quedaban encima del dibujo;
- tres pares de contraste en barras móviles y en una tapa de disco;
- una colisión de CSS (la clase `br` de la esquina de filete heredaba el fondo de Brasa Rápida);
- `transform` de animación que pisaba la posición de bochas y platos.

## Referencias consultadas (17/10/2026, mediante búsqueda web)
Se leyeron los resúmenes de búsqueda, no cada sitio a fondo. No se copia ningún logo, asset ni texto.
- **Café:**
  - [Bares notables de Buenos Aires (Time Out)](https://www.timeout.com/es/buenos-aires/bares-notables-de-buenos-aires-que-tenes-que-conocer-las-violetas-confiteria-ideal-bar-britanico).
  - [El Federal y otros bares notables](https://buenosaires.for91days.com/?p=237): barra centenaria y sifones antiguos.
  - [La Ideal reabierta](https://batimes.com.ar/news/culture/after-six-years-the-century-old-confectionery-shop-la-ideal-reopens-a-symbol-of-the-city-of-buenos-aires.phtml): arañas francesas y vitrales.
  - [La Fonte d’Oro en CABA](https://www.baenegocios.com/negocios/la-cafeteria-marplatense-la-fonte-doro-abrio-su-primer-local-en-la-ciudad-20210629-0102.html). La nota no describe el interiorismo.
  - [Filete porteño (UNESCO, 2015)](https://ich.unesco.org/en/RL?RL=01069) y [Ciudad de Buenos Aires](https://buenosaires.gob.ar/filete-porteno).
  - "El Cóndor": no se encontró, así que no se usa como referencia literal.
- **Heladería:** [Lucciano’s: diseño de local y chocolate amargo](https://www.iprofesional.com/negocios/378177-como-hizo-luccianos-para-revolucionar-el-concepto-de-heladeria).
- **Bodegón:**
  - [Origen del bodegón](https://billiken.lat/interesante/cual-es-el-origen-del-bodegon/): pingüinos, banderines y jamones.
  - [Pinto bodegón (Infobae)](https://www.infobae.com/tendencias/2022/04/20/pinto-bodegon-como-es-la-movida-gastronomica-de-los-restaurantes-mas-tradicionales-de-la-ciudad-de-buenos-aires/).
- **Bar:**
  - [Tapas de Blue Note (Wikipedia)](https://en.wikipedia.org/wiki/Album_covers_of_Blue_Note_Records).
  - [Open Culture sobre Reid Miles](https://www.openculture.com/2018/11/the-impossibly-cool-album-covers-of-blue-note-records.html): una o dos tintas y tipografía protagonista.
- **Comida rápida:**
  - [Burger King 2021 (Design Week)](https://www.designweek.co.uk/issues/4-10-january-2021/burger-king-rebrand): colores de la parrilla.
  - [Print](https://www.printmag.com/branding-identity-design/burger-king-rebrands-design-fit-for-a-king/): tipografía redonda inspirada en la comida y fotos con mucha textura.
  - [Teardown de kioscos McDonald’s](https://seenlabs.com/blog/mcdonalds-vs-taco-bell-kiosks-a-ux-teardown-for-qsr-operators).
  - [Mostaza](https://wiki.neonvagabond.xyz/content/wikipedia_en_all_maxi_2024-01/A/Mostaza) como cadena argentina.
  - "Atilos": no se encontró. Falta confirmar la grafía con Ignacio.

## Límites declarados
- **Arte:** una pieza firma y piezas de apoyo por negocio. La familia completa por ítem es de L4.
- **Animación:** boceto. La animación real, conectada al evento del pedido aceptado, es de L8.
- **Tipografías:** 10 paquetes OFL locales, que solo carga `#/propuestas` (Fraunces ya viene con la app). Se sacaron las 23 de la primera ronda.
- Sin revisión con lector de pantalla ni en dispositivo físico.
