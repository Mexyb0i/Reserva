import { useEffect, useId } from 'react'

function Modal({ open, onClose, title, children, footer, className = '' }) {
  const titleId = useId()

  useEffect(() => {
    if (!open) return undefined

    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-bg/80 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`w-full max-w-lg rounded-card border border-border bg-surface shadow-xl ${className}`}
      >
        <header className="flex items-center justify-between gap-4 border-b border-border px-4 py-3">
          <h2 id={titleId} className="text-base font-bold text-text">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded px-2 py-1 text-lg leading-none text-muted hover:text-text"
          >
            ×
          </button>
        </header>
        <div className="p-4">{children}</div>
        {footer ? <footer className="border-t border-border p-4">{footer}</footer> : null}
      </section>
    </div>
  )
}

export default Modal
