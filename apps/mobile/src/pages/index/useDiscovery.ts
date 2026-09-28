import { computed, ref, shallowRef } from 'vue'
import { onLoad, onPullDownRefresh, onUnload } from '@dcloudio/uni-app'
import { outdoorApi } from '@/api/outdoor'
import { launchLock } from '@/common/launchLock'
import { resolveDistanceKm } from '@/common/location'
import { useUserLocation } from '@/common/userLocation'
import { cities as localCities, driveRoutes, fishingSpots } from '@/data/mock'
import { useAppStore } from '@/stores/app'
import type { City, RouteCard, Scene } from '@/types/domain'

export type DiscoveryStatus = 'idle' | 'loading' | 'ready' | 'empty' | 'fallback' | 'error'

/** 排序用距离：无距离（定位未授权且数据未带距离）按无穷远处理，排在最后。 */
function sortableDistance(distanceKm: number | null | undefined) {
  return typeof distanceKm === 'number' && Number.isFinite(distanceKm) ? distanceKm : Number.POSITIVE_INFINITY
}

export function useDiscovery() {
  const appStore = useAppStore()
  const { ensureLocation } = useUserLocation()
  const scene = ref<Scene>('drive')
  const rawRoutes = shallowRef<RouteCard[]>([])
  const availableCities = shallowRef<City[]>([])
  const loading = ref(false)
  const citiesLoading = ref(false)
  const citiesFallback = ref(false)
  const status = ref<DiscoveryStatus>('idle')
  let requestSequence = 0
  let active = true
  let pendingKey: string | undefined
  let pendingRequest: Promise<void> | undefined

  // 拿到设备定位后按真实经纬度重算「距你」距离，并按距离由近到远排序；无定位时沿用数据自带距离。
  const routes = computed(() => {
    const items = rawRoutes.value.map((item) => {
      const distance = resolveDistanceKm(item, appStore.location)
      return distance === null ? item : { ...item, distanceKm: distance }
    })
    // 没有可用距离（界面显示「-」）的条目视为无穷远，保持原序沉底；距离相同的沿用榜单顺序
    return items
      .map((item, index) => ({ item, index, distance: sortableDistance(item.distanceKm) }))
      .sort((left, right) => left.distance - right.distance || left.index - right.index)
      .map((entry) => entry.item)
  })

  async function loadLocation() {
    await ensureLocation()
  }

  async function loadCities() {
    citiesLoading.value = true
    try {
      const items = await outdoorApi.cities()
      if (!active) return
      if (items.length === 0) throw new Error('No enabled cities')
      availableCities.value = items
      citiesFallback.value = false
    } catch {
      if (!active) return
      availableCities.value = localCities
      citiesFallback.value = true
    } finally {
      if (active) citiesLoading.value = false
    }

    if (!availableCities.value.some((city) => city.code === appStore.city.code)) {
      const firstCity = availableCities.value[0]
      if (firstCity) appStore.selectCity(firstCity)
    }
  }

  function loadRoutes(showFallbackToast = false) {
    const requestedScene = scene.value
    const requestedCity = appStore.city.code
    const requestKey = `${requestedCity}:${requestedScene}`
    if (pendingKey === requestKey && pendingRequest) return pendingRequest

    const request = executeRouteLoad(requestedCity, requestedScene, showFallbackToast)
    pendingKey = requestKey
    pendingRequest = request
    void request.finally(() => {
      if (pendingRequest === request) {
        pendingKey = undefined
        pendingRequest = undefined
      }
    })
    return request
  }

  async function executeRouteLoad(requestedCity: string, requestedScene: Scene, showFallbackToast: boolean) {
    loading.value = true
    const sequence = ++requestSequence
    if (rawRoutes.value.length === 0) status.value = 'loading'
    try {
      const items = await outdoorApi.routes(requestedCity, requestedScene)
      if (!active || sequence !== requestSequence) return
      rawRoutes.value = items
      status.value = items.length === 0 ? 'empty' : 'ready'
    } catch {
      if (!active || sequence !== requestSequence) return
      rawRoutes.value = requestedScene === 'drive' ? driveRoutes : fishingSpots
      status.value = rawRoutes.value.length === 0 ? 'error' : 'fallback'
      if (showFallbackToast) uni.showToast({ title: '暂时用本地推荐', icon: 'none' })
    } finally {
      if (active && sequence === requestSequence) {
        loading.value = false
        uni.stopPullDownRefresh()
      }
    }
  }

  async function changeScene(next: Scene) {
    if (next === scene.value) return
    scene.value = next
    await loadRoutes()
  }

  onLoad(async () => {
    await launchLock.waitReady()
    // 定位与列表并行获取，定位到达后 distances 会自动重算，不阻塞列表渲染。
    void loadLocation()
    await loadCities()
    await loadRoutes(true)
  })
  onPullDownRefresh(() => loadRoutes())
  onUnload(() => {
    active = false
    requestSequence += 1
  })

  return {
    scene,
    routes,
    availableCities,
    loading,
    citiesLoading,
    citiesFallback,
    status,
    loadCities,
    loadRoutes,
    changeScene,
  }
}
