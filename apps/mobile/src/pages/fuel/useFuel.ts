import { computed, ref, shallowRef } from 'vue'
import { onLoad, onPullDownRefresh } from '@dcloudio/uni-app'
import { outdoorApi } from '@/api/outdoor'
import { resolveDistanceKm } from '@/common/location'
import { useUserLocation } from '@/common/userLocation'
import { fuelPrices, fuelStations } from '@/data/mock'
import { useAppStore } from '@/stores/app'
import type { FuelPrice, FuelStation } from '@/types/domain'

export function useFuel() {
  const appStore = useAppStore()
  const { ensureLocation } = useUserLocation()
  const prices = shallowRef<FuelPrice[]>(fuelPrices)
  const rawStations = shallowRef<FuelStation[]>(fuelStations)
  const updatedAt = ref('08-22 14:30')
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
      prices.value = results[0].value.items
      updatedAt.value = results[0].value.updatedAt
    }
    if (results[1].status === 'fulfilled') rawStations.value = results[1].value
    loading.value = false
    uni.stopPullDownRefresh()
  }

  onLoad(loadFuel)
  onPullDownRefresh(loadFuel)
  return { prices, stations, updatedAt, loading, loadFuel }
}
