import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import BrandLogo from '../components/BrandLogo'
import Button from '../components/ui/Button'
import { ownerService } from '../services/ownerService'

const initialDraft = {
  fullName: '',
  email: '',
  phone: '',
  businessName: '',
  businessAddress: '',
  businessContact: '',
  ownership: '',
  facilityName: '',
  sport: 'Football',
  courtCount: '1',
  hourlyRate: '',
  openingTime: '08:00',
  closingTime: '22:00',
  amenities: [],
  photoNames: [],
}

const sportOptions = ['Football', 'Basketball', 'Tennis', 'Badminton', 'Volleyball', 'Swimming']
const amenityOptions = ['Changing rooms', 'Parking', 'Showers', 'Equipment rental', 'Spectator seating', 'Lighting']
const steps = [
  { title: 'Owner account', description: 'Your contact details' },
  { title: 'Business details', description: 'Your facility business' },
  { title: 'First facility', description: 'Create your first listing' },
  { title: 'Review', description: 'Check before submitting' },
]

function OwnerRegisterPage() {
  const navigate = useNavigate()
  const [draft, setDraft] = useState(initialDraft)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [step, setStep] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [isSubmitted, setIsSubmitted] = useState(false)

  useEffect(() => {
    let current = true
    ownerService.getApplicationStatus()
      .then((application) => {
        if (current && application) {
          setIsSubmitted(true)
          navigate('/owner/application', { replace: true })
          return null
        }
        return ownerService.getApplicationDraft()
      })
      .then((savedDraft) => {
        if (current && savedDraft) {
          setDraft({ ...initialDraft, ...savedDraft })
          setStep(0)
        }
      })
      .catch((loadError) => {
        if (current) setError(loadError instanceof Error ? loadError.message : 'Your saved application could not be loaded.')
      })
      .finally(() => {
        if (current) setIsLoading(false)
      })
    return () => {
      current = false
    }
  }, [navigate])

  const updateDraft = (field, value) => {
    setDraft((current) => ({ ...current, [field]: value }))
    setFieldErrors((current) => ({ ...current, [field]: '' }))
    setError('')
  }

  function validateStep() {
    const errors = {}
    if (step === 0) {
      if (!draft.fullName.trim()) errors.fullName = 'Enter your full name.'
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim())) errors.email = 'Enter a valid email address.'
      if (!/^[+()\d\s-]{7,20}$/.test(draft.phone.trim())) errors.phone = 'Enter a valid phone number.'
      if (password.length < 8) errors.password = 'Use at least 8 characters.'
      if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match.'
    }
    if (step === 1) {
      if (!draft.businessName.trim()) errors.businessName = 'Enter your business or facility name.'
      if (!draft.businessAddress.trim()) errors.businessAddress = 'Enter the full facility address.'
      if (!/^[+()\d\s-]{7,20}$/.test(draft.businessContact.trim())) errors.businessContact = 'Enter a valid business phone number.'
      if (!draft.ownership) errors.ownership = 'Select your relationship to this business.'
    }
    if (step === 2) {
      if (!draft.facilityName.trim()) errors.facilityName = 'Enter a name for your first facility.'
      if (!Number.isInteger(Number(draft.courtCount)) || Number(draft.courtCount) < 1) errors.courtCount = 'Enter at least one court or playing area.'
      if (!Number.isFinite(Number(draft.hourlyRate)) || Number(draft.hourlyRate) < 1) errors.hourlyRate = 'Enter an hourly rate greater than zero.'
      if (!draft.openingTime || !draft.closingTime || draft.openingTime >= draft.closingTime) errors.hours = 'Closing time must be later than opening time.'
    }
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function saveDraft(nextStep) {
    setError('')
    setIsSaving(true)
    try {
      const { password: ignoredPassword, confirmPassword: ignoredConfirmation, ...safeDraft } = draft
      void ignoredPassword
      void ignoredConfirmation
      await ownerService.saveApplicationDraft({ ...safeDraft, step: nextStep })
      setStep(nextStep)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Your progress could not be saved.')
    } finally {
      setIsSaving(false)
    }
  }

  async function continueStep(event) {
    event.preventDefault()
    if (!validateStep()) return
    await saveDraft(step + 1)
  }

  async function submitApplication() {
    setIsSaving(true)
    setError('')
    try {
      await ownerService.registerOwnerAccount({
        fullName: draft.fullName,
        email: draft.email,
        phone: draft.phone,
        password,
      })
      const { photoNames, ...applicationDraft } = draft
      const application = await ownerService.submitApplication({
        owner: {
          fullName: applicationDraft.fullName.trim(),
          email: applicationDraft.email.trim(),
          phone: applicationDraft.phone.trim(),
        },
        business: {
          name: applicationDraft.businessName.trim(),
          address: applicationDraft.businessAddress.trim(),
          contact: applicationDraft.businessContact.trim(),
          ownership: applicationDraft.ownership,
        },
        facility: {
          name: applicationDraft.facilityName.trim(),
          sport: applicationDraft.sport,
          courtCount: Number(applicationDraft.courtCount),
          hourlyRate: Number(applicationDraft.hourlyRate),
          openingTime: applicationDraft.openingTime,
          closingTime: applicationDraft.closingTime,
          amenities: [...applicationDraft.amenities],
          photoNames: [...photoNames],
        },
      })
      setIsSubmitted(true)
      navigate('/owner/application', { state: { application } })
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Your application could not be submitted.')
    } finally {
      setIsSaving(false)
    }
  }

  if (isSubmitted) return <Navigate to="/owner/application" replace />

  return (
    <main className="min-h-screen bg-bg px-3 py-4 text-text sm:px-6 sm:py-8">
      <div className="mx-auto max-w-4xl">
        <header className="flex items-center justify-between gap-3">
          <BrandLogo className="brand-logo--large" />
          <Link to="/" className="text-xs font-semibold text-muted hover:text-text">Back to player site</Link>
        </header>
        <div className="mx-auto mt-8 max-w-3xl">
          <p className="text-center text-xs font-bold uppercase tracking-[.18em] text-accent">Facility partner onboarding</p>
          <h1 className="mt-2 text-center text-2xl font-bold sm:text-3xl">List your facility on RESERVA</h1>
          <p className="mx-auto mt-2 max-w-xl text-center text-sm leading-6 text-muted">
            Create your owner account, add your business details, then submit your first facility for review.
          </p>

          <nav aria-label="Application steps" className="mt-7 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {steps.map((item, index) => (
              <div
                key={item.title}
                aria-current={step === index ? 'step' : undefined}
                className={`rounded-md border px-3 py-2 ${step === index ? 'border-accent bg-accent/10' : 'border-border bg-surface'}`}
              >
                <p className={`text-xs font-bold ${step === index ? 'text-accent' : index < step ? 'text-success' : 'text-muted'}`}>
                  <span className="mr-1.5">{index < step ? '✓' : `0${index + 1}`}</span>{item.title}
                </p>
                <p className="mt-1 hidden text-[10px] text-muted sm:block">{item.description}</p>
              </div>
            ))}
          </nav>

          <section className="mt-4 rounded-card border border-border bg-surface p-4 sm:p-6">
            {isLoading ? <p role="status" className="py-10 text-center text-sm text-muted">Loading your saved progress…</p> : null}
            {!isLoading && step === 0 ? (
              <form onSubmit={continueStep} className="space-y-4">
                <div>
                  <h2 className="text-lg font-bold">Create your owner account</h2>
                  <p className="mt-1 text-xs text-muted">These details are for your RESERVA sign-in and account contact.</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <OwnerInput label="Full name" value={draft.fullName} onChange={(value) => updateDraft('fullName', value)} error={fieldErrors.fullName} autoComplete="name" />
                  <OwnerInput label="Email address" type="email" value={draft.email} onChange={(value) => updateDraft('email', value)} error={fieldErrors.email} autoComplete="email" />
                  <OwnerInput label="Phone number" type="tel" value={draft.phone} onChange={(value) => updateDraft('phone', value)} error={fieldErrors.phone} autoComplete="tel" />
                  <span className="hidden sm:block" />
                  <OwnerInput label="Password" type="password" value={password} onChange={setPassword} error={fieldErrors.password} autoComplete="new-password" />
                  <OwnerInput label="Confirm password" type="password" value={confirmPassword} onChange={setConfirmPassword} error={fieldErrors.confirmPassword} autoComplete="new-password" />
                </div>
                <p className="rounded border border-info/30 bg-info/10 px-3 py-2 text-xs leading-5 text-muted">
                  Passwords are never included in saved drafts. If you leave and return before submitting, you’ll need to enter it again.
                </p>
                <StepActions isSaving={isSaving} />
              </form>
            ) : null}
            {!isLoading && step === 1 ? (
              <form onSubmit={continueStep} className="space-y-4">
                <div>
                  <h2 className="text-lg font-bold">Tell us about your business</h2>
                  <p className="mt-1 text-xs text-muted">Use the address where customers will visit your facility.</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <OwnerInput label="Business or facility business name" value={draft.businessName} onChange={(value) => updateDraft('businessName', value)} error={fieldErrors.businessName} />
                  <OwnerInput label="Business contact number" type="tel" value={draft.businessContact} onChange={(value) => updateDraft('businessContact', value)} error={fieldErrors.businessContact} />
                  <OwnerInput label="Full facility address" value={draft.businessAddress} onChange={(value) => updateDraft('businessAddress', value)} error={fieldErrors.businessAddress} className="sm:col-span-2" />
                  <label className="block sm:col-span-2">
                    <span className="mb-1.5 block text-xs font-medium text-muted">Your relationship to the business</span>
                    <select value={draft.ownership} onChange={(event) => updateDraft('ownership', event.target.value)} className="h-10 w-full rounded-md border border-border bg-bg px-3 text-sm text-text">
                      <option value="">Choose one</option>
                      <option value="Owner">I am the owner</option>
                      <option value="Authorized manager">I am an authorized manager</option>
                      <option value="Representative">I represent the business</option>
                    </select>
                    {fieldErrors.ownership ? <FieldError>{fieldErrors.ownership}</FieldError> : null}
                  </label>
                </div>
                <p className="rounded border border-border bg-bg px-3 py-2 text-xs leading-5 text-muted">
                  Verification requirements will be shown before submission if additional business information is needed.
                </p>
                <StepActions onBack={() => saveDraft(0)} isSaving={isSaving} />
              </form>
            ) : null}
            {!isLoading && step === 2 ? (
              <form onSubmit={continueStep} className="space-y-4">
                <div>
                  <h2 className="text-lg font-bold">Create your first facility listing</h2>
                  <p className="mt-1 text-xs text-muted">You can add more courts and venues after your account is approved.</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <OwnerInput label="Facility listing name" value={draft.facilityName} onChange={(value) => updateDraft('facilityName', value)} error={fieldErrors.facilityName} />
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-medium text-muted">Sport or facility type</span>
                    <select value={draft.sport} onChange={(event) => updateDraft('sport', event.target.value)} className="h-10 w-full rounded-md border border-border bg-bg px-3 text-sm text-text">
                      {sportOptions.map((sport) => <option key={sport}>{sport}</option>)}
                    </select>
                  </label>
                  <OwnerInput label="Number of courts / playing areas" type="number" min="1" value={draft.courtCount} onChange={(value) => updateDraft('courtCount', value)} error={fieldErrors.courtCount} />
                  <OwnerInput label="Hourly rate (₱)" type="number" min="1" value={draft.hourlyRate} onChange={(value) => updateDraft('hourlyRate', value)} error={fieldErrors.hourlyRate} />
                  <OwnerInput label="Opening time" type="time" value={draft.openingTime} onChange={(value) => updateDraft('openingTime', value)} />
                  <OwnerInput label="Closing time" type="time" value={draft.closingTime} onChange={(value) => updateDraft('closingTime', value)} />
                </div>
                {fieldErrors.hours ? <FieldError>{fieldErrors.hours}</FieldError> : null}
                <fieldset>
                  <legend className="mb-2 text-xs font-medium text-muted">Amenities (optional)</legend>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {amenityOptions.map((amenity) => (
                      <label key={amenity} className="flex items-center gap-2 rounded border border-border bg-bg px-3 py-2 text-xs text-text">
                        <input
                          type="checkbox"
                          checked={draft.amenities.includes(amenity)}
                          onChange={(event) => updateDraft(
                            'amenities',
                            event.target.checked
                              ? [...draft.amenities, amenity]
                              : draft.amenities.filter((item) => item !== amenity),
                          )}
                          className="accent-success"
                        />
                        {amenity}
                      </label>
                    ))}
                  </div>
                </fieldset>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-muted">Facility photos (optional)</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(event) => updateDraft('photoNames', Array.from(event.target.files ?? []).map((file) => file.name))}
                    className="block w-full rounded-md border border-border bg-bg px-3 py-2 text-xs text-muted file:mr-3 file:rounded file:border-0 file:bg-sidebar file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-text"
                  />
                  <span className="mt-1 block text-[10px] text-muted">
                    {draft.photoNames.length ? `${draft.photoNames.length} photo${draft.photoNames.length === 1 ? '' : 's'} selected for this preview.` : 'Photo upload will be connected when secure file storage is available.'}
                  </span>
                </label>
                <StepActions onBack={() => saveDraft(1)} isSaving={isSaving} />
              </form>
            ) : null}
            {!isLoading && step === 3 ? (
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-bold">Review your application</h2>
                  <p className="mt-1 text-xs text-muted">Check the details before sending them for review.</p>
                </div>
                <ReviewSection title="Owner account" onEdit={() => saveDraft(0)} rows={[
                  ['Name', draft.fullName],
                  ['Email', draft.email],
                  ['Phone', draft.phone],
                ]} />
                <ReviewSection title="Business" onEdit={() => saveDraft(1)} rows={[
                  ['Business name', draft.businessName],
                  ['Address', draft.businessAddress],
                  ['Contact', draft.businessContact],
                  ['Relationship', draft.ownership],
                ]} />
                <ReviewSection title="First listing" onEdit={() => saveDraft(2)} rows={[
                  ['Facility', draft.facilityName],
                  ['Sport', draft.sport],
                  ['Courts / areas', draft.courtCount],
                  ['Hourly rate', `₱${new Intl.NumberFormat('en-PH').format(Number(draft.hourlyRate))}/hr`],
                  ['Operating hours', `${draft.openingTime}–${draft.closingTime}`],
                  ['Amenities', draft.amenities.length ? draft.amenities.join(', ') : 'None selected'],
                  ['Photos', draft.photoNames.length ? `${draft.photoNames.length} selected` : 'Not added'],
                ]} />
                <p className="rounded border border-accent/30 bg-accent/10 px-3 py-2 text-xs leading-5 text-muted">
                  Submitting creates a pending application. Your owner dashboard and booking management will stay unavailable until the facility listing is approved.
                </p>
                {error ? <p role="alert" className="text-sm text-danger">{error}</p> : null}
                <div className="flex flex-wrap justify-between gap-2 border-t border-border pt-4">
                  <Button variant="secondary" disabled={isSaving} onClick={() => saveDraft(2)}>Back</Button>
                  <Button disabled={isSaving} onClick={submitApplication}>{isSaving ? 'Submitting…' : 'Submit for review'}</Button>
                </div>
              </div>
            ) : null}
            {error && !isLoading && step < 3 ? <p role="alert" className="mt-4 text-sm text-danger">{error}</p> : null}
          </section>
          <p className="mt-4 text-center text-xs text-muted">
            Already have an owner application? <Link to="/owner/application" className="font-semibold text-accent hover:underline">Check its status</Link>
          </p>
        </div>
      </div>
    </main>
  )
}

