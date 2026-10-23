import { friends, notifications, reviews, userProfile } from '../data/mockData'

const wait = (value) =>
  new Promise((resolve) => {
    setTimeout(() => resolve(value), 160)
  })

let currentProfile = { ...userProfile, preferredSports: [...userProfile.preferredSports] }
let currentFriends = friends.map((friend, index) => ({ ...friend, id: index + 1 }))
let currentNotifications = notifications.map((notification) => ({ ...notification }))
let currentReviews = reviews.map((review) => ({ ...review }))

export const userService = {
  async getProfile() {
    return wait({ ...currentProfile, preferredSports: [...currentProfile.preferredSports] })
  },

  async saveProfile(profile) {
    currentProfile = { ...currentProfile, ...profile }
    return wait({ ...currentProfile, preferredSports: [...currentProfile.preferredSports] })
  },

  async getFriends() {
    return wait([...currentFriends])
  },

  async addFriend(friend) {
    const added = {
      id: Date.now(),
      name: friend.name.trim(),
      sport: friend.sport.trim(),
      status: 'Offline',
      actions: ['Message', 'Remove'],
    }
    currentFriends = [added, ...currentFriends]
    return wait(added)
  },

  async removeFriend(id) {
    currentFriends = currentFriends.filter((friend) => friend.id !== id)
    return wait(true)
  },

  async getNotifications() {
    return wait([...currentNotifications])
  },

  async addNotification(notification) {
    if (!notification?.title?.trim() || !notification?.message?.trim()) {
      throw new Error('A notification title and message are required.')
    }
    const created = {
      id: `N-${Date.now()}`,
      title: notification.title.trim(),
      message: notification.message.trim(),
      time: 'Just now',
      unread: true,
      type: notification.type ?? 'info',
    }
    currentNotifications = [created, ...currentNotifications]
    return wait({ ...created })
  },

  async markAllNotificationsRead() {
    currentNotifications = currentNotifications.map((notification) => ({
      ...notification,
      unread: false,
    }))
    return wait([...currentNotifications])
  },

  async getReviews() {
    return wait([...currentReviews])
  },

  async submitReview(review) {
    const submitted = { id: Date.now(), user: currentProfile.name, ...review }
    currentReviews = [submitted, ...currentReviews]
    return wait(submitted)
  },

  async sendFacilityMessage(payload) {
    return wait({
      ok: true,
      message: `Your message was sent to facility ${payload.facilityId}.`,
      sent: { ...payload },
    })
  },

  async sendFriendMessage(payload) {
    return wait({
      ok: true,
      message: `Your message was sent to ${payload.friendName}.`,
      sent: { ...payload },
    })
  },
}
