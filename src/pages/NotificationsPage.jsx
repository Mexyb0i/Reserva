import { useCallback, useState } from 'react'
import AsyncState from '../components/ui/AsyncState'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import PageHeading from '../components/ui/PageHeading'
import useAsyncResource from '../hooks/useAsyncResource'
import { userService } from '../services/userService'

const notificationStyles = {
  success: { tone: 'success', symbol: '✓', className: 'bg-success/15 text-success' },
  info: { tone: 'info', symbol: 'i', className: 'bg-info/15 text-info' },
  warning: { tone: 'pending', symbol: '!', className: 'bg-accent/15 text-accent' },
  danger: { tone: 'danger', symbol: '×', className: 'bg-danger/15 text-danger' },
}

function NotificationsPage() {
  const loader = useCallback(() => userService.getNotifications(), [])
  const { data, isLoading, error, reload } = useAsyncResource(loader)
  const [isUpdating, setIsUpdating] = useState(false)
  const [updateError, setUpdateError] = useState('')
  const notifications = data ?? []
  const unreadCount = notifications.filter((item) => item.unread).length

  async function markAllRead() {
    setIsUpdating(true)
    setUpdateError('')
    try {
      await userService.markAllNotificationsRead()
      reload()
    } catch (updateFailure) {
      setUpdateError(updateFailure instanceof Error ? updateFailure.message : 'Notifications could not be updated.')
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <PageHeading
        title="Notifications"
        description={unreadCount ? `You have ${unreadCount} unread updates.` : 'You’re all caught up.'}
        action={
          <Button variant="secondary" disabled={!unreadCount || isUpdating} onClick={markAllRead}>
            {isUpdating ? 'Updating…' : 'Mark all as read'}
          </Button>
        }
      />
      {updateError ? <p role="alert" className="text-sm text-danger">{updateError}</p> : null}
      <AsyncState loading={isLoading} error={error} onRetry={reload} empty={!isLoading && !error && !notifications.length} emptyMessage="You have no notifications." />
      {!isLoading && !error && notifications.length ? (
        <ul className="space-y-2">
          {notifications.map((notification) => {
            const style = notificationStyles[notification.type] ?? notificationStyles.info
            return (
              <li key={notification.id}>
                <Card className={`flex items-start gap-3 ${notification.unread ? 'border-l-2 border-l-accent' : ''}`}>
                  <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-bold ${style.className}`} aria-hidden="true">
                    {style.symbol}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h2 className="text-sm font-semibold">{notification.title}</h2>
                      <div className="flex items-center gap-2">
                        {notification.unread ? <Badge tone="pending">New</Badge> : null}
                        <time className="text-xs text-muted">{notification.time}</time>
                      </div>
                    </div>
                    <p className="mt-1 text-sm leading-5 text-muted">{notification.message}</p>
                  </div>
                  {notification.unread ? <span aria-label="Unread" className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" /> : null}
                </Card>
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}

export default NotificationsPage
