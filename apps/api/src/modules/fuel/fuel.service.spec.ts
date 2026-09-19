import { describe, expect, it, vi } from 'vitest'
import { FuelService } from './fuel.service'
import type { ProvinceFuelPrice } from './province-price.provider'

// 库内按 distanceKm 升序返回：a 排在前面但实际离查询点更远
const rows = [
  { id: 'a', distanceKm: 1, latitude: 30.6, longitude: 114.6 },
  { id: 'b', distanceKm: 9.9, latitude: 30.41, longitude: 114.31 },
]

const provincePrice: ProvinceFuelPrice = {
  region: '湖北',
  regionLabel: '湖北省',
  publishedAt: new Date(Date.UTC(2026, 8, 12)),
  items: [{ grade: '92# 汽油', price: 8.25, change: 0.21 }],
}

function createService(priceRows: unknown[] = [], provinceResult: ProvinceFuelPrice | null = null) {
  const fetchByRegion = vi.fn(async () => provinceResult)
  const service = new FuelService(
    { fuelPrice: { findMany: async () => priceRows }, fuelStation: { findMany: async () => rows } } as never,
    { fetchByRegion } as never,
  )
  return { service, fetchByRegion }
}

describe('FuelService.stations', () => {
  it('keeps the stored distances when no coordinates are given', async () => {
    const stations = await createService().service.stations(null)

    expect(stations.map((station) => station.id)).toEqual(['a', 'b'])
    expect(stations[0].distanceKm).toBe(1)
  })

  it('recomputes distances from the device location and sorts by them', async () => {
    const stations = await createService().service.stations({ latitude: 30.4, longitude: 114.3 })

    expect(stations.map((station) => station.id)).toEqual(['b', 'a'])
    expect(stations[0].distanceKm).toBeLessThan(stations[1].distanceKm)
    // 距离口径保留 1 位小数
    expect(stations[0].distanceKm).toBe(Math.round(stations[0].distanceKm * 10) / 10)
    expect(stations[0].latitude).toBe(30.41)
  })
})

describe('FuelService.prices', () => {
  it('prefers city prices stored in the database', async () => {
    const { service, fetchByRegion } = createService(
      [{ grade: '92# 汽油', price: 7.85, change: 0.12, publishedAt: new Date('2026-08-22T06:30:00Z') }],
      provincePrice,
    )

    const result = await service.prices('420100')

    expect(result.source).toBe('city')
    expect(result.items).toEqual([{ grade: '92# 汽油', price: 7.85, change: 0.12 }])
    expect(result.updatedAt).not.toBe('')
    // 库内有数据时不应触发外部请求
    expect(fetchByRegion).not.toHaveBeenCalled()
  })

  it('falls back to the province reference price and reports the region', async () => {
    const { service, fetchByRegion } = createService([], provincePrice)

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
    const { service, fetchByRegion } = createService([], provincePrice)

    const result = await service.prices('990000')

    expect(fetchByRegion).not.toHaveBeenCalled()
    expect(result).toEqual({ items: [], updatedAt: '', source: 'empty' })
  })

  it('reports an empty source when the province source is unavailable', async () => {
    const result = await createService([], null).service.prices('110000')

    expect(result).toEqual({ items: [], updatedAt: '', source: 'empty' })
  })
})
