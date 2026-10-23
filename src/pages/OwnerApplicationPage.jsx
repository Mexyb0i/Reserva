import { useCallback } from 'react'
import { Link } from 'react-router-dom'
import BrandLogo from '../components/BrandLogo'
import AsyncState from '../components/ui/AsyncState'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import useAsyncResource from '../hooks/useAsyncResource'
import { ownerService } from '../services/ownerService'

function OwnerApplicationPage() {
  const loader = useCallback(() => ownerService.getApplicationStatus(), [])
  const { data, isLoading, error, reload } = useAsyncResource(loader)

  return (
    <main className="min-h-screen bg-bg px-4 py-5 text-text sm:px-8 sm:py-8">
      <div className="mx-auto max-w-3xl">
        <header className="flex items-center justify-between gap-3">
          <BrandLogo className="brand-logo--large" />
          <Link to="/" className="text-xs font-semibold text-muted hover:text-text">Back to player site</Link>
        </header>
        <div className="mx-auto mt-12 max-w-xl">
          <AsyncState loading={isLoading} error={error} onRetry={reload} />
          {!isLoading && !error && !data ? (
            <Card className="text-center">
              <h1 className="text-xl font-bold">No application found</h1>
              <p className="mt-2 text-sm text-muted">Start an owner application to list your facility.</p>
              <Link to="/owner/register" className="mt-5 inline-flex">
                <Button>Start owner registration</Button>
              </Link>
            </Card>
          ) : null}
          {data ? <ApplicationStatus application={data} /> : null}
        </div>
      </div>
    </main>
  )
}

function ApplicationStatus({ application }) {
  const approved = application.status === 'Approved'
  const needsChanges = application.status === 'Needs changes'

  return (
    <Card className="p-5 sm:p-7">
      <div className={`grid h-12 w-12 place-items-center rounded-full text-lg font-bold ${approved ? 'bg-success/15 text-success' : needsChanges ? 'bg-danger/15 text-danger' : 'bg-accent/15 text-accent'}`}>
        {approved ? '✓' : needsChanges ? '!' : '…'}
      </div>
      <p className="mt-5 text-xs font-bold uppercase tracking-[.16em] text-muted">Facility owner application</p>
      <h1 className="mt-2 text-2xl font-bold">
        {approved ? 'Your facility is approved' : needsChanges ? 'A few details need your attention' : 'Your application is under review'}
      </h1>
      <p className="mt-2 text-sm leading-6 text-muted">
        {approved
          ? 'Your listing is ready. You can now manage facilities, bookings, and availability.'
          : needsChanges
            ? application.reviewNote ?? 'Please review the requested changes and update your application.'
            : 'Thanks for applying to list your facility on RESERVA. We’ll review your business and listing details before enabling owner tools.'}
      </p>
      <dl className="mt-5 divide-y divide-border rounded-md border border-border bg-bg px-3">
        <StatusRow label="Application ID" value={application.id} />
        <StatusRow label="Submitted" value={new Date(application.submittedAt).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })} />
        <StatusRow label="Business" value={application.business.name} />
        <StatusRow label="First facility" value={application.facility.name} />
        <StatusRow label="Status" value={application.status} />
      </dl>
      {application.status === 'Pending review' ? (
        <div className="mt-4 rounded-md border border-info/30 bg-info/10 p-3 text-xs leading-5 text-muted">
          Your owner dashboard stays locked while the application is pending. You can safely close this page; your application status is saved in this browser.
        </div>
      ) : null}
      <div className="mt-5 flex flex-wrap gap-2">
        {approved ? (
          <Link to="/owner/dashboard" className="inline-flex">
            <Button>Open owner dashboard</Button>
          </Link>
        ) : needsChanges ? (
          <Link to="/owner/register" className="inline-flex">
            <Button>Update application</Button>
          </Link>
        ) : null}
        <Link
          to="/"
          className="inline-flex items-center justify-center rounded-md border border-border bg-surface px-3 py-2 text-sm font-semibold text-text"
        >
          Back to player site
        </Link>
      </div>
      <p className="mt-5 text-[10px] leading-4 text-muted">
        This prototype uses local mock status. Application review, email verification, and business document checks require backend support.
      </p>
    </Card>
  )
}

function StatusRow({ label, value }) {
  return (
    <div className="flex flex-wrap justify-between gap-x-4 gap-y-1 py-2.5 text-xs">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right font-medium text-text">{value}</dd>
    </div>
  )
}

export default OwnerApplicationPage
