// P5-L2 · Quince direcciones visuales (tres por negocio) para elegir antes de extender el diseño.
// Datos puros: los usa el estudio (#/propuestas) y la prueba de contraste (tests/propuestas.test.ts).

export type PzBiz = 'cafe' | 'resto' | 'hela' | 'bar' | 'rapida'
/** Composición base de la pantalla pública. */
export type Archetype = 'editorial' | 'zen' | 'poster' | 'sculpt' | 'night' | 'board'
/** Tratamiento de las ilustraciones. */
export type ArtStyle = 'ink' | 'line' | 'flat' | 'soft' | 'mono' | 'block'
/** Recurso gráfico de fondo o separación. */
export type Deco = 'none' | 'hairline' | 'stripes' | 'blobs' | 'dots' | 'material' | 'staff' | 'speed' | 'grid'

export interface Palette {
  bg: string
  surface: string
  ink: string
  muted: string
  line: string
  accent: string
  onAccent: string
  accent2: string
}

export interface Concept {
  id: string
  biz: PzBiz
  n: 1 | 2 | 3
  name: string
  thesis: string
  archetype: Archetype
  art: ArtStyle
  deco: Deco
  fonts: { display: string; text: string; displayWeight: number; displayItalic?: boolean; upper?: boolean; tracking?: string; textWeight?: number }
  radius: number
  border: number
  shadow: 'none' | 'soft' | 'offset' | 'glow'
  light: Palette
  dark: Palette
  /** Modo con el que abre la identidad (el bar nocturno nace oscuro). */
  primaryMode: 'light' | 'dark'
  motion: { ease: string; ms: number; stagger: number; label: string }
  decisions: string[]
  pertinence: string
  legibility: string
  viability: string
  risk: string
  recommended?: boolean
}

export const BIZ_LABEL: Record<PzBiz, { rubro: string; name: string; provisional: boolean }> = {
  cafe: { rubro: 'Cafetería', name: 'Ritual Café', provisional: false },
  resto: { rubro: 'Restaurante / bodegón', name: 'Mesa Clara', provisional: false },
  hela: { rubro: 'Heladería', name: 'Copo', provisional: true },
  bar: { rubro: 'Bar gastronómico', name: 'Taberna Compás', provisional: true },
  rapida: { rubro: 'Comida rápida', name: 'Brasa Rápida', provisional: true },
}

export const BIZ_ORDER: PzBiz[] = ['cafe', 'resto', 'hela', 'bar', 'rapida']

