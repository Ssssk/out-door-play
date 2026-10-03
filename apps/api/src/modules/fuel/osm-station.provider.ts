import { Injectable, Logger } from '@nestjs/common'
import type { GeoPoint } from '../../common/geo'
import { wgs84ToGcj02 } from '../../common/geo'
import { deriveBrand } from './tencent-station.provider'
import type { SourceStation, StationPage, StationProvider } from './station-provider'

/**
 * 加油站数据源：OpenStreetMap Overpass API（开源、免费、无每日配额）。
 *
 * 用法：按中心点附近的「加油站」(`amenity=fuel`) 查询，坐标由 WGS-84 转换为
 * 库内统一的 GCJ-02。相比腾讯，OSM 国内覆盖密度偏低（县城可能不全），但不受
 * 个人开发者 200 次/日的额度限制——适合作为主数据源长期运行。
 *
 * 公共 Overpass 实例有速率限制，这里对多个镜像做顺序兜底，并在每次请求间留间隔。
 */
@Injectable()
export class OsmStationProvider implements StationProvider {
  private readonly logger = new Logger(OsmStationProvider.name)

  /** 公共 Overpass 镜像；任一超时/失败则顺延到下一个。 */
  private readonly mirrors = [
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
    'https://overpass.openstreetmap.ru/api/interpreter',
  ]

  /** 单中心点覆盖的半边长（度），≈17km，足以覆盖一般主城区。 */
  private readonly halfDelta = 0.16
  /** 每个中心点最多取多少条，避免超大 bbox 拖垮实例。 */
  private readonly perCenterLimit = 300
  private readonly requestTimeoutMs = 25000
  /** 两次 Overpass 请求间留白，规避公共实例速率限制。 */
  private readonly interRequestDelayMs = 1500

  /** OSM 单中心即可覆盖，无需多中心采样。 */
  sampleCenters(center: GeoPoint): GeoPoint[] {
    return [center]
  }

  async fetchPage(center: GeoPoint): Promise<StationPage | null> {
    const south = center.latitude - this.halfDelta
    const north = center.latitude + this.halfDelta
    const west = center.longitude - this.halfDelta
    const east = center.longitude + this.halfDelta
    const query =
      `[out:json][timeout:25];node["amenity"="fuel"](${south},${west},${north},${east});` +
      `out body ${this.perCenterLimit};`

    let lastError: unknown
    for (const mirror of this.mirrors) {
      try {
        const response = await fetch(mirror, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `data=${encodeURIComponent(query)}`,
          signal: AbortSignal.timeout(this.requestTimeoutMs),
        })
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const payload: unknown = await response.json()
        const items = this.parse(payload)
        this.logger.log(`OSM 加油站查询成功：${mirror} 命中 ${items.length} 条`)
        return { items, count: items.length }
      } catch (error) {
        lastError = error
        const reason = error instanceof Error ? error.message : String(error)
        this.logger.warn(`OSM 镜像 ${mirror} 失败：${reason}`)
      }
    }
    this.logger.warn('所有 OSM 镜像均失败，跳过该中心')
    return null
  }

  /** 解析 Overpass JSON，过滤非加油站、转换坐标；结构不符的记录跳过。 */
  private parse(payload: unknown): SourceStation[] {
    const record = asRecord(payload)
    const elements = Array.isArray(record?.elements) ? record.elements : []
    const stations: SourceStation[] = []

    for (const raw of elements) {
      const el = asRecord(raw)
      if (!el) continue
      const id = String(el.id ?? '')
      const lat = toNumber(el.lat)
      const lon = toNumber(el.lon)
      const tags = asRecord(el.tags)
      const name = toText(tags?.name)
      // OSM 节点必须有名称与坐标；`amenity=fuel` 本身即加油站，无需再排除充电桩
      if (!id || !name || lat === null || lon === null) continue

      // OSM 为 WGS-84，转成库内统一的 GCJ-02 后再入库，保证"距你"距离正确
      const gcj = wgs84ToGcj02({ latitude: lat, longitude: lon })
      stations.push({
        id: `osm-${id}`,
        name,
        address: toText(tags?.['addr:full']) || toText(tags?.['addr:street']) || toText(tags?.['name:en']) || '',
        brand: deriveBrand(name, toText(tags?.amenity)),
        latitude: gcj.latitude,
        longitude: gcj.longitude,
      })
    }
    return stations
  }
}

type RawRecord = Record<string, unknown>

function asRecord(value: unknown): RawRecord | null {
  return typeof value === 'object' && value !== null ? (value as RawRecord) : null
}

function toNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function toText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}
