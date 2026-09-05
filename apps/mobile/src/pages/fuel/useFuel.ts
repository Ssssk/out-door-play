import { ref, shallowRef } from 'vue'
import { onLoad, onPullDownRefresh } from '@dcloudio/uni-app'
import { outdoorApi } from '@/api/outdoor'
import { fuelPrices, fuelStations } from '@/data/mock'
import { useAppStore } from '@/stores/app'
import type { FuelPrice, FuelStation } from '@/types/domain'

export function useFuel() {
  const appStore = useAppStore()
  const prices = shallowRef<FuelPrice[]>(fuelPrices)
  const stations = shallowRef<FuelStation[]>(fuelStations)
  const updatedAt = ref('08-22 14:30')
  const loading = ref(false)

  async function loadFuel() {
    loading.value = true
    const results = await Promise.allSettled([outdoorApi.fuelPrices(appStore.city.code), outdoorApi.fuelStations()])
    if (results[0].status === 'fulfilled') {
      prices.value = results[0].value.items
      updatedAt.value = results[0].value.updatedAt
    }
    if (results[1].status === 'fulfilled') stations.value = results[1].value
    loading.value = false
    uni.stopPullDownRefresh()
  }

  onLoad(loadFuel)
  onPullDownRefresh(loadFuel)
  return { prices, stations, updatedAt, loading, loadFuel }
}
