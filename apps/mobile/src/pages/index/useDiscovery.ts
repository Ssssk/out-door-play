import { computed, ref, shallowRef } from 'vue'
import { onLoad, onPullDownRefresh, onUnload } from '@dcloudio/uni-app'
import { outdoorApi } from '@/api/outdoor'
import { launchLock } from '@/common/launchLock'
import { CITIES_TTL_MS, readListCache, writeListCache } from '@/common/listCache'
import { resolveDistanceKm } from '@/common/location'
import { useUserLocation } from '@/common/userLocation'
import { cities as localCities } from '@/data/mock'
import { useAppStore } from '@/stores/app'
import type { City, RouteCard, Scene } from '@/types/domain'

export type DiscoveryStatus = 'idle' | 'loading' | 'ready' | 'empty' | 'error'

/** 排序用距离：无距离（定位未授权且数据未带距离）按无穷远处理，排在最后。 */
function sortableDistance(distanceKm: number | null | undefined) {
  return typeof distanceKm === 'number' && Number.isFinite(distanceKm) ? distanceKm : Number.POSITIVE_INFINITY
}

/** 列表缓存 key：城市 + 场景 */
function listCacheKey(cityCode: string, scene: Scene) {
  return `routes:${cityCode}:${scene}`
}

const CITIES_CACHE_KEY = 'cities'

/** 预取并发：一次只并发 2 个请求，避免首屏后抢占列表/定位的网络 */
const PREFETCH_CONCURRENCY = 2

export function useDiscovery(options: { prefetch?: boolean } = {}) {
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

  async function loadCities(force = false) {
    // 城市列表几乎不变：命中缓存直接渲染，避免每次进首页都转圈
    const cached = force ? null : readListCache<City[]>(CITIES_CACHE_KEY, CITIES_TTL_MS)
    if (cached && cached.length) {
      availableCities.value = cached
      citiesFallback.value = false
      citiesLoading.value = false
      return
    }

    citiesLoading.value = true
    try {
      const items = await outdoorApi.cities()
      if (!active) return
      if (items.length === 0) throw new Error('No enabled cities')
      writeListCache(CITIES_CACHE_KEY, items)
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

  function loadRoutes(force = false) {
    const requestedScene = scene.value
    const requestedCity = appStore.city.code
    const requestKey = `${requestedCity}:${requestedScene}`
    if (pendingKey === requestKey && pendingRequest) return pendingRequest

    const request = executeRouteLoad(requestedCity, requestedScene, force)
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

  async function executeRouteLoad(requestedCity: string, requestedScene: Scene, force: boolean) {
    // 命中缓存立即渲染（切城市/切场景/二次进入不闪转圈），随后后台强制刷新拿最新数据——
    // 用户每次进首页看到的都是最新内容，而不是一份不会更新的旧缓存。
    const cached = force ? null : readListCache<RouteCard[]>(listCacheKey(requestedCity, requestedScene))
    if (cached && cached.length > 0) {
      rawRoutes.value = cached
      status.value = 'ready'
      loading.value = false
      uni.stopPullDownRefresh()
      const sequence = ++requestSequence
      await fetchRoutes(requestedCity, requestedScene, sequence, { silent: true })
      return
    }

    loading.value = true
    const sequence = ++requestSequence
    if (rawRoutes.value.length === 0) status.value = 'loading'
    const ok = await fetchRoutes(requestedCity, requestedScene, sequence)
    // 刷新失败：已有渲染数据时保持现状不打扰；无数据才进入明确错误态（不再用本地假数据兜底）
    if (!ok && active && sequence === requestSequence && rawRoutes.value.length === 0) status.value = 'error'
    if (active && sequence === requestSequence) {
      loading.value = false
      uni.stopPullDownRefresh()
    }
  }

  /** 拉取列表并应用；成功返回 true。silent=true 时失败不打扰现有界面（用于缓存命中后的后台刷新）。 */
  async function fetchRoutes(
    city: string,
    scene: Scene,
    sequence: number,
    opts: { silent?: boolean } = {},
  ): Promise<boolean> {
    try {
      const items = await outdoorApi.routes(city, scene)
      if (!active || sequence !== requestSequence) return true
      writeListCache(listCacheKey(city, scene), items)
      rawRoutes.value = items
      status.value = items.length === 0 ? 'empty' : 'ready'
      // 首屏数据到位后，后台预取其他城市与另一个场景，用户切过去时无需等待
      if (options.prefetch !== false) void prefetch(city, scene)
      return true
    } catch {
      if (!active || sequence !== requestSequence) return true
      // silent 刷新失败：保留现有渲染（缓存数据仍可用）；非 silent 失败由调用方进入错误态
      return false
    }
  }

  /**
   * 首屏之后后台预取：本城市另一个场景 + 其他城市的当前场景，写进缓存但不动界面。
   * 这样用户切城市/切场景时直接命中缓存渲染，等于「进入首页就预载了各城市列表」。
   */
  async function prefetch(currentCity: string, currentScene: Scene) {
    const targets: Array<{ city: string; scene: Scene }> = [
      { city: currentCity, scene: currentScene === 'drive' ? 'fish' : 'drive' },
      ...availableCities.value
        .filter((city) => city.code !== currentCity)
        .map((city) => ({ city: city.code, scene: currentScene })),
    ]

    const pending = targets.filter(({ city, scene: target }) => !readListCache(listCacheKey(city, target)))
    for (let index = 0; index < pending.length; index += PREFETCH_CONCURRENCY) {
      if (!active) return
      const batch = pending.slice(index, index + PREFETCH_CONCURRENCY)
      await Promise.all(batch.map(({ city, scene: target }) =>
        outdoorApi.routes(city, target)
          .then((items) => { if (active) writeListCache(listCacheKey(city, target), items) })
          // 预取失败不必打扰用户：目标城市首次进入时仍会正常加载
          .catch(() => undefined),
      ))
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
    await loadRoutes()
  })
  // 下拉刷新是用户主动行为，绕过缓存取最新数据
  onPullDownRefresh(() => loadRoutes(true))
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
