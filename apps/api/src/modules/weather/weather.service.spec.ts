import { describe, expect, it, vi } from 'vitest'
import { BaiduWeatherProvider, type WeatherObservation } from './baidu-weather.provider'
import { WeatherService } from './weather.service'

function provider(impl: () => Promise<WeatherObservation | null>) {
  return { fetch: vi.fn(impl) } as unknown as BaiduWeatherProvider
}

describe('WeatherService', () => {
  it('maps a real observation to the public shape', async () => {
    const service = new WeatherService(provider(async () => ({
      weather: '小雨', temperature: 17, windDirection: '东北风', windPower: '3级', humidity: 88, updateTime: '2026-10-01 09:00',
    })))

    await expect(service.current('420100')).resolves.toEqual({
      cityCode: '420100',
      temp: 17,
      desc: '小雨',
      wind: '东北风 3级',
      air: '空气优',
      tip: '记得带伞',
      icon: 'weather-rain.svg',
    })
  })

  it('reuses the cached observation instead of calling the provider again', async () => {
    const stub = provider(async () => ({ weather: '多云', temperature: 22, windDirection: '北风', windPower: '2级', humidity: 60, updateTime: '' }))
    const service = new WeatherService(stub)

    await service.current('420100')
    await service.current('420100')

    expect(stub.fetch).toHaveBeenCalledTimes(1)
  })

  it('shares one in-flight request for concurrent callers of the same city', async () => {
    const stub = provider(async () => ({ weather: '晴', temperature: 25, windDirection: '南风', windPower: '2级', humidity: 50, updateTime: '' }))
    const service = new WeatherService(stub)

    const [first, second] = await Promise.all([service.current('420100'), service.current('420100')])

    expect(stub.fetch).toHaveBeenCalledTimes(1)
    expect(first).toEqual(second)
  })

  it('falls back to the snapshot when the provider has no data', async () => {
    const service = new WeatherService(provider(async () => null))

    await expect(service.current('420100')).resolves.toEqual({
      cityCode: '420100',
      temp: 28,
      desc: '晴朗',
      wind: '微风 3 级',
      air: '空气优',
      tip: '适宜出行',
      icon: 'weather-sun.svg',
    })
  })

  it('keeps the last successful value when a later refresh fails', async () => {
    let failing = false
    const stub = provider(async () => (failing ? null : { weather: '阴', temperature: 19, windDirection: '东风', windPower: '2级', humidity: 70, updateTime: '' }))
    const service = new WeatherService(stub)

    const fresh = await service.current('310000')
    expect(fresh.temp).toBe(19)

    failing = true
    // 手动过期缓存，模拟下一次刷新命中失败
    const cached = (service as unknown as { cache: Map<string, { expiresAt: number }> }).cache
    cached.forEach((entry) => { entry.expiresAt = 0 })

    await expect(service.current('310000')).resolves.toMatchObject({ temp: 19, desc: '阴' })
  })

  it('echoes the requested city and falls back when no snapshot exists', async () => {
    const service = new WeatherService(provider(async () => null))
    const weather = await service.current('999999')

    expect(weather.cityCode).toBe('999999')
    expect(weather).toEqual(expect.objectContaining({ temp: 28, desc: '晴朗', icon: 'weather-sun.svg' }))
  })
})
