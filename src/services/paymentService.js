const PAYMENT_METHODS = ['GCash', 'Maya', 'Bank']
const PAYMENTS_KEY = 'reserva.payments'
const delay = (value) => new Promise((resolve) => setTimeout(() => resolve(value), 350))
const roundMoney = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100

function readPayments() {
  const value = window.localStorage.getItem(PAYMENTS_KEY)
  return value ? JSON.parse(value) : []
}

function savePayments(payments) {
  window.localStorage.setItem(PAYMENTS_KEY, JSON.stringify(payments))
}

export const paymentService = {
  async createPayment({ method, amount }) {
    if (!PAYMENT_METHODS.includes(method)) {
      throw new Error('Choose GCash, Maya, or Bank as the payment method.')
    }
    if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) {
      throw new Error('Payment amount must be greater than zero.')
    }
    const payment = {
      id: `PAY-${Date.now()}`,
      type: 'payment',
      method,
      amount: roundMoney(amount),
      status: 'paid',
      refundedAmount: 0,
      createdAt: new Date().toISOString(),
    }
    savePayments([payment, ...readPayments()])
    return delay({ ...payment })
  },

  async linkPayment(paymentId, reservationId) {
    const payments = readPayments()
    const index = payments.findIndex((item) => item.id === paymentId)
    if (index < 0) throw new Error('Payment record not found.')
    payments[index] = { ...payments[index], reservationId }
    savePayments(payments)
    return delay({ ...payments[index] })
  },

  async getPayment(paymentId) {
    const payment = readPayments().find((item) => item.id === paymentId && item.type !== 'refund')
    if (!payment) throw new Error('Payment record not found.')
    return delay({ ...payment })
  },

  async refundPayment(reservationId, amount, details = {}) {
    if (!reservationId || !Number.isFinite(Number(amount)) || Number(amount) < 0) {
      throw new Error('A valid reservation and refund amount are required.')
    }
    const payments = readPayments()
    const paymentIndex = payments.findIndex((item) =>
      item.type !== 'refund' && !item.refundId &&
      !String(item.id).startsWith('REF-') &&
      (item.reservationId === reservationId || item.id === reservationId),
    )
    const payment = paymentIndex < 0 ? null : payments[paymentIndex]
    if (!payment) throw new Error('Payment record not found for this reservation.')
    const refundAmount = roundMoney(amount)
    const refundedAmount = roundMoney(payment.refundedAmount ?? 0)
    if (refundedAmount + refundAmount > payment.amount) {
      throw new Error('Refund amount cannot exceed the original payment.')
    }
    if (payments.some((item) => item.type === 'refund' &&
      item.reservationId === (payment.reservationId ?? payment.id) &&
      item.status === 'completed')) {
      throw new Error('This reservation already has a completed refund.')
    }
    const updatedPayment = {
      ...payment,
      refundedAmount: roundMoney(refundedAmount + refundAmount),
      status: refundedAmount + refundAmount >= payment.amount ? 'refunded' : 'partially_refunded',
    }
    payments[paymentIndex] = updatedPayment
    const refundId = `REF-${Date.now()}`
    const refund = {
      id: refundId,
      type: 'refund',
      refundId,
      reservationId: payment.reservationId ?? payment.id,
      originalPaymentId: payment.id,
      cancelledBy: details.cancelledBy ?? null,
      reason: details.reason ?? '',
      courtRefund: roundMoney(details.courtRefund ?? refundAmount),
      serviceFeeRefund: roundMoney(details.serviceFeeRefund ?? 0),
      totalRefunded: refundAmount,
      retainedByOwner: roundMoney(details.retainedByOwner ?? 0),
      retainedByPlatform: roundMoney(details.retainedByPlatform ?? 0),
      gatewayFeeLost: roundMoney(details.gatewayFeeLost ?? 0),
      status: 'completed',
      createdAt: new Date().toISOString(),
    }
    savePayments([refund, ...payments])
    return delay({ ...refund })
  },
}
