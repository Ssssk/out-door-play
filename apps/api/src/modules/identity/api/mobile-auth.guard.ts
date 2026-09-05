import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import type { Request } from 'express'
import { IdentityService } from '../application/identity.service'
import type { MobileRequestContext } from '../domain/identity.types'

function bearerToken(header: string | undefined): string | undefined {
  if (!header) return undefined
  const match = /^Bearer\s+([^\s]+)$/iu.exec(header)
  return match?.[1]
}

@Injectable()
export class MobileAuthGuard implements CanActivate {
  constructor(private readonly identity: IdentityService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & MobileRequestContext>()
    request.mobileAuth = await this.identity.authenticate(bearerToken(request.header('authorization')))
    return true
  }
}
