import { Injectable, Logger } from '@nestjs/common'
import { buildSignature, buildTencentUrl, tencentMapSecret } from '../../common/tencent-signature'

/**
 * 实时天气数据源：腾讯位置服务「天气查询」（WebService API）。
 *
 * 官方文档（2026-10 核对）要点：
 * - URL：`https://apis.map.qq.com/ws/weather/v1/`，`type=now` 取实时天气。
 * - `adcode` 与 `location`（经纬度）二选一，**adcode 直接支持市级/区县级**，
 *   而本项目 `cities.code` 本身就是 6 位行政区划代码，因此无需为城市另存坐标。
 * - 成功时 `status=0`，实时天气在 `result.realtime[0].infos`：
 *   `weather` / `temperature` / `wind_direction` / `wind_power`（如「3-4级」）/
 *   `wind_power_v2`（如「3级」）/ `humidity`。
 * - 天气现象取值见官方「天气描述表」（晴天/多云/阴/小雨/雷阵雨/…/雾/霾/沙尘暴 等）。
 *
 * 配额与个人开发者额度同「地点搜索」，故调用方必须带缓存，不能每次请求都打这里。
 */

export interface WeatherObservation {
  /** 天气现象原文，如「小雨」「多云」 */
  weather: string
  /** 摄氏度 */
  temperature: number
  windDirection: string
  /** 风力描述，优先取实时天气单值字段 wind_power_v2 */
  windPower: string
  /** 湿度百分比 */
  humidity: number
  /** 腾讯下发的数据更新时间 */
  updateTime: string
}

const BASE_URL = 'https://apis.map.qq.com'
/** 路径不带末尾斜杠，且签名与实际请求必须一致（官方要求） */
const WEATHER_PATH = '/ws/weather/v1'
const REQUEST_TIMEOUT_MS = 8000

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : undefined
}
function toText(value: unknown): string {
  return typeof value === 'string' ? value : ''
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
export class TencentWeatherProvider {
  private readonly logger = new Logger(TencentWeatherProvider.name)

  /** 未配置 key 时整体关闭该数据源（与加油站数据源一致，降级到静态快照） */
  get enabled(): boolean {
    return (process.env.TENCENT_MAP_KEY ?? '').trim().length > 0
  }

  /**
   * 按行政区划代码取实时天气。未配置 key、超时、status≠0 或结构异常一律返回 null，
   * 由调用方降级，绝不让天气接口把页面打挂。
   */
  async fetch(adcode: string): Promise<WeatherObservation | null> {
    if (!this.enabled) return null

    const params: Record<string, string> = {
      key: this.apiKey(),
      adcode,
      type: 'now',
    }
    // key 开启 SN 校验时（控制台配置）必须附签名，否则返回 status 111 会被静默降级
    const secret = tencentMapSecret()
    if (secret) params.sig = buildSignature(WEATHER_PATH, params, secret)

    try {
      const response = await fetch(buildTencentUrl(BASE_URL, WEATHER_PATH, params), { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)

      const payload: unknown = await response.json()
      const status = toNumber(asRecord(payload)?.status)
      if (status !== 0) {
        const message = toText(asRecord(payload)?.message)
        throw new Error(`status ${status}${message ? ` ${message}` : ''}`)
      }

      const realtimeList = asRecord(asRecord(payload)?.result)?.realtime
      const infos = asRecord(asRecord(Array.isArray(realtimeList) ? realtimeList[0] : undefined)?.infos)
      if (!infos) throw new Error('Invalid weather response')

      const weather = toText(infos.weather)
      const temperature = toNumber(infos.temperature)
      if (!weather || temperature === null) throw new Error('Invalid weather fields')

      return {
        weather,
        temperature,
        windDirection: toText(infos.wind_direction),
        windPower: toText(infos.wind_power_v2) || toText(infos.wind_power),
        humidity: toNumber(infos.humidity) ?? 0,
        updateTime: toText(asRecord(Array.isArray(realtimeList) ? realtimeList[0] : undefined)?.update_time),
      }
    } catch (error) {
      this.logger.warn(`腾讯天气查询失败（adcode=${adcode}）：${error instanceof Error ? error.message : String(error)}`)
      return null
    }
  }

  private apiKey(): string {
    return (process.env.TENCENT_MAP_KEY ?? '').trim()
  }
}
