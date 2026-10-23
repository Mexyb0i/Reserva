export const ownerCustomers = [
  { id: 1, name: 'Jordan Lee', email: 'jordan.lee@email.com', totalBookings: 8, lastBooking: 'Oct 20, 2026' },
  { id: 2, name: 'Sofia Reyes', email: 'sofia.reyes@email.com', totalBookings: 5, lastBooking: 'Oct 18, 2026' },
  { id: 3, name: 'Ethan Cruz', email: 'ethan.cruz@email.com', totalBookings: 12, lastBooking: 'Oct 21, 2026' },
  { id: 4, name: 'Maya Torres', email: 'maya.torres@email.com', totalBookings: 4, lastBooking: 'Oct 12, 2026' },
  { id: 5, name: 'Chris Lee', email: 'chris.lee@email.com', totalBookings: 3, lastBooking: 'Sep 29, 2026' },
  { id: 6, name: 'Ava Silva', email: 'ava.silva@email.com', totalBookings: 9, lastBooking: 'Oct 19, 2026' },
  { id: 7, name: 'Noah Garcia', email: 'noah.garcia@email.com', totalBookings: 2, lastBooking: 'Aug 11, 2026' },
  { id: 8, name: 'Lina Santos', email: 'lina.santos@email.com', totalBookings: 6, lastBooking: 'Oct 15, 2026' },
  { id: 9, name: 'Mateo Flores', email: 'mateo.flores@email.com', totalBookings: 1, lastBooking: 'Jul 23, 2026' },
  { id: 10, name: 'Isabel Ramos', email: 'isabel.ramos@email.com', totalBookings: 7, lastBooking: 'Oct 17, 2026' },
]

export const ownerInquiries = [
  {
    id: 'inq-101',
    customer: 'Jordan Lee',
    email: 'jordan.lee@email.com',
    subject: 'Lighting availability',
    preview: 'Is the football turf lighting available for evening bookings?',
    receivedAt: 'Today, 9:18 AM',
    status: 'Unread',
    messages: [
      { id: 'msg-101', author: 'customer', text: 'Is the football turf lighting available for evening bookings?', sentAt: 'Today, 9:18 AM' },
    ],
  },
  {
    id: 'inq-102',
    customer: 'Sofia Reyes',
    email: 'sofia.reyes@email.com',
    subject: 'Court equipment',
    preview: 'Do you provide basketballs for court reservations?',
    receivedAt: 'Today, 8:42 AM',
    status: 'Replied',
    messages: [
      { id: 'msg-102', author: 'customer', text: 'Do you provide basketballs for court reservations?', sentAt: 'Today, 8:42 AM' },
      { id: 'msg-103', author: 'owner', text: 'Yes, basketballs are available at the front desk during your booking.', sentAt: 'Today, 9:02 AM' },
    ],
  },
  {
    id: 'inq-103',
    customer: 'Maya Torres',
    email: 'maya.torres@email.com',
    subject: 'Changing a reservation',
    preview: 'Can I move my Saturday booking to Sunday afternoon?',
    receivedAt: 'Yesterday, 4:15 PM',
    status: 'Unread',
    messages: [
      { id: 'msg-104', author: 'customer', text: 'Can I move my Saturday booking to Sunday afternoon?', sentAt: 'Yesterday, 4:15 PM' },
    ],
  },
]
