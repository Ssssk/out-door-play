import { ref, shallowRef, watch } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { outdoorApi } from '@/api/outdoor'
import { weather as weatherMock } from '@/data/mock'
import { useAppStore } from '@/stores/app'
import type { Weather } from '@/types/domain'

/** 首页「今日天气」：跟随当前城市拉取，接口不可用时回落到本地兜底数据。 */
export function useWeather() {
  const appStore = useAppStore()
  const weather = shallowRef<Weather | null>(null)
  const loading = ref(false)
  let sequence = 0

  function localWeather(cityCode: string) {
    return weatherMock.find((item) => item.cityCode === cityCode) ?? null
  }

  async function loadWeather(cityCode = appStore.city.code) {
    // 先用本地兜底数据渲染，避免等待接口期间出现占位符闪烁
    weather.value = localWeather(cityCode)
    loading.value = true
    const current = ++sequence

    try {
      const data = await outdoorApi.weather(cityCode)
      if (current !== sequence) return
      weather.value = data
    } catch {
      // 接口不可用：保留本地兜底数据；无兜底时组件渲染「—— / 暂无数据」
    } finally {
      if (current === sequence) loading.value = false
    }
  }

  // RULE-MOB-006：切换城市时天气随之刷新
  watch(() => appStore.city.code, (cityCode) => { void loadWeather(cityCode) })
  onLoad(() => { void loadWeather() })

  return { weather, loading, loadWeather }
}