export const CONCEPTS: Concept[] = [
  // ───────────── Cafetería ─────────────
  {
    id: 'cafe-1', biz: 'cafe', n: 1, name: 'Barra editorial', archetype: 'editorial', art: 'ink', deco: 'hairline',
    thesis: 'La carta como una revista de café: titulares con serif cálida, notas de origen al margen y la barra dibujada con tinta.',
    fonts: { display: "'Young Serif', Georgia, serif", text: "'Instrument Sans Variable', system-ui, sans-serif", displayWeight: 400 },
    radius: 10, border: 1, shadow: 'soft', primaryMode: 'light',
    light: { bg: '#F4EEE4', surface: '#FFFDF8', ink: '#2A1D14', muted: '#6B5646', line: '#DCCFBE', accent: '#8C3B1F', onAccent: '#FFF8F0', accent2: '#C99A5B' },
    dark: { bg: '#1B1410', surface: '#261C16', ink: '#F3E8DA', muted: '#BBA894', line: '#3D2F25', accent: '#E0894F', onAccent: '#1B1410', accent2: '#C99A5B' },
    motion: { ease: 'cubic-bezier(.2,.7,.2,1)', ms: 520, stagger: 140, label: 'Vapor lento y entrada de tinta' },
    decisions: ['Titulares en Young Serif, cuerpo en Instrument Sans', 'Lista de precios con puntos guía, como carta impresa', 'Notas de origen y método en columna lateral', 'Ilustración con contorno de tinta y relleno cálido'],
    pertinence: 'Encaja con un café de especialidad que explica orígenes y métodos.',
    legibility: 'Alta: serif solo en titulares, cuerpo sans de 16 px.',
    viability: 'Reutiliza el sistema de ilustración actual con otra paleta.',
    risk: 'Es la más parecida al restaurante editorial: si se eligen ambas, se distinguen menos.',
  },
  {
    id: 'cafe-2', biz: 'cafe', n: 2, name: 'Kissaten', archetype: 'zen', art: 'line', deco: 'hairline', recommended: true,
    thesis: 'Minimalismo japonés de barra: mucho aire, una sola línea de dibujo, el sello rojo como único acento y el método como protagonista.',
    fonts: { display: "'Shippori Mincho', 'Times New Roman', serif", text: "'Albert Sans Variable', system-ui, sans-serif", displayWeight: 500 },
    radius: 2, border: 1, shadow: 'none', primaryMode: 'light',
    light: { bg: '#F6F4EF', surface: '#FFFFFF', ink: '#1E1E1C', muted: '#5F5E58', line: '#E2DFD6', accent: '#3F5A4A', onAccent: '#F6F4EF', accent2: '#B5543A' },
    dark: { bg: '#121311', surface: '#1B1C1A', ink: '#ECEAE3', muted: '#A3A199', line: '#2C2D2A', accent: '#8FB59E', onAccent: '#121311', accent2: '#D9785E' },
    motion: { ease: 'cubic-bezier(.16,1,.3,1)', ms: 640, stagger: 180, label: 'Trazo que se dibuja y vapor que sube' },
    decisions: ['Mincho en titulares, sans neutra en interfaz', 'Una columna con márgenes amplios y separadores de 1 px', 'Dibujo de línea única sin relleno; el sello rojo marca el estado', 'El configurador muestra el método (V60, Chemex) antes que el precio'],
    pertinence: 'Ritual Café vende precisión de método y origen; el silencio visual lo pone en primer plano.',
    legibility: 'Alta en claro y oscuro; jerarquía por tamaño y espacio, no por color.',
    viability: 'Pocos componentes y arte de línea liviano; requiere disciplina de espaciado.',
    risk: 'Si se vacía de contenido puede parecer frío: la carta debe sostener la página.',
  },
  {
    id: 'cafe-3', biz: 'cafe', n: 3, name: 'Merienda retro', archetype: 'poster', art: 'flat', deco: 'stripes',
    thesis: 'Confitería de barrio reinterpretada: rayas de toldo, sellos redondos y una serif con carácter para meriendas y medialunas.',
    fonts: { display: "'Gloock', Georgia, serif", text: "'Space Grotesk Variable', system-ui, sans-serif", displayWeight: 400 },
    radius: 18, border: 2, shadow: 'offset', primaryMode: 'light',
    light: { bg: '#FBF1DE', surface: '#FFF9EE', ink: '#22223A', muted: '#55556E', line: '#22223A', accent: '#B8401C', onAccent: '#FFF9EE', accent2: '#2F7D6D' },
    dark: { bg: '#191A2B', surface: '#23243A', ink: '#FBF1DE', muted: '#C2BFB5', line: '#FBF1DE', accent: '#F07A4B', onAccent: '#191A2B', accent2: '#6CC2AE' },
    motion: { ease: 'cubic-bezier(.34,1.56,.64,1)', ms: 420, stagger: 110, label: 'Rebote breve y sello que se estampa' },
    decisions: ['Gloock en titulares con sellos circulares', 'Bandas de rayas como separadores', 'Tarjetas con borde de 2 px y sombra desplazada', 'Ilustración plana sin contorno, colores de confitería'],
    pertinence: 'Funciona si se quiere empujar meriendas y medialunas más que el café de origen.',
    legibility: 'Buena; los bordes marcados ayudan en móvil.',
    viability: 'Media: rayas y sellos son SVG simples.',
    risk: 'Lo retro envejece rápido y compite con la estética de comida rápida retro.',
  },
  // ───────────── Restaurante / bodegón ─────────────
  {
    id: 'resto-1', biz: 'resto', n: 1, name: 'Cocina de autor', archetype: 'editorial', art: 'mono', deco: 'hairline',
    thesis: 'Menú de pasos numerados con serif de alto contraste, grabado monocromo y una sola tinta bordó para lo importante.',
    fonts: { display: "'Cormorant Garamond', Georgia, serif", text: "'Karla Variable', system-ui, sans-serif", displayWeight: 500, displayItalic: true },
    radius: 0, border: 1, shadow: 'none', primaryMode: 'light',
    light: { bg: '#F2EFE9', surface: '#FBFAF7', ink: '#171614', muted: '#5A5650', line: '#D8D2C7', accent: '#7A2E2E', onAccent: '#FBFAF7', accent2: '#8A6F33' },
    dark: { bg: '#131211', surface: '#1C1A18', ink: '#EFEBE4', muted: '#A8A197', line: '#2F2C28', accent: '#D88B7E', onAccent: '#131211', accent2: '#C9AE70' },
    motion: { ease: 'cubic-bezier(.22,.61,.36,1)', ms: 700, stagger: 200, label: 'Revelado lento del plato' },
    decisions: ['Cormorant itálica para nombres de plato', 'Pasos numerados (I, II, III) en lugar de categorías', 'Grabado de una sola tinta', 'Sin sombras ni tarjetas: reglas finas y espacio'],
    pertinence: 'Sirve para un restaurante de autor; para un bodegón puede sonar pretencioso.',
    legibility: 'Media-alta: Cormorant necesita tamaño; el cuerpo va en Karla.',
    viability: 'Arte monocromo nuevo para 28 platos.',
    risk: 'Se aleja del tono hogareño de Mesa Clara.',
  },
  {
    id: 'resto-2', biz: 'resto', n: 2, name: 'Bodegón contemporáneo', archetype: 'editorial', art: 'ink', deco: 'dots', recommended: true,
    thesis: 'Evolución de la dirección actual: papel cálido, pizarra del día, Fraunces con carácter y las 42 ilustraciones existentes con tinta y grano.',
    fonts: { display: "'Fraunces Variable', Georgia, serif", text: "'Manrope Variable', system-ui, sans-serif", displayWeight: 600 },
    radius: 12, border: 1, shadow: 'soft', primaryMode: 'light',
    light: { bg: '#F7F3EA', surface: '#FFFDF8', ink: '#1F271E', muted: '#566052', line: '#E2DACB', accent: '#355443', onAccent: '#FFFFFF', accent2: '#A44431' },
    dark: { bg: '#141A15', surface: '#1D251E', ink: '#F1EBDD', muted: '#B3B9AA', line: '#2D372E', accent: '#8DB39B', onAccent: '#141A15', accent2: '#E08A72' },
    motion: { ease: 'cubic-bezier(.2,.8,.2,1)', ms: 480, stagger: 130, label: 'El plato se compone sobre el mantel' },
    decisions: ['Conserva Fraunces + Manrope y la paleta papel/verde/terracota', 'Pizarra del día como pieza protagonista', 'Reutiliza las ilustraciones de Mesa Clara', 'Suma modo oscuro de salón nocturno'],
    pertinence: 'Es la identidad que ya funciona con la carta real y el brief "carta de casa".',
    legibility: 'Medida: 61 pares de contraste verificados en P2.',
    viability: 'La más rápida: arte, componentes y pruebas existentes.',
    risk: 'Menos novedad; hay que diferenciarla con claridad del café y del bar.',
  },
  {
    id: 'resto-3', biz: 'resto', n: 3, name: 'Materia sobria', archetype: 'zen', art: 'flat', deco: 'material',
    thesis: 'Piedra, madera y lino: superficies con textura sutil, serif fina y una grilla tranquila de salón contemporáneo.',
    fonts: { display: "'Instrument Serif', Georgia, serif", text: "'Inter Variable', system-ui, sans-serif", displayWeight: 400 },
    radius: 6, border: 1, shadow: 'none', primaryMode: 'light',
    light: { bg: '#ECEAE6', surface: '#F7F6F3', ink: '#1F2421', muted: '#575E59', line: '#CFCBC3', accent: '#2F4A3E', onAccent: '#F7F6F3', accent2: '#9C6B48' },
    dark: { bg: '#101312', surface: '#191D1B', ink: '#E9E7E2', muted: '#9DA39E', line: '#2A2F2C', accent: '#9CC2AE', onAccent: '#101312', accent2: '#C99A74' },
    motion: { ease: 'cubic-bezier(.4,0,.2,1)', ms: 560, stagger: 150, label: 'Capas de material que se asientan' },
    decisions: ['Instrument Serif fina en titulares', 'Texturas de piedra y madera como superficies', 'Grilla de 12 columnas con mucho aire', 'Ilustración plana sobre material'],
    pertinence: 'Apta para un salón moderno; resta calidez de bodegón.',
    legibility: 'Alta; las texturas quedan por debajo del 6 % de contraste.',
    viability: 'Media: texturas SVG procedurales livianas.',
    risk: 'Se puede leer como hotel o estudio de arquitectura.',
  },
  // ───────────── Heladería ─────────────
  {
    id: 'hela-1', biz: 'hela', n: 1, name: 'Escultórica lúdica', archetype: 'sculpt', art: 'soft', deco: 'blobs', recommended: true,
    thesis: 'El helado como objeto escultórico: volúmenes brillantes, formas redondeadas y una tipografía gorda que se siente cremosa.',
    fonts: { display: "'Bagel Fat One', system-ui, sans-serif", text: "'Nunito Variable', system-ui, sans-serif", displayWeight: 400 },
    radius: 28, border: 0, shadow: 'soft', primaryMode: 'light',
    light: { bg: '#FFF4EC', surface: '#FFFFFF', ink: '#3A1F2B', muted: '#74505F', line: '#F2D9CC', accent: '#C2185B', onAccent: '#FFFFFF', accent2: '#2E9C8F' },
    dark: { bg: '#1E1218', surface: '#2A1A22', ink: '#FFE9F0', muted: '#D7AFC0', line: '#432A36', accent: '#FF7FAE', onAccent: '#1E1218', accent2: '#6FD6C6' },
    motion: { ease: 'cubic-bezier(.34,1.56,.64,1)', ms: 560, stagger: 160, label: 'Bochas que caen y se asientan' },
    decisions: ['Bagel Fat One en titulares, Nunito en interfaz', 'Bochas con volumen y brillo, sin contorno', 'Formas orgánicas de fondo', 'Selector de gustos como bochas que se suman al formato'],
    pertinence: 'El brief pide frescura, color y producto protagonista: el helado es la interfaz.',
    legibility: 'Alta con Nunito; la display solo en titulares cortos.',
    viability: 'Media: gradientes y bochas paramétricas por gusto.',
    risk: 'Puede resultar infantil si se abusa del rosa; el acento menta lo equilibra.',
  },
  {
    id: 'hela-2', biz: 'hela', n: 2, name: 'Pop geométrico', archetype: 'poster', art: 'flat', deco: 'grid',
    thesis: 'Círculos, medias lunas y bloques de color plano sobre grilla: una heladería de diseño con contraste fuerte.',
    fonts: { display: "'Unbounded Variable', system-ui, sans-serif", text: "'Outfit Variable', system-ui, sans-serif", displayWeight: 700, upper: true, tracking: '-0.02em' },
    radius: 999, border: 2, shadow: 'none', primaryMode: 'light',
    light: { bg: '#FFFFFF', surface: '#F3F6FF', ink: '#111133', muted: '#44466A', line: '#111133', accent: '#2346E8', onAccent: '#FFFFFF', accent2: '#FFC21A' },
    dark: { bg: '#0E0F2A', surface: '#181A3D', ink: '#F3F4FF', muted: '#B6B9E0', line: '#F3F4FF', accent: '#8EA2FF', onAccent: '#0E0F2A', accent2: '#FFD24D' },
    motion: { ease: 'cubic-bezier(.65,0,.35,1)', ms: 360, stagger: 90, label: 'Formas que encajan en la grilla' },
    decisions: ['Unbounded en mayúsculas, Outfit en cuerpo', 'Botones y chips totalmente redondos', 'Bochas como círculos planos sobre grilla', 'Cobalto y amarillo como pareja fija'],
    pertinence: 'Diferencia mucho de las otras heladerías; menos cálida.',
    legibility: 'Alta; mayúsculas solo en titulares.',
    viability: 'Alta: geometría simple.',
    risk: 'La comida pierde apetito visual con formas tan abstractas.',
  },
  {
    id: 'hela-3', biz: 'hela', n: 3, name: 'Pastel sereno', archetype: 'zen', art: 'soft', deco: 'none',
    thesis: 'Minimalismo pastel: fondos casi blancos, una sola tipografía amable y los colores reales de cada gusto como únicos acentos.',
    fonts: { display: "'Lexend Variable', system-ui, sans-serif", text: "'Lexend Variable', system-ui, sans-serif", displayWeight: 300, tracking: '-0.03em' },
    radius: 16, border: 1, shadow: 'none', primaryMode: 'light',
    light: { bg: '#F7F5F2', surface: '#FFFFFF', ink: '#2B2B33', muted: '#61616C', line: '#E7E3DD', accent: '#5B4FB0', onAccent: '#FFFFFF', accent2: '#E9B8C4' },
    dark: { bg: '#16161B', surface: '#202027', ink: '#EEEDF2', muted: '#A9A8B5', line: '#303039', accent: '#B3A9F2', onAccent: '#16161B', accent2: '#E9B8C4' },
    motion: { ease: 'cubic-bezier(.33,1,.68,1)', ms: 480, stagger: 140, label: 'Fundido suave de bochas' },
    decisions: ['Lexend en todas las jerarquías', 'Colores de gusto como único color', 'Sin bordes gruesos ni sombras', 'Mucho espacio entre gustos'],
    pertinence: 'Elegante y tranquila; menos lúdica para familias.',
    legibility: 'Muy alta; Lexend está pensada para lectura.',
    viability: 'Alta.',
    risk: 'Puede quedar genérica si los gustos no tienen arte propio fuerte.',
  },
  // ───────────── Bar gastronómico ─────────────
  {
    id: 'bar-1', biz: 'bar', n: 1, name: 'Nocturno sofisticado', archetype: 'night', art: 'line', deco: 'hairline',
    thesis: 'Salón nocturno con líneas de bronce, serif alta y fina, y la carta como una invitación impresa.',
    fonts: { display: "'Italiana', Georgia, serif", text: "'Jost Variable', system-ui, sans-serif", displayWeight: 400, upper: true, tracking: '0.08em' },
    radius: 4, border: 1, shadow: 'glow', primaryMode: 'dark',
    light: { bg: '#F3EEE3', surface: '#FFFCF5', ink: '#14201F', muted: '#4E5C5A', line: '#D5CCB9', accent: '#7A5A1E', onAccent: '#FFFCF5', accent2: '#2F7778' },
    dark: { bg: '#0F1416', surface: '#172024', ink: '#F1EADB', muted: '#A9B2AE', line: '#26343A', accent: '#D8B26A', onAccent: '#0F1416', accent2: '#4FA3A5' },
    motion: { ease: 'cubic-bezier(.25,.1,.25,1)', ms: 600, stagger: 170, label: 'Brillo de bronce que recorre la línea' },
    decisions: ['Nace en modo oscuro; el claro es "matiné"', 'Italiana en mayúsculas espaciadas', 'Dibujo de línea en bronce', 'Agenda en franja con fechas grandes'],
    pertinence: 'Apta para bar de cócteles; corre el riesgo de glamorizar el alcohol.',
    legibility: 'Media: Italiana fina pide tamaño grande.',
    viability: 'Alta.',
    risk: 'Se acerca a la estética de boliche, que pertenece a EventOS.',
  },
  {
    id: 'bar-2', biz: 'bar', n: 2, name: 'Neo-brutal gastronómico', archetype: 'poster', art: 'block', deco: 'grid',
    thesis: 'Bloques negros, tipografía pesada y mono, bordes gruesos y sombras duras: una taberna urbana que no pide permiso.',
    fonts: { display: "'Archivo Black', system-ui, sans-serif", text: "'Space Mono', ui-monospace, monospace", displayWeight: 400, upper: true, tracking: '-0.01em' },
    radius: 0, border: 3, shadow: 'offset', primaryMode: 'light',
    light: { bg: '#F2F0E6', surface: '#FFFFFF', ink: '#0A0A0A', muted: '#3A3A3A', line: '#0A0A0A', accent: '#BF2F17', onAccent: '#FFFFFF', accent2: '#3FA34D' },
    dark: { bg: '#111111', surface: '#1C1C1C', ink: '#F2F0E6', muted: '#C4C1B6', line: '#F2F0E6', accent: '#FF6A4D', onAccent: '#111111', accent2: '#6FD07C' },
    motion: { ease: 'steps(4, end)', ms: 320, stagger: 80, label: 'Cortes secos, sin suavizado' },
    decisions: ['Archivo Black + Space Mono', 'Bordes de 3 px y sombra desplazada sólida', 'Ilustración con contorno grueso y colores planos', 'Precios en mono, alineados como ticket'],
    pertinence: 'Diferencial y urbana; menos adecuada para grupos familiares.',
    legibility: 'Alta en titulares; el mono en párrafos largos cansa.',
    viability: 'Alta.',
    risk: 'El brutalismo mal dosificado parece un error de estilo.',
  },
  {
    id: 'bar-3', biz: 'bar', n: 3, name: 'Compás musical', archetype: 'night', art: 'flat', deco: 'staff', recommended: true,
    thesis: 'La agenda manda: pentagramas como separadores, ritmo en la grilla y la comida compartida como el plan de cada noche.',
    fonts: { display: "'Syne Variable', system-ui, sans-serif", text: "'Work Sans Variable', system-ui, sans-serif", displayWeight: 700, tracking: '-0.02em' },
    radius: 14, border: 1, shadow: 'soft', primaryMode: 'light',
    light: { bg: '#F5F1EA', surface: '#FFFFFF', ink: '#1C1830', muted: '#545068', line: '#DAD3E6', accent: '#5B2A86', onAccent: '#FFFFFF', accent2: '#B4621C' },
    dark: { bg: '#15122A', surface: '#1F1B38', ink: '#F0ECF9', muted: '#B3ADCB', line: '#332D52', accent: '#B48CF0', onAccent: '#15122A', accent2: '#F2A65A' },
    motion: { ease: 'cubic-bezier(.45,0,.55,1)', ms: 480, stagger: 125, label: 'Entradas a tempo, como compases' },
    decisions: ['Syne en titulares, Work Sans en cuerpo', 'Pentagrama como separador y barra de progreso', 'Agenda de noches como sección principal', 'Tapas y bebidas sin alcohol en las escenas familiares'],
    pertinence: 'El brief pide agenda como parte del producto; también cubre grupos y mesas.',
    legibility: 'Alta en claro y oscuro.',
    viability: 'Media: pentagramas y notas son SVG simples.',
    risk: 'Si la agenda está vacía, la identidad pierde su eje: necesita estado vacío propio.',
  },
  // ───────────── Comida rápida ─────────────
  {
    id: 'rapida-1', biz: 'rapida', n: 1, name: 'Energía brutal', archetype: 'board', art: 'block', deco: 'speed',
    thesis: 'Amarillo pleno, tipografía condensada gigante y números de retiro que se leen a tres metros.', recommended: true,
    fonts: { display: "'Anton', Impact, sans-serif", text: "'Archivo Variable', system-ui, sans-serif", displayWeight: 400, upper: true, tracking: '0.01em' },
    radius: 6, border: 3, shadow: 'offset', primaryMode: 'light',
    light: { bg: '#FFE14D', surface: '#FFFFFF', ink: '#111111', muted: '#333333', line: '#111111', accent: '#C4211A', onAccent: '#FFFFFF', accent2: '#111111' },
    dark: { bg: '#121212', surface: '#1E1E1E', ink: '#F7F7F2', muted: '#C9C9C2', line: '#F7F7F2', accent: '#FF4A3D', onAccent: '#121212', accent2: '#FFE14D' },
    motion: { ease: 'cubic-bezier(.7,0,.3,1)', ms: 340, stagger: 85, label: 'Ensamblado rápido con golpe final' },
    decisions: ['Anton condensada en mayúsculas', 'Tablero de combos con precio gigante', 'Contorno grueso y colores planos', 'Número de retiro como elemento de marca'],
    pertinence: 'El brief pide composición directa, rápida y de alto contraste.',
    legibility: 'Muy alta a distancia; cuerpo en Archivo.',
    viability: 'Alta.',
    risk: 'El amarillo pleno cansa en sesiones largas del comercio: el panel usa superficie neutra.',
  },
  {
    id: 'rapida-2', biz: 'rapida', n: 2, name: 'Retro dinámico', archetype: 'board', art: 'flat', deco: 'stripes',
    thesis: 'Diner de los setenta con diagonales, insignias redondas y una display gorda: velocidad con nostalgia.',
    fonts: { display: "'Bowlby One', system-ui, sans-serif", text: "'Rubik Variable', system-ui, sans-serif", displayWeight: 400, upper: true },
    radius: 22, border: 2, shadow: 'offset', primaryMode: 'light',
    light: { bg: '#FFF1E0', surface: '#FFFFFF', ink: '#3B1E0E', muted: '#6E4A35', line: '#3B1E0E', accent: '#C63D1B', onAccent: '#FFFFFF', accent2: '#F2B134' },
    dark: { bg: '#1E120B', surface: '#2A1A11', ink: '#FFF1E0', muted: '#D9BFA8', line: '#FFF1E0', accent: '#FF7A4F', onAccent: '#1E120B', accent2: '#F2B134' },
    motion: { ease: 'cubic-bezier(.34,1.4,.64,1)', ms: 400, stagger: 100, label: 'Rebote con líneas de velocidad' },
    decisions: ['Bowlby One + Rubik', 'Franjas diagonales y sellos redondos', 'Ilustración plana con brillos', 'Combos en tarjetas con número de paso'],
    pertinence: 'Cálida y familiar; compite con la merienda retro del café.',
    legibility: 'Alta.',
    viability: 'Alta.',
    risk: 'Lo retro es muy usado en hamburgueserías.',
  },
  {
    id: 'rapida-3', biz: 'rapida', n: 3, name: 'Contraste mínimo', archetype: 'board', art: 'mono', deco: 'none',
    thesis: 'Blanco, negro y un naranja: números enormes, siluetas limpias y cero adorno. Pedir en diez segundos.',
    fonts: { display: "'Inter Tight Variable', system-ui, sans-serif", text: "'Inter Tight Variable', system-ui, sans-serif", displayWeight: 800, tracking: '-0.04em' },
    radius: 8, border: 1, shadow: 'none', primaryMode: 'light',
    light: { bg: '#FFFFFF', surface: '#F4F4F4', ink: '#0B0B0B', muted: '#4D4D4D', line: '#E2E2E2', accent: '#C93A08', onAccent: '#FFFFFF', accent2: '#0B0B0B' },
    dark: { bg: '#0B0B0B', surface: '#171717', ink: '#FAFAFA', muted: '#A3A3A3', line: '#262626', accent: '#FF6A33', onAccent: '#0B0B0B', accent2: '#FAFAFA' },
    motion: { ease: 'cubic-bezier(.2,0,0,1)', ms: 280, stagger: 70, label: 'Deslizamientos cortos y precisos' },
    decisions: ['Inter Tight en todas las jerarquías', 'Números de precio y retiro como protagonistas', 'Siluetas monocromas', 'Un solo color de acción'],
    pertinence: 'Muy clara para pedir rápido; menos apetitosa.',
    legibility: 'Máxima.',
    viability: 'Muy alta.',
    risk: 'Se parece a cualquier app de delivery.',
  },
]

