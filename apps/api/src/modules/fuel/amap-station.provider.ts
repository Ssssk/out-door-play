import { Injectable, Logger } from '@nestjs/common'
import type { GeoPoint } from '../../common/geo'
import type { SourceStation, StationPage, StationProvider } from './station-provider'
import { deriveBrand } from './baidu-station.provider'

/**
 * 附近加油站数据源：高德开放平台「搜索POI 2.0/1.0」(`v3/place/text`)。
 *
 * 为什么从百度切到高德（2026-10）：部署服务器所在网络把 `api.map.baidu.com`
 * 单独劫持到内网网关（返回 `[10.x.x.x:2004][E1002] Fail to find method`），
 * 百度同步全部失败；`restapi.amap.com` 实测可达，故切换。
 *
 * 关键点：
 * - 高德坐标即 GCJ-02，与库内统一坐标系一致，**无需转换**（比百度还省一步）。
 * - `city` 参数直接接受 6 位国标 adcode（与 cities.code 一致），配合 `citylimit=true`
 *   按城市全量检索，每城分页拉取（与百度版同为最多 200 条）。
 * - 高德对缺失字段会返回空数组 `[]` 而非空串，解析时统一兜底。
 */
@Injectable()
export class AmapStationProvider implements StationProvider {
  private readonly logger = new Logger(AmapStationProvider.name)

  private readonly baseUrl = 'https://restapi.amap.com'
  private readonly searchPath = '/v3/place/text'
  private readonly keyword = '加油站'
  private readonly pageSize = 20
  private readonly maxPages = 10
  private readonly requestTimeoutMs = 8000

  get enabled(): boolean {
    return this.apiKey().length > 0
  }

  private apiKey(): string {
    return process.env.AMAP_MAP_KEY?.trim() ?? ''
  }

  /** 高德按 adcode 全城检索，单点即可触发一次全城分页拉取。 */
  sampleCenters(center: GeoPoint): GeoPoint[] {
    return [center]
  }

  async fetchPage(_center: GeoPoint, opts?: { cityCode?: string }): Promise<StationPage | null> {
    if (!this.enabled) {
      this.logger.warn('高德加油站 provider 未启用：环境变量 AMAP_MAP_KEY 为空，将跳过全部城市同步')
      return null
    }
    const cityCode = opts?.cityCode
    if (!cityCode) {
      this.logger.warn('高德检索缺少城市码，跳过')
      return null
    }

    const items: SourceStation[] = []
    for (let page = 1; page <= this.maxPages; page++) {
      const url =
        `${this.baseUrl}${this.searchPath}?key=${encodeURIComponent(this.apiKey())}` +
        `&keywords=${encodeURIComponent(this.keyword)}&city=${encodeURIComponent(cityCode)}` +
        `&citylimit=true&offset=${this.pageSize}&page=${page}`
      try {
        const response = await fetch(url, { signal: AbortSignal.timeout(this.requestTimeoutMs) })
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const payload: unknown = await response.json()
        const record = asRecord(payload)
        // 高德约定：status '1' 成功；infocode 10000 为正常，其余（如 10044/10021 配额类）报错
        if (toText(record?.status) !== '1') {
          const info = toText(record?.info)
          throw new Error(`infocode ${toText(record?.infocode)}${info ? ` ${info}` : ''}`)
        }
        const pois = Array.isArray(record?.pois) ? record.pois : []
        if (pois.length === 0) break // 已到末页
        this.logger.log(`高德检索 ${cityCode} 第 ${page} 页 返回 ${pois.length} 条`)
        for (const raw of pois) {
          const station = this.parse(raw)
          if (station) items.push(station)
        }
        if (pois.length < this.pageSize) break // 不足一页，已是末页
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error)
        this.logger.warn(`高德地点检索失败（${cityCode} 第 ${page} 页）：${reason}`)
        return null
      }
    }

    this.logger.log(`高德加油站查询成功：${cityCode} 命中 ${items.length} 条`)
    return { items, count: items.length }
  }

  private parse(raw: unknown): SourceStation | null {
    const poi = asRecord(raw)
    if (!poi) return null
    const id = toText(poi.id)
    const name = toText(poi.name)
    const [longitude, latitude] = toText(poi.location).split(',').map((part) => Number(part))
    if (!id || !name || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return null
    // 排除充电桩等邻近 POI，避免写进加油站台账
    if (name.includes('充电')) return null
    return {
      id: `am-${id}`,
      name,
      address: toText(poi.address),
      // 高德分类形如「汽车服务;加油站;中国石化」，末段常是品牌
      brand: deriveBrand(name, toText(poi.type).split(';').at(-1)?.trim() ?? ''),
      latitude,
      longitude,
      province: toText(poi.pname),
    }
  }
}

type RawRecord = Record<string, unknown>

function asRecord(value: unknown): RawRecord | null {
  return typeof value === 'object' && value !== null ? (value as RawRecord) : null
}

/** 高德对缺失字段返回空数组 [] 而非空串，这里统一兜底成空串 */
function toText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}
