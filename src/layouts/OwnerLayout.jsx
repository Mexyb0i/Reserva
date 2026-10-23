import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import BrandLogo from '../components/BrandLogo'

const links = [
  { label: 'Overview', to: '/owner/dashboard' },
  { label: 'Facilities', to: '/owner/facilities' },
  { label: 'Reservation Requests', to: '/owner/requests' },
  { label: 'Reservation Calendar', to: '/owner/calendar' },
  { label: 'Earnings & Payments', to: '/owner/earnings' },
  { label: 'Customer Info', to: '/owner/customers' },
  { label: 'Customer Inquiries', to: '/owner/inquiries' },
  { label: 'Availability', to: '/owner/availability' },
]

function OwnerLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()
  const closeMenu = () => setMenuOpen(false)

  return (
    <div className="min-h-screen bg-bg text-text">
      <div className="flex min-h-screen">
        {menuOpen ? (
          <button
            type="button"
            aria-label="Close owner navigation"
            onClick={closeMenu}
            className="fixed inset-0 z-30 bg-bg/70 md:hidden"
          />
        ) : null}
        <aside
          aria-label="Facility management navigation"
          className={`fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-border bg-sidebar transition-transform md:static md:z-auto md:translate-x-0 ${
            menuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex h-14 items-center justify-between border-b border-border px-4">
            <BrandLogo className="brand-logo--small" />
            <span className="rounded bg-accent/15 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-accent">
              Owner
            </span>
          </div>
          <div className="border-b border-border px-4 py-4">
            <p className="text-sm font-semibold">Facility Manager</p>
            <p className="mt-1 text-xs text-muted">Manage your venues</p>
          </div>
          <nav className="flex-1 space-y-1 p-2">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={closeMenu}
                className={({ isActive }) =>
                  `block rounded px-3 py-2 text-sm transition-colors ${
                    isActive
                      ? 'bg-success/10 font-semibold text-success'
                      : 'text-muted hover:bg-surface hover:text-text'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
          <button
            type="button"
            onClick={() => {
              closeMenu()
              navigate('/')
            }}
            className="border-t border-border px-5 py-3 text-left text-xs text-muted transition-colors hover:text-text"
          >
            Back to RESERVA
          </button>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-14 items-center justify-between gap-3 border-b border-border bg-bg px-3 sm:px-5">
            <div className="flex items-center gap-3">
              <button
                type="button"
                aria-label="Open owner navigation"
                onClick={() => setMenuOpen(true)}
                className="rounded p-1.5 text-muted hover:bg-surface hover:text-text md:hidden"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden="true">
                  <path d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <span className="text-xs text-muted">Facility owner portal</span>
            </div>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="text-xs font-semibold text-muted hover:text-text"
            >
              View player site
            </button>
          </header>
          <main className="flex-1 p-3 sm:p-5">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}

export default OwnerLayout
