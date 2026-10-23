import DayCell from './DayCell'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function CalendarGrid({ year, month, days, bookingsByDate, selectedDate, todayDate, onSelectDate }) {
  return (
    <div role="grid" aria-label="Reservation calendar" className="grid grid-cols-7 gap-1.5 sm:gap-2">
      {WEEKDAYS.map((weekday) => (
        <div
          key={weekday}
          role="columnheader"
          className="pb-1 text-center text-[10px] font-medium text-muted sm:pb-2 sm:text-xs"
        >
          {weekday}
        </div>
      ))}
      {days.map((day, index) => (
        day === null ? (
          <span key={`empty-${index}`} aria-hidden="true" />
        ) : (
          <DayCell
            key={day}
            day={day}
            year={year}
            month={month}
            bookings={bookingsByDate[`${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`] ?? []}
            selected={selectedDate === `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`}
            today={todayDate === `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`}
            onSelect={onSelectDate}
          />
        )
      ))}
    </div>
  )
}

export default CalendarGrid
