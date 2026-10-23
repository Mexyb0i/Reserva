import { useId } from 'react'

function Select({
  label,
  value,
  onChange,
  options = [],
  className = '',
  appearance = 'dark',
  id,
  ...props
}) {
  const generatedId = useId()
  const selectId = id ?? generatedId
  const selectStyle =
    appearance === 'light'
      ? 'border-transparent bg-auth-input text-bg'
      : 'border-border bg-surface text-text'

  return (
    <div className="w-full">
      {label ? (
        <label htmlFor={selectId} className="mb-1.5 block text-xs font-medium text-muted">
          {label}
        </label>
      ) : null}
      <select
        id={selectId}
        value={value}
        onChange={onChange}
        className={`w-full rounded-md border px-3 py-2 text-sm transition-colors focus:border-accent ${selectStyle} ${className}`}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value ?? option} value={option.value ?? option}>
            {option.label ?? option}
          </option>
        ))}
      </select>
    </div>
  )
}

export default Select
