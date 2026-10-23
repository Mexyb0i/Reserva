import { useCallback, useState } from 'react'
import AsyncState from '../components/ui/AsyncState'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Modal from '../components/ui/Modal'
import PageHeading from '../components/ui/PageHeading'
import useAsyncResource from '../hooks/useAsyncResource'
import { ownerService } from '../services/ownerService'

function OwnerFacilitiesPage() {
  const loader = useCallback(() => ownerService.getFacilities(), [])
  const { data, isLoading, error, reload } = useAsyncResource(loader)
  const [selected, setSelected] = useState(null)
  const [name, setName] = useState('')
  const [sport, setSport] = useState('')
  const [rate, setRate] = useState('')
  const [courtCount, setCourtCount] = useState('1')
  const [formError, setFormError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const facilities = data ?? []

  function openEdit(facility) {
    setSelected(facility)
    setName(facility.name)
    setSport(facility.sport)
    setRate(facility.price.replace(/[^\d.]/g, ''))
    setCourtCount(String(facility.courtCount ?? 1))
    setFormError('')
  }

  async function saveFacility(event) {
    event.preventDefault()
    const numericRate = Number(rate)
    const numericCourtCount = Number(courtCount)
    if (!name.trim() || !sport.trim() || !Number.isFinite(numericRate) || numericRate <= 0 ||
      !Number.isInteger(numericCourtCount) || numericCourtCount < 1 || numericCourtCount > 20) {
      setFormError('Enter a facility name, sport, valid rate, and a whole number of courts from 1 to 20.')
      return
    }
    setIsSaving(true)
    setFormError('')
    try {
      await ownerService.updateFacility(selected.id, {
        name: name.trim(),
        sport: sport.trim(),
        price: `₱${new Intl.NumberFormat('en-PH').format(numericRate)}/hr`,
        courtCount: numericCourtCount,
      })
      setSelected(null)
      reload()
    } catch (saveError) {
      setFormError(saveError instanceof Error ? saveError.message : 'Facility changes could not be saved.')
    } finally {
      setIsSaving(false)
    }
  }

  async function toggleListing(facility) {
    try {
      await ownerService.updateFacility(facility.id, { active: !facility.active })
      reload()
    } catch (updateError) {
      setFormError(updateError instanceof Error ? updateError.message : 'Listing status could not be updated.')
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <PageHeading title="Facilities" description="Manage the information players see when they browse your venues." />
      {formError && !selected ? <p role="alert" className="text-sm text-danger">{formError}</p> : null}
      <AsyncState loading={isLoading} error={error} onRetry={reload} empty={!isLoading && !error && !facilities.length} emptyMessage="No facilities are assigned to your account." />
      {!isLoading && !error && facilities.length ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {facilities.map((facility) => (
            <Card key={facility.id}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-sm font-bold">{facility.name}</h2>
                  <p className="mt-1 text-xs text-muted">{facility.sport}</p>
                  <p className="mt-1 text-xs text-muted">{facility.courtCount ?? 1} {facility.courtCount === 1 ? 'court' : 'courts'}</p>
                </div>
                <span className={`rounded px-2 py-1 text-[10px] font-bold ${facility.active ? 'bg-success/15 text-success' : 'bg-border/50 text-muted'}`}>
                  {facility.active ? 'ACTIVE' : 'PAUSED'}
                </span>
              </div>
              <div className="mt-4 flex items-end justify-between border-t border-border pt-3">
                <div>
                  <p className="text-[10px] text-muted">Hourly rate</p>
                  <p className="mt-1 text-sm font-bold text-accent">{facility.price}</p>
                  <p className="mt-1 text-xs text-success">{facility.availability} currently listed</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => toggleListing(facility)} className="px-2 py-1.5 text-xs">
                    {facility.active ? 'Pause' : 'Activate'}
                  </Button>
                  <Button onClick={() => openEdit(facility)} className="px-2 py-1.5 text-xs">Edit</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : null}
      <Modal open={Boolean(selected)} onClose={() => setSelected(null)} title="Edit Facility">
        {selected ? (
          <form onSubmit={saveFacility} className="space-y-3">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-muted">Facility name</span>
              <input value={name} onChange={(event) => setName(event.target.value)} className="h-10 w-full rounded-md border border-border bg-bg px-3 text-sm text-text" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-muted">Sport</span>
              <input value={sport} onChange={(event) => setSport(event.target.value)} className="h-10 w-full rounded-md border border-border bg-bg px-3 text-sm text-text" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-muted">Rate per hour (₱)</span>
              <input type="number" min="1" step="1" value={rate} onChange={(event) => setRate(event.target.value)} className="h-10 w-full rounded-md border border-border bg-bg px-3 text-sm text-text" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-muted">Number of courts</span>
              <input type="number" min="1" max="20" step="1" value={courtCount} onChange={(event) => setCourtCount(event.target.value)} className="h-10 w-full rounded-md border border-border bg-bg px-3 text-sm text-text" />
            </label>
            {formError ? <p role="alert" className="text-sm text-danger">{formError}</p> : null}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setSelected(null)}>Cancel</Button>
              <Button type="submit" disabled={isSaving}>{isSaving ? 'Saving…' : 'Save changes'}</Button>
            </div>
          </form>
        ) : null}
      </Modal>
    </div>
  )
}

export default OwnerFacilitiesPage
