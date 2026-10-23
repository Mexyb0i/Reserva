import { useMemo, useState } from 'react'
import AsyncState from '../components/ui/AsyncState'
import Card from '../components/ui/Card'
import PageHeading from '../components/ui/PageHeading'
import CalendarGrid from '../components/calendar/CalendarGrid'
import ScheduleList from '../components/calendar/ScheduleList'
import SportLegend from '../components/calendar/SportLegend'
import useCalendar from '../hooks/useCalendar'
import { buildMonthGrid, formatCalendarDate } from '../utils/calendar'

const TODAY = new Date()

function OwnerCalendarPage() {
  const initialToday = TODAY
  const [year, setYear] = useState(initialToday.getFullYear())
  const [month, setMonth] = useState(initialToday.getMonth())
  const [selectedDate, setSelectedDate] = useState(() =>
    formatCalendarDate(initialToday.getFullYear(), initialToday.getMonth(), initialToday.getDate()),
  )
  const { bookingsByDate, schedule, isLoading, error, reload } = useCalendar(year, month, selectedDate)
  const days = useMemo(() => buildMonthGrid(year, month), [year, month])
  const todayDate = formatCalendarDate(initialToday.getFullYear(), initialToday.getMonth(), initialToday.getDate())
  const selected = new Date(`${selectedDate}T00:00:00`)
  const selectedIsToday = selectedDate === todayDate
  const scheduleTitle = selectedIsToday
    ? "Today's Schedule"
    : `Schedule for ${selected.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`

  function changeMonth(offset) {
    const nextMonth = new Date(year, month + offset, 1)
    setYear(nextMonth.getFullYear())
    setMonth(nextMonth.getMonth())
  }

  function selectDate(date) {
    const selectedDay = new Date(`${date}T00:00:00`)
    setSelectedDate(date)
    if (selectedDay.getFullYear() !== year || selectedDay.getMonth() !== month) {
      setYear(selectedDay.getFullYear())
      setMonth(selectedDay.getMonth())
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <PageHeading
        title="Reservation Calendar"
        description="Visual monthly overview of all facility bookings"
      />
      <AsyncState loading={isLoading} error={error} onRetry={reload} />
      {!isLoading && !error && bookingsByDate ? (
        <>
          <div className="grid items-start gap-4 md:grid-cols-[minmax(0,1fr)_170px]">
            <Card className="rounded-lg p-4">
              <header className="mb-3 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => changeMonth(-1)}
                  aria-label="Previous month"
                  className="grid h-8 w-8 place-items-center rounded-md border border-border text-text hover:bg-sidebar focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <span aria-hidden="true">‹</span>
                </button>
                <h2 className="text-sm font-bold">
                  {new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h2>
                <button
                  type="button"
                  onClick={() => changeMonth(1)}
                  aria-label="Next month"
                  className="grid h-8 w-8 place-items-center rounded-md border border-border text-text hover:bg-sidebar focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <span aria-hidden="true">›</span>
                </button>
              </header>
              <div className="mb-3 border-t border-border" />
              <CalendarGrid
                year={year}
                month={month}
                days={days}
                bookingsByDate={bookingsByDate}
                selectedDate={selectedDate}
                todayDate={todayDate}
                onSelectDate={selectDate}
              />
            </Card>
            <Card className="rounded-lg p-4">
              <SportLegend />
            </Card>
          </div>
          <Card className="rounded-lg p-4">
            <header className="mb-2 border-b border-border pb-3">
              <h2 className="text-sm font-bold">{scheduleTitle}</h2>
            </header>
            <ScheduleList
              schedule={schedule ?? []}
              loading={schedule === null && !error}
              error={error}
              onRetry={reload}
            />
          </Card>
        </>
      ) : null}
    </div>
  )
}

export default OwnerCalendarPage
