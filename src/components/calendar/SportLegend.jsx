import { SPORT_COLORS } from '../../data/calendarData'

function SportLegend() {
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-bold">Legend</h2>
      <ul className="space-y-2.5">
        {Object.entries(SPORT_COLORS).map(([sport, color]) => (
          <li key={sport} className="flex items-center gap-2 text-xs text-muted">
            <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
            <span>{sport}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default SportLegend
