import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  clearLocationCache,
  distanceInKm,
  formatDistanceKm,
  getCurrentLocation,
  resolveDistanceKm,
  withRealDistance,
} from './location'

const wuhan = { latitude: 30.3596, longitude: 114.3045 }
const beijing = { latitude: 39.9042, longitude: 116.4074 }

describe('location helpers', () => {
  beforeEach(() => { clearLocationCache() })
  afterEach(() => { vi.unstubAllGlobals() })

  it('computes the great-circle distance in kilometres', () => {
    const km = distanceInKm(wuhan, beijing)

    expect(km).toBeGreaterThan(1000)
    expect(km).toBeLessThan(1100)
    expect(distanceInKm(wuhan, wuhan)).toBeCloseTo(0, 5)
  })

  it('prefers the device-located distance and falls back to the stored one', () => {
    const item = { latitude: 30.5, longitude: 114.4, distanceKm: 7.6 }

    expect(resolveDistanceKm(item, null)).toBe(7.6)

    const located = resolveDistanceKm(item, { latitude: 30.45, longitude: 114.35 })
    expect(located).toBeGreaterThan(0)
    expect(located).toBeLessThan(20)
  })

  it('falls back to the stored distance when the item has no coordinates', () => {
    expect(resolveDistanceKm({ distanceKm: 6.2 }, wuhan)).toBe(6.2)
    expect(resolveDistanceKm({}, wuhan)).toBeNull()
  })

  it('formats one decimal, `<1` for short distances and `-` when unknown', () => {
    expect(formatDistanceKm(7.63)).toBe('7.6')
    expect(formatDistanceKm(0.4)).toBe('<1')
    expect(formatDistanceKm(null)).toBe('-')
  })

  it('requests the device location once and reuses the cached result', async () => {
    const getLocation = vi.fn((options: { success: (result: { latitude: number; longitude: number }) => void }) =>
      options.success({ latitude: 30.51, longitude: 114.39 }),
    )
    vi.stubGlobal('uni', { getLocation })

    const first = await getCurrentLocation()
    const second = await getCurrentLocation()

    expect(first).toEqual({ latitude: 30.51, longitude: 114.39 })
    expect(second).toEqual(first)
    expect(getLocation).toHaveBeenCalledTimes(1)
  })

  it('resolves to null when location is denied or unavailable', async () => {
    vi.stubGlobal('uni', { getLocation: vi.fn((options: { fail: () => void }) => options.fail()) })
    expect(await getCurrentLocation()).toBeNull()

    clearLocationCache()
    vi.stubGlobal('uni', {})
    expect(await getCurrentLocation()).toBeNull()
  })

  it('overrides the distance with the located value only when coordinates exist', () => {
    const item = { latitude: 30.5, longitude: 114.4, distanceKm: 7.6 }

    expect(withRealDistance(item, null)).toBe(item)

    const located = withRealDistance(item, { latitude: 30.45, longitude: 114.35 })
    expect(located.distanceKm).not.toBe(7.6)
    expect(located).not.toBe(item)
  })
})
