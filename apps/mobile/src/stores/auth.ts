import { defineStore } from 'pinia'
import { identityApi, type SessionResult } from '@/api/identity'
import { installAuthSessionAdapter } from '@/common/authSession'
import type { UserProfile } from '@/types/domain'

export type AuthStatus = 'initializing' | 'anonymous' | 'authenticated' | 'refreshing' | 'expired'

const REFRESH_SKEW_MS = 30_000
let refreshInFlight: Promise<string | undefined> | undefined

export const useAuthStore = defineStore('auth', {
  state: () => ({
    status: 'initializing' as AuthStatus,
    accessToken: '',
    refreshToken: '',
    accessExpiresAt: '',
    refreshExpiresAt: '',
    profile: undefined as UserProfile | undefined,
  }),
  getters: {
    isAuthenticated: (state) => state.status === 'authenticated' && Boolean(state.accessToken),
  },
  actions: {
    installRequestAdapter() {
      installAuthSessionAdapter({
        prepareAccessToken: () => this.prepareAccessToken(),
        refreshAccessToken: () => this.refreshSession(),
        clearSession: () => this.clearSession('expired'),
      })
    },
    async initialize() {
      if (!this.refreshToken || !this.isFuture(this.refreshExpiresAt)) {
        this.clearSession('anonymous')
        return
      }
      await this.refreshSession()
    },
    async loginWithDev(handle: string) {
      this.applySession(await identityApi.loginWithDev(handle))
    },
    async loginWithWechat(code: string) {
      this.applySession(await identityApi.loginWithWechat(code))
    },
    async prepareAccessToken() {
      if (this.accessToken && this.isFuture(this.accessExpiresAt, REFRESH_SKEW_MS)) return this.accessToken
      if (this.refreshToken && this.isFuture(this.refreshExpiresAt)) return this.refreshSession()
      this.clearSession(this.refreshToken ? 'expired' : 'anonymous')
      return undefined
    },
    async refreshSession(): Promise<string | undefined> {
      if (refreshInFlight) return refreshInFlight
      if (!this.refreshToken || !this.isFuture(this.refreshExpiresAt)) {
        this.clearSession(this.refreshToken ? 'expired' : 'anonymous')
        return undefined
      }

      const token = this.refreshToken
      this.status = 'refreshing'
      refreshInFlight = identityApi.refresh(token)
        .then((result) => {
          this.applySession(result)
          return result.tokens.accessToken
        })
        .catch(() => {
          this.clearSession('expired')
          return undefined
        })
        .finally(() => { refreshInFlight = undefined })
      return refreshInFlight
    },
    async logout() {
      try {
        if (this.accessToken) await identityApi.logout()
      } finally {
        this.clearSession('anonymous')
      }
    },
    applySession(result: SessionResult) {
      const { tokens, profile } = result
      this.accessToken = tokens.accessToken
      this.refreshToken = tokens.refreshToken
      this.accessExpiresAt = tokens.accessExpiresAt
      this.refreshExpiresAt = tokens.refreshExpiresAt
      this.profile = profile
      this.status = 'authenticated'
    },
    setProfile(profile: UserProfile) {
      this.profile = profile
    },
    clearSession(status: Extract<AuthStatus, 'anonymous' | 'expired'> = 'anonymous') {
      this.accessToken = ''
      this.refreshToken = ''
      this.accessExpiresAt = ''
      this.refreshExpiresAt = ''
      this.profile = undefined
      this.status = status
    },
    isFuture(value: string, skewMs = 0) {
      const timestamp = Date.parse(value)
      return Number.isFinite(timestamp) && timestamp > Date.now() + skewMs
    },
  },
  persist: {
    key: 'CHUMEN_AUTH',
    storage: {
      getItem: (key) => uni.getStorageSync(key) || null,
      setItem: (key, value) => uni.setStorageSync(key, value),
    },
    paths: ['refreshToken', 'refreshExpiresAt'],
  },
})
