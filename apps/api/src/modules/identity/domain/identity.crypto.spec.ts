import { describe, expect, it } from 'vitest'
import { MOBILE_ACCESS_TTL_MS, MOBILE_REFRESH_TTL_MS, issueMobileTokenPair, providerSubjectHash, tokenHash } from './identity.crypto'

describe('mobile identity crypto', () => {
  it('GIVEN 当前时间 WHEN 签发 token pair THEN token 不同且只暴露固定长度摘要', () => {
    const now = new Date('2026-09-01T00:00:00Z')
    const pair = issueMobileTokenPair(now)
    expect(pair.accessToken).not.toBe(pair.refreshToken)
    expect(pair.accessTokenHash).toMatch(/^[a-f0-9]{64}$/u)
    expect(pair.refreshTokenHash).toMatch(/^[a-f0-9]{64}$/u)
    expect(pair.accessExpiresAt.getTime() - now.getTime()).toBe(MOBILE_ACCESS_TTL_MS)
    expect(pair.refreshExpiresAt.getTime() - now.getTime()).toBe(MOBILE_REFRESH_TTL_MS)
    expect(pair.accessTokenHash).toBe(tokenHash(pair.accessToken))
  })

  it('GIVEN provider subject WHEN HMAC THEN 不保存明文且 provider 参与隔离', () => {
    const key = 'test-only-hmac-key-at-least-32-characters'
    const wechat = providerSubjectHash('wechat', 'openid-1', key)
    const dev = providerSubjectHash('dev', 'openid-1', key)
    expect(wechat).toMatch(/^[a-f0-9]{64}$/u)
    expect(wechat).not.toContain('openid-1')
    expect(wechat).not.toBe(dev)
  })

  it('GIVEN 过短 HMAC key WHEN 摘要身份 THEN 快速失败', () => {
    expect(() => providerSubjectHash('dev', 'dev-a', 'short')).toThrow('at least 32 characters')
  })
})
