import { describe, expect, it, vi } from 'vitest'
import { FuelService } from './fuel.service'
import type { ProvinceFuelPrice } from './province-price.provider'

const point = { latitude: 30.4, longitude: 114.3 }
const provincePrice: ProvinceFuelPrice = {
  region: '湖北', regionLabel: '湖北省', publishedAt: new Date(Date.UTC(2026, 8, 12)),
  items: [{ grade: '92# 汽油', price: 8.31, change: 0.21 }],
}

interface DbRow {
  id: string
  name: string
  brand: string
  address: string
  latitude: number
  longitude: number
  openingHours: string
  price92: number
  price95: number
}

function createService(opts: {
  rows?: DbRow[]
  totalRows?: number
  live?: { id: string; name: string; brand: string; address: string; latitude: number; longitude: number }[] | null
  provinceResult?: ProvinceFuelPrice | null
} = {}) {
  const rows = opts.rows ?? []
  const totalRows = opts.totalRows ?? rows.length
  const findMany = vi.fn(async (..._args: unknown[]) => rows)
  const count = vi.fn(async () => totalRows)
  const prisma = { fuelStation: { findMany, count } } as never
  const fetchPage = vi.fn(async () => (opts.live === undefined ? null : opts.live ? {
    items: opts.live.map((s) => ({ ...s, province: '湖北省' })),
    count: opts.live.length,
  } : null))
  const tencent = { fetchPage } as never
  const fetchByRegion = vi.fn(async (_region: string) => opts.provinceResult ?? null)
  const provincePriceProvider = { fetchByRegion } as never
  return { service: new FuelService(prisma, tencent, provincePriceProvider), findMany, count, fetchPage, fetchByRegion }
}

describe('FuelService.stations 读库优先', () => {
  it('需要定位且不调用任何数据源', async () => {
    const { service, findMany, fetchPage } = createService()
    await expect(service.stations(null)).rejects.toThrow('请先开启定位')
    expect(findMany).not.toHaveBeenCalled()
    expect(fetchPage).not.toHaveBeenCalled()
  })

  it('从库读取并按距离排序、分页，不调用腾讯', async () => {
    const rows: DbRow[] = [
      { id: 'tx-2', name: '近', brand: '中石化', address: 'a', latitude: 30.41, longitude: 114.31, openingHours: '', price92: 0, price95: 0 },
      { id: 'tx-1', name: '最近', brand: '中石油', address: 'b', latitude: 30.4009, longitude: 114.3009, openingHours: '24h', price92: 8.2, price95: 8.8 },
      { id: 'tx-3', name: '远', brand: '中化', address: 'c', latitude: 30.55, longitude: 114.5, openingHours: '', price92: 0, price95: 0 },
    ]
    const { service, fetchPage } = createService({ rows })
    const result = await service.stations(point)
    expect(fetchPage).not.toHaveBeenCalled()
    expect(result.items.map((s) => s.id)).toEqual(['tx-1', 'tx-2', 'tx-3'])
    expect(result.items[0]).toMatchObject({ id: 'tx-1', distanceKm: 0.1, price92: 8.2, openingHours: '24h' })
    expect(result.total).toBe(3)
  })

  it('剔除超出检索半径（30km）的站点', async () => {
    // 约 1.6° 纬度差 ≈ 178km，必被半径过滤
    const far: DbRow = { id: 'tx-far', name: '外省', brand: 'x', address: 'd', latitude: 32, longitude: 114.3, openingHours: '', price92: 0, price95: 0 }
    const near: DbRow = { id: 'tx-near', name: '本地', brand: 'x', address: 'e', latitude: 30.4, longitude: 114.3, openingHours: '', price92: 0, price95: 0 }
    const { service } = createService({ rows: [far, near] })
    const result = await service.stations(point)
    expect(result.items.map((s) => s.id)).toEqual(['tx-near'])
  })

  it('库里有数据但附近没有时返回空、不兜底实时', async () => {
    const elsewhere: DbRow = { id: 'tx-x', name: '其他城市', brand: 'x', address: 'f', latitude: 22, longitude: 114, openingHours: '', price92: 0, price95: 0 }
    const { service, fetchPage } = createService({ rows: [elsewhere], totalRows: 1 })
    const result = await service.stations(point)
    expect(fetchPage).not.toHaveBeenCalled()
    expect(result).toMatchObject({ items: [], total: 0, hasMore: false })
  })

  it('全库为空时实时兜底：成功则返回腾讯结果', async () => {
    const live = [{ id: 'abc', name: '实时站', brand: '中石化', address: 'g', latitude: 30.4, longitude: 114.3 }]
    const { service, findMany, fetchPage } = createService({ rows: [], totalRows: 0, live })
    const result = await service.stations(point)
    expect(findMany).toHaveBeenCalled()
    expect(fetchPage).toHaveBeenCalledTimes(1)
    expect(result.items[0]).toMatchObject({ id: 'tx-abc', name: '实时站' })
    expect(result.total).toBe(1)
  })

  it('全库为空且实时也失败：返回空而非抛错（避免配额黑窗期报错）', async () => {
    const { service } = createService({ rows: [], totalRows: 0, live: null })
    const result = await service.stations(point)
    expect(result).toMatchObject({ items: [], total: 0, hasMore: false })
  })

  it('分页不超过上限', async () => {
    const rows: DbRow[] = Array.from({ length: 5 }, (_, i) => ({
      id: 'tx-' + i, name: 's' + i, brand: 'x', address: 'h', latitude: 30.4 + i / 5000, longitude: 114.3, openingHours: '', price92: 0, price95: 0,
    }))
    const { service } = createService({ rows })
    expect(await service.stations(point, 1, 200)).toMatchObject({ pageSize: 30 })
  })

  it('按 kind 过滤：充电站模式只返回充电站', async () => {
    // mock 的 findMany 不过滤 where，这里只放充电站一行，验证分支条件（kind）被正确注入查询
    const rows: DbRow[] = [
      { id: 'tx-ev', name: '充电站', brand: '特来电', address: 'b', latitude: 30.4009, longitude: 114.3009, openingHours: '', price92: 0, price95: 0 },
    ]
    const { service, findMany } = createService({ rows })
    const result = await service.stations(point, 1, 5, undefined, 'ev')
    // DB 查询必须带 kind 过滤条件（mock 的 findMany 不过滤 where，仅校验分支条件被注入）
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ kind: 'ev' }) }))
    expect(result.items.map((s) => s.id)).toEqual(['tx-ev'])
  })
})

describe('FuelService.prices', () => {
  it('returns the province reference price and reports the region', async () => {
    const { service, fetchByRegion } = createService({ provinceResult: provincePrice })
    const result = await service.prices('420100')
    expect(fetchByRegion).toHaveBeenCalledWith('湖北')
    expect(result.source).toBe('province')
    expect(result.items).toEqual(provincePrice.items)
    expect(result.updatedAt).toBe('09-12')
    expect(result.region).toBe('湖北省')
  })

  it('reports an empty source without querying any source when the city code is unknown', async () => {
    const { service, fetchByRegion } = createService({ provinceResult: provincePrice })
    const result = await service.prices('990000')
    expect(fetchByRegion).not.toHaveBeenCalled()
    expect(result).toEqual({ items: [], updatedAt: '', source: 'empty' })
  })

  it('reports an empty source when the province source is unavailable', async () => {
    const result = await createService().service.prices('110000')
    expect(result).toEqual({ items: [], updatedAt: '', source: 'empty' })
  })
})
