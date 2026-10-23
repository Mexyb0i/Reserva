import { useCallback, useState } from 'react'
import AsyncState from '../components/ui/AsyncState'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Modal from '../components/ui/Modal'
import PageHeading from '../components/ui/PageHeading'
import useAsyncResource from '../hooks/useAsyncResource'
import { adminService } from '../services/adminService'

const EMPTY_FORM = { name: '', sport: 'Basketball', hourlyRate: '', courtCount: '1' }
const sports = ['Football', 'Basketball', 'Tennis', 'Badminton', 'Volleyball', 'Swimming']
const EMPTY_USERS = []

function AdminFacilitiesPage() {
  const loader = useCallback(() => adminService.getFacilities(), [])
  const usersLoader = useCallback(() => adminService.getUsers(), [])
  const { data, isLoading, error, reload } = useAsyncResource(loader)
  const { data: userData } = useAsyncResource(usersLoader)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState('')
  const [pageError, setPageError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [category, setCategory] = useState('All sports')
  const [ownerQuery, setOwnerQuery] = useState('')
  const facilities = data ?? []
  const ownerAccounts = (userData ?? EMPTY_USERS).filter((user) =>
    user.role === 'Facility owner' && user.status === 'Active',
  )
  const assignedOwners = facilities.filter((facility) => facility.owner).map((facility) => facility.owner)
  const ownerOptions = Array.from(new Map(
    [...ownerAccounts.map((owner) => ({ id: owner.id, name: owner.name, email: owner.email })), ...assignedOwners]
      .map((owner) => [owner.email, owner]),
  ).values())
  const normalizedOwnerQuery = ownerQuery.trim().toLowerCase()
  const visible = facilities.filter((facility) =>
    (category === 'All sports' || facility.sport === category) &&
    (!normalizedOwnerQuery ||
      `${facility.owner?.name ?? 'unassigned'} ${facility.owner?.email ?? ''}`.toLowerCase().includes(normalizedOwnerQuery)),
  )
  const groupedFacilities = visible.reduce((groups, facility) => {
    const key = facility.owner?.email ?? 'unassigned'
    if (!groups[key]) groups[key] = { owner: facility.owner, facilities: [] }
    groups[key].facilities.push(facility)
    return groups
  }, {})

  function openCreate() {
    setSelected('new')
    setForm({ ...EMPTY_FORM, ownerEmail: ownerAccounts[0]?.email ?? '' })
    setFormError('')
  }

  function openEdit(facility) {
    setSelected(facility)
    setForm({
      name: facility.name,
      sport: facility.sport,
      hourlyRate: facility.price.replace(/[^\d.]/g, ''),
      courtCount: String(facility.courtCount ?? 1),
      ownerEmail: facility.owner?.email ?? '',
    })
    setFormError('')
  }

  async function saveFacility(event) {
    event.preventDefault()
    const hourlyRate = Number(form.hourlyRate)
    const courtCount = Number(form.courtCount)
    if (!form.name.trim() || !form.sport || !form.ownerEmail || !Number.isFinite(hourlyRate) || hourlyRate <= 0 ||
      !Number.isInteger(courtCount) || courtCount < 1 || courtCount > 20) {
      setFormError('Choose an owner and enter a facility name, valid hourly rate, and 1–20 courts or playing areas.')
      return
    }
    setIsSaving(true)
    setFormError('')
    setPageError('')
    try {
      if (selected === 'new') {
        await adminService.createFacility({ ...form, hourlyRate, courtCount })
      } else {
        await adminService.updateFacility(selected.id, {
          name: form.name.trim(),
          sport: form.sport,
          price: `₱${new Intl.NumberFormat('en-PH').format(hourlyRate)}/hr`,
          courtCount,
          ownerEmail: form.ownerEmail,
        })
      }
      setSelected(null)
      reload()
    } catch (saveError) {
      setFormError(saveError instanceof Error ? saveError.message : 'Facility details could not be saved.')
    } finally {
      setIsSaving(false)
    }
  }

  async function toggleListing(facility) {
    setPageError('')
    try {
      await adminService.updateFacility(facility.id, { active: !facility.active })
      reload()
    } catch (updateError) {
      setPageError(updateError instanceof Error ? updateError.message : 'Facility status could not be updated.')
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <PageHeading title="Sports Facilities" description="Manage approved venue listings across the RESERVA platform." />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <p className="text-xs text-muted">{visible.length} of {facilities.length} facilities</p>
        <div className="flex w-full flex-wrap items-end gap-2 sm:w-auto">
          <label className="block min-w-40 flex-1 sm:flex-none">
            <span className="mb-1.5 block text-xs font-medium text-muted">Sport</span>
            <select value={category} onChange={(event) => setCategory(event.target.value)} className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text">
              <option>All sports</option>
              {sports.map((sport) => <option key={sport}>{sport}</option>)}
            </select>
          </label>
          <label className="block min-w-56 flex-1 sm:w-64 sm:flex-none">
            <span className="mb-1.5 block text-xs font-medium text-muted">Search owner</span>
            <input
              type="search"
              value={ownerQuery}
              onChange={(event) => setOwnerQuery(event.target.value)}
              placeholder="Name or email"
              className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            />
          </label>
          <Button onClick={openCreate}>Add facility</Button>
        </div>
      </div>
      {pageError ? <p role="alert" className="text-sm text-danger">{pageError}</p> : null}
      <AsyncState
        loading={isLoading}
        error={error}
        onRetry={reload}
        empty={!isLoading && !error && !visible.length}
        emptyMessage={normalizedOwnerQuery ? 'No facility owners match your search and sport filter.' : 'No facilities match this sport.'}
      />
      {!isLoading && !error && visible.length ? (
        <div className="space-y-5">
          {Object.entries(groupedFacilities).map(([ownerKey, group]) => (
            <section key={ownerKey} aria-labelledby={`owner-${ownerKey}`} className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2">
                <div>
                  <h2 id={`owner-${ownerKey}`} className="text-sm font-bold">{group.owner?.name ?? 'Unassigned facilities'}</h2>
                  {group.owner ? <p className="mt-1 text-xs text-muted">{group.owner.email}</p> : null}
                </div>
                <span className="text-xs text-muted">{group.facilities.length} {group.facilities.length === 1 ? 'facility' : 'facilities'}</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {group.facilities.map((facility) => (
                  <Card key={facility.id} className="overflow-hidden p-0">
                    <div className={`flex min-h-20 items-start justify-between gap-2 p-3 ${facility.color ?? 'bg-accent'}`}>
                      <div><h3 className="text-sm font-bold text-white">{facility.name}</h3><p className="mt-1 text-xs text-white/80">{facility.sport}</p></div>
                      <span className="rounded bg-bg/70 px-2 py-1 text-[10px] font-bold text-white">{facility.active ? 'ACTIVE' : 'PAUSED'}</span>
                    </div>
                    <div className="p-4">
                      <div className="grid grid-cols-2 gap-3 border-t border-border pt-3">
                        <div><p className="text-[10px] text-muted">Rate per hour</p><p className="mt-1 text-sm font-bold text-accent">{facility.price}</p></div>
                        <div><p className="text-[10px] text-muted">Courts / areas</p><p className="mt-1 text-sm font-semibold">{facility.courtCount ?? 1}</p></div>
                      </div>
                      <div className="mt-4 flex justify-end gap-2">
                        <Button variant="secondary" className="px-2 py-1.5 text-xs" onClick={() => toggleListing(facility)}>{facility.active ? 'Pause listing' : 'Activate listing'}</Button>
                        <Button className="px-2 py-1.5 text-xs" onClick={() => openEdit(facility)}>Edit</Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : null}
      <Modal open={Boolean(selected)} onClose={() => setSelected(null)} title={selected === 'new' ? 'Add Facility' : 'Edit Facility'}>
        <form onSubmit={saveFacility} className="space-y-3">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted">Owner account</span>
            <select required value={form.ownerEmail ?? ''} onChange={(event) => setForm({ ...form, ownerEmail: event.target.value })} className="h-10 w-full rounded-md border border-border bg-bg px-3 text-sm text-text">
              <option value="">Choose an active owner</option>
              {ownerOptions.map((owner) => (
                <option key={owner.email} value={owner.email} disabled={!ownerAccounts.some((account) => account.email === owner.email) && selected === 'new'}>
                  {owner.name} · {owner.email}
                </option>
              ))}
            </select>
            {!ownerAccounts.length && selected === 'new' ? <p className="mt-1 text-xs text-danger">There are no active facility-owner accounts available for assignment.</p> : null}
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted">Facility name</span>
            <input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="h-10 w-full rounded-md border border-border bg-bg px-3 text-sm text-text" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted">Sport</span>
            <select value={form.sport} onChange={(event) => setForm({ ...form, sport: event.target.value })} className="h-10 w-full rounded-md border border-border bg-bg px-3 text-sm text-text">
              {sports.map((sport) => <option key={sport}>{sport}</option>)}
            </select>
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-muted">Rate per hour (₱)</span>
              <input required type="number" min="1" step="1" value={form.hourlyRate} onChange={(event) => setForm({ ...form, hourlyRate: event.target.value })} className="h-10 w-full rounded-md border border-border bg-bg px-3 text-sm text-text" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-muted">Courts / areas</span>
              <input required type="number" min="1" max="20" step="1" value={form.courtCount} onChange={(event) => setForm({ ...form, courtCount: event.target.value })} className="h-10 w-full rounded-md border border-border bg-bg px-3 text-sm text-text" />
            </label>
          </div>
          {formError ? <p role="alert" className="text-sm text-danger">{formError}</p> : null}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setSelected(null)}>Cancel</Button>
            <Button type="submit" disabled={isSaving}>{isSaving ? 'Saving…' : 'Save facility'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default AdminFacilitiesPage
