import { useCallback, useState } from 'react'
import AsyncState from '../components/ui/AsyncState'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import PageHeading from '../components/ui/PageHeading'
import Table from '../components/ui/Table'
import useAsyncResource from '../hooks/useAsyncResource'
import { adminService } from '../services/adminService'

function AdminApplicationsPage() {
  const loader = useCallback(() => adminService.getApplications(), [])
  const { data, isLoading, error, reload } = useAsyncResource(loader)
  const [selected, setSelected] = useState(null)
  const [reviewNote, setReviewNote] = useState('')
  const [formError, setFormError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const applications = data ?? []
  const pendingCount = applications.filter((application) => application.status === 'Pending review').length

  async function review(status) {
    if (!selected) return
    setIsSaving(true)
    setFormError('')
    try {
      await adminService.reviewApplication(selected.id, status, reviewNote)
      setSelected(null)
      setReviewNote('')
      reload()
    } catch (saveError) {
      setFormError(saveError instanceof Error ? saveError.message : 'The application decision could not be saved.')
    } finally {
      setIsSaving(false)
    }
  }

  const columns = [
    { key: 'id', label: 'Application ID', className: 'whitespace-nowrap font-semibold' },
    { key: 'owner', label: 'Applicant', render: (application) => <div><p className="font-semibold">{application.owner.fullName}</p><p className="text-xs text-muted">{application.owner.email}</p></div> },
    { key: 'business', label: 'Business', render: (application) => application.business.name },
    { key: 'facility', label: 'First facility', render: (application) => application.facility.name },
    { key: 'submittedAt', label: 'Submitted', className: 'whitespace-nowrap', render: (application) => new Date(application.submittedAt).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }) },
    { key: 'status', label: 'Status', render: (application) => <Badge tone={application.status === 'Approved' ? 'success' : application.status === 'Needs changes' ? 'danger' : 'pending'}>{application.status}</Badge> },
    { key: 'actions', label: 'Review', render: (application) => <Button variant="secondary" className="px-2 py-1.5 text-xs" onClick={() => { setSelected(application); setReviewNote(application.reviewNote ?? ''); setFormError('') }}>View details</Button> },
  ]

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <PageHeading title="Facility Applications" description="Review owner and business details before approving new listings." />
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted">{pendingCount} applications awaiting review</p>
        <Badge tone="pending">{pendingCount} Pending</Badge>
      </div>
      <AsyncState loading={isLoading} error={error} onRetry={reload} empty={!isLoading && !error && !applications.length} emptyMessage="No facility applications have been submitted." />
      {!isLoading && !error && applications.length ? <Table columns={columns} rows={applications} rowKey="id" caption="Facility owner applications" /> : null}
      <Modal open={Boolean(selected)} onClose={() => setSelected(null)} title="Review facility application" className="max-h-[90vh] overflow-y-auto">
        {selected ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div><p className="text-xs text-muted">{selected.id}</p><h3 className="mt-1 text-lg font-bold">{selected.business.name}</h3></div>
              <Badge tone={selected.status === 'Approved' ? 'success' : selected.status === 'Needs changes' ? 'danger' : 'pending'}>{selected.status}</Badge>
            </div>
            <dl className="grid gap-2 rounded-md border border-border bg-bg p-3 text-xs sm:grid-cols-2">
              <Detail label="Applicant" value={selected.owner.fullName} />
              <Detail label="Email" value={selected.owner.email} />
              <Detail label="Owner phone" value={selected.owner.phone} />
              <Detail label="Business contact" value={selected.business.contact} />
              <Detail label="Business address" value={selected.business.address} />
              <Detail label="Relationship" value={selected.business.ownership} />
              <Detail label="Facility" value={selected.facility.name} />
              <Detail label="Sport" value={selected.facility.sport} />
              <Detail label="Courts / areas" value={selected.facility.courtCount} />
              <Detail label="Hourly rate" value={`₱${selected.facility.hourlyRate}`} />
              <Detail label="Operating hours" value={`${selected.facility.openingTime}–${selected.facility.closingTime}`} />
              <Detail label="Amenities" value={selected.facility.amenities?.join(', ') || 'None listed'} />
            </dl>
            {!selected.detailsComplete ? (
              <p role="alert" className="rounded border border-danger/30 bg-danger/10 p-3 text-xs leading-5 text-danger">
                Some registration details are missing. Request an updated application before approving this facility.
              </p>
            ) : null}
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-muted">Review note (required when requesting changes)</span>
              <textarea rows="3" value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent" placeholder="Explain what the applicant should update." />
            </label>
            {formError ? <p role="alert" className="text-sm text-danger">{formError}</p> : null}
            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="secondary" onClick={() => setSelected(null)}>Close</Button>
              <Button variant="danger" disabled={isSaving || selected.status === 'Needs changes'} onClick={() => review('Needs changes')}>{isSaving ? 'Saving…' : 'Request changes'}</Button>
              <Button disabled={isSaving || selected.status === 'Approved' || !selected.detailsComplete} onClick={() => review('Approved')}>{isSaving ? 'Saving…' : 'Approve facility'}</Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  )
}

function Detail({ label, value }) {
  return <div><dt className="text-muted">{label}</dt><dd className="mt-1 font-medium text-text">{value}</dd></div>
}

export default AdminApplicationsPage
