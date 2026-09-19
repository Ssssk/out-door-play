import { describe, expect, it, vi } from 'vitest'
import { FuelService } from './fuel.service'
import type { ProvinceFuelPrice } from './province-price.provider'

// 库内按 distanceKm 升序返回：a 排在前面但实际离查询点更远。
// price92/price95 是库内存储值，仅在省级源不可用时才会被使用。
const rows = [
  { id: 'a', cityCode: '420100', distanceKm: 1, latitude: 30.6, longitude: 114.6, price92: 7.82, price95: 8.39 },
  { id: 'b', cityCode: '420100', distanceKm: 9.9, latitude: 30.41, longitude: 114.31, price92: 7.85, price95: 8.42 },
]

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

  it('overrides station prices with the province guidance price', async () => {
    const stations = await createService(provincePrice).service.stations(null)

    // 站点价随省级指导价自动更新，不再使用库内的旧值
    expect(stations.map((station) => station.price92)).toEqual([8.31, 8.31])
    expect(stations.map((station) => station.price95)).toEqual([8.89, 8.89])
  })

  it('keeps the stored station prices when the province source is unavailable', async () => {
    const stations = await createService(null).service.stations(null)

    expect(stations.map((station) => station.price92)).toEqual([7.82, 7.85])
    expect(stations.map((station) => station.price95)).toEqual([8.39, 8.42])
  })

  it('queries each province only once regardless of how many stations share it', async () => {
    const { service, fetchByRegion } = createService(provincePrice, [
      { ...rows[0] },
      { ...rows[1], id: 'c', cityCode: '110000' },
      { ...rows[0], id: 'd' },
    ])

    await service.stations(null)

    expect(fetchByRegion.mock.calls.map((call) => call[0]).sort()).toEqual(['北京', '湖北'])
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
