type Params = Record<string, string | number | boolean>

const tabPages = new Set(['/pages/index/index', '/pages/fuel/index', '/pages/mine/index'])
const returnablePages = new Set([
  '/pages/index/index', '/pages/fuel/index', '/pages/mine/index', '/pages/route-detail/index',
  '/pages/fishing-detail/index', '/pages/mine-edit/index', '/pages/favorites/index', '/pages/about/index',
])
let lastNavigationAt = 0

function withQuery(url: string, params?: Params) {
  if (!params) return url
  const query = Object.entries(params).map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`).join('&')
  return query ? `${url}?${query}` : url
}

export async function navigate(url: string, params?: Params) {
  const now = Date.now()
  if (now - lastNavigationAt < 500) return
  lastNavigationAt = now
  if (tabPages.has(url)) {
    return new Promise<void>((resolve, reject) => uni.switchTab({ url, success: () => resolve(), fail: reject }))
  }
  const target = withQuery(url, params)
  const pages = getCurrentPages()
  return new Promise<void>((resolve, reject) => {
    const method = pages.length >= 9 ? uni.redirectTo : uni.navigateTo
    method({ url: target, success: () => resolve(), fail: reject })
  })
}

export function goBack(fallback = '/pages/index/index') {
  if (getCurrentPages().length > 1) uni.navigateBack()
  else void navigate(fallback)
}

export function safeReturnTo(value: unknown, fallback = '/pages/mine/index') {
  const raw = typeof value === 'string' ? value : ''
  let decoded = raw
  try { decoded = decodeURIComponent(raw) } catch { /* 使用原值执行白名单校验 */ }
  const queryAt = decoded.indexOf('?')
  const pathname = queryAt >= 0 ? decoded.slice(0, queryAt) : decoded
  const query = queryAt >= 0 ? decoded.slice(queryAt + 1) : ''
  if (!returnablePages.has(pathname) || query.includes('#') || query.includes('?')) return fallback
  return decoded
}

export function redirectAfterLogin(value: unknown) {
  const target = safeReturnTo(value)
  const pathname = target.split('?')[0]
  if (tabPages.has(pathname)) {
    return new Promise<void>((resolve, reject) => uni.switchTab({ url: pathname, success: () => resolve(), fail: reject }))
  }
  return new Promise<void>((resolve, reject) => uni.redirectTo({ url: target, success: () => resolve(), fail: reject }))
}
