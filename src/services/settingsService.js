import { FEES, REFUND_POLICY } from '../config/fees'

const FEES_KEY = 'reserva.platform.fees'
const delay = (value) => new Promise((resolve) => setTimeout(() => resolve(value), 140))

function readFees() {
  return readSettings().fees
}

function readRefundPolicy() {
  const stored = window.localStorage.getItem(FEES_KEY)
  return stored ? { ...REFUND_POLICY, ...JSON.parse(stored).refundPolicy } : { ...REFUND_POLICY }
}

function readSettings() {
  const stored = window.localStorage.getItem(FEES_KEY)
  if (!stored) return { fees: { ...FEES }, refundPolicy: { ...REFUND_POLICY } }
  const value = JSON.parse(stored)
  const legacyFees = Object.fromEntries(
    Object.keys(FEES)
      .filter((key) => Object.hasOwn(value, key))
      .map((key) => [key, value[key]]),
  )
  return {
    fees: { ...FEES, ...legacyFees, ...value.fees },
    refundPolicy: { ...REFUND_POLICY, ...value.refundPolicy },
  }
}

function validateFees(fees) {
  for (const key of ['userServiceRate', 'ownerCommissionRate']) {
    if (!Number.isFinite(Number(fees[key])) || Number(fees[key]) < 0 || Number(fees[key]) > 1) {
      throw new Error(`${key} must be between 0 and 1.`)
    }
  }
  for (const key of ['userServiceMin', 'withdrawalFee', 'minWithdrawal']) {
    if (!Number.isFinite(Number(fees[key])) || Number(fees[key]) < 0) {
      throw new Error(`${key} must be a non-negative amount.`)
    }
  }
  if (!['on-request', 'weekly'].includes(fees.payoutSchedule)) {
    throw new Error('Payout schedule must be on-request or weekly.')
  }
}

function validateRefundPolicy(policy) {
  for (const key of ['lateCancelRefundRate', 'noShowRefundRate']) {
    if (!Number.isFinite(Number(policy[key])) || Number(policy[key]) < 0 || Number(policy[key]) > 1) {
      throw new Error(`${key} must be between 0 and 1.`)
    }
  }
  for (const key of ['freeCancelHours', 'requestExpiryHours', 'disputeWindowHours']) {
    if (!Number.isFinite(Number(policy[key])) || Number(policy[key]) < 0) {
      throw new Error(`${key} must be a non-negative number of hours.`)
    }
  }
}

function normalizeFees(fees) {
  return {
    ...fees,
    userServiceRate: Number(fees.userServiceRate),
    userServiceMin: Number(fees.userServiceMin),
    ownerCommissionRate: Number(fees.ownerCommissionRate),
    withdrawalFee: Number(fees.withdrawalFee),
    minWithdrawal: Number(fees.minWithdrawal),
  }
}

function normalizePolicy(policy) {
  return {
    ...policy,
    freeCancelHours: Number(policy.freeCancelHours),
    lateCancelRefundRate: Number(policy.lateCancelRefundRate),
    noShowRefundRate: Number(policy.noShowRefundRate),
    requestExpiryHours: Number(policy.requestExpiryHours),
    disputeWindowHours: Number(policy.disputeWindowHours),
  }
}

export const settingsService = {
  async getFees() {
    return delay(readFees())
  },

  async getRefundPolicy() {
    return delay(readRefundPolicy())
  },

  async getSettings() {
    return delay(readSettings())
  },

  async update(changes = {}) {
    const current = readSettings()
    const feeChanges = changes.fees ?? Object.fromEntries(
      Object.keys(FEES)
        .filter((key) => Object.hasOwn(changes, key))
        .map((key) => [key, changes[key]]),
    )
    const policyChanges = changes.refundPolicy ?? Object.fromEntries(
      Object.keys(REFUND_POLICY)
        .filter((key) => Object.hasOwn(changes, key))
        .map((key) => [key, changes[key]]),
    )
    const submittedFees = { ...current.fees, ...feeChanges }
    const submittedPolicy = { ...current.refundPolicy, ...policyChanges }
    validateFees(submittedFees)
    validateRefundPolicy(submittedPolicy)
    const settings = {
      fees: normalizeFees(submittedFees),
      refundPolicy: normalizePolicy(submittedPolicy),
    }
    window.localStorage.setItem(FEES_KEY, JSON.stringify(settings))
    return delay({
      ...settings,
      ...settings.fees,
    })
  },

  async updateFees(changes) {
    const settings = await this.update({ fees: changes })
    return {
      ...settings.fees,
    }
  },
}
