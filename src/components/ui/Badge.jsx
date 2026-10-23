const tones = {
  neutral: 'bg-border/40 text-muted',
  success: 'bg-success/15 text-success',
  pending: 'bg-accent/15 text-accent',
  danger: 'bg-danger/15 text-danger',
  info: 'bg-info/15 text-info',
}

function Badge({ children, tone = 'neutral', className = '' }) {
  return (
    <span
      className={`inline-flex items-center rounded px-2 py-1 text-xs font-semibold leading-none ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  )
}

export default Badge
