/**
 * 列表数据进程内缓存（城市列表、路线/钓点列表）。
 *
 * 小程序页面进出很频繁，而这些列表短时间内不会变化；缓存能让二次进入、
 * 切城市/切场景直接命中渲染，避免出现转圈和空白。
 * 只有用户主动下拉刷新时才绕过缓存取最新数据（见 useDiscovery 的 force）。
 */

interface CacheEntry {
  value: unknown
  savedAt: number
}

/** 列表类数据：5 分钟内视为新鲜 */
export const LIST_TTL_MS = 5 * 60 * 1000
/** 城市列表几乎不变，缓存 30 分钟 */
export const CITIES_TTL_MS = 30 * 60 * 1000

const store = new Map<string, CacheEntry>()

export function readListCache<T>(key: string, ttlMs = LIST_TTL_MS): T | null {
  const entry = store.get(key)
  if (!entry) return null
  if (Date.now() - entry.savedAt >= ttlMs) {
    store.delete(key)
    return null
  }
  return entry.value as T
}

export function writeListCache<T>(key: string, value: T): void {
  store.set(key, { value, savedAt: Date.now() })
}

export function hasListCache(key: string, ttlMs = LIST_TTL_MS): boolean {
  return readListCache(key, ttlMs) !== null
}

/** 仅供测试与「必须拿最新数据」的场景使用 */
export function clearListCache(): void {
  store.clear()
}
