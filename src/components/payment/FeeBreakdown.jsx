function FeeBreakdown({ rows }) {
  return (
    <dl className="divide-y divide-border">
      {rows.map((row) => (
        <div key={row.label} className="flex justify-between gap-3 py-3 text-sm">
          <dt className={row.emphasis ? 'font-bold text-text' : 'text-muted'}>{row.label}</dt>
          <dd className={`text-right ${row.emphasis ? 'font-bold text-accent' : 'font-medium text-text'}`}>{row.value}</dd>
        </div>
      ))}
    </dl>
  )
}

export default FeeBreakdown
