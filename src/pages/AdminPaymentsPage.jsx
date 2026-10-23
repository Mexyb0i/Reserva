import { useCallback, useMemo, useState } from 'react'
import AsyncState from '../components/ui/AsyncState'
import Badge from '../components/ui/Badge'
import PageHeading from '../components/ui/PageHeading'
import Table from '../components/ui/Table'
import useAsyncResource from '../hooks/useAsyncResource'
import { adminService } from '../services/adminService'
import { formatPHP } from '../utils/fees'

const EMPTY_PAYMENTS = []

function AdminPaymentsPage() {
  const loader = useCallback(() => adminService.getPayments(), [])
  const { data, isLoading, error, reload } = useAsyncResource(loader)
  const [query, setQuery] = useState('')
  const payments = data ?? EMPTY_PAYMENTS
  const visiblePayments = useMemo(() => {
    const term = query.trim().toLowerCase()
    return term ? payments.filter((payment) => `${payment.id} ${payment.customer} ${payment.facility} ${payment.method}`.toLowerCase().includes(term)) : payments
  }, [payments, query])
  const columns = [
    { key: 'id', label: 'Payment ID', className: 'whitespace-nowrap font-semibold' },
    { key: 'customer', label: 'Customer' },
    { key: 'facility', label: 'Facility' },
    { key: 'date', label: 'Date', className: 'whitespace-nowrap' },
    { key: 'method', label: 'Method' },
    { key: 'amount', label: 'Amount', className: 'whitespace-nowrap text-right font-semibold text-accent', render: (payment) => formatPHP(payment.amount) },
    { key: 'status', label: 'Status', render: (payment) => <Badge tone={payment.status === 'Paid' ? 'success' : payment.status === 'Refunded' ? 'danger' : 'pending'}>{payment.status}</Badge> },
  ]

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <PageHeading title="Payment Records" description="View payment activity recorded for facility reservations." />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <p className="text-xs text-muted">{payments.length} payment records</p>
        <label className="block w-full sm:w-72"><span className="mb-1.5 block text-xs font-medium text-muted">Search payments</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Payment, customer, or facility" className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent" /></label>
      </div>
      <AsyncState loading={isLoading} error={error} onRetry={reload} empty={!isLoading && !error && !visiblePayments.length} emptyMessage={query ? 'No payments match your search.' : 'No payment records yet.'} />
      {!isLoading && !error && visiblePayments.length ? <Table columns={columns} rows={visiblePayments} rowKey="id" caption="Facility reservation payments" /> : null}
      <p className="text-[10px] leading-4 text-muted">Payment records are mock data. Payment processing and reconciliation require backend support.</p>
    </div>
  )
}

export default AdminPaymentsPage
