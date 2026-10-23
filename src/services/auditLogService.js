import { auditLogSeed } from '../data/paymentData'

const AUDIT_LOG_KEY = 'reserva.admin.auditLog'
const delay = (value) => new Promise((resolve) => setTimeout(() => resolve(value), 120))

function readAuditLog() {
  const saved = window.localStorage.getItem(AUDIT_LOG_KEY)
  return saved ? JSON.parse(saved) : auditLogSeed.map((entry) => ({ ...entry }))
}

export const auditLogService = {
  async add(entry) {
    if (!entry?.action || !entry?.actor || !entry?.targetId || !entry?.note?.trim()) {
      throw new Error('Audit entries require an action, actor, target, and note.')
    }
    const record = {
      id: `AUD-${Date.now()}`,
      action: entry.action,
      actor: entry.actor,
      targetId: String(entry.targetId),
      note: entry.note.trim(),
      details: entry.details ?? {},
      createdAt: new Date().toISOString(),
    }
    const records = readAuditLog()
    window.localStorage.setItem(AUDIT_LOG_KEY, JSON.stringify([record, ...records]))
    return delay({ ...record })
  },

  async list(filters = {}) {
    const records = readAuditLog().filter((entry) =>
      (!filters.action || entry.action === filters.action) &&
      (!filters.actor || entry.actor === filters.actor) &&
      (!filters.targetId || entry.targetId === String(filters.targetId)),
    )
    return delay(records.map((entry) => ({ ...entry })))
  },
}
