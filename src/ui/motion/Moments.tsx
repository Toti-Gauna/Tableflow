import { useMemo } from 'react'
import { useApp } from '../../store'
import { pieceFor } from '../art/families'
import { ACCEPTED, orderMotionPlan, reservationMotionPlan } from '../../domain/motion-plan'
import type { Order, Reservation } from '../../domain/types'
import { OrderMoment, useMomentTrigger } from './OrderMoment'

const hasPiece = (k: string) => !!pieceFor(k)

/** Seguimiento del pedido: la pieza de aceptación del negocio (o nada si todavía no fue aceptado o se cayó). */
export function OrderMomentFor({ order }: { order: Order }) {
  const state = useApp()
  const play = useMomentTrigger(order.id, ACCEPTED.includes(order.status))
  const plan = useMemo(() => orderMotionPlan(state, order, hasPiece), [state, order])
  if (!plan) return null
  return <OrderMoment key={order.id} plan={plan} autoplay={play} />
}

/** Detalle de la reserva de Mesa Clara: la mesa se prepara cuando queda confirmada. */
export function ReservationMomentFor({ reservation }: { reservation: Reservation }) {
  const state = useApp()
  const play = useMomentTrigger(reservation.id, reservation.status === 'confirmada')
  const plan = useMemo(() => reservationMotionPlan(state, reservation), [state, reservation])
  if (!plan) return null
  return <OrderMoment key={reservation.id} plan={plan} autoplay={play} />
}
