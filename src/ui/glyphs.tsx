import type { MenuItem } from '../domain/types'
import { DishArt, hasArt } from './art'

// Sistema de ilustración propio de TableFlow: línea continua de 1,5 px (no escala con el tamaño),
// esquinas redondeadas, grilla de 24. Dibujado para esta demo: no usa fotos ni assets de terceros.
const P: Record<string, string> = {
  // ---- platos y bebidas
  plate: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 17.5a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11z',
  empanada: 'M3 16a9 9 0 0 1 18 0zM5.4 11.6l1 .9M8 9.2l.7 1.1M12 8.2v1.3M16 9.2l-.7 1.1M18.6 11.6l-1 .9M6 18.5h12',
  pasta: 'M12 20.5a8.5 8.5 0 1 0 0-17 8.5 8.5 0 0 0 0 17zM12 12c0-.8.9-1 1.4-.6.8.6.4 1.9-.6 2.2-1.6.5-3-1-2.6-2.6.5-2 3-2.8 4.6-1.6 2.2 1.6 1.7 5-.8 6',
  steak: 'M5.2 8.6c1.6-3 6.1-4.3 9.5-3.3 3.6 1 5.4 3.9 4.9 7.3-.6 3.6-4.6 6.5-9.1 6-4.1-.5-6.8-3.4-6.3-6.4.2-1.3.5-2.5 1-3.6zM10.5 13a1.6 1.6 0 1 0 0-3.2 1.6 1.6 0 0 0 0 3.2z',
  fish: 'M2.8 12c3-4.6 9.2-5.6 13.8-2.1l4-2.9v10l-4-2.9C12 17.6 5.8 16.6 2.8 12zM7.4 11.3h.01',
  leaf: 'M5 19C5 10.2 10.2 5 19 5c0 8.8-5.2 14-14 14zM5 19l8.5-8.5',
  flan: 'M6.5 17.5h11L15.6 10H8.4zM8.4 10c1 1.1 1.9.3 2.6 1 .7.7 1.6.7 2.2 0 .7-.7 1.6.1 2.4-1M4 20.5h16',
  wine: 'M8 3h8v4.2a4 4 0 0 1-8 0zM8.2 6h7.6M12 11.2V19M8.5 21h7',
  glass: 'M6 4h12l-1.4 15.9A1.6 1.6 0 0 1 15 21.3H9a1.6 1.6 0 0 1-1.6-1.4zM6.6 9h10.8M10.5 13.5h.01M13 16h.01M12 12h.01',
  cup: 'M5 10h11v4a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5zM16 11h1.5a2.5 2.5 0 0 1 0 5H16M3.5 21h15M8.5 7.2c-1-1 1-2 0-3.4M11.5 7.2c-1-1 1-2 0-3.4',
  dripper: 'M4.5 5.5h15l-5 8.5h-5zM4.5 5.5l-1-1.5M9.5 14v2M14.5 14v2M7.5 16h9v3a2 2 0 0 1-2 2h-5a2 2 0 0 1-2-2zM9 8.5h6',
  jar: 'M7.5 3.5h9V6h-9zM8 6v1.6c0 .9-1 1.4-1 3V19a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-8.4c0-1.6-1-2.1-1-3V6M9.8 12.5h3v3h-3zM12.6 16.4h2.4v2.4h-2.4z',
  croissant: 'M3 15c2-6 7-9 9-9s7 3 9 9c-2 1-4 .1-5-1-1 2-2.5 3-4 3s-3-1-4-3c-1 1.1-3 2-5 1zM9.3 7.4l1.3 8.4M14.7 7.4l-1.3 8.4',
  muffin: 'M6 13l1.6 7h8.8L18 13zM5 13c0-4 3-7 7-7s7 3 7 7zM10.2 13l.4 7M13.8 13l-.4 7M12 6V4.5',
  toast: 'M4 19L12 5l8 14zM6.6 15h10.8M8.5 12.5h7',
  bean: 'M12 3c4.4 0 7 4 7 9s-2.6 9-7 9-7-4-7-9 2.6-9 7-9zM12 3c-2 3 2 6 0 9s2 6 0 9',
  // ---- interfaz
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM16.2 16.2 21 21',
  heart: 'M12 20s-7.2-4.4-7.2-10a4.1 4.1 0 0 1 7.2-2.7A4.1 4.1 0 0 1 19.2 10c0 5.6-7.2 10-7.2 10z',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  x: 'M6 6l12 12M18 6 6 18',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3.2 2',
  alert: 'M12 3.8 21 20H3zM12 10v4.2M12 17.2h.01',
  flag: 'M5 21V4M5 4h11l-2 4 2 4H5',
  arrow: 'M5 12h14M13 6l6 6-6 6',
  chevron: 'M6 9l6 6 6-6',
  lock: 'M6 11h12v10H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3',
  sun: 'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4',
  moon: 'M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z',
  chat: 'M4 5h16v11H9.5L4 20.5z',
  phone: 'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2C10 21 3 14 3 6a2 2 0 0 1 2-2z',
  star: 'M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.4l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z',
  stamp: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 17.2a5.2 5.2 0 1 0 0-10.4 5.2 5.2 0 0 0 0 10.4zM12 9.4l.9 1.8 2 .3-1.5 1.4.4 2-1.8-1-1.8 1 .4-2-1.5-1.4 2-.3z',
  sliders: 'M4 7h16M4 17h16M9 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM15 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  restart: 'M4 12a8 8 0 1 0 2.4-5.7M4 4v4h4',
  volume: 'M4 9.5h4L13 5v14l-5-4.5H4zM16.5 9a4.5 4.5 0 0 1 0 6M19 6.5a8 8 0 0 1 0 11',
  mute: 'M4 9.5h4L13 5v14l-5-4.5H4zM17 9.5l4.5 5M21.5 9.5 17 14.5',
  // ---- navegación de administración
  grid: 'M4 4h7v7H4zM13 4h7v4h-7zM13 10h7v10h-7zM4 13h7v7H4z',
  calendar: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4',
  floor: 'M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM12 3v2.8M12 18.2V21M3 12h2.8M18.2 12H21',
  receipt: 'M6 3h12v18l-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5L6 21zM9 8h6M9 12h6M9 16h3',
  flame: 'M12 3c1 3 5 5 5 10a5 5 0 0 1-10 0c0-2.5 1.5-4 2.5-5 .5 2 1.5 2.5 2.5 2.5 0-3-1-5 0-7.5z',
  register: 'M3 7h18v10H3zM12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM6.5 10v4M17.5 10v4',
  book: 'M4 5c3-1 5.5-1 8 1 2.5-2 5-2 8-1v14c-3-1-5.5-1-8 1-2.5-2-5-2-8-1zM12 6v14',
  box: 'M3 8l9-5 9 5v8l-9 5-9-5zM3 8l9 5 9-5M12 13v8',
  people: 'M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3.5 19c.8-3 3-4.5 5.5-4.5s4.7 1.5 5.5 4.5M16 11a2.5 2.5 0 1 0 0-5M17.5 14.6c1.6.5 2.6 1.9 3 4',
  bolt: 'M13 3 5 13.5h6L10 21l8-10.5h-6z',
  chart: 'M4 20h16M7 16v-5M12 16V7M17 16v-8',
  // ---- barra inferior y regalos
  home: 'M4 11.2 12 4l8 7.2V20h-5.2v-5.4H9.2V20H4z',
  gift: 'M4 9.5h16V14H4zM5.5 14h13v6.5h-13zM12 9.5v11M12 9.5C10.6 6.4 6.6 5.6 6.2 7.9 5.8 10 10 9.5 12 9.5zM12 9.5c1.4-3.1 5.4-3.9 5.8-1.6.4 2.1-3.8 1.6-5.8 1.6z',
  smile: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM8.4 14c1 1.6 2.2 2.4 3.6 2.4s2.6-.8 3.6-2.4M9 9.6h.01M15 9.6h.01',
  compass: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM15.6 8.4l-2.1 5.1-5.1 2.1 2.1-5.1z',
  help: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.6 9.4a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2.1-2.4 3.6M12 17h.01',
  envelope: 'M3.5 6h17v12h-17zM3.5 6.5l8.5 6.5 8.5-6.5',
  menu: 'M4 7h16M4 12h16M4 17h10',
  film: 'M4 5.5h16v13H4zM4 9h16M4 15h16M8 5.5V9M12 5.5V9M16 5.5V9M8 15v3.5M12 15v3.5M16 15v3.5',
  music: 'M9 18V6l10-2v12M9 18a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0zM19 16a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z',
}
export type GlyphName = keyof typeof P

