type Params = Record<string, string | number | boolean>

const tabPages = new Set(['/pages/index/index', '/pages/fuel/index', '/pages/mine/index'])
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
