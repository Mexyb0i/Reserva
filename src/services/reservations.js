import { calendarMonthData, scheduleByDate } from '../data/calendarData'

const wait = (value) =>
  new Promise((resolve) => {
    setTimeout(() => resolve(value), 140)
  })

export const reservationsService = {
  async getCalendarMonth(year, month) {
    const prefix = `${year}-${String(month + 1).padStart(2, '0')}-`
    const entries = Object.entries(calendarMonthData)
      .filter(([date]) => date.startsWith(prefix))
      .map(([date, bookings]) => [
        date,
        bookings.map((booking) => ({ ...booking })),
      ])
    return wait(Object.fromEntries(entries))
  },

  async getScheduleByDate(date) {
    return wait((scheduleByDate[date] ?? []).map((booking) => ({ ...booking })))
  },
}