export function Glyph({ name, size = 20, title, className }: { name: GlyphName | string; size?: number; title?: string; className?: string }) {
  const d = P[name] ?? P.plate
  return (
    <svg
      className={`glyph ${className ?? ''}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      focusable="false"
    >
      <path d={d} vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

const BY_ID: Record<string, GlyphName> = {
  'MC-04': 'leaf', 'MC-26': 'glass', 'MC-27': 'glass', 'MC-28': 'wine', 'MC-19': 'steak',
  'RC-09': 'jar', 'RC-12': 'muffin', 'RC-14': 'muffin',
}
const BY_CAT: Record<string, GlyphName> = {
  Entradas: 'empanada', Pastas: 'pasta', 'Minutas y carnes': 'steak', Pescados: 'fish', Postres: 'flan', Bebidas: 'glass',
  'Café de barra': 'cup', 'Métodos': 'dripper', 'Pastelería': 'croissant', Salado: 'toast',
}
export function glyphFor(item: Pick<MenuItem, 'id' | 'category'>): GlyphName {
  return BY_ID[item.id] ?? BY_CAT[item.category] ?? 'plate'
}
export function glyphForCategory(cat: string): GlyphName {
  return BY_CAT[cat] ?? 'plate'
}

/** Ilustración del plato (no foto). Usa la pieza propia del set; si un ítem no la tiene, cae al glifo de línea. */
export function Plate({ item, size = 96, caption, decorative }: { item: Pick<MenuItem, 'id' | 'category' | 'name'>; size?: number; caption?: boolean; decorative?: boolean }) {
  if (hasArt(item.id)) {
    return (
      <figure className="plate plate-art" style={{ width: size }}>
        <DishArt item={item} size={size} decorative={decorative} />
        {caption && <figcaption className="plate-cap">Ilustración · sin foto de muestra</figcaption>}
      </figure>
    )
  }
  return (
    <figure className="plate" style={{ width: size }}>
      <span className="plate-disc" style={{ width: size, height: size }} role="img" aria-label={`Ilustración de muestra de ${item.name} (sin foto)`}>
        <Glyph name={glyphFor(item)} size={Math.round(size * 0.46)} />
      </span>
      {caption && <figcaption className="plate-cap">Ilustración · sin foto de muestra</figcaption>}
    </figure>
  )
}

/** Viñeta ilustrada de una sección de la carta: el plato más representativo, en miniatura. */
const CATEGORY_ITEM: Record<string, string> = {
  Entradas: 'MC-02', Pastas: 'MC-06', 'Minutas y carnes': 'MC-12', Pescados: 'MC-20', Postres: 'MC-22', Bebidas: 'MC-28',
  'Café de barra': 'RC-04', 'Métodos': 'RC-07', 'Pastelería': 'RC-11', Salado: 'RC-13',
}
export function CategoryMark({ cat, size = 30 }: { cat: string; size?: number }) {
  const id = CATEGORY_ITEM[cat]
  if (!id || !hasArt(id)) return <Glyph name={glyphForCategory(cat)} size={18} />
  return <DishArt item={{ id, name: cat }} size={size} decorative className="cat-mark" />
}

/** Separador tipográfico de carta impresa. */
export function Fleuron({ className }: { className?: string }) {
  return (
    <svg className={`fleuron ${className ?? ''}`} width="96" height="14" viewBox="0 0 96 14" fill="none" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" aria-hidden="true" focusable="false">
      <path d="M2 7h34M60 7h34M48 1.5c2.6 2.8 2.6 8.2 0 11-2.6-2.8-2.6-8.2 0-11zM41 7h.01M55 7h.01" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}
