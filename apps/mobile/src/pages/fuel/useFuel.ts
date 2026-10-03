import { ref, shallowRef } from 'vue'
import { onPullDownRefresh, onReachBottom, onShow, onUnload } from '@dcloudio/uni-app'
import { outdoorApi } from '@/api/outdoor'
import { useUserLocation } from '@/common/userLocation'
import { ApiError } from '@/common/request'
import { useAppStore } from '@/stores/app'
import type { GeoPoint } from '@/common/location'
import type { FuelPrice, FuelPriceSource, FuelStation } from '@/types/domain'

/** 附近加油站每页条数（产品要求每页 5 条），需与服务端默认保持一致 */
export const STATION_PAGE_SIZE = 5

export function useFuel() {
  const appStore = useAppStore()
  const { ensureLocation, openLocationSettings, status: locationStatus } = useUserLocation()
  const prices = shallowRef<FuelPrice[]>([])

  // 服务端已按「距你」由近到远排好并分页，前端只负责拼接，不再重排
  // 没有取得设备坐标前不展示任何站点，避免把演示数据误认为附近 POI。
  const stations = shallowRef<FuelStation[]>([])
  const total = ref(0)
  const page = ref(1)
  const hasMore = ref(false)
  const loading = ref(false)
  const loadingMore = ref(false)
  const stationState = ref<'idle' | 'loading' | 'ready' | 'empty' | 'error' | 'denied'>('idle')
  const stationError = ref('')
  // 兜底来源：'city' 表示按所选城市展示（用户坐标附近暂无站点）
  const stationFallback = ref<'city' | undefined>(undefined)
  let loadRequestId = 0
  let searchPoint: GeoPoint | null = null
  // 展示服务端最后一次发布油价的时间；未获取到时不展示虚假时间
  const updatedAt = ref('')
  // 省级官方参考价 / 暂无；省级来源时界面需标注省份口径
  const priceSource = ref<FuelPriceSource>('empty')
  // 省级参考价对应的省份名，仅 source 为 province 时有值
  const priceRegion = ref('')

  async function loadStations(point: GeoPoint | null, targetPage: number, append: boolean, requestId: number) {
    if (!point) {
      if (!append) {
        stations.value = []
        total.value = 0
        page.value = 1
        hasMore.value = false
        stationState.value = 'denied'
      }
      return
    }

    if (!append) {
      stationState.value = 'loading'
      stationError.value = ''
      stationFallback.value = undefined
    }
    try {
      const result = await outdoorApi.fuelStations(point, targetPage, appStore.city.code)
      if (requestId !== loadRequestId) return
      const items = result.items
      stations.value = append ? [...new Map([...stations.value, ...items].map(s => [s.id, s])).values()] : items
      total.value = result.total
      page.value = result.page
      hasMore.value = result.hasMore
      stationError.value = ''
      stationFallback.value = result.fallback
      stationState.value = stations.value.length > 0 ? 'ready' : 'empty'
    } catch (error) {
      if (requestId !== loadRequestId) return
      stationError.value = error instanceof ApiError && error.code === 'FUEL_POI_UNAVAILABLE'
        ? '附近加油站查询暂不可用，请稍后重试' : '附近加油站加载失败，请重试'
      // 接口失败时清空首屏，绝不回落到 mock，避免把演示站点当成真实 POI。
      if (!append) {
        stations.value = []
        total.value = 0
        page.value = 1
        hasMore.value = false
        stationState.value = 'error'
      }
    }
  }

  async function loadPrices(requestId: number) {
    try {
      const result = await outdoorApi.fuelPrices(appStore.city.code)
      if (requestId !== loadRequestId) return
      // 服务端明确返回空列表代表该省份暂无数据，清空以免继续展示上一个城市的数值
      prices.value = result.items
      updatedAt.value = result.updatedAt
      priceSource.value = result.source
      priceRegion.value = result.region ?? ''
    } catch {
      // 保留当前内容，避免网络抖动把已有数据清空
    }
  }

  /** 首屏、下拉刷新、切回页面：都重置回第一页 */
  async function loadFuel() {
    const requestId = ++loadRequestId
    loading.value = true
    loadingMore.value = false
    hasMore.value = false
    stations.value = []
    stationState.value = 'loading'
    const pricesRequest = loadPrices(requestId)
    try {
      const point = await ensureLocation(true)
      if (requestId !== loadRequestId) return
      searchPoint = point
      await loadStations(point, 1, false, requestId)
      await pricesRequest
    } finally {
      if (requestId === loadRequestId) {
        loading.value = false
        uni.stopPullDownRefresh()
      }
    }
  }

  /** 触底加载下一页 */
  async function loadMore() {
    if (loading.value || loadingMore.value || !hasMore.value || !searchPoint) return
    loadingMore.value = true
    const requestId = loadRequestId
    await loadStations(searchPoint, page.value + 1, true, requestId)
    if (requestId === loadRequestId) loadingMore.value = false
  }

  // onShow 在每次进入或切回加油页时都会触发，保证展示的是服务端最新发布的价格
  onUnload(() => { loadRequestId += 1 })
  onShow(loadFuel)
  onPullDownRefresh(loadFuel)
  onReachBottom(loadMore)
  return {
    prices,
    stations,
    total,
    hasMore,
    updatedAt,
    priceSource,
    priceRegion,
    loading,
    loadingMore,
    stationState,
    stationError,
    stationFallback,
    locationStatus,
    openLocationSettings,
    loadFuel,
    loadMore,
  }
}
