import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import BrandLogo from '../components/BrandLogo'
import Select from '../components/ui/Select'

function LandingPage() {
  const navigate = useNavigate()
  const [sport, setSport] = useState('All')
  const [location, setLocation] = useState('')

  function handleSearch(event) {
    event.preventDefault()
    navigate(`/sports-facilities?category=${encodeURIComponent(sport)}&q=${encodeURIComponent(location)}`)
  }

  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-bg text-text">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-40">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_55%_45%,rgba(224,27,27,0.22),transparent_48%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(58,58,58,0.3)_1px,transparent_1px),linear-gradient(90deg,rgba(58,58,58,0.3)_1px,transparent_1px)] bg-[size:44px_44px] [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />
      </div>
      <header className="relative z-10 flex h-16 items-center justify-between px-5 sm:px-10">
        <BrandLogo className="brand-logo--large" />
        <nav className="flex items-center gap-2">
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
      <section className="relative z-10 flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-5xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-success">
              Your game starts here
            </p>
            <h1 className="mt-4 text-4xl font-black leading-tight tracking-tight sm:text-6xl">
              Find your court.
              <span className="block text-accent">Make your move.</span>
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-muted sm:text-base">
              Discover local sports facilities and reserve your next game in a few simple steps.
            </p>
          </div>
          <form
            onSubmit={handleSearch}
            className="mx-auto mt-9 grid max-w-3xl gap-2 rounded-card border border-border bg-surface/95 p-3 shadow-2xl sm:grid-cols-[1fr_180px_auto] sm:items-end"
          >
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-muted">Facility or area</span>
              <input
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                placeholder="Search facilities"
                className="h-10 w-full rounded-md border border-border bg-bg px-3 text-sm text-text placeholder:text-muted"
              />
            </label>
            <Select
              label="Sport"
              value={sport}
              onChange={(event) => setSport(event.target.value)}
              options={['All', 'Football', 'Basketball', 'Tennis', 'Badminton', 'Volleyball', 'Swimming']}
              className="h-10"
            />
            <button
              type="submit"
              className="h-10 rounded-md bg-accent px-5 text-sm font-bold text-white transition hover:brightness-110"
            >
              Find a court
            </button>
          </form>
          <div className="mt-10 flex flex-wrap justify-center gap-3 text-xs text-muted">
            <span className="rounded-full border border-border bg-surface/70 px-3 py-2">Easy online booking</span>
            <span className="rounded-full border border-border bg-surface/70 px-3 py-2">Clear availability</span>
            <span className="rounded-full border border-border bg-surface/70 px-3 py-2">Local sports venues</span>
          </div>
        </div>
      </section>
      <footer className="relative z-10 py-4 text-center text-xs text-muted">
        Find your game with <span className="font-bold text-brand">RESERVA</span>
        <span className="mx-2 text-border">|</span>
        <Link to="/owner/register" className="font-medium text-muted hover:text-text">
          Facility owner? List your venue
        </Link>
      </footer>
    </main>
  )
}

export default LandingPage
