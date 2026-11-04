export interface NavigationTarget { latitude: number; longitude: number; name: string; address?: string }
export interface NavigationWaypoint { latitude: number; longitude: number; name: string }
export interface NavigationOptions { waypoints?: NavigationWaypoint[] }

interface PlusRuntimeLike {
  openURL?: (url: string, errorCB?: (error: unknown) => void) => void
}
interface PlusGlobalLike { plus?: { runtime?: PlusRuntimeLike } }

/** 高德 URI 的坐标段：经度,纬度,名称（GCJ-02）。名称里的逗号/分号会破坏分隔语义，需剔除 */
function coordinatePoint(point: { latitude: number; longitude: number }, name: string) {
  return `${point.longitude},${point.latitude},${name.replace(/[,;]/g, '')}`
}

/**
 * 构建「驾车导航 + 途经点」高德 URI：to 是最终目的地，waypoints 按传入顺序途经。
 * uni.openLocation 只能吐单目的地（不支持途经点），App/H5 端改走地图 URI 才能一次导航到终点。
 */
export function buildAmapNavigationUrl(target: NavigationTarget, options: NavigationOptions = {}) {
  const waypoints = options.waypoints ?? []
  const params = [
    `to=${encodeURIComponent(coordinatePoint(target, target.name))}`,
    'mode=car',
    'policy=1',
    'callnative=1',
    'src=chumenliuliu',
  ]
  if (waypoints.length) {
    const via = waypoints.map((point) => coordinatePoint(point, point.name)).join(';')
    params.push(`waypoints=${encodeURIComponent(via)}`)
  }
  return `https://uri.amap.com/navigation?${params.join('&')}`
}

/** 系统地图单点导航（uni.openLocation）：全端可用，但只能到单目的地 */
function openSystemLocation(target: NavigationTarget) {
  return new Promise<void>((resolve, reject) => {
    uni.openLocation({
      latitude: target.latitude, longitude: target.longitude, name: target.name,
      address: target.address || target.name, scale: 16, success: () => resolve(), fail: reject,
    })
  })
}

/** App 端 plus.runtime.openURL / H5 端 window.open 打开地图 URI */
function externalOpener(): ((url: string) => Promise<void>) | null {
  const runtime = (globalThis as unknown as PlusGlobalLike).plus?.runtime
  if (typeof runtime?.openURL === 'function') {
    const openURL = runtime.openURL
    return (url) =>
      new Promise((resolve, reject) => {
        openURL(url, (error?: unknown) => {
          reject(error instanceof Error ? error : new Error(String(error ?? '打开外部地图失败')))
        })
        // plus.runtime.openURL 成功时不回调错误，短暂延时后视为已拉起
        setTimeout(resolve, 800)
      })
  }
  const browserWindow = typeof window === 'undefined' ? undefined : window
  if (typeof browserWindow?.open === 'function') {
    const openWindow = browserWindow.open.bind(browserWindow) as (url: string, target: string) => unknown
    return (url) => {
      const win = openWindow(url, '_blank')
      return win ? Promise.resolve() : Promise.reject(new Error('浏览器阻止了新窗口，请允许后重试'))
    }
  }
  return null
}

/**
 * 唤起地图导航到目标点。
 * - App / H5：构造带沿途点的高德 URI，一次导航「当前位置 → 途经点 → 终点」
 * - 小程序：uni.openLocation 不支持途经点，退化为直接导航到终点（避免停在途经点）
 * 构造或拉起失败时一律兜底系统地图单点导航，保证「最少能到终点」而不是弹框无反应。
 */
export function openNavigation(target: NavigationTarget, options: NavigationOptions = {}) {
  const waypoints = options.waypoints ?? []
  const openExternal = externalOpener()
  if (!openExternal) return openSystemLocation(target)
  return openExternal(buildAmapNavigationUrl(target, { waypoints })).catch(() => openSystemLocation(target))
}
