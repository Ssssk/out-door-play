import type { Request } from 'express'

export type MobileIdentityProvider = 'wechat' | 'dev'

export interface ExternalIdentity {
  provider: MobileIdentityProvider
  subject: string
}

export interface MobilePrincipal {
  userId: string
  sessionId: string
}

export interface MobileRequestContext {
  mobileAuth?: MobilePrincipal
}

export type MobileAuthenticatedRequest = Request & { mobileAuth: MobilePrincipal }
