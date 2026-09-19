import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { StationSyncService } from './station-sync.service'
import type { TencentStation } from './tencent-station.provider'

function station(id: string, overrides: Partial<TencentStation> = {}): TencentStation {
  return {
    id,
    name: `加油站 ${id}`,
    address: `地址 ${id}`,
    brand: '中石化',
    latitude: 30.6,
    longitude: 114.3,
    province: '湖北省',
    ...overrides,
  }
}

/** 依次返回给定的页；用完后统一返回空页 */
function createHarness(pages: Array<{ items: TencentStation[]; count: number } | null>) {
  const fetchPage = vi.fn()
  for (const page of pages) fetchPage.mockResolvedValueOnce(page)
  fetchPage.mockResolvedValue({ items: [], count: 0 })

  const upsert = vi.fn().mockResolvedValue(undefined)
  const deleteMany = vi.fn().mockResolvedValue({ count: 0 })
  const service = new StationSyncService(
    { fuelStation: { upsert, deleteMany } } as never,
    { enabled: true, fetchPage } as never,
  )
  return { service, fetchPage, upsert, deleteMany }
}

const original = {
  enabled: process.env.STATION_SYNC_ENABLED,
  cities: process.env.STATION_SYNC_CITIES,
  budget: process.env.STATION_SYNC_CALL_BUDGET,
}

describe('StationSyncService', () => {
  beforeEach(() => {
    process.env.STATION_SYNC_ENABLED = 'true'
    process.env.STATION_SYNC_CITIES = '420100'
    delete process.env.STATION_SYNC_CALL_BUDGET
  })

  afterEach(() => {
    if (original.enabled === undefined) delete process.env.STATION_SYNC_ENABLED
    else process.env.STATION_SYNC_ENABLED = original.enabled
    if (original.cities === undefined) delete process.env.STATION_SYNC_CITIES
    else process.env.STATION_SYNC_CITIES = original.cities
    if (original.budget === undefined) delete process.env.STATION_SYNC_CALL_BUDGET
    else process.env.STATION_SYNC_CALL_BUDGET = original.budget
  })

  it('reports a skip when the data source is not configured', async () => {
    const service = new StationSyncService({} as never, { enabled: false } as never)

    await expect(service.sync()).resolves.toMatchObject({ skipped: '未配置 TENCENT_MAP_KEY' })
  })

  it('samples every grid centre and deduplicates POIs seen more than once', async () => {
    // 9 个采样中心；p1 在每个中心都会返回，p2~p10 各出现一次
    const pages = Array.from({ length: 9 }, (_, index) => ({ items: [station('p1'), station(`p${index + 2}`)], count: 20 }))
    const { service, fetchPage, upsert } = createHarness(pages)

    const summary = await service.sync()

    expect(fetchPage).toHaveBeenCalledTimes(9)
    expect(summary.calls).toBe(9)
    // p1 + p2..p10 去重后共 10 条，而不是 18 条
    expect(summary.fetched).toBe(10)
    expect(upsert).toHaveBeenCalledTimes(10)
  })

  it('stops calling Tencent once the run budget is used up', async () => {
    process.env.STATION_SYNC_CALL_BUDGET = '3'
    const { service, fetchPage } = createHarness(
      Array.from({ length: 9 }, () => ({ items: [station('p1')], count: 20 })),
    )

    const summary = await service.sync()

    expect(fetchPage).toHaveBeenCalledTimes(3)
    expect(summary.calls).toBe(3)
  })

  it('stops collecting a city as soon as a page fails, e.g. quota exhausted', async () => {
    const { service, fetchPage } = createHarness([{ items: [station('p1')], count: 20 }, null])

    const summary = await service.sync()

    // 第二次就失败 → 不再继续打后续 7 个中心
    expect(fetchPage).toHaveBeenCalledTimes(2)
    expect(summary.calls).toBe(2)
    expect(summary.fetched).toBe(1)
  })

  it('ignores configured cities that have no known centre', async () => {
    process.env.STATION_SYNC_CITIES = '999999'
    const { service, fetchPage } = createHarness([])

    const summary = await service.sync()

    expect(summary.cities).toBe(0)
    expect(fetchPage).not.toHaveBeenCalled()
  })

  it('writes synced rows with a tx- prefix, fallback price and truncated columns', async () => {
    const long = station('abc', { name: 'x'.repeat(200), address: 'y'.repeat(400), brand: 'b'.repeat(50) })
    const { service, upsert } = createHarness([{ items: [long], count: 1 }])

    await service.sync()

    const call = upsert.mock.calls[0][0]
    expect(call.where).toEqual({ id: 'tx-abc' })
    expect(call.update).toMatchObject({
      cityCode: '420100',
      // 腾讯不提供营业时间与油价，落库用空/回落值，展示时由省级指导价覆盖
      openingHours: '',
      price92: 8.31,
      price95: 8.89,
      enabled: true,
    })
    // 列宽有上限，超长会被数据库拒绝，必须先截断
    expect(call.update.name).toHaveLength(128)
    expect(call.update.address).toHaveLength(255)
    expect(call.update.brand).toHaveLength(32)
    expect(call.update.distanceKm).toBeGreaterThanOrEqual(0)
  })

  it('never prunes when too few stations were fetched', async () => {
    const { service, deleteMany } = createHarness([{ items: [station('p1')], count: 1 }])

    const summary = await service.sync()

    // 一次额度耗尽只取到 1 条时若执行清理，会把整城站点删光
    expect(deleteMany).not.toHaveBeenCalled()
    expect(summary.removed).toBe(0)
  })

  it('prunes stations that were not returned once enough were fetched', async () => {
    const items = Array.from({ length: 25 }, (_, index) => station(`p${index}`))
    const { service, deleteMany } = createHarness([{ items, count: 25 }])
    deleteMany.mockResolvedValue({ count: 7 })

    const summary = await service.sync()

    expect(deleteMany).toHaveBeenCalledWith({
      where: { cityCode: '420100', id: { notIn: items.map((item) => `tx-${item.id}`) } },
    })
    expect(summary.removed).toBe(7)
  })

  it('does not run twice at the same time', async () => {
    const { service } = createHarness(Array.from({ length: 9 }, () => ({ items: [station('p1')], count: 20 })))

    const [first, second] = await Promise.all([service.sync(), service.sync()])

    expect([first.skipped, second.skipped].filter(Boolean)).toEqual(['上一次同步尚未结束'])
  })
})
