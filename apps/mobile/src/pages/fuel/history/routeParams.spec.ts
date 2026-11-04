import { describe, expect, it } from 'vitest'
import { decodeQueryParam } from './routeParams'

describe('decodeQueryParam', () => {
  it('解码 encodeURIComponent 后的油号', () => {
    expect(decodeQueryParam('92%23%20%E6%B1%BD%E6%B2%B9')).toBe('92# 汽油')
  })

  it('已解码的油号保持原样（基础库自动解码时不会二次解码出错）', () => {
    expect(decodeQueryParam('92# 汽油')).toBe('92# 汽油')
  })

  it('非法转义与非字符串安全回退', () => {
    expect(decodeQueryParam('92%')).toBe('92%')
    expect(decodeQueryParam(undefined)).toBe('')
  })
})
