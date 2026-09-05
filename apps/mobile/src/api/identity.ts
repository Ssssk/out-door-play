import { request } from '@/common/request'
import type { UserProfile } from '@/types/domain'

export interface TokenPair {
  accessToken: string
  refreshToken: string
  accessExpiresAt: string
  refreshExpiresAt: string
}

export interface SessionResult {
  tokens: TokenPair
  profile: UserProfile
}

export const identityApi = {
  loginWithWechat: (code: string) => request<SessionResult>('/auth/wechat/login', { method: 'POST', data: { code } }),
  loginWithDev: (handle: string) => request<SessionResult>('/auth/dev/login', { method: 'POST', data: { handle } }),
  refresh: (refreshToken: string) => request<SessionResult>('/auth/refresh', { method: 'POST', data: { refreshToken } }),
  logout: () => request<{ revoked: true }>('/auth/logout', { method: 'POST', auth: 'required' }),
}
