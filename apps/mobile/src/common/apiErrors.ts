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
  AVATAR_FILE_REQUIRED: '请选择头像图片',
  AVATAR_TYPE_UNSUPPORTED: '头像仅支持 JPG / PNG / WebP 格式',
  AVATAR_FILE_TOO_LARGE: '头像图片不能超过 5MB',
  HTTP_413: '图片体积超出服务器限制，请压缩后重试',
  COMMON_NETWORK_ERROR: '网络连接失败，请检查网络后重试',
}

/**
 * 网络层失败（未拿到 HTTP 响应）时，微信的 `errMsg` 往往已经写明原因：
 * 域名白名单、超时、临时文件读取失败等。这里按 errMsg 细化文案，
 * 避免一律显示「网络连接失败」让排查失去方向。
 */
const networkHints: Array<[RegExp, string]> = [
  [/url not in domain list/iu, '域名未在微信后台配置（uploadFile / request 合法域名），请先完成配置'],
  [/timeout/iu, '网络超时，请稍后重试'],
  [/file not found|no such file|readstream|permission denied/iu, '文件读取失败，请重新选择头像'],
]

export function userFacingError(error: unknown, fallback = '操作失败，请稍后重试') {
  if (!(error instanceof ApiError)) return fallback
  if (error.code === 'COMMON_NETWORK_ERROR') {
    const hint = networkHints.find(([pattern]) => pattern.test(error.message))
    if (hint) return hint[1]
  }
  if (messages[error.code]) return messages[error.code]
  return error.statusCode >= 500 ? '服务暂时不可用，请稍后重试' : fallback
}
