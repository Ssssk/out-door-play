import { describe, expect, it } from 'vitest'
import { driveRoutes, fishingSpots, fuelStations } from './mock'

describe('local fallback data', () => {
  it('keeps stable unique route ids', () => {
    const ids = [...driveRoutes, ...fishingSpots].map((item) => item.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
  it('ships the minimum fuel station list required by PRD', () => { expect(fuelStations.length).toBeGreaterThanOrEqual(4) })
})
