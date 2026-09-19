import { describe, expect, it, vi } from 'vitest'
import { FuelService } from './fuel.service'
import type { ProvinceFuelPrice } from './province-price.provider'

const point = { latitude: 30.4, longitude: 114.3 }
const rows = Array.from({ length: 65 }, (_, i) => ({
  id: String(i), name: '加油站 ' + i, brand: '中石化', address: '测试地址',
  latitude: 30.4 + i / 1000, longitude: 114.3, province: '湖北省',
}))
const provincePrice: ProvinceFuelPrice = {
  region: '湖北', regionLabel: '湖北省', publishedAt: new Date(Date.UTC(2026, 8, 12)),
  items: [{ grade: '92# 汽油', price: 8.31, change: 0.21 }],
}
function createService(provinceResult: ProvinceFuelPrice | null = null) {
  const fetchByRegion = vi.fn(async (_region: string) => provinceResult)
  const fetchPage = vi.fn(async (_point: typeof point, page: number, window: { offset: number; limit: number }) => ({
    items: rows.slice((page - 1) * 20, page * 20).slice(window.offset, window.offset + window.limit), count: rows.length,
  }))
  return { service: new FuelService({ fetchPage } as never, { fetchByRegion } as never), fetchPage, fetchByRegion }
}

describe('FuelService.stations real-time POI', () => {
  it('requires location without calling Tencent', async () => {
    const { service, fetchPage } = createService()
    await expect(service.stations(null)).rejects.toThrow('请先开启定位')
    expect(fetchPage).not.toHaveBeenCalled()
  })
  it('forwards the user coordinates and never requires a station repository', async () => {
    const { service, fetchPage } = createService()
    const result = await service.stations(point)
    expect(fetchPage).toHaveBeenNthCalledWith(1, point, 1, { offset: 0, limit: 20 })
    expect(fetchPage).toHaveBeenNthCalledWith(2, point, 2, { offset: 0, limit: 10 })
    expect(result.items).toHaveLength(30)
    expect(result.items[0]).toMatchObject({ id: 'tx-0', distanceKm: 0, price92: 0, price95: 0, openingHours: '' })
  })
  it('preserves non-overlapping 30-item pages over Tencent 20-item pages', async () => {
    const { service } = createService()
    const a = await service.stations(point)
    const b = await service.stations(point, 2)
    const c = await service.stations(point, 3)
    expect([a.items.length, b.items.length, c.items.length]).toEqual([30, 30, 5])
    expect(new Set([...a.items, ...b.items, ...c.items].map(s => s.id)).size).toBe(65)
    expect([a.hasMore, b.hasMore, c.hasMore]).toEqual([true, true, false])
  })
  it('returns a retryable error when Tencent fails instead of an empty success', async () => {
    const { service, fetchPage } = createService()
    fetchPage.mockResolvedValueOnce(null as never)
    await expect(service.stations(point)).rejects.toMatchObject({ response: { code: 'FUEL_POI_UNAVAILABLE' } })
  })
  it('rejects a partial page if a second upstream call fails', async () => {
    const { service, fetchPage } = createService()
    fetchPage.mockResolvedValueOnce({ items: rows.slice(0,20), count:65 }).mockResolvedValueOnce(null as never)
    await expect(service.stations(point)).rejects.toThrow('附近加油站查询暂不可用')
  })
  it('handles valid empty results and does not fetch another page', async () => {
    const { service, fetchPage } = createService()
    fetchPage.mockResolvedValueOnce({ items: [], count: 0 })
    expect(await service.stations(point)).toMatchObject({ items: [], total: 0, hasMore: false })
    expect(fetchPage).toHaveBeenCalledTimes(1)
  })
  it('does not return Tencent repeated last-page results beyond the count', async () => {
    const { service, fetchPage } = createService()
    fetchPage.mockResolvedValueOnce({ items: rows.slice(-20), count: 65 })
    expect(await service.stations(point, 4)).toMatchObject({ items: [], total: 65, hasMore: false })
    expect(fetchPage).toHaveBeenCalledTimes(1)
  })
  it('never requests beyond the 200-result upstream cap', async () => {
    const { service, fetchPage } = createService()
    expect(await service.stations(point, 8)).toMatchObject({ items: [], hasMore: false })
    expect(fetchPage).not.toHaveBeenCalled()
  })
  it('caps oversized page requests at 30', async () => {
    expect(await createService().service.stations(point, 1, 200)).toMatchObject({ pageSize: 30 })
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
