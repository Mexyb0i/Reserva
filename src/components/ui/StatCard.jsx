import Card from './Card'

function StatCard({ label, value, detail, className = '' }) {
  return (
    <Card className={className}>
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className="mt-2 text-2xl font-bold leading-none text-accent">{value}</p>
      {detail ? <p className="mt-2 text-xs text-muted">{detail}</p> : null}
    </Card>
  )
}

export default StatCard
