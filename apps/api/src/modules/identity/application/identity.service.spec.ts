import { UnauthorizedException } from '@nestjs/common'
import { describe, expect, it, vi } from 'vitest'
import { tokenHash } from '../domain/identity.crypto'
import { IdentityService } from './identity.service'

const now = new Date('2026-09-01T00:00:00Z')
const activeUser = { id: 'u1', status: 'normal', avatarUrl: '/static/a.png', nickname: '测试用户', mileage: 3, checkins: 2 }

function service(prisma: Record<string, unknown>) {
  return new IdentityService(prisma as never, {} as never, {} as never)
}

describe('IdentityService session lifecycle', () => {
  it('GIVEN 有效 access WHEN authenticate THEN 返回 session 绑定主体', async () => {
    const prisma = { mobileSession: { findUnique: vi.fn().mockResolvedValue({ id: 's1', userId: 'u1', revokedAt: null, accessExpiresAt: new Date('2026-09-01T00:15:00Z'), refreshExpiresAt: new Date('2026-10-01T00:00:00Z'), user: activeUser }) } }
    await expect(service(prisma).authenticate('access-token', now)).resolves.toEqual({ userId: 'u1', sessionId: 's1' })
    expect(prisma.mobileSession.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { accessTokenHash: tokenHash('access-token') } }))
  })

  it.each([
    ['revoked', { revokedAt: now, accessExpiresAt: new Date('2026-09-01T00:15:00Z'), refreshExpiresAt: new Date('2026-10-01T00:00:00Z'), user: activeUser }],
    ['expired', { revokedAt: null, accessExpiresAt: new Date('2026-08-31T23:59:59Z'), refreshExpiresAt: new Date('2026-10-01T00:00:00Z'), user: activeUser }],
    ['banned', { revokedAt: null, accessExpiresAt: new Date('2026-09-01T00:15:00Z'), refreshExpiresAt: new Date('2026-10-01T00:00:00Z'), user: { ...activeUser, status: 'banned' } }],
  ])('GIVEN %s access WHEN authenticate THEN 401', async (_name, state) => {
    const prisma = { mobileSession: { findUnique: vi.fn().mockResolvedValue({ id: 's1', userId: 'u1', ...state }), updateMany: vi.fn().mockResolvedValue({ count: 1 }) } }
    await expect(service(prisma).authenticate('access-token', now)).rejects.toBeInstanceOf(UnauthorizedException)
  })

  it('GIVEN 有效 refresh WHEN 原子更新成功 THEN 返回新 pair 和资料', async () => {
    const prisma = {
      mobileSession: {
        findUnique: vi.fn().mockResolvedValue({ id: 's1', userId: 'u1', revokedAt: null, refreshExpiresAt: new Date('2026-10-01T00:00:00Z'), user: activeUser }),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      user: { findUnique: vi.fn().mockResolvedValue({ ...activeUser, _count: { favorites: 4 } }) },
    }
    const result = await service(prisma).refresh('refresh-token-value-that-is-long-enough', now)
    expect(result.tokens.accessToken).not.toBe(result.tokens.refreshToken)
    expect(result.profile.stats.favorites).toBe(4)
    expect(prisma.mobileSession.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ refreshTokenHash: tokenHash('refresh-token-value-that-is-long-enough') }) }))
    expect(prisma.mobileSession.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ user: { status: 'normal' } }) }))
  })

  it('GIVEN 已被并发轮换的 refresh WHEN 条件更新为 0 THEN 401', async () => {
    const prisma = {
      mobileSession: {
        findUnique: vi.fn().mockResolvedValue({ id: 's1', userId: 'u1', revokedAt: null, refreshExpiresAt: new Date('2026-10-01T00:00:00Z'), user: activeUser }),
        updateMany: vi.fn().mockResolvedValue({ count: 0 }),
      },
    }
    await expect(service(prisma).refresh('refresh-token-value-that-is-long-enough', now)).rejects.toBeInstanceOf(UnauthorizedException)
  })
})
