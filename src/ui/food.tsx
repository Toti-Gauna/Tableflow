import type { FoodNote, MenuItem } from '../domain/types'
import { fmtARS } from '../domain/money'
import { Glyph } from './glyphs'

// Códigos de alérgenos de la carta impresa. Información de muestra: la leyenda acompaña siempre a los códigos.
const CODE: Record<string, string> = { gluten: 'G', lácteos: 'L', huevo: 'H', pescado: 'P', sulfitos: 'S' }

/** Leyenda solo con los códigos que aparecen en esta carta. */
export function allergenKey(items: MenuItem[]): string {
  const used = new Set(items.flatMap((i) => (i.foodNote.status === 'completa' ? i.foodNote.allergens : [])))
  const base = new Set([...used].map((a) => a.replace(/\s*\(.*\)$/, '')))
  const parts = Object.entries(CODE).filter(([name]) => base.has(name)).map(([name, c]) => `${c} ${name}`)
  if ([...used].some((a) => a.includes('según'))) parts.push('* según la leche elegida')
  return parts.join(' · ')
}

function codeOf(a: string) {
  const base = a.replace(/\s*\(.*\)$/, '')
  return `${CODE[base] ?? base.slice(0, 1).toUpperCase()}${a.includes('según') ? '*' : ''}`
}

/** Códigos visibles + texto completo para lectores de pantalla; "consultar" si la ficha está pendiente. */
export function AllergenCodes({ note }: { note: FoodNote }) {
  if (note.status !== 'completa') {
    return (
      <span className="ask">
        <Glyph name="flag" size={14} /> Consultar alérgenos al equipo
      </span>
    )
  }
  if (!note.allergens.length) return <span className="sr-only">Sin alérgenos declarados (muestra).</span>
  return (
    <span>
      <span className="codes" aria-hidden="true">{note.allergens.map(codeOf).join(' · ')}</span>
      <span className="sr-only">Contiene (muestra): {note.allergens.join(', ')}.</span>
    </span>
  )
}

/** Frase completa para el detalle del plato. */
export function foodNoteText(note: FoodNote): { tone: 'warn' | 'info'; text: string } {
  if (note.status !== 'completa') return { tone: 'warn', text: 'Alérgenos sin confirmar por el negocio: consultá al equipo antes de pedir.' }
  if (!note.allergens.length) return { tone: 'info', text: 'Sin alérgenos declarados (información de muestra).' }
  return { tone: 'info', text: `Contiene (información de muestra): ${note.allergens.join(', ')}.` }
}

/** Precio de carta: pesos enteros sin ",00" (como en una carta impresa). Totales y tickets usan fmtARS completo. */
export function fmtMenu(cents: number) {
  return fmtARS(cents).replace(/,00$/, '')
}

export const isVeg = (i: MenuItem) => i.tags.includes('vegetariano')
