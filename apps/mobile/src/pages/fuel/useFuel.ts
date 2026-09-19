import { ref, shallowRef } from 'vue'
import { onPullDownRefresh, onReachBottom, onShow } from '@dcloudio/uni-app'
import { outdoorApi } from '@/api/outdoor'
import { useUserLocation } from '@/common/userLocation'
import { fuelPrices } from '@/data/mock'
import { useAppStore } from '@/stores/app'
import type { GeoPoint } from '@/common/location'
import type { FuelPrice, FuelPriceSource, FuelStation } from '@/types/domain'

/** 附近加油站每页条数，需与服务端上限保持一致 */
export const STATION_PAGE_SIZE = 30

/** 服务端同步的腾讯 POI 统一使用 tx- 前缀；兼容旧接口时也要挡住 seed 演示数据。 */
function isTencentPoi(station: FuelStation) {
  return station.id.startsWith('tx-')
}

export function useFuel() {
  const appStore = useAppStore()
  const { ensureLocation, openLocationSettings, status: locationStatus } = useUserLocation()
  const prices = shallowRef<FuelPrice[]>(fuelPrices)

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
  let loadRequestId = 0
  // 展示服务端最后一次发布油价的时间；未获取到时不展示虚假时间
  const updatedAt = ref('')
  // 省级官方参考价 / 暂无；省级来源时界面需标注省份口径
  const priceSource = ref<FuelPriceSource>('empty')
  // 省级参考价对应的省份名，仅 source 为 province 时有值
  const priceRegion = ref('')

  async function loadStations(point: GeoPoint | null, targetPage: number, append: boolean) {
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
    }
    try {
      const result = await outdoorApi.fuelStations(point, targetPage)
      const items = result.items.filter(isTencentPoi)
      const hasOnlyPoiItems = items.length === result.items.length
      stations.value = append ? [...stations.value, ...items] : items
      // 兼容尚未滚动到新 API 镜像的服务端：旧接口可能还会返回 station-*
      // 演示数据，此时不把它们计入总数，也不继续翻页。
      total.value = hasOnlyPoiItems ? result.total : items.length
      page.value = result.page
      hasMore.value = hasOnlyPoiItems && result.hasMore
      if (!append) stationState.value = items.length > 0 ? 'ready' : 'empty'
    } catch {
      stationError.value = '附近加油站加载失败，请重试'
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

  async function loadPrices() {
    try {
      const result = await outdoorApi.fuelPrices(appStore.city.code)
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
    const pricesRequest = loadPrices()
    try {
      const point = await ensureLocation()
      await pricesRequest
      if (requestId !== loadRequestId) return
      await loadStations(point, 1, false)
    } finally {
      if (requestId === loadRequestId) {
        loading.value = false
        uni.stopPullDownRefresh()
      }
    }
  }

  /** 触底加载下一页 */
  async function loadMore() {
    if (loading.value || loadingMore.value || !hasMore.value || !appStore.location) return
    loadingMore.value = true
    await loadStations(appStore.location, page.value + 1, true)
    loadingMore.value = false
  }

  // onShow 在每次进入或切回加油页时都会触发，保证展示的是服务端最新发布的价格
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
    locationStatus,
    openLocationSettings,
    loadFuel,
    loadMore,
  }
}
