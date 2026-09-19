import { defineStore } from 'pinia'
import { ref, shallowRef, watch } from 'vue'
import { outdoorApi } from '@/api/outdoor'
import { weather as weatherMock } from '@/data/mock'
import { useAppStore } from '@/stores/app'
import type { Weather } from '@/types/domain'

/**
 * 今日天气（全局共享状态）。
 *
 * 首页与加油页顶部都会展示天气，若各自请求就会出现两边不一致；
 * 因此数据只此一份，由本 store 统一拉取、统一在城市变化时刷新（RULE-MOB-006）。
 *
 * 不持久化：天气是时效性数据，缓存上一次的城市天气反而会误导用户。
 */
export const useWeatherStore = defineStore('weather', () => {
  const appStore = useAppStore()
  const weather = shallowRef<Weather | null>(null)
  const loading = ref(false)
  /** 已成功取到数据的城市，用于避免多个页面重复请求同一城市 */
  const settledCity = ref('')
  let sequence = 0

  function localWeather(cityCode: string) {
    return weatherMock.find((item) => item.cityCode === cityCode) ?? null
  }

  /**
   * 拉取指定城市的天气。
   * `force` 用于城市变化时强制刷新；否则已有该城市数据就直接复用，避免重复请求。
   */
  async function load(cityCode = appStore.city.code, force = false) {
    if (!force && settledCity.value === cityCode && weather.value) return

    // 先用本地兜底数据渲染，避免等待接口期间出现占位符闪烁
    weather.value = localWeather(cityCode)
    loading.value = true
    const current = ++sequence

    try {
      const data = await outdoorApi.weather(cityCode)
      if (current !== sequence) return
      weather.value = data
      settledCity.value = cityCode
    } catch {
      // 接口不可用：保留本地兜底数据，且不记为已取到，后续页面仍可重试；
      // 无兜底数据时组件渲染「—— / 暂无数据」
    } finally {
      if (current === sequence) loading.value = false
    }
  }

  // RULE-MOB-006：切换城市时天气随之刷新
  watch(() => appStore.city.code, (cityCode) => { void load(cityCode, true) })

  return { weather, loading, load }
})
