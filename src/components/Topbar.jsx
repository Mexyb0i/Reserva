import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import BrandLogo from './BrandLogo'
import { authService } from '../services/authService'

function Topbar({ name = 'Alex Morgan', onMenuClick }) {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const profileMenuRef = useRef(null)
  const navigate = useNavigate()
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()

  useEffect(() => {
    if (!profileMenuOpen) return undefined

    function handlePointerDown(event) {
      if (!profileMenuRef.current?.contains(event.target)) setProfileMenuOpen(false)
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') setProfileMenuOpen(false)
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [profileMenuOpen])

  function signOut() {
    setProfileMenuOpen(false)
    authService.logout()
    navigate('/')
  }

  return (
    <header className="flex h-14 items-center justify-between gap-3 border-b border-border bg-bg px-3 sm:px-5">
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Open navigation menu"
          onClick={onMenuClick}
          className="rounded p-1.5 text-muted hover:bg-surface hover:text-text md:hidden"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden="true">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <BrandLogo to="/dashboard" label="RESERVA dashboard" className="brand-logo--small topbar-brand" />
      </div>
      <div className="ml-auto flex items-center gap-3">
        <Link
          to="/notifications"
          aria-label="View notifications"
          className="relative rounded p-1.5 text-muted hover:bg-surface hover:text-text"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden="true">
            <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
          </svg>
          <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-accent" />
        </Link>
        <div ref={profileMenuRef} className="relative">
          <button
            type="button"
            aria-haspopup="menu"
            aria-expanded={profileMenuOpen}
            onClick={() => setProfileMenuOpen((open) => !open)}
            className="flex items-center gap-2 rounded-full text-sm text-text hover:opacity-90"
          >
            <span className="hidden sm:inline">{name}</span>
            <span className="grid h-8 w-8 place-items-center rounded-full bg-success text-xs font-bold text-bg">
              {initials}
            </span>
            <svg
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              aria-hidden="true"
              className={`hidden h-3.5 w-3.5 text-muted transition-transform sm:block ${profileMenuOpen ? 'rotate-180' : ''}`}
            >
              <path d="m5 7.5 5 5 5-5" />
            </svg>
          </button>
          {profileMenuOpen ? (
            <div
              role="menu"
              aria-label="Account menu"
              className="absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-md border border-border bg-surface py-1 shadow-xl"
            >
              <Link
                to="/profile"
                role="menuitem"
                onClick={() => setProfileMenuOpen(false)}
                className="block px-4 py-2.5 text-sm text-text transition-colors hover:bg-sidebar"
              >
                User Profile
              </Link>
              <div className="my-1 border-t border-border" />
              <button
                type="button"
                role="menuitem"
                onClick={signOut}
                className="block w-full px-4 py-2.5 text-left text-sm font-medium text-danger transition-colors hover:bg-sidebar"
              >
                Sign Out
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  )
}

export default Topbar
