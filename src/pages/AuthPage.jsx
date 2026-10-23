import { useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { authService } from '../services/authService'
import './AuthPage.css'

const authViews = {
  signup: {
    title: 'Create your account',
    subtitle: 'Join in and make your next game happen.',
    submit: 'Create account',
  },
  login: {
    title: 'Welcome back',
    subtitle: 'Sign in to get back in the game.',
    submit: 'Log in',
  },
  recovery: {
    title: 'Reset your password',
    subtitle: 'No worries. We’ll email you a link to get back in.',
    submit: 'Send recovery link',
  },
}

const fieldIcons = {
  name: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c.5-3.4 2.9-5.2 7-5.2s6.5 1.8 7 5.2" />
    </svg>
  ),
  email: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
      <path d="m4.5 7 7.5 5.5L19.5 7" />
    </svg>
  ),
  lock: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4.5" y="10" width="15" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3m-4 4v2" />
    </svg>
  ),
}

function AuthField({
  id,
  label,
  icon,
  type = 'text',
  value,
  onChange,
  error,
  autoComplete,
  showPassword,
  onTogglePassword,
  required = true,
}) {
  const inputType = type === 'password' && showPassword ? 'text' : type
  const errorId = `${id}-error`

  return (
    <div className={`auth-field${error ? ' auth-field--error' : ''}`}>
      <span className="auth-field__icon">{fieldIcons[icon]}</span>
      <input
        id={id}
        name={id}
        type={inputType}
        value={value}
        onChange={onChange}
        placeholder=" "
        autoComplete={autoComplete}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? errorId : undefined}
        required={required}
        className="auth-field__input"
      />
      <label htmlFor={id} className="auth-field__label">
        {label}
      </label>
      {type === 'password' ? (
        <button
          type="button"
          className="auth-field__toggle"
          onClick={onTogglePassword}
          aria-label={`${showPassword ? 'Hide' : 'Show'} ${label.toLowerCase()}`}
          aria-pressed={showPassword}
        >
          {showPassword ? (
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8" />
              <path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c5.5 0 9 7 9 7a14.7 14.7 0 0 1-3 3.7M6.2 6.2C3.8 7.8 3 12 3 12s3.5 7 9 7a9.7 9.7 0 0 0 3.1-.5" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M3 12s3.5-7 9-7 9 7 9 7-3.5 7-9 7-9-7-9-7Z" />
              <circle cx="12" cy="12" r="2.5" />
            </svg>
          )}
        </button>
      ) : null}
      {error ? (
        <p id={errorId} className="auth-field__error" role="alert" aria-live="polite">
          {error}
        </p>
      ) : null}
    </div>
  )
}

function AuthCheckbox({ children, checked, onChange }) {
  return (
    <label className="auth-checkbox">
      <input type="checkbox" checked={checked} onChange={onChange} />
      <span aria-hidden="true" className="auth-checkbox__box">
        <svg viewBox="0 0 16 16">
          <path d="m3.5 8.5 3 3 6-7" />
        </svg>
      </span>
      <span>{children}</span>
    </label>
  )
}

function SocialButtons() {
  return (
    <>
      <div className="auth-divider"><span>or continue with</span></div>
      <div className="auth-social">
        <button type="button" className="auth-social__button">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.4-.2-2.1H12v4h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.8 3-4.3 3-7.4Z" />
            <path fill="#34A853" d="M12 22c2.7 0 5-.9 6.7-2.4l-3.2-2.5c-.9.6-2.1 1-3.5 1-2.7 0-5-1.8-5.9-4.2H2.8v2.6A10 10 0 0 0 12 22Z" />
            <path fill="#FBBC05" d="M6.1 13.9a6 6 0 0 1 0-3.8V7.5H2.8a10 10 0 0 0 0 9Z" />
            <path fill="#EA4335" d="M12 5.9c1.5 0 2.9.5 3.9 1.6l2.9-2.9A9.8 9.8 0 0 0 12 2a10 10 0 0 0-9.2 5.5l3.3 2.6C7 7.7 9.3 5.9 12 5.9Z" />
          </svg>
          <span>Google</span>
        </button>
        <button type="button" className="auth-social__button">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path fill="currentColor" d="M16.7 12.8c0-2 1.6-3 1.7-3.1a3.7 3.7 0 0 0-2.9-1.6c-1.2-.1-2.4.7-3.1.7-.6 0-1.6-.7-2.6-.7a3.9 3.9 0 0 0-3.3 2c-1.4 2.4-.4 6 1 8 .7 1 1.5 2 2.5 2 1 0 1.3-.6 2.5-.6s1.5.6 2.5.6c1 0 1.7-.9 2.4-1.9.8-1.1 1.1-2.2 1.1-2.3-.1 0-2-.8-2-3.1ZM14.7 6.8c.5-.7.9-1.6.8-2.5-.8 0-1.8.5-2.4 1.2-.5.6-1 1.6-.8 2.4.9.1 1.8-.5 2.4-1.1Z" />
          </svg>
          <span>Apple</span>
        </button>
      </div>
    </>
  )
}

