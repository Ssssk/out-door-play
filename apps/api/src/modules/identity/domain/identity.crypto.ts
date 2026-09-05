import { createHash, createHmac, randomBytes } from 'node:crypto'

export const MOBILE_ACCESS_TTL_MS = 15 * 60 * 1_000
export const MOBILE_REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1_000

export function randomMobileToken(): string {
  return randomBytes(32).toString('base64url')
}

export function tokenHash(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

export function providerSubjectHash(provider: 'wechat' | 'dev', subject: string, key: string): string {
  if (key.length < 32) throw new Error('IDENTITY_SUBJECT_HMAC_KEY must be at least 32 characters')
  return createHmac('sha256', key).update(`${provider}:${subject}`).digest('hex')
}

export function issueMobileTokenPair(now = new Date()) {
  const accessToken = randomMobileToken()
  const refreshToken = randomMobileToken()
  return {
    accessToken,
    refreshToken,
    accessTokenHash: tokenHash(accessToken),
    refreshTokenHash: tokenHash(refreshToken),
    accessExpiresAt: new Date(now.getTime() + MOBILE_ACCESS_TTL_MS),
    refreshExpiresAt: new Date(now.getTime() + MOBILE_REFRESH_TTL_MS),
  }
}
