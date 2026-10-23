import { useCallback, useState } from 'react'
import AsyncState from '../components/ui/AsyncState'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import PageHeading from '../components/ui/PageHeading'
import Table from '../components/ui/Table'
import useAsyncResource from '../hooks/useAsyncResource'
import { userService } from '../services/userService'

function MyFriendsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [name, setName] = useState('')
  const [sport, setSport] = useState('')
  const [formError, setFormError] = useState('')
  const [busyId, setBusyId] = useState(null)
  const [selectedFriend, setSelectedFriend] = useState(null)
  const [friendMessage, setFriendMessage] = useState('')
  const [messageSent, setMessageSent] = useState('')
  const loader = useCallback(() => userService.getFriends(), [])
  const { data, isLoading, error, reload } = useAsyncResource(loader)
  const friends = data ?? []

  async function addFriend(event) {
    event.preventDefault()
    setFormError('')
    if (name.trim().length < 2 || !sport.trim()) {
      setFormError('Enter your friend’s name and favorite sport.')
      return
    }
    setBusyId('add')
    try {
      await userService.addFriend({ name, sport })
      setName('')
      setSport('')
      setIsModalOpen(false)
      reload()
    } catch (addError) {
      setFormError(addError instanceof Error ? addError.message : 'Could not add this friend.')
    } finally {
      setBusyId(null)
    }
  }

  async function removeFriend(friend) {
    setBusyId(friend.id)
    try {
      await userService.removeFriend(friend.id)
      reload()
    } catch (removeError) {
      setFormError(
        removeError instanceof Error ? removeError.message : 'Could not remove this friend. Please try again.',
      )
    } finally {
      setBusyId(null)
    }
  }

  async function sendFriendMessage(event) {
    event.preventDefault()
    setFormError('')
    if (friendMessage.trim().length < 2) {
      setFormError('Write a message before sending.')
      return
    }
    setBusyId('message')
    try {
      const result = await userService.sendFriendMessage({
        friendName: selectedFriend.name,
        message: friendMessage.trim(),
      })
      setMessageSent(result.message)
      setFriendMessage('')
    } catch (sendError) {
      setFormError(sendError instanceof Error ? sendError.message : 'Your message could not be sent.')
    } finally {
      setBusyId(null)
    }
  }

  const columns = [
    { key: 'name', label: 'Friend', render: (friend) => <span className="font-semibold">{friend.name}</span> },
    { key: 'sport', label: 'Favorite sport' },
    {
      key: 'status',
      label: 'Status',
      render: (friend) => <Badge tone={friend.status === 'Online' ? 'success' : 'neutral'}>{friend.status}</Badge>,
    },
    {
      key: 'actions',
      label: 'Actions',
      className: 'text-right',
      render: (friend) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="info"
            onClick={() => {
              setSelectedFriend(friend)
              setFormError('')
              setMessageSent('')
            }}
            className="px-2 py-1 text-xs"
          >
            {friend.status === 'Online' ? 'Message' : 'View'}
          </Button>
          <Button variant="danger" disabled={busyId === friend.id} onClick={() => removeFriend(friend)} className="px-2 py-1 text-xs">
            {busyId === friend.id ? '…' : 'Remove'}
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <PageHeading
        title="My Friends"
        description="Find your regular teammates and plan your next game."
        action={<Button onClick={() => setIsModalOpen(true)}>Add Friend</Button>}
      />
      {formError && !isModalOpen ? <p role="alert" className="text-sm text-danger">{formError}</p> : null}
      <AsyncState loading={isLoading} error={error} onRetry={reload} empty={!isLoading && !error && !friends.length} emptyMessage="Add a friend to start building your team." />
      {!isLoading && !error && friends.length ? <Table columns={columns} rows={friends} rowKey="id" caption="Your friends" /> : null}
      <Modal
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setFormError('')
        }}
        title="Add a Friend"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" form="add-friend-form" disabled={busyId === 'add'}>
              {busyId === 'add' ? 'Adding…' : 'Add Friend'}
            </Button>
          </div>
        }
      >
        <form id="add-friend-form" onSubmit={addFriend} className="space-y-3">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted">Friend&apos;s name</span>
            <input autoFocus value={name} onChange={(event) => setName(event.target.value)} className="h-10 w-full rounded-md border border-border bg-bg px-3 text-sm text-text" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted">Favorite sport</span>
            <input value={sport} onChange={(event) => setSport(event.target.value)} className="h-10 w-full rounded-md border border-border bg-bg px-3 text-sm text-text" />
          </label>
          {formError ? <p role="alert" className="text-sm text-danger">{formError}</p> : null}
        </form>
      </Modal>
      <Modal
        open={Boolean(selectedFriend)}
        onClose={() => {
          setSelectedFriend(null)
          setFormError('')
          setMessageSent('')
        }}
        title={selectedFriend?.status === 'Online' ? `Message ${selectedFriend?.name ?? ''}` : 'Friend Details'}
      >
        {selectedFriend ? (
          selectedFriend.status === 'Online' ? (
            <form onSubmit={sendFriendMessage} className="space-y-3">
              <p className="text-sm text-muted">Send a quick note to your friend.</p>
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-muted">Message</span>
                <textarea
                  rows="4"
                  value={friendMessage}
                  onChange={(event) => setFriendMessage(event.target.value)}
                  className="w-full resize-y rounded-md border border-border bg-bg px-3 py-2 text-sm text-text"
                />
              </label>
              {formError ? <p role="alert" className="text-sm text-danger">{formError}</p> : null}
              {messageSent ? <p role="status" className="text-sm text-success">{messageSent}</p> : null}
              <div className="flex justify-end">
                <Button type="submit" disabled={busyId === 'message'}>
                  {busyId === 'message' ? 'Sending…' : 'Send message'}
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-3">
              <div>
                <p className="text-base font-bold">{selectedFriend.name}</p>
                <p className="mt-1 text-sm text-muted">Favorite sport: {selectedFriend.sport}</p>
                <p className="mt-2 text-xs text-muted">Status: {selectedFriend.status}</p>
              </div>
              <Button variant="secondary" onClick={() => setSelectedFriend(null)}>Close</Button>
            </div>
          )
        ) : null}
      </Modal>
    </div>
  )
}

export default MyFriendsPage
