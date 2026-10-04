import { Injectable, Logger } from '@nestjs/common'
import { calcBaiduSn, toBaiduQuery } from '../../common/baidu-signature'

/**
 * 实时天气数据源：百度地图开放平台「天气查询」(`weather/v1`)。
 *
 * 要点（2026-10 核对）：
 * - URL：`https://api.map.baidu.com/weather/v1`，`data_type=now` 取实时天气；
 *   按行政区划代码(`district_id`)查询，本项目 `cities.code` 即 6 位国标 adcode，可直接复用。
 * - 成功时 `status=0`，实时天气在 `result.now`：`text`(天气现象) / `temp`(摄氏度) /
 *   `wind_dir`(风向) / `wind_class`(风力，如「2级」) / `rh`(湿度%) / `update_time`。
 * - AK 开启 SN 校验时附 `sn`（与地点检索同算法，见 common/baidu-signature）。
 * - ⚠️ 该 AK 必须在百度开放平台**开通「天气查询」服务**，否则返回 HTML 错误页，这里捕获后降级。
 * - 调用方带缓存，不每次请求都打接口。
 */

export interface WeatherObservation {
  /** 天气现象原文，如「小雨」「多云」 */
  weather: string
  /** 摄氏度 */
  temperature: number
  windDirection: string
  /** 风力描述，优先取 wind_class（如「2级」） */
  windPower: string
  /** 湿度百分比 */
  humidity: number
  /** 百度下发的数据更新时间 */
  updateTime: string
}

const BASE_URL = 'https://api.map.baidu.com'
const WEATHER_PATH = '/weather/v1'
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
export class BaiduWeatherProvider {
  private readonly logger = new Logger(BaiduWeatherProvider.name)

  /** 未配置 AK 时整体关闭该数据源（降级到静态快照） */
  get enabled(): boolean {
    return (process.env.BAIDU_MAP_AK ?? '').trim().length > 0
  }

  /**
   * 按行政区划代码取实时天气。未配置 AK、超时、status≠0 或结构异常（含服务未开通返回的 HTML）
   * 一律返回 null，由调用方降级，绝不让天气接口把页面打挂。
   */
  async fetch(adcode: string): Promise<WeatherObservation | null> {
    if (!this.enabled) return null

    const params: Record<string, string> = {
      ak: this.apiKey(),
      district_id: adcode,
      data_type: 'now',
      output: 'json',
    }
    const sk = this.secretKey()
    if (sk) params.sn = calcBaiduSn(WEATHER_PATH, params, sk)

    const url = `${BASE_URL}${WEATHER_PATH}?${toBaiduQuery(params)}`
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      // 服务未开通时百度返回 HTML 而非 JSON，response.json() 会抛错，落到下方 catch 降级
      const payload: unknown = await response.json()
      const record = asRecord(payload)
      const status = toNumber(record?.status)
      if (status !== 0) {
        const message = toText(record?.message)
        throw new Error(`status ${status}${message ? ` ${message}` : ''}`)
      }
      const now = asRecord(asRecord(record?.result)?.now)
      if (!now) throw new Error('Invalid weather response')

      const weather = toText(now.text)
      const temperature = toNumber(now.temp)
      if (!weather || temperature === null) throw new Error('Invalid weather fields')

      return {
        weather,
        temperature,
        windDirection: toText(now.wind_dir),
        windPower: toText(now.wind_class) || toText(now.wind_power),
        humidity: toNumber(now.rh) ?? 0,
        updateTime: toText(now.update_time),
      }
    } catch (error) {
      this.logger.warn(`百度天气查询失败（adcode=${adcode}）：${error instanceof Error ? error.message : String(error)}`)
      return null
    }
  }

  private apiKey(): string {
    return (process.env.BAIDU_MAP_AK ?? '').trim()
  }

  private secretKey(): string {
    return (process.env.BAIDU_MAP_SK ?? '').trim()
  }
}
