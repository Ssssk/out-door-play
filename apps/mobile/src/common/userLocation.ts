import { getCurrentLocation } from '@/common/location'
import type { GeoPoint } from '@/common/location'
import { useAppStore } from '@/stores/app'
import { ref } from 'vue'

export type UserLocationStatus = 'idle' | 'loading' | 'ready' | 'denied'

/**
 * 确保拿到设备定位并写入 app store，供需要真实坐标的页面查询「附近」数据。
 * 未授权或获取失败时返回 null，调用方必须展示授权/重试状态，不能回落到演示数据。
 */
export function useUserLocation() {
  const appStore = useAppStore()
  const status = ref<UserLocationStatus>(appStore.location ? 'ready' : 'idle')

  async function ensureLocation(): Promise<GeoPoint | null> {
    status.value = 'loading'
    try {
      const point = await getCurrentLocation()
      if (point) {
        appStore.setLocation(point)
        status.value = 'ready'
        return point
      }
    } catch {
      // getCurrentLocation already normalizes platform failures to null; keep
      // this guard so a host-specific implementation cannot break the page.
    }

    // 不使用上一次坐标冒充当前定位；附近 POI 必须基于本次授权后的坐标查询。
    appStore.setLocation(null)
    status.value = 'denied'
    return null
  }

  /**
   * Open the host's privacy settings after the user has denied location.
   * Some targets (for example H5) do not expose openSetting, so the caller
   * can safely ignore a false return value and offer a normal retry instead.
   */
  function openLocationSettings(): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        if (typeof uni.openSetting !== 'function') {
          resolve(false)
          return
        }
        uni.openSetting({
          success: () => resolve(true),
          fail: () => resolve(false),
        })
      } catch {
        resolve(false)
      }
    })
  }

  return { ensureLocation, openLocationSettings, status }
}
