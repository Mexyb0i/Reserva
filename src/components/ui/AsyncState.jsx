import Button from './Button'
import Card from './Card'

function AsyncState({ loading, error, onRetry, empty, emptyMessage = 'Nothing to show yet.' }) {
  if (loading) {
    return (
      <Card role="status" className="py-8 text-center text-sm text-muted">
        Loading…
      </Card>
    )
  }

  if (error) {
    return (
      <Card role="alert" className="border-danger/50">
        <p className="text-sm font-semibold text-text">Unable to load this page</p>
        <p className="mt-1 text-sm text-muted">{error}</p>
        {onRetry ? <Button className="mt-4" onClick={onRetry}>Try again</Button> : null}
      </Card>
    )
  }

  if (empty) {
    return (
      <Card className="py-8 text-center text-sm text-muted">
        {emptyMessage}
      </Card>
    )
  }

  return null
}

export default AsyncState
