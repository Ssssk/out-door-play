import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common'
import type { Request } from 'express'
import type { AdminPermissionCode } from './admin-auth.constants'
import type { AdminActor, AdminRequestContext } from './admin-auth.types'

export const ADMIN_PUBLIC_KEY = 'admin:public'
export const ADMIN_PERMISSIONS_KEY = 'admin:permissions'

export const PublicAdminEndpoint = () => SetMetadata(ADMIN_PUBLIC_KEY, true)
export const RequireAdminPermissions = (...permissions: AdminPermissionCode[]) => SetMetadata(ADMIN_PERMISSIONS_KEY, permissions)

export const CurrentAdmin = createParamDecorator((_data: unknown, context: ExecutionContext): AdminActor => {
  const request = context.switchToHttp().getRequest<Request & AdminRequestContext>()
  if (!request.adminAuth) throw new Error('Admin authentication context is missing')
  return request.adminAuth.actor
})

export const CurrentRequestId = createParamDecorator((_data: unknown, context: ExecutionContext): string => {
  const request = context.switchToHttp().getRequest<Request>()
  return String(request.headers['x-request-id'] || '')
})
