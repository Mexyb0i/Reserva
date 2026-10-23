import { useCallback, useMemo, useState } from 'react'
import AsyncState from '../components/ui/AsyncState'
import Badge from '../components/ui/Badge'
import BalanceCards from '../components/payment/BalanceCards'
import MoneyCell from '../components/payment/MoneyCell'
import WithdrawModal from '../components/payment/WithdrawModal'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import PageHeading from '../components/ui/PageHeading'
import Select from '../components/ui/Select'
import Table from '../components/ui/Table'
import useAsyncResource from '../hooks/useAsyncResource'
import { payoutService } from '../services/payoutService'
import { reservationService } from '../services/reservationService'
import { settingsService } from '../services/settingsService'

const EMPTY_ROWS = []
const earningStatusTone = { Available: 'success', Pending: 'pending', Refunded: 'danger', Disputed: 'info' }
const payoutStatusTone = { Requested: 'pending', Processing: 'info', Paid: 'success', Failed: 'danger' }

function OwnerEarningsPage() {
  const loader = useCallback(async () => {
    await reservationService.completePastReservations()
    const [balance, earnings, payouts, accounts, settings] = await Promise.all([
      payoutService.getBalance(),
      payoutService.getEarnings(),
      payoutService.getPayouts(),
      payoutService.getPayoutAccounts(),
      settingsService.getSettings(),
    ])
    return { balance, earnings, payouts, accounts, settings }
  }, [])
  const { data, isLoading, error, reload } = useAsyncResource(loader)
  const [showWithdraw, setShowWithdraw] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [actionError, setActionError] = useState('')
  const [notice, setNotice] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  const earnings = data?.earnings ?? EMPTY_ROWS
  const filteredEarnings = useMemo(
    () => earnings.filter((earning) => {
      if (statusFilter !== 'All' && earning.status !== statusFilter) return false
      const date = String(earning.date ?? '').slice(0, 10)
      if (fromDate && date < fromDate) return false
      if (toDate && date > toDate) return false
      return true
    }),
    [earnings, fromDate, statusFilter, toDate],
  )

  async function requestWithdrawal(payload) {
    setIsSubmitting(true)
    setActionError('')
    try {
      await payoutService.requestWithdrawal(payload)
      setNotice('Withdrawal requested. Your available balance has been updated.')
      setShowWithdraw(false)
      reload()
    } catch (withdrawError) {
      setActionError(withdrawError instanceof Error ? withdrawError.message : 'Withdrawal could not be requested.')
      throw withdrawError
    } finally {
      setIsSubmitting(false)
    }
  }

  async function addPayoutAccount(account) {
    const result = await payoutService.addPayoutAccount(account)
    reload()
    return result
  }

  async function verifyPayoutAccount(accountId, code) {
    await payoutService.verifyPayoutAccount(accountId, code)
    reload()
  }

  const earningColumns = [
    { key: 'date', label: 'Booking date' },
    { key: 'user', label: 'User' },
    { key: 'facility', label: 'Facility' },
    { key: 'courtRate', label: 'Gross', className: 'text-right', render: (row) => <MoneyCell amount={row.courtRate} /> },
    { key: 'ownerCommission', label: 'Commission', className: 'text-right', render: (row) => <MoneyCell amount={row.ownerCommission} /> },
    { key: 'ownerNet', label: 'Net', className: 'text-right font-semibold', render: (row) => <MoneyCell amount={row.ownerNet} /> },
    {
      key: 'refundedAmount',
      label: 'Refunded',
      className: 'text-right',
      render: (row) => Number(row.refundedAmount) > 0 ? <MoneyCell amount={row.refundedAmount} /> : '—',
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <Badge tone={earningStatusTone[row.status] ?? 'neutral'}>{row.status}</Badge>,
    },
  ]

  const payoutColumns = [
    {
      key: 'requestedAt',
      label: 'Date',
      render: (row) => new Date(row.requestedAt).toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
    },
    { key: 'amount', label: 'Amount', className: 'text-right', render: (row) => <MoneyCell amount={row.amount} /> },
    { key: 'fee', label: 'Fee', className: 'text-right', render: (row) => <MoneyCell amount={row.fee} /> },
    { key: 'net', label: 'Net received', className: 'text-right font-semibold', render: (row) => <MoneyCell amount={row.net} /> },
    { key: 'destination', label: 'Destination' },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <div>
          <Badge tone={payoutStatusTone[row.status] ?? 'neutral'}>{row.status}</Badge>
          {row.status === 'Failed' && row.reason ? <p className="mt-1 text-xs text-muted">{row.reason}</p> : null}
        </div>
      ),
    },
  ]

  function exportReport() {
    if (!earnings.length) return
    const headers = ['Date', 'User', 'Facility', 'Gross', 'Commission', 'Net', 'Status']
    const rows = earnings.map((item) => [
      item.date,
      item.user,
      item.facility,
      item.courtRate,
      item.ownerCommission,
      item.ownerNet,
      item.status,
    ])
    const csv = [headers, ...rows]
      .map((row) => row.map((value) => `"${String(value ?? '').replaceAll('"', '""')}"`).join(','))
      .join('\r\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'reserva-earnings-report.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <PageHeading
        title="Earnings & Payments"
        description="Track completed booking earnings, available funds, and payout history."
        action={(
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" disabled={!earnings.length} onClick={exportReport}>Export report</Button>
            <Button disabled={!data || data.balance.available <= 0} onClick={() => {
              setNotice('')
              setActionError('')
              setShowWithdraw(true)
            }}>
              Withdraw
            </Button>
          </div>
        )}
      />
      {notice ? <p role="status" className="text-sm text-success">{notice}</p> : null}
      {actionError && !showWithdraw ? <p role="alert" className="text-sm text-danger">{actionError}</p> : null}
      <AsyncState loading={isLoading} error={error} onRetry={reload} />
      {data ? (
        <>
          {data.balance.available < 0 ? (
            <p role="status" className="rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
              Your balance is negative and will be deducted from future earnings.
            </p>
          ) : null}
          <BalanceCards balance={data.balance} />
          <section aria-label="Booking earnings" className="space-y-3">
            <div>
              <h2 className="text-sm font-bold">Booking earnings</h2>
              <p className="mt-1 text-xs text-muted">Funds become available after a booking is completed and its date has passed. Open disputes remain on hold.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Select
                label="Status"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                options={['All', 'Pending', 'Available', 'Refunded', 'Disputed']}
              />
              <Input label="From date" type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
              <Input label="To date" type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
            </div>
            <Table
              columns={earningColumns}
              rows={filteredEarnings}
              rowKey="id"
              emptyMessage="No booking earnings match these filters."
              caption="Booking earnings"
            />
          </section>
          <section aria-label="Payout history" className="space-y-3">
            <div>
              <h2 className="text-sm font-bold">Payout history</h2>
              <p className="mt-1 text-xs text-muted">If a payout fails, the amount less its non-refundable withdrawal fee returns to your available balance.</p>
            </div>
            <Table
              columns={payoutColumns}
              rows={data.payouts}
              rowKey="id"
              emptyMessage="No payouts have been requested yet."
              caption="Payout history"
            />
          </section>
          <WithdrawModal
            open={showWithdraw}
            onClose={() => setShowWithdraw(false)}
            balance={data.balance}
            fees={data.settings.fees}
            payoutSchedule={data.settings.fees.payoutSchedule}
            accounts={data.accounts}
            onAddAccount={addPayoutAccount}
            onVerifyAccount={verifyPayoutAccount}
            onWithdraw={requestWithdrawal}
            submitting={isSubmitting}
          />
        </>
      ) : null}
    </div>
  )
}

export default OwnerEarningsPage
