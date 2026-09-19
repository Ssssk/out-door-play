import { Injectable, Logger } from '@nestjs/common'

/**
 * 省级成品油零售价查询。
 *
 * 为什么用省级数据：国内成品油零售价为**按省定价**（各省发改委公布最高零售价），
 * 同省内各城市价格一致。因此省级数据即是可核对的城市口径，比此前使用的
 * 「全国平均价」准确得多。
 *
 * 数据源（2026-09 实测，两家返回内容完全一致，互为备份；均免鉴权、免费）：
 * - 小小 API `GET https://v2.xxapi.cn/api/oilPrice` → `data`（**实测直接是数组**，文档写的 `data.data` 与线上不符）
 * - 澄曜 API `GET https://api.ruseo.cn/api/oilprice` → `data.list`
 * 两家均提供 31 个省级行政区，含 92/95/98 号汽油与 0 号柴油价格及涨跌，
 * `date` 字段为调价日期（本项目当前为该日期的省级价格）。
 */

export interface ProvinceFuelPriceItem {
  /** 已映射为本项目的 grade 文案，如 `92# 汽油` */
  grade: string
  /** 元/升 */
  price: number
  /** 较上期涨跌，元/升（持平为 0） */
  change: number
}

export interface ProvinceFuelPrice {
  /** 归一化省份名（去掉「省/市/自治区」等后缀），如 `湖北` */
  region: string
  /** 数据源给出的原始省份名，用于界面标注口径，如 `湖北省` */
  regionLabel: string
  /** 调价日期（源数据 `date`） */
  publishedAt: Date
  items: ProvinceFuelPriceItem[]
}

interface GradeField {
  price: string
  change: string
  grade: string
}

/** 本项目油号文案：油价卡与加油站挂牌价取值均以此为准 */
export const FUEL_GRADES = {
  gasoline92: '92# 汽油',
  gasoline95: '95# 汽油',
  gasoline98: '98# 汽油',
  diesel0: '0# 柴油',
} as const

export interface SourceDescriptor {
  name: string
  url: string
  /** 从响应中取出省份数组（两家包裹层级不同，xxapi 线上 `data` 直接就是数组） */
  pickList: (payload: unknown) => RawRecord[]
  /** 省份名所在字段 */
  regionField: string
  fields: readonly GradeField[]
}

export const PROVINCE_PRICE_SOURCES: readonly SourceDescriptor[] = [
  {
    name: 'xxapi',
    url: 'https://v2.xxapi.cn/api/oilPrice',
    pickList: (payload) => asArray(asRecord(payload)?.data),
    regionField: 'regionName',
    fields: [
      { price: 'n92', change: 'n92Change', grade: FUEL_GRADES.gasoline92 },
      { price: 'n95', change: 'n95Change', grade: FUEL_GRADES.gasoline95 },
      { price: 'n98', change: 'n98Change', grade: FUEL_GRADES.gasoline98 },
      { price: 'n0', change: 'n0Change', grade: FUEL_GRADES.diesel0 },
    ],
  },
  {
    name: 'ruseo',
    url: 'https://api.ruseo.cn/api/oilprice',
    pickList: (payload) => asArray(asRecord(asRecord(payload)?.data)?.list),
    regionField: 'region',
    fields: [
      { price: 'gasoline_92', change: 'gasoline_92_chg', grade: FUEL_GRADES.gasoline92 },
      { price: 'gasoline_95', change: 'gasoline_95_chg', grade: FUEL_GRADES.gasoline95 },
      { price: 'gasoline_98', change: 'gasoline_98_chg', grade: FUEL_GRADES.gasoline98 },
      { price: 'diesel_0', change: 'diesel_0_chg', grade: FUEL_GRADES.diesel0 },
    ],
  },
]

/**
 * 行政区划代码前两位即省级代码（GB/T 2260）。
 * 只登记本平台当前开放的城市所属省份，值统一为归一化简称以匹配源数据。
 */
const CITY_PREFIX_TO_REGION: Readonly<Record<string, string>> = {
  '11': '北京', '12': '天津', '13': '河北', '14': '山西', '15': '内蒙古',
  '21': '辽宁', '22': '吉林', '23': '黑龙江',
  '31': '上海', '32': '江苏', '33': '浙江', '34': '安徽', '35': '福建', '36': '江西', '37': '山东',
  '41': '河南', '42': '湖北', '43': '湖南', '44': '广东', '45': '广西', '46': '海南',
  '50': '重庆', '51': '四川', '52': '贵州', '53': '云南', '54': '西藏',
  '61': '陕西', '62': '甘肃', '63': '青海', '64': '宁夏', '65': '新疆',
}

