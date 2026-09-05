import { defineStore } from 'pinia'
import { apiGet, apiPost, configureAuthTransport } from '../api/client'

export interface AdminActor {
  id: string
  username: string
  displayName: string
  roles: string[]
  permissions: string[]
}

interface SessionPayload { actor: AdminActor; csrfToken: string }

export const useAuthStore = defineStore('admin-auth', {
  state: () => ({ actor: null as AdminActor | null, initialized: false, initializing: null as Promise<void> | null }),
  getters: {
    authenticated: (state) => Boolean(state.actor),
    hasPermission: (state) => (permission?: string) => !permission || Boolean(state.actor?.permissions.includes(permission)),
  },
  actions: {
    async initialize() {
      if (this.initialized) return
      if (this.initializing) return this.initializing
      this.initializing = apiGet<SessionPayload>('/admin/auth/session')
        .then((session) => this.applySession(session))
        .catch(() => this.clearSession())
        .finally(() => { this.initialized = true; this.initializing = null })
      return this.initializing
    },
    async login(username: string, password: string) {
      const session = await apiPost<SessionPayload>('/admin/auth/login', { username, password })
      this.applySession(session)
      this.initialized = true
    },
    async logout() {
      try { await apiPost('/admin/auth/logout') } finally { this.clearSession(); this.initialized = true }
    },
    applySession(session: SessionPayload) {
      this.actor = session.actor
      configureAuthTransport({ csrfToken: session.csrfToken })
    },
    clearSession() {
      this.actor = null
      configureAuthTransport({ csrfToken: '' })
    },
  },
})
