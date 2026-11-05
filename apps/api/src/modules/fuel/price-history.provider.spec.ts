import { describe, expect, it } from 'vitest'
import { PROVINCE_PRICE_SOURCES } from './province-price.provider'
import {
  buildSnapshotRows, derive98Prices, parse98Anchors, parseAdjustmentDates, parseRegionPrices,
} from './price-history.provider'
import type { PriceHistoryPeriod } from './price-history.provider'

const since = new Date('2026-05-05T00:00:00.000Z')

const listPayload = { result: { data: [
  { DIM_DATE: '2026-09-25 00:00:00', VALUE: 9960 },
  { DIM_DATE: '2026-10-30 00:00:00', VALUE: 10305 },
  { DIM_DATE: '2026-10-30 00:00:00', VALUE: 10305 },
  { DIM_DATE: '2025-01-01 00:00:00', VALUE: 8000 },
  { DIM_DATE: 'invalid' },
] } }

const regionRow = (overrides: Record<string, unknown> = {}) => ({
  CITYNAME: '浙江', V92: 8.85, V95: 9.42, V0: 8.57,
  ZDE92: 0.27, ZDE95: 0.3, ZDE0: 0.29, ...overrides,
})

const periods: PriceHistoryPeriod[] = [
  { date: '2026-10-30', regions: [{
    region: '浙江', price92: 8.85, price95: 9.42, price0: 8.57,
    change92: 0.27, change95: 0.3, change0: 0.29,
  }] },
  { date: '2026-09-25', regions: [{
    region: '浙江', price92: 8.58, price95: 9.12, price0: 8.28,
    change92: 0.32, change95: 0.33, change0: 0.33,
  }] },
]

describe('东方财富历史油价解析', () => {
  it('调价日期只保留半年内、去重并按最新在前', () => {
    expect(parseAdjustmentDates(listPayload, since)).toEqual(['2026-10-30', '2026-09-25'])
  })

  it('各省价格与涨跌按项目字段映射，省名归一化，缺字段的行跳过', () => {
    const rows = parseRegionPrices({ result: { data: [
      regionRow(),
      regionRow({ CITYNAME: '湖北省', V92: 8.9, V95: 9.53, V0: 8.58 }),
      regionRow({ V92: null }),
    ] } })
    expect(rows).toHaveLength(2)
    expect(rows[0]).toEqual({
      region: '浙江', price92: 8.85, price95: 9.42, price0: 8.57,
      change92: 0.27, change95: 0.3, change0: 0.29,
    })
    expect(rows[1].region).toBe('湖北')
  })
})

describe('98# 锚点与反推', () => {
  it('从省级免费源提取 98# 当期价、全称与调价日期', () => {
    const anchors = parse98Anchors({ data: [
      { regionName: '浙江省', date: '2026-10-30', n98: 10.92, n98Change: 0.3 },
      { regionName: '湖北省', date: '2026-10-30', n98: 10.93, n98Change: 0.3 },
    ] }, PROVINCE_PRICE_SOURCES[0])
    expect(anchors).toHaveLength(2)
    expect(anchors[0]).toMatchObject({ region: '浙江', regionLabel: '浙江省', price: 10.92, date: '2026-10-30' })
    expect(anchors[1].region).toBe('湖北')
  })

  it('按 95# 每期涨跌逐期反推，与浙江真实 98# 历史一致', () => {
    expect(derive98Prices(10.92, [0.3, 0.33, 0.22, 0.32])).toEqual([10.92, 10.62, 10.29, 10.07])
  })

  it('组装四档快照：98# 用反推价、涨跌取 95#，日期为 UTC 零点', () => {
    const rows = buildSnapshotRows(periods, [
      { region: '浙江', regionLabel: '浙江省', price: 10.92, date: '2026-10-30' },
    ])
    expect(rows).toHaveLength(8)
    const rows98 = rows.filter((row) => row.grade === '98# 汽油')
    expect(rows98.map((row) => row.price)).toEqual([10.92, 10.62])
    expect(rows98.map((row) => row.change)).toEqual([0.3, 0.33])
    expect(rows[0].regionLabel).toBe('浙江省')
    expect(rows[0].publishedAt.toISOString().slice(0, 10)).toBe('2026-10-30')
  })

  it('无 98# 锚点时只写入三个真实油号，不造推算数据', () => {
    const rows = buildSnapshotRows(periods, [])
    expect(rows).toHaveLength(6)
    expect(rows.some((row) => row.grade === '98# 汽油')).toBe(false)
  })
})
