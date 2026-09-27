import { describe, expect, it, vi } from 'vitest'
import { PrismaDiscoveryRepository } from './prisma-discovery.repository'

describe('PrismaDiscoveryRepository', () => {
  it('filters public discoveries and applies deterministic Top N ordering', async () => {
    const findMany = vi.fn().mockResolvedValue([])
    const repository = new PrismaDiscoveryRepository({ discovery: { findMany } } as never)

    await repository.list('fish', 10, '420100')

    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { scene: 'fish', status: 'online', city: { enabled: true }, cityCode: '420100' },
      orderBy: [{ rank: 'asc' }, { distanceKm: 'asc' }, { id: 'asc' }],
      take: 10,
    }))
  })

  it('derives the card badge from the admin ranking binding (name + position)', async () => {
    const discoveryFindMany = vi.fn().mockResolvedValue([
      { id: 'a', rankTag: '', rank: 0, scene: 'drive' },
      { id: 'b', rankTag: '赛道/跑山热门榜', rank: 7, scene: 'drive' },
      { id: 'c', rankTag: '', rank: 0, scene: 'drive' },
    ])
    const rankingFindMany = vi.fn().mockResolvedValue([
      { name: '武汉 · 周末溜车热门榜', coverRouteIds: ['a', 'b'] },
    ])
    const repository = new PrismaDiscoveryRepository({ discovery: { findMany: discoveryFindMany }, ranking: { findMany: rankingFindMany } } as never)

    const records = await repository.list('drive', 10)

    // a 在榜单第 1 位 → Top 1；b 在榜单第 2 位，覆盖路线自带标签；c 未绑定保持原样
    expect(records[0]).toMatchObject({ rankTag: '武汉 · 周末溜车热门榜', rank: 1 })
    expect(records[1]).toMatchObject({ rankTag: '武汉 · 周末溜车热门榜', rank: 2 })
    expect(records[2]).toMatchObject({ rankTag: '', rank: 0 })
  })

  it('never exposes offline details or content under disabled cities', async () => {
    const findFirst = vi.fn().mockResolvedValue(null)
    const repository = new PrismaDiscoveryRepository({ discovery: { findFirst } } as never)

    await repository.find('bafen-shanlu', 'drive')

    expect(findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'bafen-shanlu', scene: 'drive', status: 'online', city: { enabled: true } },
    }))
  })
})
