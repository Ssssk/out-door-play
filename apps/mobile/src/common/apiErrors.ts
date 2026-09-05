import { ApiError } from '@/common/request'

const messages: Record<string, string> = {
  AUTH_REQUIRED: '请先登录',
  AUTH_CODE_INVALID: '微信登录凭证已失效，请重试',
  AUTH_PROVIDER_UNAVAILABLE: '登录服务暂不可用，请稍后重试',
  AUTH_DEV_LOGIN_DISABLED: '当前环境未开启开发登录',
  AUTH_SESSION_INVALID: '登录状态已失效，请重新登录',
  AUTH_REFRESH_INVALID: '登录状态已失效，请重新登录',
  AUTH_RATE_LIMITED: '操作过于频繁，请稍后重试',
  COMMON_VALIDATION_FAILED: '提交内容格式不正确',
  USER_PROFILE_INVALID: '昵称或头像格式不正确',
  FAVORITE_DISCOVERY_NOT_FOUND: '该内容不存在或暂不可收藏',
  COMMON_NETWORK_ERROR: '网络连接失败，请检查网络后重试',
}

export function userFacingError(error: unknown, fallback = '操作失败，请稍后重试') {
  if (!(error instanceof ApiError)) return fallback
  if (messages[error.code]) return messages[error.code]
  return error.statusCode >= 500 ? '服务暂时不可用，请稍后重试' : fallback
}
