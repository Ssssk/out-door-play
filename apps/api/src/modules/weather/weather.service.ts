import { Injectable } from '@nestjs/common'

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
 * 真实天气服务接入前的占位实现。
 *
 * 需求側（v1.1.0）约定本期为静态数据、接口先行，因此这里按城市编码返回稳定快照，
 * 保证小程序端不再拿到 404；后续接入第三方天气服务时只需替换本文件的取数逻辑，
 * 保持 `GET /v1/weather/current?cityCode=` 的响应结构不变。
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

@Injectable()
export class WeatherService {
  current(cityCode: string): CurrentWeather {
    return { cityCode, ...(SNAPSHOTS.get(cityCode) ?? FALLBACK) }
  }
}
