import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common'
import { randomUUID } from 'node:crypto'
import { catchError, from, map, mergeMap, Observable, of, throwError } from 'rxjs'
import type { Request } from 'express'
import { PrismaService } from '../../database/prisma.service'
import type { AdminRequestContext } from './admin-auth.types'

@Injectable()
export class AdminAuditInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request & AdminRequestContext>()
    const unsafe = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method.toUpperCase())
    const isAdmin = request.originalUrl.split('?')[0].startsWith('/v1/admin')
    const serviceHandlesAudit = /\/routes\/[^/]+\/actions(?:\?|$)/.test(request.originalUrl)
    if (!unsafe || !isAdmin || !request.adminAuth) return next.handle()

    const write = (result: 'success' | 'rejected') => {
      const resourceType = request.path.split('/').filter((part) => part && part !== 'v1' && part !== 'admin')[0] || 'admin'
      const resourceId = String(request.params.id || request.params.code || request.adminAuth!.actor.id)
      return this.prisma.auditLog.create({ data: {
        actionId: `audit-${randomUUID()}`,
        adminUserId: request.adminAuth!.actor.id,
        operator: request.adminAuth!.actor.displayName,
        action: `${request.method.toLowerCase()}:${resourceType}`.slice(0, 32),
        resourceType,
        resourceId: resourceId.slice(0, 64),
        requestId: String(request.headers['x-request-id'] || '').slice(0, 64) || null,
        result,
      } })
    }

    return next.handle().pipe(
      mergeMap((data) => serviceHandlesAudit ? of(data) : from(write('success')).pipe(map(() => data), catchError(() => of(data)))),
      catchError((error: unknown) => from(write('rejected')).pipe(
        catchError(() => of(null)),
        mergeMap(() => throwError(() => error)),
      )),
    )
  }
}
