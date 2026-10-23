import { adminAnnouncements as announcementSeed, adminApplications as applicationSeed, adminPayments, adminUsers as userSeed } from '../data/adminData'
import { auditLogService } from './auditLogService'
import { disputeService } from './disputeService'
import { ownerService } from './ownerService'
import { payoutService } from './payoutService'
import { reservationService } from './reservationService'

const APPLICATIONS_KEY = 'reserva.admin.applications'
const USERS_KEY = 'reserva.admin.users'
const ANNOUNCEMENTS_KEY = 'reserva.admin.announcements'
const OWNER_APPLICATION_KEY = 'reserva.owner.application'
const delay = (value) => new Promise((resolve) => setTimeout(() => resolve(value), 140))
const roundMoney = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100

function readStored(key) {
  const value = window.localStorage.getItem(key)
  return value ? JSON.parse(value) : null
}

function saveStored(key, value) {
  window.localStorage.setItem(key, JSON.stringify(value))
}

function normalizeApplication(application, fallback = {}) {
  if (!application || typeof application !== 'object') return null
  const source = { ...fallback, ...application }
  const ownerSource = { ...fallback.owner, ...application.owner }
  const businessSource = { ...fallback.business, ...application.business }
  const facilitySource = { ...fallback.facility, ...application.facility }
  const owner = {
    fullName: ownerSource.fullName ?? source.ownerName ?? source.applicantName ?? source.fullName ?? 'Applicant details unavailable',
    email: ownerSource.email ?? source.ownerEmail ?? source.email ?? 'Not provided',
    phone: ownerSource.phone ?? source.ownerPhone ?? source.phone ?? 'Not provided',
  }
  const business = {
    name: businessSource.name ?? source.businessName ?? 'Business details unavailable',
    address: businessSource.address ?? source.businessAddress ?? 'Not provided',
    contact: businessSource.contact ?? source.businessContact ?? 'Not provided',
    ownership: businessSource.ownership ?? source.ownership ?? 'Not provided',
  }
  const facility = {
    name: facilitySource.name ?? source.facilityName ?? 'Facility details unavailable',
    sport: facilitySource.sport ?? source.sport ?? 'Not provided',
    courtCount: facilitySource.courtCount ?? source.courtCount ?? 0,
    hourlyRate: facilitySource.hourlyRate ?? source.hourlyRate ?? 0,
    openingTime: facilitySource.openingTime ?? source.openingTime ?? 'Not provided',
    closingTime: facilitySource.closingTime ?? source.closingTime ?? 'Not provided',
    amenities: facilitySource.amenities ?? source.amenities ?? [],
    photoNames: facilitySource.photoNames ?? source.photoNames ?? [],
  }
  const detailsComplete = owner.fullName !== 'Applicant details unavailable' &&
    business.name !== 'Business details unavailable' &&
    facility.name !== 'Facility details unavailable' &&
    facility.sport !== 'Not provided' &&
    Number(facility.courtCount) > 0 &&
    Number(facility.hourlyRate) > 0
  return {
    ...source,
    id: source.id ?? `RV-LEGACY-${Date.now()}`,
    owner,
    business,
    facility,
    submittedAt: source.submittedAt ?? new Date().toISOString(),
    detailsComplete,
  }
}

function getApplications() {
  const applications = applicationSeed.map((application) => normalizeApplication(application))
  const saved = readStored(APPLICATIONS_KEY) ?? []
  if (!Array.isArray(saved)) throw new Error('Saved facility application records are invalid.')
  saved.forEach((application) => {
    if (!application?.id) return
    const index = applications.findIndex((item) => item.id === application.id)
    if (index < 0) {
      if (!application.owner || !application.business || !application.facility) return
      applications.push(normalizeApplication(application))
      return
    }
    applications[index] = normalizeApplication(application, applications[index])
  })
  const storedSubmission = readStored(OWNER_APPLICATION_KEY)
  const submitted = normalizeApplication(storedSubmission)
  if (submitted && !applications.some((application) => application.id === submitted.id)) {
    applications.unshift(submitted)
  }
  return applications
}

