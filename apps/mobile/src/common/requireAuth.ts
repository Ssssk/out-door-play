import { navigate } from '@/common/router'
import { launchLock } from '@/common/launchLock'
import { useAuthStore } from '@/stores/auth'

export async function requireAuth(returnTo: string) {
  await launchLock.waitReady()
  const authStore = useAuthStore()
  if (authStore.isAuthenticated) return true
  await navigate('/pages/login/index', { returnTo })
  return false
}
