import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { clearLocationCache } from './location'
import { useUserLocation } from './userLocation'
import { useAppStore } from '@/stores/app'

describe('user location flow', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    clearLocationCache()
  })
  afterEach(() => { vi.unstubAllGlobals() })

  it('stores the point and reports ready after the host grants location', async () => {
    vi.stubGlobal('uni', {
      getLocation: vi.fn((options: { success: (point: { latitude: number; longitude: number }) => void }) =>
        options.success({ latitude: 30.51, longitude: 114.39 }),
      ),
    })

    const flow = useUserLocation()
    await expect(flow.ensureLocation()).resolves.toEqual({ latitude: 30.51, longitude: 114.39 })
    expect(flow.status.value).toBe('ready')
    expect(useAppStore().location).toEqual({ latitude: 30.51, longitude: 114.39 })
  })

  it('clears a stale point when the user denies location', async () => {
    useAppStore().setLocation({ latitude: 30.51, longitude: 114.39 })
    vi.stubGlobal('uni', { getLocation: vi.fn((options: { fail: () => void }) => options.fail()) })

    const flow = useUserLocation()
    await expect(flow.ensureLocation()).resolves.toBeNull()
    expect(flow.status.value).toBe('denied')
    expect(useAppStore().location).toBeNull()
  })

  it('reports unsupported settings APIs without throwing', async () => {
    vi.stubGlobal('uni', {})
    await expect(useUserLocation().openLocationSettings()).resolves.toBe(false)
  })
})
