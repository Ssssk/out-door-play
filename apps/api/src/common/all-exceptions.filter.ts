import { ArgumentsHost, Catch, HttpException, HttpStatus } from '@nestjs/common'
import type { ExceptionFilter } from '@nestjs/common'
import type { Request, Response } from 'express'

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp()
    const response = context.getResponse<Response>()
    const request = context.getRequest<Request>()
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR
    const payload = exception instanceof HttpException ? exception.getResponse() : 'Internal server error'
    const body = typeof payload === 'object' && payload !== null ? payload as { code?: unknown; message?: unknown; details?: unknown; retryAfter?: unknown } : null
    const rawMessage = body?.message ?? payload
    const message = Array.isArray(rawMessage) ? rawMessage.join('；') : typeof rawMessage === 'string' ? rawMessage : 'Request failed'
    const code = typeof body?.code === 'string' ? body.code : status
    if (status === HttpStatus.TOO_MANY_REQUESTS && typeof body?.retryAfter === 'number') response.setHeader('Retry-After', String(body.retryAfter))
    response.status(status).json({ code, message, data: null, details: body?.details || [], traceId: request.headers['x-request-id'] || '' })
  }
}
