import { Injectable, Logger } from '@nestjs/common'
import type { GeoPoint } from '../../common/geo'
import { buildSignature } from '../../common/tencent-signature'
import type { SourceStation, StationPage, StationProvider } from './station-provider'

/**
 * 附近加油站数据源：腾讯位置服务「地点搜索」（WebService API）。
 *
 * 用法：按用户 GCJ-02 坐标实时请求，Key/Secret 仅在服务端使用。
 *
 * 官方文档（2026-09 核对）中必须照做的点：
 * - `boundary=nearby(lat,lng,radius)` 的坐标顺序是**纬度在前**（与高德相反）；
 *   且 radius 上限仅 1000 米，靠 `auto_extend`（默认开）按 1→2→5km→全城市自动扩大。
 * - **每页最多 20 条**，同一组参数最多只能翻出 200 条。
 * - ⚠️ `page_index` 超出总页数**不报错**，会重复返回最后一段 —— 所以「还有没有下一页」
 *   只能按返回的 `count` 自行判断，绝不能靠「本页是否为空」。
 * - key 开启 SN 校验时必须附 `sig`：`md5(路径 + "?" + 参数名升序的原始值拼接 + SK)`，
 *   路径含 `/ws/` 前缀，且参与签名的值必须**未经 urlencode**。
 *
 * 腾讯不返回油价，站点不展示补造的价格。
 */

export interface TencentStation extends SourceStation {
  /** 腾讯下发的省份名（如「湖北省」），调用方据此取省级指导价 */
  province: string
}

/**
 * 腾讯 nearby 半径仅 1000 米，需用多中心采样覆盖主城区。
 * 与同步服务的 3×3 采样保持一致；OSM 半径大，无需多中心。
 */
const TENCENT_SAMPLE_OFFSETS: ReadonlyArray<readonly [number, number]> = [
  [0, 0], [0.08, 0], [-0.08, 0], [0, 0.08], [0, -0.08],
  [0.08, 0.08], [0.08, -0.08], [-0.08, 0.08], [-0.08, -0.08],
]

const BASE_URL = 'https://apis.map.qq.com'
const SEARCH_PATH = '/ws/place/v1/search'
const KEYWORD = '加油站'
/**
 * 分类过滤：191000 = 汽车:加油站。
 *
 * ⚠️ 实测（2026-09-19，真实 key）：关键词「加油站」下腾讯默认按距离返回的**前 20 条
 * 全是 `汽车:加油站:充电站`（191014）**，即充电桩被排在前面。故服务端必须写
 * 「排除 191014」，实测可把该分类全部滤掉、返回真正的加油站。
 */
const CATEGORY_FILTER = 'category<>191014'
/**
 * 非加油站 POI 的剔除关键字，**名称与分类一并匹配**。
 *
 * ⚠️ 实测（2026-09-19）发现「服务端过滤 + 只看分类」**都不够**：腾讯会把部分充电桩
 * 归到 `汽车:加油站:其它加油站`（191099）而不是 `充电站`（191014），
 * 例如「团结名居桂圆3号充电桩」「瞰江坊1号充电桩」——
 * 它们能通过 `category<>191014` 的服务端过滤，分类串里也没有「充电」二字，
 * 只有**名称**带「充电桩」。因此名称必须一并纳入匹配，否则充电桩会被写进库。
 */
const EXCLUDED_HINTS = ['充电']
const ORDER_BY = '_distance'
/** 腾讯每页上限 20 条，无法调高 */
const PAGE_SIZE = 20
/** 腾讯 nearby 的半径上限只有 1000 米，更远的范围由 auto_extend 自动扩大 */
const NEARBY_RADIUS_METERS = 1000
const REQUEST_TIMEOUT_MS = 8000

/** 由 POI 名称优先识别品牌，识别不出再看分类 */
const BRAND_HINTS: ReadonlyArray<readonly [string, string]> = [
  ['中国石化', '中石化'], ['中石化', '中石化'],
  ['中国石油', '中石油'], ['中石油', '中石油'],
  ['中国海油', '中海油'], ['中海油', '中海油'], ['中国海洋石油', '中海油'],
  ['壳牌', 'Shell'], ['shell', 'Shell'],
  ['道达尔', '道达尔'], ['total', '道达尔'],
  ['中化', '中化'], ['bp', 'BP'],
]

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

/**
 * 腾讯 SN 校验签名实现已抽到 `common/tencent-signature`（天气查询共用同一份），
 * 这里保留再导出，避免既有调用方与测试改动。
 */
export { buildSignature }

/** 名称优先、分类兜底地推导品牌；都识别不出时统一记作「加油站」 */
export function deriveBrand(title: string, category: string): string {
  const haystack = title.toLowerCase()
  for (const [hint, brand] of BRAND_HINTS) {
    if (haystack.includes(hint)) return brand
  }
  // 分类形如「汽车:加油站:中石化」，最后一段常是品牌或油站类型
  const segment = category.split(':').at(-1)?.trim() ?? ''
  return segment && segment !== '加油站' && segment !== '其它加油站' ? segment : '加油站'
}

