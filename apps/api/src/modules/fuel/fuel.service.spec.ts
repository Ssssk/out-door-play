import { describe, expect, it } from 'vitest'
import { FuelService } from './fuel.service'

// 库内按 distanceKm 升序返回：a 排在前面但实际离查询点更远
const rows = [
  { id: 'a', distanceKm: 1, latitude: 30.6, longitude: 114.6 },
  { id: 'b', distanceKm: 9.9, latitude: 30.41, longitude: 114.31 },
]

function createService() {
  return new FuelService({ fuelStation: { findMany: async () => rows } } as never)
}

describe('FuelService.stations', () => {
  it('keeps the stored distances when no coordinates are given', async () => {
    const stations = await createService().stations(null)

    expect(stations.map((station) => station.id)).toEqual(['a', 'b'])
    expect(stations[0].distanceKm).toBe(1)
  })

  it('recomputes distances from the device location and sorts by them', async () => {
    const stations = await createService().stations({ latitude: 30.4, longitude: 114.3 })

    expect(stations.map((station) => station.id)).toEqual(['b', 'a'])
    expect(stations[0].distanceKm).toBeLessThan(stations[1].distanceKm)
    // 距离口径保留 1 位小数
    expect(stations[0].distanceKm).toBe(Math.round(stations[0].distanceKm * 10) / 10)
    expect(stations[0].latitude).toBe(30.41)
  })
})
