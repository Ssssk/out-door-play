import { describe, expect, it } from 'vitest'
import { userFacingError } from './apiErrors'
import { ApiError } from './request'

describe('userFacingError', () => {
  it('maps business error codes to fixed copy', () => {
    expect(userFacingError(new ApiError('AUTH_SESSION_INVALID', 'boom', 401))).toBe('登录状态已失效，请重新登录')
    expect(userFacingError(new ApiError('AVATAR_FILE_TOO_LARGE', 'boom', 413))).toBe('头像图片不能超过 5MB')
  })

  it('turns a domain whitelist failure into an actionable hint', () => {
    const error = new ApiError('COMMON_NETWORK_ERROR', 'uploadFile:fail url not in domain list')

    expect(userFacingError(error)).toBe('域名未在微信后台配置（uploadFile / request 合法域名），请先完成配置')
  })

  it('distinguishes timeouts and unreadable temp files from a plain network error', () => {
    expect(userFacingError(new ApiError('COMMON_NETWORK_ERROR', 'uploadFile:fail timeout'))).toBe('网络超时，请稍后重试')
    expect(userFacingError(new ApiError('COMMON_NETWORK_ERROR', 'uploadFile:fail file not found'))).toBe('文件读取失败，请重新选择头像')
  })

  it('falls back to the generic copy for unexplained network failures', () => {
    const error = new ApiError('COMMON_NETWORK_ERROR', 'uploadFile:fail unknown reason')

    expect(userFacingError(error)).toBe('网络连接失败，请检查网络后重试')
  })

  it('keeps the caller fallback for unknown codes and server errors', () => {
    expect(userFacingError(new ApiError('SOMETHING_NEW', 'boom', 400), '保存失败')).toBe('保存失败')
    expect(userFacingError(new ApiError('SOMETHING_NEW', 'boom', 500), '保存失败')).toBe('服务暂时不可用，请稍后重试')
    expect(userFacingError(new Error('boom'), '保存失败')).toBe('保存失败')
  })
})
