import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import type { Weather } from '@/types/domain'

const lifecycle = vi.hoisted(() => ({ load: undefined as undefined | (() => Promise<void>) }))
const api = vi.hoisted(() => ({ weather: vi.fn() }))

vi.mock('@dcloudio/uni-app', () => ({
  onLoad: (callback: () => Promise<void>) => { lifecycle.load = callback },
}))
vi.mock('@/api/outdoor', () => ({ outdoorApi: api }))

import { useWeather } from './useWeather'
import { useAppStore } from '@/stores/app'

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

describe('useWeather', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    api.weather.mockReset()
    lifecycle.load = undefined
    vi.stubGlobal('uni', { getStorageSync: vi.fn(() => null), setStorageSync: vi.fn() })
  })

  it('requests the weather of the currently selected city', async () => {
    api.weather.mockResolvedValueOnce(snapshot())
    const state = useWeather()

    await lifecycle.load?.()

    expect(api.weather).toHaveBeenCalledWith('420100')
    expect(state.weather.value?.temp).toBe(28)
  })

  it('reloads the weather when the selected city changes', async () => {
    api.weather
      .mockResolvedValueOnce(snapshot())
      .mockResolvedValueOnce(snapshot({ cityCode: '110000', temp: 22, desc: '多云', icon: 'weather-cloudy.svg' }))
    const state = useWeather()
    await lifecycle.load?.()
    expect(state.weather.value?.cityCode).toBe('420100')

    useAppStore().selectCity({ code: '110000', name: '北京' })
    await nextTick()
    await vi.waitUntil(() => state.weather.value?.cityCode === '110000')

    expect(api.weather).toHaveBeenLastCalledWith('110000')
    expect(state.weather.value?.temp).toBe(22)
    expect(state.weather.value?.desc).toBe('多云')
  })

  it('keeps the local fallback when the weather service is unavailable', async () => {
    api.weather.mockRejectedValue(new Error('offline'))
    const state = useWeather()

    await lifecycle.load?.()

    expect(state.weather.value?.temp).toBe(28)
    expect(state.weather.value?.desc).toBe('晴朗')
    expect(state.loading.value).toBe(false)
  })
})
