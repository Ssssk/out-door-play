import { describe, expect, it } from 'vitest'
import { canonicalRegion, parseProvinces, PROVINCE_PRICE_SOURCES, regionFromCityCode } from './province-price.provider'
import type { SourceDescriptor } from './province-price.provider'

function sourceOf(name: string): SourceDescriptor {
  const source = PROVINCE_PRICE_SOURCES.find((item) => item.name === name)
  if (!source) throw new Error(`未登记的数据源：${name}`)
  return source
}

// 以下两段 payload 按 2026-09-12 线上实测响应（节选湖北省）构造，字段名与结构保持一致。
// 注意 xxapi 线上的 data **直接是数组**（文档写作 data.data，与线上不符），此处即为此回归用例。
const xxapiPayload = {
  code: 200,
  msg: '数据请求成功',
  data: [
    {
      date: '2026-09-12',
      regionName: '湖北省',
      n0: 7.96, n0Change: 0.21,
      n89: 7.82, n89Change: 0.2,
      n92: 8.31, n92Change: 0.21,
      n95: 8.89, n95Change: 0.22,
      n98: 10.29, n98Change: 0.3,
      time: 1789145466000,
    },
  ],
  request_id: 'test',
}

const ruseoPayload = {
  code: 0,
  msg: 'success',
  data: {
    success: true,
    count: 1,
    list: [
      {
        region: '湖北省',
        date: '2026-09-12',
        diesel_0: 7.96, diesel_0_chg: 0.21,
        gasoline_89: 7.82, gasoline_89_chg: 0.2,
        gasoline_92: 8.31, gasoline_92_chg: 0.21,
        gasoline_95: 8.89, gasoline_95_chg: 0.22,
        gasoline_98: 10.29, gasoline_98_chg: 0.3,
      },
    ],
  },
}

describe('canonicalRegion', () => {
  it('strips province-level suffixes from the names returned by the data sources', () => {
    // 源数据里 5 个自治区/直辖市用的是简称，其余带后缀，必须归一到同一口径
    expect(canonicalRegion('湖北省')).toBe('湖北')
    expect(canonicalRegion('北京市')).toBe('北京')
    expect(canonicalRegion('重庆市')).toBe('重庆')
    expect(canonicalRegion('内蒙古')).toBe('内蒙古')
    expect(canonicalRegion('西藏')).toBe('西藏')
    expect(canonicalRegion('广西')).toBe('广西')
    expect(canonicalRegion('广西壮族自治区')).toBe('广西')
    expect(canonicalRegion('新疆维吾尔自治区')).toBe('新疆')
    expect(canonicalRegion('宁夏回族自治区')).toBe('宁夏')
    expect(canonicalRegion('香港特别行政区')).toBe('香港')
  })

  it('trims surrounding whitespace', () => {
    expect(canonicalRegion(' 湖北省 ')).toBe('湖北')
  })
})

describe('regionFromCityCode', () => {
  it('derives the province from the first two digits of the city code', () => {
    expect(regionFromCityCode('420100')).toBe('湖北') // 武汉
    expect(regionFromCityCode('110000')).toBe('北京')
    expect(regionFromCityCode('440300')).toBe('广东') // 深圳
    expect(regionFromCityCode('500000')).toBe('重庆')
    expect(regionFromCityCode('510100')).toBe('四川') // 成都
  })

  it('returns null for codes outside the known province prefixes', () => {
    expect(regionFromCityCode('990000')).toBeNull()
    expect(regionFromCityCode('')).toBeNull()
  })
})

describe('parseProvinces', () => {
  it('parses the xxapi payload whose data is a bare array', () => {
    const provinces = parseProvinces(xxapiPayload, sourceOf('xxapi'))

    expect(provinces).toHaveLength(1)
    expect(provinces[0].region).toBe('湖北')
    expect(provinces[0].regionLabel).toBe('湖北省')
    expect(provinces[0].publishedAt.toISOString()).toBe('2026-09-12T00:00:00.000Z')
    expect(provinces[0].items).toEqual([
      { grade: '92# 汽油', price: 8.31, change: 0.21 },
      { grade: '95# 汽油', price: 8.89, change: 0.22 },
      { grade: '98# 汽油', price: 10.29, change: 0.3 },
      { grade: '0# 柴油', price: 7.96, change: 0.21 },
    ])
  })

  it('parses the ruseo payload nested under data.list', () => {
    const provinces = parseProvinces(ruseoPayload, sourceOf('ruseo'))

    expect(provinces).toHaveLength(1)
    expect(provinces[0].region).toBe('湖北')
  })

  it('normalises both sources into identical results', () => {
    expect(parseProvinces(xxapiPayload, sourceOf('xxapi'))).toEqual(parseProvinces(ruseoPayload, sourceOf('ruseo')))
  })

  it('drops grades that are missing or non-positive instead of showing 0 元/升', () => {
    const payload = { data: [{ date: '2026-09-12', regionName: '湖北省', n92: 8.31, n92Change: 0.21, n95: 0, n98: null }] }
    const provinces = parseProvinces(payload, sourceOf('xxapi'))

    expect(provinces[0].items).toEqual([{ grade: '92# 汽油', price: 8.31, change: 0.21 }])
  })

  it('defaults a missing change to 0 and keeps an explicit 0', () => {
    const payload = { data: [{ date: '2026-09-12', regionName: '湖北省', n92: 8.31, n92Change: 0, n95: 8.89 }] }
    const provinces = parseProvinces(payload, sourceOf('xxapi'))

    expect(provinces[0].items).toEqual([
      { grade: '92# 汽油', price: 8.31, change: 0 },
      { grade: '95# 汽油', price: 8.89, change: 0 },
    ])
  })

  it('skips records without a usable region name or date', () => {
    const payload = {
      data: [
        { date: '2026-09-12', n92: 8.31 },
        { regionName: '湖北省', n92: 8.31 },
        { regionName: '湖北省', date: '2026/09/12', n92: 8.31 },
      ],
    }

    expect(parseProvinces(payload, sourceOf('xxapi'))).toEqual([])
  })

  it('returns an empty list when the payload shape is unexpected', () => {
    expect(parseProvinces(null, sourceOf('xxapi'))).toEqual([])
    expect(parseProvinces({ data: { unexpected: true } }, sourceOf('ruseo'))).toEqual([])
  })
})
