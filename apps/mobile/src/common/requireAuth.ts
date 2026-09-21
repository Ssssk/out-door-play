import { getWechatLoginCode, isDevIdentityEnabled, isWechatMiniProgram } from '@/common/identityProvider'
import { launchLock } from '@/common/launchLock'
import { useAuthStore } from '@/stores/auth'

/** 未登录时直接静默登录（微信 wx.login），不再跳转独立登录页；登录成功返回 true。 */
export async function requireAuth(): Promise<boolean> {
  await launchLock.waitReady()
  const authStore = useAuthStore()
  if (authStore.isAuthenticated) return true
  try {
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
