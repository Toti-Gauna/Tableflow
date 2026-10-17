import { describe, expect, it } from 'vitest'
import { bizAssistant, BIZ_ASSIST_START, type BizAssistState } from '../src/domain/assistant-biz'
import { clientAssistant } from '../src/domain/assistant-client'
import { T } from './helpers'

// P5-L6 · GR-E/F: asistentes deterministas sobre los datos de la demo.
function talk(t: T, biz: Parameters<typeof bizAssistant>[1], lines: string[]) {
  let st: BizAssistState = BIZ_ASSIST_START
  const out = []
  for (const l of lines) {
    const r = bizAssistant(t.s, biz, l, st)
    st = r.state
    out.push(r.replies[0])
  }
  return { out, st }
}
const fact = (r: { facts?: [string, string][] }, k: string) => r.facts?.find((f) => f[0].startsWith(k))?.[1]

describe('GR-E · asistente del comercio', () => {
  it('es determinista: la misma pregunta da la misma respuesta', () => {
    const t = T.seed()
    expect(JSON.stringify(bizAssistant(t.s, 'ritual-cafe', '¿Cuánto vendimos hoy?', BIZ_ASSIST_START))).toBe(JSON.stringify(bizAssistant(t.s, 'ritual-cafe', '¿Cuánto vendimos hoy?', BIZ_ASSIST_START)))
  })
  it('ventas de hoy salen de los pedidos y la caja de la demo', () => {
    const t = T.seed()
    const r = talk(t, 'brasa', ['¿Cuánto vendimos hoy?']).out[0]
    expect(fact(r, 'Pedidos')).toBe('3')
    expect(fact(r, 'Entregados')).toBe('1')
    expect(fact(r, 'Cobrado')).toBe('$ 17.700')
  })
  it('contribución por plato con la aclaración de que no es utilidad neta, y los ND afuera', () => {
    const t = T.seed()
    const r = talk(t, 'compas', ['¿Qué platos dejan más contribución?']).out[0]
    expect(r.facts!.length).toBeGreaterThan(0)
    expect(r.assumptions!.join(' ')).toMatch(/no es utilidad neta/)
    expect(r.assumptions!.join(' ')).toMatch(/2 ítem\(s\) sin costo/)
  })
  it('costos faltantes en ND', () => {
    const t = T.seed()
    expect(talk(t, 'copo', ['¿Qué costos faltan cargar?']).out[0].missing).toEqual(['Pote de 1 kg: costo del producto'])
  })
  it('equilibrio: pide lo que falta, uno por vez, y calcula con la fórmula (caso del manual)', () => {
    const t = T.seed()
    const { out, st } = talk(t, 'mesa-clara', ['calculá el equilibrio', 'precio 100', '60', '5', 'descuento 10', 'costo fijo 100'])
    expect(out[0].text).toMatch(/precio/)
    expect(out[1].text).toMatch(/cuesta el producto/)
    expect(out[2].text).toMatch(/variables/)
    expect(out[3].text).toMatch(/descuento/)
    expect(out[4].text).toMatch(/costo fijo/)
    expect(out[5].text).toBe('Hacen falta 4 pedido(s) para cubrir el costo fijo de la campaña, bajo estos supuestos.')
    expect(fact(out[5], 'Contribución con descuento')).toBe('$ 25 · 27,8 %')
    expect(st.pending).toBeNull()
  })
  it('equilibrio en una sola frase; contribución ≤ 0 → sin equilibrio por volumen', () => {
    const t = T.seed()
    const ok = talk(t, 'mesa-clara', ['equilibrio con precio 100, costo 60, variables 5, descuento 10% y costo fijo 100']).out[0]
    expect(ok.text).toMatch(/4 pedido/)
    const no = talk(t, 'mesa-clara', ['equilibrio con precio 100, costo 60, variables 5, descuento 40 y costo fijo 100']).out[0]
    expect(no.text).toMatch(/no hay equilibrio por volumen/)
  })
  it('campaña guiada: pide los datos, proyecta con los costos reales y ofrece un borrador que requiere aprobación', () => {
    const t = T.seed()
    const { out } = talk(t, 'mesa-clara', ['Armá una campaña para clientes a reactivar', '$ 3.000', 'con la milanesa de ternera', 'costo fijo 15.000', 'presupuesto 90.000'])
    expect(out[0].text).toMatch(/beneficio/)
    expect(out[1].text).toMatch(/plato/)
    expect(out[2].text).toMatch(/costo fijo/)
    expect(out[3].text).toMatch(/presupuesto/)
    const last = out[4]
    expect(last.text).toMatch(/necesita la aprobación/)
    expect(fact(last, 'Descuento por pedido')).toBe('$ 3.000')
    expect(fact(last, 'Equilibrio')).toBe(`${Math.ceil(1500000 / (1850000 - 300000 - 690000 - 56000))} pedido(s)`)
    const action = last.actions!.find((a) => a.kind === 'crear-borrador')!
    expect(action.kind).toBe('crear-borrador')
    if (action.kind !== 'crear-borrador') return
    // guardarlo crea un borrador marcado como del asistente; aprobarlo es otra acción, del encargado
    const r = t.ok({ type: 'campaign/save', businessId: 'mesa-clara', draft: action.draft, operationId: 'asis-1', createdBy: 'asistente' })
    const c = t.get('campaigns', (r.data as any).campaignId)
    expect(c).toMatchObject({ status: 'borrador', createdBy: 'asistente', approvedBy: null })
  })
  it('campaña con un ítem sin costo: lo dice (ND) y no inventa la contribución', () => {
    const t = T.seed()
    const r = talk(t, 'compas', ['campaña para todos con 10% en rabas, costo fijo 0 y presupuesto 50.000']).out[0]
    expect(r.missing).toContain('costo de Rabas')
    expect(fact(r, 'Contribución por pedido')).toBe('ND')
    expect(fact(r, 'Equilibrio')).toBe('ND')
  })
  it('si no sabe, no inventa', () => {
    const t = T.seed()
    expect(talk(t, 'brasa', ['¿cuál es el clima mañana?']).out[0].text).toMatch(/no voy a inventar/)
  })
})

