import { afterEach, describe, expect, it, vi } from 'vitest'
import { allowedAdminOrigins, isAdminOriginAllowed } from './admin-origin'

afterEach(() => { vi.unstubAllEnvs() })

function production() {
  vi.stubEnv('NODE_ENV', 'production')
  vi.stubEnv('ADMIN_ALLOWED_ORIGINS', '')
  vi.stubEnv('CORS_ORIGINS', '')
}

describe('admin origin allowlist', () => {
  it('GIVEN 生产环境白名单命中 WHEN 校验 Origin THEN 放行', () => {
    production()
    vi.stubEnv('ADMIN_ALLOWED_ORIGINS', 'https://www.chumenliuliu.cloud,https://chumenliuliu.cloud')
    expect(isAdminOriginAllowed('https://www.chumenliuliu.cloud', 'www.chumenliuliu.cloud')).toBe(true)
    expect(isAdminOriginAllowed('https://chumenliuliu.cloud', 'www.chumenliuliu.cloud')).toBe(true)
  })

  it('GIVEN 白名单未命中 WHEN Origin 与请求 Host 同源 THEN 放行（防漏配锁死）', () => {
    production()
    vi.stubEnv('ADMIN_ALLOWED_ORIGINS', 'http://1.2.3.4:8080')
    expect(isAdminOriginAllowed('https://www.chumenliuliu.cloud', 'www.chumenliuliu.cloud')).toBe(true)
  })

  it('GIVEN 白名单为空 WHEN Origin 与请求 Host 同源 THEN 放行', () => {
    production()
    expect(isAdminOriginAllowed('https://www.chumenliuliu.cloud', 'www.chumenliuliu.cloud')).toBe(true)
  })

  it('GIVEN 跨站 Origin WHEN 与请求 Host 不同 THEN 拒绝', () => {
    production()
    expect(isAdminOriginAllowed('https://evil.example.com', 'www.chumenliuliu.cloud')).toBe(false)
    expect(isAdminOriginAllowed('https://www.chumenliuliu.cloud.evil.example.com', 'www.chumenliuliu.cloud')).toBe(false)
  })

  it('GIVEN 无 Origin THEN 拒绝', () => {
    production()
    vi.stubEnv('ADMIN_ALLOWED_ORIGINS', 'https://www.chumenliuliu.cloud')
    expect(isAdminOriginAllowed(undefined, 'www.chumenliuliu.cloud')).toBe(false)
  })

  it('GIVEN 生产环境漏配 ADMIN_ALLOWED_ORIGINS WHEN 读取白名单 THEN 回落到 CORS_ORIGINS', () => {
    production()
    vi.stubEnv('CORS_ORIGINS', 'https://www.chumenliuliu.cloud')
    expect(allowedAdminOrigins().has('https://www.chumenliuliu.cloud')).toBe(true)
  })
})
