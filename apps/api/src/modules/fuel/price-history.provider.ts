import { canonicalRegion, FUEL_GRADES, PROVINCE_PRICE_SOURCES } from './province-price.provider'
import type { SourceDescriptor } from './province-price.provider'

/**
 * 历史油价回填数据源（东方财富数据中心，公开免鉴权网页接口，AKShare 亦使用）：
 * - RPTA_WEB_YJ_BD：历次成品油调价日期（全国基准）
 * - RPTA_WEB_YJ_JH：某个调价日 31 个省级行政区的 92/95/89/0 零售价与较上期涨跌
 *
 * 官方表**不含 98#**（98# 多属市场调节价）。实测 98# 每期升价涨跌与 95# 完全一致
 * （发改委对 95/98 同吨价调整、密度相同），因此以现有省级源的 98# 当期价为锚点，
 * 按 95# 每期涨跌逐期回算即可得到 98# 历史序列，无需引入第二个易变的网页源。
 *
 * 所有解析/推算均为纯函数，便于单测；HTTP 部分失败时由调用方降级跳过。
 */

const EASTMONEY_API = 'https://datacenter-web.eastmoney.com/api/data/v1/get'
/** 东方财富网页公开 token（其前端页面自带，非私有密钥） */
const EASTMONEY_TOKEN = '894050c76af8597a853f5b408b759f5d'
const REQUEST_TIMEOUT_MS = 8000
const USER_AGENT = 'Mozilla/5.0 (compatible; ChumenLiuliuBot/1.0; +https://www.chumenliuliu.cloud)'

type Row = Record<string, unknown>

export interface RegionPriceRow {
  /** 归一化省份简称，与本项目省级源一致，如「浙江」 */
  region: string
  price92: number
  price95: number
  price0: number
  change92: number
  change95: number
  change0: number
}

export interface PriceHistoryPeriod { date: string; regions: RegionPriceRow[] }

/** 98# 反推锚点：现有省级源给出的当期 98# 价 */
export interface Anchor98 {
  region: string
  regionLabel: string
  price: number
  date: string
}

export interface SnapshotRow {
  region: string
  regionLabel: string
  grade: string
  price: number
  change: number
  publishedAt: Date
}

function rowsOf(payload: unknown): Row[] {
  const root = payload && typeof payload === 'object' ? (payload as Row) : null
  const result = root?.result && typeof root.result === 'object' ? (root.result as Row) : null
  const data = result?.data
  return Array.isArray(data) ? data.filter((row): row is Row => !!row && typeof row === 'object') : []
}

function number(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function dayOf(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value)
  return match ? match[0] : null
}

function round2(value: number) { return Math.round(value * 100) / 100 }

/** 调价日期：只保留 since（含）之后，按最新在前、去重 */
export function parseAdjustmentDates(payload: unknown, since: Date): string[] {
  const sinceDay = since.toISOString().slice(0, 10)
  const days = rowsOf(payload)
    .map((row) => dayOf(row.DIM_DATE))
    .filter((day): day is string => day !== null && day >= sinceDay)
  return [...new Set(days)].sort((left, right) => right.localeCompare(left))
}

/** 某调价日各省零售价与涨跌；字段缺失或省份名异常的记录跳过 */
export function parseRegionPrices(payload: unknown): RegionPriceRow[] {
  return rowsOf(payload).flatMap((row) => {
    const name = typeof row.CITYNAME === 'string' ? canonicalRegion(row.CITYNAME) : ''
    const price92 = number(row.V92)
    const price95 = number(row.V95)
    const price0 = number(row.V0)
    if (!name || price92 === null || price95 === null || price0 === null) return []
    return [{
      region: name,
      price92, price95, price0,
      change92: number(row.ZDE92) ?? 0,
      change95: number(row.ZDE95) ?? 0,
      change0: number(row.ZDE0) ?? 0,
    }]
  })
}

/** 从现有省级免费源提取 98# 当期价（锚点）；source 决定字段与包裹层级 */
export function parse98Anchors(payload: unknown, source: SourceDescriptor): Anchor98[] {
  const field = source.fields.find((item) => item.grade === FUEL_GRADES.gasoline98)
  if (!field) return []
  return source.pickList(payload).flatMap((row) => {
    const label = typeof row[source.regionField] === 'string' ? String(row[source.regionField]) : ''
    const price = number(row[field.price])
    if (!label || price === null) return []
    return [{
      region: canonicalRegion(label),
      regionLabel: label,
      price,
      date: typeof row.date === 'string' ? row.date.slice(0, 10) : '',
    }]
  })
}

