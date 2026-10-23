import { useCallback, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AsyncState from '../components/ui/AsyncState'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import PageHeading from '../components/ui/PageHeading'
import Select from '../components/ui/Select'
import FeeBreakdown from '../components/payment/FeeBreakdown'
import useAsyncResource from '../hooks/useAsyncResource'
import { facilityService } from '../services/facilityService'
import { reservationService } from '../services/reservationService'
import { paymentService } from '../services/paymentService'
import { settingsService } from '../services/settingsService'
import { formatTimeRange } from '../utils/bookingTime'
import { calculateBookingFees, formatPHP } from '../utils/fees'

function ConfirmBookingPage() {
  const navigate = useNavigate()
  const [paymentMethod, setPaymentMethod] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const loader = useCallback(async () => {
    const [draft, settings] = await Promise.all([
      reservationService.getBookingDraft(),
      settingsService.getSettings(),
    ])
    const facility = await facilityService.getFacilityById(draft.facilityId)
    if (!facility) throw new Error('The selected facility could not be found.')
    const courtRate = Number(draft.courtRate ??
      Number(facility.price.replace(/[^\d.]/g, '')) * Number(draft.duration) * Number(draft.quantity ?? 1))
    return {
      draft: { ...draft, courtRate },
      facility,
      settings,
      fees: calculateBookingFees(courtRate, settings.fees),
    }
  }, [])
  const { data, isLoading, error, reload } = useAsyncResource(loader)

  async function confirm() {
    setErrorMessage('')
    if (!paymentMethod) {
      setErrorMessage('Select a payment method to continue.')
      return
    }
    setIsSubmitting(true)
    try {
      const bookingPayload = {
        ...data.draft,
        facilityName: data.facility.name,
        paymentMethod,
      }
      await reservationService.validateBookingAvailability(bookingPayload)
      const payment = await paymentService.createPayment({
        method: paymentMethod,
        amount: data.fees.userTotal,
      })
      try {
        await reservationService.createReservation({
          ...bookingPayload,
          paymentId: payment.id,
        })
      } catch (reservationError) {
        await paymentService.refundPayment(payment.id, payment.amount)
        throw reservationError
      }
      navigate('/reserved-schedule', {
        state: { notice: 'Payment received. Your reservation request is awaiting owner confirmation.' },
      })
    } catch (submitError) {
      setErrorMessage(submitError instanceof Error ? submitError.message : 'Booking could not be confirmed.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <PageHeading title="Confirm Booking" description="Review your reservation before confirming." />
      <AsyncState loading={isLoading} error={error} onRetry={reload} />
      {data ? (
        <Card>
          <h2 className="border-b border-border pb-3 text-sm font-bold">Reservation Summary</h2>
          <FeeBreakdown rows={[
            { label: 'Facility', value: data.facility.name },
            { label: 'Date', value: new Date(`${data.draft.date}T00:00:00`).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }) },
            { label: 'Time', value: formatTimeRange(data.draft.time, data.draft.duration).label },
            { label: 'Duration', value: `${data.draft.duration} ${data.draft.duration === 1 ? 'hour' : 'hours'} · ${data.draft.quantity} ${data.draft.quantity === 1 ? 'court' : 'courts'}` },
            { label: 'Court rate', value: formatPHP(data.fees.courtRate) },
            { label: `Service fee (${data.settings.fees.userServiceRate * 100}%, min ${formatPHP(data.settings.fees.userServiceMin)})`, value: formatPHP(data.fees.serviceFee) },
            { label: 'Total', value: formatPHP(data.fees.userTotal), emphasis: true },
          ]} />
          <p className="mt-2 text-xs leading-5 text-muted">
            Free cancellation up to {data.settings.refundPolicy.freeCancelHours} hours before your booking. Service fee is non-refundable.
          </p>
          <div className="mt-4 max-w-sm">
            <Select
              label="Payment method"
              value={paymentMethod}
              onChange={(event) => {
                setPaymentMethod(event.target.value)
                setErrorMessage('')
              }}
              options={[
                { value: '', label: 'Choose a payment method' },
                'GCash',
                'Maya',
                'Bank',
              ]}
            />
          </div>
          {errorMessage ? <p role="alert" className="mt-3 text-sm text-danger">{errorMessage}</p> : null}
          <div className="mt-5 flex flex-wrap justify-between gap-2 border-t border-border pt-4">
            <Link
              to={`/choose-schedule?facility=${data.draft.facilityId}`}
              className="inline-flex items-center justify-center rounded-md border border-border bg-surface px-3 py-2 text-sm font-semibold text-text transition-colors hover:brightness-110"
            >
              Back
            </Link>
            <Button disabled={isSubmitting || !paymentMethod} onClick={confirm}>{isSubmitting ? 'Processing payment…' : 'Pay and confirm'}</Button>
          </div>
        </Card>
      ) : null}
    </div>
  )
}

export default ConfirmBookingPage
