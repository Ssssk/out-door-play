import { NestFactory } from '@nestjs/core'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { INestApplication, Type } from '@nestjs/common'

// E2E 必须加载 tsc 产物以保留 Nest emitDecoratorMetadata；API 工程本身为 CommonJS。
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { AppModule } = require('../dist/app.module.js') as { AppModule: Type<unknown> }
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { configureApplication } = require('../dist/setup-application.js') as {
  configureApplication: (app: INestApplication) => void
}

describe('API HTTP baseline', () => {
  let app: INestApplication
  let baseUrl: string

  beforeAll(async () => {
    app = await NestFactory.create(AppModule, { logger: false })
    configureApplication(app)
    await app.listen(0, '127.0.0.1')
    baseUrl = await app.getUrl()
  })

  afterAll(async () => {
    await app.close()
  })

  it('serves a database-backed health response in the public envelope', async () => {
    const response = await fetch(`${baseUrl}/v1/health`, { headers: { 'x-request-id': 'qa-e2e-health' } })
    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({ code: 0, data: { status: 'ok', database: 'connected' }, traceId: 'qa-e2e-health' })
  })

  it('denies anonymous access to an admin resource', async () => {
    const response = await fetch(`${baseUrl}/v1/admin/routes`, { headers: { 'x-request-id': 'qa-e2e-admin' } })
    expect(response.status).toBe(401)
    expect(await response.json()).toMatchObject({ code: 'ADMIN_SESSION_INVALID', data: null, traceId: 'qa-e2e-admin' })
  })

  it('rejects malformed login input at the HTTP boundary', async () => {
    const response = await fetch(`${baseUrl}/v1/admin/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: 'http://127.0.0.1:5174' },
      body: JSON.stringify({ username: 'x', password: 'short', unexpected: true }),
    })
    expect(response.status).toBe(422)
    expect(await response.json()).toMatchObject({ code: 'COMMON_VALIDATION_FAILED', data: null })
  })

  it('serves enabled cities and rejects malformed discovery filters', async () => {
    const cities = await fetch(`${baseUrl}/v1/cities`, { headers: { 'x-request-id': 'qa-e2e-cities' } })
    expect(cities.status).toBe(200)
    expect(await cities.json()).toMatchObject({ code: 0, traceId: 'qa-e2e-cities' })

    const malformed = await fetch(`${baseUrl}/v1/routes?city=not-a-city&scene=unknown&limit=99`)
    expect(malformed.status).toBe(422)
    expect(await malformed.json()).toMatchObject({ code: 'COMMON_VALIDATION_FAILED', data: null })
  })

  it('uses a stable 404 error for an absent discovery detail', async () => {
    const response = await fetch(`${baseUrl}/v1/routes/does-not-exist`, { headers: { 'x-request-id': 'qa-e2e-missing' } })
    expect(response.status).toBe(404)
    expect(await response.json()).toMatchObject({
      code: 'DISCOVERY_NOT_FOUND',
      message: '内容不存在或已下线',
      data: null,
      traceId: 'qa-e2e-missing',
    })
  })
})
