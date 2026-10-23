export const SPORT_COLORS = {
  Basketball: '#ff7a00',
  'Pickle Ball': '#22e05a',
  Swimming: '#22e5e5',
  Volleyball: '#1f5fff',
  Futsal: '#1f5fff',
  Tennis: '#ffffff',
  Badminton: '#ffffff',
  Soccer: '#e6f21a',
}

export const calendarMonthData = {
  '2026-10-02': [
    { sport: 'Basketball', status: 'Confirmed' },
    { sport: 'Soccer', status: 'Pending' },
  ],
  '2026-10-05': [
    { sport: 'Pickle Ball', status: 'Confirmed' },
    { sport: 'Tennis', status: 'Cancelled' },
  ],
  '2026-10-08': [
    { sport: 'Swimming', status: 'Confirmed' },
    { sport: 'Volleyball', status: 'Pending' },
    { sport: 'Badminton', status: 'Confirmed' },
    { sport: 'Futsal', status: 'Pending' },
    { sport: 'Basketball', status: 'Cancelled' },
  ],
  '2026-10-12': [
    { sport: 'Tennis', status: 'Confirmed' },
    { sport: 'Soccer', status: 'Pending' },
  ],
  '2026-10-17': [
    { sport: 'Basketball', status: 'Confirmed' },
    { sport: 'Swimming', status: 'Pending' },
  ],
  '2026-10-22': [
    { sport: 'Soccer', status: 'Confirmed' },
    { sport: 'Pickle Ball', status: 'Pending' },
    { sport: 'Volleyball', status: 'Confirmed' },
  ],
  '2026-10-24': [
    { sport: 'Soccer', status: 'Pending' },
    { sport: 'Basketball', status: 'Pending' },
  ],
  '2026-10-25': [{ sport: 'Soccer', status: 'Confirmed' }],
}

export const scheduleByDate = {
  '2026-10-08': [
    { id: 'cal-801', user: 'User5#', facility: 'Basketball Court', start: '8:00', end: '10:00AM', status: 'Confirmed' },
    { id: 'cal-802', user: 'User12#', facility: 'Swimming Pool', start: '10:30', end: '12:00PM', status: 'Pending' },
  ],
  '2026-10-22': [
    { id: 'cal-2201', user: 'User5#', facility: 'Football Turf', start: '8:00', end: '10:00AM', status: 'Confirmed' },
    { id: 'cal-2202', user: 'User18#', facility: 'Volleyball Arena', start: '1:00', end: '3:00PM', status: 'Pending' },
  ],
  '2026-10-24': [
    { id: 'cal-2401', user: 'User5#', facility: 'Football Turf', start: '8:00', end: '10:00AM', status: 'Pending' },
    { id: 'cal-2402', user: 'User12#', facility: 'Basketball Court', start: '1:00', end: '3:00PM', status: 'Pending' },
  ],
  '2026-10-25': [
    { id: 'cal-2501', user: 'User8#', facility: 'Football Turf', start: '9:00', end: '11:00AM', status: 'Confirmed' },
  ],
}
