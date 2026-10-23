import { useCallback, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import AsyncState from '../components/ui/AsyncState'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import CancelModal from '../components/payment/CancelModal'
import PageHeading from '../components/ui/PageHeading'
import useAsyncResource from '../hooks/useAsyncResource'
import { reservationService } from '../services/reservationService'
import { formatPHP } from '../utils/fees'

const statusTone = { Confirmed: 'success', Pending: 'pending', Cancelled: 'danger', 'No-show': 'danger' }

function ReservedSchedulePage() {
  const location = useLocation()
  const loader = useCallback(() => reservationService.getReservedSchedule(), [])
  const { data, isLoading, error, reload } = useAsyncResource(loader)
  const reservations = data ?? []
  const [selected, setSelected] = useState(null)
  const [refundPreview, setRefundPreview] = useState(null)
  const [cancelError, setCancelError] = useState('')
  const [isCancelling, setIsCancelling] = useState(false)
  const [isLoadingPreview, setIsLoadingPreview] = useState(false)
  const [notice, setNotice] = useState(location.state?.notice ?? '')

  async function openCancel(reservation) {
    setSelected(reservation)
    setRefundPreview(null)
    setCancelError('')
    setNotice('')
    setIsLoadingPreview(true)
    try {
      setRefundPreview(await reservationService.getCancellationPreview(reservation.id))
    } catch (previewError) {
      setCancelError(previewError instanceof Error ? previewError.message : 'Refund preview could not be loaded.')
    } finally {
      setIsLoadingPreview(false)
    }
  }

  async function cancelReservation() {
    if (!selected) return
    setIsCancelling(true)
    setCancelError('')
    try {
      const result = await reservationService.cancelReservation(selected.id, 'user')
      setSelected(null)
      setNotice(`Reservation cancelled. Refund: ${formatPHP(result.refund.total)}.`)
      reload()
    } catch (submitError) {
      setCancelError(submitError instanceof Error ? submitError.message : 'Reservation could not be cancelled.')
    } finally {
      setIsCancelling(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <PageHeading
        title="Reserved Schedule"
        description="Keep track of your upcoming games and bookings."
        action={
          <Link
            to="/sports-facilities"
            className="inline-flex items-center justify-center rounded-md bg-accent px-3 py-2 text-sm font-semibold text-white transition hover:brightness-110"
          >
            Book a facility
          </Link>
        }
      />
      {notice ? <p role="status" className="text-sm text-success">{notice}</p> : null}
      <AsyncState loading={isLoading} error={error} onRetry={reload} empty={!isLoading && !error && !reservations.length} emptyMessage="You don't have any reservations yet." />
      {!isLoading && !error && reservations.length ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {reservations.map((reservation) => (
            <Card key={reservation.id} padded={false} className="overflow-hidden sm:flex">
              <div className="flex h-32 shrink-0 items-center justify-center bg-gradient-to-br from-danger/70 to-sidebar sm:h-auto sm:w-36">
                {reservation.image ? (
                  <img src={reservation.image} alt="" loading="lazy" className="h-full w-full object-cover" />
                ) : (
                  <span aria-hidden="true" className="text-2xl font-black text-white/75">PLAY</span>
                )}
              </div>
              <div className="flex min-w-0 flex-1 flex-col p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h2 className="text-sm font-bold">{reservation.name}</h2>
                    <p className="mt-1 text-xs text-muted">{reservation.date}</p>
                  </div>
                  <Badge tone={statusTone[reservation.status] ?? 'neutral'}>{reservation.status}</Badge>
                </div>
                <p className="mt-3 text-xs text-muted">{reservation.time}{reservation.duration ? ` · ${reservation.duration} hrs` : ''}</p>
                <div className="mt-auto flex items-end justify-between gap-3 pt-4">
                  <div>
                    <p className="text-[10px] text-muted">Total paid</p>
                    <p className="mt-0.5 text-sm font-bold text-accent">
                      {Number.isFinite(Number(reservation.userTotal))
                        ? formatPHP(reservation.userTotal)
                        : reservation.total}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {reservation.courtRate !== undefined && ['Pending', 'Confirmed'].includes(reservation.status) ? (
                      <Button
                        variant="danger"
                        className="px-2.5 py-1.5 text-xs"
                        disabled={!isBeforeReservationStart(reservation)}
                        title={isBeforeReservationStart(reservation) ? undefined : 'This booking has already started.'}
                        onClick={() => openCancel(reservation)}
                      >
                        Cancel
                      </Button>
                    ) : null}
                    <Link
                      to={`/feedback?facility=${reservation.facilityId ?? 1}`}
                      className="inline-flex items-center justify-center rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs font-semibold text-text"
                    >
                      Review
                    </Link>
                    <Link
                      to={`/message-facility?facility=${reservation.facilityId ?? 1}`}
                      className="inline-flex items-center justify-center rounded-md bg-info px-2.5 py-1.5 text-xs font-semibold text-white"
                    >
                      Message
                    </Link>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : null}
      <CancelModal
        reservation={selected}
        preview={refundPreview}
        loading={isLoadingPreview}
        error={cancelError}
        submitting={isCancelling}
        onClose={() => {
          if (!isCancelling) setSelected(null)
        }}
        onConfirm={cancelReservation}
      />
    </div>
  )
}

function isBeforeReservationStart(reservation) {
  const date = String(reservation.date ?? '')
  const time = String(reservation.startTime ?? '')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return false
  return new Date(`${date}T${time}:00`).getTime() > Date.now()
}

export default ReservedSchedulePage
