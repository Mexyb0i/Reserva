import { reservationHistory, reservations } from '../data/mockData'
import { settingsService } from './settingsService'
import { calculateBookingFees, calculateRefund, formatPHP } from '../utils/fees'
import { intervalsOverlap, timeToMinutes } from '../utils/bookingTime'
import { ownerService } from './ownerService'
import { paymentService } from './paymentService'
import { payoutService } from './payoutService'
import { userService } from './userService'

const wait = (value) =>
  new Promise((resolve) => {
    setTimeout(() => resolve(value), 160)
  })

const RESERVATIONS_KEY = 'reserva.reservations'
const HISTORY_KEY = 'reserva.reservationHistory'

function readStoredList(key, fallback) {
  const stored = window.localStorage.getItem(key)
  if (!stored) return fallback.map((item) => ({ ...item }))
  const value = JSON.parse(stored)
  if (!Array.isArray(value)) throw new Error(`Saved reservation data for ${key} is invalid.`)
  return value
}

let currentReservations = readStoredList(RESERVATIONS_KEY, reservations)
let currentHistory = readStoredList(HISTORY_KEY, reservationHistory)
const persistReservations = () => window.localStorage.setItem(RESERVATIONS_KEY, JSON.stringify(currentReservations))
const persistHistory = () => window.localStorage.setItem(HISTORY_KEY, JSON.stringify(currentHistory))
const OPENING_HOUR = 8
const CLOSING_HOUR = 22
const bookingStartTimes = Array.from({ length: CLOSING_HOUR - OPENING_HOUR }, (_, index) =>
  `${String(index + OPENING_HOUR).padStart(2, '0')}:00`,
)
let bookedIntervals = [
  {
    id: 'mock-basketball-9am',
    facilityId: 2,
    date: '2026-10-24',
    startTime: '09:00',
    endTime: '10:00',
    status: 'Confirmed',
    quantity: 1,
  },
]
let bookingDraft = {
  facilityId: 1,
  date: '2026-10-24',
  time: '10:00',
  duration: 2,
  quantity: 1,
  paymentMethod: null,
}

