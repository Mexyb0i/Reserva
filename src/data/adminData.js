export const adminApplications = [
  {
    id: 'RV-APP-2601',
    owner: { fullName: 'Taylor Brooks', email: 'taylor.brooks@email.com', phone: '+63 917 555 0101' },
    business: { name: 'Northside Sports Center', address: 'Quezon City', contact: '+63 917 555 0101', ownership: 'Owner' },
    facility: {
      name: 'Northside Basketball Courts',
      sport: 'Basketball',
      courtCount: 3,
      hourlyRate: 450,
      openingTime: '08:00',
      closingTime: '22:00',
      amenities: ['Changing rooms', 'Parking', 'Lighting'],
      photoNames: [],
    },
    status: 'Pending review',
    submittedAt: '2026-10-21T08:30:00.000Z',
  },
  {
    id: 'RV-APP-2602',
    owner: { fullName: 'Jamie Santos', email: 'jamie.santos@email.com', phone: '+63 917 555 0102' },
    business: { name: 'Santos Racket Club', address: 'Pasig City', contact: '+63 917 555 0102', ownership: 'Authorized manager' },
    facility: {
      name: 'Santos Badminton Hall',
      sport: 'Badminton',
      courtCount: 4,
      hourlyRate: 280,
      openingTime: '07:00',
      closingTime: '23:00',
      amenities: ['Parking', 'Showers', 'Equipment rental'],
      photoNames: [],
    },
    status: 'Pending review',
    submittedAt: '2026-10-20T11:15:00.000Z',
  },
  {
    id: 'RV-APP-2508',
    owner: { fullName: 'Morgan Reyes', email: 'morgan.reyes@email.com', phone: '+63 917 555 0103' },
    business: { name: 'Reyes Aquatic Center', address: 'Makati City', contact: '+63 917 555 0103', ownership: 'Owner' },
    facility: {
      name: 'Reyes Lap Pool',
      sport: 'Swimming',
      courtCount: 1,
      hourlyRate: 600,
      openingTime: '06:00',
      closingTime: '21:00',
      amenities: ['Changing rooms', 'Showers'],
      photoNames: [],
    },
    status: 'Approved',
    submittedAt: '2026-10-18T06:00:00.000Z',
  },
]

export const adminUsers = [
  { id: 1, name: 'Alex Rivera', email: 'alex.rivera@email.com', role: 'Player', status: 'Active', joinedAt: 'Oct 22, 2026' },
  { id: 2, name: 'Jordan Lee', email: 'jordan.lee@email.com', role: 'Player', status: 'Active', joinedAt: 'Oct 20, 2026' },
  { id: 3, ownerId: 'owner-3', name: 'Taylor Brooks', email: 'taylor.brooks@email.com', role: 'Facility owner', status: 'Pending', joinedAt: 'Oct 21, 2026' },
  { id: 4, name: 'Sofia Reyes', email: 'sofia.reyes@email.com', role: 'Player', status: 'Active', joinedAt: 'Oct 18, 2026' },
  { id: 5, ownerId: 'owner-5', name: 'Jamie Santos', email: 'jamie.santos@email.com', role: 'Facility owner', status: 'Pending', joinedAt: 'Oct 20, 2026' },
  { id: 6, name: 'Ethan Cruz', email: 'ethan.cruz@email.com', role: 'Player', status: 'Active', joinedAt: 'Oct 17, 2026' },
  { id: 7, ownerId: 'owner-demo', name: 'Morgan Reyes', email: 'morgan.reyes@email.com', role: 'Facility owner', status: 'Active', joinedAt: 'Oct 18, 2026' },
]

export const adminPayments = [
  { id: 'PAY-3108', customer: 'Jordan Lee', facility: 'Football Turf', date: 'Oct 22, 2026', method: 'GCash', amount: 240, status: 'Paid' },
  { id: 'PAY-3107', customer: 'Sofia Reyes', facility: 'Basketball Court', date: 'Oct 21, 2026', method: 'Bank', amount: 180, status: 'Pending' },
  { id: 'PAY-3106', customer: 'Ethan Cruz', facility: 'Tennis Courts', date: 'Oct 20, 2026', method: 'Maya', amount: 150, status: 'Paid' },
  { id: 'PAY-3105', customer: 'Maya Torres', facility: 'Volleyball Arena', date: 'Oct 19, 2026', method: 'Bank', amount: 160, status: 'Refunded' },
]

export const adminAnnouncements = [
  { id: 'ANN-01', title: 'Welcome to RESERVA', message: 'Explore facilities and reserve your next game online.', audience: 'All users', publishedAt: 'Oct 15, 2026' },
  { id: 'ANN-02', title: 'Facility partner applications are open', message: 'Register your sports venue to reach more players.', audience: 'Facility owners', publishedAt: 'Oct 18, 2026' },
]
