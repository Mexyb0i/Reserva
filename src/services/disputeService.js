import { disputeSeed } from '../data/paymentData'
import { auditLogService } from './auditLogService'
import { payoutService } from './payoutService'
import { reservationService } from './reservationService'
import { settingsService } from './settingsService'

const DISPUTES_KEY = 'reserva.reservation.disputes'
const delay = (value) => new Promise((resolve) => setTimeout(() => resolve(value), 150))

function readDisputes() {
  const saved = window.localStorage.getItem(DISPUTES_KEY)
  return saved ? JSON.parse(saved) : disputeSeed.map((dispute) => ({ ...dispute }))
}

function saveDisputes(disputes) {
  window.localStorage.setItem(DISPUTES_KEY, JSON.stringify(disputes))
}

export const disputeService = {
  async createDispute({ reservationId, userId = 'user-demo', user = 'Player', reason, details }) {
    if (!reason?.trim() || !details?.trim()) {
      throw new Error('Choose a reason and describe the problem.')
    }
    const reservations = await reservationService.getReservedSchedule()
    const reservation = reservations.find((item) => item.id === reservationId)
    if (!reservation) throw new Error('Reservation not found.')
    if (reservation.status !== 'Completed') {
      throw new Error('Only completed reservations can be disputed.')
    }
    const settings = await settingsService.getSettings()
    if (!isDisputeEligible(reservation, settings.refundPolicy.disputeWindowHours)) {
      throw new Error('The dispute window for this reservation has ended.')
    }
    const disputes = readDisputes()
    if (disputes.some((dispute) => dispute.reservationId === reservationId && dispute.status === 'Open')) {
      throw new Error('There is already an open dispute for this reservation.')
    }
    const dispute = {
      id: `DSP-${Date.now()}`,
      reservationId,
      userId,
      user,
      ownerId: reservation.ownerId ?? 'owner-demo',
      facility: reservation.name,
      reservationSnapshot: {
        id: reservation.id,
        name: reservation.name,
        date: reservation.date,
        startTime: reservation.startTime,
        endTime: reservation.endTime,
        courtRate: reservation.courtRate,
        serviceFee: reservation.serviceFee,
        ownerCommission: reservation.ownerCommission,
        ownerNet: reservation.ownerNet,
        userTotal: reservation.userTotal,
        paymentMethod: reservation.paymentMethod,
        paymentStatus: reservation.paymentStatus,
        payoutStatus: reservation.payoutStatus,
        status: reservation.status,
        refundedAmount: reservation.refundedAmount ?? 0,
      },
      reason: reason.trim(),
      details: details.trim(),
      status: 'Open',
      createdAt: new Date().toISOString(),
    }
    saveDisputes([dispute, ...disputes])
    await payoutService.holdEarningForDispute(reservationId, true)
    return delay({ ...dispute })
  },

  async getDisputes(status = '') {
    return delay(readDisputes()
      .filter((dispute) => !status || dispute.status === status)
      .map((dispute) => ({ ...dispute })))
  },

  async resolveDispute(id, { action, amount, note, actor = 'admin' } = {}) {
    if (!note?.trim()) throw new Error('Add a note before resolving this dispute.')
    if (!['full-refund', 'partial-refund', 'reject'].includes(action)) {
      throw new Error('Choose a valid dispute resolution.')
    }
    const disputes = readDisputes()
    const index = disputes.findIndex((dispute) => dispute.id === id)
    if (index < 0) throw new Error('Dispute not found.')
    if (disputes[index].status !== 'Open') throw new Error('This dispute has already been resolved.')
    const dispute = disputes[index]
    let refund = null

    if (action === 'full-refund') {
      const result = await reservationService.cancelReservation(dispute.reservationId, 'admin', note)
      refund = result.refund
    } else if (action === 'partial-refund') {
      refund = await reservationService.refundReservation(dispute.reservationId, {
        amount,
        cancelledBy: 'admin',
        reason: note,
      })
    } else {
      await payoutService.holdEarningForDispute(dispute.reservationId, false)
    }

    const resolved = {
      ...dispute,
      status: 'Resolved',
      resolution: action,
      resolutionNote: note.trim(),
      resolvedBy: actor,
      resolvedAt: new Date().toISOString(),
      refund: refund ? { ...refund } : null,
    }
    disputes[index] = resolved
    saveDisputes(disputes)
    await auditLogService.add({
      action: `dispute-${action}`,
      actor,
      targetId: dispute.reservationId,
      note,
      details: { disputeId: id, amount: refund?.totalRefunded ?? 0 },
    })
    return delay({ ...resolved })
  },
}

export function isDisputeEligible(reservation, disputeWindowHours, now = new Date()) {
  const eligibleUntil = getDisputeDeadline(reservation, disputeWindowHours)
  const timestamp = now instanceof Date ? now.getTime() : new Date(now).getTime()
  return Number.isFinite(timestamp) && eligibleUntil >= timestamp
}

function getDisputeDeadline(reservation, disputeWindowHours) {
  const completedAt = reservation.completedAt
  if (completedAt) {
    const timestamp = new Date(completedAt).getTime()
    return Number.isNaN(timestamp) ? 0 : timestamp + Number(disputeWindowHours) * 60 * 60 * 1000
  }
  const endTime = reservation.endTime
  const dateText = String(reservation.date ?? '')
  const dateParts = dateText.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  const timeParts = String(endTime ?? '').match(/^(\d{1,2}):(\d{2})$/)
  if (!dateParts || !timeParts) return 0
  return new Date(
    Number(dateParts[1]),
    Number(dateParts[2]) - 1,
    Number(dateParts[3]),
    Number(timeParts[1]),
    Number(timeParts[2]),
  ).getTime() + Number(disputeWindowHours) * 60 * 60 * 1000
}
