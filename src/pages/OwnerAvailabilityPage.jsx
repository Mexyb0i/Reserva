import { useCallback, useState } from 'react'
import AsyncState from '../components/ui/AsyncState'
import Card from '../components/ui/Card'
import PageHeading from '../components/ui/PageHeading'
import Select from '../components/ui/Select'
import useAsyncResource from '../hooks/useAsyncResource'
import { ownerService } from '../services/ownerService'

function OwnerAvailabilityPage() {
  const [selectedDate, setSelectedDate] = useState('2026-10-24')
  const [selectedFacilityId, setSelectedFacilityId] = useState('1')
  const [selectedCourts, setSelectedCourts] = useState([1])
  const [slotError, setSlotError] = useState('')
  const [savingSlot, setSavingSlot] = useState('')
  const loader = useCallback(async () => {
    const facilities = await ownerService.getFacilities()
    const activeFacilities = facilities.filter((facility) => facility.active)
    const selectedFacility = activeFacilities.find((facility) => String(facility.id) === selectedFacilityId)
    if (!selectedFacility) return { facilities: activeFacilities, availability: null }
    const availability = await ownerService.getAvailability(selectedFacilityId, selectedDate)
    return { facilities: activeFacilities, selectedFacility, availability }
  }, [selectedDate, selectedFacilityId])
  const { data, isLoading, error, reload } = useAsyncResource(loader)
  const selectedFacility = data?.selectedFacility
  const availability = data?.availability
  const courtCount = availability?.courtCount ?? 0
  const courts = availability?.courts ?? []
  const slots = courts[0]?.slots ?? []
  const selectedCourtData = courts.filter((court) => selectedCourts.includes(court.courtNumber))
  const totalSelectedSlots = slots.length * selectedCourtData.length
  const openSlotCount = selectedCourtData.reduce(
    (total, court) => total + court.slots.filter((slot) => slot.status !== 'taken').length,
    0,
  )

  function selectFacility(facilityId) {
    const facility = data.facilities.find((item) => String(item.id) === facilityId)
    setSelectedFacilityId(facilityId)
    setSelectedCourts(facility ? [1] : [])
    setSlotError('')
  }

  function toggleCourtSelection(courtNumber) {
    setSelectedCourts((current) =>
      current.includes(courtNumber)
        ? current.filter((number) => number !== courtNumber)
        : [...current, courtNumber].sort((first, second) => first - second),
    )
    setSlotError('')
  }

  async function toggleSlot(slot) {
    if (!selectedCourts.length) {
      setSlotError('Select at least one court to update its schedule.')
      return
    }
    setSlotError('')
    setSavingSlot(slot.label)
    const selectedSlots = selectedCourtData.map((court) =>
      court.slots.find((courtSlot) => courtSlot.label === slot.label),
    )
    const allBlocked = selectedSlots.every((courtSlot) => courtSlot?.status === 'taken')
    const nextStatus = allBlocked ? 'available' : 'taken'
    try {
      await Promise.all(selectedCourts.map((courtNumber) =>
        ownerService.updateAvailability(
          selectedFacilityId,
          selectedDate,
          courtNumber,
          slot.label,
          nextStatus,
        ),
      ))
      reload()
    } catch (updateError) {
      setSlotError(updateError instanceof Error ? updateError.message : 'Availability could not be updated.')
    } finally {
      setSavingSlot('')
    }
  }

  function refresh() {
    reload()
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <PageHeading title="Availability" description="Assign schedules and maintenance blocks to individual courts." />
      <AsyncState loading={isLoading} error={error} onRetry={refresh} />
      {data ? (
        data.facilities.length && selectedFacility && availability ? (
          <>
            <Card className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <Select
                  label="Facility"
                  value={selectedFacilityId}
                  onChange={(event) => selectFacility(event.target.value)}
                  options={data.facilities.map((facility) => ({
                    value: String(facility.id),
                    label: `${facility.name} · ${facility.sport}`,
                  }))}
                />
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-muted">Schedule date</span>
                  <input
                    type="date"
                    min="2026-10-22"
                    value={selectedDate}
                    onChange={(event) => {
                      setSelectedDate(event.target.value)
                      setSlotError('')
                    }}
                    className="h-10 w-full rounded-md border border-border bg-bg px-3 text-sm text-text"
                  />
                </label>
              </div>
              <div className="border-t border-border pt-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-bold">Select courts to manage</h2>
                    <p className="mt-1 text-xs text-muted">
                      You can select multiple courts to apply the same maintenance block.
                    </p>
                  </div>
                  <p className="text-right text-xs text-muted">
                    Available court slots
                    <span className="ml-2 text-base font-bold text-success">
                      {openSlotCount}<span className="text-xs font-medium text-muted"> / {totalSelectedSlots}</span>
                    </span>
                  </p>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {Array.from({ length: courtCount }, (_, index) => {
                    const courtNumber = index + 1
                    const selected = selectedCourts.includes(courtNumber)
                    return (
                      <button
                        key={courtNumber}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => toggleCourtSelection(courtNumber)}
                        className={`rounded-md border px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                          selected
                            ? 'border-success bg-success/10 text-success'
                            : 'border-border bg-bg text-muted hover:bg-sidebar hover:text-text'
                        }`}
                      >
                        Court {courtNumber}
                      </button>
                    )
                  })}
                </div>
                {!selectedCourts.length ? (
                  <p className="mt-2 text-xs text-accent">Select at least one court before changing availability.</p>
                ) : null}
              </div>
            </Card>
            <Card>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-bold">Daily schedule · {selectedFacility.name}</h2>
                  <p className="mt-1 text-xs text-muted">
                    {selectedCourts.length
                      ? `Click a time to toggle it for ${selectedCourts.length === courtCount ? 'all courts' : `Court${selectedCourts.length > 1 ? 's' : ''} ${selectedCourts.join(', ')}`}.`
                      : 'Select a court above to manage its availability.'}
                  </p>
                </div>
                <div className="flex gap-3 text-[11px] text-muted">
                  <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-success" />Available</span>
                  <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-danger" />Maintenance / blocked</span>
                  <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-accent" />Partial</span>
                </div>
              </div>
              {slotError ? <p role="alert" className="mt-3 text-sm text-danger">{slotError}</p> : null}
              {slots.length ? (
                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                  {slots.map((slot) => {
                    const blockedCount = selectedCourtData.filter((court) =>
                      court.slots.find((courtSlot) => courtSlot.label === slot.label)?.status === 'taken',
                    ).length
                    const blocked = selectedCourts.length > 0 && blockedCount === selectedCourts.length
                    const partial = blockedCount > 0 && blockedCount < selectedCourts.length
                    return (
                      <button
                        key={slot.label}
                        type="button"
                        aria-pressed={!blocked}
                        disabled={!selectedCourts.length || savingSlot === slot.label}
                        onClick={() => toggleSlot(slot)}
                        className={`flex min-h-14 items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                          blocked
                            ? 'border-danger/40 bg-danger/10 text-danger hover:bg-danger/20'
                            : partial
                              ? 'border-accent/40 bg-accent/10 text-accent hover:bg-accent/20'
                              : 'border-success/40 bg-success/10 text-success hover:bg-success/20'
                        }`}
                      >
                        <span>{slot.label}</span>
                        <span className="text-xs">
                          {savingSlot === slot.label
                            ? 'Saving…'
                            : blocked
                              ? 'Blocked'
                              : partial
                                ? `${blockedCount}/${selectedCourts.length} blocked`
                                : 'Open'}
                        </span>
                      </button>
                    )
                  })}
                </div>
              ) : (
                <p className="mt-5 text-sm text-muted">No time slots are configured.</p>
              )}
              <p className="mt-4 border-t border-border pt-3 text-xs text-muted">
                Schedule changes are stored separately for each court and date. Blocked times are unavailable to player bookings.
              </p>
            </Card>
          </>
        ) : (
          <Card className="py-8 text-center text-sm text-muted">
            No active facilities are assigned to this account.
          </Card>
        )
      ) : null}
    </div>
  )
}

export default OwnerAvailabilityPage
