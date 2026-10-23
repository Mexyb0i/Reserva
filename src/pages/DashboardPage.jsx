import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import StatCard from '../components/ui/StatCard'
import { facilityService } from '../services/facilityService'
import { reservationService } from '../services/reservationService'

const facilityStyles = {
  Football: { color: 'bg-danger', icon: 'FB' },
  Basketball: { color: 'bg-accent', icon: 'BK' },
  Tennis: { color: 'bg-success', icon: 'TN' },
  Volleyball: { color: 'bg-info', icon: 'VB' },
  Badminton: { color: 'bg-brand', icon: 'BD' },
  Swimming: { color: 'bg-info', icon: 'SW' },
}

const statLabels = ['Active Reservations', 'Total Reservations', 'Pending Reservations']

function reservationTone(status) {
  if (status === 'Confirmed') return 'success'
  if (status === 'Pending') return 'pending'
  if (status === 'Cancelled') return 'danger'
  return 'neutral'
}

function DashboardPage() {
  const [dashboard, setDashboard] = useState(null)
  const [facilities, setFacilities] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let isCurrent = true

    async function loadDashboard() {
      setIsLoading(true)
      setError('')
      try {
        const [dashboardData, facilityData] = await Promise.all([
          reservationService.getDashboard(),
          facilityService.getFacilities(),
        ])
        if (isCurrent) {
          setDashboard(dashboardData)
          setFacilities(facilityData.slice(0, 3))
        }
      } catch (loadError) {
        if (isCurrent) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Dashboard information could not be loaded.',
          )
        }
      } finally {
        if (isCurrent) setIsLoading(false)
      }
    }

    loadDashboard()
    return () => {
      isCurrent = false
    }
  }, [attempt])

  if (isLoading) {
    return (
      <div role="status" className="rounded-card border border-border bg-surface p-6 text-sm text-muted">
        Loading your dashboard…
      </div>
    )
  }

  if (error) {
    return (
      <Card role="alert" className="border-danger/50">
        <h1 className="text-base font-bold">Dashboard unavailable</h1>
        <p className="mt-2 text-sm text-muted">{error}</p>
        <Button className="mt-4" onClick={() => setAttempt((current) => current + 1)}>
          Try again
        </Button>
      </Card>
    )
  }

  const reservations = dashboard?.reservations ?? []
  const statValues = dashboard?.stats ?? []

  return (
    <div className="mx-auto w-full max-w-6xl space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs text-muted">Your sports reservations</p>
          <h1 className="mt-1 text-xl font-bold text-text">Welcome back, Alex!</h1>
        </div>
        <Link to="/sports-facilities" className="text-xs font-semibold text-success hover:underline">
          Browse facilities
        </Link>
      </header>

      <section aria-label="Reservation statistics" className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {statLabels.map((label, index) => (
          <StatCard
            key={label}
            label={label}
            value={statValues[index] ?? 0}
            className="min-h-20"
          />
        ))}
      </section>

      <Card className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-bold text-text">Upcoming Reservations</h2>
          <Link
            to="/reserved-schedule"
            className="text-xs font-semibold text-success hover:underline"
          >
            View all
          </Link>
        </div>
        {reservations.length ? (
          <ul className="divide-y divide-border">
            {reservations.map((reservation) => (
              <li
                key={reservation.id}
                className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0"
              >
                <div
                  aria-hidden="true"
                  className="h-12 w-14 shrink-0 overflow-hidden rounded border border-border bg-sidebar"
                >
                  {reservation.image ? (
                    <img
                      src={reservation.image}
                      alt=""
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : null}
                </div>
                <div className="min-w-36 flex-1">
                  <p className="text-sm font-semibold text-text">{reservation.name}</p>
                  <p className="mt-1 text-xs text-muted">
                    {reservation.date} <span aria-hidden="true">·</span> {reservation.time}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <Badge tone={reservationTone(reservation.status)}>{reservation.status}</Badge>
                  <span className="min-w-14 text-right text-sm font-bold text-accent">
                    {reservation.total}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-5 text-center text-sm text-muted">
            You don&apos;t have any upcoming reservations.
          </p>
        )}
      </Card>

      <section aria-labelledby="featured-title" className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 id="featured-title" className="text-sm font-bold text-text">
            Featured Facilities
          </h2>
          <Link
            to="/sports-facilities"
            className="text-xs font-semibold text-success hover:underline"
          >
            See all
          </Link>
        </div>
        {facilities.length ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {facilities.map((facility) => {
              const visual = facilityStyles[facility.sport] ?? {
                color: 'bg-sidebar',
                icon: facility.sport.slice(0, 2).toUpperCase(),
              }
              return (
                <Link
                  key={facility.id}
                  to="/sports-facilities"
                  className="group overflow-hidden rounded-card border border-border bg-surface transition-colors hover:border-muted"
                >
                  <div
                    aria-hidden="true"
                    className={`flex h-20 items-center justify-center ${visual.color}`}
                  >
                    <span className="text-2xl font-black text-white/90">{visual.icon}</span>
                  </div>
                  <div className="space-y-2 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-bold text-text group-hover:text-success">
                          {facility.name}
                        </h3>
                        <p className="mt-0.5 text-xs text-muted">{facility.sport}</p>
                      </div>
                      <span className="whitespace-nowrap text-xs font-bold text-accent">
                        {facility.price}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-t border-border pt-2">
                      <span className="text-xs text-success">{facility.availability} available</span>
                      <span className="text-xs font-semibold text-info">View facility</span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <Card>
            <p className="py-3 text-center text-sm text-muted">No featured facilities available.</p>
          </Card>
        )}
      </section>
    </div>
  )
}

export default DashboardPage
