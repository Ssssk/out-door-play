import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import WeatherBanner from './WeatherBanner.vue'
import type { Weather } from '@/types/domain'

const weather: Weather = {
  cityCode: '420100',
  temp: 28,
  desc: '晴朗',
  wind: '微风 3 级',
  air: '空气优',
  tip: '适宜出行',
  icon: 'weather-sun.svg',
}

describe('WeatherBanner', () => {
  it('renders the icon, temperature and description as a compact inline block', () => {
    const wrapper = mount(WeatherBanner, { props: { cityName: '武汉', weather } })

    expect(wrapper.find('.weather-icon').attributes('src')).toBe('/static/icons/weather-sun.svg')
    expect(wrapper.text()).toContain('28°')
    expect(wrapper.text()).toContain('晴朗')
    // 原型中天气无卡片外壳、无详情按钮
    expect(wrapper.find('.weather-detail').exists()).toBe(false)
  })

  it('falls back to placeholders when weather data is unavailable', () => {
    const wrapper = mount(WeatherBanner, { props: { cityName: '武汉', weather: null } })

    expect(wrapper.text()).toContain('——')
    expect(wrapper.text()).toContain('暂无数据')
  })
})
