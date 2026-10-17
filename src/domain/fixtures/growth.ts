import type { BusinessId, Campaign, CustomerHistory } from '../types'

/**
 * P5-L6 · Historial sintético previo a la demo: la semilla solo tiene pedidos del lunes 19, así que la recencia y la
 * frecuencia de cada cliente se completan con este resumen ficticio. Se muestra como tal en la ficha del cliente.
 * [cliente, negocio, días desde el último pedido, pedidos en 90 días, gasto en 90 días (pesos), platos favoritos]
 */
const H: [string, BusinessId, number, number, number, string[]][] = [
  ['CL-001', 'mesa-clara', 12, 5, 148000, ['MC-12', 'MC-07']],
  ['CL-002', 'mesa-clara', 45, 2, 62000, ['MC-15']],
  ['CL-003', 'mesa-clara', 8, 6, 210000, ['MC-12', 'MC-19']],
  ['CL-004', 'mesa-clara', 62, 1, 18500, ['MC-12']],
  ['CL-006', 'ritual-cafe', 3, 9, 98000, ['RC-04', 'RC-11']],
  ['CL-007', 'ritual-cafe', 1, 4, 31000, ['RC-07']],
  ['CL-008', 'ritual-cafe', 38, 2, 11000, ['RC-03']],
  ['CL-009', 'copo', 20, 3, 24000, ['CO-02']],
  ['CL-011', 'brasa', 6, 5, 63000, ['BR-01']],
  ['CL-012', 'brasa', 41, 1, 14400, ['BR-02']],
  ['CL-013', 'compas', 33, 1, 98000, ['TC-06']],
]
export function customerHistory(T0: number): CustomerHistory[] {
  return H.map(([customerId, businessId, last, n, spend, top]) => ({
    id: `HIS-${customerId}`, businessId, createdAt: T0, version: 1, customerId, lastOrderDaysAgo: last, orders90: n, spend90Cents: spend * 100, topItemIds: top,
  }))
}

type Draft = Omit<Campaign, 'id' | 'businessId' | 'createdAt' | 'version' | 'status' | 'createdBy' | 'approvedBy' | 'activatedAt' | 'lastIssuedKey' | 'reason' | 'operationId'>
const R = (p: number) => p * 100
const rules = (r: Partial<Draft['rules']>): Draft['rules'] => ({ minOrderCents: 0, validDays: 14, maxDiscountCents: 0, maxPerCustomer: 1, totalCap: 50, budgetCents: R(50000), ...r })

