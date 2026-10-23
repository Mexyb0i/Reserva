import Badge from '../ui/Badge'

function ScheduleList({ schedule, loading, error, onRetry }) {
  if (loading) {
    return <p role="status" className="py-5 text-center text-sm text-muted">Loading schedule…</p>
  }

  if (error) {
    return (
      <div role="alert" className="py-4">
        <p className="text-sm text-danger">{error}</p>
        <button type="button" onClick={onRetry} className="mt-2 text-xs font-semibold text-accent hover:underline">
          Try again
        </button>
      </div>
    )
  }

  if (!schedule.length) {
    return <p className="py-5 text-center text-sm text-muted">No bookings scheduled for this date.</p>
  }

  return (
    <ul className="divide-y divide-border">
      {schedule.map((booking) => (
        <li key={booking.id} className="flex items-center justify-between gap-3 py-3 first:pt-1 last:pb-1">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-text">{booking.user}</p>
            <p className="mt-1 truncate text-xs text-muted">
              {booking.facility} · {booking.start} - {booking.end}
            </p>
          </div>
          <Badge tone={booking.status === 'Confirmed' ? 'success' : booking.status === 'Pending' ? 'pending' : 'neutral'}>
            {booking.status}
          </Badge>
        </li>
      ))}
    </ul>
  )
}

export default ScheduleList
