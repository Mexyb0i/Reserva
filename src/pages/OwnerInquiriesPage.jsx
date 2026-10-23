import { useCallback, useMemo, useState } from 'react'
import AsyncState from '../components/ui/AsyncState'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import PageHeading from '../components/ui/PageHeading'
import useAsyncResource from '../hooks/useAsyncResource'
import { ownerService } from '../services/ownerService'

const EMPTY_INQUIRIES = []
const statusTone = { Unread: 'pending', Read: 'info', Replied: 'success' }

function OwnerInquiriesPage() {
  const loader = useCallback(() => ownerService.getCustomerInquiries(), [])
  const { data, isLoading, error, reload } = useAsyncResource(loader)
  const [selectedId, setSelectedId] = useState('inq-101')
  const [query, setQuery] = useState('')
  const [reply, setReply] = useState('')
  const [actionError, setActionError] = useState('')
  const [isSending, setIsSending] = useState(false)
  const inquiries = data ?? EMPTY_INQUIRIES
  const filteredInquiries = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) return inquiries
    return inquiries.filter((inquiry) =>
      `${inquiry.customer} ${inquiry.email} ${inquiry.subject} ${inquiry.preview}`
        .toLowerCase()
        .includes(normalizedQuery),
    )
  }, [inquiries, query])
  const selectedInquiry = filteredInquiries.find((inquiry) => inquiry.id === selectedId) ?? filteredInquiries[0]

  async function selectInquiry(inquiry) {
    setSelectedId(inquiry.id)
    setReply('')
    setActionError('')
    if (inquiry.status !== 'Unread') return
    try {
      await ownerService.markInquiryRead(inquiry.id)
      reload()
    } catch (markError) {
      setActionError(markError instanceof Error ? markError.message : 'Inquiry could not be marked as read.')
    }
  }

  async function sendReply(event) {
    event.preventDefault()
    if (!selectedInquiry || !reply.trim()) return
    setIsSending(true)
    setActionError('')
    try {
      await ownerService.replyToInquiry(selectedInquiry.id, reply)
      setReply('')
      reload()
    } catch (sendError) {
      setActionError(sendError instanceof Error ? sendError.message : 'Your reply could not be sent.')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <PageHeading
        title="Customer Inquiries"
        description="Read customer messages and reply to questions about your facilities."
      />
      {actionError ? <p role="alert" className="text-sm text-danger">{actionError}</p> : null}
      <AsyncState
        loading={isLoading}
        error={error}
        onRetry={reload}
        empty={!isLoading && !error && inquiries.length === 0}
        emptyMessage="No customer inquiries yet."
      />
      {!isLoading && !error && inquiries.length ? (
        <div className="grid gap-4 lg:grid-cols-[minmax(250px,0.9fr)_minmax(0,1.5fr)]">
          <Card className="p-3">
            <label className="block">
              <span className="sr-only">Search inquiries</span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search name or email"
                className="h-9 w-full rounded-md border border-border bg-bg px-3 text-xs text-text placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              />
            </label>
            <h2 className="mb-2 mt-4 text-xs font-bold uppercase tracking-wide text-muted">Inquiries</h2>
            {filteredInquiries.length ? (
              <ul className="space-y-2">
                {filteredInquiries.map((inquiry) => (
                  <li key={inquiry.id}>
                    <button
                      type="button"
                      aria-pressed={selectedInquiry?.id === inquiry.id}
                      onClick={() => selectInquiry(inquiry)}
                      className={`w-full rounded-md border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                        selectedInquiry?.id === inquiry.id
                          ? 'border-info bg-info/10'
                          : 'border-border bg-bg hover:bg-sidebar'
                      }`}
                    >
                      <span className="flex items-start justify-between gap-2">
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-text">{inquiry.customer}</span>
                          <span className="mt-1 block truncate text-[11px] text-muted">{inquiry.subject}</span>
                        </span>
                        <Badge tone={statusTone[inquiry.status] ?? 'neutral'}>{inquiry.status}</Badge>
                      </span>
                      <span className="mt-2 block line-clamp-2 text-xs leading-5 text-muted">{inquiry.preview}</span>
                      <span className="mt-2 block text-[10px] text-muted">{inquiry.receivedAt}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-md border border-dashed border-border p-4 text-center text-xs text-muted">
                No inquiries match your search.
              </p>
            )}
          </Card>
          <Card className="flex min-h-[420px] flex-col p-0">
            {selectedInquiry ? (
              <>
                <header className="border-b border-border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h2 className="truncate text-sm font-bold">{selectedInquiry.subject}</h2>
                      <p className="mt-1 text-xs text-muted">
                        {selectedInquiry.customer} · {selectedInquiry.email}
                      </p>
                    </div>
                    <Badge tone={statusTone[selectedInquiry.status] ?? 'neutral'}>{selectedInquiry.status}</Badge>
                  </div>
                </header>
                <ol aria-label="Conversation" className="flex-1 space-y-3 overflow-y-auto p-4">
                  {selectedInquiry.messages.map((message) => (
                    <li
                      key={message.id}
                      className={`max-w-[90%] rounded-md border p-3 ${
                        message.author === 'owner'
                          ? 'ml-auto border-accent/30 bg-accent/10'
                          : 'border-border bg-bg'
                      }`}
                    >
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                        {message.author === 'owner' ? 'You' : selectedInquiry.customer}
                      </p>
                      <p className="mt-1 whitespace-pre-wrap text-xs leading-5 text-text">{message.text}</p>
                      <p className="mt-2 text-right text-[10px] text-muted">{message.sentAt}</p>
                    </li>
                  ))}
                </ol>
                <form onSubmit={sendReply} className="border-t border-border p-3">
                  <label htmlFor="inquiry-reply" className="sr-only">Your reply</label>
                  <textarea
                    id="inquiry-reply"
                    rows="3"
                    value={reply}
                    onChange={(event) => setReply(event.target.value)}
                    placeholder="Write a reply to the customer…"
                    className="w-full resize-y rounded-md border border-border bg-bg px-3 py-2 text-xs text-text placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  />
                  <div className="mt-2 flex justify-end">
                    <Button type="submit" disabled={!reply.trim() || isSending}>
                      {isSending ? 'Sending…' : 'Send reply'}
                    </Button>
                  </div>
                </form>
              </>
            ) : (
              <p className="m-auto p-5 text-center text-sm text-muted">Select an inquiry to view the conversation.</p>
            )}
          </Card>
        </div>
      ) : null}
    </div>
  )
}

export default OwnerInquiriesPage