/**
 * 98# 反推：changes95 按日期降序（最新在前），第 i 期的涨跌是「较上一期」，
 * 因此 price(i+1) = price(i) - change95(i)。浙江近 14 期实测与真实 98# 价逐期吻合。
 */
export function derive98Prices(anchor: number, changes95: number[]): number[] {
  const prices = [anchor]
  for (let index = 0; index < changes95.length - 1; index++) {
    prices.push(round2(prices[index] - changes95[index]))
  }
  return prices
}

/** 组装写入行：每期每省 92/95/0 三个真实值 + 98# 推算值（无锚点时跳过 98#） */
export function buildSnapshotRows(periods: PriceHistoryPeriod[], anchors: Anchor98[]): SnapshotRow[] {
  const anchorsByRegion = new Map(anchors.map((anchor) => [anchor.region, anchor]))
  const seriesByRegion = new Map<string, { publishedAt: Date; row: RegionPriceRow }[]>()
  for (const period of periods) {
    const publishedAt = new Date(`${period.date}T00:00:00.000Z`)
    for (const row of period.regions) {
      const series = seriesByRegion.get(row.region) ?? []
      series.push({ publishedAt, row })
      seriesByRegion.set(row.region, series)
    }
  }

  const rows: SnapshotRow[] = []
  for (const [region, series] of seriesByRegion) {
    const anchor = anchorsByRegion.get(region)
    const regionLabel = anchor?.regionLabel ?? region
    const prices98 = anchor ? derive98Prices(anchor.price, series.map((entry) => entry.row.change95)) : []
    series.forEach(({ publishedAt, row }, index) => {
      const common = { region, regionLabel, publishedAt }
      rows.push({ ...common, grade: FUEL_GRADES.gasoline92, price: row.price92, change: row.change92 })
      rows.push({ ...common, grade: FUEL_GRADES.gasoline95, price: row.price95, change: row.change95 })
      rows.push({ ...common, grade: FUEL_GRADES.diesel0, price: row.price0, change: row.change0 })
      if (anchor && prices98[index] !== undefined) {
        rows.push({ ...common, grade: FUEL_GRADES.gasoline98, price: prices98[index], change: row.change95 })
      }
    })
  }
  return rows
}

function eastmoneyUrl(params: Record<string, string>) {
  const query = new URLSearchParams({
    ...params, columns: 'ALL', token: EASTMONEY_TOKEN, source: 'WEB', pageNumber: '1',
  })
  return `${EASTMONEY_API}?${query.toString()}`
}

async function fetchJson(url: string): Promise<unknown> {
  const response = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return response.json()
}

/** 拉取 since 之后每一期调价及各省价格；单期失败只跳过该期 */
export async function loadPriceHistory(since: Date): Promise<PriceHistoryPeriod[]> {
  const list = await fetchJson(eastmoneyUrl({
    reportName: 'RPTA_WEB_YJ_BD', sortColumns: 'dim_date', sortTypes: '-1', pageSize: '100',
  }))
  const dates = parseAdjustmentDates(list, since)
  const periods: PriceHistoryPeriod[] = []
  for (const date of dates) {
    try {
      const detail = await fetchJson(eastmoneyUrl({
        reportName: 'RPTA_WEB_YJ_JH', filter: `(dim_date='${date}')`,
        sortColumns: 'cityname', sortTypes: '1', pageSize: '50',
      }))
      const regions = parseRegionPrices(detail)
      if (regions.length) periods.push({ date, regions })
    } catch (error) {
      console.warn(`[Fuel Backfill] 调价日 ${date} 明细获取失败，跳过：${(error as Error).message}`)
    }
  }
  return periods
}

/** 现有省级源的 98# 当期价锚点；两个源依次降级 */
export async function load98Anchors(): Promise<Anchor98[]> {
  for (const source of PROVINCE_PRICE_SOURCES) {
    try {
      const anchors = parse98Anchors(await fetchJson(source.url), source)
      if (anchors.length) return anchors
    } catch (error) {
      console.warn(`[Fuel Backfill] 98# 锚点源 ${source.name} 不可用：${(error as Error).message}`)
    }
  }
  return []
}
