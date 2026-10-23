import { NavLink } from 'react-router-dom'
import BrandLogo from './BrandLogo'

const navigationItems = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Sports Facilities', to: '/sports-facilities' },
  { label: 'Reserved Schedule', to: '/reserved-schedule' },
  { label: 'Reservation History', to: '/reservation-history' },
  { label: 'My Friends', to: '/my-friends' },
]

function Sidebar({ open = false, onNavigate }) {
  return (
    <>
      {open ? (
        <button
          type="button"
          aria-label="Close navigation menu"
          className="fixed inset-0 z-30 bg-bg/70 md:hidden"
          onClick={onNavigate}
        />
      ) : null}
      <aside
        aria-label="Main navigation"
        className={`fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-border bg-sidebar transition-transform md:static md:z-auto md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-14 items-center border-b border-border px-4">
          <BrandLogo to="/dashboard" label="RESERVA dashboard" onClick={onNavigate} />
        </div>
        <nav className="flex-1 space-y-1 p-2">
          {navigationItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={({ isActive }) =>
                `block rounded px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? 'bg-success/10 font-semibold text-success'
                    : 'text-muted hover:bg-surface hover:text-text'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  )
}

export default Sidebar
