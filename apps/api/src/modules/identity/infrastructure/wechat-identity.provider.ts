import { HttpException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common'
import type { ExternalIdentity } from '../domain/identity.types'

const WECHAT_IDENTITY_URL = 'https://api.weixin.qq.com/sns/jscode2session'
const MAX_RESPONSE_LENGTH = 8_192

interface WechatIdentityResponse {
  openid?: unknown
  session_key?: unknown
  errcode?: unknown
}

@Injectable()
export class WechatIdentityProvider {
  async exchange(code: string): Promise<ExternalIdentity> {
    const appId = process.env.WECHAT_APP_ID
    const appSecret = process.env.WECHAT_APP_SECRET
    if (!appId || !appSecret) throw this.unavailable()

    const url = new URL(WECHAT_IDENTITY_URL)
    url.searchParams.set('appid', appId)
    url.searchParams.set('secret', appSecret)
    url.searchParams.set('js_code', code)
    url.searchParams.set('grant_type', 'authorization_code')

    let response: Response
    try {
      response = await fetch(url, { method: 'GET', redirect: 'error', signal: AbortSignal.timeout(5_000) })
    } catch {
      throw this.unavailable()
    }
    if (!response.ok) throw this.unavailable()

    let text: string
    try {
      text = await response.text()
    } catch {
      throw this.unavailable()
    }
    if (text.length > MAX_RESPONSE_LENGTH) throw this.unavailable()

    let payload: WechatIdentityResponse
    try {
      payload = JSON.parse(text) as WechatIdentityResponse
    } catch {
      throw this.unavailable()
    }

    if (payload.errcode === 40029 || payload.errcode === 40163) throw this.invalidCode()
    if (payload.errcode !== undefined || typeof payload.openid !== 'string' || !payload.openid || typeof payload.session_key !== 'string') {
      throw this.unavailable()
    }
    return { provider: 'wechat', subject: payload.openid }
  }

  private invalidCode() {
    return new UnauthorizedException({ code: 'AUTH_CODE_INVALID', message: '登录凭证无效，请重新登录' })
  }

  private unavailable() {
    return new HttpException({ code: 'AUTH_PROVIDER_UNAVAILABLE', message: '微信登录服务暂时不可用' }, HttpStatus.SERVICE_UNAVAILABLE)
  }
}
