<script setup lang="ts">
import { onLaunch, onShow } from '@dcloudio/uni-app'
import { launchLock } from '@/common/launchLock'
import { AppUpdateManager } from '@/common/updateManager'
import { useAuthStore } from '@/stores/auth'

onLaunch(async () => {
  AppUpdateManager.checkUpdate()
  const authStore = useAuthStore()
  authStore.installRequestAdapter()
  try {
    await authStore.initialize()
  } finally {
    launchLock.unlock()
  }
})

onShow(() => {
  // 为后续定位、Socket 等恢复逻辑保留统一入口。
})
</script>

<style lang="scss">
@import './styles/tokens.scss';
@import './styles/global.scss';
</style>