export const reservationService = {
  async getDashboard() {
    return wait({
      reservations: currentReservations,
      stats: [24, 96, 8],
    })
  },

  async getSchedule(facilityId, date, duration = 1, quantity = 1) {
    const [availability, ownerReservations] = await Promise.all([
      ownerService.getAvailability(facilityId, date),
      ownerService.getReservations(),
    ])
    const durationMinutes = Number(duration) * 60
    const available = bookingStartTimes.map((label) => ({
      label,
      status: canFitBooking(availability, facilityId, date, label, durationMinutes, quantity, ownerReservations)
        ? 'available'
        : 'taken',
    }))
    return wait(available)
  },

  async getHistory() {
    await this.completePastReservations()
    return wait(currentHistory.map((item) => {
      const reservation = currentReservations.find((candidate) => candidate.id === item.id)
      return reservation
        ? {
          ...item,
          status: reservation.status,
          date: reservation.date,
          duration: `${reservation.duration} ${reservation.duration === 1 ? 'hr' : 'hrs'}`,
          userTotal: reservation.userTotal,
          refundedAmount: reservation.refundedAmount ?? 0,
          paymentMethod: reservation.paymentMethod,
          startTime: reservation.startTime,
          endTime: reservation.endTime,
          completedAt: reservation.completedAt,
        }
        : { ...item }
    }))
  },

  async getReservedSchedule() {
    await this.completePastReservations()
    return wait([...currentReservations])
  },

  async getOwnerReservations(ownerId = 'owner-demo') {
    await this.expireStaleRequests()
    await this.completePastReservations()
    return wait(currentReservations
      .filter((reservation) => reservation.ownerId === ownerId && String(reservation.id).startsWith('R-'))
      .map((reservation) => ({ ...reservation })))
  },

  async completePastReservations(now = new Date()) {
    const timestamp = now instanceof Date ? now.getTime() : new Date(now).getTime()
    if (!Number.isFinite(timestamp)) throw new Error('Completion check time must be a valid date.')
    const completed = []
    currentReservations = currentReservations.map((reservation) => {
      if (reservation.status !== 'Confirmed') return reservation
      const endTimestamp = getReservationEndTimestamp(reservation)
      if (!endTimestamp || endTimestamp > timestamp) return reservation
      const updated = {
        ...reservation,
        status: 'Completed',
        completedAt: new Date(endTimestamp).toISOString(),
      }
      completed.push(updated)
      return updated
    })
    if (completed.length) {
      currentHistory = currentHistory.map((item) => {
        const reservation = completed.find((candidate) => candidate.id === item.id)
        return reservation
          ? { ...item, status: 'Completed', completedAt: reservation.completedAt }
          : item
      })
      bookedIntervals = bookedIntervals.map((booking) =>
        completed.some((reservation) => reservation.id === booking.id)
          ? { ...booking, status: 'Completed' }
          : booking,
      )
      for (const reservation of completed) {
        await payoutService.updateReservationEarning(reservation.id, 'Completed')
      }
      persistReservations()
      persistHistory()
    }
    return wait(completed.map((reservation) => ({ ...reservation })))
  },

  async updateOwnerReservationStatus(reservationId, status, reason = '') {
    const reservation = currentReservations.find((item) => item.id === reservationId)
    if (!reservation) throw new Error('Reservation request not found.')
    if (reservation.status === 'Cancelled') throw new Error('This reservation is already cancelled.')
    if (status === 'Confirmed') {
      if (reservation.status !== 'Pending') throw new Error('Only pending requests can be accepted.')
      const updated = { ...reservation, status: 'Confirmed' }
      currentReservations = currentReservations.map((item) => item.id === reservationId ? updated : item)
      bookedIntervals = bookedIntervals.map((item) =>
        item.id === reservationId ? { ...item, status: 'Confirmed' } : item,
      )
      currentHistory = currentHistory.map((item) =>
        item.id === reservationId ? { ...item, status: 'Confirmed' } : item,
      )
      persistReservations()
      persistHistory()
      await payoutService.updateReservationEarning(reservationId, 'Confirmed')
      await userService.addNotification({
        title: 'Reservation confirmed',
        message: `Your booking at ${reservation.name} has been confirmed.`,
        type: 'success',
      })
      return wait({ ...updated })
    }
    if (status !== 'Cancelled') throw new Error('Unsupported reservation status.')
    if (!reason.trim()) throw new Error('A cancellation reason is required.')
    const result = await this.cancelReservation(reservationId, 'owner', reason)
    await ownerService.recordOwnerCancellation(reservation.ownerId)
    return wait(result.reservation)
  },

  async validateBookingAvailability(payload = {}) {
    await assertBookingAvailable({ ...bookingDraft, ...payload })
    return wait({ available: true })
  },

  async createReservation(payload = {}) {
    const nextDraft = { ...bookingDraft, ...payload }
    await assertBookingAvailable(nextDraft)
    if (!['GCash', 'Maya', 'Bank'].includes(nextDraft.paymentMethod)) {
      throw new Error('Choose GCash, Maya, or Bank as the payment method.')
    }
    if (!nextDraft.paymentId) throw new Error('A successful payment is required before creating a reservation.')
    const payment = await paymentService.getPayment(nextDraft.paymentId)
    if (payment.status !== 'paid' || payment.method !== nextDraft.paymentMethod) {
      throw new Error('The selected payment was not completed successfully.')
    }
    const courtRate = Number(nextDraft.courtRate)
    const settings = await settingsService.getSettings()
    const feeSnapshot = calculateBookingFees(courtRate, settings.fees)
    if (Math.round(payment.amount * 100) !== Math.round(feeSnapshot.userTotal * 100)) {
      throw new Error('Payment amount does not match the booking total.')
    }
    const endMinutes = timeToMinutes(nextDraft.time) + Number(nextDraft.duration) * 60
    const endTime = `${String(Math.floor(endMinutes / 60)).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`
    const newReservation = {
      id: `R-${Date.now()}`,
      facilityId: Number(nextDraft.facilityId),
      ownerId: nextDraft.ownerId ?? 'owner-demo',
      name: nextDraft.facilityName ?? 'Sports Facility',
      date: nextDraft.date,
      time: `${nextDraft.time} - ${endTime}`,
      startTime: nextDraft.time,
      endTime,
      duration: Number(nextDraft.duration),
      quantity: Number(nextDraft.quantity ?? 1),
      status: 'Pending',
      ...feeSnapshot,
      refundPolicy: { ...settings.refundPolicy },
      total: feeSnapshot.userTotal,
      paymentId: nextDraft.paymentId,
      paymentMethod: nextDraft.paymentMethod,
      paymentStatus: 'paid',
      payoutStatus: 'held',
      refundedAmount: 0,
      refunds: [],
      createdAt: new Date().toISOString(),
      image: nextDraft.image ?? '',
    }
    await paymentService.linkPayment(newReservation.paymentId, newReservation.id)
    bookedIntervals.push({
      id: newReservation.id,
      facilityId: newReservation.facilityId,
      date: newReservation.date,
      startTime: newReservation.startTime,
      endTime: newReservation.endTime,
      status: newReservation.status,
      quantity: newReservation.quantity,
    })
    currentReservations = [newReservation, ...currentReservations]
    currentHistory = [
      {
        id: newReservation.id,
        facility: newReservation.name,
        date: newReservation.date,
        duration: `${newReservation.duration} hrs`,
        status: 'Pending',
        ...feeSnapshot,
        total: feeSnapshot.userTotal,
        paymentMethod: newReservation.paymentMethod,
        paymentStatus: newReservation.paymentStatus,
        completedAt: newReservation.completedAt,
        refundedAmount: 0,
        refunds: [],
      },
      ...currentHistory,
    ]
    bookingDraft = nextDraft
    await payoutService.recordBookingEarning(newReservation)
    persistReservations()
    persistHistory()
    return wait({ ...newReservation })
  },

  async cancelReservation(reservationId, cancelledBy = 'user', reason = '') {
    const index = currentReservations.findIndex((reservation) => reservation.id === reservationId)
    if (index < 0) throw new Error('Reservation not found.')
    const reservation = currentReservations[index]
    if (reservation.status === 'Cancelled') throw new Error('This reservation is already cancelled.')
    if (!['user', 'owner', 'system', 'admin', 'no-show'].includes(cancelledBy)) {
      throw new Error('Choose a supported cancellation reason.')
    }
    if (['owner', 'admin'].includes(cancelledBy) && !reason.trim()) {
      throw new Error('A cancellation reason is required.')
    }
    if (cancelledBy === 'user' && !isBeforeReservationStart(reservation)) {
      throw new Error('A reservation cannot be cancelled after its start time.')
    }
    if (reservation.refundedAmount > 0) throw new Error('This reservation already has a refund.')
    const refund = calculateRefund(reservation, cancelledBy)
    const refundRecord = refund.totalRefunded > 0
      ? await paymentService.refundPayment(reservation.id, refund.totalRefunded, {
        ...refund,
        cancelledBy,
        reason: reason.trim() || refund.reason,
      })
      : null
    const nextRefunds = refundRecord ? [...(reservation.refunds ?? []), refundRecord] : reservation.refunds ?? []
    const updated = {
      ...reservation,
      status: cancelledBy === 'no-show' ? 'No-show' : 'Cancelled',
      cancellationReason: reason.trim() || refund.reason,
      refunds: nextRefunds,
      refundedAmount: refund.totalRefunded,
      paymentStatus: refund.totalRefunded >= reservation.userTotal
        ? 'refunded'
        : refund.totalRefunded > 0
          ? 'partially_refunded'
          : reservation.paymentStatus,
      payoutStatus: refund.retainedByOwner > 0 ? reservation.payoutStatus : 'refunded',
    }
    currentReservations[index] = updated
    bookedIntervals = bookedIntervals.map((booking) =>
      booking.id === reservation.id ? { ...booking, status: updated.status } : booking,
    )
    currentHistory = currentHistory.map((item) =>
      item.id === reservation.id
        ? {
          ...item,
          status: updated.status,
          paymentStatus: updated.paymentStatus,
          refundedAmount: updated.refundedAmount,
          refunds: updated.refunds,
        }
        : item,
    )
    persistReservations()
    persistHistory()
    await payoutService.recordRefund(reservation.id, {
      ...refund,
      refundId: refundRecord?.refundId,
      reservationStatus: updated.status,
    }, reservation.ownerId)
    await userService.addNotification({
      title: cancelledBy === 'system' ? 'Reservation request expired' : 'Reservation cancelled',
      message: `Your booking at ${reservation.name} was cancelled. Refund: ${formatPHP(refund.totalRefunded)}.`,
      type: refund.totalRefunded > 0 ? 'success' : 'warning',
    })
    return wait({
      reservation: { ...updated },
      refund: { ...refund, refundId: refundRecord?.refundId, total: refund.totalRefunded },
    })
  },

  async getCancellationPreview(reservationId, cancelledBy = 'user') {
    const reservation = currentReservations.find((item) => item.id === reservationId)
    if (!reservation) throw new Error('Reservation not found.')
    const refund = calculateRefund(reservation, cancelledBy)
    return wait({
      ...refund,
      total: refund.totalRefunded,
      courtRate: reservation.courtRate,
      serviceFee: reservation.serviceFee,
      userTotal: reservation.userTotal,
      courtRateRefund: refund.courtRefund,
      serviceFeeNonRefundable: roundMoney(reservation.serviceFee - refund.serviceFeeRefund),
    })
  },

  async refundReservation(reservationId, { amount, cancelledBy = 'admin', reason = '' } = {}) {
    const index = currentReservations.findIndex((reservation) => reservation.id === reservationId)
    if (index < 0) throw new Error('Reservation not found.')
    const reservation = currentReservations[index]
    if (!reason.trim()) throw new Error('A refund reason is required.')
    if (reservation.refundedAmount > 0) throw new Error('This reservation already has a refund.')
    const refundAmount = roundMoney(Number(amount))
    if (!Number.isFinite(refundAmount) || refundAmount <= 0 || refundAmount > reservation.userTotal) {
      throw new Error('Refund amount must be greater than zero and no more than the booking total.')
    }
    const courtRefund = roundMoney(Math.min(refundAmount, reservation.courtRate))
    const serviceFeeRefund = roundMoney(refundAmount - courtRefund)
    if (serviceFeeRefund > reservation.serviceFee) {
      throw new Error('Refund exceeds the reservation fee snapshot.')
    }
    const retainedCourtRate = roundMoney(reservation.courtRate - courtRefund)
    const commissionRetained = reservation.courtRate > 0
      ? roundMoney(reservation.ownerCommission * retainedCourtRate / reservation.courtRate)
      : 0
    const refund = {
      courtRefund,
      serviceFeeRefund,
      totalRefunded: refundAmount,
      retainedByOwner: roundMoney(Math.max(0, retainedCourtRate - commissionRetained)),
      retainedByPlatform: roundMoney(
        reservation.serviceFee - serviceFeeRefund +
        commissionRetained -
        Number(reservation.gatewayFee ?? 0),
      ),
      gatewayFeeLost: roundMoney(Number(reservation.gatewayFee ?? 0)),
      reason: reason.trim(),
    }
    const refundRecord = await paymentService.refundPayment(reservation.id, refundAmount, {
      ...refund,
      cancelledBy,
      reason,
    })
    const totalRefunded = roundMoney(Number(reservation.refundedAmount ?? 0) + refundAmount)
    const updated = {
      ...reservation,
      refunds: [...(reservation.refunds ?? []), refundRecord],
      refundedAmount: totalRefunded,
      paymentStatus: totalRefunded >= reservation.userTotal ? 'refunded' : 'partially_refunded',
      payoutStatus: refund.retainedByOwner > 0 ? reservation.payoutStatus : 'refunded',
    }
    currentReservations[index] = updated
    currentHistory = currentHistory.map((item) =>
      item.id === reservation.id
        ? {
          ...item,
          paymentStatus: updated.paymentStatus,
          refundedAmount: totalRefunded,
          refunds: updated.refunds,
        }
        : item,
    )
    persistReservations()
    persistHistory()
    await payoutService.recordRefund(reservation.id, {
      ...refund,
      refundId: refundRecord.refundId,
      reservationStatus: reservation.status,
    }, reservation.ownerId)
    return wait({ ...refund, refundId: refundRecord.refundId })
  },

  async expireStaleRequests(now = new Date()) {
    const settings = await settingsService.getSettings()
    const expiryMs = settings.refundPolicy.requestExpiryHours * 60 * 60 * 1000
    const timestamp = now instanceof Date ? now.getTime() : new Date(now).getTime()
    if (!Number.isFinite(timestamp)) throw new Error('Expiry check time must be a valid date.')
    const stale = currentReservations.filter((reservation) =>
      reservation.status === 'Pending' &&
      reservation.createdAt &&
      timestamp - new Date(reservation.createdAt).getTime() >= expiryMs,
    )
    const expired = []
    for (const reservation of stale) {
      const result = await this.cancelReservation(reservation.id, 'system', 'Owner response period expired.')
      expired.push(result.reservation)
    }
    return wait(expired)
  },

  async getBookingDraft() {
    return wait({ ...bookingDraft })
  },

  async saveBookingDraft(payload) {
    const nextDraft = { ...bookingDraft, ...payload }
    await assertBookingAvailable(nextDraft)
    bookingDraft = nextDraft
    return wait({ ...bookingDraft })
  },

}

