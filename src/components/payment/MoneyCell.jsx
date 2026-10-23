import { formatPHP } from '../../utils/fees'

function MoneyCell({ amount, className = '' }) {
  return <span className={className}>{formatPHP(amount)}</span>
}

export default MoneyCell
