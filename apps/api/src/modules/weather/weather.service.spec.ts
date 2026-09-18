import { describe, expect, it } from 'vitest'
import { WeatherService } from './weather.service'

describe('WeatherService', () => {
  const service = new WeatherService()

  it('returns the snapshot of a known city', () => {
    expect(service.current('420100')).toEqual({
      cityCode: '420100',
      temp: 28,
      desc: '晴朗',
      wind: '微风 3 级',
      air: '空气优',
      tip: '适宜出行',
      icon: 'weather-sun.svg',
    })
  })

  it('echoes the requested city and falls back when no snapshot exists', () => {
    const weather = service.current('999999')

    expect(weather.cityCode).toBe('999999')
    expect(weather).toEqual(
      expect.objectContaining({ temp: 28, desc: '晴朗', icon: 'weather-sun.svg' }),
    )
  })
})
