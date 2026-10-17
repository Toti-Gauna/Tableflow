// P5-L2b · Una identidad propia por negocio (rehecho tras el rechazo de las 15 propuestas de L2).
// Datos puros: los usan el estudio (#/propuestas) y la prueba de contraste (tests/propuestas.test.ts).

export type PzBiz = 'cafe' | 'hela' | 'resto' | 'bar' | 'rapida'
export type Mode = 'light' | 'dark'

/** Tokens de texto con contraste verificado + colores decorativos de la identidad (no se usan como texto). */
export interface Palette {
  bg: string
  surface: string
  ink: string
  muted: string
  accent: string
  onAccent: string
  deco: Record<string, string>
}

export interface Identity {
  biz: PzBiz
  name: string
  rubro: string
  concept: string
  thesis: string
  primaryMode: Mode
  modeNames: Record<Mode, string>
  light: Palette
  dark: Palette
  type: { display: string; text: string; accent?: string }
  decisions: string[]
  signature: string
  motion: string
  inspiration: string[]
  differs: string
  provisional: boolean
}

export const IDENTITIES: Identity[] = [
  {
    biz: 'cafe', name: 'Ritual Café', rubro: 'Cafetería', concept: 'Confitería notable porteña',
    thesis: 'Un salón de los de antes: vitral en arco, boiserie de caoba, mesas de mármol, letras doradas en el espejo y filete porteño en cada esquina. Café con leche y medialunas servidos en bandeja de alpaca.',
    primaryMode: 'dark', modeNames: { light: 'Mañana de mármol', dark: 'Salón de caoba' },
    light: { bg: '#F3ECDF', surface: '#FBF7F0', ink: '#2B1712', muted: '#654A3D', accent: '#7A1E25', onAccent: '#FBF2E4', deco: { gold: '#B08A3E', gold2: '#E4C77E', green: '#2F4A3A', wood: '#5B2E1E', glass: '#C9A24E' } },
    dark: { bg: '#1A0F0C', surface: '#27170F', ink: '#F3E6CF', muted: '#C9B597', accent: '#D9B46A', onAccent: '#1A0F0C', deco: { gold: '#C9A24E', gold2: '#F1D98F', green: '#4F7A60', wood: '#3A1C12', glass: '#E0B85C' } },
    type: { display: "'Bodoni Moda Variable', 'Didot', Georgia, serif", text: "'EB Garamond Variable', Garamond, Georgia, serif", accent: "'Pinyon Script', cursive" },
    decisions: [
      'Bodoni Moda con dorado en titulares y precios; EB Garamond en la carta; Pinyon Script solo para saludos y firmas',
      'El filete porteño (patrimonio UNESCO 2015) como sistema de ornamento: volutas, hojas de acanto, cintas y toques de luz',
      'La carta es una tarjeta impresa con marco doble y esquinas fileteadas; los precios siguen una línea de puntos',
      'El pedido se arma como en la mesa: pocillo, jarrito o taza, y medialunas por unidad, media docena o docena',
      'Piso damero y espejos dorados como fondos; nace en modo oscuro (salón) y el claro es la mañana de mármol',
    ],
    signature: 'La mesa del salón bajo el vitral: café con leche y medialunas en bandeja de alpaca',
    motion: 'Al aceptar el pedido entra la bandeja, sube el vapor, el filete se dibuja alrededor del ticket y se estampa el número',
    inspiration: ['Confiterías y bares notables porteños (La Ideal, Las Violetas, El Federal, El Molino): vitrales, arañas, maderas centenarias y sifones', 'Filete porteño: volutas, acanto, colores vivos con toques de luz y letras ornamentadas', 'La Fonte d’Oro como referencia de cadena de café con salón clásico'],
    differs: 'Es la única identidad ornamental, oscura y dorada: tipografía didona, marcos fileteados y una carta impresa.',
    provisional: false,
  },
  {
    biz: 'hela', name: 'Copo', rubro: 'Heladería', concept: 'La vitrina es el menú',
    thesis: 'El helado se ve como se ve en el mostrador: bachas vistas desde arriba con la marca de la paleta, bochas brillantes con sus trocitos y un cucurucho que gotea. Dan ganas de pedirse uno.',
    primaryMode: 'light', modeNames: { light: 'Mostrador de día', dark: 'Chocolate amargo' },
    light: { bg: '#FFF4E8', surface: '#FFFFFF', ink: '#3A1A12', muted: '#7A4E40', accent: '#B8204F', onAccent: '#FFFFFF', deco: { frutilla: '#F05A7E', pistacho: '#9DBE5B', ddl: '#C08548', choco: '#4A2416', limon: '#F6E27A', menta: '#9EDCC8', crema: '#F7E7C6', steel: '#C9CFD4' } },
    dark: { bg: '#1E110C', surface: '#2C1A12', ink: '#FFEFE2', muted: '#D9B8A6', accent: '#FF8FB1', onAccent: '#1E110C', deco: { frutilla: '#F05A7E', pistacho: '#9DBE5B', ddl: '#C08548', choco: '#5A2D1C', limon: '#F6E27A', menta: '#9EDCC8', crema: '#F7E7C6', steel: '#7C8389' } },
    type: { display: "'Fraunces Variable', Georgia, serif", text: "'Nunito Variable', system-ui, sans-serif" },
    decisions: [
      'Fraunces con el eje SOFT al máximo, negra y "wonky": letras que parecen de crema',
      'La vitrina de bachas vistas desde arriba es la carta: cada gusto con su textura, sus trocitos y su cartelito',
      'El armado muestra el formato real (cucurucho, vasito, ¼, ½ o 1 kg) y se llena a medida que elegís',
      'Colores de gusto reales como protagonistas; el resto es crema y chocolate',
      'Los agotados quedan como bacha vacía con "volvemos pronto", no como un ítem tachado',
    ],
    signature: 'Un cucurucho de tres bochas con chocolate que gotea',
    motion: 'Las bochas saltan de la bacha al cucurucho, se asientan con un rebote, gotea el chocolate y aparece el comprobante',
    inspiration: ['Heladerías artesanales argentinas: vitrina de bachas, paleta, cartelitos de gusto y venta por kilo', 'Lucciano’s: diseño de local como experiencia y el chocolate amargo como estrella'],
    differs: 'Es la única identidad donde el producto ocupa toda la pantalla: no hay una lista de texto, la carta es la vitrina.',
    provisional: true,
  },
  {
    biz: 'resto', name: 'Mesa Clara', rubro: 'Restaurante / bodegón', concept: 'Bodegón de pizarra y pingüino',
    thesis: 'Mantel a cuadros, pingüino de vino, sifón de soda, la pizarra escrita con tiza y el mozo que anota en su libretita. La milanesa napolitana es la reina.',
    primaryMode: 'light', modeNames: { light: 'Mantel', dark: 'Pizarra' },
    light: { bg: '#F2E7D3', surface: '#FFFBF2', ink: '#2A1A12', muted: '#664D3C', accent: '#A3241D', onAccent: '#FFF7EC', deco: { board: '#1F2B25', chalk: '#F1EDE2', red: '#B92B22', wood: '#6E4528', paper: '#FFF8E8', blue: '#2C6E8E' } },
    dark: { bg: '#18201C', surface: '#212C26', ink: '#F1EDE2', muted: '#C3C7B9', accent: '#F2957B', onAccent: '#18201C', deco: { board: '#141C18', chalk: '#F1EDE2', red: '#B92B22', wood: '#4A2E1B', paper: '#EFE6D2', blue: '#3A86AB' } },
    type: { display: "'Ultra', 'Rockwell', serif", text: "'Bitter Variable', Georgia, serif", accent: "'Caveat Brush', cursive" },
    decisions: [
      'Ultra (slab muy pesada) para el cartel enlozado de la entrada; Bitter en la carta; Caveat Brush con textura de tiza para la pizarra',
      'La pizarra del día es la portada: el plato del día escrito con tiza, con textura real (filtro SVG)',
      'Naturaleza muerta propia: pingüino de vino, sifón azul, panera y milanesa napolitana sobre mantel a cuadros',
      'La reserva y el pedido se muestran como la libretita del mozo, con renglones y letra a mano',
      'Banderines como guarda; el modo oscuro es la pizarra',
    ],
    signature: 'Pingüino, sifón y milanesa napolitana sobre el mantel a cuadros',
    motion: 'El mozo anota la comanda a mano, el plato llega al mantel y el sifón dispara su chorro',
    inspiration: ['Bodegones porteños: jarras pingüino, vino de la casa con soda, jamones colgados, banderines y fotos en las paredes', 'Bares notables como El Federal: barra centenaria y sifones antiguos'],
    differs: 'Es la única identidad hecha a mano: tiza, papel y libretita. Cálida, ruidosa y familiar.',
    provisional: false,
  },
  {
    biz: 'bar', name: 'Taberna Compás', rubro: 'Bar gastronómico', concept: 'Club de jazz y tapas',
    thesis: 'Cada noche de la agenda es una tapa de disco: dos tintas, tipografía condensada enorme y un contrabajo en semitono. La carta es un lado A y un lado B.',
    primaryMode: 'dark', modeNames: { light: 'Funda de cartón', dark: 'Club de noche' },
    light: { bg: '#EFE7D6', surface: '#FAF5EA', ink: '#121212', muted: '#47433D', accent: '#1A4FA0', onAccent: '#FFFFFF', deco: { blue: '#1A4FA0', mustard: '#E39B1B', black: '#121212', cream: '#EFE7D6', red: '#C2402A' } },
    dark: { bg: '#0D1220', surface: '#161E33', ink: '#EFE7D6', muted: '#B8B2A5', accent: '#F2B84B', onAccent: '#0D1220', deco: { blue: '#3E6FC4', mustard: '#F2B84B', black: '#05070D', cream: '#EFE7D6', red: '#E0563C' } },
    type: { display: "'Archivo Variable', 'Arial Narrow', sans-serif", text: "'Archivo Variable', system-ui, sans-serif", accent: "'Instrument Serif', Georgia, serif" },
    decisions: [
      'Archivo extracondensada en 900 para titulares de tapa de disco; Instrument Serif itálica como contrapunto',
      'Dos tintas por pieza (azul y mostaza sobre crema o negro), con semitono SVG en vez de fotos',
      'La agenda son discos: cada noche tiene su tapa propia',
      'La carta es un tracklist: Lado A para compartir, Lado B de la cocina, y la limonada sin alcohol como bonus track',
      'La reserva es la etiqueta del disco: mesa, personas y noche. Sin entradas ni listas: eso es EventOS',
    ],
    signature: 'Contrabajo en semitono y disco con etiqueta de reserva',
    motion: 'El disco sale de la funda, gira, baja la púa, laten los ecualizadores y la etiqueta muestra la mesa',
    inspiration: ['Tapas de Blue Note de Reid Miles: una o dos tintas, tipografía protagonista y títulos cortados', 'Bares con agenda de música en vivo junto a la reserva'],
    differs: 'Es la única identidad tipográfica y gráfica: no hay comida en primer plano sino música, con la comida como el plan de la noche.',
    provisional: true,
  },
  {
    biz: 'rapida', name: 'Brasa Rápida', rubro: 'Comida rápida', concept: 'Brasa a la vista',
    thesis: 'La hamburguesa enorme y brillante, el cheddar que se derrite, el combo que se arma por pasos con fotos de producto y el número de retiro en el tablero, como en las grandes cadenas.',
    primaryMode: 'light', modeNames: { light: 'Pan tostado', dark: 'Parrilla' },
    light: { bg: '#FFF3E2', surface: '#FFFFFF', ink: '#3A1A0C', muted: '#6D4A36', accent: '#C3241A', onAccent: '#FFFFFF', deco: { red: '#D7301F', mustard: '#FFB21A', flame: '#FF6B1A', brown: '#4A2312', bun: '#F2A640', cream: '#FFF3E2' } },
    dark: { bg: '#1C0F08', surface: '#2A1810', ink: '#FFF3E2', muted: '#DCC1A8', accent: '#FFB21A', onAccent: '#1C0F08', deco: { red: '#E8402C', mustard: '#FFB21A', flame: '#FF7A2A', brown: '#120804', bun: '#F2A640', cream: '#FFF3E2' } },
    type: { display: "'Fredoka Variable', system-ui, sans-serif", text: "'Fredoka Variable', system-ui, sans-serif" },
    decisions: [
      'Fredoka en 700: redonda, gorda y apetitosa, como las tipografías propias de las grandes cadenas',
      'La comida es la foto: una hamburguesa ilustrada con brillo, cheddar derretido y marcas de parrilla',
      'Rail de categorías con miniaturas de producto, como en un kiosco de autoservicio',
      'El combo se arma en tres pasos con el producto a la vista: el tamaño se ve en el paquete de papas',
      'Tablero de números de retiro (Preparando / Listo) como pieza de marca, también para el comercio',
    ],
    signature: 'Hamburguesa doble con cheddar derretido, papas y bebida',
    motion: 'Las capas caen y rebotan, el cheddar se derrite, las papas saltan y el número pasa de Preparando a Listo',
    inspiration: ['Burger King 2021 (Jones Knowles Ritchie): colores tomados de la parrilla, tipografía redonda inspirada en la comida y primeros planos con textura', 'McDonald’s: kiosco y app con imágenes grandes de producto y agrupación por categoría', 'Mostaza como referencia argentina de cadena'],
    differs: 'Es la única identidad de cadena: rápida, alegre, con el producto como foto y la operación (números de retiro) como parte de la marca.',
    provisional: true,
  },
]

