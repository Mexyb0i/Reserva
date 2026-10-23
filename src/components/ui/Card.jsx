function Card({ children, className = '', padded = true, as: Element = 'section', ...props }) {
  return (
    <Element
      className={`rounded-card border border-border bg-surface ${padded ? 'p-4' : ''} ${className}`}
      {...props}
    >
      {children}
    </Element>
  )
}

export default Card
