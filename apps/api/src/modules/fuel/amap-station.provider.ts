import { Injectable, Logger } from '@nestjs/common'
import type { GeoPoint } from '../../common/geo'
import type { SourceStation, StationKind, StationPage, StationProvider } from './station-provider'
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
  private readonly pageSize = 20
  private readonly maxPages = 10
  private readonly requestTimeoutMs = 8000

  /** 高德检索关键词按站点类型切换：油站 vs 充电站 */
  private keywordFor(kind: StationKind): string {
    return kind === 'ev' ? '充电站' : '加油站'
  }

  /** 翻页间隔：个人 Key QPS=3，取 400ms（≈2.5 QPS）留出余量（天气等同 Key 调用共享配额） */
  private static readonly QPS_INTERVAL_MS = 400
  /** 单页 QPS 超限(10021)最大重试次数 */
  private static readonly QPS_RETRY_MAX = 4
  /** QPS 重试基础等待，按尝试次数线性放大 */
  private static readonly QPS_RETRY_WAIT_MS = 600

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

  async fetchPage(_center: GeoPoint, opts?: { cityCode?: string; kind?: StationKind }): Promise<StationPage | null> {
    if (!this.enabled) {
      this.logger.warn('高德加油站 provider 未启用：环境变量 AMAP_MAP_KEY 为空，将跳过全部城市同步')
      return null
    }
    const cityCode = opts?.cityCode
    const kind = opts?.kind ?? 'fuel'
    if (!cityCode) {
      this.logger.warn('高德检索缺少城市码，跳过')
      return null
    }

    const items: SourceStation[] = []
    for (let page = 1; page <= this.maxPages; page++) {
      // 高德个人 Key QPS 仅 3 次/秒（infocode 10021 CUQPS_HAS_EXCEEDED_THE_LIMIT），
      // 翻页请求间强制间隔，把速率压到限值以下
      if (page > 1) await sleep(AmapStationProvider.QPS_INTERVAL_MS)
      const record = await this.requestSearchPage(cityCode, page, kind)
      if (!record) {
        // 单页彻底失败：保留已取到的页（此前整城丢弃导致「取到 0 条」），不足清理阈值时同步侧不会误删
        if (items.length > 0) {
          this.logger.warn(`高德检索 ${cityCode} 第 ${page} 页起失败，保留已取到的 ${items.length} 条`)
          break
        }
        return null
      }
      const pois = Array.isArray(record.pois) ? record.pois : []
      if (pois.length === 0) break // 已到末页
      this.logger.log(`高德检索 ${cityCode} 第 ${page} 页 返回 ${pois.length} 条`)
      for (const raw of pois) {
        const station = this.parse(raw, kind)
        if (station) items.push(station)
      }
      if (pois.length < this.pageSize) break // 不足一页，已是末页
    }

    this.logger.log(`高德站点查询成功（${kind}）：${cityCode} 命中 ${items.length} 条`)
    return { items, count: items.length }
  }

  /** 请求单页；命中 QPS 超限（10021）时指数退避重试，其余错误直接抛出 */
  private async requestSearchPage(cityCode: string, page: number, kind: StationKind): Promise<RawRecord | null> {
    const url =
      `${this.baseUrl}${this.searchPath}?key=${encodeURIComponent(this.apiKey())}` +
      `&keywords=${encodeURIComponent(this.keywordFor(kind))}&city=${encodeURIComponent(cityCode)}` +
      `&citylimit=true&offset=${this.pageSize}&page=${page}`
    let lastReason = ''
    for (let attempt = 1; attempt <= AmapStationProvider.QPS_RETRY_MAX; attempt++) {
      try {
        const response = await fetch(url, { signal: AbortSignal.timeout(this.requestTimeoutMs) })
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const payload: unknown = await response.json()
        const record = asRecord(payload)
        // 高德约定：status '1' 成功；infocode 10000 为正常
        if (toText(record?.status) !== '1') {
          const infocode = toText(record?.infocode)
          const info = toText(record?.info)
          if (infocode === '10021' && attempt < AmapStationProvider.QPS_RETRY_MAX) {
            lastReason = `infocode 10021 ${info}`
            this.logger.warn(`高德 QPS 超限（${cityCode} 第 ${page} 页 第 ${attempt} 次），${AmapStationProvider.QPS_RETRY_WAIT_MS * attempt}ms 后重试`)
            await sleep(AmapStationProvider.QPS_RETRY_WAIT_MS * attempt)
            continue
          }
          throw new Error(`infocode ${infocode}${info ? ` ${info}` : ''}`)
        }
        return record
      } catch (error) {
        lastReason = error instanceof Error ? error.message : String(error)
        await sleep(300)
      }
    }
    this.logger.warn(`高德地点检索失败（${cityCode} 第 ${page} 页）：${lastReason}`)
    return null
  }

  private parse(raw: unknown, kind: StationKind = 'fuel'): SourceStation | null {
    const poi = asRecord(raw)
    if (!poi) return null
    const id = toText(poi.id)
    const name = toText(poi.name)
    const [longitude, latitude] = toText(poi.location).split(',').map((part) => Number(part))
    if (!id || !name || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return null
    // 加油站模式下排除充电桩等邻近 POI；充电站模式下排除加油站/汽修，避免写错台账
    if (kind === 'fuel' && name.includes('充电')) return null
    if (kind === 'ev' && (name.includes('加油') || name.includes('汽'))) return null
    return {
      id: `am-${id}`,
      name,
      address: toText(poi.address),
      // 高德分类形如「汽车服务;加油站;中国石化」，末段常是品牌
      brand: kind === 'ev' ? '充电站' : deriveBrand(name, toText(poi.type).split(';').at(-1)?.trim() ?? ''),
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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
