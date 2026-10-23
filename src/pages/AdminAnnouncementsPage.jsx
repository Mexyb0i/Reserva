import { useCallback, useState } from 'react'
import AsyncState from '../components/ui/AsyncState'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Modal from '../components/ui/Modal'
import PageHeading from '../components/ui/PageHeading'
import useAsyncResource from '../hooks/useAsyncResource'
import { adminService } from '../services/adminService'

function AdminAnnouncementsPage() {
  const loader = useCallback(() => adminService.getAnnouncements(), [])
  const { data, isLoading, error, reload } = useAsyncResource(loader)
  const [isOpen, setIsOpen] = useState(false)
  const [form, setForm] = useState({ title: '', message: '', audience: 'All users' })
  const [formError, setFormError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  async function publish(event) {
    event.preventDefault()
    setIsSaving(true)
    setFormError('')
    try {
      await adminService.createAnnouncement(form)
      setForm({ title: '', message: '', audience: 'All users' })
      setIsOpen(false)
      reload()
    } catch (saveError) {
      setFormError(saveError instanceof Error ? saveError.message : 'Announcement could not be published.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <PageHeading title="Announcements" description="Publish platform updates for players and facility owners." />
        <Button onClick={() => { setIsOpen(true); setFormError('') }}>Create announcement</Button>
      </div>
      <AsyncState loading={isLoading} error={error} onRetry={reload} empty={!isLoading && !error && !data?.length} emptyMessage="No announcements have been published." />
      {!isLoading && !error && data?.length ? (
        <div className="space-y-3">
          {data.map((announcement) => (
            <Card key={announcement.id}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div><h2 className="text-sm font-bold">{announcement.title}</h2><p className="mt-2 text-sm leading-6 text-muted">{announcement.message}</p></div>
                <span className="rounded bg-info/15 px-2 py-1 text-[10px] font-semibold text-info">{announcement.audience}</span>
              </div>
              <p className="mt-3 border-t border-border pt-3 text-[10px] text-muted">Published {announcement.publishedAt}</p>
            </Card>
          ))}
        </div>
      ) : null}
      <Modal open={isOpen} onClose={() => setIsOpen(false)} title="Create announcement">
        <form onSubmit={publish} className="space-y-3">
          <label className="block"><span className="mb-1.5 block text-xs font-medium text-muted">Title</span><input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className="h-10 w-full rounded-md border border-border bg-bg px-3 text-sm text-text" /></label>
          <label className="block"><span className="mb-1.5 block text-xs font-medium text-muted">Message</span><textarea required rows="4" value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-text" /></label>
          <label className="block"><span className="mb-1.5 block text-xs font-medium text-muted">Audience</span><select value={form.audience} onChange={(event) => setForm({ ...form, audience: event.target.value })} className="h-10 w-full rounded-md border border-border bg-bg px-3 text-sm text-text"><option>All users</option><option>Players</option><option>Facility owners</option></select></label>
          {formError ? <p role="alert" className="text-sm text-danger">{formError}</p> : null}
          <div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setIsOpen(false)}>Cancel</Button><Button type="submit" disabled={isSaving}>{isSaving ? 'Publishing…' : 'Publish'}</Button></div>
        </form>
      </Modal>
    </div>
  )
}

export default AdminAnnouncementsPage
