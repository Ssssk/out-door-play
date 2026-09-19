import { Injectable, Logger } from '@nestjs/common'

/**
 * 国家发改委价格监测中心「中国价格信息网」油价抓取。
 *
 * 数据形态（2026-09 实测，非接口、需解析 HTML）：
 * - 列表页 `http://www.chinaprice.cn/nyscdtgd/index.jhtml` 按时间倒序列出「X月第N周全国汽油/柴油价格行情」
 * - 正文为单段文字，例如：
 *   本期（2026年8月26日）全国汽油平均价格中，汽油(92号车用)价格为7.85元/升，环比0.13%；
 *   汽油(95号车用)价格为8.37元/升，环比与上期持平；……
 * - 口径：**全国平均价**、**按周发布**，不含分省/分城市明细（分地区数据需向该网付费获取）
 */

export interface OfficialFuelPriceItem {
  /** 已映射为本项目的 grade 文案，如 `92# 汽油` */
  grade: string
  price: number
  /** 由「环比」换算出的元/升，持平为 0 */
  change: number
}

export interface OfficialFuelPrice {
  /** 数据所属日期（正文「本期（X年X月X日）」） */
  publishedAt: Date
  items: OfficialFuelPriceItem[]
}

const LIST_URL = 'http://www.chinaprice.cn/nyscdtgd/index.jhtml'
const GASOLINE_KEYWORD = '全国汽油价格行情'
const DIESEL_KEYWORD = '全国柴油价格行情'
const REQUEST_TIMEOUT_MS = 8000
const CACHE_TTL_MS = 6 * 60 * 60 * 1000
const USER_AGENT = 'Mozilla/5.0 (compatible; ChumenLiuliuBot/1.0; +https://www.chumenliuliu.cloud)'

/** 官方文案 → 本项目 grade */
const GRADES: Record<string, string> = {
  '92': '92# 汽油',
  '95': '95# 汽油',
  '98': '98# 汽油',
  '0': '0# 柴油',
}

function stripTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, '\n')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}

/**
 * 从列表页挑出关键词对应的最新（列表按时间倒序，取第一个）文章地址。
 * 逐段解析而非单条复杂正则，避免回溯风险。
 */
export function pickLatestArticleUrl(listHtml: string, keyword: string): string | null {
  for (const segment of listHtml.split(/<a\s/iu).slice(1)) {
    const tagEnd = segment.indexOf('>')
    const textEnd = segment.indexOf('</a>')
    if (tagEnd === -1 || textEnd === -1 || textEnd < tagEnd) continue
    const href = /href\s*=\s*"([^"]*)"/iu.exec(segment.slice(0, tagEnd))?.[1]
    if (href && segment.slice(tagEnd + 1, textEnd).includes(keyword)) return href
  }
  return null
}

/** 正文数据日期，如「本期（2026年8月26日）」。 */
export function parsePublishedAt(text: string): Date | null {
  const match = /本期（(\d{4})年(\d{1,2})月(\d{1,2})日）/.exec(text)
  if (!match) return null
  const [, year, month, day] = match
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)))
  return Number.isNaN(date.getTime()) ? null : date
}

/** 把「环比 0.13% / 环比与上期持平」换算成元/升。 */
function parseChange(ratioText: string, price: number): number {
  if (ratioText.includes('持平')) return 0
  // 取文本中最后一段数字作为百分比数值（线性匹配，避免回溯风险）
  const rate = Number(ratioText.match(/[-0-9.]+/gu)?.at(-1)) / 100
  if (!Number.isFinite(rate)) return 0
  // 环比为相对上期的涨幅，换算成绝对差值：price - price / (1 + rate)
  return Math.round((price - price / (1 + rate)) * 100) / 100
}

/** 解析汽油正文，如「汽油(92号车用)价格为7.85元/升，环比0.13%」。 */
export function parseGasolineItems(text: string): OfficialFuelPriceItem[] {
  const items: OfficialFuelPriceItem[] = []
  const pattern = /汽油\((-?\d+)号车用\)价格为\s*([\d.]+)\s*元\/升，环比([^；。]+)/g
  let match = pattern.exec(text)
  while (match) {
    const grade = GRADES[match[1]]
    const price = Number(match[2])
    if (grade && Number.isFinite(price)) items.push({ grade, price, change: parseChange(match[3], price) })
    match = pattern.exec(text)
  }
  return items
}

/** 解析柴油正文；柴油篇的环比写在句末（如「环比均与上期持平」），对全部油号生效。 */
export function parseDieselItems(text: string): OfficialFuelPriceItem[] {
  const trailing = /环比([^。]*)。?$/.exec(text.trim())?.[1] ?? ''
  const items: OfficialFuelPriceItem[] = []
  const pattern = /柴油\((-?\d+)号车用\)价格为\s*([\d.]+)\s*元\/升/g
  let match = pattern.exec(text)
  while (match) {
    const grade = GRADES[match[1]]
    const price = Number(match[2])
    if (grade && Number.isFinite(price)) {
      const change = trailing.includes('持平') ? 0 : parseChange(trailing, price)
      items.push({ grade, price, change })
    }
    match = pattern.exec(text)
  }
  return items
}

/** 合并正文解析结果；日期取汽油篇（两篇同日）。 */
export function parseOfficialPriceArticles(gasolineHtml: string, dieselHtml: string): OfficialFuelPrice | null {
  const gasolineText = stripTags(gasolineHtml)
  const dieselText = stripTags(dieselHtml)
  const publishedAt = parsePublishedAt(gasolineText)
  if (!publishedAt) return null

  const items = [...parseGasolineItems(gasolineText), ...parseDieselItems(dieselText)]
  return items.length > 0 ? { publishedAt, items } : null
}

@Injectable()
export class OfficialFuelPriceProvider {
  private readonly logger = new Logger(OfficialFuelPriceProvider.name)
  private cache: { value: OfficialFuelPrice; expiresAt: number } | null = null

  /** 读取官方最新一周全国平均油价；失败返回 null（调用方降级到库内数据）。 */
  async fetchLatest(): Promise<OfficialFuelPrice | null> {
    if (this.cache && this.cache.expiresAt > Date.now()) return this.cache.value

    try {
      const listHtml = await this.fetchText(LIST_URL)
      const gasolineUrl = pickLatestArticleUrl(listHtml, GASOLINE_KEYWORD)
      const dieselUrl = pickLatestArticleUrl(listHtml, DIESEL_KEYWORD)
      if (!gasolineUrl || !dieselUrl) throw new Error('未在列表页找到全国汽油/柴油行情文章')

      const [gasolineHtml, dieselHtml] = await Promise.all([this.fetchText(gasolineUrl), this.fetchText(dieselUrl)])
      const parsed = parseOfficialPriceArticles(gasolineHtml, dieselHtml)
      if (!parsed) throw new Error('官方行情正文解析失败')

      this.cache = { value: parsed, expiresAt: Date.now() + CACHE_TTL_MS }
      return parsed
    } catch (error) {
      this.logger.warn(`官方油价获取失败，将降级使用库内数据：${(error as Error).message}`)
      return null
    }
  }

  private async fetchText(url: string): Promise<string> {
    const response = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT, Accept: 'text/html' },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return response.text()
  }
}
