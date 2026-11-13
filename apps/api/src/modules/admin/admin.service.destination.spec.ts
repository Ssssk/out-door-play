import { describe, expect, it, vi } from 'vitest'
import type { PrismaService } from '../../database/prisma.service'
import { AdminService } from './admin.service'
import type { CreateRouteDto, UpdateRouteDto } from './admin.dto'

/** 只覆盖 createRoute / updateRoute 用到的 Prisma 能力，避免单测依赖真实 MySQL */
function fakePrisma(current: Record<string, unknown> = { id: 'route-1', scene: 'play', subType: 'camping' }) {
  return {
    city: { findUnique: vi.fn(async () => ({ code: '420100' })) },
    discovery: {
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => data),
      findUnique: vi.fn(async () => current),
      update: vi.fn(async ({ data }: { data: Record<string, unknown> }) => data),
    },
  } as unknown as PrismaService
}

const campingCreate: CreateRouteDto = {
  title: '木兰草原露营区',
  cityCode: '420100',
  scene: 'play',
  subType: 'camping',
  description: '可搭帐篷',
  endPoint: '木兰草原 A 区',
  endLongitude: 114.123456,
  endLatitude: 30.654321,
  longitude: 114.123456,
  latitude: 30.654321,
}

describe('目的地型（洗车 / 露营 / 打卡）字段策略', () => {
  it('GIVEN 新建露营且不带 difficulty WHEN 创建 THEN 不写入占位值，终点坐标保留', async () => {
    const prisma = fakePrisma()
    await new AdminService(prisma, {} as never).createRoute(campingCreate)

    const data = vi.mocked(prisma.discovery.create).mock.calls[0]![0]!.data as Record<string, unknown>
    expect(data).toMatchObject({
      scene: 'play', subType: 'camping',
      endPoint: '木兰草原 A 区',
      endLongitude: 114.123456, endLatitude: 30.654321,
      longitude: 114.123456, latitude: 30.654321,
      difficulty: '', level: null, bestTime: '', durationLabel: '',
      lengthKm: 0, elevationM: 0, carType: null, startPoint: null,
    })
  })

  it('GIVEN 调用方仍传入隐藏字段 WHEN 新建露营 THEN 服务端强制清空', async () => {
    const prisma = fakePrisma()
    await new AdminService(prisma, {} as never).createRoute({
      ...campingCreate,
      difficulty: '挑战级', level: 'hard', bestTime: '全天', durationLabel: '约 2 小时',
      lengthKm: 99, elevationM: 300, carType: 'SUV', startPoint: '某停车场',
    } as CreateRouteDto)

    const data = vi.mocked(prisma.discovery.create).mock.calls[0]![0]!.data as Record<string, unknown>
    expect(data).toMatchObject({
      difficulty: '', level: null, bestTime: '', durationLabel: '',
      lengthKm: 0, elevationM: 0, carType: null, startPoint: null,
    })
  })

  it('GIVEN 新建打卡 WHEN 创建 THEN 与露营同口径：不写入路线类占位值', async () => {
    const prisma = fakePrisma()
    await new AdminService(prisma, {} as never).createRoute({
      ...campingCreate,
      title: '八分山山顶观景台', subType: 'checkin', endPoint: '八分山山顶观景台',
      difficulty: '挑战级', lengthKm: 5, startPoint: '某停车场',
    } as CreateRouteDto)

    const data = vi.mocked(prisma.discovery.create).mock.calls[0]![0]!.data as Record<string, unknown>
    expect(data).toMatchObject({
      scene: 'play', subType: 'checkin', endPoint: '八分山山顶观景台',
      difficulty: '', level: null, bestTime: '', durationLabel: '',
      lengthKm: 0, elevationM: 0, carType: null, startPoint: null,
    })
  })

  it('GIVEN 新建洗车 WHEN 创建 THEN 隐藏驾驶类占位值，但保留可洗车型与营业时间', async () => {
    const prisma = fakePrisma()
    await new AdminService(prisma, {} as never).createRoute({
      title: '光谷自助洗车', cityCode: '420100', scene: 'wash',
      endPoint: '光谷自助洗车（光谷大道店）', endLongitude: 114.4, endLatitude: 30.47,
      carType: 'SUV/轿车/房车', bestTime: '全天自助',
      difficulty: '挑战级', lengthKm: 9, startPoint: '某停车场',
    } as CreateRouteDto)

    const data = vi.mocked(prisma.discovery.create).mock.calls[0]![0]!.data as Record<string, unknown>
    expect(data).toMatchObject({
      scene: 'wash', endPoint: '光谷自助洗车（光谷大道店）',
      carType: 'SUV/轿车/房车', bestTime: '全天自助',
      difficulty: '', level: null, durationLabel: '',
      lengthKm: 0, elevationM: 0, startPoint: null,
    })
  })

  it('GIVEN 编辑洗车 WHEN 提交隐藏字段 THEN 驾驶类被清空，但车型与营业时间保留', async () => {
    const prisma = fakePrisma({ id: 'wash-1', scene: 'wash', subType: null, carType: 'SUV', bestTime: '全天自助' })
    await new AdminService(prisma, {} as never).updateRoute('wash-1', {
      difficulty: '挑战级', lengthKm: 9, startPoint: '某停车场',
    } as UpdateRouteDto)

    const data = vi.mocked(prisma.discovery.update).mock.calls[0]![0]!.data as Record<string, unknown>
    expect(data).toMatchObject({
      difficulty: '', level: null, lengthKm: 0, elevationM: 0, startPoint: null,
    })
    expect(data).not.toHaveProperty('carType')
    expect(data).not.toHaveProperty('bestTime')
  })

  it('GIVEN 新建溜车 WHEN 创建 THEN 原有难度与占位文案行为不变', async () => {
    const prisma = fakePrisma()
    await new AdminService(prisma, {} as never).createRoute({
      title: '八分山日落线', cityCode: '420100', scene: 'drive', difficulty: '进阶级',
      lengthKm: 18, elevationM: 220, carType: 'SUV', startPoint: '森林公园停车场',
    })

    const data = vi.mocked(prisma.discovery.create).mock.calls[0]![0]!.data as Record<string, unknown>
    expect(data).toMatchObject({
      difficulty: '进阶级', lengthKm: 18, elevationM: 220,
      carType: 'SUV', startPoint: '森林公园停车场',
      bestTime: '待补充', durationLabel: '待补充',
    })
  })

  it('GIVEN 编辑露营 WHEN 提交隐藏字段 THEN 被剥离并清空，终点仍可更新', async () => {
    const prisma = fakePrisma()
    await new AdminService(prisma, {} as never).updateRoute('route-1', {
      difficulty: '挑战级', carType: 'SUV', startPoint: '某停车场', endPoint: '木兰草原 B 区',
    } as UpdateRouteDto)

    const data = vi.mocked(prisma.discovery.update).mock.calls[0]![0]!.data as Record<string, unknown>
    expect(data).toMatchObject({
      endPoint: '木兰草原 B 区',
      difficulty: '', level: null, bestTime: '', durationLabel: '',
      lengthKm: 0, elevationM: 0, carType: null, startPoint: null,
    })
  })

  it('GIVEN 编辑溜车 WHEN 提交难度 THEN 正常保留', async () => {
    const prisma = fakePrisma({ id: 'route-2', scene: 'drive', subType: null })
    await new AdminService(prisma, {} as never).updateRoute('route-2', { difficulty: '轻松级' } as UpdateRouteDto)

    const data = vi.mocked(prisma.discovery.update).mock.calls[0]![0]!.data as Record<string, unknown>
    expect(data.difficulty).toBe('轻松级')
    expect(data).not.toHaveProperty('lengthKm')
  })
})
