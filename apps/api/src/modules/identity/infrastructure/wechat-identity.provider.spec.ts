import { HttpException, UnauthorizedException } from '@nestjs/common'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { WechatIdentityProvider } from './wechat-identity.provider'

describe('WechatIdentityProvider', () => {
  beforeEach(() => {
    process.env.WECHAT_APP_ID = 'test-app-id'
    process.env.WECHAT_APP_SECRET = 'test-app-secret'
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    delete process.env.WECHAT_APP_ID
    delete process.env.WECHAT_APP_SECRET
  })

  it('GIVEN 合法微信响应 WHEN exchange THEN 只返回 provider subject', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ openid: 'openid-1', session_key: 'never-return-this' }), { status: 200 })))
    await expect(new WechatIdentityProvider().exchange('one-time-code')).resolves.toEqual({ provider: 'wechat', subject: 'openid-1' })
  })

  it('GIVEN 无效 code WHEN exchange THEN 返回统一 401', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ errcode: 40029, errmsg: 'invalid code' }), { status: 200 })))
    await expect(new WechatIdentityProvider().exchange('bad-code')).rejects.toBeInstanceOf(UnauthorizedException)
  })

  it('GIVEN 平台畸形响应 WHEN exchange THEN 返回安全 503', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{broken', { status: 200 })))
    await expect(new WechatIdentityProvider().exchange('code')).rejects.toBeInstanceOf(HttpException)
  })
})
