import { useCallback, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import AsyncState from '../components/ui/AsyncState'
import PageHeading from '../components/ui/PageHeading'
import Select from '../components/ui/Select'
import useAsyncResource from '../hooks/useAsyncResource'
import { facilityService } from '../services/facilityService'

const categories = ['All', 'Football', 'Basketball', 'Tennis', 'Badminton', 'Volleyball', 'Swimming']
const visuals = {
  Football: 'from-red-700 to-red-950',
  Basketball: 'from-orange-600 to-amber-950',
  Tennis: 'from-green-600 to-emerald-950',
  Badminton: 'from-blue-600 to-indigo-950',
  Volleyball: 'from-fuchsia-700 to-purple-950',
  Swimming: 'from-cyan-600 to-blue-950',
}

function FacilitiesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get('q') ?? ''
  const category = searchParams.get('category') ?? 'All'
  const [searchValue, setSearchValue] = useState(query)
  const loader = useCallback(
    () => facilityService.searchFacilities({ query, category }),
    [query, category],
  )
  const { data, isLoading, error, reload } = useAsyncResource(loader)
  const facilities = data ?? []

  function updateFilters(nextQuery, nextCategory) {
    setSearchParams({ q: nextQuery, category: nextCategory })
  }

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <PageHeading
        title="Sports Facilities"
        description="Explore courts, compare rates, and check availability. You can browse without an account."
      />
      <div className="grid gap-3 rounded-card border border-border bg-surface p-3 sm:grid-cols-[1fr_220px]">
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-muted">Search facilities</span>
          <input
            value={searchValue}
            onChange={(event) => {
              const next = event.target.value
              setSearchValue(next)
              updateFilters(next, category)
            }}
            placeholder="Facility name or sport"
            className="h-10 w-full rounded-md border border-border bg-bg px-3 text-sm text-text placeholder:text-muted"
          />
        </label>
        <Select
          label="Sport category"
          value={category}
          onChange={(event) => updateFilters(query, event.target.value)}
          options={categories}
          className="h-10"
        />
      </div>
      <AsyncState loading={isLoading} error={error} onRetry={reload} empty={!isLoading && !error && facilities.length === 0} emptyMessage="No facilities match your search." />
      {!isLoading && !error && facilities.length ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {facilities.map((facility) => (
            <article key={facility.id} className="overflow-hidden rounded-card border border-border bg-surface">
              <div className={`flex h-32 items-center justify-center bg-gradient-to-br ${visuals[facility.sport] ?? 'from-sidebar to-bg'}`}>
                <span className="text-3xl font-black tracking-widest text-white/70">{facility.sport.slice(0, 2).toUpperCase()}</span>
              </div>
              <div className="space-y-3 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="text-sm font-bold text-text">{facility.name}</h2>
                    <p className="mt-1 text-xs text-muted">{facility.sport}</p>
                  </div>
                  <span className="whitespace-nowrap text-sm font-bold text-accent">{facility.price}</span>
                </div>
                <div className="flex items-center justify-between border-t border-border pt-3">
                  <span className="text-xs text-success">{facility.availability} available</span>
                  <Link
                    to={`/choose-schedule?facility=${facility.id}`}
                    className="rounded bg-accent px-3 py-2 text-xs font-bold text-white hover:brightness-110"
                  >
                    Book this court
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export default FacilitiesPage
