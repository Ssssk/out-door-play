import { ref, shallowRef } from 'vue'
import { onLoad, onPullDownRefresh, onUnload } from '@dcloudio/uni-app'
import { outdoorApi } from '@/api/outdoor'
import { launchLock } from '@/common/launchLock'
import { cities as localCities, driveRoutes, fishingSpots } from '@/data/mock'
import { useAppStore } from '@/stores/app'
import type { City, RouteCard, Scene } from '@/types/domain'

export type DiscoveryStatus = 'idle' | 'loading' | 'ready' | 'empty' | 'fallback' | 'error'

export function useDiscovery() {
  const appStore = useAppStore()
  const scene = ref<Scene>('drive')
  const routes = shallowRef<RouteCard[]>([])
  const availableCities = shallowRef<City[]>([])
  const loading = ref(false)
  const citiesLoading = ref(false)
  const citiesFallback = ref(false)
  const status = ref<DiscoveryStatus>('idle')
  let requestSequence = 0
  let active = true
  let pendingKey: string | undefined
  let pendingRequest: Promise<void> | undefined

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
    if (routes.value.length === 0) status.value = 'loading'
    try {
      const items = await outdoorApi.routes(requestedCity, requestedScene)
      if (!active || sequence !== requestSequence) return
      routes.value = items
      status.value = items.length === 0 ? 'empty' : 'ready'
    } catch {
      if (!active || sequence !== requestSequence) return
      routes.value = requestedScene === 'drive' ? driveRoutes : fishingSpots
      status.value = routes.value.length === 0 ? 'error' : 'fallback'
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
