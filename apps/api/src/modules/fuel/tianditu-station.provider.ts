import { createHash } from 'node:crypto'
import { Injectable, Logger } from '@nestjs/common'
import type { GeoPoint } from '../../common/geo'
import { wgs84ToGcj02 } from '../../common/geo'
import type { SourceStation, StationPage, StationProvider } from './station-provider'
import { deriveBrand } from './baidu-station.provider'

/**
 * 附近加油站数据源：天地图「地名搜索V2.0」(`v2/search`)。
 *
 * 背景（2026-10）：作为高德的备选数据源接入——高德个人 Key 有日配额，天地图
 * 实名后个人免费额度充足。通过 `STATION_PROVIDER=tianditu` 启用（默认仍为高德）。
 *
 * 与高德的关键差异：
 * - 检索是 **mapBound(矩形范围) + 行政区** 语义：以城市中心画 bbox 发起请求，
 *   天地图自身按行政区返回（实测会给到全市含县镇），不再做严格 bbox 过滤；
 * - 坐标系为 CGCS2000（≈WGS84），必须转成库内统一的 GCJ-02，否则「距你」偏差数百米；
 * - 结果 **没有 POI id**，用「名称+坐标」的 md5 生成稳定 id，保证跨轮同步 upsert/清理语义；
 * - 数据质量弱于高德：名称多为「加油站」无品牌，品牌推导大多回落通用文案。
 */

const BASE_URL = 'http://api.tianditu.gov.cn'
const SEARCH_PATH = '/v2/search'
const KEYWORD = '加油站'
const PAGE_SIZE = 50
const MAX_PAGES = 6
const REQUEST_TIMEOUT_MS = 10_000
/** 城市中心 → 检索 bbox 半宽（度）：约 ±55km/±39km，覆盖绝大多数地级市市域 */
const BBOX_HALF_LNG = 0.5
const BBOX_HALF_LAT = 0.35

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
export class TiandituStationProvider implements StationProvider {
  private readonly logger = new Logger(TiandituStationProvider.name)

  get enabled(): boolean {
    return this.apiKey().length > 0
  }

  private apiKey(): string {
    return process.env.TIANDITU_MAP_KEY?.trim() ?? ''
  }

  /** 天地图按行政区返回结果，城市中心单点即可触发一轮全量分页拉取 */
  sampleCenters(center: GeoPoint): GeoPoint[] {
    return [center]
  }

  async fetchPage(center: GeoPoint, opts?: { cityCode?: string }): Promise<StationPage | null> {
    if (!this.enabled) {
      this.logger.warn('天地图加油站 provider 未启用：环境变量 TIANDITU_MAP_KEY 为空，将跳过全部城市同步')
      return null
    }
    if (!opts?.cityCode) {
      this.logger.warn('天地图检索缺少城市码，跳过')
      return null
    }

    const mapBound = [
      (center.longitude - BBOX_HALF_LNG).toFixed(4),
      (center.latitude - BBOX_HALF_LAT).toFixed(4),
      (center.longitude + BBOX_HALF_LNG).toFixed(4),
      (center.latitude + BBOX_HALF_LAT).toFixed(4),
    ].join(',')

    const items = new Map<string, SourceStation>()
    for (let page = 0; page < MAX_PAGES; page++) {
      const postStr = JSON.stringify({
        keyWord: KEYWORD,
        mapBound,
        queryType: '1',
        start: page * PAGE_SIZE,
        count: PAGE_SIZE,
        level: 11,
      })
      const url =
        `${BASE_URL}${SEARCH_PATH}?postStr=${encodeURIComponent(postStr)}` +
        `&type=query&tk=${encodeURIComponent(this.apiKey())}`
      try {
        const response = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) })
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const payload = asRecord(await response.json())
        const status = asRecord(payload?.status)
        const total = toNumber(payload?.count) ?? 0
        const infocode = toText(status?.infocode)
        if (infocode && infocode !== '1000') throw new Error(`infocode ${infocode} ${toText(status?.cndesc)}`)
        const pois = Array.isArray(payload?.pois) ? payload.pois : []
        this.logger.log(`天地图检索 ${opts.cityCode} 第 ${page} 页 返回 ${pois.length} 条（总数 ${total}）`)
        if (pois.length === 0) break
        for (const raw of pois) {
          const station = this.parse(raw)
          if (station) items.set(station.id, station)
        }
        if ((page + 1) * PAGE_SIZE >= total) break // 已取完全部结果
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error)
        this.logger.warn(`天地图地点检索失败（${opts.cityCode} 第 ${page} 页）：${reason}`)
        // 部分页失败：保留已取到的数据（不足清理阈值时同步侧不会误删）
        return items.size > 0 ? { items: [...items.values()], count: items.size } : null
      }
    }

    if (items.size === 0) {
      this.logger.warn(`天地图检索 ${opts.cityCode} 命中 0 条`)
      return null
    }
    this.logger.log(`天地图加油站查询成功：${opts.cityCode} 命中 ${items.size} 条`)
    return { items: [...items.values()], count: items.size }
  }

  private parse(raw: unknown): SourceStation | null {
    const poi = asRecord(raw)
    if (!poi) return null
    const name = toText(poi.name)
    const [rawLongitude, rawLatitude] = toText(poi.lonlat).split(',').map((part) => Number(part))
    if (!name || !Number.isFinite(rawLongitude) || !Number.isFinite(rawLatitude)) return null
    if (name.includes('充电')) return null
    // 天地图坐标为 CGCS2000（≈WGS84），转库内统一 GCJ-02
    const gcj = wgs84ToGcj02({ latitude: rawLatitude, longitude: rawLongitude })
    // 无 POI id：用「名称+原始坐标」md5 生成稳定 id，保证跨轮同步 upsert/清理语义
    const id = `tdt-${createHash('md5').update(`${name}|${rawLongitude},${rawLatitude}`, 'utf8').digest('hex').slice(0, 16)}`
    return {
      id,
      name,
      address: toText(poi.address),
      brand: deriveBrand(name, toText(poi.type).split(',').at(-1)?.trim() ?? ''),
      latitude: gcj.latitude,
      longitude: gcj.longitude,
    }
  }
}