/** 解析腾讯返回体；结构不符或缺少必要字段的记录会被跳过 */
export function parseStations(payload: unknown): { items: TencentStation[]; count: number } {
  const record = asRecord(payload)
  const list = Array.isArray(record?.data) ? record.data : []
  const items: TencentStation[] = []

  for (const raw of list) {
    const poi = asRecord(raw)
    if (!poi) continue
    const location = asRecord(poi.location)
    const latitude = toNumber(location?.lat)
    const longitude = toNumber(location?.lng)
    const rawId = toText(poi.id)
    if (!rawId) continue
    const id = `tx-${rawId}`
    const name = toText(poi.title)
    const category = toText(poi.category)
    if (!name || latitude === null || longitude === null) continue
    // 充电桩等非加油 POI 一律剔除：腾讯既会混入 191014「充电站」，也会把部分充电桩
    // 误分类成 191099「其它加油站」（只有名称能识别），故名称与分类都要匹配
    if (EXCLUDED_HINTS.some((hint) => `${name}${category}`.includes(hint))) continue

    items.push({
      id,
      name,
      address: toText(poi.address),
      brand: deriveBrand(name, category),
      latitude,
      longitude,
      province: toText(asRecord(poi.ad_info)?.province),
    })
  }

  // count 是腾讯给出的结果总数（可能大于 200，但实际最多只能取到 200）
  return { items, count: toNumber(record?.count) ?? items.length }
}

@Injectable()
export class TencentStationProvider implements StationProvider {
  private readonly logger = new Logger(TencentStationProvider.name)

  /** 未配置 key 时整体关闭该数据源 */
  get enabled(): boolean {
    return this.apiKey().length > 0
  }

  private apiKey(): string {
    return process.env.TENCENT_MAP_KEY?.trim() ?? ''
  }

  private secretKey(): string {
    return process.env.TENCENT_MAP_SECRET?.trim() ?? ''
  }

  /** 腾讯半径受限，每个城市用 3×3 共 9 个采样中心覆盖主城区。 */
  sampleCenters(center: GeoPoint): GeoPoint[] {
    return TENCENT_SAMPLE_OFFSETS.map(([dLat, dLng]) => ({
      latitude: center.latitude + dLat,
      longitude: center.longitude + dLng,
    }))
  }

  /**
   * 取一页加油站 POI（腾讯每页上限 20 条）。
   *
   * ⚠️ 这是**配额敏感**入口：调用一次即消耗一次额度，而个人开发者只有 200 次/日。
   * 因此这里只暴露「单页」，不提供自动翻页——请求次数由调用方按分页窗口控制。
   */
  async fetchPage(center: GeoPoint, opts?: { pageIndex?: number; window?: { offset: number; limit: number } }): Promise<StationPage | null> {
    if (!this.enabled) return null
    const pageIndex = opts?.pageIndex ?? 1
    const window = opts?.window

    const params: Record<string, string> = {
      key: this.apiKey(),
      keyword: KEYWORD,
      // ⚠️ 纬度在前、经度在后（与高德相反）；半径上限 1000 米
      boundary: `nearby(${center.latitude},${center.longitude},${NEARBY_RADIUS_METERS})`,
      filter: CATEGORY_FILTER,
      orderby: ORDER_BY,
      page_size: String(PAGE_SIZE),
      page_index: String(pageIndex),
      added_fields: 'category_code',
    }
    const secret = this.secretKey()
    // sig 必须基于「不含 sig 自身」的参数串计算
    if (secret) params.sig = buildSignature(SEARCH_PATH, params, secret)

    try {
      const response = await fetch(this.buildUrl(params), { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)

      const payload: unknown = await response.json()
      const status = toNumber(asRecord(payload)?.status)
      if (status !== 0) {
        const message = toText(asRecord(payload)?.message)
        throw new Error(`status ${status}${message ? ` ${message}` : ''}`)
      }
      const record = asRecord(payload)
      if (!Array.isArray(record?.data) || toNumber(record?.count) === null) throw new Error('Invalid POI response')
      const data = window ? record.data.slice(window.offset, window.offset + window.limit) : record.data
      return parseStations({ ...record, data })
    } catch (error) {
      // 不输出原始 URL，避免泄露 Key 或签名；但保留腾讯返回的 status/message，
      // 否则配额超限（121）、签名错误（111）、无权限（112）等无法从日志区分。
      const reason = error instanceof Error ? error.message : String(error)
      this.logger.warn(`腾讯地点搜索请求失败：${reason}`)
      return null
    }
  }

  private buildUrl(params: Record<string, string>): string {
    // 发送时逐值 urlencode；签名已经用原始值算过，两者不能混用
    const query = Object.entries(params)
      .map(([name, value]) => `${name}=${encodeURIComponent(value)}`)
      .join('&')
    return `${BASE_URL}${SEARCH_PATH}?${query}`
  }
}