export const conceptById = (id: string) => CONCEPTS.find((c) => c.id === id)
export const conceptsOf = (biz: PzBiz) => CONCEPTS.filter((c) => c.biz === biz)

export function paletteFor(c: Concept, mode: 'light' | 'dark'): Palette {
  return mode === 'dark' ? c.dark : c.light
}

// Contraste WCAG 2.x (mismo cálculo que tests/contrast.test.ts).
const lum = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
export const contrast = (a: string, b: string) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p)
  return (x + 0.05) / (y + 0.05)
}

/** Pares que la identidad debe cumplir: texto 4,5:1 y componentes 3:1. */
export function contrastPairs(p: Palette): { label: string; fg: string; bg: string; min: number }[] {
  return [
    { label: 'Texto / fondo', fg: p.ink, bg: p.bg, min: 4.5 },
    { label: 'Texto / superficie', fg: p.ink, bg: p.surface, min: 4.5 },
    { label: 'Secundario / fondo', fg: p.muted, bg: p.bg, min: 4.5 },
    { label: 'Secundario / superficie', fg: p.muted, bg: p.surface, min: 4.5 },
    { label: 'Botón: texto / acento', fg: p.onAccent, bg: p.accent, min: 4.5 },
    { label: 'Acento como texto / fondo', fg: p.accent, bg: p.bg, min: 4.5 },
    { label: 'Acento como texto / superficie', fg: p.accent, bg: p.surface, min: 4.5 },
  ]
}
