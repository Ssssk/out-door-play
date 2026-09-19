import { describe, expect, it, vi } from 'vitest'
import { FuelService } from './fuel.service'
import type { ProvinceFuelPrice } from './province-price.provider'

// 库内按 distanceKm 升序返回：a 排在前面但实际离查询点更远。
// price92/price95 是库内存储值，仅在省级源不可用时才会被使用。
const rows = [
  { id: 'tx-a', cityCode: '420100', distanceKm: 1, latitude: 30.6, longitude: 114.6, price92: 7.82, price95: 8.39 },
  { id: 'tx-b', cityCode: '420100', distanceKm: 9.9, latitude: 30.41, longitude: 114.31, price92: 7.85, price95: 8.42 },
]

/** 用于分页断言：65 条，库内距离依次递增 */
const many = Array.from({ length: 65 }, (_, index) => ({
  id: `tx-s${String(index + 1).padStart(2, '0')}`,
  cityCode: '420100',
  distanceKm: index + 1,
  latitude: 30.5,
  longitude: 114.4,
  price92: 7.8,
  price95: 8.4,
}))

const provincePrice: ProvinceFuelPrice = {
  region: '湖北',
  regionLabel: '湖北省',
  publishedAt: new Date(Date.UTC(2026, 8, 12)),
  items: [
    { grade: '92# 汽油', price: 8.31, change: 0.21 },
    { grade: '95# 汽油', price: 8.89, change: 0.22 },
  ],
}

function createService(provinceResult: ProvinceFuelPrice | null = null, stations: unknown[] = rows) {
  // 显式声明入参，便于断言调用次数与查询到的省份
  const fetchByRegion = vi.fn(async (_region: string) => provinceResult)
  const service = new FuelService(
    { fuelStation: { findMany: async () => stations } } as never,
    { fetchByRegion } as never,
  )
  return { service, fetchByRegion }
}

describe('FuelService.stations', () => {
  it('excludes legacy seed stations so user requests only return synced POI', async () => {
    const result = await createService(null, [rows[0], {
      id: 'station-1', cityCode: '420100', distanceKm: 0.1,
      latitude: 30.5, longitude: 114.4, price92: 8, price95: 8.5,
    }]).service.stations({ latitude: 30.5, longitude: 114.4 })

    expect(result.items.map((station) => station.id)).toEqual(['tx-a'])
    expect(result.total).toBe(1)
  })

  it('keeps the stored distances and order when no coordinates are given', async () => {
    const result = await createService().service.stations(null)

    expect(result.items.map((station) => station.id)).toEqual(['tx-a', 'tx-b'])
    expect(result.items[0].distanceKm).toBe(1)
    expect(result.total).toBe(2)
    expect(result.page).toBe(1)
    expect(result.hasMore).toBe(false)
  })

  it('recomputes distances from the device location and sorts by them', async () => {
    const result = await createService().service.stations({ latitude: 30.4, longitude: 114.3 })

    expect(result.items.map((station) => station.id)).toEqual(['tx-b', 'tx-a'])
    expect(result.items[0].distanceKm).toBeLessThan(result.items[1].distanceKm)
    // 距离口径保留 1 位小数
    expect(result.items[0].distanceKm).toBe(Math.round(result.items[0].distanceKm * 10) / 10)
    expect(result.items[0].latitude).toBe(30.41)
  })

  it('overrides station prices with the province guidance price', async () => {
    const result = await createService(provincePrice).service.stations(null)

    // 站点价随省级指导价自动更新，不再使用库内的旧值
    expect(result.items.map((station) => station.price92)).toEqual([8.31, 8.31])
    expect(result.items.map((station) => station.price95)).toEqual([8.89, 8.89])
  })

  it('keeps the stored station prices when the province source is unavailable', async () => {
    const result = await createService(null).service.stations(null)

    expect(result.items.map((station) => station.price92)).toEqual([7.82, 7.85])
    expect(result.items.map((station) => station.price95)).toEqual([8.39, 8.42])
  })

  it('queries each province only once regardless of how many stations share it', async () => {
    const { service, fetchByRegion } = createService(provincePrice, [
      { ...rows[0] },
      { ...rows[1], id: 'tx-c', cityCode: '110000' },
      { ...rows[0], id: 'tx-d' },
    ])

    await service.stations(null)

    expect(fetchByRegion.mock.calls.map((call) => call[0]).sort()).toEqual(['北京', '湖北'])
  })
})

describe('FuelService.stations pagination', () => {
  it('returns 30 per page by default and reports whether more pages exist', async () => {
    const { service } = createService(provincePrice, many)

    const first = await service.stations(null)
    expect(first.items).toHaveLength(30)
    expect(first.total).toBe(65)
    expect(first.page).toBe(1)
    expect(first.pageSize).toBe(30)
    expect(first.hasMore).toBe(true)

    const second = await service.stations(null, 2)
    expect(second.items).toHaveLength(30)
    expect(second.hasMore).toBe(true)

    const third = await service.stations(null, 3)
    expect(third.items).toHaveLength(5)
    expect(third.hasMore).toBe(false)
  })

  it('sorts by distance before paginating so pages never overlap', async () => {
    const { service } = createService(provincePrice, many)

    const first = await service.stations(null, 1)
    const second = await service.stations(null, 2)

    expect(new Set([...first.items, ...second.items].map((station) => station.id)).size).toBe(60)
    // 下一页的首条一定不比上一页的末条更近
    expect(first.items.at(-1)!.distanceKm).toBeLessThanOrEqual(second.items[0].distanceKm)
  })

  it('caps the page size at 30 even when a larger one is requested', async () => {
    const result = await createService(provincePrice, many).service.stations(null, 1, 200)

    expect(result.pageSize).toBe(30)
    expect(result.items).toHaveLength(30)
  })

  it('treats a page beyond the end as an empty final page', async () => {
    const result = await createService(provincePrice, many).service.stations(null, 99)

    expect(result.items).toEqual([])
    expect(result.hasMore).toBe(false)
    expect(result.total).toBe(65)
  })
})

describe('FuelService.prices', () => {
  it('returns the province reference price and reports the region', async () => {
    const { service, fetchByRegion } = createService(provincePrice)

    const result = await service.prices('420100')

    // 城市码前两位 42 → 湖北
    expect(fetchByRegion).toHaveBeenCalledWith('湖北')
    expect(result.source).toBe('province')
    expect(result.items).toEqual(provincePrice.items)
    // 省级源只有调价日期，不补造时刻
    expect(result.updatedAt).toBe('09-12')
    expect(result.region).toBe('湖北省')
  })

  it('reports an empty source without querying any source when the city code is unknown', async () => {
    const { service, fetchByRegion } = createService(provincePrice)

    const result = await service.prices('990000')

    expect(fetchByRegion).not.toHaveBeenCalled()
    expect(result).toEqual({ items: [], updatedAt: '', source: 'empty' })
  })

  it('reports an empty source when the province source is unavailable', async () => {
    const result = await createService(null).service.prices('110000')

    expect(result).toEqual({ items: [], updatedAt: '', source: 'empty' })
  })
})
