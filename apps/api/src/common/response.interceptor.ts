import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common'
import { map } from 'rxjs/operators'
import type { Observable } from 'rxjs'
import type { Request } from 'express'

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, { code: 0; message: 'ok'; data: T; traceId: string }> {
  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<{ code: 0; message: 'ok'; data: T; traceId: string }> {
    const request = context.switchToHttp().getRequest<Request>()
    const traceId = String(request.headers['x-request-id'] || '')
    return next.handle().pipe(map((data) => ({ code: 0, message: 'ok', data, traceId })))
  }
}
