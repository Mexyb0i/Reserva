import { useCallback, useState } from 'react'
import AsyncState from '../components/ui/AsyncState'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import PageHeading from '../components/ui/PageHeading'
import useAsyncResource from '../hooks/useAsyncResource'
import { userService } from '../services/userService'

const sports = ['Football', 'Basketball', 'Tennis', 'Badminton', 'Volleyball', 'Swimming']

function ProfilePage() {
  const loader = useCallback(() => userService.getProfile(), [])
  const { data, isLoading, error, reload } = useAsyncResource(loader)
  const [form, setForm] = useState(null)
  const [formError, setFormError] = useState('')
  const [saved, setSaved] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const profile = form ?? data

  function updateField(field, value) {
    setForm((current) => ({ ...(current ?? data), [field]: value }))
    setSaved(false)
    setFormError('')
  }

  function toggleSport(sport) {
    const selected = profile.preferredSports.includes(sport)
    updateField(
      'preferredSports',
      selected
        ? profile.preferredSports.filter((item) => item !== sport)
        : [...profile.preferredSports, sport],
    )
  }

  async function saveProfile(event) {
    event.preventDefault()
    if (!profile.name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email.trim())) {
      setFormError('Enter your name and a valid email address.')
      setSaved(false)
      return
    }
    setIsSaving(true)
    setFormError('')
    setSaved(false)
    try {
      await userService.saveProfile(profile)
      setForm(profile)
      setSaved(true)
    } catch (saveError) {
      setFormError(saveError instanceof Error ? saveError.message : 'Your profile could not be saved.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <PageHeading title="User Profile" description="Manage your account details and sports preferences." />
      <AsyncState loading={isLoading} error={error} onRetry={reload} />
      {profile ? (
        <form onSubmit={saveProfile} className="grid gap-4 lg:grid-cols-[250px_1fr]">
          <Card className="flex flex-col items-center text-center">
            <div className="grid h-20 w-20 place-items-center rounded-full border-2 border-success bg-success/15 text-2xl font-bold text-success">
              {profile.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()}
            </div>
            <h2 className="mt-3 text-sm font-bold">{profile.name}</h2>
            <p className="mt-1 text-xs text-muted">{profile.email}</p>
            <span className="mt-3 inline-flex items-center gap-1.5 text-xs text-success">
              <i className="h-1.5 w-1.5 rounded-full bg-success" /> Active account
            </span>
          </Card>
          <Card>
            <h2 className="border-b border-border pb-3 text-sm font-bold">Personal Information</h2>
            <div className="grid gap-3 py-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-muted">Full name</span>
                <input required value={profile.name} onChange={(event) => updateField('name', event.target.value)} className="h-10 w-full rounded-md border border-border bg-bg px-3 text-sm text-text" />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-muted">Email address</span>
                <input type="email" required value={profile.email} onChange={(event) => updateField('email', event.target.value)} className="h-10 w-full rounded-md border border-border bg-bg px-3 text-sm text-text" />
              </label>
              <label className="block sm:col-span-2">
                <span className="mb-1.5 block text-xs font-medium text-muted">Phone number</span>
                <input type="tel" value={profile.phone} onChange={(event) => updateField('phone', event.target.value)} className="h-10 w-full rounded-md border border-border bg-bg px-3 text-sm text-text sm:max-w-md" />
              </label>
            </div>
            <fieldset className="border-t border-border pt-4">
              <legend className="text-sm font-bold">Preferred Sports</legend>
              <p className="mt-1 text-xs text-muted">Choose the sports you’d like to see first.</p>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {sports.map((sport) => (
                  <label key={sport} className="flex cursor-pointer items-center gap-2 rounded border border-border bg-bg px-3 py-2 text-xs text-text hover:border-muted">
                    <input
                      type="checkbox"
                      checked={profile.preferredSports.includes(sport)}
                      onChange={() => toggleSport(sport)}
                      className="accent-success"
                    />
                    {sport}
                  </label>
                ))}
              </div>
            </fieldset>
            {formError ? <p role="alert" className="mt-4 text-sm text-danger">{formError}</p> : null}
            {saved ? <p role="status" className="mt-4 text-sm text-success">Profile changes saved.</p> : null}
            <div className="mt-4 border-t border-border pt-4">
              <Button type="submit" disabled={isSaving}>{isSaving ? 'Saving…' : 'Save Changes'}</Button>
            </div>
          </Card>
        </form>
      ) : null}
    </div>
  )
}

export default ProfilePage
