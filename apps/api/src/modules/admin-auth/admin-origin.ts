export function allowedAdminOrigins(): Set<string> {
  // 生产环境以 ADMIN_ALLOWED_ORIGINS 为准，并兼容 CORS_ORIGINS：
  // 若管理员误删/漏配 ADMIN_ALLOWED_ORIGINS，仍能沿用 CORS 白名单，避免后台被彻底锁死。
  const configured = process.env.NODE_ENV === 'production'
    ? [process.env.ADMIN_ALLOWED_ORIGINS, process.env.CORS_ORIGINS].filter(Boolean).join(',')
    : [process.env.ADMIN_ALLOWED_ORIGINS, process.env.CORS_ORIGINS, 'http://localhost:5174,http://127.0.0.1:5174'].filter(Boolean).join(',')
  return new Set(configured.split(',').map((origin) => origin.trim()).filter(Boolean))
}

/** 归一化出主机名（忽略协议与端口，小写），非 URL 或非法值返回 undefined。 */
function hostnameOf(value: string | undefined): string | undefined {
  if (!value) return undefined
  try { return new URL(value).hostname.toLowerCase() } catch { return undefined }
}

/**
 * 校验请求 Origin 是否可信：
 * 1) 显式白名单（ADMIN_ALLOWED_ORIGINS / CORS_ORIGINS）命中即放行；
 * 2) 同源兜底：管理后台与 API 同域部署（nginx 同 server_name 提供 /admin/ 与 /v1/），
 *    若 Origin 主机与本次请求 Host 一致，则视为同源放行——防止白名单漏配导致后台彻底无法登录。
 *
 * 安全性：跨站攻击页面发出的请求，其 Origin 主机必然不等于我方 Host，仍会被拒绝；
 * 用户名下的 cookie 为 SameSite=Lax，二者叠加足以拦截 CSRF。
 */
export function isAdminOriginAllowed(origin: string | undefined, requestHost?: string): boolean {
  if (!origin) return false
  if (allowedAdminOrigins().has(origin)) return true
  const originHost = hostnameOf(origin)
  const expectedHost = requestHost ? hostnameOf(`http://${requestHost}`) : undefined
  return Boolean(originHost && expectedHost && originHost === expectedHost)
}
