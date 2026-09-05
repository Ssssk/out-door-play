import { NestFactory } from '@nestjs/core'
import type { INestApplication } from '@nestjs/common'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { AppModule } from '../src/app.module'
import { PrismaService } from '../src/database/prisma.service'
import { PrismaDiscoveryRepository } from '../src/modules/routes/prisma-discovery.repository'
import { configureApplication } from '../src/setup-application'

describe('mobile discovery MySQL integration', () => {
  let app: INestApplication
  let prisma: PrismaService
  let repository: PrismaDiscoveryRepository
  const enabledCity = '979797'
  const disabledCity = '979798'
  const ids = ['qa-discovery-a', 'qa-discovery-b', 'qa-discovery-c', 'qa-discovery-offline', 'qa-discovery-disabled']

  beforeAll(async () => {
    app = await NestFactory.create(AppModule, { logger: false })
    configureApplication(app)
    await app.init()
    prisma = app.get(PrismaService)
    repository = new PrismaDiscoveryRepository(prisma)

    await prisma.discovery.deleteMany({ where: { id: { in: ids } } })
    await prisma.city.deleteMany({ where: { code: { in: [enabledCity, disabledCity] } } })
    await prisma.city.createMany({
      data: [
        { code: enabledCity, name: '发现集成测试城市', enabled: true, scenes: ['drive', 'fish'] },
        { code: disabledCity, name: '已停用测试城市', enabled: false, scenes: ['drive'] },
      ],
    })
    const base = {
      scene: 'drive' as const,
      rankTag: '测试榜',
      lengthKm: 2,
      elevationM: 3,
      difficulty: '入门级',
      coverImageUrl: '/static/test.png',
      durationLabel: '1 小时',
      bestTime: '白天',
      description: '仅用于隔离 MySQL 集成测试',
      tags: ['测试'],
      latitude: 30,
      longitude: 114,
    }
    await prisma.discovery.createMany({
      data: [
        { ...base, id: ids[0], cityCode: enabledCity, title: '排名十', rank: 10, distanceKm: 1 },
        { ...base, id: ids[1], cityCode: enabledCity, title: '排名二较远', rank: 2, distanceKm: 5 },
        { ...base, id: ids[2], cityCode: enabledCity, title: '排名二较近', rank: 2, distanceKm: 3 },
        { ...base, id: ids[3], cityCode: enabledCity, title: '已下线', rank: 1, distanceKm: 1, status: 'offline' },
        { ...base, id: ids[4], cityCode: disabledCity, title: '城市已停用', rank: 1, distanceKm: 1 },
      ],
    })
  })

  afterAll(async () => {
    if (prisma) {
      await prisma.discovery.deleteMany({ where: { id: { in: ids } } })
      await prisma.city.deleteMany({ where: { code: { in: [enabledCity, disabledCity] } } })
    }
    if (app) await app.close()
  })

  it('uses rank, distance and id as stable order and enforces the requested limit', async () => {
    const records = await repository.list('drive', 2, enabledCity)
    expect(records.map((item) => item.id)).toEqual([ids[2], ids[1]])
  })

  it('hides offline content and content belonging to disabled cities', async () => {
    expect(await repository.find(ids[3], 'drive')).toBeNull()
    expect(await repository.list('drive', 10, disabledCity)).toEqual([])
    expect((await repository.listCities()).map((city) => city.code)).not.toContain(disabledCity)
  })
})
