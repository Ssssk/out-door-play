import { describe, expect, it, vi } from 'vitest'
import { PrismaDiscoveryRepository } from './prisma-discovery.repository'

describe('PrismaDiscoveryRepository（CHG-SCENE-EXPANSION-001）', () => {
  it('filters public discoveries and applies deterministic Top N ordering', async () => {
    const findMany = vi.fn().mockResolvedValue([])
    const repository = new PrismaDiscoveryRepository({ discovery: { findMany } } as never)

    await repository.list('drive', 10, '420100')

    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { scene: { in: ['drive'] }, status: 'online', city: { enabled: true }, cityCode: '420100' },
      orderBy: [{ rank: 'asc' }, { distanceKm: 'asc' }, { id: 'asc' }],
      take: 10,
    }))
  })

  it('GIVEN 兼容期 fish WHEN 查询列表 THEN 同时命中未回填 fish 与 play+fishing', async () => {
    const findMany = vi.fn().mockResolvedValue([])
    const repository = new PrismaDiscoveryRepository({ discovery: { findMany } } as never)

    await repository.list('fish', 10)

    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        OR: [{ scene: 'fish' }, { scene: { in: ['play'] }, subType: 'fishing' }],
      }),
    }))
  })

  it('GIVEN play 子类型 WHEN 查询列表 THEN 下推 subType 条件', async () => {
    const findMany = vi.fn().mockResolvedValue([])
    const repository = new PrismaDiscoveryRepository({ discovery: { findMany } } as never)

    await repository.list({ scenes: ['play'], subType: 'camping', legacy: false }, 10)

    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ scene: { in: ['play'] }, subType: 'camping' }),
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

  it('applies the same ranking binding to the detail as the list', async () => {
    const findFirst = vi.fn().mockResolvedValue({ id: 'a', rankTag: '', rank: 0, scene: 'drive' })
    const rankingFindMany = vi.fn().mockResolvedValue([{ name: '武汉 · 周末溜车热门榜', coverRouteIds: ['a', 'b'] }])
    const repository = new PrismaDiscoveryRepository({ discovery: { findFirst }, ranking: { findMany: rankingFindMany } } as never)

    // 库里是 rankTag '' / rank 0，详情必须换成榜单名 + 位次，避免出现「Top 0」
    await expect(repository.find('a', 'drive')).resolves.toMatchObject({ rankTag: '武汉 · 周末溜车热门榜', rank: 1 })
  })

  it('keeps the stored badge on the detail when no online ranking covers the route', async () => {
    const findFirst = vi.fn().mockResolvedValue({ id: 'z', rankTag: '赛道/跑山热门榜', rank: 7, scene: 'drive' })
    const rankingFindMany = vi.fn().mockResolvedValue([{ name: '武汉 · 周末溜车热门榜', coverRouteIds: ['a'] }])
    const repository = new PrismaDiscoveryRepository({ discovery: { findFirst }, ranking: { findMany: rankingFindMany } } as never)

    await expect(repository.find('z', 'drive')).resolves.toMatchObject({ rankTag: '赛道/跑山热门榜', rank: 7 })
  })

  it('never exposes offline details or content under disabled cities', async () => {
    const findFirst = vi.fn().mockResolvedValue(null)
    const repository = new PrismaDiscoveryRepository({ discovery: { findFirst } } as never)

    await repository.find('bafen-shanlu', 'drive')

    expect(findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'bafen-shanlu', scene: { in: ['drive'] }, status: 'online', city: { enabled: true } },
    }))
  })
})
