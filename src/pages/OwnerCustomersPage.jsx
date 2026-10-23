import { useCallback, useMemo, useState } from 'react'
import AsyncState from '../components/ui/AsyncState'
import PageHeading from '../components/ui/PageHeading'
import Table from '../components/ui/Table'
import useAsyncResource from '../hooks/useAsyncResource'
import { ownerService } from '../services/ownerService'

const EMPTY_CUSTOMERS = []

function OwnerCustomersPage() {
  const loader = useCallback(() => ownerService.getCustomers(), [])
  const { data, isLoading, error, reload } = useAsyncResource(loader)
  const [query, setQuery] = useState('')
  const customers = data ?? EMPTY_CUSTOMERS
  const filteredCustomers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) return customers
    return customers.filter((customer) =>
      `${customer.name} ${customer.email}`.toLowerCase().includes(normalizedQuery),
    )
  }, [customers, query])

  const columns = [
    { key: 'name', label: 'Name', className: 'whitespace-nowrap font-semibold' },
    { key: 'email', label: 'Email' },
    { key: 'totalBookings', label: 'Total bookings', className: 'text-center' },
    { key: 'lastBooking', label: 'Last booking', className: 'whitespace-nowrap' },
  ]

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <PageHeading
        title="Customer Info"
        description="View customers who have booked through the website and their booking activity."
      />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <p className="text-xs text-muted">{customers.length} customers</p>
        <label className="block w-full sm:w-72">
          <span className="mb-1.5 block text-xs font-medium text-muted">Search customers</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name or email"
            className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          />
        </label>
      </div>
      <AsyncState
        loading={isLoading}
        error={error}
        onRetry={reload}
        empty={!isLoading && !error && filteredCustomers.length === 0}
        emptyMessage={query ? 'No customers match your search.' : 'No customers with website bookings yet.'}
      />
      {!isLoading && !error && filteredCustomers.length ? (
        <Table
          columns={columns}
          rows={filteredCustomers}
          rowKey="id"
          caption="Customers with website bookings"
        />
      ) : null}
    </div>
  )
}

export default OwnerCustomersPage
