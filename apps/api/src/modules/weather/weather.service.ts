import { Injectable } from '@nestjs/common'
import { BaiduWeatherProvider, type WeatherObservation } from './baidu-weather.provider'

export interface CurrentWeather {
  cityCode: string
  /** 当前温度，单位摄氏度 */
  temp: number
  /** 天气描述：晴朗 / 多云 / 阴 / 雨 / 雪 / 雾 */
  desc: string
  /** 风力，如「微风 3 级」 */
  wind: string
  /** 空气质量，如「空气优」 */
  air: string
  /** 出行建议，如「适宜出行」 */
  tip: string
  /** 天气图标文件名，对应小程序 static/icons 下的同名资源 */
  icon: string
}

type WeatherSnapshot = Omit<CurrentWeather, 'cityCode'>

/**
 * 实时天气取百度地图开放平台（按城市 adcode 查询），失败或未配置 AK 时降级到静态快照。
 *
 * 降级快照只在「拿不到真实数据」时使用，保证 `GET /v1/weather/current` 永远有稳定结构，
 * 小程序端不需要为天气失败单独兜底。
 */
const SNAPSHOTS = new Map<string, WeatherSnapshot>([
  ['420100', { temp: 28, desc: '晴朗', wind: '微风 3 级', air: '空气优', tip: '适宜出行', icon: 'weather-sun.svg' }],
  ['110000', { temp: 22, desc: '多云', wind: '西北风 3 级', air: '空气良', tip: '注意添衣', icon: 'weather-cloudy.svg' }],
  ['310000', { temp: 26, desc: '阴', wind: '东风 2 级', air: '空气良', tip: '适宜出行', icon: 'weather-overcast.svg' }],
  ['440100', { temp: 31, desc: '雨', wind: '南风 2 级', air: '空气优', tip: '记得带伞', icon: 'weather-rain.svg' }],
  ['440300', { temp: 30, desc: '多云', wind: '东南风 3 级', air: '空气优', tip: '注意防晒', icon: 'weather-cloudy.svg' }],
  ['510100', { temp: 21, desc: '雾', wind: '静风 1 级', air: '空气良', tip: '减速慢行', icon: 'weather-fog.svg' }],
  ['330100', { temp: 25, desc: '晴朗', wind: '北风 2 级', air: '空气优', tip: '适宜出行', icon: 'weather-sun.svg' }],
  ['320100', { temp: 24, desc: '阴', wind: '东北风 2 级', air: '空气良', tip: '适宜出行', icon: 'weather-overcast.svg' }],
  ['430100', { temp: 27, desc: '多云', wind: '南风 3 级', air: '空气良', tip: '注意防晒', icon: 'weather-cloudy.svg' }],
  ['500000', { temp: 23, desc: '雾', wind: '静风 1 级', air: '空气良', tip: '减速慢行', icon: 'weather-fog.svg' }],
])

const FALLBACK: WeatherSnapshot = { temp: 28, desc: '晴朗', wind: '微风 3 级', air: '空气优', tip: '适宜出行', icon: 'weather-sun.svg' }

/** 天气缓存时长：百度天气短时间内不会变，且个人开发者额度有限 */
const CACHE_TTL_MS = 10 * 60 * 1000
/** 取数失败后的重试窗口，避免数据源异常时每个请求都去打接口 */
const FAILURE_RETRY_MS = 60 * 1000

function snapshotFor(cityCode: string): WeatherSnapshot {
  return SNAPSHOTS.get(cityCode) ?? FALLBACK
}

/** 天气现象 → 小程序图标（static/icons 下只有这 6 个天气图标） */
function iconFor(weather: string): string {
  if (weather.includes('雪')) return 'weather-snow.svg'
  if (weather.includes('雨')) return 'weather-rain.svg'
  if (weather.includes('雾')) return 'weather-fog.svg'
  if (weather.includes('晴')) return 'weather-sun.svg'
  if (weather.includes('阴')) return 'weather-overcast.svg'
  if (weather.includes('霾') || weather.includes('沙') || weather.includes('尘')) return 'weather-overcast.svg'
  return 'weather-cloudy.svg'
}

/** 出行建议按天气现象本地推导，不编造数据源没有的信息 */
function tipFor(weather: string, temp: number): string {
  if (weather.includes('雪')) return '注意路面结冰'
  if (weather.includes('雨')) return '记得带伞'
  if (weather.includes('雾')) return '减速慢行'
  if (weather.includes('霾') || weather.includes('沙') || weather.includes('尘')) return '减少户外活动'
  if (temp >= 30) return '注意防晒'
  if (temp <= 8) return '注意添衣'
  return '适宜出行'
}

function toCurrentWeather(cityCode: string, observation: WeatherObservation): CurrentWeather {
  const snapshot = snapshotFor(cityCode)
  return {
    cityCode,
    temp: observation.temperature,
    desc: observation.weather,
    wind: [observation.windDirection, observation.windPower].filter(Boolean).join(' ') || snapshot.wind,
    // 百度基础天气不返回 AQI，空气质量暂沿用城市静态文案
    air: snapshot.air,
    tip: tipFor(observation.weather, observation.temperature),
    icon: iconFor(observation.weather),
  }
}

@Injectable()
export class WeatherService {
  private readonly cache = new Map<string, { value: CurrentWeather; expiresAt: number }>()
  private readonly inflight = new Map<string, Promise<WeatherObservation | null>>()

  constructor(private readonly provider: BaiduWeatherProvider) {}

  async current(cityCode: string): Promise<CurrentWeather> {
    const cached = this.cache.get(cityCode)
    if (cached && cached.expiresAt > Date.now()) return cached.value

    const observation = await this.load(cityCode)
    if (observation) {
      const value = toCurrentWeather(cityCode, observation)
      this.cache.set(cityCode, { value, expiresAt: Date.now() + CACHE_TTL_MS })
      return value
    }

    // 取数失败：优先用上一次成功值，其次静态快照；失败窗口内不再重复打接口
    const value = cached?.value ?? { cityCode, ...snapshotFor(cityCode) }
    this.cache.set(cityCode, { value, expiresAt: Date.now() + FAILURE_RETRY_MS })
    return value
  }

  /** 同一城市的并发请求共用一个在途请求，避免重复消耗额度 */
  private load(cityCode: string): Promise<WeatherObservation | null> {
    const pending = this.inflight.get(cityCode)
    if (pending) return pending

    const request = this.provider.fetch(cityCode)
      .catch(() => null)
      .finally(() => { if (this.inflight.get(cityCode) === request) this.inflight.delete(cityCode) })
    this.inflight.set(cityCode, request)
    return request
  }
}