function OwnerInput({ label, value, onChange, error, className = '', ...props }) {
  const id = `owner-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
  const errorId = `${id}-error`
  return (
    <label htmlFor={id} className={`block ${className}`}>
      <span className="mb-1.5 block text-xs font-medium text-muted">{label}</span>
      <input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? errorId : undefined}
        className="h-10 w-full rounded-md border border-border bg-bg px-3 text-sm text-text"
        {...props}
      />
      {error ? <FieldError id={errorId}>{error}</FieldError> : null}
    </label>
  )
}

function FieldError({ children, id }) {
  return <span id={id} role="alert" className="mt-1 block text-xs text-danger">{children}</span>
}

function StepActions({ onBack, isSaving }) {
  return (
    <div className="flex justify-between gap-2 border-t border-border pt-4">
      {onBack ? (
        <Button variant="secondary" type="button" disabled={isSaving} onClick={onBack}>Back</Button>
      ) : <span />}
      <Button type="submit" disabled={isSaving}>{isSaving ? 'Saving…' : 'Save and continue'}</Button>
    </div>
  )
}

function ReviewSection({ title, rows, onEdit }) {
  return (
    <section className="rounded-md border border-border bg-bg px-3 py-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-xs font-bold">{title}</h3>
        <button type="button" onClick={onEdit} className="text-xs font-semibold text-info hover:underline">Edit</button>
      </div>
      <dl className="grid gap-x-4 gap-y-2 sm:grid-cols-2">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-start justify-between gap-3 text-xs">
            <dt className="shrink-0 text-muted">{label}</dt>
            <dd className="text-right font-medium text-text">{value || '—'}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

export default OwnerRegisterPage
