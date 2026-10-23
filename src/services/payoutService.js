import { earningSeed, payoutAccountSeed, payoutSeed } from '../data/paymentData'
import { calculateBookingFees, calculateWithdrawal } from '../utils/fees'
import { settingsService } from './settingsService'

const EARNINGS_KEY = 'reserva.owner.earnings'
const PAYOUTS_KEY = 'reserva.owner.payouts'
const ACCOUNTS_KEY = 'reserva.owner.payoutAccounts'
const REFUNDS_KEY = 'reserva.owner.refundAdjustments'
const delay = (value) => new Promise((resolve) => setTimeout(() => resolve(value), 160))
const roundMoney = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100

function readStored(key, fallback) {
  const stored = window.localStorage.getItem(key)
  return stored ? JSON.parse(stored) : fallback.map((item) => ({ ...item }))
}

function writeStored(key, value) {
  window.localStorage.setItem(key, JSON.stringify(value))
}

function getEarningsData(ownerId) {
  const earnings = readStored(EARNINGS_KEY, earningSeed)
  const today = new Date().toISOString().slice(0, 10)
  return earnings
    .filter((earning) => earning.ownerId === ownerId)
    .map((earning) => {
      const bookingDatePassed = earning.date < today
      const reservationStatus = earning.reservationStatus
      const completedAndPast = reservationStatus === 'Completed' && bookingDatePassed
      return {
        ...earning,
        status: earning.status === 'Refunded'
          ? 'Refunded'
          : reservationStatus === 'Disputed'
            ? 'Disputed'
          : completedAndPast
            ? 'Available'
            : 'Pending',
        reservationStatus,
      }
    })
}

function getPayoutsData(ownerId) {
  return readStored(PAYOUTS_KEY, payoutSeed).filter((payout) => payout.ownerId === ownerId)
}

function getBalanceData(ownerId) {
  const earnings = getEarningsData(ownerId)
  const payouts = getPayoutsData(ownerId)
  const availableEarnings = earnings
    .filter((earning) => earning.status === 'Available')
    .reduce((total, earning) => total + Number(earning.ownerNet), 0)
  const payoutDeductions = payouts
    .filter((payout) => ['Requested', 'Processing', 'Paid'].includes(payout.status))
    .reduce((total, payout) => total + Number(payout.amount), 0)
  const failedPayoutFees = payouts
    .filter((payout) => payout.status === 'Failed')
    .reduce((total, payout) => total + Number(payout.fee), 0)
  return {
    available: roundMoney(availableEarnings - payoutDeductions - failedPayoutFees),
    pending: roundMoney(earnings
      .filter((earning) => ['Pending', 'Disputed'].includes(earning.status))
      .reduce((total, earning) => total + Number(earning.ownerNet), 0)),
    earned: roundMoney(earnings
      .filter((earning) => earning.status !== 'Refunded')
      .reduce((total, earning) => total + Number(earning.ownerNet), 0)),
    withdrawn: roundMoney(payouts
      .filter((payout) => payout.status === 'Paid')
      .reduce((total, payout) => total + Number(payout.net), 0)),
  }
}

