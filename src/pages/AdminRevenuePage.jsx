import { useCallback, useMemo, useState } from 'react'
import AsyncState from '../components/ui/AsyncState'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import FeeBreakdown from '../components/payment/FeeBreakdown'
import Input from '../components/ui/Input'
import Modal from '../components/ui/Modal'
import PageHeading from '../components/ui/PageHeading'
import Select from '../components/ui/Select'
import StatCard from '../components/ui/StatCard'
import Table from '../components/ui/Table'
import useAsyncResource from '../hooks/useAsyncResource'
import { adminService } from '../services/adminService'
import { disputeService } from '../services/disputeService'
import { formatPHP } from '../utils/fees'

const EMPTY_ROWS = []
const payoutTone = { Requested: 'pending', Processing: 'info', Paid: 'success', Failed: 'danger' }
const disputeTone = { Open: 'pending', Resolved: 'success' }

function AdminRevenuePage() {
  const loader = useCallback(() => adminService.getRevenueDashboard(), [])
  const { data, isLoading, error, reload } = useAsyncResource(loader)
  const [ledgerType, setLedgerType] = useState('All')
  const [ledgerStatus, setLedgerStatus] = useState('All')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [selectedPayout, setSelectedPayout] = useState(null)
  const [payoutAction, setPayoutAction] = useState('')
  const [payoutNote, setPayoutNote] = useState('')
  const [selectedDispute, setSelectedDispute] = useState(null)
  const [disputeAction, setDisputeAction] = useState('')
  const [partialAmount, setPartialAmount] = useState('')
  const [disputeNote, setDisputeNote] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [actionError, setActionError] = useState('')
  const [notice, setNotice] = useState('')

  const ledger = data?.ledger ?? EMPTY_ROWS
  const visibleLedger = useMemo(
    () => ledger.filter((entry) => {
      if (ledgerType !== 'All' && entry.type !== ledgerType) return false
      if (ledgerStatus !== 'All' && entry.status !== ledgerStatus) return false
      const date = String(entry.date ?? '').slice(0, 10)
      if (fromDate && date < fromDate) return false
      if (toDate && date > toDate) return false
      return true
    }),
    [fromDate, ledger, ledgerStatus, ledgerType, toDate],
  )

  async function submitPayoutAction(event) {
    event.preventDefault()
    if (!selectedPayout || !payoutAction) return
    setIsSubmitting(true)
    setActionError('')
    try {
      await adminService.updatePayoutRequest(selectedPayout.id, payoutAction, payoutNote)
      setSelectedPayout(null)
      setPayoutNote('')
      setPayoutAction('')
      setNotice(payoutAction === 'approve'
        ? 'Payout approved and moved to processing.'
        : 'Payout rejected. The amount less its non-refundable fee has been returned to the owner balance.')
      reload()
    } catch (submitError) {
      setActionError(submitError instanceof Error ? submitError.message : 'Payout request could not be updated.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function submitDisputeAction(event) {
    event.preventDefault()
    if (!selectedDispute || !disputeAction) return
    const reservation = selectedDispute.reservation
    const amount = Number(partialAmount)
    if (disputeAction === 'partial-refund' &&
      (!Number.isFinite(amount) || amount <= 0 || amount > Number(reservation?.userTotal))) {
      setActionError(`Enter a refund greater than zero and no more than ${formatPHP(reservation?.userTotal ?? 0)}.`)
      return
    }
    setIsSubmitting(true)
    setActionError('')
    try {
      await disputeService.resolveDispute(selectedDispute.id, {
        action: disputeAction,
        amount: disputeAction === 'partial-refund' ? amount : undefined,
        note: disputeNote,
      })
      setSelectedDispute(null)
      setDisputeAction('')
      setPartialAmount('')
      setDisputeNote('')
      setNotice('Dispute resolution saved and added to the audit log.')
      reload()
    } catch (submitError) {
      setActionError(submitError instanceof Error ? submitError.message : 'Dispute could not be resolved.')
    } finally {
      setIsSubmitting(false)
    }
  }

  function openPayoutAction(payout, action) {
    setSelectedPayout(payout)
    setPayoutAction(action)
    setPayoutNote('')
    setActionError('')
  }

  function openDispute(dispute) {
    setSelectedDispute(dispute)
    setDisputeAction('')
    setPartialAmount('')
    setDisputeNote('')
    setActionError('')
  }

  const ledgerColumns = [
    {
      key: 'date',
      label: 'Date',
      render: (entry) => {
        const date = new Date(entry.date)
        return Number.isNaN(date.getTime()) ? entry.date : date.toLocaleDateString('en-PH')
      },
    },
    { key: 'type', label: 'Type' },
    { key: 'reference', label: 'Reference' },
    { key: 'owner', label: 'Owner' },
    { key: 'gross', label: 'Gross', className: 'text-right', render: (entry) => formatPHP(entry.gross) },
    { key: 'fees', label: 'Fees', className: 'text-right', render: (entry) => formatPHP(entry.fees) },
    { key: 'commission', label: 'Commission', className: 'text-right', render: (entry) => formatPHP(entry.commission) },
    { key: 'amount', label: 'Platform amount', className: 'text-right font-semibold', render: (entry) => formatPHP(entry.amount) },
    { key: 'status', label: 'Status', render: (entry) => <Badge tone={entry.status === 'Refunded' || entry.type === 'Refund' ? 'danger' : 'neutral'}>{entry.status}</Badge> },
  ]

  const payoutColumns = [
    { key: 'ownerId', label: 'Owner' },
    { key: 'requestedAt', label: 'Requested', render: (row) => new Date(row.requestedAt).toLocaleString('en-PH') },
    { key: 'amount', label: 'Amount', className: 'text-right', render: (row) => formatPHP(row.amount) },
    { key: 'fee', label: 'Fee', className: 'text-right', render: (row) => formatPHP(row.fee) },
    { key: 'net', label: 'Net', className: 'text-right font-semibold', render: (row) => formatPHP(row.net) },
    { key: 'destination', label: 'Destination' },
    { key: 'status', label: 'Status', render: (row) => <Badge tone={payoutTone[row.status] ?? 'neutral'}>{row.status}</Badge> },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => row.status === 'Requested' ? (
        <div className="flex gap-1.5">
          <Button className="px-2 py-1.5 text-xs" onClick={() => openPayoutAction(row, 'approve')}>Approve</Button>
          <Button variant="danger" className="px-2 py-1.5 text-xs" onClick={() => openPayoutAction(row, 'reject')}>Reject</Button>
        </div>
      ) : <span className="text-xs text-muted">—</span>,
    },
  ]

  const disputeColumns = [
    { key: 'user', label: 'User' },
    { key: 'ownerId', label: 'Owner' },
    { key: 'facility', label: 'Facility' },
    { key: 'reason', label: 'Reason' },
    { key: 'createdAt', label: 'Reported', render: (row) => new Date(row.createdAt).toLocaleDateString('en-PH') },
    { key: 'status', label: 'Status', render: (row) => <Badge tone={disputeTone[row.status] ?? 'neutral'}>{row.status}</Badge> },
    {
      key: 'actions',
      label: 'Details',
      render: (row) => <Button variant="info" className="px-2 py-1.5 text-xs" onClick={() => openDispute(row)}>Review</Button>,
    },
  ]

  const stats = data ? [
    { label: 'Service fees', amount: data.stats.serviceFees },
    { label: 'Commissions', amount: data.stats.commissions },
    { label: 'Withdrawal fees', amount: data.stats.withdrawalFees },
    { label: 'Gateway fees lost', amount: data.stats.gatewayFeesLost },
    { label: 'Total net revenue', amount: data.stats.totalNetRevenue },
    { label: 'Pending payouts', amount: data.stats.pendingPayouts },
    { label: 'Total refunded', amount: data.stats.totalRefunded },
  ] : []

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <PageHeading title="Revenue & Payouts" description="Monitor platform revenue, payout requests, refund activity, and booking disputes." />
      {notice ? <p role="status" className="text-sm text-success">{notice}</p> : null}
      {actionError && !selectedPayout && !selectedDispute ? <p role="alert" className="text-sm text-danger">{actionError}</p> : null}
      <AsyncState loading={isLoading} error={error} onRetry={reload} />
      {data ? (
        <>
          <section aria-label="Platform revenue" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((item) => (
              <StatCard key={item.label} label={item.label} value={formatPHP(item.amount)} />
            ))}
          </section>
          <section aria-label="Payout requests" className="space-y-3">
            <div>
              <h2 className="text-sm font-bold">Payout requests</h2>
              <p className="mt-1 text-xs text-muted">Approving moves the request to processing. Rejecting returns the payout amount less the non-refundable fee.</p>
            </div>
            <Table
              columns={payoutColumns}
              rows={data.payoutRequests}
              rowKey="id"
              emptyMessage="There are no payout requests awaiting review."
              caption="Owner payout requests"
            />
          </section>
          <section aria-label="Disputes queue" className="space-y-3">
            <div>
              <h2 className="text-sm font-bold">Disputes queue</h2>
              <p className="mt-1 text-xs text-muted">Review the booking and its fee snapshot before recording an audited resolution.</p>
            </div>
            <Table
              columns={disputeColumns}
              rows={data.disputes}
              rowKey="id"
              emptyMessage="There are no open disputes."
              caption="Open booking disputes"
            />
          </section>
          <section aria-label="Transaction ledger" className="space-y-3">
            <div>
              <h2 className="text-sm font-bold">Transaction ledger</h2>
              <p className="mt-1 text-xs text-muted">Ledger values include booking fees, commissions, refunds, and payout fees.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Select
                label="Transaction type"
                value={ledgerType}
                onChange={(event) => setLedgerType(event.target.value)}
                options={['All', 'Booking', 'Refund', 'Withdrawal fee']}
              />
              <Select
                label="Status"
                value={ledgerStatus}
                onChange={(event) => setLedgerStatus(event.target.value)}
                options={['All', ...new Set(ledger.map((entry) => entry.status))]}
              />
              <Input label="From date" type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
              <Input label="To date" type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
            </div>
            <Table
              columns={ledgerColumns}
              rows={visibleLedger}
              rowKey="id"
              emptyMessage="No ledger transactions match these filters."
              caption="Platform transaction ledger"
            />
          </section>
        </>
      ) : null}

      <Modal
        open={Boolean(selectedPayout)}
        onClose={() => {
          if (!isSubmitting) {
            setSelectedPayout(null)
            setActionError('')
          }
        }}
        title={payoutAction === 'approve' ? 'Approve payout' : 'Reject payout'}
      >
        {selectedPayout ? (
          <form className="space-y-4" onSubmit={submitPayoutAction}>
            <p className="text-sm text-muted">
              {payoutAction === 'approve'
                ? `Approve ${formatPHP(selectedPayout.amount)} to ${selectedPayout.destination}?`
                : `Reject ${formatPHP(selectedPayout.amount)} to ${selectedPayout.destination}? The amount, less the non-refundable fee, will return to the owner balance.`}
            </p>
            <div>
              <label htmlFor="payout-audit-note" className="mb-1.5 block text-xs font-medium text-muted">Admin note</label>
              <textarea
                id="payout-audit-note"
                value={payoutNote}
                onChange={(event) => setPayoutNote(event.target.value)}
                rows={3}
                maxLength={500}
                required
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
              />
            </div>
            {actionError ? <p role="alert" className="text-sm text-danger">{actionError}</p> : null}
            <div className="flex justify-end gap-2">
              <Button variant="secondary" disabled={isSubmitting} onClick={() => setSelectedPayout(null)}>Cancel</Button>
              <Button type="submit" variant={payoutAction === 'reject' ? 'danger' : 'primary'} disabled={isSubmitting || !payoutNote.trim()}>
                {isSubmitting ? 'Saving…' : payoutAction === 'approve' ? 'Approve payout' : 'Reject payout'}
              </Button>
            </div>
          </form>
        ) : null}
      </Modal>

      <Modal
        open={Boolean(selectedDispute)}
        onClose={() => {
          if (!isSubmitting) {
            setSelectedDispute(null)
            setActionError('')
          }
        }}
        title="Review booking dispute"
        className="max-h-[90vh] overflow-y-auto"
      >
        {selectedDispute ? (
          <form className="space-y-4" onSubmit={submitDisputeAction}>
            <div className="space-y-1 text-sm">
              <p><span className="text-muted">User:</span> {selectedDispute.user}</p>
              <p><span className="text-muted">Owner:</span> {selectedDispute.ownerId}</p>
              <p><span className="text-muted">Facility:</span> {selectedDispute.facility}</p>
              <p><span className="text-muted">Reason:</span> {selectedDispute.reason}</p>
              <p><span className="text-muted">Details:</span> {selectedDispute.details}</p>
            </div>
            {selectedDispute.reservation ? (
              <FeeBreakdown rows={[
                { label: 'Facility', value: selectedDispute.reservation.name },
                { label: 'Date', value: selectedDispute.reservation.date },
                { label: 'Court rate', value: formatPHP(selectedDispute.reservation.courtRate) },
                { label: 'Service fee', value: formatPHP(selectedDispute.reservation.serviceFee) },
                { label: 'Owner commission', value: formatPHP(selectedDispute.reservation.ownerCommission) },
                { label: 'Owner net', value: formatPHP(selectedDispute.reservation.ownerNet) },
                { label: 'Total paid', value: formatPHP(selectedDispute.reservation.userTotal), emphasis: true },
              ]} />
            ) : <p role="alert" className="text-sm text-danger">The reservation record could not be loaded.</p>}
            <Select
              label="Resolution"
              value={disputeAction}
              onChange={(event) => setDisputeAction(event.target.value)}
              options={[
                { value: '', label: 'Choose an action' },
                { value: 'full-refund', label: 'Refund user in full' },
                { value: 'partial-refund', label: 'Partial refund' },
                { value: 'reject', label: 'Reject dispute' },
              ]}
              required
            />
            {disputeAction === 'partial-refund' ? (
              <Input
                label="Partial refund amount (₱)"
                type="number"
                value={partialAmount}
                onChange={(event) => setPartialAmount(event.target.value)}
                min="0.01"
                max={selectedDispute.reservation?.userTotal}
                step="0.01"
                required
              />
            ) : null}
            <div>
              <label htmlFor="dispute-audit-note" className="mb-1.5 block text-xs font-medium text-muted">Resolution note</label>
              <textarea
                id="dispute-audit-note"
                value={disputeNote}
                onChange={(event) => setDisputeNote(event.target.value)}
                rows={3}
                maxLength={1000}
                required
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
              />
            </div>
            {actionError ? <p role="alert" className="text-sm text-danger">{actionError}</p> : null}
            <div className="flex justify-end gap-2">
              <Button variant="secondary" disabled={isSubmitting} onClick={() => setSelectedDispute(null)}>Cancel</Button>
              <Button
                type="submit"
                disabled={isSubmitting || !disputeAction || !disputeNote.trim() || !selectedDispute.reservation}
              >
                {isSubmitting ? 'Saving…' : 'Record resolution'}
              </Button>
            </div>
          </form>
        ) : null}
      </Modal>
    </div>
  )
}

export default AdminRevenuePage
