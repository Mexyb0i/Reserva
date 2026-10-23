import { useCallback } from 'react'
import AsyncState from '../components/ui/AsyncState'
import Badge from '../components/ui/Badge'
import Card from '../components/ui/Card'
import PageHeading from '../components/ui/PageHeading'
import StatCard from '../components/ui/StatCard'
import Table from '../components/ui/Table'
import useAsyncResource from '../hooks/useAsyncResource'
import { adminService } from '../services/adminService'

function AdminReportsPage() {
  const loader = useCallback(() => adminService.getReports(), [])
  const { data, isLoading, error, reload } = useAsyncResource(loader)
  const maxCount = Math.max(1, ...(data?.facilitiesBySport.map((item) => item.count) ?? [1]))
  const columns = [
    { key: 'id', label: 'Application ID', className: 'whitespace-nowrap font-semibold' },
    { key: 'business', label: 'Business', render: (application) => application.business.name },
    { key: 'facility', label: 'Facility', render: (application) => application.facility.name },
    { key: 'status', label: 'Status', render: (application) => <Badge tone={application.status === 'Approved' ? 'success' : application.status === 'Needs changes' ? 'danger' : 'pending'}>{application.status}</Badge> },
  ]

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <PageHeading title="Reports" description="Platform overview for user accounts, facilities, and registration activity." />
      <AsyncState loading={isLoading} error={error} onRetry={reload} />
      {data ? (
        <>
          <section aria-label="Platform report totals" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {data.totals.map((item) => <StatCard key={item.label} label={item.label} value={item.value} />)}
          </section>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <h2 className="text-sm font-bold">Facilities by sport</h2>
              <p className="mt-1 text-xs text-muted">Current platform listing distribution.</p>
              <ul className="mt-4 space-y-3">
                {data.facilitiesBySport.map((item) => (
                  <li key={item.sport}>
                    <div className="mb-1 flex items-center justify-between text-xs"><span>{item.sport}</span><span className="font-semibold">{item.count}</span></div>
                    <div className="h-2 overflow-hidden rounded-full bg-bg"><div className="h-full rounded-full bg-accent" style={{ width: `${(item.count / maxCount) * 100}%` }} /></div>
                  </li>
                ))}
                {!data.facilitiesBySport.length ? <li className="text-xs text-muted">No facility data available.</li> : null}
              </ul>
            </Card>
            <Card>
              <h2 className="text-sm font-bold">Registration activity</h2>
              <p className="mt-1 text-xs text-muted">Status of submitted facility applications.</p>
              <div className="mt-4 space-y-2">
                {['Pending review', 'Approved', 'Needs changes'].map((status) => {
                  const count = data.applications.filter((application) => application.status === status).length
                  return <div key={status} className="flex items-center justify-between rounded border border-border bg-bg px-3 py-2"><span className="text-xs">{status}</span><Badge tone={status === 'Approved' ? 'success' : status === 'Needs changes' ? 'danger' : 'pending'}>{count}</Badge></div>
                })}
              </div>
            </Card>
          </div>
          <Card padded={false}>
            <div className="border-b border-border px-4 py-3"><h2 className="text-sm font-bold">Facility registration report</h2></div>
            <Table columns={columns} rows={data.applications} rowKey="id" emptyMessage="No application records." caption="Facility registration report" />
          </Card>
          <p className="text-[10px] leading-4 text-muted">Report values are mock data for this frontend prototype.</p>
        </>
      ) : null}
    </div>
  )
}

export default AdminReportsPage
