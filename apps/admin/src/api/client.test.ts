import { describe, expect, it } from 'vitest'
import { unwrapEnvelope } from './client'

describe('unwrapEnvelope', () => {
  it('GIVEN 成功响应 WHEN 解包 THEN 返回 data', () => {
    const data = unwrapEnvelope({ code: 0, message: 'ok', data: { id: 'route-1' }, traceId: 'trace-1' })

    expect(data).toEqual({ id: 'route-1' })
  })

  it('GIVEN 业务失败响应 WHEN 解包 THEN 抛出安全消息', () => {
    expect(() => unwrapEnvelope({ code: 40301, message: '无权执行此操作', data: null, traceId: 'trace-2' }))
      .toThrow('无权执行此操作')
  })
})