const roundMoney = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100

async function assertBookingAvailable(draft) {
  const duration = Number(draft.duration)
  const quantity = Number(draft.quantity ?? 1)
  if (!draft.facilityId || !draft.date || !draft.time ||
    !Number.isInteger(duration) || duration < 1 ||
    !Number.isInteger(quantity) || quantity < 1) {
    throw new Error('Choose a facility, date, start time, and duration.')
  }

  if (!/^\d{2}:00$/.test(draft.time)) {
    throw new Error('Choose a start time on the hour.')
  }
  const startMinutes = timeToMinutes(draft.time)
  const endMinutes = startMinutes + duration * 60
  if (startMinutes < OPENING_HOUR * 60) {
    throw new Error('Bookings must start at or after the facility opening time.')
  }
  if (endMinutes > CLOSING_HOUR * 60) {
    throw new Error('The selected duration extends beyond the facility closing time.')
  }
  const [availability, ownerReservations] = await Promise.all([
    ownerService.getAvailability(draft.facilityId, draft.date),
    ownerService.getReservations(),
  ])
  if (!canFitBooking(
    availability,
    draft.facilityId,
    draft.date,
    draft.time,
    duration * 60,
    quantity,
    ownerReservations,
  )) {
    const endTime = `${String(Math.floor(endMinutes / 60)).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`
    throw new Error(`Not enough courts are available from ${draft.time}–${endTime}. Change the time, duration, or number of courts.`)
  }
}

