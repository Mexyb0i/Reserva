import { useCallback } from 'react'
import { Link } from 'react-router-dom'
import AsyncState from '../components/ui/AsyncState'
import Badge from '../components/ui/Badge'
import Card from '../components/ui/Card'
import PageHeading from '../components/ui/PageHeading'
import StatCard from '../components/ui/StatCard'
import Table from '../components/ui/Table'
import useAsyncResource from '../hooks/useAsyncResource'
import { adminService } from '../services/adminService'

function AdminDashboardPage() {
  const loader = useCallback(() => adminService.getDashboard(), [])
  const { data, isLoading, error, reload } = useAsyncResource(loader)
  const columns = [
    { key: 'id', label: 'Application ID', className: 'whitespace-nowrap font-semibold' },
    { key: 'owner', label: 'Applicant', render: (application) => application.owner.fullName },
    { key: 'business', label: 'Business', render: (application) => application.business.name },
    { key: 'facility', label: 'Facility', render: (application) => application.facility.name },
    { key: 'submittedAt', label: 'Submitted', render: (application) => new Date(application.submittedAt).toLocaleDateString('en-PH') },
    { key: 'status', label: 'Status', render: (application) => <Badge tone={application.status === 'Approved' ? 'success' : application.status === 'Needs changes' ? 'danger' : 'pending'}>{application.status}</Badge> },
  ]

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <PageHeading title="Admin Dashboard" description="Monitor facility registrations and manage the RESERVA platform." />
      <AsyncState loading={isLoading} error={error} onRetry={reload} />
      {data ? (
        <>
          <section aria-label="Platform statistics" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {data.stats.map((stat) => <StatCard key={stat.label} label={stat.label} value={stat.value} detail={stat.detail} />)}
          </section>
          <Card padded={false}>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
              <div>
                <h2 className="text-sm font-bold">Facility registrations</h2>
                <p className="mt-1 text-xs text-muted">Latest applications from facility owners.</p>
              </div>
              <Link to="/admin/applications" className="text-xs font-semibold text-accent hover:underline">Review applications</Link>
            </div>
            <Table columns={columns} rows={data.applications} rowKey="id" emptyMessage="No facility applications yet." caption="Latest facility applications" />
          </Card>
          <section aria-label="Admin actions" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {[
              { title: 'Review facility applications', text: 'Verify submitted business details and approve new facility listings.', to: '/admin/applications', action: 'Open applications' },
              { title: 'Manage sports facilities', text: 'Update facility information and listing availability.', to: '/admin/facilities', action: 'Manage facilities' },
              { title: 'Manage user accounts', text: 'Review player and facility-owner accounts.', to: '/admin/users', action: 'View users' },
            ].map((item) => (
              <Card key={item.to}>
                <h2 className="text-sm font-bold">{item.title}</h2>
                <p className="mt-2 min-h-10 text-xs leading-5 text-muted">{item.text}</p>
                <Link to={item.to} className="mt-3 inline-block text-xs font-semibold text-accent hover:underline">{item.action}</Link>
              </Card>
            ))}
          </section>
        </>
      ) : null}
    </div>
  )
}

export default AdminDashboardPage
