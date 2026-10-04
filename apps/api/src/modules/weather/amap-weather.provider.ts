import { Injectable, Logger } from '@nestjs/common'

/**
 * 实时天气数据源：高德开放平台「天气查询」(`v3/weather/weatherInfo`)。
 *
 * 要点（2026-10 核对）：
 * - URL：`https://restapi.amap.com/v3/weather/weatherInfo`，`extensions=base` 取实况；
 *   `city` 参数直接用 6 位国标 adcode，与本项目 `cities.code` 一致。
 * - 成功时 `status='1'`，实况在 `lives[0]`：`weather`(现象) / `temperature`(摄氏度) /
 *   `winddirection`(风向) / `windpower`(风力，如「≤3」或「3」) / `humidity`(湿度%) / `reporttime`。
 * - 引入原因：服务器网络单独劫持 `api.map.baidu.com`，百度天气不可达；
 *   且百度「天气查询」服务始终未开通，高德版直接给到真实天气。
 * - 调用方带缓存，不每次请求都打接口。
 */

export interface WeatherObservation {
  /** 天气现象原文，如「小雨」「多云」 */
  weather: string
  /** 摄氏度 */
  temperature: number
  windDirection: string
  /** 风力描述，统一成「N级」样式 */
  windPower: string
  /** 湿度百分比 */
  humidity: number
  /** 数据源下发的更新时间 */
  updateTime: string
}

const BASE_URL = 'https://restapi.amap.com'
const WEATHER_PATH = '/v3/weather/weatherInfo'
const REQUEST_TIMEOUT_MS = 8000

type RawRecord = Record<string, unknown>

function asRecord(value: unknown): RawRecord | null {
  return typeof value === 'object' && value !== null ? (value as RawRecord) : null
}
function toText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}
function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return null
}

@Injectable()
export class AmapWeatherProvider {
  private readonly logger = new Logger(AmapWeatherProvider.name)

  /** 未配置 Key 时整体关闭该数据源（降级到静态快照） */
  get enabled(): boolean {
    return (process.env.AMAP_MAP_KEY ?? '').trim().length > 0
  }

  /**
   * 按行政区划代码取实时天气。未配置 Key、超时、status≠'1' 或结构异常
   * 一律返回 null，由调用方降级，绝不让天气接口把页面打挂。
   */
  async fetch(adcode: string): Promise<WeatherObservation | null> {
    if (!this.enabled) return null

    const url =
      `${BASE_URL}${WEATHER_PATH}?key=${encodeURIComponent((process.env.AMAP_MAP_KEY ?? '').trim())}` +
      `&city=${encodeURIComponent(adcode)}&extensions=base`
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const payload: unknown = await response.json()
      const record = asRecord(payload)
      if (toText(record?.status) !== '1') {
        const info = toText(record?.info)
        throw new Error(`infocode ${toText(record?.infocode)}${info ? ` ${info}` : ''}`)
      }
      const live = asRecord(Array.isArray(record?.lives) ? record.lives[0] : undefined)
      if (!live) throw new Error('Invalid weather response')

      const weather = toText(live.weather)
      const temperature = toNumber(live.temperature)
      if (!weather || temperature === null) throw new Error('Invalid weather fields')

      const windPowerRaw = toText(live.windpower)
      return {
        weather,
        temperature,
        windDirection: toText(live.winddirection),
        windPower: /^\d+$/.test(windPowerRaw) ? `${windPowerRaw}级` : windPowerRaw,
        humidity: toNumber(live.humidity) ?? 0,
        updateTime: toText(live.reporttime),
      }
    } catch (error) {
      this.logger.warn(`高德天气查询失败（adcode=${adcode}）：${error instanceof Error ? error.message : String(error)}`)
      return null
    }
  }
}
