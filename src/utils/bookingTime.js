export function timeToMinutes(time) {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

export function formatTime(time) {
  const [hours, minutes] = time.split(':').map(Number)
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHour = hours % 12 || 12
  return `${displayHour}:${String(minutes).padStart(2, '0')} ${period}`
}

export function formatTimeRange(startTime, durationHours) {
  const endMinutes = timeToMinutes(startTime) + Number(durationHours) * 60
  const endHour = Math.floor(endMinutes / 60) % 24
  const endMinute = endMinutes % 60
  const endTime = `${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}`
  return {
    endTime,
    label: `${formatTime(startTime)} – ${formatTime(endTime)}`,
  }
}

export function intervalsOverlap(firstStart, firstEnd, secondStart, secondEnd) {
  return timeToMinutes(firstStart) < timeToMinutes(secondEnd) &&
    timeToMinutes(firstEnd) > timeToMinutes(secondStart)
}
