import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { RouteCard } from '@/types/domain'

const lifecycle = vi.hoisted(() => ({
  load: undefined as undefined | (() => Promise<void>),
  pullDown: undefined as undefined | (() => Promise<void>),
  unload: undefined as undefined | (() => void),
}))
const api = vi.hoisted(() => ({ cities: vi.fn(), routes: vi.fn() }))

vi.mock('@dcloudio/uni-app', () => ({
  onLoad: (callback: () => Promise<void>) => { lifecycle.load = callback },
  onPullDownRefresh: (callback: () => Promise<void>) => { lifecycle.pullDown = callback },
  onUnload: (callback: () => void) => { lifecycle.unload = callback },
}))
vi.mock('@/api/outdoor', () => ({ outdoorApi: api }))
vi.mock('@/common/launchLock', () => ({ launchLock: { waitReady: () => Promise.resolve(true) } }))

import { clearListCache } from '@/common/listCache'
import { useDiscovery } from './useDiscovery'
import { useAppStore } from '@/stores/app'

function card(id: string, scene: 'drive' | 'fish'): RouteCard {
  return {
    id,
    scene,
    title: id,
    rank: 1,
    rankTag: '热门榜',
    distanceKm: 1,
    lengthKm: 2,
    elevationM: scene === 'drive' ? 3 : null,
    depthM: scene === 'fish' ? 4 : null,
    difficulty: '入门级',
    coverImageUrl: '/cover.jpg',
  }
}

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((complete) => { resolve = complete })
  return { promise, resolve }
}

/** 等待后台预取批次落地（预取是 void 调用，只在微任务队列中推进） */
function flush() {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

describe('useDiscovery', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    clearListCache()
    api.cities.mockReset().mockResolvedValue([{ code: '420100', name: '武汉' }])
    api.routes.mockReset()
    lifecycle.load = undefined
    lifecycle.pullDown = undefined
    lifecycle.unload = undefined
    vi.stubGlobal('uni', { stopPullDownRefresh: vi.fn(), showToast: vi.fn() })
  })

  it('keeps the newest selection when earlier and later requests resolve out of order', async () => {
    api.routes.mockResolvedValueOnce([card('initial-drive', 'drive')])
    const state = useDiscovery({ prefetch: false })
    await lifecycle.load?.()

    const earlier = deferred<RouteCard[]>()
    const latest = deferred<RouteCard[]>()
    api.routes.mockReturnValueOnce(earlier.promise).mockReturnValueOnce(latest.promise)

    const earlierLoad = state.changeScene('fish')
    useAppStore().selectCity({ code: '110000', name: '北京' })
    const latestLoad = state.loadRoutes()
    latest.resolve([card('latest-fish', 'fish')])
    await latestLoad
    earlier.resolve([card('stale-fish', 'fish')])
    await earlierLoad

    expect(state.routes.value.map((item) => item.id)).toEqual(['latest-fish'])
    expect(state.status.value).toBe('ready')
    expect(state.loading.value).toBe(false)
  })

  it('uses an explicit local city fallback when the city service fails', async () => {
    api.cities.mockRejectedValueOnce(new Error('offline'))
    api.routes.mockResolvedValueOnce([card('fallback-drive', 'drive')])
    const state = useDiscovery({ prefetch: false })
    await lifecycle.load?.()

    expect(state.citiesFallback.value).toBe(true)
    expect(state.availableCities.value.length).toBeGreaterThan(0)
  })

  it('shares one in-flight request for the same city and scene', async () => {
    api.routes.mockResolvedValueOnce([card('initial-drive', 'drive')])
    const state = useDiscovery({ prefetch: false })
    await lifecycle.load?.()

    // 换到未缓存的城市，验证并发去重（缓存命中时根本不会发请求）
    useAppStore().selectCity({ code: '110000', name: '北京' })
    const result = deferred<RouteCard[]>()
    api.routes.mockReturnValueOnce(result.promise)

    const first = state.loadRoutes()
    const second = state.loadRoutes()
    expect(api.routes).toHaveBeenCalledTimes(2)
    result.resolve([card('refreshed-drive', 'drive')])
    await Promise.all([first, second])

    expect(state.routes.value.map((item) => item.id)).toEqual(['refreshed-drive'])
  })

  it('renders cached routes immediately when the page is entered again', async () => {
    api.routes.mockResolvedValueOnce([card('initial-drive', 'drive')])
    useDiscovery({ prefetch: false })
    await lifecycle.load?.()
    expect(api.routes).toHaveBeenCalledTimes(1)

    // 二次进入（新实例，进程内缓存仍在）：不再请求，也不闪转圈
    const second = useDiscovery({ prefetch: false })
    await lifecycle.load?.()

    expect(api.routes).toHaveBeenCalledTimes(1)
    expect(second.routes.value.map((item) => item.id)).toEqual(['initial-drive'])
    expect(second.loading.value).toBe(false)
  })

  it('bypasses the cache when the user pulls down to refresh', async () => {
    api.routes.mockResolvedValue([card('initial-drive', 'drive')])
    useDiscovery({ prefetch: false })
    await lifecycle.load?.()
    expect(api.routes).toHaveBeenCalledTimes(1)

    lifecycle.pullDown?.()
    await flush()

    expect(api.routes).toHaveBeenCalledTimes(2)
  })

  it('prefetches the other scene and the other cities after the first screen', async () => {
    api.cities.mockResolvedValue([{ code: '420100', name: '武汉' }, { code: '110000', name: '北京' }])
    api.routes.mockResolvedValue([card('initial-drive', 'drive')])
    const state = useDiscovery()
    await lifecycle.load?.()
    await flush()

    const requested = api.routes.mock.calls.map(([city, scene]) => `${city}:${scene}`)
    expect(requested).toContain('420100:drive')
    // 本城市另一个场景 + 其他城市都被预取进缓存，切过去时无需等待
    expect(requested).toContain('420100:fish')
    expect(requested).toContain('110000:drive')
    expect(state.routes.value.map((item) => item.id)).toEqual(['initial-drive'])
  })
})
