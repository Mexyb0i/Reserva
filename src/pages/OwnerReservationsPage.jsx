import { useCallback, useEffect, useMemo, useState } from 'react'
import AsyncState from '../components/ui/AsyncState'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import FeeBreakdown from '../components/payment/FeeBreakdown'
import Modal from '../components/ui/Modal'
import PageHeading from '../components/ui/PageHeading'
import Select from '../components/ui/Select'
import Table from '../components/ui/Table'
import useAsyncResource from '../hooks/useAsyncResource'
import { ownerService } from '../services/ownerService'
import { reservationService } from '../services/reservationService'
import { settingsService } from '../services/settingsService'
import { formatPHP } from '../utils/fees'

const statusTone = { Confirmed: 'success', Pending: 'pending', Cancelled: 'danger', Completed: 'success' }
const EMPTY_RESERVATIONS = []

function OwnerReservationsPage() {
  const loader = useCallback(async () => {
    const [legacyReservations, reservations, settings] = await Promise.all([
      ownerService.getReservations(),
      reservationService.getOwnerReservations(),
      settingsService.getSettings(),
    ])
    return {
      reservations: [...reservations.map(toOwnerRow), ...legacyReservations],
      requestExpiryHours: settings.refundPolicy.requestExpiryHours,
    }
  }, [])
  const { data, isLoading, error, reload } = useAsyncResource(loader)
  const [filter, setFilter] = useState('All')
  const [busyId, setBusyId] = useState(null)
  const [actionError, setActionError] = useState('')
  const [selected, setSelected] = useState(null)
  const [reason, setReason] = useState('')
  const [refundPreview, setRefundPreview] = useState(null)
  const [isLoadingPreview, setIsLoadingPreview] = useState(false)
  const [clock, setClock] = useState(() => Date.now())
  const reservations = data?.reservations ?? EMPTY_RESERVATIONS
  const filteredReservations = useMemo(
    () => filter === 'All' ? reservations : reservations.filter((reservation) => reservation.status === filter),
    [filter, reservations],
  )

  useEffect(() => {
    const timer = window.setInterval(() => setClock(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  async function openCancellation(reservation) {
    setSelected(reservation)
    setReason('')
    setActionError('')
    setRefundPreview(null)
    if (!reservation.isPaymentReservation) return
    setIsLoadingPreview(true)
    try {
      setRefundPreview(await reservationService.getCancellationPreview(reservation.id, 'owner'))
    } catch (previewError) {
      setActionError(previewError instanceof Error ? previewError.message : 'Refund preview could not be loaded.')
    } finally {
      setIsLoadingPreview(false)
    }
  }

  async function updateStatus(reservation, status) {
    setBusyId(reservation.id)
    setActionError('')
    try {
      if (reservation.isPaymentReservation) {
        await reservationService.updateOwnerReservationStatus(reservation.id, status, reason)
      } else {
        await ownerService.updateReservationStatus(reservation.id, status, reason)
      }
      setSelected(null)
      setReason('')
      reload()
    } catch (updateError) {
      setActionError(updateError instanceof Error ? updateError.message : 'Reservation status could not be updated.')
    } finally {
      setBusyId(null)
    }
  }

  const columns = [
    { key: 'customer', label: 'Customer' },
    { key: 'facility', label: 'Facility' },
    { key: 'date', label: 'Date' },
    { key: 'time', label: 'Time' },
    { key: 'duration', label: 'Duration' },
    {
      key: 'requestDeadline',
      label: 'Response deadline',
      render: (reservation) => reservation.status === 'Pending'
        ? getCountdown(reservation.createdAt, data.requestExpiryHours, clock)
        : '—',
    },
    {
      key: 'status',
      label: 'Status',
      render: (reservation) => <Badge tone={statusTone[reservation.status] ?? 'neutral'}>{reservation.status}</Badge>,
    },
    {
      key: 'total',
      label: 'Total',
      className: 'text-right font-semibold text-accent',
      render: (reservation) => Number.isFinite(Number(reservation.userTotal))
        ? formatPHP(reservation.userTotal)
        : reservation.total,
    },
    {
      key: 'actions',
      label: 'Actions',
      className: 'text-right',
      render: (reservation) => reservation.status === 'Pending' ? (
        <div className="flex justify-end gap-1.5">
          <Button
            disabled={busyId === reservation.id}
            onClick={() => updateStatus(reservation, 'Confirmed')}
            className="px-2 py-1.5 text-xs"
          >
            {busyId === reservation.id ? 'Saving…' : 'Accept'}
          </Button>
          <Button
            variant="danger"
            disabled={busyId === reservation.id}
            onClick={() => openCancellation(reservation)}
            className="px-2 py-1.5 text-xs"
          >
            Decline
          </Button>
        </div>
      ) : reservation.status === 'Confirmed' ? (
        <Button
          variant="danger"
          disabled={busyId === reservation.id}
          onClick={() => openCancellation(reservation)}
          className="px-2 py-1.5 text-xs"
        >
          Cancel booking
        </Button>
      ) : <span className="text-xs text-muted">—</span>,
    },
  ]

  const pendingCount = reservations.filter((item) => item.status === 'Pending').length
  const cancellationType = selected?.status === 'Confirmed' ? 'cancel' : 'decline'

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <PageHeading title="Reservation Requests" description="Review requests, accept bookings, or decline/cancel with a reason." />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <p className="text-xs text-muted">{pendingCount} requests need your attention</p>
        <div className="w-full sm:w-52">
          <Select
            label="Show"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            options={['All', 'Pending', 'Confirmed', 'Cancelled', 'Completed']}
          />
        </div>
      </div>
      {actionError && !selected ? <p role="alert" className="text-sm text-danger">{actionError}</p> : null}
      <AsyncState
        loading={isLoading}
        error={error}
        onRetry={reload}
        empty={!isLoading && !error && filteredReservations.length === 0}
        emptyMessage="There are no reservations in this view."
      />
      {!isLoading && !error && filteredReservations.length ? (
        <Table columns={columns} rows={filteredReservations} rowKey="id" caption="Facility reservations" />
      ) : null}
      <Modal
        open={Boolean(selected)}
        onClose={() => {
          if (!busyId && !isLoadingPreview) {
            setSelected(null)
            setActionError('')
          }
        }}
        title={cancellationType === 'cancel' ? 'Cancel confirmed booking' : 'Decline reservation request'}
      >
        {selected ? (
          <div className="space-y-3">
            <p className="text-sm text-muted">
              {cancellationType === 'cancel' ? 'Cancelling' : 'Declining'} the booking for{' '}
              <span className="font-semibold text-text">{selected.customer}</span> at {selected.facility}.
              {selected.isPaymentReservation ? ' The customer will receive a full refund.' : ''}
            </p>
            {isLoadingPreview ? <p role="status" className="text-sm text-muted">Loading refund preview…</p> : null}
            {refundPreview ? (
              <FeeBreakdown rows={[
                { label: 'Court rate', value: formatPHP(refundPreview.courtRate) },
                { label: 'Service fee', value: formatPHP(refundPreview.serviceFee) },
                { label: 'Full refund', value: formatPHP(refundPreview.totalRefunded), emphasis: true },
              ]} />
            ) : null}
            <div>
              <label htmlFor="owner-cancellation-reason" className="mb-1.5 block text-xs font-medium text-muted">
                Reason
              </label>
              <textarea
                id="owner-cancellation-reason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                rows={3}
                maxLength={500}
                required
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
              />
            </div>
            {actionError ? <p role="alert" className="text-sm text-danger">{actionError}</p> : null}
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                disabled={Boolean(busyId) || isLoadingPreview}
                onClick={() => setSelected(null)}
              >
                Keep booking
              </Button>
              <Button
                variant="danger"
                disabled={
                  Boolean(busyId) || isLoadingPreview || !reason.trim() ||
                  (selected.isPaymentReservation && !refundPreview)
                }
                onClick={() => updateStatus(selected, 'Cancelled')}
              >
                {busyId ? 'Processing…' : cancellationType === 'cancel' ? 'Confirm cancellation' : 'Confirm decline'}
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  )
}

function toOwnerRow(reservation) {
  return {
    ...reservation,
    isPaymentReservation: true,
    customer: reservation.user ?? 'Player',
    facility: reservation.name,
    total: reservation.userTotal,
    time: `${reservation.startTime} - ${reservation.endTime}`,
    duration: `${reservation.duration} ${reservation.duration === 1 ? 'hr' : 'hrs'}`,
  }
}

function getCountdown(createdAt, expiryHours, now) {
  if (!createdAt) return `${expiryHours}h response window`
  const expiresAt = new Date(createdAt).getTime() + Number(expiryHours) * 60 * 60 * 1000
  const remaining = expiresAt - now
  if (!Number.isFinite(expiresAt) || remaining <= 0) return 'Expiring…'
  const totalSeconds = Math.floor(remaining / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return `${hours}h ${minutes}m ${seconds}s`
}

export default OwnerReservationsPage