/** Campañas de muestra, cada una en un punto distinto del ciclo. `steps`: hasta dónde llega en la semilla. */
export const SEED_CAMPAIGNS: { businessId: BusinessId; op: string; steps: ('approve' | 'activate')[]; draft: Draft }[] = [
  {
    businessId: 'ritual-cafe', op: 'seed-cmp-rc-1', steps: ['approve', 'activate'],
    draft: {
      name: 'Merienda de la semana', scope: 'segmento', trigger: 'manual', event: null, cadence: 'unica', seasonId: null,
      startKey: '2026-10-19', endKey: '2026-11-15', audience: { customerIds: [], segment: 'frecuentes' },
      benefit: { type: 'porcentaje', value: 15, itemIds: ['RC-15', 'RC-16', 'RC-11', 'RC-18'] },
      rules: rules({ validDays: 14, maxDiscountCents: R(1500), totalCap: 50, budgetCents: R(60000) }),
      refItemId: 'RC-15', fixedCostCents: R(8000), assumedRedemptionPct: 30,
    },
  },
  {
    businessId: 'mesa-clara', op: 'seed-cmp-mc-1', steps: ['approve'],
    draft: {
      name: 'Volvé al bodegón', scope: 'segmento', trigger: 'manual', event: null, cadence: 'unica', seasonId: null,
      startKey: '2026-10-19', endKey: '2026-11-30', audience: { customerIds: [], segment: 'inactivos' },
      benefit: { type: 'monto', value: R(3000), itemIds: [] },
      rules: rules({ minOrderCents: R(15000), validDays: 30, maxDiscountCents: R(3000), totalCap: 30, budgetCents: R(90000) }),
      refItemId: 'MC-12', fixedCostCents: R(15000), assumedRedemptionPct: 20,
    },
  },
  {
    businessId: 'mesa-clara', op: 'seed-cmp-mc-2', steps: ['approve', 'activate'],
    draft: {
      name: 'Fiestas en el bodegón', scope: 'masiva', trigger: 'programada', event: null, cadence: 'festividad', seasonId: 'fiestas',
      startKey: '2026-12-01', endKey: '2026-12-31', audience: { customerIds: [], segment: null },
      benefit: { type: 'porcentaje', value: 10, itemIds: ['MC-22', 'MC-23', 'MC-24', 'MC-25'] },
      rules: rules({ validDays: 7, maxDiscountCents: R(2000), maxPerCustomer: 2, totalCap: 80, budgetCents: R(40000) }),
      refItemId: 'MC-22', fixedCostCents: 0, assumedRedemptionPct: null,
    },
  },
  {
    businessId: 'copo', op: 'seed-cmp-co-1', steps: [],
    draft: {
      name: 'Kilo para la familia', scope: 'masiva', trigger: 'manual', event: null, cadence: 'unica', seasonId: null,
      startKey: '2026-10-19', endKey: '2026-11-30', audience: { customerIds: [], segment: null },
      benefit: { type: 'porcentaje', value: 10, itemIds: ['CO-06'] },
      rules: rules({ validDays: 21, maxDiscountCents: R(2500), totalCap: 40, budgetCents: R(80000) }),
      refItemId: 'CO-06', fixedCostCents: R(6000), assumedRedemptionPct: 25,
    },
  },
  {
    businessId: 'brasa', op: 'seed-cmp-br-1', steps: ['approve', 'activate'],
    draft: {
      name: 'Bienvenida a la brasa', scope: 'masiva', trigger: 'evento', event: 'primer-pedido', cadence: 'unica', seasonId: null,
      startKey: '2026-10-19', endKey: '2026-12-31', audience: { customerIds: [], segment: null },
      benefit: { type: 'monto', value: R(2000), itemIds: ['BR-01', 'BR-02'] },
      rules: rules({ validDays: 30, maxDiscountCents: R(2000), totalCap: 100, budgetCents: R(200000) }),
      refItemId: 'BR-01', fixedCostCents: R(5000), assumedRedemptionPct: null,
    },
  },
  {
    businessId: 'brasa', op: 'seed-cmp-br-2', steps: ['approve', 'activate'],
    draft: {
      name: 'Traé a alguien', scope: 'masiva', trigger: 'evento', event: 'referido', cadence: 'unica', seasonId: null,
      startKey: '2026-10-19', endKey: '2026-12-31', audience: { customerIds: [], segment: null },
      benefit: { type: 'monto', value: R(2500), itemIds: [] },
      rules: rules({ minOrderCents: R(8000), validDays: 30, maxDiscountCents: R(2500), maxPerCustomer: 3, totalCap: 60, budgetCents: R(150000) }),
      refItemId: 'BR-01', fixedCostCents: 0, assumedRedemptionPct: null,
    },
  },
  {
    businessId: 'compas', op: 'seed-cmp-tc-1', steps: ['approve', 'activate'],
    draft: {
      name: 'Martes de tapas', scope: 'masiva', trigger: 'programada', event: null, cadence: 'semanal', seasonId: null,
      startKey: '2026-10-20', endKey: '2026-12-15', audience: { customerIds: [], segment: null },
      benefit: { type: 'porcentaje', value: 10, itemIds: ['TC-01', 'TC-02', 'TC-03', 'TC-04', 'TC-07'] },
      rules: rules({ validDays: 1, maxDiscountCents: R(1500), maxPerCustomer: 8, totalCap: 200, budgetCents: R(120000) }),
      refItemId: 'TC-01', fixedCostCents: R(10000), assumedRedemptionPct: 15,
    },
  },
]
