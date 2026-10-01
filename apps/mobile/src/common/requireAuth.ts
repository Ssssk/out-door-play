import { getWechatLoginCode, isDevIdentityEnabled, isWechatMiniProgram } from '@/common/identityProvider'
import { launchLock } from '@/common/launchLock'
import { useAuthStore } from '@/stores/auth'

/** 未登录时直接静默登录（微信 wx.login），不再跳转独立登录页；登录成功返回 true。 */
export async function requireAuth(options: { loginHint?: boolean } = {}): Promise<boolean> {
  await launchLock.waitReady()
  const authStore = useAuthStore()
  if (authStore.isAuthenticated) return true
  try {
    // 静默登录需要一点时间，给出可见反馈，避免用户以为点击没生效
    if (options.loginHint !== false) uni.showToast({ title: '正在登录…', icon: 'none', duration: 2000 })
    if (isWechatMiniProgram) {
      await authStore.loginWithWechat(await getWechatLoginCode())
      return true
    }
    if (isDevIdentityEnabled) {
      await authStore.loginWithDev('local-dev-user')
      return true
    }
  } catch { /* 静默登录失败按未登录处理 */ }
  uni.showToast({ title: '登录失败，请稍后重试', icon: 'none' })
  return false
}

export type AuthThenResult<T> = { ok: true; value: T } | { ok: false }

/**
 * 游客点击需要登录的操作（如收藏）时的标准流程：先完成静默登录，
 * 登录成功后**立刻自动执行一次动作**，用户不需要再点第二次。
 * 登录失败时不执行动作，返回 ok:false（此时已提示登录失败）。
 */
export async function requireAuthThen<T>(action: () => Promise<T>): Promise<AuthThenResult<T>> {
  if (!await requireAuth()) return { ok: false }
  return { ok: true, value: await action() }
}
