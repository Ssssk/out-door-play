import { computed, ref, shallowRef } from 'vue'
import { onPullDownRefresh, onShow } from '@dcloudio/uni-app'
import { outdoorApi } from '@/api/outdoor'
import { resolveDistanceKm } from '@/common/location'
import { useUserLocation } from '@/common/userLocation'
import { fuelPrices, fuelStations } from '@/data/mock'
import { useAppStore } from '@/stores/app'
import type { FuelPrice, FuelPriceSource, FuelStation } from '@/types/domain'

export function useFuel() {
  const appStore = useAppStore()
  const { ensureLocation } = useUserLocation()
  const prices = shallowRef<FuelPrice[]>(fuelPrices)
  const rawStations = shallowRef<FuelStation[]>(fuelStations)
  // 展示服务端最后一次发布油价的时间；未获取到时不展示虚假时间
  const updatedAt = ref('')
  // 省级官方参考价 / 暂无；省级来源时界面需标注省份口径
  const priceSource = ref<FuelPriceSource>('empty')
  // 省级参考价对应的省份名，仅 source 为 province 时有值
  const priceRegion = ref('')
  const loading = ref(false)

  // 有设备定位时用真实坐标重算距离，并按距离由近到远排序。
  const stations = computed(() =>
    rawStations.value
      .map((station) => {
        const distance = resolveDistanceKm(station, appStore.location)
        return distance === null ? station : { ...station, distanceKm: distance }
      })
      .sort((left, right) => left.distanceKm - right.distanceKm),
  )

  async function loadFuel() {
    loading.value = true
    const pricesRequest = outdoorApi.fuelPrices(appStore.city.code)
    const point = await ensureLocation()
    const results = await Promise.allSettled([pricesRequest, outdoorApi.fuelStations(point)])
    if (results[0].status === 'fulfilled') {
      // 服务端明确返回空列表代表该城市未收录油价，清空以免继续展示上一个城市的数值
      prices.value = results[0].value.items
      updatedAt.value = results[0].value.updatedAt
      priceSource.value = results[0].value.source
      priceRegion.value = results[0].value.region ?? ''
    }
    if (results[1].status === 'fulfilled') rawStations.value = results[1].value
    loading.value = false
    uni.stopPullDownRefresh()
  }

  // onShow 在每次进入或切回加油页时都会触发，保证展示的是服务端最新发布的价格
  onShow(loadFuel)
  onPullDownRefresh(loadFuel)
  return { prices, stations, updatedAt, priceSource, priceRegion, loading, loadFuel }
}