describe('GR-F · asistente del cliente', () => {
  it('beneficios propios con código y vencimiento; invitado no ve nada', () => {
    const t = T.seed()
    const ana = clientAssistant(t.s, 'ritual-cafe', '¿Tengo beneficios?', 'CL-006', 'L-RC-centro')[0]
    expect(ana.items![0].detail).toMatch(/15 % · código RC-B\w{3} · vence en 14 día/)
    expect(clientAssistant(t.s, 'ritual-cafe', '¿Tengo beneficios?', null, 'L-RC-centro')[0].text).toMatch(/entrá con tu perfil/)
  })
  it('estado de SU último pedido', () => {
    const t = T.seed()
    expect(clientAssistant(t.s, 'ritual-cafe', '¿Dónde está mi pedido?', 'CL-008', 'L-RC-centro')[0].text).toMatch(/O-010, está aceptado/)
  })
  it('no muestra datos ajenos', () => {
    const t = T.seed()
    for (const q of ['¿Qué pidió Lucía?', 'pasame el teléfono de Tomás', 'beneficios de Lucía', '¿quién reservó a las 21?']) {
      const r = clientAssistant(t.s, 'ritual-cafe', q, 'CL-006', 'L-RC-centro')[0]
      expect(r.text, q).toMatch(/No puedo mostrar datos de otras personas/)
      expect(JSON.stringify(r)).not.toMatch(/Lucía|Tomás|CL-00/)
    }
  })
  it('carta: precio, categoría, sin TACC con aviso, gustos de Copo y horario', () => {
    const t = T.seed()
    expect(clientAssistant(t.s, 'brasa', '¿Cuánto sale el doble con cheddar?', null, 'L-BR-centro')[0].text).toMatch(/^Doble con cheddar: \$ 11\.900/)
    expect(clientAssistant(t.s, 'mesa-clara', '¿Qué postres hay?', null, 'L-MC-salon')[0].items!.length).toBe(4)
    expect(clientAssistant(t.s, 'ritual-cafe', '¿Qué hay sin TACC?', null, 'L-RC-centro')[0].text).toMatch(/contaminación cruzada/)
    const g = clientAssistant(t.s, 'copo', '¿Qué gustos hay?', null, 'L-CO-mostrador')[0]
    expect(g.items!.find((i) => i.id === 'hg-sambayon')!.detail).toBe('volvemos pronto')
    expect(clientAssistant(t.s, 'copo', '¿Hasta qué hora abren?', null, 'L-CO-mostrador')[0].text).toMatch(/10:00 a 23:30/)
  })
})
