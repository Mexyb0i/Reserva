import { useId } from 'react'

function Input({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  className = '',
  appearance = 'dark',
  error,
  id,
  ...props
}) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const inputStyle =
    appearance === 'light'
      ? 'border-transparent bg-auth-input text-bg placeholder:text-muted'
      : 'border-border bg-surface text-text placeholder:text-muted'

  return (
    <div className="w-full">
      {label ? (
        <label htmlFor={inputId} className="mb-1.5 block text-xs font-medium text-muted">
          {label}
        </label>
      ) : null}
      <input
        id={inputId}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        aria-invalid={error ? 'true' : undefined}
        className={`w-full rounded-md border px-3 py-2 text-sm transition-colors placeholder:opacity-80 focus:border-accent ${inputStyle} ${className}`}
        {...props}
      />
      {error ? <p className="mt-1 text-xs text-danger">{error}</p> : null}
    </div>
  )
}

export default Input
