import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { refresh } = vi.hoisted(() => ({ refresh: vi.fn() }))
vi.mock('@/api/identity', () => ({
  identityApi: { refresh, loginWithDev: vi.fn(), loginWithWechat: vi.fn(), logout: vi.fn() },
}))

import { useAuthStore } from './auth'

describe('auth store refresh', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    refresh.mockReset()
  })

  it('shares one refresh request between concurrent callers', async () => {
    const store = useAuthStore()
    store.refreshToken = 'refresh-token'
    store.refreshExpiresAt = new Date(Date.now() + 60_000).toISOString()
    refresh.mockResolvedValue({
      tokens: {
        accessToken: 'new-access',
        refreshToken: 'new-refresh',
        accessExpiresAt: new Date(Date.now() + 60_000).toISOString(),
        refreshExpiresAt: new Date(Date.now() + 120_000).toISOString(),
      },
      profile: { avatarUrl: '/static/avatar.png', nickname: 'tester', stats: { mileage: 0, favorites: 0, checkins: 0 } },
    })

    const results = await Promise.all(Array.from({ length: 20 }, () => store.refreshSession()))
    expect(results).toEqual(Array.from({ length: 20 }, () => 'new-access'))
    expect(refresh).toHaveBeenCalledTimes(1)
    expect(store.status).toBe('authenticated')
  })
})