export const identityOf = (biz: string) => IDENTITIES.find((i) => i.biz === biz)
export const paletteOf = (i: Identity, mode: Mode) => (mode === 'dark' ? i.dark : i.light)

const lum = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((k) => parseInt(hex.slice(k, k + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
export const contrast = (a: string, b: string) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p)
  return (x + 0.05) / (y + 0.05)
}
/** Pares de texto que la identidad debe cumplir (4,5:1). */
export function contrastPairs(p: Palette) {
  return [
    { label: 'Texto / fondo', fg: p.ink, bg: p.bg },
    { label: 'Texto / superficie', fg: p.ink, bg: p.surface },
    { label: 'Secundario / fondo', fg: p.muted, bg: p.bg },
    { label: 'Secundario / superficie', fg: p.muted, bg: p.surface },
    { label: 'Botón: texto / acento', fg: p.onAccent, bg: p.accent },
    { label: 'Acento como texto / fondo', fg: p.accent, bg: p.bg },
    { label: 'Acento como texto / superficie', fg: p.accent, bg: p.surface },
  ]
}

export function vars(i: Identity, mode: Mode): Record<string, string> {
  const p = paletteOf(i, mode)
  const base: Record<string, string> = { '--bg': p.bg, '--surface': p.surface, '--ink': p.ink, '--muted': p.muted, '--accent': p.accent, '--on-accent': p.onAccent, '--display': i.type.display, '--text': i.type.text, '--script': i.type.accent ?? i.type.display }
  for (const [k, v] of Object.entries(p.deco)) base[`--${k}`] = v
  return base
}
