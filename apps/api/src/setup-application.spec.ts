import type { INestApplication } from '@nestjs/common'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { configureApplication } from './setup-application'

describe('configureApplication', () => {
  afterEach(() => vi.unstubAllEnvs())

  it('通过 Nest HTTP 适配器暴露本地上传文件', () => {
    vi.stubEnv('UPLOAD_DIR', 'test-uploads')
    const useStaticAssets = vi.fn()
    const app = {
      enableCors: vi.fn(),
      setGlobalPrefix: vi.fn(),
      getHttpAdapter: vi.fn(() => ({ useStaticAssets })),
      useGlobalPipes: vi.fn(),
      useGlobalFilters: vi.fn(),
      useGlobalInterceptors: vi.fn(),
    } as unknown as INestApplication

    configureApplication(app)

    expect(useStaticAssets).toHaveBeenCalledWith('test-uploads', {
      prefix: '/v1/uploads',
      maxAge: '30d',
      index: false,
    })
  })
})
