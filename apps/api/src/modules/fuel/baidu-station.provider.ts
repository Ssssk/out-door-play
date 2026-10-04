import { Injectable, Logger } from '@nestjs/common'
import type { GeoPoint } from '../../common/geo'
import { bd09ToGcj02 } from '../../common/geo'
import { calcBaiduSn, toBaiduQuery } from '../../common/baidu-signature'
import type { SourceStation, StationPage, StationProvider } from './station-provider'

/**
 * 附近加油站数据源：百度地图开放平台「地点检索服务」(`place/v2/search`)。
 *
 * 国内可达、个人配额约 2000 次/日，适合作主数据源。
 *
 * 关键点：
 * - 百度坐标体系为 BD-09，返回的坐标必须转回库内统一的 GCJ-02，否则「距你」偏移数百米~1 公里。
 * - 用 `region=城市名` 模式按城市全量检索（不依赖坐标半径），每城分页拉取（最多 200 条）。
 * - AK 开启 SN 校验时需按百度规范计算 `sn`（见 common/baidu-signature）。
 */

@Injectable()
export class BaiduStationProvider implements StationProvider {
  private readonly logger = new Logger(BaiduStationProvider.name)

  /** 同步城市码 → 百度「地点检索」需要的城市名（region 参数）。 */
  private readonly cityNames: Record<string, string> = {
    '110000': '北京', '310000': '上海', '320100': '南京', '330100': '杭州',
    '420100': '武汉', '430100': '长沙', '440100': '广州', '440300': '深圳',
    '500000': '重庆', '510100': '成都', '450200': '柳州',
  }

  private readonly baseUrl = 'https://api.map.baidu.com'
  private readonly searchPath = '/place/v2/search'
  private readonly keyword = '加油站'
  private readonly pageSize = 20
  private readonly maxPages = 10
  private readonly requestTimeoutMs = 8000

  get enabled(): boolean {
    return this.apiKey().length > 0
  }

  private apiKey(): string {
    return process.env.BAIDU_MAP_AK?.trim() ?? ''
  }

  private secretKey(): string {
    return process.env.BAIDU_MAP_SK?.trim() ?? ''
  }

  /** 百度用 region 城市检索，单点即可触发一次全城分页拉取。 */
  sampleCenters(center: GeoPoint): GeoPoint[] {
    return [center]
  }

  async fetchPage(center: GeoPoint, opts?: { cityCode?: string }): Promise<StationPage | null> {
    if (!this.enabled) {
      this.logger.warn('百度加油站 provider 未启用：环境变量 BAIDU_MAP_AK 为空，将跳过全部城市同步（柳州等将无法入库）')
      return null
    }
    const cityName = opts?.cityCode ? this.cityNames[opts.cityCode] : undefined
    if (!cityName) {
      this.logger.warn(`百度检索跳过未知城市码：${opts?.cityCode ?? 'undefined'}`)
      return null
    }

    const items: SourceStation[] = []
    const ak = this.apiKey()
    const sk = this.secretKey()

    for (let page = 0; page < this.maxPages; page++) {
      const params: Record<string, string> = {
        query: this.keyword,
        region: cityName,
        output: 'json',
        ak,
        page_size: String(this.pageSize),
        page_num: String(page),
      }
      if (sk) params.sn = calcBaiduSn(this.searchPath, params, sk)

      const url = `${this.baseUrl}${this.searchPath}?${toBaiduQuery(params)}`
      try {
        const response = await fetch(url, { signal: AbortSignal.timeout(this.requestTimeoutMs) })
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const payload: unknown = await response.json()
        const record = asRecord(payload)
        const status = toNumber(record?.status)
        // status 0 成功；302 配额超限；其它为参数/权限错误
        if (status !== 0) {
          const message = toText(record?.message)
          throw new Error(`status ${status}${message ? ` ${message}` : ''}`)
        }
        const results = Array.isArray(record?.results) ? record.results : []
        if (results.length === 0) break // 已到末页
        this.logger.log(`百度检索 ${cityName} 第 ${page} 页 返回 ${results.length} 条`)
        for (const raw of results) {
          const station = this.parse(raw)
          if (station) items.push(station)
        }
        if (results.length < this.pageSize) break // 不足一页，已是末页
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error)
        this.logger.warn(`百度地点检索失败（${cityName} 第 ${page} 页）：${reason}`)
        return null
      }
    }

    this.logger.log(`百度加油站查询成功：${cityName} 命中 ${items.length} 条`)
    return { items, count: items.length }
  }

  private parse(raw: unknown): SourceStation | null {
    const poi = asRecord(raw)
    if (!poi) return null
    const location = asRecord(poi.location)
    const latitude = toNumber(location?.lat)
    const longitude = toNumber(location?.lng)
    const uid = toText(poi.uid)
    const name = toText(poi.name)
    const address = toText(poi.address)
    if (!uid || !name || latitude === null || longitude === null) return null
    // 排除充电桩等邻近 POI，避免写进加油站台账
    if (name.includes('充电')) return null
    // 百度坐标为 BD-09，转回库内统一的 GCJ-02
    const gcj = bd09ToGcj02({ latitude, longitude })
    return {
      id: `bd-${uid}`,
      name,
      address,
      brand: deriveBrand(name, ''),
      latitude: gcj.latitude,
      longitude: gcj.longitude,
      province: toText(poi.province),
    }
  }
}

/** 名称优先、分类兜底地推导品牌；都识别不出时统一记作「加油站」 */
export function deriveBrand(title: string, category: string): string {
  const haystack = title.toLowerCase()
  const BRAND_HINTS: ReadonlyArray<readonly [string, string]> = [
    ['中国石化', '中石化'], ['中石化', '中石化'],
    ['中国石油', '中石油'], ['中石油', '中石油'],
    ['中国海油', '中海油'], ['中海油', '中海油'], ['中国海洋石油', '中海油'],
    ['壳牌', 'Shell'], ['shell', 'Shell'],
    ['道达尔', '道达尔'], ['total', '道达尔'],
    ['中化', '中化'], ['bp', 'BP'],
  ]
  for (const [hint, brand] of BRAND_HINTS) {
    if (haystack.includes(hint)) return brand
  }
  const segment = category.split(':').at(-1)?.trim() ?? ''
  return segment && segment !== '加油站' && segment !== '其它加油站' ? segment : '加油站'
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