function isBeforeReservationStart(reservation) {
  const date = String(reservation.date ?? '')
  const time = String(reservation.startTime ?? '')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return false
  return new Date(`${date}T${time}:00`).getTime() > Date.now()
}

function getReservationEndTimestamp(reservation) {
  const date = String(reservation.date ?? '')
  const time = String(reservation.endTime ?? '')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return 0
  const timestamp = new Date(`${date}T${time}:00`).getTime()
  return Number.isFinite(timestamp) ? timestamp : 0
}

function canFitBooking(availability, facilityId, date, startTime, durationMinutes, quantity, ownerReservations = []) {
  const courtCount = Number(availability.courtCount)
  if (!Number.isInteger(Number(quantity)) || quantity < 1 || quantity > courtCount ||
    !Number.isInteger(durationMinutes) || durationMinutes < 60 ||
    !/^\d{2}:00$/.test(startTime)) return false
  const startMinutes = timeToMinutes(startTime)
  const endMinutes = startMinutes + durationMinutes
  if (startMinutes < OPENING_HOUR * 60 || endMinutes > CLOSING_HOUR * 60) return false
  const reservations = [
    ...bookedIntervals,
    ...currentReservations
      .filter((reservation) =>
        !bookedIntervals.some((booking) => booking.id === reservation.id) &&
        Number(reservation.facilityId) === Number(facilityId) &&
        getISODate(reservation.date) === date &&
        ['Confirmed', 'Pending'].includes(reservation.status),
      )
      .map((reservation) => {
        const [startValue, endValue] = String(reservation.time ?? '').split(/\s*[-–]\s*/)
        return {
          facilityId: Number(reservation.facilityId),
          date,
          startTime: reservation.startTime ?? normalizeReservationTime(startValue),
          endTime: reservation.endTime ?? normalizeReservationTime(endValue),
          status: reservation.status,
          quantity: reservation.quantity ?? 1,
        }
      })
      .filter((reservation) => /^\d{2}:\d{2}$/.test(reservation.startTime) && /^\d{2}:\d{2}$/.test(reservation.endTime)),
    ...ownerReservations
      .filter((reservation) =>
        Number(reservation.facilityId) === Number(facilityId) &&
        getISODate(reservation.date) === date &&
        ['Confirmed', 'Pending'].includes(reservation.status),
      )
      .map((reservation) => {
        const [startTimeValue, endTimeValue] = String(reservation.time ?? '').split(/\s*[-–]\s*/)
        return {
          facilityId: Number(reservation.facilityId),
          date,
          startTime: reservation.startTime ?? normalizeReservationTime(startTimeValue),
          endTime: reservation.endTime ?? normalizeReservationTime(endTimeValue),
          status: reservation.status,
          quantity: reservation.quantity ?? 1,
        }
      })
      .filter((reservation) => /^\d{2}:\d{2}$/.test(reservation.startTime) && /^\d{2}:\d{2}$/.test(reservation.endTime)),
  ]

  for (let segmentStart = startMinutes; segmentStart < endMinutes; segmentStart += 60) {
    const segmentEnd = Math.min(segmentStart + 60, endMinutes)
    const hourLabel = `${String(Math.floor(segmentStart / 60)).padStart(2, '0')}:00`
    const maintenanceCount = availability.courts.filter((court) =>
      court.slots.some((slot) => slot.label === hourLabel && slot.status === 'taken'),
    ).length
    const bookedCourtCount = reservations
      .filter((booking) =>
        booking.facilityId === Number(facilityId) &&
        booking.date === date &&
        ['Confirmed', 'Pending'].includes(booking.status) &&
        intervalsOverlap(
          `${String(Math.floor(segmentStart / 60)).padStart(2, '0')}:${String(segmentStart % 60).padStart(2, '0')}`,
          `${String(Math.floor(segmentEnd / 60)).padStart(2, '0')}:${String(segmentEnd % 60).padStart(2, '0')}`,
          booking.startTime,
          booking.endTime,
        ),
      )
      .reduce((total, booking) => total + Number(booking.quantity ?? 1), 0)
    if (courtCount - maintenanceCount - bookedCourtCount < quantity) return false
  }

  return true
}

function normalizeReservationTime(value) {
  const match = String(value ?? '').trim().match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i)
  if (!match) return ''
  let hours = Number(match[1])
  const minutes = Number(match[2])
  if (hours > 23 || minutes > 59) return ''
  if (match[3]) {
    if (hours < 1 || hours > 12) return ''
    hours = (hours % 12) + (match[3].toUpperCase() === 'PM' ? 12 : 0)
  }
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

function getISODate(dateValue) {
  const value = String(dateValue ?? '').trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  const parts = value.match(/^(\d{1,2}) ([A-Za-z]{3}) (\d{4})$/)
  if (!parts) return ''
  const month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    .findIndex((name) => name.toLowerCase() === parts[2].toLowerCase()) + 1
  if (month === 0) return ''
  return `${parts[3]}-${String(month).padStart(2, '0')}-${parts[1].padStart(2, '0')}`
}
