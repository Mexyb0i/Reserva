import { facilities, reservations, timeslots } from '../data/mockData'
import { ownerCustomers, ownerInquiries as inquirySeed } from '../data/ownerCustomerData'

const delay = (value) =>
  new Promise((resolve) => {
    setTimeout(() => resolve(value), 140)
  })

const APPLICATION_KEY = 'reserva.owner.application'
const APPLICATION_DRAFT_KEY = 'reserva.owner.applicationDraft'
const AVAILABILITY_KEY = 'reserva.owner.courtAvailability'
const FACILITIES_KEY = 'reserva.owner.facilities'
const CANCELLATIONS_KEY = 'reserva.owner.cancellations'

function readStoredValue(key) {
  const value = window.localStorage.getItem(key)
  return value ? JSON.parse(value) : null
}

let ownerFacilities = readStoredValue(FACILITIES_KEY) ?? facilities.map((facility) => ({ ...facility, active: true }))
let ownerReservations = [
  {
    id: 1001,
    customer: 'Jordan Lee',
    facilityId: 1,
    facility: 'Football Turf',
    date: '24 Oct 2026',
    time: '10:00 - 12:00',
    duration: '2 hrs',
    status: 'Pending',
    total: '₱240',
  },
  {
    id: 1002,
    customer: 'Sofia Reyes',
    facilityId: 2,
    facility: 'Basketball Court',
    date: '24 Oct 2026',
    time: '13:00 - 15:00',
    duration: '2 hrs',
    status: 'Pending',
    total: '₱180',
  },
  {
    id: 1003,
    customer: 'Ethan Cruz',
    facilityId: 1,
    facility: 'Football Turf',
    date: '25 Oct 2026',
    time: '09:00 - 11:00',
    duration: '2 hrs',
    status: 'Confirmed',
    total: '₱240',
  },
  ...reservations.map((reservation, index) => ({
    id: reservation.id + 100,
    customer: ['Maya Torres', 'Chris Lee'][index] ?? 'Guest',
    facilityId: index + 1,
    facility: reservation.name,
    date: reservation.date,
    time: reservation.time,
    duration: index === 0 ? '2 hrs' : '1.5 hrs',
    status: reservation.status,
    total: reservation.total,
  })),
].map((reservation) => ({
  ...reservation,
  createdAt: reservation.createdAt ?? new Date().toISOString(),
}))
const availabilityTemplate = timeslots.map((slot) => ({
  ...slot,
  status: slot.status === 'selected' ? 'available' : slot.status,
}))
const availabilityByCourtDate = new Map(
  JSON.parse(window.localStorage.getItem(AVAILABILITY_KEY) ?? '[]'),
)
let customerInquiries = inquirySeed.map((inquiry) => ({
  ...inquiry,
  messages: inquiry.messages.map((message) => ({ ...message })),
}))

function availabilityFor(facilityId, date, courtNumber) {
  const key = `${Number(facilityId)}:${date}:${courtNumber}`
  if (!availabilityByCourtDate.has(key)) {
    availabilityByCourtDate.set(key, availabilityTemplate.map((slot) => ({ ...slot })))
  }
  const savedSlots = availabilityByCourtDate.get(key)
  const normalizedSlots = availabilityTemplate.map((slot) => ({
    ...slot,
    ...savedSlots.find((savedSlot) => savedSlot.label === slot.label),
  }))
  availabilityByCourtDate.set(key, normalizedSlots)
  return normalizedSlots
}

function saveFacilities() {
  window.localStorage.setItem(FACILITIES_KEY, JSON.stringify(ownerFacilities))
}

function readOwnerCancellations() {
  return JSON.parse(window.localStorage.getItem(CANCELLATIONS_KEY) ?? '{}')
}

