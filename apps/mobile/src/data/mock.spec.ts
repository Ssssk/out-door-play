import { describe, expect, it } from 'vitest'
import { driveRoutes, fishingSpots } from './mock'

describe('local fallback data', () => {
  it('keeps stable unique route ids', () => {
    const ids = [...driveRoutes, ...fishingSpots].map((item) => item.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
