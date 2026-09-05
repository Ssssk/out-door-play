import { ForbiddenException, UnauthorizedException, type ExecutionContext } from '@nestjs/common'
import { describe, expect, it, vi } from 'vitest'
import { AdminAuthGuard } from './admin-auth.guard'

const actor = { id: 'admin-1', username: 'ops', displayName: '运营', roles: ['analyst'], permissions: ['route:read'] }

function context(request: Record<string, unknown>): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => function handler() {},
    getClass: () => class Controller {},
  } as unknown as ExecutionContext
}

describe('AdminAuthGuard', () => {
  it('GIVEN 匿名请求 WHEN 访问 Admin API THEN 返回 401', async () => {
    const reflector = { getAllAndOverride: vi.fn().mockReturnValue(false) }
    const auth = { authenticate: vi.fn().mockRejectedValue(new UnauthorizedException()), verifyCsrf: vi.fn() }
    const guard = new AdminAuthGuard(reflector as never, auth as never)
    await expect(guard.canActivate(context({ originalUrl: '/v1/admin/routes', method: 'GET', headers: {} }))).rejects.toBeInstanceOf(UnauthorizedException)
  })

  it('GIVEN analyst WHEN 缺少写权限 THEN 返回 403', async () => {
    const reflector = { getAllAndOverride: vi.fn().mockReturnValueOnce(false).mockReturnValueOnce(['route:edit']) }
    const auth = { authenticate: vi.fn().mockResolvedValue({ actor, sessionId: 's1', csrfHash: 'hash' }), verifyCsrf: vi.fn() }
    const guard = new AdminAuthGuard(reflector as never, auth as never)
    await expect(guard.canActivate(context({ originalUrl: '/v1/admin/routes/1', method: 'PATCH', headers: { cookie: 'admin_session=t' } }))).rejects.toBeInstanceOf(ForbiddenException)
  })

  it('GIVEN 有写权限 WHEN Origin 或 CSRF 无效 THEN 返回 403', async () => {
    const writeActor = { ...actor, permissions: ['route:edit'] }
    const reflector = { getAllAndOverride: vi.fn().mockReturnValueOnce(false).mockReturnValueOnce(['route:edit']) }
    const auth = { authenticate: vi.fn().mockResolvedValue({ actor: writeActor, sessionId: 's1', csrfHash: 'hash' }), verifyCsrf: vi.fn().mockReturnValue(false) }
    const guard = new AdminAuthGuard(reflector as never, auth as never)
    const request = { originalUrl: '/v1/admin/routes/1', method: 'PATCH', headers: { cookie: 'admin_session=t' }, header: (name: string) => name === 'origin' ? 'http://localhost:5174' : 'forged' }
    await expect(guard.canActivate(context(request))).rejects.toBeInstanceOf(ForbiddenException)
  })
})
