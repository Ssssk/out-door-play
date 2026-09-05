import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import type { Request } from 'express'
import { ADMIN_PERMISSIONS_KEY, ADMIN_PUBLIC_KEY } from './admin-auth.decorators'
import type { AdminPermissionCode } from './admin-auth.constants'
import { ADMIN_SESSION_COOKIE } from './admin-auth.constants'
import { AdminAuthService } from './admin-auth.service'
import type { AdminRequestContext } from './admin-auth.types'
import { isAdminOriginAllowed } from './admin-origin'

function cookieValue(cookieHeader: string | undefined, name: string): string | undefined {
  if (!cookieHeader) return undefined
  for (const item of cookieHeader.split(';')) {
    const separator = item.indexOf('=')
    if (separator < 0 || item.slice(0, separator).trim() !== name) continue
    try { return decodeURIComponent(item.slice(separator + 1).trim()) } catch { return undefined }
  }
  return undefined
}

@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector, private readonly auth: AdminAuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & AdminRequestContext>()
    const path = request.originalUrl.split('?')[0]
    if (!path.startsWith('/v1/admin')) return true

    const isPublic = this.reflector.getAllAndOverride<boolean>(ADMIN_PUBLIC_KEY, [context.getHandler(), context.getClass()])
    if (isPublic) return true

    const authContext = await this.auth.authenticate(cookieValue(request.headers.cookie, ADMIN_SESSION_COOKIE))
    request.adminAuth = authContext

    const required = this.reflector.getAllAndOverride<AdminPermissionCode[]>(ADMIN_PERMISSIONS_KEY, [context.getHandler(), context.getClass()]) || []
    if (!required.every((permission) => authContext.actor.permissions.includes(permission))) {
      throw new ForbiddenException({ message: '当前账号无权执行此操作', code: 'ADMIN_PERMISSION_DENIED' })
    }

    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method.toUpperCase())) {
      const origin = request.header('origin')
      const csrf = request.header('x-csrf-token')
      if (!isAdminOriginAllowed(origin) || !this.auth.verifyCsrf(csrf, authContext.csrfHash)) {
        throw new ForbiddenException({ message: '请求安全校验失败', code: 'ADMIN_CSRF_INVALID' })
      }
    }
    return true
  }
}