export const payoutService = {
  async getBalance(ownerId = 'owner-demo') {
    return delay(getBalanceData(ownerId))
  },

  async getEarnings(ownerId = 'owner-demo') {
    return delay(getEarningsData(ownerId))
  },

  async getPayouts(ownerId = 'owner-demo') {
    return delay(getPayoutsData(ownerId).map((payout) => ({ ...payout })))
  },

  async getPlatformFinancialData() {
    const earnings = readStored(EARNINGS_KEY, earningSeed).map((earning) => ({
      ...earning,
      serviceFee: Number.isFinite(Number(earning.serviceFee))
        ? Number(earning.serviceFee)
        : calculateBookingFees(earning.courtRate).serviceFee,
    }))
    const payouts = readStored(PAYOUTS_KEY, payoutSeed).map((payout) => ({ ...payout }))
    const refunds = readStored(REFUNDS_KEY, []).map((refund) => ({ ...refund }))
    return delay({ earnings, payouts, refunds })
  },

  async getAdminPayouts() {
    return delay(readStored(PAYOUTS_KEY, payoutSeed).map((payout) => ({ ...payout })))
  },

  async getPayoutAccounts(ownerId = 'owner-demo') {
    return delay(readStored(ACCOUNTS_KEY, payoutAccountSeed)
      .filter((account) => account.ownerId === ownerId)
      .map((account) => ({ ...account })))
  },

  async addPayoutAccount({ ownerId = 'owner-demo', type, name, number }) {
    if (!['GCash', 'Maya', 'Bank'].includes(type)) {
      throw new Error('Choose GCash, Maya, or Bank as the payout account type.')
    }
    if (!name?.trim() || !/^[\d -]{8,24}$/.test(number?.trim() ?? '')) {
      throw new Error('Enter the account holder name and a valid account number.')
    }
    const accounts = readStored(ACCOUNTS_KEY, payoutAccountSeed)
    const account = {
      id: `PA-${Date.now()}`,
      ownerId,
      type,
      name: name.trim(),
      number: number.trim(),
      verified: false,
    }
    writeStored(ACCOUNTS_KEY, [account, ...accounts])
    return delay({ ...account })
  },

  async verifyPayoutAccount(accountId, verificationCode, ownerId = 'owner-demo') {
    if (verificationCode !== '123456') throw new Error('The verification code is incorrect.')
    const accounts = readStored(ACCOUNTS_KEY, payoutAccountSeed)
    const index = accounts.findIndex((account) => account.id === accountId && account.ownerId === ownerId)
    if (index < 0) throw new Error('Payout account not found.')
    accounts[index] = { ...accounts[index], verified: true }
    writeStored(ACCOUNTS_KEY, accounts)
    return delay({ ...accounts[index] })
  },

  async requestWithdrawal({ amount, accountId, ownerId = 'owner-demo' }) {
    const accounts = readStored(ACCOUNTS_KEY, payoutAccountSeed)
    const account = accounts.find((item) => item.id === accountId && item.ownerId === ownerId)
    if (!account || !account.verified) throw new Error('Choose a verified payout account before withdrawing.')
    const balance = getBalanceData(ownerId)
    const fees = await settingsService.getFees()
    const calculation = calculateWithdrawal(amount, balance.available, fees)
    if (!calculation.valid) throw new Error(calculation.reason)
    const payouts = readStored(PAYOUTS_KEY, payoutSeed)
    const requestAmount = roundMoney(amount)
    if (!Number.isFinite(requestAmount) || requestAmount <= 0) {
      throw new Error('Withdrawal amount must be greater than zero.')
    }
    const payout = {
      id: `PO-${Date.now()}`,
      ownerId,
      requestedAt: new Date().toISOString(),
      amount: requestAmount,
      fee: calculation.fee,
      net: calculation.net,
      accountId,
      destination: `${account.type} ···· ${account.number.slice(-4)}`,
      status: 'Requested',
    }
    writeStored(PAYOUTS_KEY, [payout, ...payouts])
    return delay({ ...payout })
  },

  async updatePayoutStatus(id, status, reason = '') {
    if (!['Processing', 'Paid', 'Failed'].includes(status)) {
      throw new Error('Choose a supported payout status.')
    }
    if (status === 'Failed' && !reason.trim()) throw new Error('Add a reason for the failed payout.')
    const payouts = readStored(PAYOUTS_KEY, payoutSeed)
    const index = payouts.findIndex((payout) => payout.id === id)
    if (index < 0) throw new Error('Payout request not found.')
    const currentStatus = payouts[index].status
    const validTransition = status === 'Processing' && currentStatus === 'Requested' ||
      status === 'Paid' && currentStatus === 'Processing' ||
      status === 'Failed' && ['Requested', 'Processing'].includes(currentStatus)
    if (!validTransition) throw new Error(`A payout cannot move from ${currentStatus} to ${status}.`)
    payouts[index] = { ...payouts[index], status, reason: status === 'Failed' ? reason.trim() : '' }
    writeStored(PAYOUTS_KEY, payouts)
    return delay({ ...payouts[index] })
  },

  async recordBookingEarning(reservation) {
    const earnings = readStored(EARNINGS_KEY, earningSeed)
    const earning = {
      id: `E-${reservation.id}`,
      ownerId: reservation.ownerId ?? 'owner-demo',
      reservationId: reservation.id,
      date: reservation.date,
      user: reservation.user ?? 'Player',
      facility: reservation.name,
      courtRate: reservation.courtRate,
      serviceFee: reservation.serviceFee,
      ownerCommission: reservation.ownerCommission,
      ownerNet: reservation.ownerNet,
      status: 'Pending',
      reservationStatus: reservation.status,
    }
    writeStored(EARNINGS_KEY, [earning, ...earnings])
    return delay({ ...earning })
  },

  async updateReservationEarning(reservationId, reservationStatus) {
    const earnings = readStored(EARNINGS_KEY, earningSeed)
    const index = earnings.findIndex((earning) => earning.reservationId === reservationId)
    if (index < 0) return null
    earnings[index] = { ...earnings[index], reservationStatus }
    writeStored(EARNINGS_KEY, earnings)
    return delay({ ...earnings[index] })
  },

  async updateOwnerIdForEarning(reservationId, ownerId) {
    if (!ownerId?.trim()) throw new Error('An owner account is required for the booking earning.')
    const earnings = readStored(EARNINGS_KEY, earningSeed)
    const index = earnings.findIndex((earning) => earning.reservationId === reservationId)
    if (index < 0) return null
    earnings[index] = { ...earnings[index], ownerId }
    writeStored(EARNINGS_KEY, earnings)
    return delay({ ...earnings[index] })
  },

  async recordRefund(reservationId, amount, ownerId = 'owner-demo') {
    const refundDetails = typeof amount === 'object'
      ? amount
      : { totalRefunded: roundMoney(amount), retainedByOwner: 0 }
    if (!Number.isFinite(Number(refundDetails.totalRefunded)) || Number(refundDetails.totalRefunded) < 0) {
      throw new Error('Refund amount must be a non-negative number.')
    }
    const refunds = readStored(REFUNDS_KEY, [])
    const refund = {
      id: refundDetails.refundId ?? `RF-${Date.now()}`,
      reservationId,
      ownerId,
      ...refundDetails,
      amount: roundMoney(refundDetails.totalRefunded),
      createdAt: new Date().toISOString(),
    }
    writeStored(REFUNDS_KEY, [refund, ...refunds])
    const earnings = readStored(EARNINGS_KEY, earningSeed)
    const index = earnings.findIndex((earning) => earning.reservationId === reservationId)
    if (index >= 0) {
      const retainedByOwner = roundMoney(refundDetails.retainedByOwner ?? 0)
      const reservationStatus = refundDetails.reservationStatus ?? 'Cancelled'
      const completedAndPast = reservationStatus === 'Completed' &&
        earnings[index].date < new Date().toISOString().slice(0, 10)
      earnings[index] = {
        ...earnings[index],
        ownerNet: retainedByOwner,
        reservationStatus,
        status: retainedByOwner === 0
          ? 'Refunded'
          : completedAndPast
            ? 'Available'
            : 'Pending',
      }
      writeStored(EARNINGS_KEY, earnings)
    }
    return delay({ ...refund })
  },

  async holdEarningForDispute(reservationId, isDisputed = true) {
    const earnings = readStored(EARNINGS_KEY, earningSeed)
    const index = earnings.findIndex((earning) => earning.reservationId === reservationId)
    if (index < 0) throw new Error('Booking earning not found.')
    earnings[index] = {
      ...earnings[index],
      reservationStatus: isDisputed ? 'Disputed' : 'Completed',
    }
    writeStored(EARNINGS_KEY, earnings)
    return delay({ ...earnings[index] })
  },
}
