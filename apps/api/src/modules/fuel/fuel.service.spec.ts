import { describe, expect, it } from 'vitest'
import { FuelService } from './fuel.service'
import type { OfficialFuelPrice } from './official-price.provider'

// 库内按 distanceKm 升序返回：a 排在前面但实际离查询点更远
const rows = [
  { id: 'a', distanceKm: 1, latitude: 30.6, longitude: 114.6 },
  { id: 'b', distanceKm: 9.9, latitude: 30.41, longitude: 114.31 },
]

const official: OfficialFuelPrice = {
  publishedAt: new Date(Date.UTC(2026, 7, 26)),
  items: [{ grade: '92# 汽油', price: 7.85, change: 0.01 }],
}

function createService(priceRows: unknown[] = [], officialResult: OfficialFuelPrice | null = null) {
  return new FuelService(
    { fuelPrice: { findMany: async () => priceRows }, fuelStation: { findMany: async () => rows } } as never,
    { fetchLatest: async () => officialResult } as never,
  )
}

describe('FuelService.stations', () => {
  it('keeps the stored distances when no coordinates are given', async () => {
    const stations = await createService().stations(null)

    expect(stations.map((station) => station.id)).toEqual(['a', 'b'])
    expect(stations[0].distanceKm).toBe(1)
  })

  it('recomputes distances from the device location and sorts by them', async () => {
    const stations = await createService().stations({ latitude: 30.4, longitude: 114.3 })

    expect(stations.map((station) => station.id)).toEqual(['b', 'a'])
    expect(stations[0].distanceKm).toBeLessThan(stations[1].distanceKm)
    // 距离口径保留 1 位小数
    expect(stations[0].distanceKm).toBe(Math.round(stations[0].distanceKm * 10) / 10)
    expect(stations[0].latitude).toBe(30.41)
  })
})

describe('FuelService.prices', () => {
  it('prefers city prices stored in the database', async () => {
    const result = await createService(
      [{ grade: '92# 汽油', price: 7.85, change: 0.12, publishedAt: new Date('2026-08-22T06:30:00Z') }],
      official,
    ).prices('420100')

    expect(result.source).toBe('city')
    expect(result.items).toEqual([{ grade: '92# 汽油', price: 7.85, change: 0.12 }])
    expect(result.updatedAt).not.toBe('')
  })

  it('falls back to the official national average when the city has no prices', async () => {
    const result = await createService([], official).prices('110000')

    expect(result.source).toBe('official')
    expect(result.items).toEqual(official.items)
    expect(result.updatedAt).toBe('08-26 08:00')
  })

  it('reports an empty source when neither city nor official data is available', async () => {
    const result = await createService([], null).prices('110000')

    expect(result).toEqual({ items: [], updatedAt: '', source: 'empty' })
  })
})
