import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import AsyncState from '../components/ui/AsyncState'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import PageHeading from '../components/ui/PageHeading'
import Select from '../components/ui/Select'
import useAsyncResource from '../hooks/useAsyncResource'
import { facilityService } from '../services/facilityService'
import { userService } from '../services/userService'

function MessagePage() {
  const [facilityId, setFacilityId] = useState('1')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [formError, setFormError] = useState('')
  const [status, setStatus] = useState('')
  const [isSending, setIsSending] = useState(false)
  const loader = useCallback(() => facilityService.getFacilities(), [])
  const { data, isLoading, error, reload } = useAsyncResource(loader)

  async function sendMessage(event) {
    event.preventDefault()
    setFormError('')
    setStatus('')
    if (!subject.trim() || message.trim().length < 10) {
      setFormError('Enter a subject and a message of at least 10 characters.')
      return
    }
    setIsSending(true)
    try {
      const result = await userService.sendFacilityMessage({
        facilityId: Number(facilityId),
        subject: subject.trim(),
        message: message.trim(),
      })
      setStatus(result.message)
      setSubject('')
      setMessage('')
    } catch (sendError) {
      setFormError(sendError instanceof Error ? sendError.message : 'Your message could not be sent.')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <PageHeading title="Message Facility" description="Contact a facility about your booking or visit." />
      <AsyncState loading={isLoading} error={error} onRetry={reload} />
      {data ? (
        <Card>
          <form onSubmit={sendMessage} className="space-y-4">
            <Select
              label="Facility"
              value={facilityId}
              onChange={(event) => setFacilityId(event.target.value)}
              options={data.map((facility) => ({ value: String(facility.id), label: facility.name }))}
            />
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-muted">Subject</span>
              <input
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                maxLength="100"
                required
                className="h-10 w-full rounded-md border border-border bg-bg px-3 text-sm text-text"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-muted">Message</span>
              <textarea
                rows="7"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                maxLength="1000"
                required
                className="w-full resize-y rounded-md border border-border bg-bg px-3 py-2 text-sm text-text"
              />
              <span className="mt-1 block text-right text-xs text-muted">{message.length}/1000</span>
            </label>
            {formError ? <p role="alert" className="text-sm text-danger">{formError}</p> : null}
            {status ? <p role="status" className="text-sm text-success">{status}</p> : null}
            <div className="flex justify-between border-t border-border pt-4">
              <Link
                to="/sports-facilities"
                className="inline-flex items-center justify-center rounded-md border border-border bg-surface px-3 py-2 text-sm font-semibold text-text transition-colors hover:brightness-110"
              >
                Back
              </Link>
              <Button type="submit" disabled={isSending}>{isSending ? 'Sending…' : 'Send message'}</Button>
            </div>
          </form>
        </Card>
      ) : null}
    </div>
  )
}

export default MessagePage
