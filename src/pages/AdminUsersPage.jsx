import { useCallback, useMemo, useState } from 'react'
import AsyncState from '../components/ui/AsyncState'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import PageHeading from '../components/ui/PageHeading'
import Table from '../components/ui/Table'
import useAsyncResource from '../hooks/useAsyncResource'
import { adminService } from '../services/adminService'

const EMPTY_USERS = []

function AdminUsersPage() {
  const loader = useCallback(() => adminService.getUsers(), [])
  const { data, isLoading, error, reload } = useAsyncResource(loader)
  const [query, setQuery] = useState('')
  const [actionError, setActionError] = useState('')
  const users = data ?? EMPTY_USERS
  const filteredUsers = useMemo(() => {
    const term = query.trim().toLowerCase()
    return term ? users.filter((user) => `${user.name} ${user.email} ${user.role}`.toLowerCase().includes(term)) : users
  }, [query, users])

  async function toggleStatus(user) {
    setActionError('')
    try {
      await adminService.updateUserStatus(user.id, user.status === 'Active' ? 'Suspended' : 'Active')
      reload()
    } catch (updateError) {
      setActionError(updateError instanceof Error ? updateError.message : 'The account status could not be updated.')
    }
  }

  const columns = [
    { key: 'name', label: 'User', className: 'whitespace-nowrap font-semibold' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role', render: (user) => <Badge tone={user.role === 'Facility owner' ? 'info' : 'neutral'}>{user.role}</Badge> },
    { key: 'joinedAt', label: 'Joined', className: 'whitespace-nowrap' },
    {
      key: 'cancellationCount',
      label: 'Owner cancellations',
      render: (user) => user.role === 'Facility owner' ? user.cancellationCount ?? 0 : '—',
    },
    { key: 'status', label: 'Status', render: (user) => <Badge tone={user.status === 'Active' ? 'success' : user.status === 'Pending' ? 'pending' : 'danger'}>{user.status}</Badge> },
    { key: 'actions', label: 'Account', render: (user) => <Button variant={user.status === 'Active' ? 'danger' : 'secondary'} className="px-2 py-1.5 text-xs" disabled={user.status === 'Pending'} onClick={() => toggleStatus(user)}>{user.status === 'Active' ? 'Suspend' : user.status === 'Pending' ? 'Awaiting approval' : 'Reactivate'}</Button> },
  ]

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <PageHeading title="User Management" description="Review RESERVA player and facility-owner accounts." />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <p className="text-xs text-muted">{users.length} registered users</p>
        <label className="block w-full sm:w-72">
          <span className="mb-1.5 block text-xs font-medium text-muted">Search users</span>
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, email, or role" className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent" />
        </label>
      </div>
      {actionError ? <p role="alert" className="text-sm text-danger">{actionError}</p> : null}
      <AsyncState loading={isLoading} error={error} onRetry={reload} empty={!isLoading && !error && !filteredUsers.length} emptyMessage={query ? 'No users match your search.' : 'No user accounts yet.'} />
      {!isLoading && !error && filteredUsers.length ? <Table columns={columns} rows={filteredUsers} rowKey="id" caption="RESERVA user accounts" /> : null}
    </div>
  )
}

export default AdminUsersPage
