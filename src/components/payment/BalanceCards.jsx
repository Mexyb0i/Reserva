import StatCard from '../ui/StatCard'
import MoneyCell from './MoneyCell'

function BalanceCards({ balance }) {
  const cards = [
    { label: 'Available balance', amount: balance.available, detail: 'From completed bookings; available to withdraw' },
    { label: 'Pending balance', amount: balance.pending, detail: 'Bookings not yet completed or under dispute' },
    { label: 'Total earned', amount: balance.earned, detail: 'Net earnings after commission and refunds' },
    { label: 'Total withdrawn', amount: balance.withdrawn, detail: 'Net payouts received' },
  ]

  return (
    <section aria-label="Earnings balance" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <StatCard
          key={card.label}
          label={card.label}
          value={<MoneyCell amount={card.amount} />}
          detail={card.detail}
          className={card.amount < 0 ? 'border-danger/50' : ''}
        />
      ))}
    </section>
  )
}

export default BalanceCards
