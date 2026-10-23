import { useCallback } from 'react'
import { Link } from 'react-router-dom'
import AsyncState from '../components/ui/AsyncState'
import Badge from '../components/ui/Badge'
import Card from '../components/ui/Card'
import PageHeading from '../components/ui/PageHeading'
import StatCard from '../components/ui/StatCard'
import Table from '../components/ui/Table'
import useAsyncResource from '../hooks/useAsyncResource'
import { ownerService } from '../services/ownerService'

function OwnerDashboardPage() {
  const loader = useCallback(() => ownerService.getDashboard(), [])
  const { data, isLoading, error, reload } = useAsyncResource(loader)
  const requests = data?.requests ?? []
  const columns = [
    { key: 'customer', label: 'Customer' },
    { key: 'facility', label: 'Facility' },
    { key: 'date', label: 'Date' },
    { key: 'time', label: 'Time' },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <Badge tone={row.status === 'Confirmed' ? 'success' : row.status === 'Pending' ? 'pending' : 'danger'}>{row.status}</Badge>,
    },
    { key: 'total', label: 'Total', className: 'text-right font-semibold text-accent' },
  ]

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <PageHeading title="Owner Overview" description="A quick view of your facilities and booking activity." />
      <AsyncState loading={isLoading} error={error} onRetry={reload} />
      {data ? (
        <>
          <section aria-label="Facility business statistics" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {data.stats.map((stat) => (
              <StatCard key={stat.label} label={stat.label} value={stat.value} detail={stat.detail} />
            ))}
          </section>
          <Card padded={false}>
            <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
              <div>
                <h2 className="text-sm font-bold">Recent reservations</h2>
                <p className="mt-1 text-xs text-muted">Review booking activity across your facilities.</p>
              </div>
              <Link to="/owner/requests" className="text-xs font-semibold text-success hover:underline">Manage requests</Link>
            </div>
            <Table
              columns={columns}
              rows={requests}
              rowKey="id"
              emptyMessage="No reservation activity yet."
              caption="Recent reservations"
            />
          </Card>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { title: 'Update facility listings', text: 'Keep your facility name, sport, rate, and listing status current.', to: '/owner/facilities', action: 'Manage facilities' },
              { title: 'Review booking requests', text: 'Confirm or decline reservations waiting for your response.', to: '/owner/requests', action: 'View requests' },
              { title: 'Set availability', text: 'Open or close time slots so players see current availability.', to: '/owner/availability', action: 'Manage schedule' },
            ].map((item) => (
              <Card key={item.to}>
                <h2 className="text-sm font-bold">{item.title}</h2>
                <p className="mt-2 min-h-10 text-xs leading-5 text-muted">{item.text}</p>
                <Link to={item.to} className="mt-3 inline-block text-xs font-semibold text-accent hover:underline">{item.action}</Link>
              </Card>
            ))}
          </div>
        </>
      ) : null}
    </div>
  )
}

export default OwnerDashboardPage
