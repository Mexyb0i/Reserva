import { FEES, REFUND_POLICY } from '../config/fees'

const roundMoney = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100
const clamp = (value, min, max) => Math.min(Math.max(value, min), max)

export function calculateBookingFees(courtRate, fees = FEES) {
  const rate = Number(courtRate)
  if (!Number.isFinite(rate) || rate < 0) throw new Error('Court rate must be a non-negative number.')
  const serviceFee = roundMoney(Math.max(rate * fees.userServiceRate, fees.userServiceMin))
  const ownerCommission = roundMoney(rate * fees.ownerCommissionRate)
  return {
    courtRate: roundMoney(rate),
    serviceFee,
    userTotal: roundMoney(rate + serviceFee),
    ownerCommission,
    ownerNet: roundMoney(rate - ownerCommission),
  }
}

export function calculateWithdrawal(amount, availableBalance, fees = FEES) {
  const requestedAmount = roundMoney(Number(amount))
  const balance = roundMoney(Number(availableBalance))
  const fee = roundMoney(fees.withdrawalFee)
  let reason = ''
  if (!Number.isFinite(requestedAmount) || requestedAmount < fees.minWithdrawal) {
    reason = `Minimum withdrawal is ${formatPHP(fees.minWithdrawal)}.`
  } else if (!Number.isFinite(balance) || requestedAmount > balance) {
    reason = 'Withdrawal amount exceeds your available balance.'
  } else if (roundMoney(requestedAmount - fee) <= 0) {
    reason = 'Withdrawal amount must be greater than the withdrawal fee.'
  }
  return {
    fee,
    net: Number.isFinite(requestedAmount) ? roundMoney(requestedAmount - fee) : 0,
    valid: !reason,
    reason,
  }
}

export function calculateRefund(reservation, cancelledBy, now = new Date()) {
  if (!reservation || typeof reservation !== 'object') {
    throw new Error('A reservation is required to calculate its refund.')
  }
  if (!['user', 'owner', 'system', 'admin', 'no-show'].includes(cancelledBy)) {
    throw new Error('Choose a supported refund reason.')
  }

  const courtRate = roundMoney(Number(reservation.courtRate))
  const serviceFee = roundMoney(Number(reservation.serviceFee))
  const userTotal = roundMoney(Number(reservation.userTotal ?? courtRate + serviceFee))
  const ownerCommission = roundMoney(Number(reservation.ownerCommission ?? 0))
  const gatewayFeeLost = roundMoney(Number(reservation.gatewayFee ?? 0))
  if (![courtRate, serviceFee, userTotal, ownerCommission, gatewayFeeLost].every(Number.isFinite) ||
    courtRate < 0 || serviceFee < 0 || userTotal < 0 || ownerCommission < 0 || gatewayFeeLost < 0) {
    throw new Error('Reservation fee snapshot is invalid.')
  }

  const previousRefund = roundMoney(Number(reservation.refundedAmount ?? 0))
  if (reservation.paymentStatus === 'refunded' || previousRefund > 0 || previousRefund >= userTotal) {
    return {
      courtRefund: 0,
      serviceFeeRefund: 0,
      totalRefunded: 0,
      retainedByOwner: 0,
      retainedByPlatform: 0,
      gatewayFeeLost: 0,
      reason: 'This reservation already has a refund recorded.',
    }
  }

  const policy = { ...REFUND_POLICY, ...(reservation.refundPolicy ?? {}) }
  let courtRefund = 0
  let serviceFeeRefund = 0
  let retainedCourtRate = 0
  let refundReason = ''

  if (cancelledBy === 'owner' || cancelledBy === 'system' || cancelledBy === 'admin') {
    courtRefund = courtRate
    serviceFeeRefund = serviceFee
    refundReason = cancelledBy === 'system'
      ? 'The reservation was cancelled automatically.'
      : cancelledBy === 'admin'
        ? 'The reservation was refunded after administrative review.'
        : 'The facility cancelled the reservation.'
  } else if (cancelledBy === 'no-show') {
    courtRefund = roundMoney(courtRate * policy.noShowRefundRate)
    retainedCourtRate = courtRate - courtRefund
    refundReason = courtRefund > 0 ? 'A partial refund was applied under the no-show policy.' : 'No refund is due for a no-show.'
  } else {
    const hoursBeforeStart = hoursUntilStart(reservation, now)
    if (hoursBeforeStart >= policy.freeCancelHours) {
      courtRefund = courtRate
      refundReason = 'Cancelled within the free-cancellation period.'
    } else {
      courtRefund = roundMoney(courtRate * policy.lateCancelRefundRate)
      refundReason = 'A partial refund was applied because the cancellation was made inside the free-cancellation window.'
    }
    retainedCourtRate = roundMoney(courtRate - courtRefund)
  }

  const totalRefunded = roundMoney(clamp(
    Math.min(courtRefund + serviceFeeRefund, userTotal - previousRefund),
    0,
    userTotal,
  ))
  courtRefund = roundMoney(Math.min(courtRefund, totalRefunded))
  serviceFeeRefund = roundMoney(totalRefunded - courtRefund)

  const commissionRetained = cancelledBy === 'owner' || cancelledBy === 'system' || cancelledBy === 'admin'
    ? 0
    : courtRate > 0
      ? roundMoney(ownerCommission * retainedCourtRate / courtRate)
      : 0
  const retainedByOwner = cancelledBy === 'owner' || cancelledBy === 'system' || cancelledBy === 'admin'
    ? 0
    : roundMoney(Math.max(0, retainedCourtRate - commissionRetained))
  const appliedGatewayFee = totalRefunded > 0 ? gatewayFeeLost : 0
  const retainedByPlatform = roundMoney(
    (serviceFee - serviceFeeRefund) + commissionRetained - appliedGatewayFee,
  )

  return {
    courtRefund,
    serviceFeeRefund,
    totalRefunded,
    retainedByOwner,
    retainedByPlatform,
    gatewayFeeLost: appliedGatewayFee,
    reason: refundReason,
  }
}

function hoursUntilStart(reservation, now) {
  const date = parseReservationDate(reservation.date)
  const time = parseReservationTime(reservation.startTime ?? reservation.time)
  const currentDate = now instanceof Date ? now : new Date(now)
  if (!date || !time || Number.isNaN(currentDate.getTime())) {
    throw new Error('Reservation date, start time, or current time is invalid.')
  }
  const startsAt = new Date(date.year, date.month - 1, date.day, time.hours, time.minutes)
  return (startsAt.getTime() - currentDate.getTime()) / (60 * 60 * 1000)
}

function parseReservationDate(value) {
  const dateText = String(value ?? '').trim()
  let match = dateText.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (match) return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) }
  match = dateText.match(/^(\d{1,2}) ([A-Za-z]{3}) (\d{4})$/)
  if (!match) return null
  const month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    .findIndex((name) => name.toLowerCase() === match[2].toLowerCase()) + 1
  return month ? { year: Number(match[3]), month, day: Number(match[1]) } : null
}

function parseReservationTime(value) {
  const match = String(value ?? '').trim().match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i)
  if (!match) return null
  let hours = Number(match[1])
  const minutes = Number(match[2])
  if (minutes > 59 || hours > 23) return null
  if (match[3]) {
    if (hours < 1 || hours > 12) return null
    hours = (hours % 12) + (match[3].toUpperCase() === 'PM' ? 12 : 0)
  }
  return { hours, minutes }
}

export function formatPHP(amount) {
  const value = Number(amount)
  if (!Number.isFinite(value)) throw new Error('Amount must be a finite number.')
  return `₱${new Intl.NumberFormat('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(roundMoney(value))}`
}
