const availabilityStyles = {
  available: 'border-success bg-success text-bg hover:brightness-110',
  selected: 'border-accent bg-accent text-bg',
  limited: 'border-accent bg-accent/15 text-accent',
  taken: 'cursor-not-allowed border-danger bg-danger text-white',
}

function TimeSlot({
  children,
  availability = 'available',
  className = '',
  disabled = false,
  ...props
}) {
  const unavailable = availability === 'taken'

  return (
    <button
      type="button"
      aria-pressed={availability === 'selected'}
      disabled={unavailable || disabled}
      className={`min-w-20 rounded border px-2 py-2 text-xs font-semibold transition-colors ${availabilityStyles[availability]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export default TimeSlot