export const ownerService = {
  async registerOwnerAccount(account) {
    if (!account.fullName?.trim() || !account.email?.trim() || !account.password) {
      throw new Error('Owner account details are incomplete.')
    }
    return delay({
      ok: true,
      owner: {
        fullName: account.fullName.trim(),
        email: account.email.trim(),
        phone: account.phone.trim(),
      },
    })
  },

  async getApplicationDraft() {
    return delay(readStoredValue(APPLICATION_DRAFT_KEY))
  },

  async saveApplicationDraft(draft) {
    window.localStorage.setItem(APPLICATION_DRAFT_KEY, JSON.stringify(draft))
    return delay({ ...draft })
  },

  async submitApplication(application) {
    const submittedApplication = {
      ...application,
      id: `RV-${Date.now().toString(36).toUpperCase()}`,
      status: 'Pending review',
      submittedAt: new Date().toISOString(),
    }
    window.localStorage.setItem(APPLICATION_KEY, JSON.stringify(submittedApplication))
    window.localStorage.removeItem(APPLICATION_DRAFT_KEY)
    return delay({ ...submittedApplication })
  },

  async getApplicationStatus() {
    return delay(readStoredValue(APPLICATION_KEY))
  },

  async getCustomers() {
    return delay(ownerCustomers.map((customer) => ({ ...customer })))
  },

  async getCustomerInquiries() {
    return delay(customerInquiries.map((inquiry) => ({
      ...inquiry,
      messages: inquiry.messages.map((message) => ({ ...message })),
    })))
  },

  async markInquiryRead(id) {
    const index = customerInquiries.findIndex((inquiry) => inquiry.id === id)
    if (index < 0) throw new Error('Customer inquiry not found.')
    if (customerInquiries[index].status === 'Unread') {
      customerInquiries[index] = { ...customerInquiries[index], status: 'Read' }
    }
    return delay({
      ...customerInquiries[index],
      messages: customerInquiries[index].messages.map((message) => ({ ...message })),
    })
  },

  async replyToInquiry(id, text) {
    const trimmedText = text.trim()
    if (!trimmedText) throw new Error('Enter a reply before sending.')
    const index = customerInquiries.findIndex((inquiry) => inquiry.id === id)
    if (index < 0) throw new Error('Customer inquiry not found.')
    const message = {
      id: `msg-${Date.now()}`,
      author: 'owner',
      text: trimmedText,
      sentAt: 'Just now',
    }
    customerInquiries[index] = {
      ...customerInquiries[index],
      status: 'Replied',
      preview: trimmedText,
      messages: [...customerInquiries[index].messages, message],
    }
    return delay({
      ...customerInquiries[index],
      messages: customerInquiries[index].messages.map((item) => ({ ...item })),
    })
  },

  async getDashboard() {
    const pending = ownerReservations.filter((item) => item.status === 'Pending').length
    const confirmed = ownerReservations.filter((item) => item.status === 'Confirmed').length
    const revenue = ownerReservations
      .filter((item) => item.status === 'Confirmed')
      .reduce((total, item) => total + Number(item.total.replace(/[^\d.]/g, '')), 0)
    return delay({
      stats: [
        { label: 'Facilities', value: ownerFacilities.filter((item) => item.active).length, detail: 'Active listings' },
        { label: 'Reservation requests', value: pending, detail: 'Awaiting your response' },
        { label: 'Confirmed bookings', value: confirmed, detail: 'Across all facilities' },
        { label: 'Confirmed revenue', value: `₱${new Intl.NumberFormat('en-PH').format(revenue)}`, detail: 'Mock booking total' },
      ],
      requests: ownerReservations.slice(0, 5),
    })
  },

  async getFacilities() {
    return delay(ownerFacilities.map((facility) => ({ ...facility })))
  },

  async updateFacility(id, changes) {
    const index = ownerFacilities.findIndex((facility) => facility.id === Number(id))
    if (index < 0) throw new Error('Facility not found.')
    if (changes.courtCount !== undefined &&
      (!Number.isInteger(Number(changes.courtCount)) || Number(changes.courtCount) < 1 || Number(changes.courtCount) > 20)) {
      throw new Error('A facility must have between 1 and 20 courts.')
    }
    ownerFacilities[index] = { ...ownerFacilities[index], ...changes }
    saveFacilities()
    return delay({ ...ownerFacilities[index] })
  },

  async createFacility(facility) {
    if (facility.applicationId) {
      const existing = ownerFacilities.find((item) => item.applicationId === facility.applicationId)
      if (existing) return delay({ ...existing })
    }
    if (!facility.name?.trim() || !facility.sport?.trim()) {
      throw new Error('Enter a facility name and sport.')
    }
    if (!Number.isFinite(Number(facility.hourlyRate)) || Number(facility.hourlyRate) <= 0) {
      throw new Error('Enter a valid hourly rate greater than zero.')
    }
    if (!Number.isInteger(Number(facility.courtCount)) || Number(facility.courtCount) < 1 || Number(facility.courtCount) > 20) {
      throw new Error('A facility must have between 1 and 20 courts.')
    }
    const created = {
      id: Math.max(0, ...ownerFacilities.map((item) => Number(item.id) || 0)) + 1,
      name: facility.name.trim(),
      sport: facility.sport.trim(),
      courtCount: Number(facility.courtCount),
      price: `₱${new Intl.NumberFormat('en-PH').format(Number(facility.hourlyRate))}/hr`,
      availability: '0 slots',
      color: facility.color ?? 'bg-accent',
      active: true,
      ...(facility.applicationId ? { applicationId: facility.applicationId } : {}),
      ...(facility.owner ? { owner: { ...facility.owner } } : {}),
    }
    ownerFacilities = [...ownerFacilities, created]
    saveFacilities()
    return delay({ ...created })
  },

  async getReservations() {
    return delay(ownerReservations.map((reservation) => ({ ...reservation })))
  },

  async getEarnings() {
    const transactions = ownerReservations.map((reservation) => ({
      ...reservation,
      paymentMethod: reservation.paymentMethod ?? 'Not recorded',
    }))
    const confirmed = transactions.filter((item) => item.status === 'Confirmed')
    const pending = transactions.filter((item) => item.status === 'Pending')
    const amountOf = (items) =>
      items.reduce((total, item) => total + Number(item.total.replace(/[^\d.]/g, '')), 0)
    const formatPeso = (amount) =>
      `₱${new Intl.NumberFormat('en-PH', { maximumFractionDigits: 0 }).format(amount)}`

    return delay({
      stats: [
        { label: 'Confirmed revenue', value: formatPeso(amountOf(confirmed)), detail: 'From confirmed reservations' },
        { label: 'Pending payments', value: formatPeso(amountOf(pending)), detail: 'From pending requests' },
        { label: 'Confirmed bookings', value: confirmed.length, detail: 'Across all facilities' },
      ],
      transactions,
    })
  },

  async updateReservationStatus(id, status, reason = '') {
    if (!['Confirmed', 'Cancelled'].includes(status)) {
      throw new Error('Unsupported reservation status.')
    }
    if (status === 'Cancelled' && !reason.trim()) {
      throw new Error('A cancellation reason is required.')
    }
    const index = ownerReservations.findIndex((reservation) => reservation.id === Number(id))
    if (index < 0) throw new Error('Reservation request not found.')
    ownerReservations[index] = {
      ...ownerReservations[index],
      status,
      ...(status === 'Cancelled' ? { cancellationReason: reason.trim() } : {}),
    }
    if (status === 'Cancelled') {
      await this.recordOwnerCancellation('owner-demo')
    }
    return delay({ ...ownerReservations[index] })
  },

  async recordOwnerCancellation(ownerId = 'owner-demo') {
    if (!ownerId?.trim()) throw new Error('An owner account is required.')
    const counts = readOwnerCancellations()
    counts[ownerId] = Number(counts[ownerId] ?? 0) + 1
    window.localStorage.setItem(CANCELLATIONS_KEY, JSON.stringify(counts))
    return delay(counts[ownerId])
  },

  async getOwnerCancellationCount(ownerId = 'owner-demo') {
    return delay(Number(readOwnerCancellations()[ownerId] ?? 0))
  },

  async getAvailability(facilityId, date) {
    const facility = ownerFacilities.find((item) => item.id === Number(facilityId))
    if (!facility) throw new Error('Choose a valid facility to view its schedule.')
    const courts = Array.from({ length: facility.courtCount ?? 1 }, (_, index) => {
      const courtNumber = index + 1
      return {
        courtNumber,
        slots: availabilityFor(facilityId, date, courtNumber).map((slot) => ({ ...slot })),
      }
    })
    return delay({ facilityId: facility.id, date, courtCount: facility.courtCount ?? 1, courts })
  },

  async updateAvailability(facilityId, date, courtNumber, label, status) {
    const facility = ownerFacilities.find((item) => item.id === Number(facilityId))
    if (!facility || courtNumber < 1 || courtNumber > (facility.courtCount ?? 1)) {
      throw new Error('Choose a valid facility before updating its schedule.')
    }
    if (!['available', 'taken'].includes(status)) {
      throw new Error('Choose available or taken for a time slot.')
    }
    const availability = availabilityFor(facilityId, date, courtNumber)
    const index = availability.findIndex((slot) => slot.label === label)
    if (index < 0) throw new Error('Time slot not found.')
    availability[index] = { ...availability[index], status }
    window.localStorage.setItem(AVAILABILITY_KEY, JSON.stringify([...availabilityByCourtDate]))
    return delay({ ...availability[index] })
  },
}
