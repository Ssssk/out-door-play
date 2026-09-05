import { randomUUID } from 'node:crypto'
import { NestFactory } from '@nestjs/core'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { INestApplication } from '@nestjs/common'
import { AppModule } from '../src/app.module'
import { PrismaService } from '../src/database/prisma.service'
import { AdminAuthService } from '../src/modules/admin-auth/admin-auth.service'
import { hashAdminPassword } from '../src/modules/admin-auth/admin-auth.crypto'
import { configureApplication } from '../src/setup-application'

describe('AdminAuthService MySQL integration', () => {
  let app: INestApplication
  let prisma: PrismaService
  let auth: AdminAuthService
  const id = randomUUID()
  const username = `qa_int_${id.replaceAll('-', '').slice(0, 20)}`
  const password = 'Qa-Integration-2026!'

  beforeAll(async () => {
    app = await NestFactory.create(AppModule, { logger: false })
    configureApplication(app)
    await app.init()
    prisma = app.get(PrismaService)
    // Vitest/esbuild 不发射 Nest constructor metadata；集成测试显式注入真实 Prisma。
    auth = new AdminAuthService(prisma)
    await prisma.adminUser.create({
      data: { id, username, displayName: 'QA Integration', passwordHash: await hashAdminPassword(password) },
    })
  })

  afterAll(async () => {
    await prisma.adminSession.deleteMany({ where: { adminUserId: id } })
    await prisma.adminUser.deleteMany({ where: { id } })
    await app.close()
  })

  it('persists, authenticates and revokes an opaque session', async () => {
    const login = await auth.login(username, password, { ip: '127.0.0.1', userAgent: 'quality-gate' })
    expect(login.token).not.toContain(id)
    const context = await auth.authenticate(login.token)
    expect(context.actor.id).toBe(id)
    await auth.logout(context.sessionId)
    await expect(auth.authenticate(login.token)).rejects.toMatchObject({ status: 401 })
  })
})
