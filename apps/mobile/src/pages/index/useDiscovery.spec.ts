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

describe('useDiscovery', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    api.cities.mockReset().mockResolvedValue([{ code: '420100', name: '武汉' }])
    api.routes.mockReset()
    lifecycle.load = undefined
    lifecycle.pullDown = undefined
    lifecycle.unload = undefined
    vi.stubGlobal('uni', { stopPullDownRefresh: vi.fn(), showToast: vi.fn() })
  })

  it('keeps the newest selection when earlier and later requests resolve out of order', async () => {
    api.routes.mockResolvedValueOnce([card('initial-drive', 'drive')])
    const state = useDiscovery()
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
    const state = useDiscovery()
    await lifecycle.load?.()

    expect(state.citiesFallback.value).toBe(true)
    expect(state.availableCities.value.length).toBeGreaterThan(0)
  })

  it('orders cards by distance to the device, nearest first', async () => {
    const origin = { latitude: 30.5928, longitude: 114.3055 }
    vi.stubGlobal('uni', {
      stopPullDownRefresh: vi.fn(),
      showToast: vi.fn(),
      getLocation: ({ success }: { success: (result: { latitude: number; longitude: number }) => void }) => success(origin),
    })
    api.routes.mockResolvedValueOnce([
      { ...card('far', 'drive'), latitude: 30.9, longitude: 114.3 },
      { ...card('unknown', 'drive'), distanceKm: Number.NaN },
      { ...card('near', 'drive'), latitude: 30.5935, longitude: 114.306 },
    ])
    const state = useDiscovery()
    await lifecycle.load?.()
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(useAppStore().location).toEqual(origin)

    expect(state.routes.value.map((item) => item.id)).toEqual(['near', 'far', 'unknown'])
  })

  it('shares one in-flight request for the same city and scene', async () => {
    api.routes.mockResolvedValueOnce([card('initial-drive', 'drive')])
    const state = useDiscovery()
    await lifecycle.load?.()
    const result = deferred<RouteCard[]>()
    api.routes.mockReturnValueOnce(result.promise)

    const first = state.loadRoutes()
    const second = state.loadRoutes()
    expect(api.routes).toHaveBeenCalledTimes(2)
    result.resolve([card('refreshed-drive', 'drive')])
    await Promise.all([first, second])

    expect(state.routes.value.map((item) => item.id)).toEqual(['refreshed-drive'])
  })
})
