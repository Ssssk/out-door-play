import { randomUUID } from 'node:crypto'
import type { INestApplication } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { AppModule } from '../src/app.module'
import { PrismaService } from '../src/database/prisma.service'
import { IdentityService } from '../src/modules/identity/application/identity.service'
import { DevIdentityProvider } from '../src/modules/identity/infrastructure/dev-identity.provider'
import { WechatIdentityProvider } from '../src/modules/identity/infrastructure/wechat-identity.provider'
import { UserService } from '../src/modules/user/user.service'
import { configureApplication } from '../src/setup-application'

describe('mobile identity MySQL integration', () => {
  let app: INestApplication
  let prisma: PrismaService
  let identity: IdentityService
  let users: UserService
  const runId = randomUUID().replaceAll('-', '').slice(0, 20)
  const userAId = `qa-mobile-a-${runId}`
  const userBId = `qa-mobile-b-${runId}`
  const discoveryId = `qa-route-${runId}`
  const cityCode = '989898'
  const previousEnv = {
    nodeEnv: process.env.NODE_ENV,
    devIdentity: process.env.DEV_IDENTITY_ENABLED,
    subjectKey: process.env.IDENTITY_SUBJECT_HMAC_KEY,
  }

  beforeAll(async () => {
    process.env.NODE_ENV = 'test'
    process.env.DEV_IDENTITY_ENABLED = 'true'
    process.env.IDENTITY_SUBJECT_HMAC_KEY = 'qa-only-mobile-identity-hmac-key-2026'
    app = await NestFactory.create(AppModule, { logger: false })
    configureApplication(app)
    await app.init()
    prisma = app.get(PrismaService)
    // Vitest/esbuild 不发射 Nest constructor metadata；显式注入真实 Prisma 与 provider。
    identity = new IdentityService(prisma, new WechatIdentityProvider(), new DevIdentityProvider())
    users = new UserService(prisma)

    await prisma.city.upsert({
      where: { code: cityCode },
      update: {},
      create: { code: cityCode, name: '身份集成测试城市', scenes: ['drive'] },
    })
    await prisma.user.createMany({
      data: [
        { id: userAId, avatarUrl: '/static/icons/avatar-mine.png', nickname: '身份测试 A' },
        { id: userBId, avatarUrl: '/static/icons/avatar-mine.png', nickname: '身份测试 B' },
      ],
    })
    await prisma.discovery.create({
      data: {
        id: discoveryId, cityCode, scene: 'drive', title: '身份集成测试路线', rank: 1, rankTag: '测试',
        distanceKm: 1, lengthKm: 2, elevationM: 3, difficulty: '入门级', coverImageUrl: '/static/test.png',
        durationLabel: '1 小时', bestTime: '白天', carType: '不限', startPoint: '起点', endPoint: '终点',
        description: '仅用于隔离 MySQL 集成测试', tags: ['测试'], latitude: 30, longitude: 114,
      },
    })
  })

  afterAll(async () => {
    if (prisma) {
      await prisma.discovery.deleteMany({ where: { id: discoveryId } })
      await prisma.user.deleteMany({ where: { id: { in: [userAId, userBId] } } })
      await prisma.city.deleteMany({ where: { code: cityCode } })
    }
    if (app) await app.close()
    if (previousEnv.nodeEnv === undefined) delete process.env.NODE_ENV
    else process.env.NODE_ENV = previousEnv.nodeEnv
    if (previousEnv.devIdentity === undefined) delete process.env.DEV_IDENTITY_ENABLED
    else process.env.DEV_IDENTITY_ENABLED = previousEnv.devIdentity
    if (previousEnv.subjectKey === undefined) delete process.env.IDENTITY_SUBJECT_HMAC_KEY
    else process.env.IDENTITY_SUBJECT_HMAC_KEY = previousEnv.subjectKey
  })

  it('allows exactly one concurrent refresh and keeps two users isolated', async () => {
    await expect(identity.authenticate(undefined)).rejects.toMatchObject({ status: 401 })
    const firstA = await identity.loginWithDevIdentity(userAId)
    await identity.loginWithDevIdentity(userBId)

    const rotations = await Promise.allSettled(
      Array.from({ length: 20 }, () => identity.refresh(firstA.tokens.refreshToken)),
    )
    expect(rotations.filter((result) => result.status === 'fulfilled')).toHaveLength(1)
    expect(rotations.filter((result) => result.status === 'rejected')).toHaveLength(19)

    await users.update(userAId, { nickname: '身份测试 A 已更新', avatarUrl: '/static/icons/avatar-mine.png' })
    expect((await users.me(userAId)).nickname).toBe('身份测试 A 已更新')
    expect((await users.me(userBId)).nickname).toBe('身份测试 B')

    await Promise.all(Array.from({ length: 10 }, () => users.addFavorite(userAId, discoveryId)))
    expect(await users.favorites(userAId, 'drive')).toHaveLength(1)
    expect(await users.favorites(userBId, 'drive')).toHaveLength(0)
  })
})
