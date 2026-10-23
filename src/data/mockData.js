export const navItems = [
  { label: 'Dashboard', path: '/dashboard', active: true },
  { label: 'Sports Facilities', path: '/sports-facilities' },
  { label: 'Reserved Schedule', path: '/reserved-schedule' },
  { label: 'Reservation History', path: '/reservation-history' },
  { label: 'My Friends', path: '/my-friends' },
]

export const authCards = [
  {
    id: 'signup',
    title: 'Sign Up',
    type: 'signup',
    fields: ['Full Name', 'Email Address', 'Password'],
    submit: 'Sign Up',
  },
  {
    id: 'login',
    title: 'Login',
    type: 'login',
    fields: ['Email Address', 'Password'],
    submit: 'Log In',
  },
  {
    id: 'recovery',
    title: 'Account Recovery',
    type: 'recovery',
    fields: ['Email Address'],
    submit: 'Send Recovery',
  },
]

export const stats = [
  { title: 'Active', value: 24, tone: 'success' },
  { title: 'Total', value: 96, tone: 'info' },
  { title: 'Pending', value: 8, tone: 'accent' },
]

export const facilities = [
  { id: 1, name: 'Football Turf', sport: 'Football', courtCount: 1, color: 'bg-red-600', price: '₱120/hr', availability: '9 slots' },
  { id: 2, name: 'Basketball Court', sport: 'Basketball', courtCount: 2, color: 'bg-orange-500', price: '₱90/hr', availability: '6 slots' },
  { id: 3, name: 'Tennis Courts', sport: 'Tennis', courtCount: 1, color: 'bg-blue-600', price: '₱75/hr', availability: '11 slots' },
  { id: 4, name: 'Volleyball Arena', sport: 'Volleyball', courtCount: 1, color: 'bg-green-600', price: '₱80/hr', availability: '8 slots' },
  { id: 5, name: 'Badminton Hall', sport: 'Badminton', courtCount: 1, color: 'bg-yellow-500', price: '₱60/hr', availability: '14 slots' },
  { id: 6, name: 'Swimming Pool', sport: 'Swimming', courtCount: 1, color: 'bg-cyan-500', price: '₱110/hr', availability: '5 slots' },
]

export const timeslots = [
  { label: '08:00', status: 'available' },
  { label: '09:00', status: 'available' },
  { label: '10:00', status: 'available' },
  { label: '11:00', status: 'available' },
  { label: '12:00', status: 'taken' },
  { label: '13:00', status: 'available' },
  { label: '14:00', status: 'available' },
  { label: '15:00', status: 'limited' },
  { label: '16:00', status: 'taken' },
  { label: '17:00', status: 'available' },
  { label: '18:00', status: 'available' },
  { label: '19:00', status: 'limited' },
  { label: '20:00', status: 'taken' },
  { label: '21:00', status: 'available' },
]

export const reservations = [
  {
    id: 1,
    name: 'Football Turf',
    date: 'Tue, 23 Jul',
    time: '11:00 AM - 01:00 PM',
    status: 'Confirmed',
    total: '₱240',
    image: 'https://images.unsplash.com/photo-1547347298-4074fc3086f0?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 2,
    name: 'Basketball Court',
    date: 'Wed, 24 Jul',
    time: '06:00 PM - 07:30 PM',
    status: 'Pending',
    total: '₱150',
    image: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=800&q=80',
  },
]

export const reservationHistory = [
  { facility: 'Football Turf', date: '12 Jul 2026', duration: '2 hrs', status: 'Completed', total: '₱120' },
  { facility: 'Tennis Courts', date: '08 Jul 2026', duration: '1.5 hrs', status: 'Pending', total: '₱85' },
  { facility: 'Basketball Court', date: '04 Jul 2026', duration: '2 hrs', status: 'Cancelled', total: '₱90' },
]

export const friends = [
  { name: 'Maya Torres', sport: 'Basketball', status: 'Online', actions: ['Message', 'Remove'] },
  { name: 'Chris Lee', sport: 'Football', status: 'Offline', actions: ['View', 'Remove'] },
  { name: 'Ava Silva', sport: 'Tennis', status: 'Online', actions: ['Message', 'Remove'] },
]

export const notifications = [
  { id: 1, title: 'Booking confirmed', message: 'Football Turf is now reserved for 23 Jul.', time: '5 min ago', unread: true, type: 'success' },
  { id: 2, title: 'Facility update', message: 'Basketball court has been rescheduled.', time: '21 min ago', unread: true, type: 'info' },
  { id: 3, title: 'Reminder', message: 'Your session starts in 2 hours.', time: '1 hour ago', unread: false, type: 'warning' },
]

export const reviews = [
  { id: 1, user: 'Ethan', rating: 5, text: 'Fantastic venue, easy booking and clean courts.' },
  { id: 2, user: 'Lina', rating: 4, text: 'Good facilities and helpful staff. Will book again.' },
]

export const facilityCategories = ['All', 'Football', 'Basketball', 'Tennis', 'Badminton', 'Volleyball', 'Swimming']

export const userProfile = {
  name: 'Alex Rivera',
  email: 'alex.rivera@email.com',
  phone: '+1 609 221 4417',
  preferredSports: ['Football', 'Basketball', 'Tennis'],
}
