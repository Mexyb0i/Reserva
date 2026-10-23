const SESSION_KEY = 'reserva-user-session'

function saveSession(user) {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(user))
}

export const authService = {
  async login(payload) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const user = { name: 'Alex Rivera', email: payload.email }
        saveSession(user)
        resolve({ ok: true, user })
      }, 250)
    })
  },

  async signUp(payload) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const user = { name: payload.fullName, email: payload.email }
        saveSession(user)
        resolve({ ok: true, user })
      }, 250)
    })
  },

  isAuthenticated() {
    return Boolean(window.localStorage.getItem(SESSION_KEY))
  },

  logout() {
    window.localStorage.removeItem(SESSION_KEY)
  },

  async recover(payload) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ ok: true, message: `Recovery email sent to ${payload.email}` })
      }, 250)
    })
  },
}
