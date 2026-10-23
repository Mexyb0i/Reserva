import { FEES } from '../config/fees'
import { calculateBookingFees } from '../utils/fees'

const firstEarning = calculateBookingFees(1500)
const secondEarning = calculateBookingFees(180)
const thirdEarning = calculateBookingFees(1000)

export const payoutSeed = [
  {
    id: 'PO-1001',
    ownerId: 'owner-demo',
    requestedAt: '2026-10-18T09:00:00.000Z',
    amount: 500,
    fee: FEES.withdrawalFee,
    net: 500 - FEES.withdrawalFee,
    destination: 'GCash ···· 4821',
    status: 'Paid',
  },
  {
    id: 'PO-1002',
    ownerId: 'owner-demo',
    requestedAt: '2026-10-21T09:00:00.000Z',
    amount: 500,
    fee: FEES.withdrawalFee,
    net: 500 - FEES.withdrawalFee,
    destination: 'Maya ···· 7330',
    status: 'Processing',
  },
]

export const payoutAccountSeed = [
  {
    id: 'PA-1001',
    ownerId: 'owner-demo',
    type: 'GCash',
    name: 'Demo Facility Owner',
    number: '09171234821',
    verified: true,
  },
  {
    id: 'PA-1002',
    ownerId: 'owner-demo',
    type: 'Maya',
    name: 'Demo Facility Owner',
    number: '09179847330',
    verified: true,
  },
]

export const refundSeed = []
export const disputeSeed = []
export const auditLogSeed = []

export const earningSeed = [
  {
    id: 'E-1001',
    ownerId: 'owner-demo',
    reservationId: 'R-1001',
    date: '2026-10-18',
    user: 'Jordan Lee',
    facility: 'Football Turf',
    courtRate: firstEarning.courtRate,
    serviceFee: firstEarning.serviceFee,
    ownerCommission: firstEarning.ownerCommission,
    ownerNet: firstEarning.ownerNet,
    status: 'Available',
    reservationStatus: 'Completed',
  },
  {
    id: 'E-1002',
    ownerId: 'owner-demo',
    reservationId: 'R-1002',
    date: '2026-10-25',
    user: 'Sofia Reyes',
    facility: 'Basketball Court',
    courtRate: secondEarning.courtRate,
    serviceFee: secondEarning.serviceFee,
    ownerCommission: secondEarning.ownerCommission,
    ownerNet: secondEarning.ownerNet,
    status: 'Pending',
    reservationStatus: 'Confirmed',
  },
  {
    id: 'E-1003',
    ownerId: 'owner-demo',
    reservationId: 'R-1003',
    date: '2026-10-20',
    user: 'Ethan Cruz',
    facility: 'Tennis Courts',
    courtRate: thirdEarning.courtRate,
    serviceFee: thirdEarning.serviceFee,
    ownerCommission: thirdEarning.ownerCommission,
    ownerNet: thirdEarning.ownerNet,
    status: 'Available',
    reservationStatus: 'Completed',
  },
]