function getUsersData() {
  const users = (readStored(USERS_KEY) ?? userSeed).map((user) => {
    const seededUser = userSeed.find((item) => item.email === user.email)
    return {
      ...seededUser,
      ...user,
      ownerId: user.ownerId ?? seededUser?.ownerId,
    }
  })
  const application = normalizeApplication(readStored(OWNER_APPLICATION_KEY))
  if (!application || application.owner.email === 'Not provided') return users
  const index = users.findIndex((user) => user.email === application.owner.email)
  if (index >= 0) {
    if (application.status === 'Approved' && users[index].status === 'Pending') {
      users[index] = { ...users[index], status: 'Active' }
    }
    return users
  }
  const joinedDate = new Date(application.submittedAt)
  users.push({
    id: Math.max(0, ...users.map((user) => Number(user.id) || 0)) + 1,
    name: application.owner.fullName,
    email: application.owner.email,
    role: 'Facility owner',
    status: application.status === 'Approved' ? 'Active' : 'Pending',
    joinedAt: joinedDate.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }),
  })
  return users
}

export const adminService = {
  async getDashboard() {
    const [facilities, applications, users] = await Promise.all([
      ownerService.getFacilities(),
      Promise.resolve(getApplications()),
      Promise.resolve(getUsersData()),
    ])
    const pending = applications.filter((application) => application.status === 'Pending review').length
    const activeFacilities = facilities.filter((facility) => facility.active).length
    return delay({
      stats: [
        { label: 'Registered users', value: users.length, detail: 'Player and owner accounts' },
        { label: 'Active facilities', value: activeFacilities, detail: 'Currently listed for booking' },
        { label: 'Applications to review', value: pending, detail: 'Facility registrations pending' },
        { label: 'Total facilities', value: facilities.length, detail: 'Across all sports' },
      ],
      applications: applications.slice(0, 5),
    })
  },

  async getApplications() {
    return delay(getApplications().map((application) => ({ ...application })))
  },

  async reviewApplication(id, status, reviewNote = '') {
    if (!['Approved', 'Needs changes'].includes(status)) {
      throw new Error('Choose a supported application decision.')
    }
    const applications = getApplications()
    const index = applications.findIndex((application) => application.id === id)
    if (index < 0) throw new Error('Facility application not found.')
    const previousStatus = applications[index].status
    if (status === 'Needs changes' && !reviewNote.trim()) {
      throw new Error('Add a note explaining what needs to be changed.')
    }
    if (status === 'Approved' && !applications[index].detailsComplete) {
      throw new Error('This saved application is missing its facility details and cannot be approved.')
    }
    applications[index] = {
      ...applications[index],
      status,
      reviewNote: status === 'Needs changes' ? reviewNote.trim() : '',
      reviewedAt: new Date().toISOString(),
    }
    if (status === 'Approved' && previousStatus !== 'Approved') {
      const facility = applications[index].facility
      const ownerAccount = getUsersData().find((user) => user.email === applications[index].owner.email)
      await ownerService.createFacility({
        ...facility,
        hourlyRate: facility.hourlyRate,
        applicationId: id,
        owner: {
          id: ownerAccount?.id ?? null,
          name: applications[index].owner.fullName,
          email: applications[index].owner.email,
        },
      })
      const users = getUsersData()
      const userIndex = users.findIndex((user) => user.email === applications[index].owner.email)
      if (userIndex >= 0) {
        users[userIndex] = { ...users[userIndex], status: 'Active' }
        saveStored(USERS_KEY, users)
      }
    }
    saveStored(APPLICATIONS_KEY, applications)
    const submitted = readStored(OWNER_APPLICATION_KEY)
    if (submitted?.id === id) {
      saveStored(OWNER_APPLICATION_KEY, applications[index])
    }
    return delay({ ...applications[index] })
  },

  async getFacilities() {
    const [facilities, users] = await Promise.all([
      ownerService.getFacilities(),
      Promise.resolve(getUsersData()),
    ])
    const ownerAccounts = users.filter((user) => user.role === 'Facility owner' && user.status === 'Active')
    const applications = getApplications()
    for (const application of applications) {
      if (application.status !== 'Approved' || !application.detailsComplete ||
        facilities.some((facility) => facility.applicationId === application.id)) continue
      const ownerAccount = ownerAccounts.find((user) => user.email === application.owner.email)
      const created = await ownerService.createFacility({
        ...application.facility,
        hourlyRate: application.facility.hourlyRate,
        applicationId: application.id,
        owner: {
          id: ownerAccount?.id ?? null,
          name: application.owner.fullName,
          email: application.owner.email,
        },
      })
      facilities.push(created)
    }
    const defaultOwner = ownerAccounts[0] ?? null
    return facilities.map((facility) => {
      const applicationOwner = applications.find((application) => application.id === facility.applicationId)?.owner
      const owner = facility.owner ?? (applicationOwner
        ? { id: null, name: applicationOwner.fullName, email: applicationOwner.email }
        : defaultOwner
          ? { id: defaultOwner.id, name: defaultOwner.name, email: defaultOwner.email }
          : null)
      return { ...facility, owner }
    })
  },

  async updateFacility(id, changes) {
    if (changes.ownerEmail) {
      const currentFacilities = await ownerService.getFacilities()
      const currentFacility = currentFacilities.find((facility) => facility.id === Number(id))
      const owner = getUsersData().find((user) =>
        user.role === 'Facility owner' && user.status === 'Active' && user.email === changes.ownerEmail,
      )
      const currentOwner = currentFacility?.owner?.email === changes.ownerEmail ? currentFacility.owner : null
      if (!owner && !currentOwner) throw new Error('Select an active facility owner account.')
      const { ownerEmail, ...facilityChanges } = changes
      void ownerEmail
      return ownerService.updateFacility(id, {
        ...facilityChanges,
        owner: owner
          ? { id: owner.id, name: owner.name, email: owner.email }
          : currentOwner,
      })
    }
    return ownerService.updateFacility(id, changes)
  },

  async createFacility(facility) {
    const owner = getUsersData().find((user) =>
      user.role === 'Facility owner' && user.status === 'Active' && user.email === facility.ownerEmail,
    )
    if (!owner) throw new Error('Select an active facility owner account.')
    return ownerService.createFacility({
      ...facility,
      owner: { id: owner.id, name: owner.name, email: owner.email },
    })
  },

  async getUsers() {
    const users = getUsersData()
    return delay(await Promise.all(users.map(async (user) => ({
      ...user,
      cancellationCount: user.role === 'Facility owner'
        ? await ownerService.getOwnerCancellationCount(user.ownerId ?? String(user.id))
        : undefined,
    }))))
  },

  async getRevenueDashboard() {
    await reservationService.completePastReservations()
    const [financials, reservations, disputes] = await Promise.all([
      payoutService.getPlatformFinancialData(),
      reservationService.getReservedSchedule(),
      disputeService.getDisputes(),
    ])
    const refundServiceFees = financials.refunds.reduce(
      (sum, refund) => sum + Number(refund.serviceFeeRefund ?? 0),
      0,
    )
    const reversedCommissions = financials.refunds.reduce((sum, refund) => {
      const earning = financials.earnings.find((item) => item.reservationId === refund.reservationId)
      const courtRate = Number(earning?.courtRate ?? 0)
      const courtRefund = Number(refund.courtRefund ?? 0)
      const reversedRate = courtRate > 0 ? Math.min(1, courtRefund / courtRate) : 0
      return sum + Number(earning?.ownerCommission ?? 0) * reversedRate
    }, 0)
    const serviceFees = financials.earnings.reduce((sum, earning) => sum + Number(earning.serviceFee ?? 0), 0)
    const commissions = financials.earnings.reduce((sum, earning) => sum + Number(earning.ownerCommission ?? 0), 0)
    const withdrawalFees = financials.payouts.reduce(
      (sum, payout) => sum + Number(payout.fee ?? 0),
      0,
    )
    const gatewayFeesLost = financials.refunds.reduce((sum, refund) => sum + Number(refund.gatewayFeeLost ?? 0), 0)
    const pendingPayouts = financials.payouts
      .filter((payout) => ['Requested', 'Processing'].includes(payout.status))
      .reduce((sum, payout) => sum + Number(payout.amount ?? 0), 0)
    const totalRefunded = financials.refunds.reduce((sum, refund) => sum + Number(refund.totalRefunded ?? refund.amount ?? 0), 0)
    const ledger = [
      ...financials.earnings.map((earning) => ({
        id: earning.id,
        date: earning.date,
        type: 'Booking',
        reference: earning.reservationId,
        owner: earning.ownerId,
        gross: Number(earning.courtRate ?? 0),
        fees: Number(earning.serviceFee ?? 0),
        commission: Number(earning.ownerCommission ?? 0),
        amount: Number(earning.serviceFee ?? 0) + Number(earning.ownerCommission ?? 0),
        status: earning.status,
      })),
      ...financials.refunds.map((refund) => ({
        id: refund.id,
        date: refund.createdAt,
        type: 'Refund',
        reference: refund.reservationId,
        owner: refund.ownerId,
        gross: -Number(refund.totalRefunded ?? refund.amount ?? 0),
        fees: -Number(refund.serviceFeeRefund ?? 0),
        commission: 0,
        amount: -Number(refund.totalRefunded ?? refund.amount ?? 0),
        status: refund.status ?? 'Completed',
      })),
      ...financials.payouts.map((payout) => ({
        id: payout.id,
        date: payout.requestedAt,
        type: 'Withdrawal fee',
        reference: payout.id,
        owner: payout.ownerId,
        gross: Number(payout.amount),
        fees: Number(payout.fee),
        commission: 0,
        amount: Number(payout.fee),
        status: payout.status,
      })),
    ]
    const payoutRequests = financials.payouts.filter((payout) => ['Requested', 'Processing'].includes(payout.status))
    return delay({
      stats: {
        serviceFees: roundMoney(serviceFees - refundServiceFees),
        commissions: roundMoney(commissions - reversedCommissions),
        withdrawalFees: roundMoney(withdrawalFees),
        gatewayFeesLost: roundMoney(gatewayFeesLost),
        totalNetRevenue: roundMoney(
          serviceFees - refundServiceFees + commissions - reversedCommissions +
          withdrawalFees - gatewayFeesLost,
        ),
        pendingPayouts: roundMoney(pendingPayouts),
        totalRefunded: roundMoney(totalRefunded),
      },
      ledger,
      payoutRequests,
      disputes: disputes.filter((dispute) => dispute.status === 'Open').map((dispute) => ({
        ...dispute,
        reservation: reservations.find((reservation) => reservation.id === dispute.reservationId) ??
          dispute.reservationSnapshot ?? null,
      })),
    })
  },

  async updatePayoutRequest(id, action, note, actor = 'admin') {
    if (!note?.trim()) throw new Error('Add an audit note before updating a payout request.')
    if (!['approve', 'reject'].includes(action)) throw new Error('Choose approve or reject.')
    const payout = await payoutService.updatePayoutStatus(
      id,
      action === 'approve' ? 'Processing' : 'Failed',
      action === 'reject' ? note : '',
    )
    await auditLogService.add({
      action: action === 'approve' ? 'payout-approved' : 'payout-rejected',
      actor,
      targetId: id,
      note,
      details: { payoutId: id, ownerId: payout.ownerId, amount: payout.amount, status: payout.status },
    })
    return payout
  },

  async updateUserStatus(id, status) {
    if (!['Active', 'Suspended'].includes(status)) throw new Error('Choose a supported account status.')
    const users = getUsersData()
    const index = users.findIndex((user) => user.id === Number(id))
    if (index < 0) throw new Error('User account not found.')
    users[index] = { ...users[index], status }
    saveStored(USERS_KEY, users)
    return delay({ ...users[index] })
  },

  async getReports() {
    const [facilities, applications, users] = await Promise.all([
      ownerService.getFacilities(),
      Promise.resolve(getApplications()),
      Promise.resolve(getUsersData()),
    ])
    return delay({
      totals: [
        { label: 'Users', value: users.length },
        { label: 'Facilities', value: facilities.length },
        { label: 'Pending applications', value: applications.filter((item) => item.status === 'Pending review').length },
        { label: 'Approved applications', value: applications.filter((item) => item.status === 'Approved').length },
      ],
      facilitiesBySport: Object.entries(facilities.reduce((counts, facility) => {
        counts[facility.sport] = (counts[facility.sport] ?? 0) + 1
        return counts
      }, {})).map(([sport, count]) => ({ sport, count })),
      applications,
    })
  },

  async getPayments() {
    return delay(adminPayments.map((payment) => ({ ...payment })))
  },

  async getAnnouncements() {
    return delay((readStored(ANNOUNCEMENTS_KEY) ?? announcementSeed).map((announcement) => ({ ...announcement })))
  },

  async createAnnouncement(announcement) {
    if (!announcement.title.trim() || !announcement.message.trim()) {
      throw new Error('Enter an announcement title and message.')
    }
    const announcements = readStored(ANNOUNCEMENTS_KEY) ?? announcementSeed.map((item) => ({ ...item }))
    const created = {
      id: `ANN-${Date.now()}`,
      title: announcement.title.trim(),
      message: announcement.message.trim(),
      audience: announcement.audience,
      publishedAt: new Date().toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }),
    }
    announcements.unshift(created)
    saveStored(ANNOUNCEMENTS_KEY, announcements)
    return delay({ ...created })
  },
}
