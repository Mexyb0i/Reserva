import { SPORT_COLORS } from '../../data/calendarData'

function DayCell({ day, year, month, bookings, selected, today, onSelect }) {
  const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  const visibleBookings = bookings.filter((booking) => ['Confirmed', 'Pending'].includes(booking.status))
  const visibleDots = visibleBookings.slice(0, 4)
  const overflow = Math.max(0, visibleBookings.length - 4)
  const mobileOverflow = Math.max(0, visibleBookings.length - 3)
  const monthName = new Date(year, month, day).toLocaleDateString('en-US', { month: 'long' })
  const label = `${monthName} ${day}, ${visibleBookings.length} ${visibleBookings.length === 1 ? 'booking' : 'bookings'}`

  return (
    <button
      type="button"
      role="gridcell"
      aria-label={label}
      aria-pressed={selected}
      aria-current={today ? 'date' : undefined}
      onClick={() => onSelect(date)}
      className={`relative flex aspect-square min-h-9 flex-col items-start justify-between rounded-md border p-1.5 text-left text-xs transition-colors focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:p-2 ${
        selected
          ? 'border-success bg-success/10'
          : today
            ? 'border-accent bg-accent/5'
            : 'border-border bg-bg hover:border-muted'
      }`}
    >
      <span className={`text-[11px] ${today || selected ? 'font-bold text-text' : 'text-muted'}`}>{day}</span>
      <span className="flex min-h-2 flex-wrap items-center gap-1" aria-hidden="true">
        {visibleDots.map((booking, index) => (
          <span
            key={`${booking.sport}-${index}`}
            className={`h-1.5 w-1.5 rounded-full md:h-2 md:w-2 ${index === 3 ? 'hidden md:inline-block' : ''}`}
            style={{ backgroundColor: SPORT_COLORS[booking.sport] ?? 'var(--color-muted)' }}
          />
        ))}
        {mobileOverflow > 0 ? (
          <span className="text-[9px] leading-none text-muted md:hidden">+{mobileOverflow}</span>
        ) : null}
        {overflow > 0 ? <span className="hidden text-[9px] leading-none text-muted md:inline">+{overflow}</span> : null}
      </span>
    </button>
  )
}

export default DayCell
