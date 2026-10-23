import { useCallback, useEffect, useState } from 'react'
import { reservationsService } from '../services/reservations'

function useCalendar(year, month, selectedDate) {
  const [monthState, setMonthState] = useState({ key: '', data: null, error: '', loading: true })
  const [scheduleState, setScheduleState] = useState({ date: '', data: null, error: '', loading: true })
  const [attempt, setAttempt] = useState(0)
  const monthKey = `${year}-${month}`

  const reload = useCallback(() => setAttempt((current) => current + 1), [])

  useEffect(() => {
    let active = true
    reservationsService.getCalendarMonth(year, month)
      .then((data) => {
        if (active) setMonthState({ key: monthKey, data, error: '', loading: false })
      })
      .catch((error) => {
        if (active) {
          setMonthState({
            key: monthKey,
            data: null,
            error: error instanceof Error ? error.message : 'Calendar bookings could not be loaded.',
            loading: false,
          })
        }
      })
    return () => {
      active = false
    }
  }, [attempt, month, monthKey, year])

  useEffect(() => {
    let active = true
    reservationsService.getScheduleByDate(selectedDate)
      .then((data) => {
        if (active) setScheduleState({ date: selectedDate, data, error: '', loading: false })
      })
      .catch((error) => {
        if (active) {
          setScheduleState({
            date: selectedDate,
            data: null,
            error: error instanceof Error ? error.message : 'The selected schedule could not be loaded.',
            loading: false,
          })
        }
      })
    return () => {
      active = false
    }
  }, [attempt, selectedDate])

  const isCurrentMonth = monthState.key === monthKey
  const isCurrentSchedule = scheduleState.date === selectedDate
  const isLoading = !isCurrentMonth || !isCurrentSchedule ||
    monthState.loading || scheduleState.loading
  const error = (isCurrentMonth ? monthState.error : '') ||
    (isCurrentSchedule ? scheduleState.error : '')

  return {
    bookingsByDate: isCurrentMonth ? monthState.data : null,
    schedule: isCurrentSchedule ? scheduleState.data : null,
    isLoading,
    error,
    reload,
  }
}

export default useCalendar
