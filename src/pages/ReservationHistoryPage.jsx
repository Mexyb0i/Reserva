import { useCallback, useState } from 'react'
import Badge from '../components/ui/Badge'
import AsyncState from '../components/ui/AsyncState'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import PageHeading from '../components/ui/PageHeading'
import Select from '../components/ui/Select'
import Table from '../components/ui/Table'
import useAsyncResource from '../hooks/useAsyncResource'
import { disputeService, isDisputeEligible } from '../services/disputeService'
import { reservationService } from '../services/reservationService'
import { settingsService } from '../services/settingsService'
import { userService } from '../services/userService'
import { formatPHP } from '../utils/fees'

const statusTones = { Completed: 'success', Pending: 'pending', Cancelled: 'danger', 'No-show': 'danger' }
const disputeReasons = [
  'Facility was unavailable',
  'Facility condition or safety issue',
  'Service not provided as booked',
  'Incorrect charge or refund',
  'Other',
]

function ReservationHistoryPage() {
  const loader = useCallback(async () => {
    const [history, settings, disputes] = await Promise.all([
      reservationService.getHistory(),
      settingsService.getSettings(),
      disputeService.getDisputes(),
    ])
    return {
      rows: history.map((row) => ({
        ...row,
        hasOpenDispute: disputes.some((dispute) =>
          dispute.reservationId === row.id && dispute.status === 'Open',
        ),
      })),
      disputeWindowHours: settings.refundPolicy.disputeWindowHours,
    }
  }, [])
  const { data, isLoading, error, reload } = useAsyncResource(loader)
  const rows = data?.rows ?? []
  const [selected, setSelected] = useState(null)
  const [reason, setReason] = useState('')
  const [details, setDetails] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [notice, setNotice] = useState('')

  async function submitDispute(event) {
    event.preventDefault()
    if (!selected || !reason || !details.trim()) {
      setSubmitError('Choose a reason and describe the problem.')
      return
    }
    setIsSubmitting(true)
    setSubmitError('')
    try {
      await disputeService.createDispute({
        reservationId: selected.id,
        reason,
        details,
      })
      setSelected(null)
      setReason('')
      setDetails('')
      setNotice('Your problem report was submitted for review.')
      reload()
      try {
        await userService.addNotification({
          title: 'Problem report submitted',
          message: `Your report for ${selected.facility} is now under review.`,
          type: 'info',
        })
      } catch (notificationError) {
        setNotice(`Your report was submitted, but its notification could not be saved: ${notificationError.message}`)
      }
    } catch (submissionError) {
      setSubmitError(submissionError instanceof Error ? submissionError.message : 'Your report could not be submitted.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const columns = [
    { key: 'facility', label: 'Facility' },
    { key: 'date', label: 'Date' },
    { key: 'duration', label: 'Duration' },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          <Badge tone={statusTones[row.status] ?? 'neutral'}>{row.status}</Badge>
          {Number(row.refundedAmount) > 0 ? <Badge tone="info">Refund</Badge> : null}
          {row.hasOpenDispute ? <Badge tone="pending">Disputed</Badge> : null}
        </div>
      ),
    },
    {
      key: 'total',
      label: 'Total paid',
      className: 'text-right font-semibold text-accent',
      render: (row) => Number.isFinite(Number(row.userTotal))
        ? formatPHP(row.userTotal)
        : row.total,
    },
    {
      key: 'refundedAmount',
      label: 'Refunded',
      className: 'text-right',
      render: (row) => Number(row.refundedAmount) > 0 ? formatPHP(row.refundedAmount) : '—',
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => {
        const canReport = row.id && row.status === 'Completed' &&
          !row.hasOpenDispute &&
          isDisputeEligible(row, data.disputeWindowHours)
        return canReport
          ? <Button variant="info" className="px-2.5 py-1.5 text-xs" onClick={() => {
            setSelected(row)
            setSubmitError('')
            setReason('')
            setDetails('')
          }}>Report a problem</Button>
          : null
      },
    },
  ]

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <PageHeading title="Reservation History" description="A record of your past and current bookings." />
      {notice ? <p role="status" className="text-sm text-success">{notice}</p> : null}
      <AsyncState loading={isLoading} error={error} onRetry={reload} empty={!isLoading && !error && !rows.length} emptyMessage="Your reservation history is empty." />
      {!isLoading && !error && rows.length ? <Table columns={columns} rows={rows} rowKey="id" caption="Reservation history" /> : null}
      <Modal
        open={Boolean(selected)}
        onClose={() => {
          if (!isSubmitting) setSelected(null)
        }}
        title="Report a problem"
      >
        {selected ? (
          <form className="space-y-4" onSubmit={submitDispute}>
            <p className="text-sm text-muted">
              Tell us what happened with <span className="font-semibold text-text">{selected.facility}</span>.
            </p>
            <Select
              label="Reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              options={[
                { value: '', label: 'Choose a reason' },
                ...disputeReasons,
              ]}
              required
            />
            <div>
              <label htmlFor="dispute-details" className="mb-1.5 block text-xs font-medium text-muted">
                Details
              </label>
              <textarea
                id="dispute-details"
                value={details}
                onChange={(event) => setDetails(event.target.value)}
                rows={4}
                maxLength={1000}
                required
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-muted focus:border-accent focus:outline-none"
                placeholder="Describe the problem and what outcome you are requesting."
              />
            </div>
            {submitError ? <p role="alert" className="text-sm text-danger">{submitError}</p> : null}
            <div className="flex justify-end gap-2">
              <Button variant="secondary" disabled={isSubmitting} onClick={() => setSelected(null)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting || !reason || !details.trim()}>
                {isSubmitting ? 'Submitting…' : 'Submit report'}
              </Button>
            </div>
          </form>
        ) : null}
      </Modal>
    </div>
  )
}

export default ReservationHistoryPage
