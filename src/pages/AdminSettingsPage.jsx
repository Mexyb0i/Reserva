import { useCallback, useState } from 'react'
import AsyncState from '../components/ui/AsyncState'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'
import PageHeading from '../components/ui/PageHeading'
import Select from '../components/ui/Select'
import useAsyncResource from '../hooks/useAsyncResource'
import { settingsService } from '../services/settingsService'

const feeFields = [
  { key: 'userServiceRate', label: 'User service fee rate', step: '0.01', max: 1, help: 'Decimal rate from 0 to 1. For example, 0.05 is 5%.' },
  { key: 'userServiceMin', label: 'Minimum service fee (₱)', step: '0.01', min: 0 },
  { key: 'ownerCommissionRate', label: 'Owner commission rate', step: '0.01', max: 1, help: 'Decimal rate from 0 to 1. For example, 0.08 is 8%.' },
  { key: 'withdrawalFee', label: 'Withdrawal fee (₱)', step: '0.01', min: 0 },
  { key: 'minWithdrawal', label: 'Minimum withdrawal (₱)', step: '0.01', min: 0 },
]

const policyFields = [
  { key: 'freeCancelHours', label: 'Free cancellation window (hours)', step: '1', min: 0 },
  { key: 'lateCancelRefundRate', label: 'Late cancellation refund rate', step: '0.01', max: 1, help: 'Decimal rate from 0 to 1.' },
  { key: 'noShowRefundRate', label: 'No-show refund rate', step: '0.01', max: 1, help: 'Decimal rate from 0 to 1.' },
  { key: 'requestExpiryHours', label: 'Pending request expiry (hours)', step: '1', min: 0 },
  { key: 'disputeWindowHours', label: 'Dispute window (hours)', step: '1', min: 0 },
]

function AdminSettingsPage() {
  const loader = useCallback(() => settingsService.getSettings(), [])
  const { data, isLoading, error, reload } = useAsyncResource(loader)
  const [form, setForm] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [notice, setNotice] = useState('')

  const current = form ?? data

  async function save(event) {
    event.preventDefault()
    if (!current) return
    setIsSaving(true)
    setSaveError('')
    setNotice('')
    try {
      const changes = {
        fees: Object.fromEntries(Object.entries(current.fees).map(([key, value]) => [
          key,
          key === 'payoutSchedule' ? value : Number(value),
        ])),
        refundPolicy: Object.fromEntries(Object.entries(current.refundPolicy).map(([key, value]) => [key, Number(value)])),
      }
      const updated = await settingsService.update(changes)
      setForm(updated)
      setNotice('Fees and refund policy saved. These changes apply to new bookings only.')
    } catch (submitError) {
      setSaveError(submitError instanceof Error ? submitError.message : 'Settings could not be saved.')
    } finally {
      setIsSaving(false)
    }
  }

  function updateValue(section, key, value) {
    setForm((currentForm) => ({
      ...(currentForm ?? data),
      [section]: {
        ...((currentForm ?? data)[section]),
        [key]: value,
      },
    }))
    setSaveError('')
    setNotice('')
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <PageHeading title="Fees & Refund Policy" description="Configure platform fees, payout rules, and booking cancellation terms." />
      <AsyncState loading={isLoading} error={error} onRetry={reload} />
      {current ? (
        <form className="space-y-4" onSubmit={save}>
          <Card>
            <h2 className="text-sm font-bold">Platform fees</h2>
            <p className="mt-1 text-xs text-muted">Rates are decimals from 0 to 1. Monetary amounts are in Philippine pesos.</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {feeFields.map((field) => (
                <div key={field.key}>
                  <Input
                    label={field.label}
                    type="number"
                    value={current.fees[field.key]}
                    onChange={(event) => updateValue('fees', field.key, event.target.value)}
                    min={field.min ?? 0}
                    max={field.max}
                    step={field.step}
                    required
                  />
                  {field.help ? <p className="mt-1 text-[11px] text-muted">{field.help}</p> : null}
                </div>
              ))}
              <Select
                label="Payout schedule"
                value={current.fees.payoutSchedule}
                onChange={(event) => updateValue('fees', 'payoutSchedule', event.target.value)}
                options={[
                  { value: 'on-request', label: 'On request' },
                  { value: 'weekly', label: 'Weekly' },
                ]}
              />
            </div>
          </Card>

          <Card>
            <h2 className="text-sm font-bold">Refund policy</h2>
            <p className="mt-1 text-xs text-muted">Rates are decimals from 0 to 1. Time windows are measured in hours.</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {policyFields.map((field) => (
                <div key={field.key}>
                  <Input
                    label={field.label}
                    type="number"
                    value={current.refundPolicy[field.key]}
                    onChange={(event) => updateValue('refundPolicy', field.key, event.target.value)}
                    min={field.min ?? 0}
                    max={field.max}
                    step={field.step}
                    required
                  />
                  {field.help ? <p className="mt-1 text-[11px] text-muted">{field.help}</p> : null}
                </div>
              ))}
            </div>
          </Card>

          {saveError ? <p role="alert" className="text-sm text-danger">{saveError}</p> : null}
          {notice ? <p role="status" className="text-sm text-success">{notice}</p> : null}
          <div className="flex justify-end">
            <Button type="submit" disabled={isSaving}>{isSaving ? 'Saving…' : 'Save settings'}</Button>
          </div>
        </form>
      ) : null}
    </div>
  )
}

export default AdminSettingsPage