function passwordStrength(password) {
  if (!password) return 0
  return [
    password.length >= 8,
    /[A-Z]/.test(password) && /[a-z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length
}

function AuthPage() {
  const { view: routeView } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const requestedReturnTo = location.state?.from
  const returnTo =
    typeof requestedReturnTo === 'string' &&
    /^\/(choose-schedule|confirm-booking)(\?|$)/.test(requestedReturnTo)
      ? requestedReturnTo
      : '/dashboard'
  const view = authViews[routeView] ? routeView : 'signup'
  const [values, setValues] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState('')
  const [recoverySent, setRecoverySent] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [visiblePasswords, setVisiblePasswords] = useState({})
  const [keepLoggedIn, setKeepLoggedIn] = useState(true)
  const [rememberAccount, setRememberAccount] = useState(false)

  const updateValue = (field) => (event) => {
    setValues((current) => ({ ...current, [field]: event.target.value }))
    setErrors((current) => ({ ...current, [field]: '' }))
    setMessage('')
    setRecoverySent(false)
  }

  const togglePasswordVisibility = (field) => {
    setVisiblePasswords((current) => ({ ...current, [field]: !current[field] }))
  }

  function validate() {
    const nextErrors = {}
    if (view === 'signup' && !values.fullName.trim()) {
      nextErrors.fullName = 'Enter your full name.'
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
      nextErrors.email = 'Enter a valid email address.'
    }
    if (view !== 'recovery' && values.password.length < 8) {
      nextErrors.password = 'Use at least 8 characters.'
    }
    if (view === 'signup' && values.password !== values.confirmPassword) {
      nextErrors.confirmPassword = 'Passwords do not match.'
    }
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setMessage('')
    if (!validate()) return

    setIsSubmitting(true)
    try {
      if (view === 'signup') {
        await authService.signUp({
          fullName: values.fullName.trim(),
          email: values.email.trim(),
          password: values.password,
        })
        navigate(returnTo, { replace: true })
      } else if (view === 'login') {
        await authService.login({
          email: values.email.trim(),
          password: values.password,
        })
        navigate(returnTo, { replace: true })
      } else {
        const result = await authService.recover({ email: values.email.trim() })
        setRecoverySent(true)
        setMessage(result.message)
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to complete your request.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const strength = passwordStrength(values.password)
  const recoveryComplete = view === 'recovery' && recoverySent

  return (
    <div className="auth-content">
      {view !== 'recovery' ? (
        <div className="auth-switch" role="tablist" aria-label="Account access">
          <Link
            to="/auth/login"
            state={{ from: location.state?.from }}
            role="tab"
            aria-selected={view === 'login'}
            className={view === 'login' ? 'is-active' : ''}
          >
            Log in
          </Link>
          <Link
            to="/auth/signup"
            state={{ from: location.state?.from }}
            role="tab"
            aria-selected={view === 'signup'}
            className={view === 'signup' ? 'is-active' : ''}
          >
            Sign up
          </Link>
        </div>
      ) : null}

      {recoveryComplete ? (
        <div className="auth-success" role="status" aria-live="polite">
          <span className="auth-success__icon" aria-hidden="true">
            <svg viewBox="0 0 32 32">
              <path d="M6 10.5 16 18l10-7.5M7 8h18a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2Z" />
              <path d="m12.5 20 2 2 5-5" />
            </svg>
          </span>
          <h1>Check your inbox</h1>
          <p>We sent a recovery link to <strong>{values.email}</strong>. Follow the link to reset your password.</p>
          <Link to="/auth/login" state={{ from: location.state?.from }} className="auth-primary-link">Back to log in</Link>
        </div>
      ) : (
        <>
          {view === 'recovery' ? (
            <div className="auth-recovery-icon" aria-hidden="true">
              <svg viewBox="0 0 40 40">
                <rect x="7" y="17" width="26" height="19" rx="5" />
                <path d="M13 17v-5a7 7 0 0 1 14 0v5m-7 8v3" />
                <path d="m29 7 2 2 4-4" />
              </svg>
            </div>
          ) : null}
          <header className="auth-heading">
            <h1>{authViews[view].title}</h1>
            <p>{authViews[view].subtitle}</p>
          </header>

          <form onSubmit={handleSubmit} noValidate className="auth-form">
            {view === 'signup' ? (
              <AuthField
                id="fullName"
                label="Full name"
                icon="name"
                value={values.fullName}
                onChange={updateValue('fullName')}
                error={errors.fullName}
                autoComplete="name"
              />
            ) : null}
            <AuthField
              id="email"
              label="Email address"
              icon="email"
              type="email"
              value={values.email}
              onChange={updateValue('email')}
              error={errors.email}
              autoComplete="email"
            />
            {view !== 'recovery' ? (
              <AuthField
                id="password"
                label="Password"
                icon="lock"
                type="password"
                value={values.password}
                onChange={updateValue('password')}
                error={errors.password}
                autoComplete={view === 'signup' ? 'new-password' : 'current-password'}
                showPassword={Boolean(visiblePasswords.password)}
                onTogglePassword={() => togglePasswordVisibility('password')}
              />
            ) : null}
            {view === 'signup' ? (
              <>
                <div
                  className={`auth-strength auth-strength--${strength}`}
                  aria-label={`Password strength: ${['empty', 'weak', 'fair', 'good', 'strong'][strength]}`}
                  aria-live="polite"
                >
                  <div className="auth-strength__bars" aria-hidden="true">
                    {[1, 2, 3, 4].map((bar) => <span key={bar} className={bar <= strength ? 'filled' : ''} />)}
                  </div>
                  <span>{values.password ? ['Weak', 'Weak', 'Fair', 'Good', 'Strong'][strength] : 'Use 8+ characters for a strong password'}</span>
                </div>
                <AuthField
                  id="confirmPassword"
                  label="Confirm password"
                  icon="lock"
                  type="password"
                  value={values.confirmPassword}
                  onChange={updateValue('confirmPassword')}
                  error={errors.confirmPassword}
                  autoComplete="new-password"
                  showPassword={Boolean(visiblePasswords.confirmPassword)}
                  onTogglePassword={() => togglePasswordVisibility('confirmPassword')}
                />
              </>
            ) : null}

            {view === 'login' ? (
              <div className="auth-options">
                <AuthCheckbox checked={keepLoggedIn} onChange={(event) => setKeepLoggedIn(event.target.checked)}>
                  Keep me logged in
                </AuthCheckbox>
                <Link to="/auth/recovery" state={{ from: location.state?.from }} className="auth-text-link">Forgot password?</Link>
              </div>
            ) : null}
            {view === 'signup' ? (
              <AuthCheckbox checked={rememberAccount} onChange={(event) => setRememberAccount(event.target.checked)}>
                Remember my account name
              </AuthCheckbox>
            ) : null}

            {message ? (
              <p className={`auth-message${recoverySent ? ' auth-message--success' : ''}`} role={recoverySent ? 'status' : 'alert'} aria-live="polite">
                {message}
              </p>
            ) : null}

            <button type="submit" className="auth-submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <span className="auth-spinner" aria-hidden="true" />
                  {view === 'recovery' ? 'Sending link…' : 'Please wait…'}
                </>
              ) : authViews[view].submit}
            </button>
          </form>

          {view !== 'recovery' ? <SocialButtons /> : null}
          {view === 'recovery' ? (
            <p className="auth-recovery-return">
              Remember your password? <Link to="/auth/login" state={{ from: location.state?.from }} className="auth-text-link">Log in</Link>
            </p>
          ) : (
            <p className="auth-legal">
              By continuing, you agree to our <a href="#terms" className="auth-text-link">Terms</a> and{' '}
              <a href="#privacy" className="auth-text-link">Privacy Policy</a>.
            </p>
          )}
        </>
      )}
    </div>
  )
}

export default AuthPage
