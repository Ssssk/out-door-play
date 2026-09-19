import { ref, shallowRef } from 'vue'
import { onPullDownRefresh, onReachBottom, onShow } from '@dcloudio/uni-app'
import { outdoorApi } from '@/api/outdoor'
import { withRealDistance } from '@/common/location'
import { useUserLocation } from '@/common/userLocation'
import { fuelPrices, fuelStations } from '@/data/mock'
import { useAppStore } from '@/stores/app'
import type { GeoPoint } from '@/common/location'
import type { FuelPrice, FuelPriceSource, FuelStation } from '@/types/domain'

/** 附近加油站每页条数，需与服务端上限保持一致 */
export const STATION_PAGE_SIZE = 30

export function useFuel() {
  const appStore = useAppStore()
  const { ensureLocation } = useUserLocation()
  const prices = shallowRef<FuelPrice[]>(fuelPrices)

  /** 拿不到接口时的本地兜底：同样按距离由近到远，并截到一页 */
  function localStations(point: GeoPoint | null) {
    return fuelStations
      .map((station) => withRealDistance(station, point))
      .sort((left, right) => left.distanceKm - right.distanceKm)
      .slice(0, STATION_PAGE_SIZE)
  }

  // 服务端已按「距你」由近到远排好并分页，前端只负责拼接，不再重排
  const stations = shallowRef<FuelStation[]>(localStations(null))
  const total = ref(stations.value.length)
  const page = ref(1)
  const hasMore = ref(false)
  const loading = ref(false)
  const loadingMore = ref(false)
  // 展示服务端最后一次发布油价的时间；未获取到时不展示虚假时间
  const updatedAt = ref('')
  // 省级官方参考价 / 暂无；省级来源时界面需标注省份口径
  const priceSource = ref<FuelPriceSource>('empty')
  // 省级参考价对应的省份名，仅 source 为 province 时有值
  const priceRegion = ref('')

  async function loadStations(point: GeoPoint | null, targetPage: number, append: boolean) {
    try {
      const result = await outdoorApi.fuelStations(point, targetPage)
      stations.value = append ? [...stations.value, ...result.items] : result.items
      total.value = result.total
      page.value = result.page
      hasMore.value = result.hasMore
    } catch {
      // 接口不可用：只在首屏回落到本地兜底，已经翻出来的内容不清空
      if (append) return
      stations.value = localStations(point)
      total.value = stations.value.length
      page.value = 1
      hasMore.value = false
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
    loading.value = true
    const pricesRequest = loadPrices()
    const point = await ensureLocation()
    await Promise.allSettled([pricesRequest, loadStations(point, 1, false)])
    loading.value = false
    uni.stopPullDownRefresh()
  }

  /** 触底加载下一页 */
  async function loadMore() {
    if (loading.value || loadingMore.value || !hasMore.value) return
    loadingMore.value = true
    await loadStations(appStore.location, page.value + 1, true)
    loadingMore.value = false
  }

  // onShow 在每次进入或切回加油页时都会触发，保证展示的是服务端最新发布的价格
  onShow(loadFuel)
  onPullDownRefresh(loadFuel)
  onReachBottom(loadMore)
  return { prices, stations, total, hasMore, updatedAt, priceSource, priceRegion, loading, loadingMore, loadFuel, loadMore }
}
