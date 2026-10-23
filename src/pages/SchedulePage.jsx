import { useCallback, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import AsyncState from '../components/ui/AsyncState'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import PageHeading from '../components/ui/PageHeading'
import Select from '../components/ui/Select'
import TimeSlot from '../components/ui/TimeSlot'
import useAsyncResource from '../hooks/useAsyncResource'
import { facilityService } from '../services/facilityService'
import { reservationService } from '../services/reservationService'
import { formatTimeRange, timeToMinutes } from '../utils/bookingTime'

function SchedulePage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const facilityId = Number(searchParams.get('facility') || 1)
  const [date, setDate] = useState('2026-10-24')
  const [time, setTime] = useState('')
  const [duration, setDuration] = useState('2')
  const [quantity, setQuantity] = useState('1')
  const [submitError, setSubmitError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const loader = useCallback(async () => {
    const [facility, slots] = await Promise.all([
      facilityService.getFacilityById(facilityId),
      reservationService.getSchedule(facilityId, date, duration, quantity),
    ])
    if (!facility) throw new Error('The selected facility could not be found.')
    return { facility, slots }
  }, [facilityId, date, duration, quantity])
  const { data, isLoading, error, reload } = useAsyncResource(loader)
  const timeRange = time ? formatTimeRange(time, duration) : null
  const selectedSlot = data?.slots.find((slot) => slot.label === time)
  const maxCourts = data?.facility.courtCount ?? 1
  const selectedStartMinutes = time ? timeToMinutes(time) : null
  const selectedEndMinutes = selectedStartMinutes === null
    ? null
    : selectedStartMinutes + Number(duration) * 60
  const isSlotInSelectedRange = (slotLabel) => {
    const slotStartMinutes = timeToMinutes(slotLabel)
    return selectedSlot?.status === 'available' &&
      selectedStartMinutes !== null &&
      slotStartMinutes >= selectedStartMinutes &&
      slotStartMinutes < selectedEndMinutes
  }

  async function continueBooking() {
    setSubmitError('')
    if (selectedSlot?.status === 'taken') {
      setSubmitError('This time overlaps an existing booking. Choose another start time or duration.')
      return
    }
    setIsSaving(true)
    try {
      const courtRate = Number(data.facility.price.replace(/[^\d.]/g, '')) *
        Number(duration) *
        Number(quantity)
      await reservationService.saveBookingDraft({
        facilityId,
        facilityName: data.facility.name,
        hourlyRate: Number(data.facility.price.replace(/[^\d.]/g, '')),
        courtRate,
        date,
        time,
        endTime: timeRange.endTime,
        duration: Number(duration),
        quantity: Number(quantity),
        total: courtRate,
      })
      navigate('/confirm-booking')
    } catch (saveError) {
      setSubmitError(saveError instanceof Error ? saveError.message : 'Unable to save your selection.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <PageHeading title="Choose a Schedule" description="Pick a date, time, and booking duration." />
      <AsyncState loading={isLoading} error={error} onRetry={reload} />
      {data ? (
        <>
          <Card className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs text-muted">Selected facility</p>
              <h2 className="mt-1 text-base font-bold">{data.facility.name}</h2>
              <p className="mt-1 text-xs text-muted">{data.facility.sport} · {data.facility.price}</p>
            </div>
            <label className="block min-w-48">
              <span className="mb-1.5 block text-xs font-medium text-muted">Reservation date</span>
              <input
                type="date"
                min="2026-10-22"
                value={date}
                onChange={(event) => {
                  setDate(event.target.value)
                  setTime('')
                }}
                className="h-10 w-full rounded-md border border-border bg-bg px-3 text-sm text-text"
              />
            </label>
          </Card>
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold">Available time slots</h2>
                <p className="mt-1 text-xs text-muted">Each slot shows a one-hour block. Choose its start hour.</p>
              </div>
              <div className="flex flex-wrap gap-3 text-[11px] text-muted">
                <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-success" />Available</span>
                <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-accent" />Selected</span>
                <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-danger" />Taken for this duration</span>
              </div>
            </div>
            {data.slots.length ? (
              <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
                {data.slots.map((slot) => (
                  <TimeSlot
                    key={slot.label}
                    availability={isSlotInSelectedRange(slot.label) ? 'selected' : slot.status === 'taken' ? 'taken' : 'available'}
                    aria-label={`${formatTimeRange(slot.label, 1).label}${isSlotInSelectedRange(slot.label) ? slot.label === time ? ', selected booking start' : ', selected booking time' : ''}`}
                    onClick={() => setTime(slot.label)}
                  >
                    {formatTimeRange(slot.label, 1).label.replace(/:00/g, '')}
                  </TimeSlot>
                ))}
              </div>
            ) : (
              <p className="mt-5 text-sm text-muted">No time slots are available for this date.</p>
            )}
          </Card>
          <Card>
            <div className="grid gap-3 sm:grid-cols-2">
              <Select
                label="Duration"
                value={duration}
                onChange={(event) => {
                  setDuration(event.target.value)
                  setSubmitError('')
                }}
                options={['1', '2', '3', '4'].map((value) => ({ value, label: `${value} ${value === '1' ? 'hour' : 'hours'}` }))}
              />
              <Select
                label="Number of courts"
                value={quantity}
                onChange={(event) => {
                  setQuantity(event.target.value)
                  setSubmitError('')
                }}
                options={Array.from({ length: maxCourts }, (_, index) => String(index + 1))}
              />
            </div>
            {timeRange ? (
              <p className="mt-3 rounded-md border border-border bg-bg px-3 py-2 text-sm text-muted">
                Booking time: <span className="font-semibold text-text">{timeRange.label}</span>
              </p>
            ) : null}
            {time && selectedSlot?.status === 'taken' ? (
              <p role="alert" className="mt-3 text-sm text-danger">
                This time does not have enough courts available for the selected duration.
              </p>
            ) : null}
            {submitError ? <p role="alert" className="mt-3 text-sm text-danger">{submitError}</p> : null}
            <div className="mt-4 flex flex-wrap justify-between gap-2 border-t border-border pt-4">
              <Link
                to="/sports-facilities"
                className="inline-flex items-center justify-center rounded-md border border-border bg-surface px-3 py-2 text-sm font-semibold text-text transition-colors hover:brightness-110"
              >
                Back
              </Link>
              <Button disabled={!time || selectedSlot?.status === 'taken' || isLoading || isSaving} onClick={continueBooking}>
                {isSaving ? 'Saving…' : 'Next'}
              </Button>
            </div>
          </Card>
        </>
      ) : null}
    </div>
  )
}

export default SchedulePage
