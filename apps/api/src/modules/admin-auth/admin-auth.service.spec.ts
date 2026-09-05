import { UnauthorizedException } from '@nestjs/common'
import { describe, expect, it, vi } from 'vitest'
import { AdminAuthService } from './admin-auth.service'

const adminUser = {
  id: 'admin-1', username: 'ops', displayName: '运营', status: 'active',
  roles: [{ role: { code: 'analyst', permissions: [{ permission: { code: 'route:read' } }] } }],
}

describe('AdminAuthService session lifecycle', () => {
  it.each([
    ['revoked', { revokedAt: new Date('2026-08-30T09:00:00Z'), idleExpiresAt: new Date('2026-08-30T12:00:00Z'), absoluteExpiresAt: new Date('2026-08-30T20:00:00Z') }],
    ['idle expired', { revokedAt: null, idleExpiresAt: new Date('2026-08-30T09:59:59Z'), absoluteExpiresAt: new Date('2026-08-30T20:00:00Z') }],
    ['absolute expired', { revokedAt: null, idleExpiresAt: new Date('2026-08-30T12:00:00Z'), absoluteExpiresAt: new Date('2026-08-30T09:59:59Z') }],
  ])('GIVEN %s session WHEN authenticate THEN 401', async (_name, state) => {
    const prisma = { adminSession: { findUnique: vi.fn().mockResolvedValue({ id: 's1', csrfHash: 'hash', lastSeenAt: new Date('2026-08-30T09:55:00Z'), adminUser, ...state }) } }
    const service = new AdminAuthService(prisma as never)
    await expect(service.authenticate('token', new Date('2026-08-30T10:00:00Z'))).rejects.toBeInstanceOf(UnauthorizedException)
  })

  it('GIVEN active session WHEN authenticate THEN returns actor and touches sliding expiry', async () => {
    const update = vi.fn().mockResolvedValue({})
    const prisma = { adminSession: { findUnique: vi.fn().mockResolvedValue({ id: 's1', csrfHash: 'hash', revokedAt: null, lastSeenAt: new Date('2026-08-30T09:50:00Z'), idleExpiresAt: new Date('2026-08-30T11:00:00Z'), absoluteExpiresAt: new Date('2026-08-30T20:00:00Z'), adminUser }), update } }
    const service = new AdminAuthService(prisma as never)
    const result = await service.authenticate('token', new Date('2026-08-30T10:00:00Z'))
    expect(result.actor.permissions).toEqual(['route:read'])
    expect(update).toHaveBeenCalledOnce()
  })
})
