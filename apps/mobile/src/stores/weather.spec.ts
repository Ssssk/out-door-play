import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import type { Weather } from '@/types/domain'

const api = vi.hoisted(() => ({ weather: vi.fn() }))

vi.mock('@/api/outdoor', () => ({ outdoorApi: api }))

import { useAppStore } from '@/stores/app'
import { useWeatherStore } from './weather'

function snapshot(overrides: Partial<Weather> = {}): Weather {
  return {
    cityCode: '420100',
    temp: 28,
    desc: '晴朗',
    wind: '微风 3 级',
    air: '空气优',
    tip: '适宜出行',
    icon: 'weather-sun.svg',
    ...overrides,
  }
}

describe('weather store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    api.weather.mockReset()
    vi.stubGlobal('uni', { getStorageSync: vi.fn(() => null), setStorageSync: vi.fn() })
  })

  it('requests the weather of the currently selected city', async () => {
    api.weather.mockResolvedValueOnce(snapshot())
    const store = useWeatherStore()

    await store.load()

    expect(api.weather).toHaveBeenCalledWith('420100')
    expect(store.weather?.temp).toBe(28)
    expect(store.loading).toBe(false)
  })

  it('reloads the weather when the selected city changes', async () => {
    api.weather
      .mockResolvedValueOnce(snapshot())
      .mockResolvedValueOnce(snapshot({ cityCode: '110000', temp: 22, desc: '多云', icon: 'weather-cloudy.svg' }))
    const store = useWeatherStore()
    await store.load()
    expect(store.weather?.cityCode).toBe('420100')

    useAppStore().selectCity({ code: '110000', name: '北京' })
    await nextTick()
    await vi.waitUntil(() => store.weather?.cityCode === '110000')

    expect(api.weather).toHaveBeenLastCalledWith('110000')
    expect(store.weather?.temp).toBe(22)
    expect(store.weather?.desc).toBe('多云')
  })

  it('serves every page from a single request instead of fetching again', async () => {
    api.weather.mockResolvedValue(snapshot())
    const store = useWeatherStore()

    // 首页与加油页顶部都会读同一份数据，切换 tab 不应再打一次接口
    await store.load()
    await store.load()

    expect(api.weather).toHaveBeenCalledTimes(1)
    expect(store.weather?.temp).toBe(28)
  })

  it('keeps the local fallback when the weather service is unavailable', async () => {
    api.weather.mockRejectedValue(new Error('offline'))
    const store = useWeatherStore()

    await store.load()

    expect(store.weather?.temp).toBe(28)
    expect(store.weather?.desc).toBe('晴朗')
    expect(store.loading).toBe(false)
  })

  it('retries after a failure instead of marking the city as already loaded', async () => {
    api.weather.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(snapshot({ temp: 30 }))
    const store = useWeatherStore()

    await store.load()
    await store.load()

    expect(api.weather).toHaveBeenCalledTimes(2)
    expect(store.weather?.temp).toBe(30)
  })
})
