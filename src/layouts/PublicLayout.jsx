import { Link, Outlet } from 'react-router-dom'
import BrandLogo from '../components/BrandLogo'

function PublicLayout() {
  return (
    <div className="min-h-screen bg-bg text-text">
      <header className="flex h-16 items-center justify-between border-b border-border px-4 sm:px-8">
        <BrandLogo to="/" label="RESERVA home" className="brand-logo--large" />
        <nav aria-label="Account" className="flex items-center gap-2">
          <Link
            to="/"
            className="hidden rounded px-3 py-2 text-sm font-semibold text-muted transition-colors hover:text-text sm:inline-flex"
          >
            Home
          </Link>
          <Link
            to="/auth/login"
            className="rounded px-3 py-2 text-sm font-semibold text-text transition-colors hover:bg-surface"
          >
            Log in
          </Link>
          <Link
            to="/auth/signup"
            className="rounded-md bg-accent px-3 py-2 text-sm font-semibold text-white transition hover:brightness-110"
          >
            Register
          </Link>
        </nav>
      </header>
      <main className="px-4 py-5 sm:px-8 sm:py-7">
        <Outlet />
      </main>
    </div>
  )
}

export default PublicLayout