const REQUEST_TIMEOUT_MS = 8000
/** 调价周期为 10 个工作日，1 小时缓存足够新鲜且能显著减少外部请求 */
const CACHE_TTL_MS = 60 * 60 * 1000
const USER_AGENT = 'Mozilla/5.0 (compatible; ChumenLiuliuBot/1.0; +https://www.chumenliuliu.cloud)'

type RawRecord = Record<string, unknown>

/** 「广西壮族自治区」→「广西」，「青海省」→「青海」，「内蒙古」→「内蒙古」 */
export function canonicalRegion(name: string): string {
  return name
    .trim()
    .replace(/(特别行政区|自治区|省|市)$/u, '')
    .replace(/(壮族|维吾尔|回族|藏族)$/u, '')
}

/** 由城市码推导归一化省份名；不在已知省级代码内时返回 null */
export function regionFromCityCode(cityCode: string): string | null {
  return CITY_PREFIX_TO_REGION[cityCode.slice(0, 2)] ?? null
}

function asRecord(value: unknown): RawRecord | null {
  return typeof value === 'object' && value !== null ? (value as RawRecord) : null
}

function asArray(value: unknown): RawRecord[] {
  return Array.isArray(value) ? (value as RawRecord[]) : []
}

function toNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

/** 源数据 `date` 为 `YYYY-MM-DD`，按 UTC 零点构造以避开时区偏移 */
function toDate(value: unknown): Date | null {
  if (typeof value !== 'string') return null
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim())
  if (!match) return null
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])))
  return Number.isNaN(date.getTime()) ? null : date
}

/** 把某个数据源的响应解析为省级油价列表；结构不符或字段缺失的记录会被跳过 */
export function parseProvinces(payload: unknown, source: SourceDescriptor): ProvinceFuelPrice[] {
  const provinces: ProvinceFuelPrice[] = []
  for (const record of source.pickList(payload)) {
    const label = record[source.regionField]
    const publishedAt = toDate(record.date)
    if (typeof label !== 'string' || !label.trim() || !publishedAt) continue

    const items: ProvinceFuelPriceItem[] = []
    for (const field of source.fields) {
      const price = toNumber(record[field.price])
      if (price === null || price <= 0) continue
      items.push({ grade: field.grade, price, change: toNumber(record[field.change]) ?? 0 })
    }
    if (items.length === 0) continue

    provinces.push({ region: canonicalRegion(label), regionLabel: label.trim(), publishedAt, items })
  }
  return provinces
}

/** 取某油号的省级价格；省份数据缺失或该油号未返回时返回 null */
export function gradePrice(province: ProvinceFuelPrice | null, grade: string): number | null {
  return province?.items.find((item) => item.grade === grade)?.price ?? null
}

@Injectable()
export class ProvinceFuelPriceProvider {
  private readonly logger = new Logger(ProvinceFuelPriceProvider.name)
  private cache: { value: Map<string, ProvinceFuelPrice>; expiresAt: number } | null = null
  private inflight: Promise<Map<string, ProvinceFuelPrice> | null> | null = null

  /** 按归一化省份名取省级油价；所有数据源均不可用时返回 null（调用方降级为空态） */
  async fetchByRegion(region: string): Promise<ProvinceFuelPrice | null> {
    const provinces = await this.load()
    return provinces?.get(region) ?? null
  }

  private async load(): Promise<Map<string, ProvinceFuelPrice> | null> {
    if (this.cache && this.cache.expiresAt > Date.now()) return this.cache.value
    // 油价卡与加油站列表由前端并行请求，复用同一次外部请求避免重复拉取
    this.inflight ??= this.fetchAll().finally(() => { this.inflight = null })
    return this.inflight
  }

  private async fetchAll(): Promise<Map<string, ProvinceFuelPrice> | null> {
    for (const source of PROVINCE_PRICE_SOURCES) {
      try {
        const payload = await this.fetchJson(source.url)
        const provinces = parseProvinces(payload, source)
        if (provinces.length === 0) throw new Error('未解析到任何省份数据')

        const value = new Map(provinces.map((province) => [province.region, province]))
        this.cache = { value, expiresAt: Date.now() + CACHE_TTL_MS }
        return value
      } catch (error) {
        this.logger.warn(`省级油价源 ${source.name} 不可用，尝试下一个源：${(error as Error).message}`)
      }
    }

    this.logger.warn('全部省级油价源均不可用，本次将返回空态')
    return null
  }

  private async fetchJson(url: string): Promise<unknown> {
    const response = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return response.json()
  }
}
