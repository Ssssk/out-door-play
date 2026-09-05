import { Injectable } from '@nestjs/common'
import { randomUUID } from 'node:crypto'
import type { NextFunction, Request, Response } from 'express'

@Injectable()
export class TraceMiddleware {
  use(request: Request, response: Response, next: NextFunction) {
    const traceId = String(request.header('x-request-id') || randomUUID())
    request.headers['x-request-id'] = traceId
    response.setHeader('x-request-id', traceId)
    next()
  }
}
