const variants = {
  primary: 'bg-accent text-white hover:brightness-110',
  secondary: 'border border-border bg-surface text-text hover:brightness-110',
  danger: 'bg-danger text-white hover:brightness-110',
  ghost: 'border border-border bg-transparent text-text hover:bg-surface',
  info: 'bg-info text-white hover:brightness-110',
  dark: 'bg-auth-button text-white hover:brightness-110',
}

function Button({
  children,
  variant = 'primary',
  className = '',
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export default Button
