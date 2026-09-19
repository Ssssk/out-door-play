import { getCurrentLocation } from '@/common/location'
import type { GeoPoint } from '@/common/location'
import { useAppStore } from '@/stores/app'

/**
 * 确保拿到设备定位并写入 app store，供各页面按真实坐标计算「距你」距离。
 * 未授权或获取失败时返回 null，调用方回落到数据自带距离。
 */
export function useUserLocation() {
  const appStore = useAppStore()

  async function ensureLocation(): Promise<GeoPoint | null> {
    const point = await getCurrentLocation()
    if (point) appStore.setLocation(point)
    return point ?? appStore.location
  }

  return { ensureLocation }
}
