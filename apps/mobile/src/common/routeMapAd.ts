/**
 * 「查看完整路线」插屏广告：每日第 4 次点击起展示（当日计数存本地存储，次日自动归零）。
 *
 * 原则：广告只是变现点缀，绝不能挡住功能——展示失败、无填充、非微信端一律直接放行。
 */

const AD_UNIT_ID = 'adunit-2091321a7dbfd95e'
const DAILY_COUNT_KEY = 'route-map-open-count'
const DAILY_THRESHOLD = 4

interface DailyCount {
  date: string
  count: number
}

interface WxInterstitialAd {
  onLoad(callback: () => void): void
  onError(callback: (error: unknown) => void): void
  onClose(callback: () => void): void
  show(): Promise<void>
}

interface WxLike {
  createInterstitialAd?: (options: { adUnitId: string }) => WxInterstitialAd
}

function todayStamp(): string {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

/** 记录本次点击并返回：今天是否已达到展示阈值（每日第 4 次起） */
export function reachDailyAdThreshold(): boolean {
  const today = todayStamp()
  const stored = uni.getStorageSync(DAILY_COUNT_KEY) as DailyCount | '' | null
  const previous = stored && typeof stored === 'object' && stored.date === today ? Number(stored.count) || 0 : 0
  const count = previous + 1
  uni.setStorageSync(DAILY_COUNT_KEY, { date: today, count })
  return count >= DAILY_THRESHOLD
}

/**
 * 展示插屏广告，用户关闭或展示失败后回调 after（保证只回调一次）。
 * 非微信端 / 低版本基础库没有广告能力时直接放行。
 */
export function showInterstitialThen(after: () => void): void {
  // #ifdef MP-WEIXIN
  const wxApi = (globalThis as unknown as { wx?: WxLike }).wx
  if (!wxApi || typeof wxApi.createInterstitialAd !== 'function') {
    after()
    return
  }
  let finished = false
  const finish = () => {
    if (finished) return
    finished = true
    after()
  }
  try {
    const ad = wxApi.createInterstitialAd({ adUnitId: AD_UNIT_ID })
    ad.onLoad(() => {})
    ad.onError(() => finish())
    ad.onClose(() => finish())
    ad.show().catch(() => finish())
  } catch {
    finish()
  }
  return
  // #endif
  // #ifndef MP-WEIXIN
  after()
  // #endif
}
