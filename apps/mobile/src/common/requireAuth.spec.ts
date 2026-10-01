import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const identity = vi.hoisted(() => ({
  loginWithWechat: vi.fn(),
  loginWithDev: vi.fn(),
}))
const provider = vi.hoisted(() => ({
  isWechatMiniProgram: true,
  isDevIdentityEnabled: false,
  getWechatLoginCode: vi.fn(),
}))

vi.mock('@/common/identityProvider', () => provider)
vi.mock('@/common/launchLock', () => ({ launchLock: { waitReady: () => Promise.resolve(true) } }))
vi.mock('@/api/identity', () => ({ identityApi: identity }))

import { requireAuthThen } from './requireAuth'
import { useAuthStore } from '@/stores/auth'

const session = {
  tokens: {
    accessToken: 'access',
    refreshToken: 'refresh',
    accessExpiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    refreshExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  profile: { avatarUrl: '/static/icons/avatar-mine.png', nickname: '石头哥', stats: { mileage: 0, favorites: 0, checkins: 0 } },
}

describe('requireAuthThen', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    identity.loginWithWechat.mockReset().mockResolvedValue(session)
    provider.getWechatLoginCode.mockReset().mockResolvedValue('wx-code')
    vi.stubGlobal('uni', { showToast: vi.fn() })
  })

  it('runs the action right away when already signed in', async () => {
    useAuthStore().applySession(session)
    const action = vi.fn().mockResolvedValue('done')

    await expect(requireAuthThen(action)).resolves.toEqual({ ok: true, value: 'done' })
    expect(identity.loginWithWechat).not.toHaveBeenCalled()
  })

  it('signs in first and then runs the action once for a guest', async () => {
    const action = vi.fn().mockResolvedValue('favorited')

    const result = await requireAuthThen(action)

    // 游客点一次收藏：先静默登录，登录成功后自动完成收藏，不需要第二次点击
    expect(identity.loginWithWechat).toHaveBeenCalledWith('wx-code')
    expect(action).toHaveBeenCalledTimes(1)
    expect(result).toEqual({ ok: true, value: 'favorited' })
    expect(useAuthStore().isAuthenticated).toBe(true)
  })

  it('skips the action and reports failure when sign-in fails', async () => {
    identity.loginWithWechat.mockRejectedValueOnce(new Error('auth down'))
    const action = vi.fn().mockResolvedValue('favorited')

    await expect(requireAuthThen(action)).resolves.toEqual({ ok: false })
    expect(action).not.toHaveBeenCalled()
  })
})
