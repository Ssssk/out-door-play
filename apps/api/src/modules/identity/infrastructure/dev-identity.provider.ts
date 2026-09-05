import { Injectable, NotFoundException } from '@nestjs/common'
import type { ExternalIdentity } from '../domain/identity.types'

@Injectable()
export class DevIdentityProvider {
  exchange(handle: string): ExternalIdentity {
    if (process.env.NODE_ENV === 'production' || process.env.DEV_IDENTITY_ENABLED !== 'true') {
      throw new NotFoundException({ code: 'AUTH_DEV_LOGIN_DISABLED', message: '本地开发登录不可用' })
    }
    return { provider: 'dev', subject: handle }
  }
}
