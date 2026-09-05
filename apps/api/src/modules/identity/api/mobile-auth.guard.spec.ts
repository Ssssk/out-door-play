import { UnauthorizedException, type ExecutionContext } from '@nestjs/common'
import { describe, expect, it, vi } from 'vitest'
import { MobileAuthGuard } from './mobile-auth.guard'

function context(request: Record<string, unknown>): ExecutionContext {
  return { switchToHttp: () => ({ getRequest: () => request }) } as unknown as ExecutionContext
}

describe('MobileAuthGuard', () => {
  it('GIVEN Bearer token WHEN authenticate THEN 注入可信 principal', async () => {
    const request = { header: (name: string) => name === 'authorization' ? 'Bearer access-token' : undefined }
    const identity = { authenticate: vi.fn().mockResolvedValue({ userId: 'u1', sessionId: 's1' }) }
    const guard = new MobileAuthGuard(identity as never)
    await expect(guard.canActivate(context(request))).resolves.toBe(true)
    expect(request).toHaveProperty('mobileAuth', { userId: 'u1', sessionId: 's1' })
    expect(identity.authenticate).toHaveBeenCalledWith('access-token')
  })

  it('GIVEN 缺失 Bearer WHEN authenticate THEN 401', async () => {
    const identity = { authenticate: vi.fn().mockRejectedValue(new UnauthorizedException()) }
    const guard = new MobileAuthGuard(identity as never)
    await expect(guard.canActivate(context({ header: () => undefined }))).rejects.toBeInstanceOf(UnauthorizedException)
  })
})
