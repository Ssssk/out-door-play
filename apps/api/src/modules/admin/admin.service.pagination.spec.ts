import { describe, expect, it, vi } from 'vitest'
import type { PrismaService } from '../../database/prisma.service'
import { AdminService } from './admin.service'

/** 仅覆盖 routes() 用到的 Prisma 能力，避免单测依赖真实 MySQL */
function fakePrisma(options: { total: number; rows: Array<Record<string, unknown>>; coverRouteIds?: string[][] }) {
  return {
    discovery: {
      count: vi.fn(async () => options.total),
      findMany: vi.fn(async () => options.rows),
    },
    ranking: {
      findMany: vi.fn(async () => (options.coverRouteIds ?? [['route-1']]).map((coverRouteIds) => ({ coverRouteIds }))),
    },
  } as unknown as PrismaService
}

function routeRow(id: string, title: string): Record<string, unknown> {
  return {
    id,
    title,
    cityCode: '420100',
    scene: 'drive',
    status: 'online',
    rankWeight: 90,
    rank: 5,
    rankTag: '热门',
    tags: ['日落'],
    impressions: 0,
    clicks: 0,
    coverImageUrl: '',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    city: { name: '武汉' },
    _count: { favorites: 2 },
  }
}

describe('AdminService.routes 分页', () => {
  it('默认返回第一页 20 条，并给出 total 与全局排名', async () => {
    const prisma = fakePrisma({ total: 42, rows: [routeRow('route-1', '八分山日落线'), routeRow('route-2', '东湖绿道线')] })
    const result = await new AdminService(prisma).routes({})

    expect(result.page).toBe(1)
    expect(result.pageSize).toBe(20)
    expect(result.total).toBe(42)
    expect(result.items).toHaveLength(2)
    expect(result.items.map((item) => item.listRank)).toEqual([1, 2])
    expect(result.items[0]).toMatchObject({ cityName: '武汉', favoriteCount: 2, boundRankings: 1 })
    const args = vi.mocked(prisma.discovery.findMany).mock.calls[0][0] as { skip?: number; take?: number }
    expect(args.skip).toBe(0)
    expect(args.take).toBe(20)
  })

  it('第二页的 listRank 延续上一页，不重新从 1 开始', async () => {
    const prisma = fakePrisma({ total: 42, rows: [routeRow('route-21', '第二十一条')] })
    const result = await new AdminService(prisma).routes({ page: 3, pageSize: 10 })

    expect(result.items[0].listRank).toBe(21)
    const args = vi.mocked(prisma.discovery.findMany).mock.calls[0][0] as { skip?: number; take?: number }
    expect(args.skip).toBe(20)
    expect(args.take).toBe(10)
  })

  it('关键词与场景下推到数据库 where，而不是拉全量后在内存里过滤', async () => {
    const prisma = fakePrisma({ total: 3, rows: [] })
    await new AdminService(prisma).routes({ keyword: ' 日落 ', scene: 'fish' })

    const where = vi.mocked(prisma.discovery.findMany).mock.calls[0][0] as { where?: Record<string, unknown> }
    expect(where.where).toMatchObject({ scene: 'fish' })
    expect(where.where?.OR).toEqual([
      { title: { contains: '日落' } },
      { city: { is: { name: { contains: '日落' } } } },
    ])
    expect(vi.mocked(prisma.discovery.count)).toHaveBeenCalledTimes(1)
  })

  it('无筛选条件时不带 where 过滤', async () => {
    const prisma = fakePrisma({ total: 0, rows: [] })
    const result = await new AdminService(prisma).routes()

    expect(result).toEqual({ items: [], total: 0, page: 1, pageSize: 20 })
    const where = vi.mocked(prisma.discovery.findMany).mock.calls[0][0] as { where?: Record<string, unknown> }
    expect(where.where).toEqual({})
  })
})
